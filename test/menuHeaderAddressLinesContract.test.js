/**
 * Public menu headers must show street and city/state on separate lines.
 * Regression: Fine (Tabl M v17) and Classic previously concatenated them.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const helper = read("src/components/menu-templates/MenuAddressLines.jsx");
assert.match(helper, /flexDirection:\s*"column"/);
assert.match(helper, /addressLine1/);
assert.match(helper, /addressLine2/);

const templates = [
  "FineMenuTemplate.jsx",
  "ClassicMenuTemplate.jsx",
  "PremiumBistroMenuTemplate.jsx",
  "DarkPremiumMenuTemplate.jsx",
  "FamilyDinerMenuTemplate.jsx",
  "RefinedEditorialMenuTemplate.jsx",
  "EditorialCasualMenuTemplate.jsx",
  "EditorialDarkMenuTemplate.jsx",
  "EditorialQSRMenuTemplate.jsx",
  "EditorialSteakhouseMenuTemplate.jsx",
];

for (const name of templates) {
  const src = read(`src/components/menu-templates/${name}`);
  assert.match(src, /MenuAddressLines/, `${name} must use MenuAddressLines`);
  assert.doesNotMatch(
    src,
    /\{addressLine1\}\{addressLine2 \? `, \$\{addressLine2\}` : ""\}/,
    `${name} must not concatenate street + city/state on one line`
  );
}

console.log("menuHeaderAddressLinesContract: ok");
