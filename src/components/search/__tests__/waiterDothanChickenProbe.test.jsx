/* @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  buildWaiterOptions,
  buildWaiterDebugGroups,
  buildContextAwareRefinementOptions,
  applyWaiterRefinementStackToRows,
} from "../../../pages/GrubbidSearchResults.jsx";

// Snapshot of production GET /public/search?q=chicken&city=Dothan&state=AL (2026-06-26)
const DOTHAN_CHICKEN_ROWS = [
  { name: "Grilled Chicken Sandwich", waiter_attributes: { categories: ["sandwich", "entree"], context: { food_form: "sandwich" } }, menu_item_id: "1", restaurant_id: "1", restaurant_name: "A" },
  { name: "Grilled Chicken Sandwich", waiter_attributes: { categories: ["sandwich", "entree"], context: { food_form: "sandwich" } }, menu_item_id: "2", restaurant_id: "2", restaurant_name: "B" },
  { name: "Grilled Chicken Tenders", waiter_attributes: { categories: ["Kids Menu"] }, menu_item_id: "3", restaurant_id: "3", restaurant_name: "C" },
  { name: "TRUCK STOP CHICKEN", waiter_attributes: { categories: ["sandwich", "entree", "SANDWICHES + WRAPS"], context: { food_form: "sandwich" } }, menu_item_id: "4", restaurant_id: "4", restaurant_name: "D" },
  { name: "Chicken Parmesan", waiter_attributes: { categories: ["sandwich", "entree", "Entrees"], context: { food_form: "sandwich" } }, menu_item_id: "5", restaurant_id: "5", restaurant_name: "E" },
  { name: "Tuscani Chicken Pasta", waiter_attributes: { categories: ["pasta", "entree"], context: { food_form: "pasta" } }, menu_item_id: "6", restaurant_id: "6", restaurant_name: "F" },
  { name: "Wood Fired Chicken Panini", waiter_attributes: { categories: ["sandwich", "entree", "Sandwiches"], context: { food_form: "sandwich" } }, menu_item_id: "7", restaurant_id: "7", restaurant_name: "G" },
  { name: "Orbit Chicken Stack", waiter_attributes: { categories: ["Entrees"] }, menu_item_id: "8", restaurant_id: "8", restaurant_name: "H" },
  { name: "Fried Chicken Tenders", waiter_attributes: { categories: ["breaded_chicken", "entree", "Kids Menu"], context: { food_form: "breaded_chicken" } }, menu_item_id: "9", restaurant_id: "9", restaurant_name: "I" },
  { name: "CHICKEN CAESAR WRAP", waiter_attributes: { categories: ["salad", "entree", "SANDWICHES + WRAPS"], context: { food_form: "salad" } }, menu_item_id: "10", restaurant_id: "10", restaurant_name: "J" },
  { name: "Southern Fried Chicken", waiter_attributes: { categories: ["sandwich", "entree", "Signature Fried Chicken"], context: { food_form: "sandwich" } }, menu_item_id: "11", restaurant_id: "11", restaurant_name: "K" },
  { name: "CHICKEN & WAFFLES", waiter_attributes: { categories: ["sandwich", "entree", "PLATES"], context: { food_form: "sandwich" } }, menu_item_id: "12", restaurant_id: "12", restaurant_name: "L" },
].map((row) => ({
  ...row,
  menu_item_name: row.name,
  item_name: row.name,
}));

describe("waiter Dothan chicken probe", () => {
  it("documents evidence-based form selection for production-shaped rows", () => {
    const debug = buildWaiterDebugGroups(DOTHAN_CHICKEN_ROWS, "chicken");
    const result = buildWaiterOptions(DOTHAN_CHICKEN_ROWS, "chicken");
    const display = buildContextAwareRefinementOptions(result.options, "chicken", result.inventory);

    const formGroup = debug.groups.find((g) => g.dimension === "form");
    expect(formGroup).toBeTruthy();
    expect(result.dimension).toBe("form");
    expect(result.options.map((o) => `${o.label}:${o.count}`)).toEqual(["Sandwiches:7", "Salads:1"]);
    expect(display.map((o) => o.label)).toEqual(["Sandwich", "Salad", "Something Else"]);
  });

  it("narrows to sandwich items only when user selects Sandwich (display option)", () => {
    const result = buildWaiterOptions(DOTHAN_CHICKEN_ROWS, "chicken");
    const display = buildContextAwareRefinementOptions(result.options, "chicken", result.inventory);
    const sandwich = display.find((option) => option.label === "Sandwich");
    expect(sandwich).toBeTruthy();
    expect(typeof sandwich.test).toBe("function");

    const narrowed = applyWaiterRefinementStackToRows(DOTHAN_CHICKEN_ROWS, result.inventory, [sandwich]);
    const names = narrowed.map((row) => row.name).sort();

    expect(names).not.toContain("Tuscani Chicken Pasta");
    expect(names).not.toContain("CHICKEN CAESAR WRAP");
    expect(names).not.toContain("Orbit Chicken Stack");
    expect(names).toContain("Grilled Chicken Sandwich");
    expect(names).toContain("TRUCK STOP CHICKEN");
    expect(narrowed).toHaveLength(7);
  });
});
