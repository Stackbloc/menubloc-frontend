/* @vitest-environment jsdom */
/**
 * Andre 2026-11-14: × in the Search box (same as the app) empties the words and keeps the cursor there.
 */
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
// 2026-11-22: the camera (Add a menu) reads sign-in state.
vi.mock("../../../../context/ConsumerContext.jsx", () => ({ useConsumer: () => ({ isAuthenticated: false }) }));

import AppSearchHome from "../AppSearchHome.jsx";

afterEach(cleanup);

describe("Search box ×", () => {
  it("shows once there are words; × empties the box and focuses it", () => {
    const onDraft = vi.fn();
    render(
      <MemoryRouter>
        <AppSearchHome onDraftQueryChange={onDraft} />
      </MemoryRouter>,
    );
    const input = screen.getByTestId("search-input");
    expect(screen.queryByTestId("search-clear")).toBeNull();
    fireEvent.change(input, { target: { value: "burgers" } });
    const clear = screen.getByTestId("search-clear");
    expect(clear.getAttribute("aria-label")).toBe("Clear search");
    fireEvent.click(clear);
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(onDraft).toHaveBeenLastCalledWith("");
    expect(screen.queryByTestId("search-clear")).toBeNull();
  });
});
