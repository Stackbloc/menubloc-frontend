import { describe, expect, it, vi, afterEach } from "vitest";
import {
  formatClaimPlanPrice,
  fetchRestaurantClaimPlans,
} from "../restaurantClaimPlans.js";

describe("formatClaimPlanPrice", () => {
  it("formats free and billed plans from catalog amounts", () => {
    expect(formatClaimPlanPrice({ amount_cents: 0 })).toBe("Free");
    expect(formatClaimPlanPrice({ amount_cents: 2000, billing_interval: "month" })).toBe(
      "$20/month"
    );
    expect(formatClaimPlanPrice({ amount_cents: 19900, billing_interval: "year" })).toBe(
      "$199/year"
    );
  });
});

describe("fetchRestaurantClaimPlans", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns plans from the restaurant_claim audience endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          plans: [
            { code: "published_free", public_name: "Starter", amount_cents: 0 },
            { code: "starter_monthly", public_name: "Pro", amount_cents: 2000 },
          ],
        }),
      }))
    );

    const result = await fetchRestaurantClaimPlans();
    expect(result.ok).toBe(true);
    expect(result.plans).toHaveLength(2);
    expect(result.plans[0].code).toBe("published_free");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/stripe/platform/plans?audience=restaurant_claim")
    );
  });

  it("does not fall back to hard-coded plans on failure", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ ok: false, error: "boom" }),
      }))
    );

    const result = await fetchRestaurantClaimPlans();
    expect(result.ok).toBe(false);
    expect(result.error).toBe("temporarily_unavailable");
    expect(result.plans).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});
