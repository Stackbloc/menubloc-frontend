/* @vitest-environment jsdom */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  getDeliverySettings: vi.fn(),
  saveDeliveryProviderAccount: vi.fn(),
  updateDeliverySettings: vi.fn(),
  disconnectDeliveryProviderAccount: vi.fn(),
}));

vi.mock("../../../context/OperatorContext.jsx", () => ({
  useOperator: () => ({ selectedRestaurant: { id: 9, restaurant_name: "Lunch Wagon" } }),
}));

vi.mock("../../../lib/operatorApi.js", () => ({
  API_BASE: "https://api.example.test",
  ...api,
}));

import OperatorDeliveryPortalPanel from "../OperatorDeliveryPortalPanel.jsx";

const EMPTY_SETTINGS = {
  settings: { delivery_enabled: false, active_delivery_providers: [], accounts: [] },
};

describe("OperatorDeliveryPortalPanel (Uber Direct only)", () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getDeliverySettings.mockResolvedValue(EMPTY_SETTINGS);
  });

  it("shows only Uber Direct, with the webhook URL, and no DoorDash", async () => {
    render(<OperatorDeliveryPortalPanel />);
    await screen.findByTestId("delivery-provider-card-uber_direct");

    expect(screen.queryByTestId("delivery-provider-card-doordash_drive")).toBeNull();
    expect(document.body.textContent).not.toMatch(/DoorDash/);
    expect(screen.getByTestId("uber-direct-webhook-url").textContent).toBe(
      "https://api.example.test/api/webhooks/delivery/uber-direct"
    );
  });

  it("delivery fee: no 'Applies to', explains 6% exclusion, saves fee fields", async () => {
    api.updateDeliverySettings.mockResolvedValue({ ok: true });
    render(<OperatorDeliveryPortalPanel />);
    await screen.findByTestId("delivery-fee-help");

    expect(document.body.textContent).not.toMatch(/Applies to/);
    expect(screen.getByTestId("delivery-fee-help").textContent).toMatch(/6% does not apply/);

    fireEvent.click(screen.getByLabelText("Charge customers a delivery fee"));
    fireEvent.change(screen.getByLabelText("Flat amount"), { target: { value: "4.99" } });
    fireEvent.click(screen.getByRole("button", { name: /Save restaurant delivery settings/ }));

    await waitFor(() => expect(api.updateDeliverySettings).toHaveBeenCalled());
    const [, body] = api.updateDeliverySettings.mock.calls[0];
    expect(body.deliveryFeeEnabled).toBe(true);
    expect(body.deliveryFeeAmountCents).toBe(499);
    expect(body).not.toHaveProperty("deliveryFeeAppliesTo");
  });

  it("sends credentials as default provider and surfaces Uber's credential error", async () => {
    api.saveDeliveryProviderAccount.mockResolvedValue({
      ok: true,
      credential_check: { validated: false, error: "Uber Direct rejected these credentials." },
    });
    render(<OperatorDeliveryPortalPanel />);
    fireEvent.click(await screen.findByTestId("delivery-link-account-uber_direct"));

    fireEvent.change(screen.getByLabelText("Customer ID"), { target: { value: "cus_1" } });
    fireEvent.change(screen.getByLabelText("Client ID"), { target: { value: "cid" } });
    fireEvent.change(screen.getByLabelText("Client Secret"), { target: { value: "sec" } });
    fireEvent.change(screen.getByLabelText("Webhook signing key"), { target: { value: "whk" } });
    fireEvent.click(screen.getByRole("button", { name: /Save linked Uber Direct account/ }));

    await waitFor(() => expect(api.saveDeliveryProviderAccount).toHaveBeenCalled());
    const [, provider, body] = api.saveDeliveryProviderAccount.mock.calls[0];
    expect(provider).toBe("uber_direct");
    expect(body.isDefault).toBe(true);
    expect(body.credentials).toEqual({
      customerId: "cus_1",
      clientId: "cid",
      clientSecret: "sec",
      webhookSigningKey: "whk",
    });
    expect(await screen.findByText("Uber Direct rejected these credentials.")).toBeTruthy();
  });
});
