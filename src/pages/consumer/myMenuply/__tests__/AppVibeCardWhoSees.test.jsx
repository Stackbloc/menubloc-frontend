/* @vitest-environment jsdom */

/** Your vibe → "Who sees your vibe" opens How discoverable are you? (Andre 2026-11-02, app parity). */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getConsumerProfile: vi.fn(async () => ({ profile: { discoverability: "anyone", search_vibe_audience: "connects" } })),
  updateConsumerProfile: vi.fn(async () => ({})),
  updateSearchVibeAudience: vi.fn(async () => ({})),
}));
vi.mock("../../../../lib/consumerApi.js", async (orig) => ({ ...(await orig()), ...api }));

import { AppVibeCard } from "../AppProfileCards.jsx";

afterEach(cleanup);

describe("AppVibeCard Who sees your vibe", () => {
  it("shows the level, opens discoverability already open, Hidden says so", async () => {
    const onDiscover = vi.fn();
    render(<AppVibeCard label="Open for lunch" onDiscover={onDiscover} />);
    expect(await screen.findByText("My Connects ›")).toBeTruthy();
    expect(screen.queryByTestId("discoverability-card")).toBeNull();
    fireEvent.click(screen.getByTestId("vibe-who-sees"));
    fireEvent.click(await screen.findByTestId("discover-hidden"));
    await waitFor(() => expect(onDiscover).toHaveBeenCalledWith("hidden"));
    expect(api.updateConsumerProfile).toHaveBeenCalledWith({ discoverability: "nobody" });
    expect(screen.getByTestId("vibe-hidden").textContent).toMatch(/You’re Hidden/);
  });
});
