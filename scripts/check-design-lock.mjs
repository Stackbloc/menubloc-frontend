#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const APPROVED_TYPOGRAPHY_FILES = new Set([
  "src/index.css",
  "src/styles/theme.js",
]);

const PROTECTED_FILES = [
  "src/main.jsx",
  "src/pages/TopPicksPage.jsx",
  "src/pages/GrubbidSearchResults.jsx",
  "src/pages/BrowseMenus.jsx",
  "src/pages/DealsPage.jsx",
  "src/pages/Terms.jsx",
  "src/components/NavButton.jsx",
  "src/components/MenuCard.jsx",
  "src/components/SearchResultCard.jsx",
  "src/components/browse/MenuPreviewCard.jsx",
  "src/components/grubbid/GrubbidPrimitives.jsx",
];

const typographyPattern = /\bfontFamily\b|\bfont-family\b/g;

const violations = [];

for (const relativePath of PROTECTED_FILES) {
  if (APPROVED_TYPOGRAPHY_FILES.has(relativePath)) continue;

  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) continue;

  const content = fs.readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (typographyPattern.test(line)) {
      violations.push(`${relativePath}:${index + 1}: raw typography override -> ${line.trim()}`);
    }
    typographyPattern.lastIndex = 0;
  });
}

if (violations.length > 0) {
  console.error("Grubbid design lock failed.");
  console.error("Typography overrides are only allowed in:");
  for (const file of APPROVED_TYPOGRAPHY_FILES) console.error(`  - ${file}`);
  console.error("");
  for (const violation of violations) console.error(violation);
  process.exit(1);
}

console.log("Grubbid design lock passed.");
