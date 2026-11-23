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
  setRightNowVibe: vi.fn(async () => ({})),
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
  it("is titled My Availability; Available is passive (never a choice); the vibes, Eating at home and Pause", async () => {
    render(<MyVibeCard discover="connects" />);
    expect(screen.getByText("My Availability")).toBeTruthy();
    expect((await screen.findByTestId("my-vibe-none")).textContent).toBe("Available: people can find you. Pick a vibe below to show first.");
    expect(screen.getByTestId("my-vibe-set-hungry").textContent).toMatch(/Hungry now/);
    expect(screen.getByTestId("my-vibe-set-upfor").textContent).toMatch(/I’m up for…A meal, coffee or Happy Hour 🍸/);
    expect(screen.getByTestId("my-vibe-set-social").textContent).toMatch(/✨ Feeling Social/);
    expect(screen.getByTestId("my-vibe-set-custom").textContent).toMatch(/Write your own vibe/);
    expect(screen.getByTestId("my-vibe-set-home").textContent).toMatch(/Eating at home/);
    expect(screen.getByTestId("availability-pause").textContent).toMatch(/Pause/);
    expect(screen.queryByTestId("my-vibe-set-available")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Me time|Not sure today/);
  });

  it("active rows report Open for X · Day, with Change and Remove", async () => {
    api.getAvailability.mockResolvedValue(avail({ hungry: true, up_for: [{ date: today, window: "lunch" }, { date: tomorrow, window: "coffee" }] }));
    api.listMySocialPlans.mockResolvedValue({
      plans: [{ key: "eating_plan-5", source: "eating_plan", id: 5, date: tomorrow, time: null, at_home: true, my_status: "organizer", visibility: "circle", circle_id: 7 }],
    });
    render(<MyVibeCard discover="connects" />);
    expect(await screen.findByTestId("my-vibe-hungry")).toBeTruthy();
    expect(screen.getByTestId(`my-vibe-upfor-${today}-lunch`).textContent).toMatch(/^Open for lunch · TodayChangeRemove$/);
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

  it("Hungry now: pick how long (4 hours to start), then what for (optional): Skip sets plain Hungry now", async () => {
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-hungry"));
    expect(screen.getByTestId("vibe-kind-hungry").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByTestId("vibe-hours-4").getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByTestId("vibe-set"));
    expect(screen.getByText("Hungry Now -")).toBeTruthy();
    expect(api.postHungryNow).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("hungry-for-skip"));
    await waitFor(() => expect(api.postHungryNow).toHaveBeenCalledWith(null, 4));
  });

  it("Hungry now for: suggestions fill the box; Done sends it; the row says what for", async () => {
    api.suggestHungryFor.mockResolvedValue({ suggestions: [{ name: "Pizza", kind: "food" }, { name: "Pizza Hut", kind: "restaurant" }] });
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-hungry"));
    fireEvent.click(screen.getByTestId("vibe-hours-8"));
    fireEvent.click(screen.getByTestId("vibe-set"));
    fireEvent.change(screen.getByTestId("hungry-for-input"), { target: { value: "piz" } });
    expect((await screen.findByTestId("hungry-for-suggestion-1")).textContent).toBe("Pizza Hut");
    expect(api.suggestHungryFor).toHaveBeenCalledWith("piz");
    fireEvent.click(screen.getByTestId("hungry-for-suggestion-0"));
    expect(screen.getByTestId("hungry-for-input").value).toBe("Pizza");
    expect(screen.queryByTestId("hungry-for-suggestions")).toBeNull();
    api.getAvailability.mockResolvedValue(avail({ hungry: true, hungry_for: "Pizza" }));
    fireEvent.click(screen.getByTestId("hungry-for-done"));
    await waitFor(() => expect(api.postHungryNow).toHaveBeenCalledWith("Pizza", 8));
    expect((await screen.findByTestId("my-vibe-hungry")).textContent).toMatch(/^Hungry Now - Pizza/);
  });

  it("Up for Happy Hour 🍸 (mig 0436): its own choice; the row says Up for Happy Hour 🍸", async () => {
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-upfor"));
    fireEvent.click(screen.getByTestId("my-vibe-upfor-type-happy_hour"));
    expect(screen.getByTestId("my-vibe-meal-happy_hour").textContent).toMatch(/^Happy Hour 🍸/);
    api.getAvailability.mockResolvedValue(avail({ up_for: [{ date: tomorrow, window: "happy_hour" }] }));
    fireEvent.click(screen.getByTestId("my-vibe-day-1"));
    fireEvent.click(screen.getByTestId("my-vibe-meal-happy_hour"));
    await waitFor(() => expect(api.postUpFor).toHaveBeenCalledWith("happy_hour", tomorrow));
    expect((await screen.findByTestId(`my-vibe-upfor-${tomorrow}-happy_hour`)).textContent).toMatch(/^Up for Happy Hour 🍸 · Tomorrow/);
  });

  it("I’m up for: A meal · Coffee · Happy Hour 🍸 are separate radio choices (Andre 2026-11-18)", async () => {
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-upfor"));
    expect(screen.getByText("I’m up for:")).toBeTruthy();
    expect(screen.getAllByTestId(/^my-vibe-upfor-type-/).map((b) => b.dataset.testid)).toEqual(["meal", "coffee", "happy_hour"].map((t) => `my-vibe-upfor-type-${t}`));
    expect(screen.getByTestId("my-vibe-upfor-type-meal").getAttribute("aria-checked")).toBe("true");
    expect(screen.getAllByTestId(/^my-vibe-meal-/).map((b) => b.dataset.testid)).toEqual(["breakfast", "lunch", "dinner", "late"].map((m) => `my-vibe-meal-${m}`));
    fireEvent.click(screen.getByTestId("my-vibe-upfor-type-coffee"));
    expect(screen.getAllByTestId(/^my-vibe-meal-/).map((b) => b.dataset.testid)).toEqual(["my-vibe-meal-coffee"]);
    fireEvent.click(screen.getByTestId("my-vibe-day-1"));
    expect(screen.getByTestId("my-vibe-meal-coffee").textContent).toBe("Coffee · TomorrowSet ›");
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
    fireEvent.click(screen.getByTestId("vibe-set"));
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

  it("a custom vibe CK blocks shows Ask for review (2026-11-23, plan 73 PM1b)", async () => {
    api.setRightNowVibe.mockRejectedValueOnce(
      Object.assign(new Error("That can't be a vibe."), { status: 400, payload: { code: "custom_vibe_hateful" } })
    );
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-custom"));
    fireEvent.change(screen.getByTestId("vibe-custom-input"), { target: { value: "flame retardant demo" } });
    fireEvent.click(screen.getByTestId("vibe-set"));
    expect((await screen.findByTestId("availability-error")).textContent).toBe("That can't be a vibe.");
    expect(screen.getByTestId("ask-for-review")).toBeTruthy();
  });

  it("a form error on a custom vibe has no Ask for review", async () => {
    api.setRightNowVibe.mockRejectedValueOnce(
      Object.assign(new Error("Keep it to 80 characters."), { status: 400, payload: { code: "custom_vibe_too_long" } })
    );
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-custom"));
    fireEvent.change(screen.getByTestId("vibe-custom-input"), { target: { value: "tacos" } });
    fireEvent.click(screen.getByTestId("vibe-set"));
    await screen.findByTestId("availability-error");
    expect(screen.queryByTestId("ask-for-review")).toBeNull();
  });

  it("write your own vibe (≤ 80), 2/4/8 hours; Change opens my words; Remove clears it", async () => {
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-custom"));
    expect(screen.getByTestId("vibe-custom-input").getAttribute("maxLength")).toBe("80");
    expect(screen.getByTestId("vibe-set").disabled).toBe(true);
    fireEvent.change(screen.getByTestId("vibe-custom-input"), { target: { value: "  Down for   tacos " } });
    expect(screen.getByTestId("vibe-custom-count").textContent).toBe("19/80");
    fireEvent.click(screen.getByTestId("vibe-hours-2"));
    const until = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    api.getAvailability.mockResolvedValue(avail({ active_vibe: { kind: "custom", label: "Down for tacos", until } }));
    fireEvent.click(screen.getByTestId("vibe-set"));
    await waitFor(() => expect(api.setRightNowVibe).toHaveBeenCalledWith({ kind: "custom", hours: 2, text: "Down for tacos" }));
    expect((await screen.findByTestId("my-vibe-custom")).textContent).toMatch(/^“Down for tacos”until .*ChangeRemove$/);
    fireEvent.click(screen.getByTestId("my-vibe-custom-change"));
    expect(screen.getByTestId("vibe-custom-input").value).toBe("Down for tacos");
    fireEvent.click(screen.getByTestId("vibe-cancel"));
    api.getAvailability.mockResolvedValue(avail());
    fireEvent.click(screen.getByTestId("my-vibe-custom-remove"));
    await waitFor(() => expect(api.setRightNowVibe).toHaveBeenLastCalledWith({ kind: null }));
  });

  it("✨ Feeling Social: one at a time (says what it replaces), timed, with Change and Remove", async () => {
    api.getAvailability.mockResolvedValue(avail({ active_vibe: { kind: "custom", label: "Boba run", until: null } }));
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId("my-vibe-set-social"));
    expect(screen.getByText("Ends by itself. Replaces “Boba run”.")).toBeTruthy();
    api.getAvailability.mockResolvedValue(avail({ feeling_social: true, active_vibe: { kind: "feeling_social", label: "Feeling Social", until: new Date(Date.now() + 3600e3).toISOString() } }));
    fireEvent.click(screen.getByTestId("vibe-set"));
    await waitFor(() => expect(api.setRightNowVibe).toHaveBeenCalledWith({ kind: "feeling_social", hours: 4 }));
    expect((await screen.findByTestId("my-vibe-social")).textContent).toMatch(/^✨ Feeling Socialuntil .*ChangeRemove$/);
    expect(screen.queryByTestId("my-vibe-set-social")).toBeNull();
    fireEvent.click(screen.getByTestId("my-vibe-social-remove"));
    await waitFor(() => expect(api.setAvailability).toHaveBeenCalledWith({ feeling_social: false }));
  });

  it("Change on an Up for replaces it", async () => {
    api.getAvailability.mockResolvedValue(avail({ up_for: [{ date: today, window: "dinner" }] }));
    render(<MyVibeCard discover="connects" />);
    fireEvent.click(await screen.findByTestId(`my-vibe-upfor-change-${today}-dinner`));
    expect(screen.getByText("Change what you’re up for")).toBeTruthy();
    fireEvent.click(screen.getByTestId("my-vibe-upfor-type-happy_hour"));
    fireEvent.click(screen.getByTestId("my-vibe-meal-happy_hour"));
    await waitFor(() => expect(api.postUpFor).toHaveBeenCalledWith("happy_hour", null));
    expect(api.clearUpFor).toHaveBeenCalledWith("dinner", null);
  });

  it("minors: privacy says Connects only and locks the wider choices (Andre 2026-11-18)", async () => {
    api.getConsumerProfile.mockResolvedValueOnce({ profile: { discoverability: "anyone", search_vibe_audience: "everyone", minor_connects_only: true } });
    render(<MyVibeCard discover={null} />);
    fireEvent.click(screen.getByTestId("vibe-who-sees"));
    expect((await screen.findByTestId("discover-minor-note")).textContent).toBe("You’re under 18, so only your Connects can find you or see your vibe.");
    expect(screen.getByTestId("discover-connects").getAttribute("aria-checked")).toBe("true");
    for (const l of ["connects_of_connects", "everyone"]) expect(screen.getByTestId(`discover-${l}`).disabled).toBe(true);
    expect(screen.getByTestId("discover-hidden").disabled).toBe(false);
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
