/* @vitest-environment jsdom */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import WaiterRefinementPrompt from "../WaiterRefinementPrompt.jsx";
import { buildWaiterOptions } from "../../../pages/GrubbidSearchResults.jsx";

function renderPrompt(refinementOptions, overrides = {}) {
  const onSelectRefinement = overrides.onSelectRefinement || vi.fn();
  const utils = render(
    <WaiterRefinementPrompt
      displayQuery={overrides.displayQuery || "chicken"}
      filteredResultCount={overrides.filteredResultCount ?? 12}
      refinementOptions={refinementOptions}
      selectedRefinement={overrides.selectedRefinement || null}
      onSelectRefinement={onSelectRefinement}
    />
  );
  return { ...utils, onSelectRefinement };
}

function makeRow({
  id,
  name,
  restaurantId,
  restaurantName,
  sectionName,
  price,
  cuisine = "American",
  categories = [],
  preparations = [],
  ingredients = [],
  canonicalFamily = null,
  foodForm = null,
  distanceMiles = null,
  hasDeal = false,
}) {
  return {
    menu_item_id: String(id),
    menu_item_name: name,
    item_name: name,
    restaurant_id: String(restaurantId),
    restaurant_name: restaurantName,
    section_name: sectionName,
    section: sectionName,
    price,
    cuisine,
    category: "Entrees",
    has_active_deal: hasDeal,
    distance_miles: distanceMiles,
    waiter_attributes: {
      categories,
      preparations,
      ingredients,
      nutrition: {
        calories: null,
        protein_g: null,
        fat_g: null,
        sodium_mg: null,
        fiber_g: null,
      },
      nutrition_labels: [],
      commerce: {
        price,
        has_deal: hasDeal,
        distance_miles: distanceMiles,
      },
      context: {
        kids_meal: false,
        canonical_family: canonicalFamily,
        food_form: foodForm,
        portion_context: null,
      },
    },
  };
}

function expectSourceValues(records) {
  expect(Array.isArray(records) && records.length > 0).toBe(true);
  expect(records.every((record) =>
    record.sourceField &&
    record.sourceValue !== undefined &&
    record.menu_item_id &&
    record.menu_item_name &&
    record.restaurant_id &&
    record.restaurant_name
  )).toBe(true);
}

