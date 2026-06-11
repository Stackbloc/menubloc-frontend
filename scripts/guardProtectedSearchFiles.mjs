#!/usr/bin/env node
/**
 * Pre-commit guard for protected search/compare UI files.
 * Blocks commits that touch protected files without an approval doc.
 * See CLAUDE.md Show Similar & Compare Guardrail for the full list.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

const PROTECTED = new Set([
  "src/components/SearchResultCard.jsx",
  "src/components/menu/CompareItemsModal.jsx",
  "src/pages/MenuItemDetailPage.jsx",
  "src/lib/api.js",
  "src/lib/comparePolicy.js",
]);

const APPROVAL_DOC = "docs/search-compare-change-approval.md";

let staged;
try {
  staged = execSync("git diff --cached --name-only", { encoding: "utf8" })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
} catch {
  // If git fails (e.g., initial commit), allow.
  process.exit(0);
}

const hits = staged.filter((f) => PROTECTED.has(f));

if (hits.length === 0) {
  process.exit(0);
}

const approvalPath = resolve(process.cwd(), APPROVAL_DOC);
if (existsSync(approvalPath)) {
  console.log(`✅ Protected files staged but approval doc found: ${APPROVAL_DOC}`);
  process.exit(0);
}

console.error(`
❌ PRE-COMMIT BLOCKED — Protected search/compare files staged without approval:

${hits.map((f) => `  • ${f}`).join("\n")}

Per CLAUDE.md guardrail: changes to these files require explicit approval.
Create ${APPROVAL_DOC} documenting the change before committing.
`);
process.exit(1);
