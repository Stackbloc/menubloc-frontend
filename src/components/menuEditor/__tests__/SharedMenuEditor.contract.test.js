/**
 * Contract checks for shared CK MenuEditor + operator wiring (no browser).
 * Run: npx vitest run src/components/menuEditor/__tests__/SharedMenuEditor.contract.test.js
 */
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../../..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("Shared MenuEditor contract", () => {
  it("SharedMenuEditor requires injected api adapter", () => {
    const src = read("src/components/menuEditor/SharedMenuEditor.jsx");
    expect(src).toMatch(/requires an api adapter/);
    expect(src).toMatch(/api\.updateItem/);
    expect(src).toMatch(/api\.publishMenu/);
    expect(src).toMatch(/api\.unpublishMenu/);
    expect(src).not.toMatch(/from ["'].*ownerApi/);
  });

  it("owner adapter re-exports shared editor with ownerApi", () => {
    const src = read("src/pages/owner/ownerMenuEditorComponents.jsx");
    expect(src).toMatch(/SharedMenuEditor/);
    expect(src).toMatch(/ownerMenuApi/);
    expect(src).toMatch(/publishMenuConsoleMenu/);
  });

  it("operator page mounts PDF pane + shared editor", () => {
    const src = read("src/pages/operator/OperatorCkMenuEditorPage.jsx");
    expect(src).toMatch(/Source PDF \(read-only\)/);
    expect(src).toMatch(/createOperatorCkMenuApi/);
    expect(src).toMatch(/identityWarning/);
    expect(src).toMatch(/immutable/);
  });

  it("App registers operator ck-menus edit route", () => {
    const src = read("src/App.jsx");
    expect(src).toMatch(/OperatorCkMenuEditorPage/);
    expect(src).toMatch(
      /\/operator\/restaurants\/:restaurantId\/ck-menus\/:menuId\/edit/
    );
  });

  it("PdfUploadPage operator success deep-links to CK editor", () => {
    const src = read("src/pages/PdfUploadPage.jsx");
    expect(src).toMatch(/Open structured menu editor/);
    expect(src).toMatch(/public_menu_id/);
    expect(src).toMatch(/upload_session_id/);
    expect(src).toMatch(/ck-menus/);
  });

  it("Section field is a dropdown of existing sections with New section option", () => {
    const src = read("src/components/menuEditor/SharedMenuEditor.jsx");
    expect(src).toMatch(/function SectionSelect/);
    expect(src).toMatch(/\+ New section/);
    expect(src).toMatch(/ensureSection/);
    expect(src).toMatch(/deriveSectionList/);
    expect(src).toMatch(/sectionOptions/);
    expect(src).toMatch(/<SectionSelect/);
    expect(src).not.toMatch(/placeholder="e\.g\. Appetizers"/);
    expect(src).not.toMatch(/placeholder=\{sectionName \|\| "e\.g\. Entrees"\}/);
  });

  it("operatorApi exposes CK editor adapters", () => {
    const src = read("src/lib/operatorApi.js");
    expect(src).toMatch(/createOperatorCkMenuApi/);
    expect(src).toMatch(/\/ck-menus\//);
    expect(src).toMatch(/getCkMenuSourcePdf/);
  });
});
