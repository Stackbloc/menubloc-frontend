import { PRODUCTION_ENDPOINTS } from "./config.mjs";

const ERROR_MARKERS = [/FUNCTION_INVOCATION_FAILED/i, /Vercel Serverless Function has crashed/i, /An unexpected error has occurred/i];
const FRONTEND_PATHS = new Set(["/", "/search", "/browse", "/owner"]);
const DEFAULT_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 2500;

function excerpt(value) { return value.replace(/\s+/g, " ").trim().slice(0, 1000); }
function deploymentId(headers) { return headers.get("x-vercel-deployment-id") || headers.get("x-vercel-id") || ""; }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function isTransientFailure(failureType) {
  return ["network_error", "timeout", "blank_body", "missing_frontend_html", "missing_frontend_asset", "backend_json_on_frontend_route", "frontend_asset_unreachable"].includes(failureType);
}

export function classify({ endpoint, status, headers, body }) {
  if (status !== 200) return `http_${status}`;
  const marker = ERROR_MARKERS.find((pattern) => pattern.test(body));
  if (marker) return marker.source.includes("FUNCTION") ? "function_invocation_failed" : "vercel_serverless_error";
  if (!body.trim()) return "blank_body";
  const contentType = headers.get("content-type") || "";
  if (FRONTEND_PATHS.has(endpoint)) {
    if (/json/i.test(contentType) || /^\s*[\[{]/.test(body)) return "backend_json_on_frontend_route";
    if (!/<html|<!doctype/i.test(body)) return "missing_frontend_html";
    if (!/(?:src|href)=["'][^"']*\/assets\//i.test(body)) return "missing_frontend_asset";
  }
  if (endpoint === "/api/health" && !/(json|html)/i.test(contentType)) return "invalid_health_content_type";
  return "";
}

export async function probe(baseUrl, { endpoints = PRODUCTION_ENDPOINTS, timeoutMs = 15000, fetchImpl = fetch } = {}) {
  const results = [];
  for (const endpoint of endpoints) {
    let attempt = 0;
    let lastResult = null;
    while (attempt < DEFAULT_ATTEMPTS) {
      attempt += 1;
      const timestamp = new Date().toISOString();
      try {
        const response = await fetchImpl(new URL(endpoint, baseUrl), { redirect: "follow", signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": "menuply-external-watchdog/1.0" } });
        const body = await response.text();
        let failureType = classify({ endpoint, status: response.status, headers: response.headers, body });
        if (!failureType && FRONTEND_PATHS.has(endpoint)) {
          const assetPath = body.match(/(?:src|href)=["']([^"']*\/assets\/[^"']+)/i)?.[1];
          if (assetPath) {
            try {
              const assetResponse = await fetchImpl(new URL(assetPath, response.url || new URL(endpoint, baseUrl)), { redirect: "follow", signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": "menuply-external-watchdog/1.0" } });
              if (assetResponse.status !== 200) failureType = `frontend_asset_http_${assetResponse.status}`;
            } catch {
              failureType = "frontend_asset_unreachable";
            }
          }
        }
        lastResult = { timestamp, endpoint, status: response.status, response_headers: Object.fromEntries(response.headers), deployment_id: deploymentId(response.headers), vercel_id: response.headers.get("x-vercel-id") || "", body_excerpt: excerpt(body), failure_type: failureType, pass: !failureType };
      } catch (error) {
        lastResult = { timestamp, endpoint, status: 0, response_headers: {}, deployment_id: "", vercel_id: "", body_excerpt: excerpt(error.message), failure_type: error.name === "TimeoutError" ? "timeout" : "network_error", pass: false };
      }
      if (lastResult.pass || attempt >= DEFAULT_ATTEMPTS || !isTransientFailure(lastResult.failure_type)) break;
      await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
    }
    results.push(lastResult);
  }
  return results;
}
