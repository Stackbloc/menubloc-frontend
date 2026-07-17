/**
 * Market aggregator page contracts:
 * - fetch via api.js (Railway production fallback — never same-origin HTML)
 * - clusters effect depends on slugOrId string, not a fresh parseCityStateSlug object
 * - city intro overlay via marketIntroContent (slug-keyed; other cities unaffected)
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "src/pages/MarketAggregatorPage.jsx"), "utf8");

assert.match(src, /from ["']\.\.\/lib\/api\.js["']/);
assert.match(src, /apiGet\(\s*`?\$?\{?["']?\/public\/market\//);
assert.doesNotMatch(src, /const API = \(import\.meta\.env\.VITE_API_BASE_URL/);
assert.doesNotMatch(src, /localhost:3001/);

// Anti-regression: unstable object dep caused infinite /public/clusters storm.
assert.doesNotMatch(src, /\}, \[parsed\]\)/);
assert.match(src, /fetchClustersDirectory/);
assert.match(src, /\}, \[slugOrId\]\)/);

// Anti-regression: white page + global near-white ink made names invisible.
assert.match(src, /color:\s*["']#111827["']/);
assert.match(src, /background:\s*["']#ffffff["']/);
assert.match(src, /Try again/);

// City-specific intro overlay (Dothan and future markets).
assert.match(src, /from ["']\.\.\/lib\/marketIntroContent\.js["']/);
assert.match(src, /resolveMarketIntro/);

console.log("marketAggregatorPageContract: ok");
