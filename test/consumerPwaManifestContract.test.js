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
assert.doesNotMatch(indexHtml, /operator-icon-192/);
assert.doesNotMatch(indexHtml, /operator-apple-touch-icon/);

const consumerManifest = JSON.parse(read("public/manifest.webmanifest"));
assert.equal(consumerManifest.name, "Menuply");
assert.equal(consumerManifest.start_url, "/");
assert.ok(!("orientation" in consumerManifest), "consumer manifest must not lock orientation");
assert.doesNotMatch(JSON.stringify(consumerManifest), /operator-icon/);

const operatorManifest = JSON.parse(read("public/operator-manifest.webmanifest"));
assert.equal(operatorManifest.orientation, "landscape-primary");
assert.equal(operatorManifest.start_url, "/operator/tablet");
assert.match(JSON.stringify(operatorManifest), /operator-icon/);

const tablet = read("src/pages/operator/OperatorTabletPage.jsx");
assert.match(tablet, /operator-manifest\.webmanifest/);

const sw = read("public/service-worker.js");
assert.match(sw, /operator-manifest\.webmanifest/);
assert.doesNotMatch(sw, /"\/manifest\.webmanifest"/);

console.log("consumerPwaManifestContract: ok");
