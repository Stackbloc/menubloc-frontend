/* @vitest-environment jsdom */
/**
 * Andre 2026-11-22: the Search box camera opens Add a menu (/menu-capture, photograph a menu) with the
 * camera + menu card icon used for restaurants with no menu items, and a hover explanation.
 */
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("../../../../hooks/useHomeBrowseFeed.js", () => ({
  useHomeBrowseFeed: () => ({
    autoLocation: { label: "Los Angeles, CA" },
    appliedLocation: null,
    setAppliedLocation: () => {},
    shouldUseGeoBrowse: false,
    locating: false,
  }),
}));
vi.mock("../../../../hooks/useMarketClusters.js", () => ({ useMarketClusters: () => ({ market: null, clusters: [] }) }));
vi.mock("../../../homeNext/HomeNextLocationSelector.jsx", () => ({ default: () => null }));
vi.mock("../../../../services/posthog.js", () => ({ captureEvent: () => {} }));
let signedIn = true;
vi.mock("../../../../context/ConsumerContext.jsx", () => ({ useConsumer: () => ({ isAuthenticated: signedIn }) }));

import AppSearchHome, { SEARCH_MENU_CAMERA_HINT, SEARCH_MENU_CAMERA_PATH } from "../AppSearchHome.jsx";

afterEach(cleanup);

function LoginProbe() {
  const loc = useLocation();
  return <p data-testid="login-page">{loc.search}</p>;
}

function renderSearch() {
  return render(
    <MemoryRouter initialEntries={["/feed/search"]}>
      <Routes>
        <Route path="/feed/search" element={<AppSearchHome />} />
        <Route path="/menu-capture" element={<p data-testid="menu-capture-page">capture</p>} />
        <Route path="/account/login" element={<LoginProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Search box camera = Add a menu", () => {
  it("uses the camera + menu card icon, explains itself on hover, and opens /menu-capture", () => {
    renderSearch();
    const camera = screen.getByTestId("search-camera");
    expect(camera.getAttribute("aria-label")).toBe(SEARCH_MENU_CAMERA_HINT);
    expect(camera.getAttribute("title")).toBe(SEARCH_MENU_CAMERA_HINT);
    // AddMenuIcon: a menu card (rect + lines) with a camera in front, not the plain camera glyph.
    expect(camera.querySelectorAll("svg rect").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByTestId("search-camera-hint")).toBeNull();
    fireEvent.mouseEnter(camera.parentElement);
    expect(screen.getByTestId("search-camera-hint").textContent).toBe(SEARCH_MENU_CAMERA_HINT);
    fireEvent.mouseLeave(camera.parentElement);
    expect(screen.queryByTestId("search-camera-hint")).toBeNull();
    expect(screen.queryByText(/Photo search is coming soon/)).toBeNull();
    fireEvent.click(camera);
    expect(SEARCH_MENU_CAMERA_PATH).toBe("/menu-capture");
    expect(screen.getByTestId("menu-capture-page")).toBeTruthy();
  });

  it("signed out: goes straight to sign in, coming back to /menu-capture", () => {
    signedIn = false;
    try {
      renderSearch();
      fireEvent.click(screen.getByTestId("search-camera"));
      expect(screen.getByTestId("login-page").textContent).toBe("?next=%2Fmenu-capture");
    } finally {
      signedIn = true;
    }
  });
});
