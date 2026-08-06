/**
 * Owner Menu Manager upload: append picks (phone-friendly multi-photo queue).
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

assert.match(src, /function mergeOwnerUploadFiles/);
assert.match(src, /mergeOwnerUploadFiles\(prev, picked\)/);
assert.match(src, /e\.target\.value = ""/);
assert.match(src, /data-testid="owner-menu-upload-file-list"/);
assert.match(src, /data-testid="owner-menu-upload-clear-files"/);
assert.match(src, /data-testid="owner-menu-upload-remove-file"/);
assert.match(src, /add one photo at a time/i);
assert.doesNotMatch(src, /onChange=\{\(e\) => setFiles\(Array\.from\(e\.target\.files/);

console.log("ownerMenuUploadAccumulateFilesContract: ok");
