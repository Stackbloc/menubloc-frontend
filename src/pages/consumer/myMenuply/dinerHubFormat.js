import { mealPeriodLabel, normalizeWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";

export function planYmd(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return "";
}

export function compareYmd(ymd, today) {
  const day = planYmd(ymd);
  if (!day) return 0;
  if (day > today) return 1;
  if (day < today) return -1;
  return 0;
}

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

/** "Mon., June 2nd. Breakfast. Hashbrowns" */
export function formatEatingCaption(item) {
  const ymd = planYmd(item?.eaten_on);
  const d = ymd ? new Date(`${ymd}T12:00:00`) : null;
  let datePart = "";
  if (d && !Number.isNaN(d.getTime())) {
    const wk = d.toLocaleDateString(undefined, { weekday: "short" });
    const month = d.toLocaleDateString(undefined, { month: "long" });
    datePart = `${wk}., ${month} ${ordinal(d.getDate())}`;
  }
  const meal = mealPeriodLabel(normalizeWhatIAteMealPeriod(item?.meal_period));
  const dish = item?.food_name || item?.item_name || item?.itemName || "Food";
  return [datePart, meal, dish].filter(Boolean).join(". ");
}
