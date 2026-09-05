/**
 * Owner Menu Manager upload — phone photo library multi-select (Andre 2026-09-05).
 *
 * Photos MUST use accept="image/*" + multiple so iOS/Android open the photo
 * library (multi-select). PDF is a separate picker. Do NOT reunite PDF+images
 * on one accept (Files-app trap / one-file-at-a-time).
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
  return src.slice(Math.max(0, at - 420), at + needle.length + 40);
}

assert.match(src, /function mergeOwnerUploadFiles/);
assert.match(src, /function applyOwnerUploadPick/);
assert.match(src, /mergeOwnerUploadFiles\(prev, ok\)/);
assert.match(src, /event\.target\.value = ""/);
assert.match(src, /data-testid="owner-menu-upload-file-list"/);
assert.match(src, /data-testid="owner-menu-upload-clear-files"/);
assert.match(src, /data-testid="owner-menu-upload-remove-file"/);
assert.doesNotMatch(src, /onChange=\{\(e\) => setFiles\(Array\.from\(e\.target\.files/);
assert.doesNotMatch(src, /setFiles\(ok\)/);

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

const mixedAcceptRe =
  /accept="[^"]*(?:application\/pdf|\.pdf)[^"]*(?:image\/|\.jpe?g|\.png|\.webp)[^"]*"|accept="[^"]*(?:image\/|\.jpe?g|\.png|\.webp)[^"]*(?:application\/pdf|\.pdf)[^"]*"/i;
assert.doesNotMatch(src, mixedAcceptRe);
assert.doesNotMatch(src, /data-testid="owner-menu-upload-input"/);
assert.doesNotMatch(src, /PDF \(usually one\) and\/or photos \(select many\)/);
assert.match(src, /select many pages at once/i);
assert.match(src, /isOwnerUploadHeic|HEIC\/HEIF is not supported/);

console.log("ownerMenuUploadAccumulateFilesContract: ok (photos library multi-select locked)");
