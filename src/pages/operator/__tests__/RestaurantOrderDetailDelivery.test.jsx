/* @vitest-environment jsdom */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const api = vi.hoisted(() => ({
  acceptOrder: vi.fn(),
  declineOrder: vi.fn(),
  getRestaurantOrderDetail: vi.fn(),
  markOrderCompleted: vi.fn(),
  markOrderPreparing: vi.fn(),
  markOrderReady: vi.fn(),
  retryOrderDeliveryDispatch: vi.fn(),
}));

vi.mock("../../../lib/operatorApi.js", () => api);
vi.mock("../OperatorLayout.jsx", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../../../context/LanguageContext.jsx", () => ({
  useLanguage: () => ({ t: (key, fallback) => fallback || key }),
}));

import RestaurantOrderDetailPage from "../RestaurantOrderDetailPage.jsx";

function order(overrides = {}) {
  return {
    id: 42,
    restaurant_id: 9,
    fulfillment_type: "delivery",
    order_status: "accepted",
    payment_status: "paid",
    subtotal_cents: 900,
    tax_cents: 90,
    total_cents: 990,
    delivery_address_json: { line1: "1 Main St" },
    items: [],
    events: [],
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/operator/orders/42"]}>
      <Routes>
        <Route path="/operator/orders/:orderId" element={<RestaurantOrderDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("order detail — Uber Direct courier", () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("shows courier status, tracking link, and Uber's fee", async () => {
    api.getRestaurantOrderDetail.mockResolvedValue({
      order: order({
        delivery_provider: "uber_direct",
        delivery_external_id: "del_9",
        delivery_status: "pickup",
        delivery_payload_json: { tracking_url: "https://delivery.uber.com/orders/x", provider_fee_cents: 650 },
      }),
    });
    renderPage();
    expect((await screen.findByTestId("order-delivery-status")).textContent).toMatch(
      /Courier on the way to pick up · Uber Direct/
    );
    expect(screen.getByTestId("order-delivery-tracking").getAttribute("href")).toBe(
      "https://delivery.uber.com/orders/x"
    );
    expect(screen.getByText("$6.50")).toBeTruthy();
    expect(screen.queryByTestId("order-delivery-retry")).toBeNull();
  });

  it("shows a failed request and retries it", async () => {
    api.getRestaurantOrderDetail.mockResolvedValueOnce({
      order: order({
        delivery_status: "dispatch_failed",
        delivery_payload_json: { dispatch_error: "Pickup phone number is required in a valid format for Uber Direct." },
      }),
    });
    api.getRestaurantOrderDetail.mockResolvedValueOnce({
      order: order({ delivery_provider: "uber_direct", delivery_external_id: "del_9", delivery_status: "pending" }),
    });
    api.retryOrderDeliveryDispatch.mockResolvedValue({ ok: true, delivery: { dispatched: true } });

    renderPage();
    expect((await screen.findByTestId("order-delivery-error")).textContent).toMatch(/Pickup phone number/);
    fireEvent.click(screen.getByTestId("order-delivery-retry"));

    await waitFor(() => expect(api.retryOrderDeliveryDispatch).toHaveBeenCalledWith(9, "42"));
    expect((await screen.findByTestId("order-delivery-status")).textContent).toMatch(/finding a driver/);
    expect(window.alert).not.toHaveBeenCalled();
  });
});
