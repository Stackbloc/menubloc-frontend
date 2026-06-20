import { toCityStateSlug } from "./cityStateSlug.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export async function fetchWaiterBriefing(city, state, mealPeriod) {
  if (!city || !state) return { ok: true, city: null, state: null, cards: [] };
  const url = `${API}/api/waiter/briefing?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&meal_period=${encodeURIComponent(mealPeriod || "lunch")}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Briefing fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchWaiterMarketCounts(city, state) {
  const marketSlug = toCityStateSlug(city, state);
  if (!marketSlug) return null;
  const res = await fetch(`${API}/public/market/${encodeURIComponent(marketSlug)}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Market fetch failed: ${res.status}`);
  const data = await res.json();
  return data?.ok ? data.market || null : null;
}
