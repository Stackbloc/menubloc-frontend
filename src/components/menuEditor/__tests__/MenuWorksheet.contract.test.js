/**
 * Menu Worksheet contract — columns, dual CTAs, no formula chrome.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  applyBulkPriceOp,
  deriveSectionList,
  detectLargeMenuplyPriceChanges,
  formatLargePriceChangeWarning,
  WORKSHEET_PRIVATE_PRICE_FIELDS,
  WORKSHEET_PUBLISH_FIELDS,
} from "../../../lib/menuWorksheetHelpers.js";
import { WORKSHEET_COLUMNS } from "../MenuWorksheet.jsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../.."); // menubloc-frontend/src

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("Menu Worksheet helpers", () => {
  it("derives unique sections ignoring case/space", () => {
    expect(deriveSectionList(["Entrees", "entrees", "Drinks"])).toEqual(["Drinks", "Entrees"]);
  });

  it("bulk tools copy A/B/C to Menuply Price", () => {
    const rows = [{ id: 1, price_a: 5, price_b: 6, price_c: 7, menuply_price: 1 }];
    expect(applyBulkPriceOp(rows, { mode: "copy_a_to_menuply" })[0].menuply_price).toBe(5);
  });

  it("bulk % ops target Row A/B/C price fields", () => {
    const rows = [{ id: 1, price_a: 10, price_b: 20, price_c: 30, menuply_price: 40 }];
    expect(
      applyBulkPriceOp(rows, { mode: "increase_pct", amount: 10, priceField: "price_a" })[0].price_a
    ).toBe(11);
    expect(
      applyBulkPriceOp(rows, { mode: "increase_pct", amount: 10, priceField: "price_a" })[0]
        .menuply_price
    ).toBe(40);
    expect(
      applyBulkPriceOp(rows, { mode: "decrease_dollar", amount: 1, priceField: "price_b" })[0]
        .price_b
    ).toBe(19);
  });

  it("detects Menuply price moves greater than 40%", () => {
    const base = [{ id: 1, item_name: "Burger", menuply_price: 10 }];
    const next = [{ id: 1, item_name: "Burger", menuply_price: 15 }];
    const changes = detectLargeMenuplyPriceChanges(base, next);
    expect(changes).toHaveLength(1);
    expect(formatLargePriceChangeWarning(changes[0])).toBe(
      "Warning Burger price increase greater than 40% confirm."
    );
  });

  it("publish fields exclude private prices", () => {
    expect(WORKSHEET_PUBLISH_FIELDS).toContain("menuply_price");
    expect(WORKSHEET_PRIVATE_PRICE_FIELDS).toEqual(["price_a", "price_b", "price_c"]);
  });
});

describe("Menu Worksheet UI contract", () => {
  const src = read("components/menuEditor/MenuWorksheet.jsx");
  const page = read("pages/operator/OperatorMenuWorksheetPage.jsx");
  const layout = read("pages/operator/OperatorLayout.jsx");
  const pdf = read("pages/PdfUploadPage.jsx");
  const app = read("App.jsx");

  it("exposes the seven required columns", () => {
    expect(WORKSHEET_COLUMNS).toEqual([
      "Menu Item",
      "Section",
      "Description",
      "Price A",
      "Price B",
      "Price C",
      "Menuply Price",
    ]);
  });

  it("has Save Worksheet and Update Menuply Menu actions", () => {
    expect(src).toMatch(/Save Worksheet/);
    expect(src).toMatch(/Update Menuply Menu/);
    expect(src).toMatch(/data-testid="worksheet-save"/);
    expect(src).toMatch(/data-testid="worksheet-publish"/);
  });

  it("bulk scope is All rows / Row A / Row B / Row C without selected-rows checkboxes", () => {
    expect(src).toMatch(/value="all">All rows</);
    expect(src).toMatch(/value="row_a">Row A</);
    expect(src).toMatch(/value="row_b">Row B</);
    expect(src).toMatch(/value="row_c">Row C</);
    expect(src).not.toMatch(/Selected rows/);
    expect(src).not.toMatch(/toggleSelect|Select all rows/);
    expect(src).toMatch(/data-testid="worksheet-undo"/);
    expect(src).toMatch(/Alt name/);
  });

  it("operator layout closes Knowledge Base by default on worksheet routes only", () => {
    expect(layout).toMatch(/onWorksheet/);
    expect(layout).toMatch(/menu-worksheet/);
    expect(layout).toMatch(/setKnowledgeOpen\(false\)/);
  });

  it("does not include spreadsheet formula chrome", () => {
    expect(src).not.toMatch(/SUM\(/i);
    expect(src).not.toMatch(/\bformula\b/i);
    expect(src).not.toMatch(/VLOOKUP|Excel|cell formula/i);
  });

  it("registers worksheet route and auto-navigates after operator parse", () => {
    expect(app).toMatch(/menus\/:menuId\/worksheet/);
    expect(app).toMatch(/OperatorMenuWorksheetPage/);
    expect(pdf).toMatch(/menus\/\$\{publicMenuId\}\/worksheet/);
    expect(pdf).toMatch(/opening worksheet/);
  });

  it("page wires save vs publish APIs and 40% price warnings", () => {
    expect(page).toMatch(/saveMenuWorksheet/);
    expect(page).toMatch(/publishMenuWorksheet/);
    expect(page).toMatch(/getMenuWorksheet/);
    expect(page).toMatch(/detectLargeMenuplyPriceChanges/);
    expect(page).toMatch(/formatLargePriceChangeWarning/);
  });
});
