/**
 * Owner Menu Manager — honest outcome when OCR inserts zero dishes.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

describe("owner menu upload zero-insert UX contract", () => {
  it("MenuCreateWorkspace surfaces needs_clearer_photo when inserted is 0", () => {
    const src = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(src, /needs_clearer_photo/);
    assert.match(src, /totalInserted === 0/);
    assert.match(src, /OCR could not read/);
    assert.match(src, /ok: false/);
  });

  it("OwnerMenuEditorPage does not celebrate zero-insert uploads", () => {
    const src = read("src/pages/owner/OwnerMenuEditorPage.jsx");
    assert.match(src, /inserted === 0/);
    assert.match(src, /OCR could not read this file clearly/);
    assert.match(src, /ok: false/);
  });
});
