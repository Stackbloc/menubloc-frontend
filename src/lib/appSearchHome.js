/**
 * Search home content, the same as the app's Search tab (menuply-mobile
 * src/features/search/searchHome.ts + timeOfDayThemes.tsx). The app wins where the two differ
 * (Andre 2026-10-29), so keep these in step with the app.
 *
 * Health goals: each one is its own search (query + the filter flag), not a filter left on.
 * Right now: four local-time themes; the meal period ranks results (meal time sorts, never hides).
 * Cravings: fixed food groups, one swipe page each, one color family per group.
 */

/** Health goals, in the app's order. filterKey is the website filter flag (filtersToUrlParams). */
export const APP_HEALTH_GOALS = [
  { id: "high-protein", label: "High Protein", query: "high protein" },
  { id: "low-carb", label: "Low Carb", query: "low carb", filterKey: "keto" },
  { id: "low-sodium", label: "Low Sodium", query: "low sodium", filterKey: "low_sodium" },
  { id: "vegetarian", label: "Vegetarian", query: "vegetarian", filterKey: "vegetarian" },
  { id: "high-fiber", label: "High Fiber", query: "high fiber" },
  { id: "under-700", label: "Under 700 Calories", query: "under 700 calories" },
  { id: "diabetic", label: "Diabetic Friendly", query: "diabetic friendly", filterKey: "diabetic_friendly" },
  // No text with this one; the backend picks the dishes from the flag.
  { id: "glp1", label: "GLP-1 Friendly", query: "", filterKey: "glp1_friendly" },
  { id: "low-fat", label: "Low Fat", query: "low fat", filterKey: "low_fat" },
];

/**
 * Time-of-day looks for the Right now card. Colors are fixed (not site tokens) so the card looks the
 * same in any theme; every text/background pair is AA.
 */
export const TIME_OF_DAY_THEMES = {
  breakfast: {
    id: "breakfast",
    startHour: 5,
    name: "Breakfast",
    hours: "5–10 AM",
    title: "Breakfast options near you",
    body: "Start the day right.",
    colors: { background: "#FFFFFF", border: "#E5E5E0", label: "#8B6508", title: "#111111", body: "#555555", button: "#FFC72C", buttonText: "#111111" },
  },
  lunch: {
    id: "lunch",
    startHour: 10,
    name: "Lunch",
    hours: "10 AM–6 PM",
    title: "Lunch options near you",
    body: "Quick bites, big flavor.",
    colors: { background: "#DCEFFB", label: "#185FA5", title: "#042C53", body: "#0C447C", button: "#042C53", buttonText: "#FFFFFF" },
  },
  dinner: {
    id: "dinner",
    startHour: 18,
    name: "Dinner",
    hours: "6–10 PM",
    title: "Dinner options near you",
    body: "Full meals available in your area.",
    colors: { background: "#474D49", label: "#F2D28B", title: "#FFFFFF", body: "#D6DCD3", button: "#FFFFFF", buttonText: "#2B302C" },
  },
  // Geared to college students: pizza, fast food, 24-hour places.
  lateNight: {
    id: "lateNight",
    startHour: 22,
    name: "Late night",
    hours: "10 PM–5 AM",
    title: "Late-night options still open",
    body: "Kitchens near you serving after 11pm.",
    colors: { background: "#121712", label: "#78C41A", title: "#FFFFFF", body: "#C9CFC6", button: "#78C41A", buttonText: "#121712" },
  },
};

export const TIME_OF_DAY_ORDER = ["breakfast", "lunch", "dinner", "lateNight"];

/** 05:00–09:59 breakfast, 10:00–17:59 lunch, 18:00–21:59 dinner, 22:00–04:59 late night (device time). */
export function getTimeOfDayTheme(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 18) return "lunch";
  if (hour >= 18 && hour < 22) return "dinner";
  return "lateNight";
}

// /search has no meal filter yet, so each window carries a query that fills the results.
const SEARCHES = {
  breakfast: { query: "breakfast", mealPeriod: "breakfast" },
  lunch: { query: "entrees", mealPeriod: "lunch" },
  dinner: { query: "entrees", mealPeriod: "dinner" },
  lateNight: { query: "late night", mealPeriod: "late_night" },
};

// Later windows don't claim anything is open yet; they help plan.
const AHEAD = {
  breakfast: { title: "Breakfast options near you", body: "Plan breakfast: early openings near you." },
  lunch: { title: "Lunch options near you", body: "Plan lunch: midday meals near you." },
  dinner: { title: "Dinner options near you", body: "Plan dinner: full meals in your area." },
  lateNight: { title: "Late-night options", body: "Plan late night: kitchens serving after 11pm." },
};

// No-break space, so "3 PM" never wraps apart.
const hourLabel = (h) => `${h % 12 || 12}\u00a0${h < 12 ? "AM" : "PM"}`;

