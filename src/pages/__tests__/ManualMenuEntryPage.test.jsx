/* @vitest-environment jsdom */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ManualMenuEntryPage from "../ManualMenuEntryPage.jsx";
import { MANUAL_MENU_FIELD_PLACEHOLDERS } from "../../lib/manualMenuEntryModel.js";

vi.mock("../../context/OperatorContext.jsx", () => ({
  useOperator: () => ({ operator: null, selectedRestaurant: null }),
}));

const ONBOARDING_STATE = {
  restaurant_id: 42,
  restaurant_name: "Test Cafe",
  email: "owner@test.com",
  owner_token: "test-owner-token",
};

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/restaurant/manual-menu-entry",
          state: ONBOARDING_STATE,
        },
      ]}
    >
      <ManualMenuEntryPage />
    </MemoryRouter>
  );
}

describe("ManualMenuEntryPage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("grubbid.onboarding.state", JSON.stringify(ONBOARDING_STATE));
  });

  it("uses example placeholders that are not treated as saved values", () => {
    renderPage();
    const sectionInput = screen.getByPlaceholderText(MANUAL_MENU_FIELD_PLACEHOLDERS.sectionName);
    expect(sectionInput.value).toBe("");
    expect(MANUAL_MENU_FIELD_PLACEHOLDERS.sectionName).toMatch(/\(for example\)/i);
  });

  it("does not show remove section before adding another section", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /remove this section/i })).toBeNull();
  });

  it("shows remove section only on the additional section after add section", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /add another section/i }));

    const removeButtons = screen.getAllByRole("button", { name: /remove this section/i });
    expect(removeButtons).toHaveLength(1);

    const sectionCards = screen.getAllByTestId("manual-menu-section-card");
    expect(sectionCards).toHaveLength(2);
    expect(within(sectionCards[0]).queryByRole("button", { name: /remove this section/i })).toBeNull();
    expect(within(sectionCards[1]).getByRole("button", { name: /remove this section/i })).toBeTruthy();
  });

  it("does not show remove controls before adding another item", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /remove item/i })).toBeNull();
    expect(screen.getByRole("button", { name: /add another item/i })).toBeTruthy();
  });

  it("shows remove only on the additional item after add item", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /add another item/i }));

    const removeButtons = screen.getAllByRole("button", { name: /remove item/i });
    expect(removeButtons).toHaveLength(1);

    const itemCards = screen.getAllByTestId("manual-menu-item-card");
    expect(itemCards).toHaveLength(2);
    expect(within(itemCards[0]).queryByRole("button", { name: /remove item/i })).toBeNull();
    expect(within(itemCards[1]).getByRole("button", { name: /remove item/i })).toBeTruthy();
  });

  it("removes an additional item and returns to a single stable row", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /add another item/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove item/i }));

    expect(screen.getAllByTestId("manual-menu-item-card")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /remove item/i })).toBeNull();
  });

  it("validates required fields on submit", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    expect(screen.getByText(/add at least one menu item/i)).toBeTruthy();
  });

  it("ignores blank placeholder rows when submitting a filled section", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, items_inserted: 1 }),
    }));

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /add another item/i }));
    fireEvent.click(screen.getByRole("button", { name: /add another section/i }));

    const sectionInputs = screen.getAllByPlaceholderText(MANUAL_MENU_FIELD_PLACEHOLDERS.sectionName);
    fireEvent.change(sectionInputs[0], { target: { value: "Appetizers" } });

    const nameInputs = screen.getAllByPlaceholderText(MANUAL_MENU_FIELD_PLACEHOLDERS.itemName);
    fireEvent.change(nameInputs[0], { target: { value: "Mozzarella Sticks" } });

    const priceInputs = screen.getAllByPlaceholderText(MANUAL_MENU_FIELD_PLACEHOLDERS.price);
    fireEvent.change(priceInputs[0], { target: { value: "8.99" } });

    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(screen.queryByText(/section name is required/i)).toBeNull();
    expect(screen.queryByText(/add at least one menu item/i)).toBeNull();
    expect(await screen.findByText(/menu submitted/i)).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it("reports missing section name on the correct section, not a later one", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /add another section/i }));

    const sectionInputs = screen.getAllByPlaceholderText(MANUAL_MENU_FIELD_PLACEHOLDERS.sectionName);
    fireEvent.change(sectionInputs[0], { target: { value: "" } });

    const nameInputs = screen.getAllByPlaceholderText(MANUAL_MENU_FIELD_PLACEHOLDERS.itemName);
    fireEvent.change(nameInputs[0], { target: { value: "Steak & Eggs" } });
    fireEvent.change(nameInputs[1], { target: { value: "Vodka & Tonic" } });

    const priceInputs = screen.getAllByPlaceholderText(MANUAL_MENU_FIELD_PLACEHOLDERS.price);
    fireEvent.change(priceInputs[0], { target: { value: "16.99" } });

    fireEvent.change(sectionInputs[1], { target: { value: "Drinks" } });
    fireEvent.change(priceInputs[1], { target: { value: "11.00" } });

    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(screen.getByText(/Section 1: add a section name for Steak & Eggs/i)).toBeTruthy();
    expect(sectionInputs[0].getAttribute("aria-invalid")).toBe("true");
    expect(sectionInputs[1].getAttribute("aria-invalid")).not.toBe("true");
  });
});
