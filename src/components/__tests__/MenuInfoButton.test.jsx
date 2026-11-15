/* @vitest-environment jsdom */

/** Menu ⓘ = About this menu (Andre 2026-10-31): freshness line + report email naming the menu. */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api.js", () => ({
  apiGet: vi.fn(async (path) => ({
    ok: true,
    restaurant: { id: 1, claim_status: path.endsWith("/90001") ? "claimed" : "unclaimed" },
  })),
}));

import MenuInfoButton from "../menu/MenuInfoButton.jsx";

afterEach(cleanup);

const base = {
  restaurantId: 78184,
  restaurantName: "Pasta Roma",
  city: "Los Angeles",
  state: "CA",
  menuUrl: "https://menuply.com/restaurants/california/los-angeles/pasta-roma/menu",
};

describe("MenuInfoButton (claim colors + copy, Andre 2026-11-15)", () => {
  it("unclaimed: red ring before the tap, not-claimed copy, no price line, report link names the menu", async () => {
    render(<MenuInfoButton {...base} reviewedAt={null} />);
    const button = screen.getByTestId("menu-info-button");
    await waitFor(() => expect(button.getAttribute("data-claim")).toBe("unclaimed"));
    expect(button.style.borderColor).toBe("rgb(220, 38, 38)");
    fireEvent.click(button);
    expect(screen.getByText("About this menu")).toBeTruthy();
    expect(screen.getByTestId("menu-info-status").textContent).toBe("Not claimed by the restaurant");
    expect(screen.getByTestId("menu-info-trust").textContent).toBe(
      "The owner hasn't checked this menu, so items and prices may be out of date."
    );
    expect(screen.queryByTestId("menu-info-mpi")).toBeNull();
    expect(screen.getByTestId("menu-info-report-line").textContent).toBe(
      "Menuply can't guarantee menu accuracy. See something wrong? Report it"
    );
    const href = decodeURIComponent(screen.getByTestId("menu-info-report").getAttribute("href"));
    expect(href.startsWith("mailto:menus@menuply.com?subject=Menu report: Pasta Roma, Los Angeles, CA (#78184)")).toBe(true);
    expect(href).toContain("Menu: https://menuply.com/restaurants/california/los-angeles/pasta-roma/menu");
    expect(screen.queryByText("Get directions")).toBeNull();
  });

  it("claimed: green ring, owner date, price-integrity link", async () => {
    render(<MenuInfoButton {...base} restaurantId={90001} reviewedAt="2026-10-12T19:00:00Z" />);
    const button = screen.getByTestId("menu-info-button");
    await waitFor(() => expect(button.getAttribute("data-claim")).toBe("claimed"));
    expect(button.style.borderColor).toBe("rgb(22, 163, 74)");
    fireEvent.click(button);
    expect(screen.getByTestId("menu-info-status").textContent).toBe("Claimed by the restaurant");
    expect(screen.getByTestId("menu-info-trust").textContent).toBe(
      "The owner manages this menu. Last updated by the owner on October 12, 2026."
    );
    expect(screen.getByTestId("menu-info-prices").textContent).toBe(
      "If you order here, prices can't be higher than at the restaurant: Menu Price Integrity."
    );
    expect(screen.getByTestId("menu-info-mpi").getAttribute("href")).toBe("/menu-price-integrity");
  });
});
