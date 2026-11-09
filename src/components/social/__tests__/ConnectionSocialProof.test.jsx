import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ConnectionSocialProof from "../ConnectionSocialProof.jsx";
import { fetchRestaurantConnectionSocialProof } from "../../../lib/consumerApi.js";

vi.mock("../../../context/ConsumerContext.jsx", () => ({ useConsumer: () => ({ isAuthenticated: true }) }));
vi.mock("../DinerAvatar.jsx", () => ({ default: () => null }));
vi.mock("../../../lib/consumerApi.js", () => ({
  fetchRestaurantConnectionSocialProof: vi.fn(),
  fetchMenuItemConnectionSocialProof: vi.fn(),
}));

const show = () =>
  render(
    <MemoryRouter>
      <ConnectionSocialProof restaurantId={5} />
    </MemoryRouter>,
  );

describe("ConnectionSocialProof restaurant rows", () => {
  it("Connects link to their profile and have Invite; others link to the preview with no Invite", async () => {
    fetchRestaurantConnectionSocialProof.mockResolvedValue({
      enabled: true,
      has_signals: true,
      counts: { like: 1 },
      avatars: [{ user_id: 7, display_name: "Maya", signals: ["like", "wish"] }],
      others: [{ user_id: 9, display_name: "Leo", signals: ["like"] }],
    });
    show();
    const maya = (await screen.findByText("Maya")).closest("a");
    expect(maya.getAttribute("href")).toBe("/account/connections/7");
    expect(screen.getByText("Fav · Wish List")).toBeTruthy();
    expect(screen.getByText("Invite").getAttribute("href")).toBe(
      "/account/invite-to-eat?restaurant_id=5&invitee_name=Maya",
    );
    expect(screen.getByText("Leo").closest("a").getAttribute("href")).toBe("/diners/9");
    expect(screen.getAllByText("Invite")).toHaveLength(1);
  });

  it("shows others alone when no Connect has activity", async () => {
    fetchRestaurantConnectionSocialProof.mockResolvedValue({
      enabled: true,
      has_signals: false,
      others: [{ user_id: 9, display_name: "Leo", signals: ["like"] }],
    });
    show();
    expect(await screen.findByTestId("social-proof-others")).toBeTruthy();
    expect(screen.queryByTestId("connection-social-proof")).toBeNull();
  });
});
