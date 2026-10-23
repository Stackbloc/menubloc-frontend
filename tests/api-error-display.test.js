/**
 * API error display helper contract (error codes Phase 1, 2026-10-23).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLIENT_ERROR_CODES,
  apiErrorFromResponse,
  classifyClientError,
  describeApiError,
  formatApiErrorForDisplay,
  serverErrorReference,
  shortRef,
} from "../src/lib/apiErrorDisplay.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

function fakeResponse(status, body, headers = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    status,
    ok: status < 400,
    headers: { get: (name) => headers[name.toLowerCase()] || null },
    text: async () => text,
  };
}

test("fetch failure wording from Chrome, Safari and Firefox maps to CLIENT_FETCH_FAILED", () => {
  for (const message of ["Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource."]) {
    assert.equal(classifyClientError(new TypeError(message), { isProductionBuild: false }), "CLIENT_FETCH_FAILED", message);
  }
});

test("abort, timeout and unparseable JSON have their own client codes", () => {
  const abort = Object.assign(new Error("The user aborted a request."), { name: "AbortError" });
  const timeout = Object.assign(new Error("signal timed out"), { name: "TimeoutError" });
  assert.equal(classifyClientError(abort), "CLIENT_REQUEST_ABORTED");
  assert.equal(classifyClientError(timeout), "CLIENT_TIMEOUT");
  assert.equal(classifyClientError(new SyntaxError("Unexpected token < in JSON at position 0")), "CLIENT_UNPARSEABLE_RESPONSE");
  assert.equal(classifyClientError(new Error("something else")), "CLIENT_UNCODED_ERROR");
});

test("production build calling a localhost API is CLIENT_API_BASE_URL_MISSING (2026-06-20 incident)", () => {
  globalThis.window = { location: { hostname: "menuply.com" } };
  try {
    const code = classifyClientError(new TypeError("Failed to fetch"), {
      apiBaseUrl: "http://localhost:3001",
      isProductionBuild: true,
    });
    assert.equal(code, "CLIENT_API_BASE_URL_MISSING");
  } finally {
    delete globalThis.window;
  }
});

test("no CORS-specific client code exists", () => {
  assert.ok(!Object.keys(CLIENT_ERROR_CODES).some((c) => /CORS/.test(c)));
});

test("server error body keeps message and carries code + request id", async () => {
  const err = await apiErrorFromResponse(
    fakeResponse(404, { ok: false, error: "Restaurant not found", code: "NOT_FOUND", request_id: "1a2b3c4d-5e6f-7a8b-9c0d-112233445566" })
  );
  assert.equal(err.message, "Restaurant not found");
  assert.equal(err.status, 404);
  assert.equal(err.code, "NOT_FOUND");
  assert.equal(formatApiErrorForDisplay(err), "Restaurant not found (NOT_FOUND · ref 1a2b3c4d)");
});

test("uncoded server error falls back to CLIENT_UNCODED_ERROR and header request id", async () => {
  const err = await apiErrorFromResponse(
    fakeResponse(409, { error: "Order not found." }, { "x-request-id": "abcdef12-0000" })
  );
  assert.equal(err.code, "CLIENT_UNCODED_ERROR");
  assert.equal(describeApiError(err).text, "Order not found. (CLIENT_UNCODED_ERROR · ref abcdef12)");
});

test("HTML 502/503/504 from the edge are GATEWAY_* codes; other HTML is unparseable", async () => {
  assert.equal((await apiErrorFromResponse(fakeResponse(502, "<html>Bad Gateway</html>"))).code, "GATEWAY_BAD_GATEWAY");
  assert.equal((await apiErrorFromResponse(fakeResponse(503, "<html>Unavailable</html>"))).code, "GATEWAY_UNAVAILABLE");
  assert.equal((await apiErrorFromResponse(fakeResponse(504, ""))).code, "GATEWAY_TIMEOUT");
  assert.equal((await apiErrorFromResponse(fakeResponse(500, "<html>oops</html>"))).code, "CLIENT_UNPARSEABLE_RESPONSE");
  // An app 503 with a JSON body keeps the app's code.
  assert.equal((await apiErrorFromResponse(fakeResponse(503, { ok: false, error: "x", code: "SERVICE_UNAVAILABLE" }))).code, "SERVICE_UNAVAILABLE");
});

test("thrown fetch error displays friendly client copy without a ref", () => {
  const text = formatApiErrorForDisplay(new TypeError("Failed to fetch"), { isProductionBuild: false });
  assert.equal(text, "Could not reach Menuply. Check your connection and try again. (CLIENT_FETCH_FAILED)");
});

test("existing client error shapes (err.payload from operatorApi/api.js) are understood", () => {
  const err = Object.assign(new Error("Invalid email or password"), {
    status: 401,
    payload: { ok: false, error: "Invalid email or password", code: "AUTH_INVALID_CREDENTIALS", request_id: "deadbeef-1" },
  });
  assert.equal(formatApiErrorForDisplay(err), "Invalid email or password (AUTH_INVALID_CREDENTIALS · ref deadbeef)");
  assert.equal(serverErrorReference(err), "AUTH_INVALID_CREDENTIALS · ref deadbeef");
});

test("serverErrorReference is empty for render errors and client-only codes", () => {
  assert.equal(serverErrorReference(new TypeError("Cannot read properties of undefined")), "");
  assert.equal(serverErrorReference(Object.assign(new Error("x"), { code: "UPLOAD_CLIENT_TIMEOUT" })), "");
});

test("shortRef is the first 8 safe characters", () => {
  assert.equal(shortRef("1a2b3c4d-5e6f"), "1a2b3c4d");
  assert.equal(shortRef(""), "");
});

test("ErrorBoundary shows a reference line only via serverErrorReference", () => {
  const src = read("src/components/ErrorBoundary.jsx");
  assert.match(src, /import \{ serverErrorReference \} from "\.\.\/lib\/apiErrorDisplay\.js";/);
  assert.match(src, /reference: serverErrorReference\(error\)/);
  assert.match(src, /Something went wrong loading this page\./);
});

test("helper is not wired into protected files", () => {
  for (const rel of [
    "src/lib/api.js",
    "src/pages/operator/OperatorLogin.jsx",
    "src/pages/FoodInterestsPage.jsx",
    "src/lib/waiterApi.js",
    "src/lib/multipartUpload.js",
    "src/lib/consumerApi.js",
    "src/lib/ownerApi.js",
  ]) {
    assert.doesNotMatch(read(rel), /apiErrorDisplay/, rel);
  }
});

test("Owner → Errors page is routed, in the Platform nav, and uses the owner errors API", () => {
  const app = read("src/App.jsx");
  assert.match(app, /<Route path="\/owner\/errors" element=\{crmHost \? <HostRouteRedirect to="\/crm" \/> : <OwnerRoute><OwnerErrors \/><\/OwnerRoute>\} \/>/);
  assert.match(read("src/pages/owner/OwnerLayout.jsx"), /\{ to: "\/owner\/errors", label: "Errors" \}/);
  const page = read("src/pages/owner/OwnerErrors.jsx");
  assert.match(page, /from "\.\.\/\.\.\/lib\/ownerErrorsApi\.js"/);
  for (const field of ["what_happened", "meaning", "likely_cause", "server_detail", "what_to_do"]) assert.match(page, new RegExp(`x\\??\\.${field}`), field);
  assert.match(read("src/lib/ownerErrorsApi.js"), /credentials: "include"/);
});
