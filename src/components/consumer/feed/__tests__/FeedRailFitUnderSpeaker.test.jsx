/**
 * Andre 2026-11-22: "Fav and mute are stacked" — on short screens the 7-circle Feed rail shrinks from
 * its bottom edge so it stays under the speaker button; tall screens keep it at full size.
 */
import { describe, expect, it } from "vitest";
import { fitRailScale } from "../FeedVideoActionRail.jsx";

describe("fitRailScale", () => {
  it("keeps full size when the rail already clears the speaker", () => {
    expect(fitRailScale({ railBottomEdge: 600, railHeight: 480, topLimit: 58 })).toBe(1);
  });
  it("shrinks just enough on a short screen (rail would reach the speaker)", () => {
    // 375×560 Safari: rail bottom edge 380, natural height 380 → top at 0, under the speaker (58).
    const s = fitRailScale({ railBottomEdge: 380, railHeight: 380, topLimit: 58 });
    expect(s).toBeLessThan(1);
    expect(380 - 380 * s).toBeGreaterThanOrEqual(58 - 0.5);
  });
  it("never shrinks below 60%", () => {
    expect(fitRailScale({ railBottomEdge: 200, railHeight: 400, topLimit: 58 })).toBe(0.6);
  });
  it("leaves an unmeasured rail alone", () => {
    expect(fitRailScale({ railBottomEdge: 0, railHeight: 0, topLimit: 58 })).toBe(1);
  });
});
