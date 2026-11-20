// Created 2026-11-20: "No Clusters in [City, ST] yet" notice + market helpers.
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import NoClustersNotice from "../NoClustersNotice.jsx";
import {
  CLUSTER_DISCOVERY_LOCATION_KEY,
  marketDisplayLabel,
  marketHasCluster,
  noClustersNoticeCopy,
  resolveClusterAutoOpenPath,
  resolveClusterMarketFromStoredLocation,
  clustersTabTarget,
} from "../../../lib/clusterLocation.js";
import { FEED_CLUSTERS_TAB_PATH, FEED_RIGHT_TABS, resolveFeedTabTarget } from "../../../lib/feedShellLinks.js";
import { DETECTED_LOCATION_KEY } from "../../../lib/discoveryLocationPersistence.js";

const USC = { slug: "usc", city: "Los Angeles", state: "CA", name: "USC" };

describe("no-Clusters market helpers", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("labels the market as City, ST from abbreviations and URL slugs", () => {
    expect(marketDisplayLabel({ city: "Austin", state: "tx" })).toBe("Austin, TX");
    expect(marketDisplayLabel({ city: "Austin", state: "texas" })).toBe("Austin, TX");
    expect(marketDisplayLabel({ city: "New York", state: "new-york" })).toBe("New York, NY");
    expect(marketDisplayLabel({ city: "Austin", state: "" })).toBe("");
  });

  it("builds the notice copy", () => {
    expect(noClustersNoticeCopy({ city: "Austin", state: "TX" })).toEqual({
      title: "No Clusters in Austin, TX yet",
      body: "Search Austin for local restaurants and dishes.",
      action: "Search Austin",
    });
    expect(noClustersNoticeCopy({ city: "", state: "TX" })).toBeNull();
  });

  it("no longer auto-opens the empty city page when the market has no Cluster", () => {
    window.sessionStorage.setItem(CLUSTER_DISCOVERY_LOCATION_KEY, "Austin, TX");
    const market = resolveClusterMarketFromStoredLocation();
    expect(marketHasCluster([USC], market)).toBe(false);
    expect(resolveClusterAutoOpenPath([USC], market)).toBeNull();
  });

  it("still opens the local Cluster when there is one", () => {
    window.sessionStorage.setItem(CLUSTER_DISCOVERY_LOCATION_KEY, "Los Angeles, CA");
    const market = resolveClusterMarketFromStoredLocation();
    expect(marketHasCluster([USC], market)).toBe(true);
    expect(resolveClusterAutoOpenPath([USC], market)).toBe("/clusters/california/los-angeles/usc?view=menu");
  });

  it("falls back to the detected location when no city was typed", () => {
    window.localStorage.setItem(
      DETECTED_LOCATION_KEY,
      JSON.stringify({ label: "Austin, TX", city: "Austin", state: "TX", lat: 30.27, lng: -97.74 })
    );
    const market = resolveClusterMarketFromStoredLocation();
    expect(marketDisplayLabel(market)).toBe("Austin, TX");
  });
});

describe("NoClustersNotice", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("shows the city and sends Search to that city", () => {
    render(
      <MemoryRouter initialEntries={["/clusters/texas/austin"]}>
        <Routes>
          <Route path="/clusters/:stateSlug/:citySlug" element={<NoClustersNotice city="Austin" state="texas" />} />
          <Route path="/feed/search" element={<p>search page</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("No Clusters in Austin, TX yet")).toBeTruthy();
    expect(screen.getByText("Search Austin for local restaurants and dishes.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("no-clusters-search"));
    expect(screen.getByText("search page")).toBeTruthy();
    expect(window.sessionStorage.getItem(CLUSTER_DISCOVERY_LOCATION_KEY)).toBe("Austin, TX");
  });

  it("renders nothing without a city", () => {
    const { container } = render(
      <MemoryRouter>
        <NoClustersNotice city="" state="TX" />
      </MemoryRouter>
    );
    expect(container.textContent).toBe("");
  });
});

describe("Clusters tab rule (2026-11-20): USC in California, /clusters elsewhere", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });
  const tab = FEED_RIGHT_TABS.find((t) => t.testId === "feed-nav-clusters");

  it("keeps USC for California and for no known location", () => {
    expect(clustersTabTarget(null, FEED_CLUSTERS_TAB_PATH)).toBe(FEED_CLUSTERS_TAB_PATH);
    expect(clustersTabTarget({ city: "San Diego", state: "CA" }, FEED_CLUSTERS_TAB_PATH)).toBe(FEED_CLUSTERS_TAB_PATH);
    expect(resolveFeedTabTarget(tab)).toBe(FEED_CLUSTERS_TAB_PATH);
    window.sessionStorage.setItem(CLUSTER_DISCOVERY_LOCATION_KEY, "Fresno, CA");
    expect(resolveFeedTabTarget(tab)).toBe(FEED_CLUSTERS_TAB_PATH);
  });

  it("opens /clusters outside California", () => {
    window.sessionStorage.setItem(CLUSTER_DISCOVERY_LOCATION_KEY, "Austin, TX");
    expect(resolveFeedTabTarget(tab)).toBe("/clusters");
  });

  it("leaves other tabs alone", () => {
    expect(resolveFeedTabTarget({ to: "/feed/deals" })).toBe("/feed/deals");
  });
});
