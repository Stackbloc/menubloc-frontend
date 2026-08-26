/**
 * CSP must allow durable HTTPS diner videos (Supabase). Without media-src,
 * default-src 'self' blocks cross-origin <video> → black Live Feed / Journal.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("vercel.json CSP includes media-src https for diner videos", () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  const headers = [];
  for (const route of vercel.headers || []) {
    for (const h of route.headers || []) {
      if (String(h.key || "").toLowerCase() === "content-security-policy") {
        headers.push(String(h.value || ""));
      }
    }
  }
  assert.ok(headers.length >= 1, "expected CSP header in vercel.json");
  for (const csp of headers) {
    assert.match(csp, /media-src[^;]*https:/i);
    assert.match(csp, /media-src[^;]*blob:/i);
  }
});
