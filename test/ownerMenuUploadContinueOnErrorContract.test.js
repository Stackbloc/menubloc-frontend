/**
 * Owner Menu Manager multi-file upload — continue-on-error (2026-09-20).
 *
 * One photo/PDF failure must not abort the rest of the batch (Rock & Reilly's:
 * 3/22 sessions then stop left food pages unread).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(
  path.join(ROOT, "src/pages/owner/OwnerMenuCreateWorkspace.jsx"),
  "utf8"
);

function handleUploadBody() {
  const start = src.indexOf("async function handleUpload()");
  assert.ok(start >= 0, "handleUpload missing");
  const end = src.indexOf("\n  const isAddingRestaurant", start);
  assert.ok(end > start, "handleUpload end marker missing");
  return src.slice(start, end);
}

describe("owner menu upload continue-on-error contract", () => {
  it("wraps each submitOwnerMenuFilePdf in try/catch and continues the batch", () => {
    const body = handleUploadBody();
    assert.match(body, /Continue-on-error/);
    assert.match(body, /succeededFiles/);
    assert.match(body, /failedFiles/);
    assert.match(body, /for \(let i = 0; i < files\.length; i \+= 1\)/);
    assert.match(body, /try \{\s*const json = await submitOwnerMenuFilePdf/);
    assert.match(body, /\} catch \(fileErr\) \{/);
    assert.match(body, /failedFiles\.push/);
    // Must not rethrow from the per-file catch (that would abort the loop).
    assert.doesNotMatch(body, /catch \(fileErr\) \{[^}]*throw /);
  });

  it("keeps failed files queued and reports partial_upload", () => {
    const body = handleUploadBody();
    assert.match(body, /partial_upload/);
    assert.match(body, /remain queued/);
    assert.match(body, /setFiles\(failedFiles\.map\(\(f\) => f\.file\)\)/);
    assert.match(body, /Uploading \$\{i \+ 1\}\/\$\{batchTotal\}/);
    assert.match(body, /succeededFiles\.length === 0/);
  });
});
