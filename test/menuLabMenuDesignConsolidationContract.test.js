/**
 * Operator Menu Lab owns design presets; /operator/menudesign redirects here.
 * Menu Lab must expose an explicit return to operator home.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testSidebarDropsMenuDesign() {
  const layout = read("src/pages/operator/OperatorLayout.jsx");
  assert.doesNotMatch(layout, /\/operator\/menudesign/);
  assert.doesNotMatch(layout, /operator\.nav\.menuDesign/);
  assert.match(layout, /\/operator\/menulab/);
}

function testMenudesignRedirectsToMenulab() {
  const app = read("src/App.jsx");
  assert.match(
    app,
    /path="\/operator\/menudesign"\s+element=\{<Navigate to="\/operator\/menulab" replace \/>\}/
  );
  assert.doesNotMatch(app, /OperatorRoute><MenuDesignLabPage/);
  // Public demo lab remains available.
  assert.match(app, /path="\/menu-design-lab"/);
}

function testMenuLabHasOperatorHomeLink() {
  const src = read("src/pages/operator/OperatorMenuEditor.jsx");
  assert.match(src, /← Operator Home/);
  assert.match(src, /to="\/operator"/);
  assert.match(src, /function MenuLabPanel/);
}

testSidebarDropsMenuDesign();
testMenudesignRedirectsToMenulab();
testMenuLabHasOperatorHomeLink();
console.log("menuLabMenuDesignConsolidationContract: ok");
