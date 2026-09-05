/**
 * Owner Menu Manager upload — pre–Aug 5 authorized picker (Andre 2026-09-05).
 *
 * One combined PDF+photos <input multiple>. Each pick REPLACES the selection
 * (no accumulate queue). Do not reintroduce split Photos/PDF pickers or
 * append-on-pick without explicit current-turn approval.
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

assert.match(src, /data-testid="owner-menu-upload-input"/);
assert.match(src, /PDF \(usually one\) and\/or photos \(select many\)/);
assert.match(
  src,
  /accept="\.pdf,\.jpg,\.jpeg,\.png,\.webp,application\/pdf,image\/jpeg,image\/png,image\/webp"/
);

const inputBlock = (() => {
  const needle = 'data-testid="owner-menu-upload-input"';
  const at = src.indexOf(needle);
  assert.ok(at >= 0, "missing owner-menu-upload-input");
  // Attributes sit above a long onChange; look farther back.
  return src.slice(Math.max(0, at - 900), at + needle.length + 40);
})();
assert.match(inputBlock, /type="file"/);
assert.match(inputBlock, /\bmultiple\b/);
assert.match(
  inputBlock,
  /accept="\.pdf,\.jpg,\.jpeg,\.png,\.webp,application\/pdf,image\/jpeg,image\/png,image\/webp"/
);
assert.doesNotMatch(inputBlock, /\bcapture=/);

// Replace-on-pick (not accumulate / merge).
assert.match(src, /setFiles\(ok\)/);
assert.doesNotMatch(src, /function mergeOwnerUploadFiles/);
assert.doesNotMatch(src, /mergeOwnerUploadFiles\(/);
assert.doesNotMatch(src, /applyOwnerUploadPick/);
assert.doesNotMatch(src, /photoFileRef|pdfFileRef/);
assert.doesNotMatch(src, /owner-menu-upload-photos-input|owner-menu-upload-pdf-input/);
assert.doesNotMatch(src, /owner-menu-upload-clear-files|owner-menu-upload-remove-file/);
assert.doesNotMatch(src, /add one photo at a time/i);
assert.doesNotMatch(src, /select many pages at once/i);

console.log("ownerMenuUploadAccumulateFilesContract: ok (pre-Aug-5 picker locked)");
