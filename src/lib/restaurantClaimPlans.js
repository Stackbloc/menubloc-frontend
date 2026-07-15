/**
 * Public restaurant-profile claim plan options.
 * Sourced from GET /api/stripe/platform/plans?audience=restaurant_claim
 * (menuplyPlanCatalog). No hard-coded fallback pricing.
 */

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export function formatClaimPlanPrice(plan) {
  const cents = Number(plan?.amount_cents);
  if (!Number.isFinite(cents) || cents <= 0) return "Free";
  const dollars = cents / 100;
  const amount =
    Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2).replace(/\.00$/, "")}`;
  const interval = String(plan?.billing_interval || "").toLowerCase();
  if (interval === "month") return `${amount}/month`;
  if (interval === "year") return `${amount}/year`;
  return amount;
}

/**
 * @returns {Promise<{ ok: true, plans: object[] } | { ok: false, error: string }>}
 */
export async function fetchRestaurantClaimPlans() {
  const url = `${API}/api/stripe/platform/plans?audience=restaurant_claim`;
  try {
    const res = await fetch(url);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !Array.isArray(json.plans)) {
      console.error("[claim_plans] failed to load restaurant claim plans", {
        status: res.status,
        error: json?.error || null,
      });
      return { ok: false, error: "temporarily_unavailable" };
    }
    return { ok: true, plans: json.plans };
  } catch (err) {
    console.error("[claim_plans] request failed", err?.message || err);
    return { ok: false, error: "temporarily_unavailable" };
  }
}
