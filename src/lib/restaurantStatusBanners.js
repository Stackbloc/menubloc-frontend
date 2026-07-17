/**
 * Extensible restaurant status-banner catalog (mirror of backend IDs).
 * Happy Hour + Live Music are schedule-driven (see status events).
 */

export const RESTAURANT_STATUS_BANNERS = Object.freeze([
  {
    id: "now_hiring",
    label: "Now Hiring",
    emoji: "🟢",
    prominence: "primary",
    sort_order: 0,
    accent: "#15803d",
    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    border: "#86efac",
    glow: "rgba(34, 197, 94, 0.35)",
  },
  {
    id: "limited_time_special",
    label: "Limited-Time Special",
    emoji: "🔥",
    prominence: "standard",
    sort_order: 1,
    accent: "#c2410c",
    background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    border: "#fdba74",
    glow: "rgba(249, 115, 22, 0.22)",
  },
  {
    id: "grand_opening",
    label: "Grand Opening",
    emoji: "🎉",
    prominence: "standard",
    sort_order: 2,
    accent: "#7c3aed",
    background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    border: "#c4b5fd",
    glow: "rgba(139, 92, 246, 0.22)",
  },
  {
    id: "happy_hour",
    label: "Happy Hour",
    emoji: "🍺",
    prominence: "standard",
    sort_order: 3,
    scheduled: true,
    accent: "#b45309",
    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    border: "#fcd34d",
    glow: "rgba(245, 158, 11, 0.28)",
  },
  {
    id: "live_music",
    label: "Live Music",
    emoji: "🎵",
    prominence: "standard",
    sort_order: 4,
    scheduled: true,
    accent: "#be185d",
    background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
    border: "#f9a8d4",
    glow: "rgba(236, 72, 153, 0.25)",
  },
  {
    id: "watch_the_game",
    label: "Watch the Game Here",
    emoji: "🏈",
    prominence: "standard",
    sort_order: 5,
    accent: "#1d4ed8",
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "#93c5fd",
    glow: "rgba(59, 130, 246, 0.22)",
  },
  {
    id: "catering_available",
    label: "Catering Available",
    emoji: "🚚",
    prominence: "standard",
    sort_order: 6,
    accent: "#0f766e",
    background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
    border: "#5eead4",
    glow: "rgba(20, 184, 166, 0.2)",
  },
  {
    id: "healthy_options",
    label: "Healthy Options Available",
    emoji: "🥗",
    prominence: "standard",
    sort_order: 7,
    accent: "#3f6212",
    background: "linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%)",
    border: "#bef264",
    glow: "rgba(132, 204, 22, 0.22)",
  },
]);

const BANNER_BY_ID = Object.freeze(
  Object.fromEntries(RESTAURANT_STATUS_BANNERS.map((b) => [b.id, b]))
);

export const WEEKDAY_OPTIONS = Object.freeze([
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
]);

export function normalizeStatusBannerIds(input) {
  const raw = Array.isArray(input) ? input : [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    let id = String(item || "").trim();
    if (id === "live_music_tonight") id = "live_music";
    if (!id || !BANNER_BY_ID[id] || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  out.sort((a, b) => BANNER_BY_ID[a].sort_order - BANNER_BY_ID[b].sort_order);
  return out;
}

export function resolveStatusBanners(ids) {
  return normalizeStatusBannerIds(ids).map((id) => ({ ...BANNER_BY_ID[id] }));
}

export function emptyHappyHourEvent() {
  return {
    schedule_kind: "recurring",
    weekdays: [1, 2, 3, 4, 5],
    local_start_time: "16:00",
    local_end_time: "19:00",
    event_date: "",
    title: "",
    description: "",
    external_url: "",
    enabled: true,
  };
}

export function emptyLiveMusicEvent() {
  return {
    schedule_kind: "one_time",
    weekdays: [],
    local_start_time: "20:00",
    local_end_time: "",
    event_date: "",
    title: "",
    description: "",
    external_url: "",
    enabled: true,
  };
}
