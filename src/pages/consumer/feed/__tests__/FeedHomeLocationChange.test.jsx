/* @vitest-environment jsdom */
// 2026-11-23 (Andre): changing the location from ☰ must swap the Feed's clips on the same screen.
import React, { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../../lib/consumerApi.js", () => ({
  listSeeWhosEating: vi.fn(async ({ city }) => ({ items: [{ id: `${city}-1`, city }], next_cursor: null })),
}));
vi.mock("../../../../context/ConsumerContext.jsx", () => ({ useConsumer: () => ({ isAuthenticated: false, consumer: null }) }));
vi.mock("../../../../lib/useFeedShellDesktop.js", () => ({ useFeedShellDesktop: () => true }));
vi.mock("../../../../lib/shuffleProfileVideos.js", () => ({ shuffleFeedVideos: (rows) => rows }));
// Stand-in player that, like the real one, copies its clip list only when it mounts.
vi.mock("../../myMenuply/SeeWhosEatingFullscreen.jsx", () => ({
  default: function Player({ items }) {
    const [playlist] = useState(items);
    return <p data-testid="player">{playlist.map((r) => r.city).join(",")}</p>;
  },
}));

import FeedHomePage from "../FeedHomePage.jsx";
import { applyFeedLocation } from "../../../../lib/feedLocationChange.js";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("Feed location change", () => {
  it("shows the new city's clips without leaving the Feed", async () => {
    render(
      <MemoryRouter initialEntries={["/feed"]}>
        <FeedHomePage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId("player").textContent).toBe("Los Angeles"));
    act(() => {
      applyFeedLocation({ label: "Pasadena, CA", city: "Pasadena", state: "CA", lat: 34.16, lng: -118.14 });
    });
    await waitFor(() => expect(screen.getByTestId("player").textContent).toBe("Pasadena"));
  });
});