/** The Right now card and, swiping left, the next three meal times ("Coming up · Dinner · 6 PM"). */
export function heroPages(now = new Date()) {
  const id = getTimeOfDayTheme(now);
  const t = TIME_OF_DAY_THEMES[id];
  const first = {
    id,
    label: `${t.name} · ${t.hours}`,
    title: t.title,
    body: t.body,
    button: "Show me",
    upcoming: false,
    ...SEARCHES[id],
  };
  const at = TIME_OF_DAY_ORDER.indexOf(id);
  const ahead = [1, 2, 3].map((step) => {
    const next = TIME_OF_DAY_ORDER[(at + step) % TIME_OF_DAY_ORDER.length];
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), TIME_OF_DAY_THEMES[next].startHour);
    if (start <= now) start.setDate(start.getDate() + 1);
    const tomorrow = start.getDate() !== now.getDate();
    return {
      ...SEARCHES[next],
      ...AHEAD[next],
      id: next,
      label: `${tomorrow ? "Tomorrow" : "Coming up"} · ${TIME_OF_DAY_THEMES[next].name} · ${hourLabel(TIME_OF_DAY_THEMES[next].startHour)}`,
      button: "Plan ahead",
      upcoming: true,
    };
  });
  return [first, ...ahead];
}

/** How often Search re-checks the window while it's on screen. */
export const HERO_REFRESH_MS = 60 * 1000;

const CRAVING_GROUPS = [
  {
    id: "american",
    title: "American Classics",
    tiles: [
      { label: "Burgers", query: "burgers", icon: "burger" },
      { label: "BBQ", query: "bbq", icon: "drumstick" },
      { label: "Wings", query: "wings", icon: "drumstick" },
      { label: "Fried chicken", query: "fried chicken", icon: "drumstick" },
      { label: "Pizza", query: "pizza", icon: "pizza" },
      { label: "Sandwiches", query: "sandwiches", icon: "sandwich" },
    ],
  },
  {
    id: "asian",
    title: "Asian",
    tiles: [
      { label: "Sushi", query: "sushi", icon: "sushi" },
      { label: "Ramen", query: "ramen", icon: "bowl" },
      { label: "Pho", query: "pho", icon: "bowl" },
      { label: "Dumplings", query: "dumplings", icon: "bowl" },
      { label: "Curry", query: "curry", icon: "bowl" },
      { label: "Poke", query: "poke", icon: "sushi" },
    ],
  },
  {
    id: "mexican",
    title: "Mexican",
    tiles: [
      { label: "Tacos", query: "tacos", icon: "taco" },
      { label: "Burritos", query: "burritos", icon: "taco" },
      { label: "Quesadillas", query: "quesadillas", icon: "taco" },
      { label: "Nachos", query: "nachos", icon: "taco" },
    ],
  },
  {
    id: "breakfast",
    title: "Breakfast",
    tiles: [
      { label: "Pancakes", query: "pancakes", icon: "egg" },
      { label: "Bagels", query: "bagels", icon: "sandwich" },
      { label: "Eggs & plates", query: "breakfast", icon: "egg" },
      { label: "Coffee", query: "coffee", icon: "coffee" },
    ],
  },
  {
    id: "fresh",
    title: "Fresh & Light",
    tiles: [
      { label: "Salads", query: "salads", icon: "salad" },
      { label: "Bowls", query: "bowls", icon: "bowl" },
      { label: "Smoothies", query: "smoothies", icon: "boba" },
      { label: "Wraps", query: "wraps", icon: "sandwich" },
    ],
  },
  {
    id: "sweet",
    title: "Sweet",
    tiles: [
      { label: "Desserts", query: "desserts", icon: "cupcake" },
      { label: "Boba", query: "boba", icon: "boba" },
      { label: "Ice cream", query: "ice cream", icon: "cupcake" },
      { label: "Donuts", query: "donuts", icon: "cupcake" },
    ],
  },
];

// App tokens: brandLime #77c517, accentSoft #e8f5e3, accent #0f7a24, ink #111613.
const INK = "#111613";
const CRAVING_PALETTES = [
  [
    { background: "#77c517", foreground: INK },
    { background: "#e8f5e3", foreground: "#0f7a24" },
    { background: INK, foreground: "#77c517" },
    { background: "#0f7a24", foreground: "#ffffff" },
  ],
  [
    { background: "#c1121f", foreground: "#ffffff" },
    { background: "#ffd6da", foreground: "#8a1c2b" },
    { background: "#3d0c11", foreground: "#ffb3ba" },
    { background: "#f4a261", foreground: INK },
  ],
  [
    { background: "#ffb703", foreground: INK },
    { background: "#ffe8cc", foreground: "#9a3412" },
    { background: "#023047", foreground: "#ffb703" },
    { background: "#fb8500", foreground: INK },
  ],
  [
    { background: "#ffca3a", foreground: INK },
    { background: "#fff3c4", foreground: "#7a4a00" },
    { background: "#3d2a14", foreground: "#ffca3a" },
    { background: "#f4a261", foreground: INK },
  ],
  [
    { background: "#0067a3", foreground: "#ffffff" },
    { background: "#caf0f8", foreground: "#03045e" },
    { background: "#03045e", foreground: "#90e0ef" },
    { background: "#00b4d8", foreground: INK },
  ],
  [
    { background: "#6a4c93", foreground: "#ffffff" },
    { background: "#e9d8fd", foreground: "#44337a" },
    { background: "#ffd6da", foreground: "#8a1c2b" },
    { background: "#1a6fa8", foreground: "#ffffff" },
  ],
];

/** The Cravings pages, in the fixed swipe order. */
export const CRAVING_PAGES = CRAVING_GROUPS.map((g, p) => ({
  id: g.id,
  title: g.title,
  cravings: g.tiles.map((t, i) => ({ ...t, ...CRAVING_PALETTES[p % CRAVING_PALETTES.length][i % 4] })),
}));
