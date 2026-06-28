const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export async function fetchWaiterBriefing(city, state, mealPeriod) {
  if (!city || !state) return { ok: true, city: null, state: null, recommendations: [] };
  const url = `${API}/api/waiter/briefing?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&meal_period=${encodeURIComponent(mealPeriod || "lunch")}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Briefing fetch failed: ${res.status}`);
  return res.json();
}

/** Confidence-based Waiter intent — call only when query may need guided/exploratory navigation. */
export async function fetchWaiterIntent(q, options = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (options.waiter_bypass) params.set("waiter_bypass", "1");
  if (options.waiter_resolved) params.set("waiter_resolved", "1");
  if (options.family_id) params.set("family_id", options.family_id);
  if (options.form_id) params.set("form_id", options.form_id);
  if (options.food_id) params.set("food_id", options.food_id);
  const url = `${API}/api/waiter/intent?${params.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Waiter intent fetch failed: ${res.status}`);
  return res.json();
}

/** FNS hierarchical navigation resolve — platform endpoint (Phase 1b). */
export async function fetchFoodNavResolve(q, options = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (options.family_id) params.set("family_id", options.family_id);
  if (options.form_id) params.set("form_id", options.form_id);
  if (options.food_id) params.set("food_id", options.food_id);
  if (options.bypass) params.set("bypass", "1");
  if (options.resolved) params.set("resolved", "1");
  if (options.decisions != null) params.set("decisions", String(options.decisions));
  const url = `${API}/api/food-nav/resolve?${params.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Food nav resolve failed: ${res.status}`);
  return res.json();
}

/** PHMS client telemetry for Food Navigation (non-blocking). */
export async function recordFoodNavEvent(event) {
  try {
    await fetch(`${API}/api/food-nav/events`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // ignore
  }
}
