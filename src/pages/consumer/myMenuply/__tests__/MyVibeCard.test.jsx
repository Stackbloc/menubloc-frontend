/* @vitest-environment jsdom */

/** My Vibe (web follows the app's AvailabilityCard, plan 41, 2026-11-13). */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ymd } from "../../../../lib/myVibe.js";

const today = ymd(new Date());
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = ymd(tomorrowDate);

const api = vi.hoisted(() => ({
  getAvailability: vi.fn(),
  setAvailability: vi.fn(async () => ({})),
  postHungryNow: vi.fn(async () => ({})),
  suggestHungryFor: vi.fn(async () => ({ suggestions: [] })),
  clearHungryNow: vi.fn(async () => ({})),
  postUpFor: vi.fn(async () => ({})),
  clearUpFor: vi.fn(async () => ({})),
  listMySocialPlans: vi.fn(),
  listMyCircles: vi.fn(async () => ({ circles: [{ id: 7, name: "Roommates" }] })),
  createSocialPlan: vi.fn(async () => ({ plan: { key: "k" } })),
  deleteSocialPlan: vi.fn(async () => ({})),
  getConsumerProfile: vi.fn(async () => ({ profile: { discoverability: "anyone", search_vibe_audience: "connects" } })),
  updateConsumerProfile: vi.fn(async () => ({})),
  updateSearchVibeAudience: vi.fn(async () => ({})),
}));
vi.mock("../../../../lib/consumerApi.js", async (orig) => ({ ...(await orig()), ...api }));

import MyVibeCard from "../MyVibeCard.jsx";

const avail = (over = {}) => ({ availability: { available: true, hungry: false, up_for: [], ...over } });

beforeEach(() => {
  vi.clearAllMocks();
  api.getAvailability.mockResolvedValue(avail());
  api.listMySocialPlans.mockResolvedValue({ plans: [] });
});
afterEach(cleanup);

