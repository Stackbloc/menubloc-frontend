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
    expect(friedButton.style.borderBottom).toContain("solid");
    expect(bakedButton.style.borderBottom).toContain("solid");
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
      sourceField: "waiter_text",
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
    // priceRows: 8 rows required by buildPriceCommerceCandidates (WAITER_MIN_RESULTS=8).
    // Prices split 4 below / 4 above the $12 median threshold → utilityScore ≈ 0.36 > WAITER_STRONG_UTILITY.
    const priceRows = [
      makeRow({ id: 1, name: "Chicken Salad A", restaurantId: 1, restaurantName: "Alpha", sectionName: "Salads", price: 8, categories: ["Salads"] }),
      makeRow({ id: 2, name: "Chicken Salad B", restaurantId: 2, restaurantName: "Beta", sectionName: "Salads", price: 9, categories: ["Salads"] }),
      makeRow({ id: 3, name: "Chicken Salad C", restaurantId: 3, restaurantName: "Gamma", sectionName: "Salads", price: 10, categories: ["Salads"] }),
      makeRow({ id: 4, name: "Chicken Salad D", restaurantId: 4, restaurantName: "Delta", sectionName: "Salads", price: 11, categories: ["Salads"] }),
      makeRow({ id: 5, name: "Chicken Salad E", restaurantId: 5, restaurantName: "Epsilon", sectionName: "Salads", price: 13, categories: ["Salads"] }),
      makeRow({ id: 6, name: "Chicken Salad F", restaurantId: 6, restaurantName: "Zeta", sectionName: "Salads", price: 14, categories: ["Salads"] }),
      makeRow({ id: 7, name: "Chicken Salad G", restaurantId: 7, restaurantName: "Eta", sectionName: "Salads", price: 15, categories: ["Salads"] }),
      makeRow({ id: 8, name: "Chicken Salad H", restaurantId: 8, restaurantName: "Theta", sectionName: "Salads", price: 16, categories: ["Salads"] }),
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
});
