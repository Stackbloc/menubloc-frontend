/* @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FeedPlaceCaption, { feedClipExtraDishes } from "../FeedPlaceCaption.jsx";
import { clipDishesFromMenu } from "../../../../pages/operator/OperatorFeedVideoPage.jsx";

// Andre 2026-11-04: owner/operator clips feature up to 3 dishes, shown on the Feed video.
const clip = {
  kind: "ate",
  source_id: 7,
  restaurant_id: 12,
  restaurant_name: "Taco Stand",
  restaurant_slug: "taco-stand",
  restaurant_city: "Costa Mesa",
  restaurant_state: "CA",
  menu_item_id: 10,
  item_name: "Taco",
  food_name: "Taco",
  menu_items: [
    { id: 10, name: "Taco" },
    { id: 11, name: "Horchata" },
    { id: 12, name: "Churros" },
  ],
};

describe("Feed clip dish tags", () => {
  it("lists the 2nd and 3rd dish, never the main one or a 4th", () => {
    expect(feedClipExtraDishes(clip)).toEqual([
      { id: 11, name: "Horchata" },
      { id: 12, name: "Churros" },
    ]);
    expect(feedClipExtraDishes({ ...clip, menu_items: [...clip.menu_items, { id: 13, name: "Flan" }] })).toHaveLength(2);
    expect(feedClipExtraDishes({ menu_item_id: 1, menu_items: [{ id: 1, name: "A" }] })).toEqual([]);
  });

  it("shows the extra dishes under the main dish and opens the menu", () => {
    const onOpenMenu = vi.fn();
    render(
      <MemoryRouter>
        <FeedPlaceCaption item={clip} onOpenMenu={onOpenMenu} />
      </MemoryRouter>
    );
    const tags = screen.getAllByTestId("feed-video-extra-dish");
    expect(tags.map((t) => t.textContent)).toEqual(["Horchata", "Churros"]);
    fireEvent.click(tags[1]);
    expect(onOpenMenu).toHaveBeenCalledTimes(1);
  });

  it("a one-dish clip shows no extra tags", () => {
    render(
      <MemoryRouter>
        <FeedPlaceCaption item={{ ...clip, menu_items: [{ id: 10, name: "Taco" }] }} />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("feed-video-extra-dishes")).toBeNull();
  });
});

describe("operator clip dish list", () => {
  it("keeps this restaurant's dishes with CK ids, once each", () => {
    const menu = {
      sections: [
        { items: [{ ck_menu_item_id: 5, name: "Taco", restaurant_id: 1 }, { ck_menu_item_id: null, name: "No id", restaurant_id: 1 }] },
        { items: [{ ck_menu_item_id: 5, name: "Taco", restaurant_id: 1 }, { ck_menu_item_id: 6, name: "Other store", restaurant_id: 2 }, { ck_menu_item_id: 7, name: "Flan", restaurant_id: 1 }] },
      ],
    };
    expect(clipDishesFromMenu(menu, 1)).toEqual([
      { id: 5, name: "Taco" },
      { id: 7, name: "Flan" },
    ]);
  });
});
