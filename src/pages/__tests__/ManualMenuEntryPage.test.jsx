/* @vitest-environment jsdom */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ManualMenuEntryPage from "../ManualMenuEntryPage.jsx";

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
    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));
    expect(screen.getByText(/add at least one menu item/i)).toBeTruthy();
  });
});
