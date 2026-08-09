/**
 * OCR Review Queue exposes Split fields for glued name/price/description cells.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reviewSrc = fs.readFileSync(
  path.join(ROOT, "src/pages/owner/OwnerMenuUploadReviewItems.jsx"),
  "utf8"
);
const libSrc = fs.readFileSync(
  path.join(ROOT, "src/lib/splitGluedMenuItemLine.js"),
  "utf8"
);

assert.match(reviewSrc, /splitGluedMenuItemFields/);
assert.match(reviewSrc, /looksGluedForSplitFields/);
assert.match(reviewSrc, /data-testid="owner-review-split-fields"/);
assert.match(reviewSrc, /Split fields/);
assert.match(reviewSrc, /handleSplitFields/);
assert.match(libSrc, /extractPricedFragmentsFromLine/);
assert.match(libSrc, /\\b\\d\{1,3\}\\.\\d\{2\}\\b/);

console.log("ownerOcrReviewSplitFieldsContract: ok");
