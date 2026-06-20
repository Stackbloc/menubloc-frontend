export const WAITER_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "brunch", label: "Brunch" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
];

const WAITER_MEAL_PERIOD_FALLBACKS = {
  breakfast: {
    title: "Looking for breakfast?",
    paragraphs: [
      "Browse available breakfast menus and morning favorites currently available in Menuply.",
      "As we continue expanding coverage, Waiter will learn your preferences and provide more personalized recommendations.",
    ],
  },
  brunch: {
    title: "Looking for brunch?",
    paragraphs: ["Browse available brunch-friendly menus, breakfast favorites, sandwiches, coffee drinks, and casual dining options currently available in Menuply."],
  },
  lunch: {
    title: "Looking for lunch?",
    paragraphs: ["Browse available burgers, sandwiches, pizza, salads, chicken dishes, and other lunch-friendly menu items currently available in Menuply."],
  },
  dinner: {
    title: "Looking for dinner?",
    paragraphs: ["Browse available restaurant menus, dinner options, pizza, burgers, chicken dishes, and other evening favorites currently available in Menuply."],
  },
  late_night: {
    title: "Looking for a late-night bite?",
    paragraphs: ["Browse available fast food, pizza, burgers, snacks, and other late-night options currently available in Menuply."],
  },
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
