/* @vitest-environment jsdom */

/**
 * Profile → Connects box (Andre 2026-11-01): replaces the little Connects pill on your own Profile.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const who = (id, name) => ({ id, name, avatar_url: null });
let NOW = {};
let LISTS = {};
vi.mock("../../../../lib/consumerApi.js", () => ({
  getConnectsNow: async () => NOW,
  listConnections: async () => LISTS,
  acceptConnection: vi.fn(),
  declineConnection: vi.fn(),
  answerSocialPlanJoinRequest: vi.fn(),
}));

const { default: ProfileConnectsBox } = await import("../ProfileConnectsBox.jsx");
const show = () =>
  render(
    <MemoryRouter>
      <ProfileConnectsBox />
    </MemoryRouter>
  );

describe("ProfileConnectsBox", () => {
  beforeEach(() => {
    LISTS = { accepted: [{ peer: { id: 61, display_name: "Maya T." } }, { peer: { id: 62, display_name: "Jordan K." } }], pending_incoming: [{ id: 1 }] };
    NOW = {
      connection_count: 2,
      needs_answer: [{ key: "c:1", type: "connect_request" }],
      right_now: [
        { key: "vibe:61", type: "vibe", peer: who(61, "Maya T."), vibe: { values: ["open_for_lunch", "coffee"], expires_at: new Date(Date.now() + 3600e3).toISOString() } },
      ],
      coming_up: [
        {
          key: "eating_plan:5",
          peer: who(61, "Maya T."),
          title: "Taco crawl",
          date: "2026-11-03",
          time: "19:00",
          attendees: [
            { id: 61, name: "Maya T.", role: "organizer", is_connect: true },
            { id: 29, name: "You", role: "going", is_you: true },
          ],
          guest_count: 0,
        },
      ],
    };
  });

  it("shows count, requests, one row per available person, and the next plan's people", async () => {
    show();
    expect(await screen.findByText("Connects · 2")).toBeTruthy();
    expect(screen.getByText("1 connect request waiting")).toBeTruthy();
    expect(screen.getAllByTestId("profile-connects-available-vibe:61")).toHaveLength(1);
    expect(screen.getByText("· Lunch")).toBeTruthy();
    expect(screen.getByTestId("profile-connects-pill").getAttribute("href")).toBe("/feed/connects");
    fireEvent.click(screen.getByTestId("profile-connects-next-plan-open"));
    expect(screen.getByTestId("connects-plan-eating_plan:5-people").textContent).toContain("2 going");
    expect(screen.queryByTestId("profile-connects-find")).toBeNull();
  });

  it("is quiet with Find Connects when nothing is going on", async () => {
    LISTS = { accepted: [{ peer: { id: 61, display_name: "Maya T." } }], pending_incoming: [] };
    NOW = { connection_count: 1, needs_answer: [], right_now: [], coming_up: [] };
    show();
    expect(await screen.findByText("Nothing going on right now.")).toBeTruthy();
    expect(screen.getByTestId("profile-connects-find").getAttribute("href")).toBe("/account/find-diners");
  });
});