describe("MyVibeCard", () => {
  it("is titled My Vibe and shows the four rows, no Me time / Not sure today", async () => {
    render(<MyVibeCard discover="connects" />);
    expect(screen.getByText("My Vibe")).toBeTruthy();
    expect(await screen.findByTestId("my-vibe-none")).toBeTruthy();
    expect(screen.getByTestId("my-vibe-set-hungry").textContent).toMatch(/Hungry now/);
    expect(screen.getByTestId("my-vibe-set-upfor").textContent).toMatch(/Up for a meal or coffee/);
    expect(screen.getByTestId("my-vibe-set-home").textContent).toMatch(/Eating at home/);
    expect(screen.getByTestId("availability-pause").textContent).toMatch(/Pause/);
    expect(document.body.textContent).not.toMatch(/Me time|Not sure today|Availability/);
  });

  it("active rows report Open for X · Day, with Remove", async () => {
    api.getAvailability.mockResolvedValue(avail({ hungry: true, up_for: [{ date: today, window: "lunch" }, { date: tomorrow, window: "coffee" }] }));
    api.listMySocialPlans.mockResolvedValue({
      plans: [{ key: "eating_plan-5", source: "eating_plan", id: 5, date: tomorrow, time: null, at_home: true, my_status: "organizer", visibility: "circle", circle_id: 7 }],
    });
    render(<MyVibeCard discover="connects" />);
    expect(await screen.findByTestId("my-vibe-hungry")).toBeTruthy();
    expect(screen.getByTestId(`my-vibe-upfor-${today}-lunch`).textContent).toMatch(/^Open for lunch · Today/);
    expect(screen.getByTestId(`my-vibe-upfor-${tomorrow}-coffee`).textContent).toMatch(/^Open for coffee · Tomorrow/);
    await waitFor(() => expect(screen.getByTestId("my-vibe-home-5").textContent).toMatch(/Eating at home · Tomorrow · Roommates can ask/));
    expect(screen.queryByTestId("my-vibe-set-hungry")).toBeNull();
    fireEvent.click(screen.getByTestId(`my-vibe-upfor-${tomorrow}-coffee-remove`));
    await waitFor(() => expect(api.clearUpFor).toHaveBeenCalledWith("coffee", tomorrow));
    fireEvent.click(screen.getByTestId(`my-vibe-upfor-${today}-lunch-remove`));
    await waitFor(() => expect(api.clearUpFor).toHaveBeenCalledWith("lunch", null));
    fireEvent.click(screen.getByTestId("my-vibe-home-5-remove"));
    await waitFor(() => expect(api.deleteSocialPlan).toHaveBeenCalledWith("eating_plan", "5"));
  });

  it("Hungry now asks what for (optional): Skip sets plain Hungry now", async () => {
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-hungry"));
    expect(screen.getByText("Hungry now for?")).toBeTruthy();
    expect(api.postHungryNow).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("hungry-for-skip"));
    await waitFor(() => expect(api.postHungryNow).toHaveBeenCalledWith(null));
  });

  it("Hungry now for: suggestions fill the box; Done sends it; the row says what for", async () => {
    api.suggestHungryFor.mockResolvedValue({ suggestions: [{ name: "Pizza", kind: "food" }, { name: "Pizza Hut", kind: "restaurant" }] });
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-hungry"));
    fireEvent.change(screen.getByTestId("hungry-for-input"), { target: { value: "piz" } });
    expect((await screen.findByTestId("hungry-for-suggestion-1")).textContent).toBe("Pizza Hut");
    expect(api.suggestHungryFor).toHaveBeenCalledWith("piz");
    fireEvent.click(screen.getByTestId("hungry-for-suggestion-0"));
    expect(screen.getByTestId("hungry-for-input").value).toBe("Pizza");
    expect(screen.queryByTestId("hungry-for-suggestions")).toBeNull();
    api.getAvailability.mockResolvedValue(avail({ hungry: true, hungry_for: "Pizza" }));
    fireEvent.click(screen.getByTestId("hungry-for-done"));
    await waitFor(() => expect(api.postHungryNow).toHaveBeenCalledWith("Pizza"));
    expect((await screen.findByTestId("my-vibe-hungry")).textContent).toMatch(/^Hungry now for Pizza/);
  });

  it("Up for: day + meal (coffee allowed)", async () => {
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-upfor"));
    expect(screen.getByTestId("my-vibe-meal-coffee")).toBeTruthy();
    fireEvent.click(screen.getByTestId("my-vibe-day-1"));
    fireEvent.click(screen.getByTestId("my-vibe-meal-coffee"));
    await waitFor(() => expect(api.postUpFor).toHaveBeenCalledWith("coffee", tomorrow));
  });

  it("Eating at home: Just me saves straight away; others see the safety note first", async () => {
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-home"));
    fireEvent.click(screen.getByTestId("my-vibe-home-meal-dinner"));
    fireEvent.click(screen.getByTestId("my-vibe-home-who-just-me"));
    await waitFor(() =>
      expect(api.createSocialPlan).toHaveBeenCalledWith(expect.objectContaining({ at_home: true, who: "just_me", window: "dinner", date: today }))
    );
    fireEvent.click(screen.getByTestId("my-vibe-set-home"));
    fireEvent.click(screen.getByTestId("my-vibe-home-meal-lunch"));
    fireEvent.click(await screen.findByTestId("my-vibe-home-who-7"));
    expect(screen.getByTestId("my-vibe-home-warning").textContent).toMatch(/Roommates can ask to join you at home\. Only say yes to people you know and trust/);
    fireEvent.click(screen.getByTestId("my-vibe-home-confirm"));
    await waitFor(() =>
      expect(api.createSocialPlan).toHaveBeenLastCalledWith(expect.objectContaining({ at_home: true, who: "ask", window: "lunch", circle_id: 7 }))
    );
  });

  it("Hungry now (Skip what for); Pause offers the five lengths; paused shows Turn back on", async () => {
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-hungry"));
    fireEvent.click(screen.getByTestId("hungry-for-skip"));
    await waitFor(() => expect(api.postHungryNow).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId("hungry-for-sheet")).toBeNull());
    fireEvent.click(screen.getByTestId("availability-pause"));
    api.getAvailability.mockResolvedValue({ availability: { available: false, paused_forever: true, hungry: false, up_for: [] } });
    fireEvent.click(screen.getByTestId("availability-pause-forever"));
    await waitFor(() => expect(api.setAvailability).toHaveBeenCalledWith({ pause: "forever" }));
    expect(await screen.findByTestId("availability-resume")).toBeTruthy();
    expect(screen.getByTestId("availability-current").textContent).toBe("Paused until you turn it back on");
  });

  it("Who can find you shows the level and opens discoverability; Hidden says so", async () => {
    const onDiscover = vi.fn();
    render(<MyVibeCard discover={null} onDiscover={onDiscover} />);
    fireEvent.click(screen.getByTestId("vibe-who-sees"));
    fireEvent.click(await screen.findByTestId("discover-hidden"));
    await waitFor(() => expect(onDiscover).toHaveBeenCalledWith("hidden"));
    expect(api.updateConsumerProfile).toHaveBeenCalledWith({ discoverability: "nobody" });
    expect(screen.getByTestId("availability-status").textContent).toMatch(/You’re Hidden/);
  });
});
