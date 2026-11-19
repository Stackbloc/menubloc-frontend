/* @vitest-environment jsdom */

/**
 * Unified search under Search → Social — web (2026-11-19, same as app 65cbffb).
 * Social radio: Available now · People · Want it · Love it. Events radio: Open Invites · Plans · Events.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchSocialSummary, { socialViewCount } from "../SearchSocialSummary.jsx";
import SearchEventsView, { eventsViewCount } from "../SearchEventsView.jsx";
import { parseSearchSocial, searchSocialUrl } from "../../../lib/searchSocial.js";

const BODY = {
  ok: true,
  plans: [
    { key: "eating_plan:5", source: "eating_plan", ref: "5", action: "ask", title: "Tacos", date: "2026-11-20", time: "19:00", place: { name: "Guisados" }, peer: { id: 61, name: "Maya" }, href: "/account/plans/5" },
    { key: "bad", action: "none", title: "Invite only" },
  ],
  events: [
    { key: "venue_event:9", kind: "venue_event", title: "Taco Night", slug: "taco-night", date: "2026-11-21", time: "19:00", place_name: "Guisados" },
    { key: "diner_event:3", kind: "diner_event", title: "Taco crawl", token: "abc", date: "2026-11-22", time_label: "7ish" },
    { key: "no-link", kind: "venue_event", title: "Missing slug" },
  ],
  people: [
    { id: 61, name: "Maya T.", vibe: "Hungry Now - Tacos", is_connect: true },
    { id: 80, name: "Sam R.", location_label: "Los Angeles, CA", is_connect: false },
  ],
};

const SUMMARY = {
  people_count: 1,
  available_count: 1,
  available: [{ activity_id: "current_vibe:61", consumer_user_id: 61, display_name: "Maya T.", line: "Maya T. is hungry too", current_vibe: "hungry" }],
  want: [],
  love: [],
};

const view = (summary, groups) =>
  render(
    <MemoryRouter>
      <SearchSocialSummary summary={summary} groups={groups} />
    </MemoryRouter>
  );

describe("searchSocial lib", () => {
  it("drops rows people can't act on or open", () => {
    const g = parseSearchSocial(BODY);
    expect(g.plans.map((p) => p.key)).toEqual(["eating_plan:5"]);
    expect(g.events.map((e) => e.key)).toEqual(["venue_event:9", "diner_event:3"]);
    expect(g.people.map((p) => p.id)).toEqual([61, 80]);
  });

  it("sends the words, the top restaurants and the same place as the food search", () => {
    const u = new URL(searchSocialUrl("https://api.test", "tacos", { lat: 34.02, lng: -118.28 }, [3, "4", 3, 0, null]));
    expect(u.pathname).toBe("/search/social");
    expect(u.searchParams.get("q")).toBe("tacos");
    expect(u.searchParams.get("restaurant_ids")).toBe("3,4");
    expect(u.searchParams.get("lat")).toBe("34.02");
    const c = new URL(searchSocialUrl("https://api.test", "boba", { city: "Los Angeles", state: "CA" }, []));
    expect(c.searchParams.get("city")).toBe("Los Angeles");
    expect(c.searchParams.has("restaurant_ids")).toBe(false);
  });
});

describe("Search → Social and Events radios (Andre 2026-11-19)", () => {
  const renderIn = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

  it("Social: Available now then People, each person once; no plans or events", () => {
    const groups = parseSearchSocial(BODY);
    renderIn(<SearchSocialSummary summary={SUMMARY} groups={groups} />);
    const order = Array.from(document.querySelectorAll("[data-testid^='search-social-']")).map((el) => el.getAttribute("data-testid"));
    expect(order.filter((t) => ["search-social-available", "search-social-people"].includes(t))).toEqual(["search-social-available", "search-social-people"]);
    expect(screen.queryByTestId("search-social-plans")).toBeNull();
    expect(screen.queryByTestId("search-social-events")).toBeNull();
    // Maya is in Available now already, so People lists only Sam.
    expect(screen.queryByTestId("search-person-61")).toBeNull();
    expect(screen.getByTestId("search-person-80").textContent).toContain("Sam R. · Los Angeles, CA");
    expect(screen.getByTestId("search-person-80-connect").getAttribute("href")).toBe("/diners/80");
    // 1 food-line person + 1 new person.
    expect(socialViewCount(SUMMARY, groups)).toBe(2);
  });

  it("Events: Open Invites · Plans · Events, counted together", () => {
    const groups = parseSearchSocial(BODY);
    const summary = { ...SUMMARY, open_invites: [] };
    renderIn(<SearchEventsView summary={summary} groups={groups} />);
    const order = Array.from(document.querySelectorAll("[data-testid='search-social-plans'], [data-testid='search-social-events']")).map((el) => el.getAttribute("data-testid"));
    expect(order).toEqual(["search-social-plans", "search-social-events"]);
    expect(screen.getByTestId("search-plan-eating_plan:5").textContent).toContain("Maya · Tacos at Guisados · Fri, Nov 20 · 7:00 PM");
    expect(screen.getByTestId("search-plan-eating_plan:5-action").textContent).toBe("Ask to Join");
    expect(screen.getByTestId("search-event-venue_event:9").getAttribute("href")).toBe("/events/taco-night");
    expect(screen.getByTestId("search-event-diner_event:3").getAttribute("href")).toBe("/join-event/abc");
    expect(screen.getByTestId("search-event-diner_event:3").textContent).toContain("7ish");
    expect(eventsViewCount(summary, groups)).toBe(3);
    expect(eventsViewCount({ open_invites: [{ id: 1 }, { id: 2 }] }, null)).toBe(2);
  });

  it("signed out (events only): Social shows nothing, Events shows the events", () => {
    const groups = { plans: [], events: parseSearchSocial(BODY).events, people: [] };
    expect(socialViewCount(null, groups)).toBe(0);
    const { container } = renderIn(<SearchSocialSummary summary={null} groups={groups} />);
    expect(container.textContent).toBe("");
    expect(eventsViewCount(null, groups)).toBe(2);
  });

  it("nothing at all → nothing rendered", () => {
    const { container } = renderIn(<SearchEventsView summary={null} groups={{ plans: [], events: [], people: [] }} />);
    expect(container.textContent).toBe("");
  });
});
