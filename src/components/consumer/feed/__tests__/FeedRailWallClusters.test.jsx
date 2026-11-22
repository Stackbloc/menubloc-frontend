// @vitest-environment jsdom
/**
 * Created 2026-11-22: web Feed follows the app (dd4b302 + d36bd97, Andre 2026-11-21).
 * Wall + Clusters circles under Share, only where the diner's city has them (California or no city
 * → USC), no "USC Cluster" chip on clips, and Search back in the bar where Clusters was.
 * Mirrors menuply-mobile src/__tests__/feedWallClusters.test.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// The rail's Fav / Wish List hooks need a signed-in context; this test is about the circles' order.
vi.mock("../../../../hooks/useRestaurantFollow.js", () => ({
  default: () => ({ followed: false, statusLoading: false, actionLoading: false, toggleFollow: () => {} }),
}));
vi.mock("../../../../hooks/useMenuItemLike.js", () => ({
  default: () => ({ liked: false, loading: false, busy: false, toggle: () => {} }),
}));
vi.mock("../../../../hooks/useWishListEntry.js", () => ({
  default: () => ({ added: false, busy: false, error: "", toggle: () => {} }),
}));
vi.mock("../../../share/ShareModal.jsx", () => ({ default: () => null }));

import FeedVideoActionRail from "../FeedVideoActionRail.jsx";
import {
  clusterWallHref,
  homeFeedRailClusterLinks,
  pickFeedRailClusterLinks,
} from "../../../../hooks/useFeedRailClusterLinks.js";
import { marketOutsideClustersHome } from "../../../../lib/clusterLocation.js";
import { FEED_CLUSTERS_TAB_PATH, FEED_RIGHT_TABS, resolveFeedTabs } from "../../../../lib/feedShellLinks.js";

const root = path.resolve(__dirname, "../../../../..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

describe("Feed rail Wall + Clusters circles (2026-11-22)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("California (or no city) opens USC and the USC Wall", () => {
    expect(marketOutsideClustersHome({ city: "Los Angeles", state: "CA" })).toBe(false);
    expect(marketOutsideClustersHome({ city: "San Diego", state: "California" })).toBe(false);
    expect(marketOutsideClustersHome(null)).toBe(false);
    expect(homeFeedRailClusterLinks()).toEqual({
      clustersHref: FEED_CLUSTERS_TAB_PATH,
      wallHref: "/clusters/walls/usc",
    });
  });

  it("Dothan, AL has no Cluster and no Wall: neither circle shows", () => {
    expect(marketOutsideClustersHome({ city: "Dothan", state: "AL" })).toBe(true);
    expect(pickFeedRailClusterLinks([])).toEqual({ clustersHref: null, wallHref: null });
  });

  it("a city with a Cluster but no Wall shows Clusters only", () => {
    expect(
      pickFeedRailClusterLinks([{ slug: "ut-austin", name: "UT Austin", city: "Austin", state: "TX" }])
    ).toEqual({ clustersHref: "/clusters/texas/austin/ut-austin", wallHref: null });
    expect(clusterWallHref("USC")).toBe("/clusters/walls/usc");
  });

  it("rail order: … Share, Wall, Clusters (Clusters last, where Share used to sit)", () => {
    render(
      <MemoryRouter>
        <FeedVideoActionRail
          restaurantRef={{ restaurant_id: 1, restaurant_name: "Test" }}
          shareData={{ url: "https://menuply.com/x", title: "x" }}
          wallHref="/clusters/walls/usc"
          clustersHref={FEED_CLUSTERS_TAB_PATH}
        />
      </MemoryRouter>
    );
    const ids = [...screen.getByTestId("feed-video-action-rail").querySelectorAll("button")].map((b) =>
      b.getAttribute("data-testid")
    );
    expect(ids.slice(-3)).toEqual(["feed-rail-share", "feed-rail-wall", "feed-rail-clusters"]);
    expect(screen.getByTestId("feed-rail-wall-bricks")).toBeTruthy();
  });

  it("no circles without links", () => {
    render(
      <MemoryRouter>
        <FeedVideoActionRail restaurantRef={{ restaurant_id: 1 }} shareData={{ url: "https://menuply.com/x" }} />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("feed-rail-wall")).toBeNull();
    expect(screen.queryByTestId("feed-rail-clusters")).toBeNull();
  });

  it("no cluster chip on Feed clips; the Feed passes the rail links", () => {
    const screenSrc = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
    expect(screenSrc).not.toMatch(/FeedClipClusterBadge/);
    expect(screenSrc).toMatch(/wallHref=\{railWallHref\}/);
    expect(screenSrc).toMatch(/clustersHref=\{railClustersHref\}/);
  });

  it("Search is back in the bar where Clusters was (guest and Today layouts)", () => {
    expect(FEED_RIGHT_TABS.map((t) => t.label)).toEqual(["Deals", "Search", "Profile"]);
    const today = resolveFeedTabs({ isAuthenticated: true, todayHome: true });
    expect([...today.left, ...today.right].map((t) => t.label)).toEqual(["Today", "Feed", "Search", "Profile"]);
  });
});
