/**
 * Guardrail: forbid empty-string production API base fallback.
 * That pattern makes fetch(`${API}/menus/browse`) same-origin on menuply.com → SPA HTML.
 * See docs/guardrails/2026-07-05_frontend-api-base-url-guardrail.md
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC_ROOT = join(import.meta.dirname, "../src");

/**
 * Pre-2026-07-05 debt — migrate to `import { API_BASE } from "../lib/api.js"`.
 * Do not add paths here; fix the file instead.
 * @see docs/guardrails/2026-07-05_frontend-api-base-url-guardrail.md
 */
const KNOWN_EMPTY_PROD_FALLBACK_FILES = new Set([
  "src/components/menuCatalog/CatalogMenuRenderer.jsx",
  "src/components/menuCatalog/CatalogDrinksMenuRenderer.jsx",
  "src/components/TasteIndexBadge.jsx",
  "src/lib/menuVerificationApi.js",
  "src/pages/RestaurantQrUpsell.jsx",
]);

/** Matches empty prod fallback via import.meta.env or VITE_ENV alias */
const EMPTY_PROD_FALLBACK =
  /(?:import\.meta\.env|VITE_ENV)\.DEV\s*\?\s*["']http:\/\/localhost:3001["']\s*:\s*["']["']/;

/** Matches bare same-origin API fetches */
const BARE_RELATIVE_API_FETCH =
  /\bfetch\s*\(\s*["'`]\/(?:menus\/browse|search|public\/search)/;

function walkSourceFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (name === "__tests__") continue;
      walkSourceFiles(path, acc);
      continue;
    }
    if (/\.(js|jsx)$/.test(name)) acc.push(path);
  }
  return acc;
}

const sourceFiles = walkSourceFiles(SRC_ROOT);

test("no new empty-string production API base fallback in frontend src", () => {
  const violations = [];
  for (const file of sourceFiles) {
    const rel = relative(join(import.meta.dirname, ".."), file);
    const content = readFileSync(file, "utf8");
    if (EMPTY_PROD_FALLBACK.test(content) && !KNOWN_EMPTY_PROD_FALLBACK_FILES.has(rel)) {
      violations.push(rel);
    }
  }
  assert.equal(
    violations.length,
    0,
    `Forbidden empty prod API fallback. Migrate to api.js API_BASE pattern:\n${violations.join("\n")}`
  );
});

test("known empty-prod-fallback debt is unchanged (shrink-only allowlist)", () => {
  const current = new Set();
  for (const file of sourceFiles) {
    const rel = relative(join(import.meta.dirname, ".."), file);
    const content = readFileSync(file, "utf8");
    if (EMPTY_PROD_FALLBACK.test(content)) current.add(rel);
  }
  for (const allowed of KNOWN_EMPTY_PROD_FALLBACK_FILES) {
    assert.ok(current.has(allowed), `Allowlisted file no longer uses pattern — remove from allowlist: ${allowed}`);
  }
  const unexpected = [...current].filter((f) => !KNOWN_EMPTY_PROD_FALLBACK_FILES.has(f));
  assert.equal(
    unexpected.length,
    0,
    `New empty-prod-fallback files not in allowlist:\n${unexpected.join("\n")}`
  );
});

test("no bare relative fetch to browse/search API paths", () => {
  const violations = [];
  for (const file of sourceFiles) {
    const content = readFileSync(file, "utf8");
    if (BARE_RELATIVE_API_FETCH.test(content)) {
      violations.push(relative(join(import.meta.dirname, ".."), file));
    }
  }
  assert.equal(
    violations.length,
    0,
    `Forbidden bare same-origin API fetch:\n${violations.join("\n")}`
  );
});
