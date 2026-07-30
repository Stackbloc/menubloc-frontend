/**
 * Consumer site must not inherit Operator tablet PWA landscape lock / icons.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const indexHtml = read("index.html");
assert.match(indexHtml, /href="\/manifest\.webmanifest"/);
assert.match(indexHtml, /href="\/menuply-logo\.png"/);
assert.match(indexHtml, /menuply-consumer-192/);
assert.doesNotMatch(indexHtml, /operator-icon-192/);
assert.doesNotMatch(indexHtml, /operator-apple-touch-icon/);
assert.match(indexHtml, /screen\.orientation\.unlock/, "early Chrome-tablet unlock before React");
assert.match(indexHtml, /serviceWorker\.getRegistrations/, "early root SW purge before React");
assert.match(indexHtml, /display-mode: standalone/, "detect Google Search WebAPK hijack");
assert.match(indexHtml, /menuply-stale-pwa-gate/, "show uninstall gate for stale standalone");

const consumerManifest = JSON.parse(read("public/manifest.webmanifest"));
assert.equal(consumerManifest.name, "Menuply");
assert.equal(consumerManifest.start_url, "/");
assert.equal(consumerManifest.orientation, "any");
assert.equal(consumerManifest.scope, "/");
assert.equal(consumerManifest.display, "browser");
assert.equal(consumerManifest.handle_links, "not-preferred");
assert.match(String(consumerManifest.id || ""), /menuply-consumer-v4/);
assert.doesNotMatch(JSON.stringify(consumerManifest), /operator-icon/);
assert.match(JSON.stringify(consumerManifest), /menuply-consumer/);

const operatorManifest = JSON.parse(read("public/operator-manifest.webmanifest"));
assert.equal(operatorManifest.orientation, "landscape-primary");
assert.equal(operatorManifest.start_url, "/operator/tablet");
assert.equal(operatorManifest.scope, "/operator/", "Operator PWA must NOT scope the whole origin");
assert.match(JSON.stringify(operatorManifest), /operator-icon/);

const tablet = read("src/pages/operator/OperatorTabletPage.jsx");
assert.match(tablet, /operator-manifest\.webmanifest/);
assert.match(tablet, /\/operator\/service-worker\.js/);
assert.match(tablet, /scope:\s*["']\/operator\/["']/);

const consumerSw = read("public/service-worker.js");
assert.match(consumerSw, /unregister/);
assert.doesNotMatch(consumerSw, /operator-icon-192/);
assert.doesNotMatch(consumerSw, /respondWith/);

const operatorSw = read("public/operator/service-worker.js");
assert.match(operatorSw, /menuply-operator-pwa/);
assert.match(operatorSw, /operator-icon-192/);
assert.match(operatorSw, /\/operator\/tablet/);

const register = read("src/registerServiceWorker.js");
assert.match(register, /unregister/);
assert.match(register, /unlockConsumerOrientation|screen\.orientation\.unlock/);
assert.doesNotMatch(register, /register\("\/service-worker\.js"\)/);
assert.doesNotMatch(register, /register\("\/operator\/service-worker\.js"/);

assert.ok(fs.existsSync(path.join(ROOT, "public/pwa-icons/menuply-consumer-192.png")));
assert.ok(fs.existsSync(path.join(ROOT, "public/pwa-icons/menuply-consumer-512.png")));

const vercel = read("vercel.json");
assert.match(vercel, /manifest\.webmanifest/);
assert.match(vercel, /no-store/);

console.log("consumerPwaManifestContract: ok");
