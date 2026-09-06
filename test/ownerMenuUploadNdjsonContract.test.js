/**
 * Owner menu upload must survive long Adobe OCR without Railway idle disconnect.
 * NDJSON ping lines + 15-minute client wait; do not blame the 100 MB size cap.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "src/lib/ownerApi.js"), "utf8");

assert.match(src, /OWNER_MENU_UPLOAD_TIMEOUT_MS = 15 \* 60 \* 1000/);
assert.match(src, /function parseOwnerUploadResponseBody/);
assert.match(src, /type === "result"/);
assert.match(src, /type === "error"/);
assert.match(src, /this is not a 100 MB size limit/);
assert.doesNotMatch(
  src,
  /Menu upload failed \(connection dropped\)\. Try fewer\/smaller photos \(JPEG\/PNG under 100 MB\)/
);

console.log("ownerMenuUploadNdjsonContract: ok");
