/* @vitest-environment jsdom */

/**
 * Connects → Who's Available + Social Plans (Andre 2026-10-31 / 2026-11-01).
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const who = (id, name) => ({ id, name, avatar_url: null });
vi.mock("../../../../lib/consumerApi.js", () => ({
  getConnectsNow: async () => ({
    ok: true,
    connection_count: 2,
    needs_answer: [],
    right_now: [
      { key: "vibe:61", type: "vibe", peer: who(61, "Maya T."), vibe: { value: "open_for_lunch", values: ["open_for_lunch", "coffee"], label: "Lunch · Coffee", expires_at: new Date(Date.now() + 3600e3).toISOString() } },
    ],
    coming_up: [
      {
        key: "eating_plan:5",
        source: "eating_plan",
        peer: who(61, "Maya T."),
        title: "Taco crawl",
        date: "2026-11-03",
        time: "19:00",
        place: { name: "Yard House" },
        going_count: 3,
        action: "join",
        href: "/account/what-we-doing/x",
        attendees: [
          { id: 61, name: "Maya T.", role: "organizer", is_connect: true },
          { id: 29, name: "You", role: "going", is_you: true },
          { id: 71, name: "Aisha J.", role: "going", is_connect: false },
        ],
        guest_count: 1,
      },
    ],
    unavailable: [],
  }),
  acceptConnection: vi.fn(),
  declineConnection: vi.fn(),
  answerSocialPlanJoinRequest: vi.fn(),
}));

const { default: ConnectsNowSection } = await import("../ConnectsNowSection.jsx");

describe("ConnectsNowSection", () => {
  it("groups Who's Available by vibe and opens a Social Plan's people", async () => {
    render(
      <MemoryRouter>
        <ConnectsNowSection onPage />
      </MemoryRouter>
    );
    expect(await screen.findByText("Who's Available")).toBeTruthy();
    expect(screen.getByTestId("connects-available-open_for_lunch")).toBeTruthy();
    expect(screen.getByTestId("connects-available-coffee")).toBeTruthy();
    expect(screen.getByText("Social Plans")).toBeTruthy();
    expect(screen.queryByText("Coming up")).toBeNull();

    fireEvent.click(screen.getByTestId("connects-plan-eating_plan:5-open"));
    const people = screen.getByTestId("connects-plan-eating_plan:5-people");
    expect(people.textContent).toContain("4 going");
    expect(people.textContent).toContain("Organizer");
    expect(people.textContent).toContain("+ 1 guest");
    expect(screen.getByText("Aisha J.").closest("a").getAttribute("href")).toBe("/diners/71");
    expect(screen.getAllByText("Maya T.").map((n) => n.closest("a")?.getAttribute("href")).filter(Boolean)).toContain("/account/connections/61");
    expect(screen.getByText("You").closest("a")).toBeNull();

    fireEvent.click(screen.getByTestId("connects-plan-eating_plan:5-open"));
    expect(screen.queryByTestId("connects-plan-eating_plan:5-people")).toBeNull();
  });
});
