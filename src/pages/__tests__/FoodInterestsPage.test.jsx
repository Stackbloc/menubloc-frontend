/* @vitest-environment jsdom */

import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LikedRecommendationTopicCard } from "../FoodInterestsPage.jsx";
import {
  groupLikedRecommendations,
  groupNewRestaurantRecommendations,
} from "../../lib/waiterRecommendations.js";

afterEach(cleanup);

describe("Waiter liked-dish recommendation topic", () => {
  it("renders one topic heading and groups duplicate restaurant headers by restaurant_id", () => {
    const rows = [
      { type: "liked_signal", restaurant_id: 10, restaurant_name: "Chick-fil-A", menu_item_id: 101, title: "Spicy Chicken Biscuit", link: "/dish/101", link_label: "View dish →" },
      { type: "liked_signal", restaurant_id: 10, restaurant_name: "Chick-fil-A", menu_item_id: 102, title: "Chicken Biscuit", link: "/dish/102", link_label: "View dish →" },
      { type: "liked_signal", restaurant_id: 20, restaurant_name: "Waffle House", menu_item_id: 201, title: "2 Egg Breakfast", link: "/dish/201", link_label: "View dish →" },
    ];
    const topic = {
      label: "Based on dishes you like",
      restaurants: groupLikedRecommendations(rows),
    };

    render(
      <MemoryRouter>
        <LikedRecommendationTopicCard topic={topic} />
      </MemoryRouter>
    );

    const module = screen.getByTestId("liked-recommendation-topic");
    const heading = within(module).getByText("Based on dishes you like");
    expect(heading.style.color).toBe("rgb(134, 239, 172)");
    expect(within(module).getAllByText("Chick-fil-A")).toHaveLength(1);
    expect(within(module).getAllByText("Waffle House")).toHaveLength(1);
    expect(within(module).queryByText("View dish →")).toBeNull();
    expect(within(module).getByRole("link", { name: "Spicy Chicken Biscuit" }).getAttribute("href")).toBe("/dish/101");
    expect(within(module).getByRole("link", { name: "Chicken Biscuit" }).getAttribute("href")).toBe("/dish/102");
    expect(within(module).getByRole("link", { name: "2 Egg Breakfast" }).getAttribute("href")).toBe("/dish/201");

    const text = module.textContent;
    expect(text.indexOf("Spicy Chicken Biscuit")).toBeLessThan(text.indexOf("Chicken Biscuit"));
    expect(text.indexOf("Chicken Biscuit")).toBeLessThan(text.indexOf("Waffle House"));
  });
});

describe("Waiter recently-added restaurant topic", () => {
  it("groups multiple new_restaurant rows into one topic with shared label", () => {
    const rows = [
      {
        type: "new_restaurant",
        label: "Recently added restaurant",
        title: "McDonald's",
        detail: "Burgers",
        link: "/restaurants/mcdonalds",
        link_label: "View restaurant →",
      },
      {
        type: "new_restaurant",
        label: "Recently added restaurant",
        title: "Taco Bell",
        detail: "Mexican",
        link: "/restaurants/taco-bell",
        link_label: "View restaurant →",
      },
    ];
    const topic = groupNewRestaurantRecommendations(rows);
    expect(topic.label).toBe("Recently added restaurant");
    expect(topic.restaurants).toHaveLength(2);
    expect(topic.restaurants[0].title).toBe("McDonald's");
    expect(topic.restaurants[1].title).toBe("Taco Bell");
  });
});
