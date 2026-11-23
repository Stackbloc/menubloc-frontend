/* @vitest-environment jsdom */
// 2026-11-23 (Andre): ☰ → location drops down with a field to type; it no longer opens Search.
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const AUSTIN = { city_name: "Austin", state_code: "TX", lat: 30.29, lng: -97.75 };
vi.mock("../../../../lib/locationReferenceApi.js", () => ({ searchUsCities: vi.fn(async () => [AUSTIN]) }));

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

  it("picks the exact city name from our city table; zips and unknown places → null", async () => {
    const rows = [{ city_name: "East Pasadena", state_code: "CA", lat: 34.1, lng: -118.0 }, { city_name: "Pasadena", state_code: "CA", lat: 34.16, lng: -118.14 }];
    const search = vi.fn(async () => rows);
    expect(await resolveTypedLocation("pasadena ca", { search })).toMatchObject({ label: "Pasadena, CA", lat: 34.16 });
    expect(search).toHaveBeenCalledWith("Pasadena", "CA", 10);
    expect(await resolveTypedLocation("90007", { search })).toBeNull();
    expect(await resolveTypedLocation("zzzz", { search: async () => [] })).toBeNull();
  });

  it("shows matching cities as you type; clicking one sets the place", async () => {
    render(
      <MemoryRouter>
        <FeedMenuLocationRow />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId("feed-more-location"));
    fireEvent.change(screen.getByTestId("feed-location-input"), { target: { value: "aus" } });
    const list = await screen.findByTestId("feed-location-suggestions");
    fireEvent.click(list.querySelector("button"));
    expect(readDetectedLocation(window.localStorage).city).toBe("Austin");
  });
});
