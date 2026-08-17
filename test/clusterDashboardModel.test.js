import { describe, expect, it } from "vitest";
import {
  buildHotspots,
  buildPopularItems,
  buildWhoIsEatingComments,
  HOTSPOT_LIMIT,
} from "../src/lib/clusterDashboardModel.js";

describe("cluster dashboard model", () => {
  it("caps hotspots at 10 and excludes dining halls", () => {
    const activityItems = Array.from({ length: 12 }, (_, i) => ({
      restaurant_id: i + 1,
      restaurant_name: `Spot ${i + 1}`,
      restaurant_slug: `spot-${i + 1}`,
      share_kind: "place",
      people_shared_count: 12 - i,
      people_shared_label: `${12 - i} people shared this`,
    }));
    activityItems.push({
      restaurant_id: 99,
      restaurant_name: "De Neve",
      restaurant_type: "dining_hall",
      share_kind: "place",
      people_shared_count: 99,
    });
    const { items, moreCount } = buildHotspots({ activityItems });
    expect(items).toHaveLength(HOTSPOT_LIMIT);
    expect(moreCount).toBe(2);
    expect(items.some((row) => /De Neve/i.test(row.restaurant_name))).toBe(false);
  });

  it("popular items skip dining-hall SKUs and place shares", () => {
    const items = buildPopularItems([
      {
        menu_item_id: 1,
        item_name: "Hall pizza",
        restaurant_type: "dining_hall",
        share_kind: "dish",
      },
      {
        restaurant_id: 2,
        restaurant_name: "Place only",
        share_kind: "place",
      },
      {
        menu_item_id: 3,
        item_name: "Burger",
        restaurant_name: "Fixins",
        share_kind: "dish",
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].item_name).toBe("Burger");
  });

  it("drops comments that repeat hotspot lines", () => {
    const comments = buildWhoIsEatingComments({
      hotspotComments: ["Busy at Trojans"],
      statuses: [
        { id: 1, display_line: "Busy at Trojans", display_name: "A" },
        { id: 2, display_line: "Short line at Cava", display_name: "B" },
      ],
    });
    expect(comments).toHaveLength(1);
    expect(comments[0].display_line).toMatch(/Cava/);
  });
});
