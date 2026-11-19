/**
 * Created 2026-11-19 (Andre): "Installed app is outdated" gate must only show for the old
 * Operator WebAPK on Android (display-mode: standalone). Incident 2026-11-19: desktop Chrome
 * on a Mac in full-screen window matched display-mode: fullscreen and got the gate on /feed.
 *
 * Runs the real inline <head> script from index.html in a sandbox with fake browser globals.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const gateScript = scripts.find((s) => s.includes("menuply-stale-pwa-gate"));
assert.ok(gateScript, "inline stale PWA gate script present in index.html");

const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36";
const WIN_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

function run({ ua, modes = ["browser"], pathname = "/feed", iosStandalone = false }) {
  const attrs = {};
  let gateShown = false;
  const listeners = {};
  const document = {
    documentElement: { setAttribute: (k, v) => (attrs[k] = v) },
    querySelector: () => null,
    getElementById: () => null,
    addEventListener: (type, fn) => (listeners[type] = fn),
    createElement: () => ({ setAttribute() {}, set innerHTML(v) {} }),
    body: { appendChild: () => (gateShown = true) },
  };
  const navigator = { userAgent: ua, standalone: iosStandalone };
  const window = {
    navigator,
    matchMedia: (q) => ({ matches: modes.some((m) => q === `(display-mode: ${m})`) }),
    open() {},
  };
  const ctx = { window, navigator, document, location: { pathname, href: "" }, screen: {}, URL, setTimeout };
  vm.runInNewContext(gateScript, ctx);
  if (listeners.DOMContentLoaded) listeners.DOMContentLoaded();
  return gateShown || attrs["data-menuply-stale-pwa"] === "1";
}

test("desktop Mac Chrome in a full-screen window never sees the gate (2026-11-19 incident)", () => {
  assert.equal(run({ ua: MAC_CHROME, modes: ["fullscreen"] }), false);
});

test("desktop Chrome never sees the gate, even as an installed standalone app", () => {
  assert.equal(run({ ua: MAC_CHROME, modes: ["standalone"] }), false);
  assert.equal(run({ ua: WIN_CHROME, modes: ["standalone"] }), false);
  assert.equal(run({ ua: WIN_CHROME, modes: ["minimal-ui"] }), false);
  assert.equal(run({ ua: MAC_CHROME }), false);
});

test("iOS home-screen launches never see the gate", () => {
  assert.equal(run({ ua: IPHONE, modes: ["standalone"], iosStandalone: true }), false);
});

test("Android normal tab and Android full-screen video do not see the gate", () => {
  assert.equal(run({ ua: ANDROID_TABLET }), false);
  assert.equal(run({ ua: ANDROID_TABLET, modes: ["fullscreen"] }), false);
});

test("old Operator WebAPK on Android (standalone, consumer page) still sees the gate", () => {
  assert.equal(run({ ua: ANDROID_TABLET, modes: ["standalone"], pathname: "/" }), true);
  assert.equal(run({ ua: ANDROID_TABLET, modes: ["standalone"], pathname: "/feed" }), true);
});

test("Operator pages are never gated", () => {
  assert.equal(run({ ua: ANDROID_TABLET, modes: ["standalone"], pathname: "/operator/tablet" }), false);
});
