import { whatIAteTodayLocalDate } from "../../../lib/consumerApi.js";

export function planYmd(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return "";
}

export function compareYmd(ymd, today = whatIAteTodayLocalDate()) {
  const day = planYmd(ymd);
  if (!day) return 0;
  if (day > today) return 1;
  if (day < today) return -1;
  return 0;
}

/** Merge diary days (past/ate) and plan days (future) for one calendar. */
export function buildEatingDayMarkers({ eatingRows = [], planRows = [] } = {}) {
  const map = new Map();
  function bump(ymd, field) {
    if (!ymd) return;
    const row = map.get(ymd) || { ymd, past_count: 0, future_count: 0 };
    row[field] += 1;
    map.set(ymd, row);
  }
  for (const row of eatingRows) {
    bump(planYmd(row.eaten_on || row.created_at), "past_count");
  }
  for (const row of planRows) {
    bump(planYmd(row.plan_date), "future_count");
  }
  return [...map.values()];
}

export const EATING_FILTERS = [
  { id: "all", label: "All" },
  { id: "ate", label: "Ate" },
  { id: "want", label: "Want" },
  { id: "plans", label: "Plans" },
];

export const EATING_COMPOSE_CATEGORIES = [
  {
    id: "ate",
    label: "Ate",
    placeholder: "What did you eat today?",
    description: "Share what you ate — add a photo when you can.",
  },
  {
    id: "want",
    label: "Want",
    placeholder: "What foods do you want to eat in the future?",
    description: "Save cravings, menu picks, or weekend plans.",
  },
  {
    id: "plan",
    label: "Plan",
    placeholder: "Where are you going?",
    description: "Schedule future dining plans and invite others to join you.",
  },
];
