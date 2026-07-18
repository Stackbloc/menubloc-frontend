/**
 * Contract: OCR Edit split layout — right rail companion for Edit dishes + Review Queue.
 * Guards against regressing to stacked image|OCR above the editor without a source rail.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ownerDir = path.resolve(__dirname, "../src/pages/owner");

function read(name) {
  return fs.readFileSync(path.join(ownerDir, name), "utf8");
}

describe("OCR edit split pane contract", () => {
  it("defines OcrSourceEvidencePanel with stacked image + OCR text", () => {
    const src = read("OcrSourceEvidencePanel.jsx");
    expect(src).toMatch(/ocr-source-evidence/);
    expect(src).toMatch(/OCR Text \(supporting evidence\)/);
    expect(src).toMatch(/ocr-source-evidence__thumbs/);
  });

  it("source photo includes a toggleable magnifier lens", () => {
    const src = read("OcrSourceEvidencePanel.jsx");
    const css = read("ocrEditSplitLayout.css");
    expect(src).toMatch(/OcrPhotoMagnifier/);
    expect(src).toMatch(/Magnifier/);
    expect(src).toMatch(/ocr-source-evidence__lens/);
    expect(css).toMatch(/ocr-source-evidence__lens/);
    expect(css).toMatch(/ocr-source-evidence__magnify-btn/);
  });

  it("defines OcrEditSplitLayout with independent rail scroll and drawer containment", () => {
    const layout = read("OcrEditSplitLayout.jsx");
    const css = read("ocrEditSplitLayout.css");
    const shell = fs.readFileSync(
      path.resolve(__dirname, "../src/components/adminConsole/adminConsoleShell.css"),
      "utf8"
    );
    expect(layout).toMatch(/OcrSourceEvidencePanel/);
    expect(layout).toMatch(/max-width: 1479px/);
    expect(layout).toMatch(/Source menu/);
    expect(css).toMatch(/ocr-edit-split__rail/);
    expect(css).toMatch(/overflow-y:\s*auto/);
    expect(css).toMatch(/@media \(min-width: 1480px\)/);
    expect(css).toMatch(/@media \(max-width: 1479px\)/);
    expect(css).toMatch(/minmax\(0,\s*1fr\)/);
    expect(shell).toMatch(/overflow-x:\s*clip/);
    expect(shell).toMatch(/display:\s*grid/);
    expect(shell).toMatch(/grid-template-columns:\s*var\(--admin-sidebar-w/);
    expect(shell).not.toMatch(/width:\s*calc\(100% - var\(--admin-sidebar-w/);
  });

  it("Review Queue uses split layout instead of top 50/50 image|OCR grid", () => {
    const src = read("OwnerMenuUploadReviewItems.jsx");
    expect(src).toMatch(/OcrEditSplitLayout/);
    expect(src).not.toMatch(/gridTemplateColumns:\s*"1fr 1fr"/);
    expect(src).not.toMatch(/Source Pages \(/);
  });

  it("Edit dishes mounts OCR rail when source pages exist", () => {
    const src = read("OwnerMenuCreateWorkspace.jsx");
    expect(src).toMatch(/OcrEditSplitLayout/);
    expect(src).toMatch(/sourcePages/);
    expect(src).toMatch(/Edit dishes/);
  });
});
