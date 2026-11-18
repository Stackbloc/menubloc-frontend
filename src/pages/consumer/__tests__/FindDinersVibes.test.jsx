/* @vitest-environment jsdom */

/** Find Connects: Search ◉ People ○ Vibes (plan 58, Andre 2026-11-18; web follows the app). */
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  searchDiners: vi.fn(),
  suggestVibes: vi.fn(),
  requestConnection: vi.fn(),
  acceptConnection: vi.fn(),
  declineConnection: vi.fn(),
  removeConnection: vi.fn(),
}));
vi.mock("../../../lib/consumerApi.js", async (orig) => ({ ...(await orig()), ...api }));
vi.mock("../../../context/ConsumerContext.jsx", () => ({ useConsumer: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("../../../components/StickyPageHeader.jsx", () => ({ default: () => null }));
vi.mock("../../../components/BottomNav.jsx", () => ({ default: () => null }));
vi.mock("../../../components/social/DinerAvatar.jsx", () => ({ default: () => null }));

import FindDinersPage from "../FindDinersPage.jsx";

const page = () =>
  render(
    <MemoryRouter>
      <FindDinersPage />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  api.searchDiners.mockResolvedValue({ results: [] });
  api.suggestVibes.mockResolvedValue({ suggestions: ["Down for tacos", "Tacos after class"] });
});
afterEach(cleanup);

describe("Find Connects: People / Vibes", () => {
  it("starts on People; names search as before, no suggestions", async () => {
    page();
    expect(screen.getByTestId("find-diners-mode-people").getAttribute("aria-checked")).toBe("true");
    fireEvent.change(screen.getByTestId("find-diners-input"), { target: { value: "maya" } });
    fireEvent.submit(screen.getByTestId("find-diners-input").closest("form"));
    await waitFor(() => expect(api.searchDiners).toHaveBeenCalledWith("maya"));
    await new Promise((r) => setTimeout(r, 260));
    expect(api.suggestVibes).not.toHaveBeenCalled();
  });

  it("Vibes: suggestions as you type; a pick lists people with that exact vibe, shown on each row", async () => {
    api.searchDiners.mockResolvedValue({ results: [{ id: 9, display_name: "Maya", active_vibe: "Down for tacos", connection_status: null }] });
    page();
    fireEvent.click(screen.getByTestId("find-diners-mode-vibes"));
    expect(screen.getByTestId("find-diners-input").getAttribute("placeholder")).toBe("A vibe, like tacos");
    fireEvent.change(screen.getByTestId("find-diners-input"), { target: { value: "taco" } });
    fireEvent.click(await screen.findByTestId("find-diners-vibe-suggestion-Down for tacos"));
    await waitFor(() => expect(api.searchDiners).toHaveBeenCalledWith("", null, { vibe: "Down for tacos", vibeExact: true }));
    expect(api.suggestVibes).toHaveBeenCalledWith("taco");
    expect((await screen.findByTestId("find-diner-9-vibe")).textContent).toBe("Down for tacos");
    expect(screen.queryByTestId("find-diners-vibe-suggestions")).toBeNull();
  });

  it("Vibes: typed text searches partially; nobody visible says so", async () => {
    page();
    fireEvent.click(screen.getByTestId("find-diners-mode-vibes"));
    fireEvent.change(screen.getByTestId("find-diners-input"), { target: { value: "boba" } });
    fireEvent.submit(screen.getByTestId("find-diners-input").closest("form"));
    await waitFor(() => expect(api.searchDiners).toHaveBeenCalledWith("", null, { vibe: "boba", vibeExact: false }));
    expect(await screen.findByText("No one you can see has that vibe right now.")).toBeTruthy();
  });
});
