/* @vitest-environment jsdom */

/**
 * Social on the search results switch (Andre 2026-11-01): the summary view, same as the app.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchSocialSummary, { socialSummaryPeopleCount } from "../SearchSocialSummary.jsx";

const SUMMARY = {
  people_count: 3,
  available_count: 1,
  available: [{ activity_id: "current_vibe:61", consumer_user_id: 61, display_name: "Maya T.", line: "Maya T. is open for lunch too", current_vibe: "open_for_lunch", cta_label: "Invite", cta_href: "/account/invite-to-eat?restaurant_id=1" }],
  want: [{ activity_id: "want:31", kind: "want", consumer_user_id: 62, display_name: "Jordan K.", line: "Jordan K. wants this", dish_name: "Birria Taco", restaurant_id: 1, restaurant_name: "Yard House", cta_label: "Invite", cta_href: "/account/invite-to-eat?restaurant_id=1&menu_item_id=11" }],
  love: [{ activity_id: "current_vibe:70", consumer_user_id: 70, display_name: "Leo M.", line: "Leo M. is hungry too", everyone: true }],
};

const view = (summary) =>
  render(
    <MemoryRouter>
      <SearchSocialSummary summary={summary} />
    </MemoryRouter>
  );

describe("SearchSocialSummary", () => {
  it("lists Available now / Want it / Love it with people links, place links and Invite for Connects", () => {
    view(SUMMARY);
    expect(screen.getByTestId("search-social-summary").textContent).toBe("3 people · 1 available now");
    expect(screen.getByText("Available now")).toBeTruthy();
    expect(screen.getByText("Want it")).toBeTruthy();
    expect(screen.getByText("Jordan K. wants this").closest("a").getAttribute("href")).toBe("/account/connections/62");
    expect(screen.getByText("Leo M. is hungry too").closest("a").getAttribute("href")).toBe("/diners/70");
    expect(screen.getByText("Birria Taco · Yard House ›").getAttribute("href")).toBe("/restaurants/1");
    const ctas = screen.getAllByTestId("search-social-cta").map((a) => a.getAttribute("href"));
    expect(ctas).toEqual(["/account/invite-to-eat?restaurant_id=1", "/account/invite-to-eat?restaurant_id=1&menu_item_id=11"]);
  });

  it("a Connect's trip (Catch Me) reads with a plane and invites through Quick Invite", () => {
    const line = "Your Connect, Joe J., is in town. Want to invite Joe J. to catch up?";
    const href = "/account/invite-to-eat?seed_code=LDL&quick_invite=1&invite_kind=private&invitee_name=Joe+J.";
    view({ available_count: 1, available: [{ activity_id: "catch_me:81", kind: "catch_me", consumer_user_id: 81, display_name: "Joe J.", line, cta_label: "Invite", cta_href: href }], want: [], love: [] });
    expect(screen.getByText(`✈️ ${line}`)).toBeTruthy();
    expect(screen.getByTestId("search-social-cta").getAttribute("href")).toBe(href);
  });

  it("nothing → renders nothing; count falls back to unique people", () => {
    const { container } = view({ available: [], want: [], love: [] });
    expect(container.textContent).toBe("");
    expect(socialSummaryPeopleCount(null)).toBe(0);
    expect(socialSummaryPeopleCount({ want: [{ consumer_user_id: 1 }, { consumer_user_id: 1 }], love: [{ consumer_user_id: 2 }] })).toBe(2);
  });
});
