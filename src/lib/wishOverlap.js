// "You both want" (Andre 2026-11-06, app lib/wishOverlap.ts): their Wish List ∩ yours. Same dish, or the
// same food at the same place (a wish with no place matches that food anywhere). Theirs first; max 3.
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const food = (w) => w?.item_name || w?.food_name || w?.food || "";
const dish = (w) => (w?.menu_item_id != null && Number.isFinite(Number(w.menu_item_id)) ? Number(w.menu_item_id) : null);

export function wishOverlap(theirs = [], mine = [], max = 3) {
  if (!theirs.length || !mine.length) return [];
  const myDishes = new Set(mine.map(dish).filter((d) => d != null));
  const out = [];
  const seen = new Set();
  for (const t of theirs) {
    const d = dish(t);
    const f = norm(food(t));
    if (!f && d == null) continue;
    const place = norm(t.restaurant_name);
    const match =
      (d != null && myDishes.has(d)) ||
      mine.some((m) => norm(food(m)) === f && (!place || !norm(m.restaurant_name) || norm(m.restaurant_name) === place));
    if (!match) continue;
    const key = `${f}|${place}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const mm = mine.find((m) => (d != null && dish(m) === d) || norm(food(m)) === f);
    out.push({ key, food: food(t), restaurantName: t.restaurant_name || mm?.restaurant_name || null });
    if (out.length >= max) break;
  }
  return out;
}
