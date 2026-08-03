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
  /flex:\s*["']0 1 auto["']/,
  "MenuHeaderNameWithActions name block must use flex 0 1 auto so like/share sit next to the name"
);
assert.doesNotMatch(
  rail,
  /flex:\s*1[,\n]/,
  "MenuHeaderNameWithActions must not grow the name block with flex:1 (pushes icons to price-column edge)"
);
assert.doesNotMatch(rail, /marginLeft:\s*["']?auto["']?/, "header actions must not use marginLeft auto");

const templatesDir = path.join(root, "src/components/menu-templates");
const templateFiles = fs
  .readdirSync(templatesDir)
  .filter((f) => f.endsWith("MenuTemplate.jsx"));

for (const file of templateFiles) {
  const src = fs.readFileSync(path.join(templatesDir, file), "utf8");
  if (!src.includes("ShareButton") && !src.includes("MenuHeaderNameWithActions")) continue;
  // Templates that wrap the rail in flex:1 are OK if the rail itself does not grow the name.
  // Forbid space-between / marginLeft auto on the same row as ShareButton for name adjacency.
  if (src.includes("MenuHeaderNameWithActions")) continue;
  if (/ShareButton[\s\S]{0,400}marginLeft:\s*["']?auto/.test(src)) {
    assert.fail(`${file}: ShareButton cluster must not use marginLeft auto`);
  }
}

console.log("menuHeaderNameActionsAdjacentContract: PASS");
