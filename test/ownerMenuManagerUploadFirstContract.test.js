/**
 * Menu Manager defaults to upload-first Menus workspace; Needs review is secondary.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "src/pages/owner/OwnerMenuUploads.jsx"), "utf8");

assert.match(src, /label="Menus"/);
assert.match(src, /label="Needs review"/);
assert.doesNotMatch(src, /label="OCR Uploads"/);
assert.doesNotMatch(src, /label="Edit Menus"/);
assert.match(src, /return "workspace"/);
assert.match(src, /Upload a PDF or photos/);

console.log("ownerMenuManagerUploadFirstContract: ok");
