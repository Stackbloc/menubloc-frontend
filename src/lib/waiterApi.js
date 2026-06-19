const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export async function fetchWaiterBriefing(city, state, mealPeriod) {
  if (!city || !state) return { ok: true, city: null, state: null, cards: [] };
  const url = `${API}/api/waiter/briefing?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&meal_period=${encodeURIComponent(mealPeriod || "lunch")}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Briefing fetch failed: ${res.status}`);
  return res.json();
}
