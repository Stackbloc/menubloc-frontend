/* @vitest-environment jsdom */
// 2026-11-19: desktop Feed rail = the app's tabs + the app's ☰ accordion inline; "Clips | Deals" on every Feed.
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../../context/ConsumerContext.jsx", () => ({ useConsumer: () => ({ consumer: null, profile: null, logout: vi.fn() }) }));
vi.mock("../../../../context/OrderCartContext.jsx", () => ({ useOrderCart: () => ({ itemCount: 0 }) }));
vi.mock("../../../../hooks/useConsumerFeatureFlags.js", () => ({ default: () => ({ todayHome: false }) }));
vi.mock("../../../BrandLogo.jsx", async (orig) => ({ ...(await orig()), BrandLogo: () => null }));

import FeedDesktopRail from "../FeedDesktopRail.jsx";
import FeedChannelSwitch from "../FeedChannelSwitch.jsx";

describe("FeedDesktopRail", () => {
  it("app tab order, then the ☰ accordion with the Feed location row; no More button", () => {
    render(
      <MemoryRouter initialEntries={["/feed"]}>
        <FeedDesktopRail />
      </MemoryRouter>
    );
    const tabs = [...screen.getByRole("navigation", { name: "Primary" }).querySelectorAll("button")].map((b) => b.textContent);
    expect(tabs).toEqual(["Home", "Post", "Deals", "Clusters", "Profile"]);
    expect(screen.getByTestId("feed-more-profile").textContent).toMatch(/Sign in/);
    expect(screen.getByTestId("feed-more-events")).toBeTruthy();
    expect(screen.getByTestId("feed-more-location").textContent).toMatch(/Change/);
    const heads = screen.getAllByTestId(/^feed-more-section-/).map((n) => n.textContent.replace(/[+−]$/, ""));
    expect(heads).toEqual(["Help", "Menuply"]);
    expect(screen.queryByTestId("feed-more-open-desktop")).toBeNull();
    expect(screen.queryByTestId("feed-desktop-shop-basket")).toBeNull();
  });

  it("Clips | Deals switch has the deal mark over Deals", () => {
    render(
      <MemoryRouter initialEntries={["/feed"]}>
        <FeedChannelSwitch />
      </MemoryRouter>
    );
    expect(screen.getByTestId("channel-feed").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("channel-deals").querySelector('[data-testid="channel-deals-icon"]')).toBeTruthy();
  });
});
