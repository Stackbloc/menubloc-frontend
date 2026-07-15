import { describe, expect, it } from "vitest";
import { buildHomeDiscoverySections } from "../src/lib/homeNextSections.js";

describe("MDS-DI-01B homeNextSections title overrides", () => {
  const menus = [
    { restaurant_id: 1, menu_id: 10, restaurant_name: "A", menu_item_count: 40, cuisine: "American" },
    { restaurant_id: 2, menu_id: 11, restaurant_name: "B", menu_item_count: 30, cuisine: "Mexican", distance_miles: 1 },
    { restaurant_id: 3, menu_id: 12, restaurant_name: "C", menu_item_count: 20, cuisine: "Thai" },
    { restaurant_id: 4, menu_id: 13, restaurant_name: "D", menu_item_count: 10, cuisine: "Pizza" },
    { restaurant_id: 5, menu_id: 14, restaurant_name: "E", menu_item_count: 8, cuisine: "Burgers" },
  ];

  it("uses hardcoded titles by default (no redesign)", () => {
    const sections = buildHomeDiscoverySections(menus, { hasGeo: true });
    const popular = sections.find((s) => s.id === "popular");
    expect(popular?.title).toBe("Popular Menus");
    expect(sections.map((s) => s.id)).toContain("popular");
  });

  it("applies durable display_title overrides by stable id", () => {
    const sections = buildHomeDiscoverySections(menus, {
      hasGeo: true,
      titleOverrides: { popular: "Top Menus Nearby" },
    });
    const popular = sections.find((s) => s.id === "popular");
    expect(popular?.id).toBe("popular");
    expect(popular?.title).toBe("Top Menus Nearby");
  });

  it("keeps stable ids when titles change", () => {
    const sections = buildHomeDiscoverySections(menus, {
      hasGeo: false,
      titleOverrides: { discover: "Explore Cuisine", more: "Extra Picks" },
    });
    for (const s of sections) {
      expect(["popular", "nearby", "discover", "more"]).toContain(s.id);
    }
  });
});