describe("WaiterRefinementPrompt", () => {
  it("renders a single live option as an inline question", () => {
    const { container } = renderPrompt([{ key: "fried", label: "Fried" }], { filteredResultCount: 0 });

    expect(container.textContent).toMatch(/fried\?/i);
    expect(screen.getByRole("button", { name: /fried/i })).toBeTruthy();
    expect(container.querySelectorAll("img").length).toBe(1);
    expect(container.querySelector("img")?.src || "").toMatch(/waiter-face/i);
  });

  it("renders two options inline and keeps each option clickable", () => {
    const { container } = renderPrompt(
      [
        { key: "fried", label: "Fried" },
        { key: "baked", label: "Baked" },
      ],
      { filteredResultCount: 0 }
    );

    expect(container.textContent.replace(/\s+/g, " ").trim()).toMatch(/fried or baked\?/i);
    expect(screen.getByRole("button", { name: /fried/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /baked/i })).toBeTruthy();
  });

  it("renders three options inline", () => {
    const { container } = renderPrompt(
      [
        { key: "fried", label: "Fried" },
        { key: "baked", label: "Baked" },
        { key: "grilled", label: "Grilled" },
      ],
      { filteredResultCount: 0 }
    );

    expect(container.textContent.replace(/\s+/g, " ").trim()).toMatch(/fried, baked, or grilled\?/i);
  });

  it("filters invalid labels and hides the prompt when none survive", () => {
    const { container } = renderPrompt(
      [
        { label: "" },
        { label: " " },
        { label: "____" },
        { label: "---" },
        { label: "???" },
      ],
      { filteredResultCount: 0 }
    );

    expect(container.innerHTML).toBe("");
  });

  it("keeps valid labels and excludes invalid labels from rendering", () => {
    const { container } = renderPrompt(
      [
        { label: "" },
        { label: "____" },
        { key: "fried", label: "Fried" },
      ],
      { filteredResultCount: 0 }
    );

    expect(container.textContent).toMatch(/fried\?/i);
    expect(container.textContent).not.toMatch(/____/);
    expect(container.textContent).not.toMatch(/refine\?/i);
  });

  it("shows at most three visible options", () => {
    const { container } = renderPrompt(
      [
        { key: "fried", label: "Fried" },
        { key: "baked", label: "Baked" },
        { key: "grilled", label: "Grilled" },
        { key: "spicy", label: "Spicy" },
      ],
      { filteredResultCount: 0 }
    );

    expect(container.textContent.replace(/\s+/g, " ").trim()).toMatch(/fried, baked, or grilled\?/i);
    expect(container.textContent).not.toMatch(/spicy/i);
  });

  it("returns null when there are no options", () => {
    const { container } = renderPrompt([], { filteredResultCount: 0 });
    expect(container.innerHTML).toBe("");
  });

  it("returns null when all labels are invalid", () => {
    const { container } = renderPrompt(
      [
        { label: null },
        { label: undefined },
        { label: "---" },
      ],
      { filteredResultCount: 0 }
    );

    expect(container.innerHTML).toBe("");
  });

  it("uses the bottom-nav Waiter face icon and no alternate icon", () => {
    const { container } = renderPrompt([{ key: "fried", label: "Fried" }], { filteredResultCount: 0 });
    const img = container.querySelector("img");

    expect(container.querySelectorAll("img").length).toBe(1);
    expect(img?.src || "").toMatch(/waiter-face/i);
  });

  it("invokes the refinement callback with the clicked option", () => {
    const { container, onSelectRefinement } = renderPrompt([{ key: "fried", label: "Fried" }], {
      filteredResultCount: 0,
    });

    fireEvent.click(screen.getByRole("button", { name: /fried/i }));
    expect(onSelectRefinement).toHaveBeenCalledTimes(1);
    expect(onSelectRefinement).toHaveBeenCalledWith({ key: "fried", label: "Fried" });

    expect(container.textContent).not.toMatch(/does price matter|looking for a deal|nearby only|refine\?/i);
  });

  it("keeps option words underlined and interactive", () => {
    renderPrompt(
      [
        { key: "fried", label: "Fried" },
        { key: "baked", label: "Baked" },
      ],
      { filteredResultCount: 0 }
    );

    const friedButton = screen.getByRole("button", { name: /fried/i });
    const bakedButton = screen.getByRole("button", { name: /baked/i });

    expect(friedButton.getAttribute("role")).toBe("button");
    expect(bakedButton.getAttribute("role")).toBe("button");
    expect(friedButton.getAttribute("tabindex")).toBe("0");
    expect(bakedButton.getAttribute("tabindex")).toBe("0");
    expect(friedButton.style.cursor).toBe("pointer");
    expect(bakedButton.style.cursor).toBe("pointer");
  });

  it("shows only live-label-derived content and no fallback language", () => {
    const { container } = renderPrompt(
      [
        { label: "" },
        { label: "____" },
        { key: "fried", label: "Fried" },
      ],
      { filteredResultCount: 0, displayQuery: "chicken" }
    );

    expect(container.textContent).toMatch(/fried\?/i);
    expect(container.textContent).not.toMatch(/refine\?/i);
    expect(container.textContent).not.toMatch(/does price matter|looking for a deal|nearby only/i);
  });

  it("prefers food-form over preparation when food-form diversity exists", () => {
    const rows = [
      makeRow({
        id: 1,
        name: "Chicken Taco",
        restaurantId: 10,
        restaurantName: "Taqueria",
        sectionName: "Tacos",
        price: 12,
        categories: ["Tacos"],
      }),
      makeRow({
        id: 2,
        name: "Chicken Taco Supreme",
        restaurantId: 11,
        restaurantName: "Taqueria 2",
        sectionName: "Tacos",
        price: 13,
        categories: ["Tacos"],
      }),
      makeRow({
        id: 3,
        name: "Chicken Salad",
        restaurantId: 20,
        restaurantName: "Salad Bar",
        sectionName: "Salads",
        price: 11,
        categories: ["Salads"],
      }),
      makeRow({
        id: 4,
        name: "Chicken Caesar Salad",
        restaurantId: 21,
        restaurantName: "Salad Bar 2",
        sectionName: "Salads",
        price: 12,
        categories: ["Salads"],
      }),
      makeRow({
        id: 5,
        name: "Chicken Sandwich",
        restaurantId: 30,
        restaurantName: "Sandwich Shop",
        sectionName: "Sandwiches",
        price: 10,
        categories: ["Sandwiches"],
      }),
      makeRow({
        id: 6,
        name: "Chicken Club Sandwich",
        restaurantId: 31,
        restaurantName: "Sandwich Shop 2",
        sectionName: "Sandwiches",
        price: 14,
        categories: ["Sandwiches"],
      }),
      // Extra Taco item gives Tacos count=3 > Salads count=2 = Sandwiches count=2,
      // so count-descending order produces ["Tacos", "Salads", "Sandwiches"].
      makeRow({
        id: 7,
        name: "Chicken Street Taco",
        restaurantId: 12,
        restaurantName: "Taqueria 3",
        sectionName: "Tacos",
        price: 9,
        categories: ["Tacos"],
      }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    expect(result.dimension).toBe("form");
    expect(result.options.map((option) => option.label)).toEqual(["Tacos", "Salads", "Sandwiches"]);
    expect(result.options.every((option) => Array.isArray(option.sourceValues) && option.sourceValues.length > 0)).toBe(true);
    expect(
      result.options.every((option) =>
        option.sourceValues.every((record) =>
          record.sourceField &&
          record.sourceValue !== undefined &&
          record.menu_item_id &&
          record.menu_item_name &&
          record.restaurant_id &&
          record.restaurant_name
        )
      )
    ).toBe(true);
    expect(result.options[0].sourceValues[0]).toMatchObject({
      sourceField: "waiter_attributes.categories",
      menu_item_id: "1",
      menu_item_name: "Chicken Taco",
      restaurant_id: "10",
      restaurant_name: "Taqueria",
    });
  });

  it("does not jump to preparation when food-form diversity exists", () => {
    const rows = [
      makeRow({
        id: 1,
        name: "Chicken Taco",
        restaurantId: 10,
        restaurantName: "Taqueria",
        sectionName: "Tacos",
        price: 12,
        categories: ["Tacos"],
        preparations: ["fried"],
      }),
      makeRow({
        id: 2,
        name: "Chicken Taco Supreme",
        restaurantId: 11,
        restaurantName: "Taqueria 2",
        sectionName: "Tacos",
        price: 13,
        categories: ["Tacos"],
        preparations: ["fried"],
      }),
      makeRow({
        id: 3,
        name: "Chicken Salad",
        restaurantId: 20,
        restaurantName: "Salad Bar",
        sectionName: "Salads",
        price: 11,
        categories: ["Salads"],
        preparations: ["grilled"],
      }),
      makeRow({
        id: 4,
        name: "Chicken Caesar Salad",
        restaurantId: 21,
        restaurantName: "Salad Bar 2",
        sectionName: "Salads",
        price: 12,
        categories: ["Salads"],
        preparations: ["grilled"],
      }),
      makeRow({
        id: 5,
        name: "Chicken Sandwich",
        restaurantId: 30,
        restaurantName: "Sandwich Shop",
        sectionName: "Sandwiches",
        price: 10,
        categories: ["Sandwiches"],
        preparations: ["baked"],
      }),
      makeRow({
        id: 6,
        name: "Chicken Club Sandwich",
        restaurantId: 31,
        restaurantName: "Sandwich Shop 2",
        sectionName: "Sandwiches",
        price: 14,
        categories: ["Sandwiches"],
        preparations: ["baked"],
      }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    expect(result.dimension).toBe("form");
    expect(result.options.map((option) => option.label)).not.toEqual(["Fried", "Grilled", "Baked"]);
  });

  it("preserves provenance for price, deal, and distance candidates", () => {
    // priceRows: 15 rows required by WAITER_PRICE_MIN_RESULTS=15.
    // Prices split 7 below / 8 above the $14 median → utilityScore > WAITER_STRONG_UTILITY.
    // All categories=["Salads"] → form "salad" has count=total → filtered; price wins.
    const priceRows = [
      makeRow({ id: 1,  name: "Salad A", restaurantId: 1,  restaurantName: "R1",  sectionName: "Salads", price: 8,  categories: ["Salads"] }),
      makeRow({ id: 2,  name: "Salad B", restaurantId: 2,  restaurantName: "R2",  sectionName: "Salads", price: 9,  categories: ["Salads"] }),
      makeRow({ id: 3,  name: "Salad C", restaurantId: 3,  restaurantName: "R3",  sectionName: "Salads", price: 10, categories: ["Salads"] }),
      makeRow({ id: 4,  name: "Salad D", restaurantId: 4,  restaurantName: "R4",  sectionName: "Salads", price: 11, categories: ["Salads"] }),
      makeRow({ id: 5,  name: "Salad E", restaurantId: 5,  restaurantName: "R5",  sectionName: "Salads", price: 12, categories: ["Salads"] }),
      makeRow({ id: 6,  name: "Salad F", restaurantId: 6,  restaurantName: "R6",  sectionName: "Salads", price: 12, categories: ["Salads"] }),
      makeRow({ id: 7,  name: "Salad G", restaurantId: 7,  restaurantName: "R7",  sectionName: "Salads", price: 13, categories: ["Salads"] }),
      makeRow({ id: 8,  name: "Salad H", restaurantId: 8,  restaurantName: "R8",  sectionName: "Salads", price: 14, categories: ["Salads"] }),
      makeRow({ id: 9,  name: "Salad I", restaurantId: 9,  restaurantName: "R9",  sectionName: "Salads", price: 15, categories: ["Salads"] }),
      makeRow({ id: 10, name: "Salad J", restaurantId: 10, restaurantName: "R10", sectionName: "Salads", price: 16, categories: ["Salads"] }),
      makeRow({ id: 11, name: "Salad K", restaurantId: 11, restaurantName: "R11", sectionName: "Salads", price: 17, categories: ["Salads"] }),
      makeRow({ id: 12, name: "Salad L", restaurantId: 12, restaurantName: "R12", sectionName: "Salads", price: 18, categories: ["Salads"] }),
      makeRow({ id: 13, name: "Salad M", restaurantId: 13, restaurantName: "R13", sectionName: "Salads", price: 19, categories: ["Salads"] }),
      makeRow({ id: 14, name: "Salad N", restaurantId: 14, restaurantName: "R14", sectionName: "Salads", price: 20, categories: ["Salads"] }),
      makeRow({ id: 15, name: "Salad O", restaurantId: 15, restaurantName: "R15", sectionName: "Salads", price: 21, categories: ["Salads"] }),
    ];
    // dealRows: 8 rows with 4 deals / 4 non-deals → 50/50 entropy → utilityScore ≈ 0.36 > WAITER_STRONG_UTILITY.
    const dealRows = [
      makeRow({ id: 11, name: "Chicken Salad A", restaurantId: 11, restaurantName: "Alpha", sectionName: "Salads", price: 10, hasDeal: true, categories: ["Salads"] }),
      makeRow({ id: 12, name: "Chicken Salad B", restaurantId: 12, restaurantName: "Beta", sectionName: "Salads", price: 10, hasDeal: true, categories: ["Salads"] }),
      makeRow({ id: 13, name: "Chicken Salad C", restaurantId: 13, restaurantName: "Gamma", sectionName: "Salads", price: 10, hasDeal: true, categories: ["Salads"] }),
      makeRow({ id: 14, name: "Chicken Salad D", restaurantId: 14, restaurantName: "Delta", sectionName: "Salads", price: 10, hasDeal: true, categories: ["Salads"] }),
      makeRow({ id: 15, name: "Chicken Salad E", restaurantId: 15, restaurantName: "Epsilon", sectionName: "Salads", price: 10, categories: ["Salads"] }),
      makeRow({ id: 16, name: "Chicken Salad F", restaurantId: 16, restaurantName: "Zeta", sectionName: "Salads", price: 10, categories: ["Salads"] }),
      makeRow({ id: 17, name: "Chicken Salad G", restaurantId: 17, restaurantName: "Eta", sectionName: "Salads", price: 10, categories: ["Salads"] }),
      makeRow({ id: 18, name: "Chicken Salad H", restaurantId: 18, restaurantName: "Theta", sectionName: "Salads", price: 10, categories: ["Salads"] }),
    ];
    // distanceRows: 8 rows required by buildDistanceCommerceCandidates (WAITER_MIN_RESULTS=8).
    // 4 nearby (≤3 mi) / 4 far (>3 mi) → utilityScore ≈ 0.36 > WAITER_STRONG_UTILITY.
    const distanceRows = [
      makeRow({ id: 21, name: "Chicken Salad A", restaurantId: 21, restaurantName: "Alpha", sectionName: "Salads", price: 10, distanceMiles: 1, categories: ["Salads"] }),
      makeRow({ id: 22, name: "Chicken Salad B", restaurantId: 22, restaurantName: "Beta", sectionName: "Salads", price: 10, distanceMiles: 2, categories: ["Salads"] }),
      makeRow({ id: 23, name: "Chicken Salad C", restaurantId: 23, restaurantName: "Gamma", sectionName: "Salads", price: 10, distanceMiles: 2, categories: ["Salads"] }),
      makeRow({ id: 24, name: "Chicken Salad D", restaurantId: 24, restaurantName: "Delta", sectionName: "Salads", price: 10, distanceMiles: 3, categories: ["Salads"] }),
      makeRow({ id: 25, name: "Chicken Salad E", restaurantId: 25, restaurantName: "Epsilon", sectionName: "Salads", price: 10, distanceMiles: 4, categories: ["Salads"] }),
      makeRow({ id: 26, name: "Chicken Salad F", restaurantId: 26, restaurantName: "Zeta", sectionName: "Salads", price: 10, distanceMiles: 5, categories: ["Salads"] }),
      makeRow({ id: 27, name: "Chicken Salad G", restaurantId: 27, restaurantName: "Eta", sectionName: "Salads", price: 10, distanceMiles: 6, categories: ["Salads"] }),
      makeRow({ id: 28, name: "Chicken Salad H", restaurantId: 28, restaurantName: "Theta", sectionName: "Salads", price: 10, distanceMiles: 7, categories: ["Salads"] }),
    ];

    const priceResult = buildWaiterOptions(priceRows, "chicken");
    const dealResult = buildWaiterOptions(dealRows, "chicken");
    const distanceResult = buildWaiterOptions(distanceRows, "chicken");

    expect(priceResult.dimension).toBe("commerce");
    expectSourceValues(priceResult.options[0].sourceValues);
    expect(dealResult.dimension).toBe("commerce");
    expectSourceValues(dealResult.options[0].sourceValues);
    expect(distanceResult.dimension).toBe("commerce");
    expectSourceValues(distanceResult.options[0].sourceValues);
  });

  it("resolves form dimension from structured categories even when item text has no form term", () => {
    // Names contain no food-form words; only waiter_attributes.categories carries the form signal.
    const rows = [
      makeRow({ id: 1, name: "Special Plate A", restaurantId: 1, restaurantName: "R1", sectionName: "Mains", price: 10, categories: ["Tacos"] }),
      makeRow({ id: 2, name: "Special Plate B", restaurantId: 2, restaurantName: "R2", sectionName: "Mains", price: 10, categories: ["Tacos"] }),
      makeRow({ id: 3, name: "Special Plate C", restaurantId: 3, restaurantName: "R3", sectionName: "Mains", price: 10, categories: ["Tacos"] }),
      makeRow({ id: 4, name: "Special Plate D", restaurantId: 4, restaurantName: "R4", sectionName: "Mains", price: 12, categories: ["Salads"] }),
      makeRow({ id: 5, name: "Special Plate E", restaurantId: 5, restaurantName: "R5", sectionName: "Mains", price: 12, categories: ["Salads"] }),
      makeRow({ id: 6, name: "Special Plate F", restaurantId: 6, restaurantName: "R6", sectionName: "Mains", price: 12, categories: ["Salads"] }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    expect(result.dimension).toBe("form");
    const labels = result.options.map((o) => o.label);
    expect(labels).toContain("Tacos");
    expect(labels).toContain("Salads");
    const tacosOption = result.options.find((o) => o.label === "Tacos");
    expect(tacosOption.sourceValues[0].sourceField).toBe("waiter_attributes.categories");
  });

  it("falls back to text matching for form dimension when no structured categories are present", () => {
    // Categories are empty; form must be inferred from item text alone (text fallback path).
    const rows = [
      makeRow({ id: 1, name: "Chicken Taco", restaurantId: 1, restaurantName: "R1", sectionName: "Mains", price: 10 }),
      makeRow({ id: 2, name: "Chicken Taco Grande", restaurantId: 2, restaurantName: "R2", sectionName: "Mains", price: 10 }),
      makeRow({ id: 3, name: "Chicken Taco Special", restaurantId: 3, restaurantName: "R3", sectionName: "Mains", price: 10 }),
      makeRow({ id: 4, name: "Chicken Salad", restaurantId: 4, restaurantName: "R4", sectionName: "Mains", price: 12 }),
      makeRow({ id: 5, name: "Chicken Caesar Salad", restaurantId: 5, restaurantName: "R5", sectionName: "Mains", price: 12 }),
      makeRow({ id: 6, name: "Chicken Salad Supreme", restaurantId: 6, restaurantName: "R6", sectionName: "Mains", price: 12 }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    expect(result.dimension).toBe("form");
    const labels = result.options.map((o) => o.label);
    expect(labels).toContain("Tacos");
    expect(labels).toContain("Salads");
    const tacosOption = result.options.find((o) => o.label === "Tacos");
    expect(tacosOption.sourceValues[0].sourceField).toBe("waiter_text");
  });

  it("resolves form from food_form even when categories and item text suggest a different form", () => {
    // food_form = "taco" / "salad" on all rows, but categories = ["Sandwiches"] and item names all say "sandwich".
    // Priority 0 (food_form) must win — no Sandwiches candidate should appear.
    const rows = [
      makeRow({ id: 1, name: "Mystery Sandwich A", restaurantId: 1, restaurantName: "R1", sectionName: "Mains", price: 10, categories: ["Sandwiches"], foodForm: "taco" }),
      makeRow({ id: 2, name: "Mystery Sandwich B", restaurantId: 2, restaurantName: "R2", sectionName: "Mains", price: 10, categories: ["Sandwiches"], foodForm: "taco" }),
      makeRow({ id: 3, name: "Mystery Sandwich C", restaurantId: 3, restaurantName: "R3", sectionName: "Mains", price: 10, categories: ["Sandwiches"], foodForm: "taco" }),
      makeRow({ id: 4, name: "Mystery Sandwich D", restaurantId: 4, restaurantName: "R4", sectionName: "Mains", price: 12, categories: ["Sandwiches"], foodForm: "salad" }),
      makeRow({ id: 5, name: "Mystery Sandwich E", restaurantId: 5, restaurantName: "R5", sectionName: "Mains", price: 12, categories: ["Sandwiches"], foodForm: "salad" }),
      makeRow({ id: 6, name: "Mystery Sandwich F", restaurantId: 6, restaurantName: "R6", sectionName: "Mains", price: 12, categories: ["Sandwiches"], foodForm: "salad" }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    expect(result.dimension).toBe("form");
    const labels = result.options.map((o) => o.label);
    expect(labels).toContain("Tacos");
    expect(labels).toContain("Salads");
    expect(labels).not.toContain("Sandwiches");
    const tacosOption = result.options.find((o) => o.label === "Tacos");
    expect(tacosOption.sourceValues[0].sourceField).toBe("waiter_attributes.context.food_form");
  });

  it("falls back to categories when food_form is null", () => {
    // food_form explicitly null; categories carry the form signal (Priority 1).
    const rows = [
      makeRow({ id: 1, name: "Item A", restaurantId: 1, restaurantName: "R1", sectionName: "Mains", price: 10, categories: ["Tacos"], foodForm: null }),
      makeRow({ id: 2, name: "Item B", restaurantId: 2, restaurantName: "R2", sectionName: "Mains", price: 10, categories: ["Tacos"], foodForm: null }),
      makeRow({ id: 3, name: "Item C", restaurantId: 3, restaurantName: "R3", sectionName: "Mains", price: 10, categories: ["Tacos"], foodForm: null }),
      makeRow({ id: 4, name: "Item D", restaurantId: 4, restaurantName: "R4", sectionName: "Mains", price: 12, categories: ["Salads"], foodForm: null }),
      makeRow({ id: 5, name: "Item E", restaurantId: 5, restaurantName: "R5", sectionName: "Mains", price: 12, categories: ["Salads"], foodForm: null }),
      makeRow({ id: 6, name: "Item F", restaurantId: 6, restaurantName: "R6", sectionName: "Mains", price: 12, categories: ["Salads"], foodForm: null }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    expect(result.dimension).toBe("form");
    const tacosOption = result.options.find((o) => o.label === "Tacos");
    expect(tacosOption).toBeTruthy();
    expect(tacosOption.sourceValues[0].sourceField).toBe("waiter_attributes.categories");
  });

  it("uses text fallback when food_form is null and categories are empty", () => {
    // food_form = null, categories = [] on all rows — form must come from item text (Priority 3).
    const rows = [
      makeRow({ id: 1, name: "Chicken Taco", restaurantId: 1, restaurantName: "R1", sectionName: "Mains", price: 10, foodForm: null }),
      makeRow({ id: 2, name: "Chicken Taco Plate", restaurantId: 2, restaurantName: "R2", sectionName: "Mains", price: 10, foodForm: null }),
      makeRow({ id: 3, name: "Taco Deluxe", restaurantId: 3, restaurantName: "R3", sectionName: "Mains", price: 10, foodForm: null }),
      makeRow({ id: 4, name: "Chicken Salad", restaurantId: 4, restaurantName: "R4", sectionName: "Mains", price: 12, foodForm: null }),
      makeRow({ id: 5, name: "Caesar Salad", restaurantId: 5, restaurantName: "R5", sectionName: "Mains", price: 12, foodForm: null }),
      makeRow({ id: 6, name: "Grilled Chicken Salad", restaurantId: 6, restaurantName: "R6", sectionName: "Mains", price: 12, foodForm: null }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    expect(result.dimension).toBe("form");
    const tacosOption = result.options.find((o) => o.label === "Tacos");
    expect(tacosOption).toBeTruthy();
    expect(tacosOption.sourceValues[0].sourceField).toBe("waiter_text");
  });

  // ── Phase 4 regression tests ────────────────────────────────────────────────

  it("(A) Diced chicken items with correct preparations never produce an 'Iced' option", () => {
    // Regression for Diced→Iced substring bug (shaping.js inferPreparationsFromText).
    // Backend fix: word-boundary regex prevents "iced" matching inside "diced".
    // These rows simulate the FIXED backend: preparations=["fried"], NOT ["fried","iced"].
    const rows = [
      makeRow({ id: 1, name: "Diced Chicken w/ Fried Rice",  restaurantId: 1, restaurantName: "R1", sectionName: "Entrees", price: 12, preparations: ["fried"] }),
      makeRow({ id: 2, name: "Diced Chicken Bowl",            restaurantId: 2, restaurantName: "R2", sectionName: "Entrees", price: 13, preparations: ["fried"] }),
      makeRow({ id: 3, name: "Diced Chicken Stir Fry",        restaurantId: 3, restaurantName: "R3", sectionName: "Entrees", price: 14, preparations: ["fried"] }),
      makeRow({ id: 4, name: "Grilled Chicken Sandwich",      restaurantId: 4, restaurantName: "R4", sectionName: "Mains",   price: 10, preparations: ["grilled"], categories: ["Sandwiches"] }),
      makeRow({ id: 5, name: "Grilled Chicken Sandwich Dlx",  restaurantId: 5, restaurantName: "R5", sectionName: "Mains",   price: 11, preparations: ["grilled"], categories: ["Sandwiches"] }),
      makeRow({ id: 6, name: "Grilled Chicken Club",          restaurantId: 6, restaurantName: "R6", sectionName: "Mains",   price: 12, preparations: ["grilled"], categories: ["Sandwiches"] }),
      makeRow({ id: 7, name: "Spicy Chicken Soup",            restaurantId: 7, restaurantName: "R7", sectionName: "Soups",   price: 9,  preparations: ["spicy"],   categories: ["Soups"] }),
      makeRow({ id: 8, name: "Chicken Noodle Soup",           restaurantId: 8, restaurantName: "R8", sectionName: "Soups",   price: 8,  preparations: [],           categories: ["Soups"] }),
      makeRow({ id: 9, name: "Chicken Tortilla Soup",         restaurantId: 9, restaurantName: "R9", sectionName: "Soups",   price: 7,  preparations: [],           categories: ["Soups"] }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    const allLabels = (result?.options || []).map((o) => o.label.toLowerCase());
    expect(allLabels.every((l) => l !== "iced")).toBe(true);
  });

  it("(B) Items with 'diced' in name never produce a 'Diced' text-feature refinement", () => {
    // Regression for cut/shape words appearing as Waiter options.
    // "diced" is in WAITER_STOP_WORDS → must be suppressed from text-feature candidates.
    const rows = [
      makeRow({ id: 1, name: "Diced Chicken Bowl",  restaurantId: 1, restaurantName: "R1", sectionName: "Mains", price: 10, categories: ["Bowls"] }),
      makeRow({ id: 2, name: "Diced Steak Bowl",    restaurantId: 2, restaurantName: "R2", sectionName: "Mains", price: 11, categories: ["Bowls"] }),
      makeRow({ id: 3, name: "Diced Pork Bowl",     restaurantId: 3, restaurantName: "R3", sectionName: "Mains", price: 12, categories: ["Bowls"] }),
      makeRow({ id: 4, name: "Diced Veggie Bowl",   restaurantId: 4, restaurantName: "R4", sectionName: "Mains", price: 13, categories: ["Bowls"] }),
      makeRow({ id: 5, name: "Diced Chicken Taco",  restaurantId: 5, restaurantName: "R5", sectionName: "Mains", price: 10, categories: ["Tacos"] }),
      makeRow({ id: 6, name: "Diced Steak Taco",    restaurantId: 6, restaurantName: "R6", sectionName: "Mains", price: 11, categories: ["Tacos"] }),
      makeRow({ id: 7, name: "Diced Pork Taco",     restaurantId: 7, restaurantName: "R7", sectionName: "Mains", price: 12, categories: ["Tacos"] }),
      makeRow({ id: 8, name: "Diced Veggie Taco",   restaurantId: 8, restaurantName: "R8", sectionName: "Mains", price: 13, categories: ["Tacos"] }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    const allKeys   = (result?.options || []).map((o) => o.key.toLowerCase());
    const allLabels = (result?.options || []).map((o) => o.label.toLowerCase());
    expect(allKeys.every((k) => k !== "diced")).toBe(true);
    expect(allLabels.every((l) => l !== "diced")).toBe(true);
  });

  it("(C) 9 salad results → no price question (below WAITER_PRICE_MIN_RESULTS=15)", () => {
    // Regression for "salad" search showing "Under $21?" with only 9 results.
    // WAITER_PRICE_MIN_RESULTS=15 blocks price when inventory < 15.
    // Form "salad" is also suppressed because it matches the query token.
    const rows = Array.from({ length: 9 }, (_, i) =>
      makeRow({ id: i + 1, name: `Salad ${i + 1}`, restaurantId: i + 1, restaurantName: `R${i + 1}`, sectionName: "Salads", price: 8 + i, categories: ["Salads"] })
    );

    const result = buildWaiterOptions(rows, "salad");

    expect(result?.dimension).not.toBe("commerce");
  });

  it("(D) 12 burger results → no price question (below WAITER_PRICE_MIN_RESULTS=15)", () => {
    // Regression for "burger" search showing "Under $14?" with only 12 results.
    // Same as test C: 12 < WAITER_PRICE_MIN_RESULTS=15.
    const rows = Array.from({ length: 12 }, (_, i) =>
      makeRow({ id: i + 1, name: `Burger ${i + 1}`, restaurantId: i + 1, restaurantName: `R${i + 1}`, sectionName: "Burgers", price: 8 + i, categories: ["Burgers"] })
    );

    const result = buildWaiterOptions(rows, "burger");

    expect(result?.dimension).not.toBe("commerce");
  });

  it("(E) 30 burger results → price question is allowed (meets WAITER_PRICE_MIN_RESULTS=15)", () => {
    // Inverse of test D: 30 rows ≥ 15 → price candidates qualify.
    // Form "burger" is suppressed by the query token → commerce wins.
    const rows = Array.from({ length: 30 }, (_, i) =>
      makeRow({ id: i + 1, name: `Burger ${i + 1}`, restaurantId: i + 1, restaurantName: `R${i + 1}`, sectionName: "Burgers", price: 8 + i, categories: ["Burgers"] })
    );

    const result = buildWaiterOptions(rows, "burger");

    expect(result?.dimension).toBe("commerce");
  });

  it("(F) form dimension wins over preparation even when preparation has higher raw utility", () => {
    // Regression for hierarchy violation: food form must beat preparation when both qualify.
    // selectWaiterGroup explicitly promotes form/canonical_family groups above preparation/ingredient/text.
    // Scenario: 4 sandwiches (preparations=fried) vs 4 bowls (preparations=grilled).
    // Preparation raw utility ≈ 0.5; form utility ≈ 0.5 — form wins because of explicit promotion.
    const rows = [
      makeRow({ id: 1, name: "Fried Chicken Sandwich",  restaurantId: 1, restaurantName: "R1", sectionName: "Mains", price: 10, foodForm: "sandwich", preparations: ["fried"] }),
      makeRow({ id: 2, name: "Fried Chicken Sandwich B", restaurantId: 2, restaurantName: "R2", sectionName: "Mains", price: 11, foodForm: "sandwich", preparations: ["fried"] }),
      makeRow({ id: 3, name: "Fried Chicken Sandwich C", restaurantId: 3, restaurantName: "R3", sectionName: "Mains", price: 12, foodForm: "sandwich", preparations: ["fried"] }),
      makeRow({ id: 4, name: "Fried Chicken Sandwich D", restaurantId: 4, restaurantName: "R4", sectionName: "Mains", price: 13, foodForm: "sandwich", preparations: ["fried"] }),
      makeRow({ id: 5, name: "Grilled Chicken Bowl",    restaurantId: 5, restaurantName: "R5", sectionName: "Mains", price: 10, foodForm: "bowl",     preparations: ["grilled"] }),
      makeRow({ id: 6, name: "Grilled Chicken Bowl B",  restaurantId: 6, restaurantName: "R6", sectionName: "Mains", price: 11, foodForm: "bowl",     preparations: ["grilled"] }),
      makeRow({ id: 7, name: "Grilled Chicken Bowl C",  restaurantId: 7, restaurantName: "R7", sectionName: "Mains", price: 12, foodForm: "bowl",     preparations: ["grilled"] }),
      makeRow({ id: 8, name: "Grilled Chicken Bowl D",  restaurantId: 8, restaurantName: "R8", sectionName: "Mains", price: 13, foodForm: "bowl",     preparations: ["grilled"] }),
    ];

    const result = buildWaiterOptions(rows, "chicken");

    expect(result?.dimension).toBe("form");
    const labels = (result?.options || []).map((o) => o.label);
    expect(labels).toContain("Sandwiches");
    expect(labels).toContain("Bowls");
    expect(labels).not.toContain("Fried");
    expect(labels).not.toContain("Grilled");
  });
});
