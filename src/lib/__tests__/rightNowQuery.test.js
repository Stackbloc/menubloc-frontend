/**
 * Andre 2026-11-15: after a Late night search, Back then Breakfast still showed Late night results —
 * "late night" was left in the box and the card kept typed words. A card's own words never stick.
 */
import { describe, expect, it } from "vitest";
import { rightNowQuery } from "../appSearchHome.js";

describe("rightNowQuery", () => {
  const breakfast = { query: "breakfast" };
  it("uses the card's query when the box is empty", () => {
    expect(rightNowQuery("", breakfast)).toBe("breakfast");
    expect(rightNowQuery("   ", breakfast)).toBe("breakfast");
  });
  it("drops another card's words left in the box", () => {
    expect(rightNowQuery("late night", breakfast)).toBe("breakfast");
    expect(rightNowQuery(" Late Night ", breakfast)).toBe("breakfast");
    expect(rightNowQuery("entrees", breakfast)).toBe("breakfast");
  });
  it("keeps words the diner typed", () => {
    expect(rightNowQuery("tacos", breakfast)).toBe("tacos");
  });
});
