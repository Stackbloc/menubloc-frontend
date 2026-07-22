/**
 * Contract: OCR Edit split layout — Mode 1 OCR rail + Mode 2 plain live menu.
 * Guards against regressing to stacked image|OCR above the editor without a source rail,
 * and against putting nutrition into the Mode 2 live-menu reference panel.
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
    expect(src).toMatch(/Magnifier on/);
    expect(src).toMatch(/useState\(true\)/);
    expect(src).toMatch(/ocr-source-evidence__lens/);
    expect(src).toMatch(/Move pointer to magnify/);
    expect(css).toMatch(/ocr-source-evidence__lens/);
    expect(css).toMatch(/ocr-source-evidence__magnify-btn/);
    expect(css).toMatch(/ocr-source-evidence__magnify-cue/);
  });

  it("defines plain LiveMenuReferencePanel without nutrition", () => {
    const src = read("LiveMenuReferencePanel.jsx");
    expect(src).toMatch(/LiveMenuReferencePanel/);
    expect(src).toMatch(/normalizeLiveMenuItems/);
    expect(src).toMatch(/live-menu-reference/);
    expect(src).toMatch(/Open full menu/);
    expect(src).not.toMatch(/nutrition/i);
    expect(src).not.toMatch(/calories/i);
    expect(src).not.toMatch(/verdict/i);
    expect(src).not.toMatch(/allergen/i);
  });

  it("defines OcrEditSplitLayout with OCR/Live mode toggle and drawer containment", () => {
    const layout = read("OcrEditSplitLayout.jsx");
    const css = read("ocrEditSplitLayout.css");
    const shell = fs.readFileSync(
      path.resolve(__dirname, "../src/components/adminConsole/adminConsoleShell.css"),
      "utf8"
    );
    expect(layout).toMatch(/OcrSourceEvidencePanel/);
    expect(layout).toMatch(/LiveMenuReferencePanel/);
    expect(layout).toMatch(/defaultRailMode/);
    expect(layout).toMatch(/liveItems/);
    expect(layout).toMatch(/Source menu · OCR/);
    expect(layout).toMatch(/Live menu/);
    expect(layout).toMatch(/ocr-edit-split__rail-slot/);
    expect(layout).toMatch(/ocr-edit-split__rail--fixed/);
    expect(layout).toMatch(/getBoundingClientRect/);
    expect(layout).toMatch(/FIXED_TOP_PX/);
    expect(layout).toMatch(/max-width: 1479px/);
    expect(css).toMatch(/ocr-edit-split__rail/);
    expect(css).toMatch(/ocr-edit-split__mode-toggle/);
    expect(css).toMatch(/live-menu-reference/);
    expect(css).toMatch(/overflow-y:\s*auto/);
    expect(css).toMatch(/ocr-edit-split__rail--fixed/);
    expect(css).toMatch(/ocr-edit-split__rail-slot/);
    expect(css).toMatch(/position:\s*fixed/);
    expect(css).toMatch(/ocr-edit-split__toolbar[\s\S]*position:\s*sticky/);
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
    expect(src).toMatch(/liveItems/);
    expect(src).toMatch(/defaultRailMode="ocr"/);
    expect(src).not.toMatch(/gridTemplateColumns:\s*"1fr 1fr"/);
    expect(src).not.toMatch(/Source Pages \(/);
  });

  it("Edit dishes defaults to Live menu when published or has items", () => {
    const src = read("OwnerMenuCreateWorkspace.jsx");
    expect(src).toMatch(/OcrEditSplitLayout/);
    expect(src).toMatch(/liveItems=\{menuDetail\.sections/);
    expect(src).toMatch(/defaultRailMode/);
    expect(src).toMatch(/published/);
    expect(src).toMatch(/Edit dishes/);
  });

  it("Upload Detail Parsed Items uses dual-mode split when pages or live exist", () => {
    const src = read("OwnerMenuUploadDetail.jsx");
    expect(src).toMatch(/OcrEditSplitLayout/);
    expect(src).toMatch(/liveItems=\{promotedItems\}/);
    expect(src).toMatch(/defaultRailMode=\{promotedItems\.length > 0 \? "live" : "ocr"\}/);
    expect(src).toMatch(/pages=\{pages\}/);
  });

  it("Upload Detail Parsed Items uses click-to-edit fields instead of an idle Edit button", () => {
    const src = read("OwnerMenuUploadDetail.jsx");
    const parsed = src.slice(src.indexOf("function ParsedItemsSection"), src.indexOf("function CreateRestaurantProfileInline"));
    expect(parsed).toMatch(/function startEdit\(itemId, field\)/);
    expect(parsed).toMatch(/editableFieldProps\("name"\)/);
    expect(parsed).toMatch(/editableFieldProps\("section"\)/);
    expect(parsed).toMatch(/editableFieldProps\("price"\)/);
    expect(parsed).toMatch(/autoFocus=\{editingFocus === "name"\}/);
    expect(parsed).toMatch(/autoFocus=\{editingFocus === "section"\}/);
    expect(parsed).toMatch(/autoFocus=\{editingFocus === "price"\}/);
    expect(parsed).toMatch(/title: "Click to edit"/);
    // Idle-row Edit button removed; Save/Cancel remain while editing
    expect(parsed).not.toMatch(/>\s*Edit\s*</);
    expect(parsed).toMatch(/\{saving \? "…" : "Save"\}/);
    expect(parsed).toMatch(/>\s*Cancel\s*</);
  });
});
