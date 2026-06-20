export const WAITER_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "brunch", label: "Brunch" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
];

const WAITER_MEAL_PERIOD_FALLBACKS = {
  breakfast: "For breakfast, you can explore available breakfast items, coffee options, bakery items, and morning-friendly restaurant menus.",
  brunch: "For brunch, you can explore breakfast plates, sandwiches, salads, coffee drinks, and casual dining options.",
  lunch: "For lunch, you can explore burgers, sandwiches, pizza, salads, fast food, and quick-service menus.",
  dinner: "For dinner, you can explore available restaurant menus, casual dining options, pizza, burgers, chicken dishes, and active deals.",
  late_night: "For late night, you can explore fast food, pizza, burgers, snacks, and any restaurants still showing available menu data.",
};

export function getMealPeriodFallback(mealPeriod) {
  return WAITER_MEAL_PERIOD_FALLBACKS[mealPeriod] || WAITER_MEAL_PERIOD_FALLBACKS.lunch;
}

export function getDefaultMealPeriod(date = new Date()) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const minutes = hour * 60 + minute;
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  if (minutes >= 300 && minutes < 630) return "breakfast";
  if (minutes >= 630 && minutes < 840) return weekend ? "brunch" : "lunch";
  if (minutes >= 840 && minutes < 1020) return "lunch";
  if (minutes >= 1020 && minutes < 1320) return "dinner";
  return "late_night";
}

export function getWaiterGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
