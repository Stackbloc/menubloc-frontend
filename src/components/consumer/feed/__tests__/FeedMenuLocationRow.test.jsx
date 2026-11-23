/* @vitest-environment jsdom */
// 2026-11-23 (Andre): ☰ → location drops down with a field to type; it no longer opens Search.
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../../lib/geocodeUtils.js", () => ({ forwardGeocode: vi.fn(async () => ({ lat: 30.27, lng: -97.74 })) }));

import FeedMenuLocationRow from "../FeedMenuLocationRow.jsx";
import { FEED_LOCATION_EVENT, resolveTypedLocation } from "../../../../lib/feedLocationChange.js";
import { readDetectedLocation } from "../../../../lib/discoveryLocationPersistence.js";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("FeedMenuLocationRow", () => {
  it("Change opens an inline field (no link to Search); typing a city saves it and tells the Feed", async () => {
    const onDone = vi.fn();
    const heard = vi.fn();
    window.addEventListener(FEED_LOCATION_EVENT, heard);
    render(
      <MemoryRouter>
        <FeedMenuLocationRow onDone={onDone} />
      </MemoryRouter>
    );
    const row = screen.getByTestId("feed-more-location");
    expect(row.tagName).toBe("BUTTON");
    expect(row.closest("a")).toBeNull();
    fireEvent.click(row);
    const input = screen.getByTestId("feed-location-input");
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "austin tx" } });
    fireEvent.click(screen.getByTestId("feed-location-go"));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = readDetectedLocation(window.localStorage);
    expect(saved.city).toBe("Austin");
    expect(saved.state).toBe("TX");
    expect(heard).toHaveBeenCalled();
    expect(screen.getByTestId("feed-more-location").textContent).toMatch(/Austin/);
    window.removeEventListener(FEED_LOCATION_EVENT, heard);
  });

  it("zip or city alone takes city/state from the reverse lookup; unknown place → null", async () => {
    const reverse = vi.fn(async () => ({ city: "Los Angeles", state: "CA" }));
    const r = await resolveTypedLocation("90007", { geocode: async () => ({ lat: 34.02, lng: -118.28 }), reverse });
    expect(r).toMatchObject({ label: "Los Angeles, CA", city: "Los Angeles", state: "CA" });
    expect(await resolveTypedLocation("zzzz", { geocode: async () => null, reverse })).toBeNull();
  });
});
