/* @vitest-environment jsdom */
// Reservations, restaurant side (Social Dining Phase 4, BE mig 0443).

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RestaurantReservationsPanel from "../RestaurantReservationsPanel.jsx";

const REQUEST = {
  id: 7, status: "pending", party_size: 3, date: "2026-11-17", time: "12:40", first_name: "Sam",
  created_at: new Date(Date.now() - 4 * 60000).toISOString(),
};

function fakeApi(over = {}) {
  return {
    list: vi.fn(async () => ({
      ok: true, available: true, enabled: true, today: "2026-11-17",
      requests: [REQUEST], confirmed_today: [], confirmed_later: [], other_today: [],
    })),
    setEnabled: vi.fn(async (on) => ({ ok: true, enabled: on })),
    accept: vi.fn(async () => ({ ok: true, reservation: { ...REQUEST, status: "accepted", code: "MP-0042", entered_by_restaurant: false } })),
    decline: vi.fn(async () => ({ ok: true })),
    markEntered: vi.fn(async (id, on) => ({ ok: true, reservation: { ...REQUEST, status: "accepted", code: "MP-0042", entered_by_restaurant: on } })),
    ...over,
  };
}

describe("RestaurantReservationsPanel", () => {
  it("off: says reservations are off and groups arrive as walk-ins", async () => {
    const api = fakeApi({
      list: vi.fn(async () => ({ ok: true, available: true, enabled: false, requests: [], confirmed_today: [], other_today: [] })),
    });
    render(<RestaurantReservationsPanel api={api} restaurantName="Casa Verde" />);
    expect(await screen.findByText("Reservations are off. Groups still arrive as walk-ins.")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: "Take reservations" }));
    await waitFor(() => expect(api.setEnabled).toHaveBeenCalledWith(true));
  });

  it("lists a request with time, first name, party size and how long ago; Accept shows the code", async () => {
    const api = fakeApi();
    render(<RestaurantReservationsPanel api={api} />);
    expect(await screen.findByText("Today · 12:40 PM · Sam · party of 3")).toBeTruthy();
    expect(screen.getByText("Asked 4 min ago")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(await screen.findByText("MP-0042")).toBeTruthy();
    fireEvent.click(screen.getAllByLabelText("Entered in our booking system")[0]);
    await waitFor(() => expect(api.markEntered).toHaveBeenCalledWith(7, true));
  });

  it("Decline calls the API", async () => {
    const api = fakeApi();
    render(<RestaurantReservationsPanel api={api} />);
    fireEvent.click(await screen.findByRole("button", { name: "Decline" }));
    await waitFor(() => expect(api.decline).toHaveBeenCalledWith(7));
  });
});
