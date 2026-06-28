import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { classify, probe } from "../scripts/deployment/probe.mjs";
import { writeIncidentFiles } from "../scripts/deployment/core/incidentRecorder.mjs";
import { executeBlueGreenRelease, promoteWithRollback } from "../scripts/deployment/release.mjs";

const headers = (contentType = "text/html") => new Headers({ "content-type": contentType, "x-vercel-id": "iad1::test" });

test("watchdog detects simulated 500 and writes incident artifact", async () => {
  const results = await probe("https://example.test", { endpoints: ["/"], fetchImpl: async () => new Response("failed", { status: 500, headers: headers() }) });
  assert.equal(results[0].failure_type, "http_500");
  const dir = mkdtempSync(join(tmpdir(), "watchdog-"));
  const files = writeIncidentFiles(results, dir);
  assert.equal(files.length, 2);
  assert.match(readFileSync(files[0], "utf8"), /"failure_type":"http_500"/);
});

test("watchdog detects FUNCTION_INVOCATION_FAILED", () => {
  assert.equal(classify({ endpoint: "/", status: 200, headers: headers(), body: "FUNCTION_INVOCATION_FAILED" }), "function_invocation_failed");
});

test("watchdog rejects backend JSON on frontend route", () => {
  assert.equal(classify({ endpoint: "/search", status: 200, headers: headers("application/json"), body: '{"ok":true}' }), "backend_json_on_frontend_route");
});

test("frontend HTML requires a Vite asset", () => {
  assert.equal(classify({ endpoint: "/browse", status: 200, headers: headers(), body: "<!doctype html><div id=root></div>" }), "missing_frontend_asset");
});

test("watchdog loads referenced frontend asset", async () => {
  const calls = [];
  const results = await probe("https://example.test", {
    endpoints: ["/"],
    fetchImpl: async (url) => {
      calls.push(String(url));
      if (String(url).includes("/assets/")) return new Response("javascript", { status: 200, headers: headers("application/javascript") });
      return new Response('<!doctype html><div id="root"></div><script src="/assets/app.js"></script>', { status: 200, headers: headers() });
    },
  });
  assert.equal(results[0].pass, true);
  assert.equal(calls.length, 2);
});

test("production failure immediately restores both aliases to BLUE", async () => {
  const aliases = [];
  await assert.rejects(() => promoteWithRollback({
    blue: { url: "https://blue.test", id: "blue" },
    green: { url: "https://green.test", id: "green" },
    aliases: ["menuply.com", "www.menuply.com"],
    aliasImpl: async (target, alias) => aliases.push([target, alias]),
    probeImpl: async () => [{ endpoint: "/", pass: false, failure_type: "http_500" }],
  }), (error) => error.releaseRecord.rollback_status === "restored_blue");
  assert.deepEqual(aliases.slice(-2), [["https://blue.test", "menuply.com"], ["https://blue.test", "www.menuply.com"]]);
});

test("GREEN failure never switches a production alias", async () => {
  const aliases = [];
  await assert.rejects(() => executeBlueGreenRelease({
    blue: { url: "https://blue.test", id: "blue" },
    green: { url: "https://green.test", id: "green" },
    aliases: ["menuply.com", "www.menuply.com"],
    aliasImpl: async (...args) => aliases.push(args),
    probeImpl: async () => [{ endpoint: "/", pass: false, failure_type: "function_invocation_failed" }],
  }), (error) => error.releaseRecord.rollback_status === "not_required_alias_unchanged");
  assert.deepEqual(aliases, []);
});

test("uncertified GREEN never switches a production alias", async () => {
  const aliases = [];
  await assert.rejects(() => executeBlueGreenRelease({
    blue: { url: "https://blue.test", id: "blue" },
    green: { url: "https://green.test", id: "green" },
    aliases: ["menuply.com", "www.menuply.com"],
    aliasImpl: async (...args) => aliases.push(args),
    probeImpl: async () => [{ endpoint: "/", pass: true }],
    certifyImpl: async () => ({ certification: "NOT CERTIFIED" }),
  }), /NOT CERTIFIED/);
  assert.deepEqual(aliases, []);
});

test("external watchdog detects deterministic outage matrix and records each failure", async () => {
  const html = '<!doctype html><div id="root"></div><script src="/assets/app.js"></script>';
  const scenarios = [
    ["http_500", async () => new Response("failed", { status: 500, headers: headers() })],
    ["function_invocation_failed", async () => new Response("FUNCTION_INVOCATION_FAILED", { status: 200, headers: headers() })],
    ["vercel_serverless_error", async () => new Response("Vercel Serverless Function has crashed", { status: 200, headers: headers() })],
    ["blank_body", async () => new Response("", { status: 200, headers: headers() })],
    ["backend_json_on_frontend_route", async () => new Response('{"ok":true}', { status: 200, headers: headers("application/json") })],
    ["missing_frontend_asset", async () => new Response('<!doctype html><div id="root"></div>', { status: 200, headers: headers() })],
    ["frontend_asset_http_404", async (url) => String(url).includes("/assets/") ? new Response("missing", { status: 404 }) : new Response(html, { status: 200, headers: headers() })],
    ["timeout", async () => { throw new DOMException("timed out", "TimeoutError"); }],
  ];
  const all = [];
  for (const [expected, fetchImpl] of scenarios) {
    const [result] = await probe("https://example.test", { endpoints: ["/"], fetchImpl });
    assert.equal(result.failure_type, expected);
    all.push(result);
  }
  const dir = mkdtempSync(join(tmpdir(), "watchdog-matrix-"));
  const [jsonl] = writeIncidentFiles(all, dir, "failure injection");
  assert.equal(readFileSync(jsonl, "utf8").trim().split("\n").length, scenarios.length);
});
