/* @vitest-environment jsdom */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OpenInviteDetail from "../OpenInviteDetail.jsx";
import OpenInvitesSection from "../OpenInvitesSection.jsx";
import { audienceChips, filterOpenInvites, spotsText } from "../../../lib/openInvitesApi.js";

const INV = {
  token: "abc",
  status: "open",
  restaurant_id: null,
  restaurant_name: "Taco Spot",
  restaurant_city: "Los Angeles",
  restaurant_state: "CA",
  scheduled_date: "2030-01-01",
  scheduled_time: "12:30",
  meal_period: "lunch",
  join_capacity: 3,
  spots_left: 2,
  audience: "anyone",
  audience_label: "Anyone on Menuply",
  note: "tacos",
  host: { user_id: 1, name: "Hana H.", avatar_url: null, school_badge: "USC" },
  joiners: [{ user_id: 2, name: "Cal C.", avatar_url: null }],
  is_host: false,
  joined: false,
  can_join: true,
  can_leave: false,
  can_answer_went: false,
  went: null,
};
const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("Open Invite on the web", () => {
  it("shows spots, the audience and Join, and Report on the host and joiners", () => {
    inRouter(<OpenInviteDetail initial={INV} />);
    expect(screen.getByTestId("open-invite-spots").textContent).toBe("2 spots left");
    expect(screen.getByTestId("open-invite-audience").textContent).toBe("Who can join: Anyone on Menuply");
    expect(screen.getByTestId("open-invite-join")).toBeTruthy();
    expect(screen.getByTestId("open-invite-report-host")).toBeTruthy();
    expect(screen.getByTestId("open-invite-report-2")).toBeTruthy();
    expect(screen.queryByTestId("open-invite-remove-2")).toBeNull();
  });

  it("the host can remove, edit and cancel, and has no Join", () => {
    inRouter(<OpenInviteDetail initial={{ ...INV, is_host: true, can_join: false }} />);
    expect(screen.getByTestId("open-invite-remove-2")).toBeTruthy();
    expect(screen.getByTestId("open-invite-edit")).toBeTruthy();
    expect(screen.getByTestId("open-invite-cancel")).toBeTruthy();
    expect(screen.queryByTestId("open-invite-join")).toBeNull();
  });

  it("asks Did you go after the start", () => {
    inRouter(<OpenInviteDetail initial={{ ...INV, joined: true, can_join: false, can_answer_went: true }} />);
    expect(screen.getByTestId("open-invite-went")).toBeTruthy();
  });

  it("search cards show a Join and the audience", () => {
    inRouter(<OpenInvitesSection invites={[INV]} />);
    expect(screen.getByTestId("open-invite-card-join-abc")).toBeTruthy();
    expect(screen.getByText("Anyone on Menuply")).toBeTruthy();
  });

  it("offers only the chips this host can use", () => {
    expect(audienceChips(null).map((c) => c.value)).toEqual(["connects_only"]);
    const all = audienceChips({ connects_of_connects: true, student_label: "USC students", anyone: true });
    expect(all.map((c) => c.label)).toEqual(["Connects only", "Connects’ Connects", "USC students", "Anyone"]);
  });

  it("filters and words the spots", () => {
    const b = { ...INV, token: "b", restaurant_name: "Pho", meal_period: "dinner" };
    expect(filterOpenInvites([INV, b], "dinner", null)).toEqual([b]);
    expect(filterOpenInvites([INV, b], null, "Taco Spot")).toEqual([INV]);
    expect(spotsText(1)).toBe("1 spot left");
  });
});
