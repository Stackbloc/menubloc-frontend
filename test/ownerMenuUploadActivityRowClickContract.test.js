/**
 * Upload Activity: whole row opens upload detail; no Photos/Detail or Review link column.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(
  path.join(ROOT, "src/pages/owner/OwnerMenuUploadActivity.jsx"),
  "utf8"
);

assert.match(src, /navigate\(detailPath\)/);
assert.match(src, /\/owner\/menu-manager\/uploads\/\$\{upload\.id\}/);
assert.match(src, /data-testid=\{`upload-activity-row-\$\{upload\.id\}`\}/);
assert.doesNotMatch(src, /Photos \/ Detail/);
assert.doesNotMatch(src, /to=\{reviewPath\}/);
assert.doesNotMatch(src, />Review</);
console.log("ownerMenuUploadActivityRowClickContract: ok");
