/* @vitest-environment jsdom */

import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../../context/LanguageContext.jsx";
import { ConsumerProvider } from "../../context/ConsumerContext.jsx";
import SearchResultCard from "../SearchResultCard.jsx";

// Search cards must link to canonical /restaurants/{state}/{city}/{slug} URLs whenever the
// search payload has a location: the legacy /restaurants/{slug} form costs a 301 hop
// (an extra CDN request + middleware invocation) on every crawl.

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function itemRow(overrides = {}) {
  return {
    row_type: "menu_item",
    id: 501,
    menu_item_id: 501,
    item_id: 501,
    name: "Classic Burger",
    item_name: "Classic Burger",
    menu_item_name: "Classic Burger",
    price: 12.5,
    restaurant_id: 77,
    restaurant_name: "Yard House",
    restaurant_slug: "yard-house-2",
    city: "Los Angeles",
    state: "CA",
    restaurant_city: "Los Angeles",
    restaurant_state: "CA",
    ...overrides,
  };
}

function renderGrouped({ restaurant, items }) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
  return render(
    <MemoryRouter initialEntries={["/search?q=burger"]}>
      <LanguageProvider>
        <ConsumerProvider>
          <SearchResultCard restaurant={restaurant} items={items} query="burger" />
        </ConsumerProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

function restaurantHrefs() {
  return [...document.querySelectorAll("a[href]")]
    .map((a) => a.getAttribute("href").split("?")[0])
    .filter((href) => href.startsWith("/restaurants/"));
}

describe("SearchResultCard restaurant links", () => {
  it("uses canonical header and full-menu links when the search payload has city/state", () => {
    renderGrouped({
      restaurant: { id: 77, slug: "yard-house-2", name: "Yard House", city: "Los Angeles", state: "CA" },
      items: [itemRow()],
    });

    const header = screen.getByTestId("search-result-card-header");
    const headerLink = within(header)
      .getAllByRole("link")
      .find((a) => a.getAttribute("href").startsWith("/restaurants/"));
    expect(headerLink.getAttribute("href")).toBe("/restaurants/california/los-angeles/yard-house-2");

    const hrefs = restaurantHrefs();
    expect(hrefs).toContain("/restaurants/california/los-angeles/yard-house-2/menu");
    expect(hrefs.filter((href) => /^\/restaurants\/[^/]+(\/menu)?$/.test(href))).toEqual([]);
  });

  it("recovers the location from the item rows when the restaurant prop has none", () => {
    renderGrouped({
      restaurant: { id: 77, slug: "yard-house-2", name: "Yard House" },
      items: [itemRow()],
    });

    const hrefs = restaurantHrefs();
    expect(hrefs).toContain("/restaurants/california/los-angeles/yard-house-2");
    expect(hrefs).toContain("/restaurants/california/los-angeles/yard-house-2/menu");
  });

  it("keeps a working legacy link when location data is genuinely missing", () => {
    renderGrouped({
      restaurant: { id: 77, slug: "yard-house-2", name: "Yard House" },
      items: [itemRow({ city: null, state: null, restaurant_city: null, restaurant_state: null })],
    });

    const hrefs = restaurantHrefs();
    expect(hrefs).toContain("/restaurants/yard-house-2");
    expect(hrefs.some((href) => href.includes("/undefined") || href.includes("/null"))).toBe(false);
  });
});
