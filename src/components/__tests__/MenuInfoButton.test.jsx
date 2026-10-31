/* @vitest-environment jsdom */

/** Menu ⓘ = About this menu (Andre 2026-10-31): freshness line + report email naming the menu. */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api.js", () => ({
  apiGet: vi.fn(async () => ({ ok: true, restaurant: { id: 78184, claim_status: "unclaimed" } })),
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

describe("MenuInfoButton", () => {
  it("unclaimed, no review date: not claimed or verified + report link", async () => {
    render(<MenuInfoButton {...base} reviewedAt={null} />);
    fireEvent.click(screen.getByTestId("menu-info-button"));
    expect(screen.getByText("About this menu")).toBeTruthy();
    expect(
      await screen.findByText(
        "This menu has not been claimed or verified by the restaurant owner/operator. Menuply cannot guarantee the accuracy of the menu information."
      )
    ).toBeTruthy();
    const href = decodeURIComponent(screen.getByTestId("menu-info-report").getAttribute("href"));
    expect(href.startsWith("mailto:menus@menuply.com?subject=Menu report: Pasta Roma, Los Angeles, CA (#78184)")).toBe(true);
    expect(href).toContain("Menu: https://menuply.com/restaurants/california/los-angeles/pasta-roma/menu");
    expect(screen.queryByText("Get directions")).toBeNull();
  });

  it("owner-reviewed menu shows the date", () => {
    render(<MenuInfoButton {...base} reviewedAt="2026-10-12T19:00:00Z" />);
    fireEvent.click(screen.getByTestId("menu-info-button"));
    expect(screen.getByTestId("menu-info-trust").textContent).toContain(
      "last reviewed or edited by the restaurant owner/operator on October 12, 2026."
    );
  });
});
