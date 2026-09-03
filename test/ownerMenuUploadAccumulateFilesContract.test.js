/**
 * Owner Menu Manager upload — phone multi-select + accumulate queue.
 *
 * Regression this locks (2026-09-03): a single <input> with mixed PDF+image
 * accept forces iOS/Android into the Files/document manager, which often
 * allows only one file at a time. Photos must use accept="image/*" so the
 * photo library opens with multi-select. PDF stays a separate picker.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(
  path.join(ROOT, "src/pages/owner/OwnerMenuCreateWorkspace.jsx"),
  "utf8"
);

function inputBlockAroundTestId(testid) {
  const needle = `data-testid="${testid}"`;
  const at = src.indexOf(needle);
  assert.ok(at >= 0, `missing ${needle}`);
  // Include attributes that appear before the testid on the same <input>.
  return src.slice(Math.max(0, at - 420), at + needle.length + 40);
}

// --- Accumulate queue (phone append still works) ---
assert.match(src, /function mergeOwnerUploadFiles/);
assert.match(src, /function applyOwnerUploadPick/);
assert.match(src, /mergeOwnerUploadFiles\(prev, ok\)/);
assert.match(src, /event\.target\.value = ""/);
assert.match(src, /data-testid="owner-menu-upload-file-list"/);
assert.match(src, /data-testid="owner-menu-upload-clear-files"/);
assert.match(src, /data-testid="owner-menu-upload-remove-file"/);
assert.doesNotMatch(src, /onChange=\{\(e\) => setFiles\(Array\.from\(e\.target\.files/);

// --- Split pickers (do not reunite PDF + images on one accept) ---
assert.match(src, /photoFileRef/);
assert.match(src, /pdfFileRef/);

const photosBlock = inputBlockAroundTestId("owner-menu-upload-photos-input");
assert.match(photosBlock, /type="file"/);
assert.match(photosBlock, /\bmultiple\b/);
assert.match(photosBlock, /accept="image\/\*"/);
assert.doesNotMatch(photosBlock, /\bcapture=/);
assert.doesNotMatch(photosBlock, /application\/pdf|\.pdf/i);

const pdfBlock = inputBlockAroundTestId("owner-menu-upload-pdf-input");
assert.match(pdfBlock, /type="file"/);
assert.match(pdfBlock, /accept="\.pdf,application\/pdf"/);
assert.doesNotMatch(pdfBlock, /accept="[^"]*image\//);
assert.doesNotMatch(pdfBlock, /\bcapture=/);

// Hard ban: any single file input that mixes PDF + image types (Files-app trap).
const mixedAcceptRe =
  /accept="[^"]*(?:application\/pdf|\.pdf)[^"]*(?:image\/|\.jpe?g|\.png|\.webp)[^"]*"|accept="[^"]*(?:image\/|\.jpe?g|\.png|\.webp)[^"]*(?:application\/pdf|\.pdf)[^"]*"/i;
assert.doesNotMatch(src, mixedAcceptRe);

// Copy must not instruct one-at-a-time as the primary phone path.
assert.doesNotMatch(src, /add one photo at a time/i);
assert.match(src, /select many pages at once/i);

console.log("ownerMenuUploadAccumulateFilesContract: ok");
