import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const railPath = path.join(root, "src/components/menu-templates/MenuHeaderIconRail.jsx");
const rail = fs.readFileSync(railPath, "utf8");

assert.match(
  rail,
  /flex:\s*isNarrow \? ["']1 1 100%["'] : ["']0 1 auto["']/,
  "MenuHeaderNameWithActions: wrap name on narrow; keep 0 1 auto adjacency on wide"
);
assert.match(rail, /useIsNarrowMenuViewport/);
assert.doesNotMatch(rail, /marginLeft:\s*["']?auto["']?/, "header actions must not use marginLeft auto");

const templatesDir = path.join(root, "src/components/menu-templates");
const templateFiles = fs
  .readdirSync(templatesDir)
  .filter((f) => f.endsWith("MenuTemplate.jsx"));

for (const file of templateFiles) {
  const src = fs.readFileSync(path.join(templatesDir, file), "utf8");
  if (!src.includes("ShareButton") && !src.includes("MenuHeaderNameWithActions")) continue;
  if (src.includes("MenuHeaderNameWithActions")) continue;
  if (/ShareButton[\s\S]{0,400}marginLeft:\s*["']?auto/.test(src)) {
    assert.fail(`${file}: ShareButton cluster must not use marginLeft auto`);
  }
}

console.log("menuHeaderNameActionsAdjacentContract: PASS");
