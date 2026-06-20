export const WAITER_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "afternoon", label: "Afternoon" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
];

const WAITER_MEAL_PERIOD_FALLBACKS = {
  breakfast: {
    title: "Looking for breakfast?",
    paragraphs: [
      "Waiter looks for morning-friendly menu items in the real menu data currently available in your market.",
      "You can also search Menuply for breakfast favorites while local coverage continues to grow.",
    ],
  },
  lunch: {
    title: "Looking for lunch?",
    paragraphs: ["Waiter looks for lunch-friendly menu items in the real menu data currently available in your market."],
  },
  afternoon: {
    title: "Looking for an afternoon option?",
    paragraphs: ["Waiter looks for snacks, drinks, lighter meals, and other afternoon-friendly items in available menu data."],
  },
  dinner: {
    title: "Looking for dinner?",
    paragraphs: ["Waiter looks for dinner-friendly menu items in the real menu data currently available in your market."],
  },
  late_night: {
    title: "Looking for a late-night bite?",
    paragraphs: ["Waiter looks for late-night-friendly menu items in the real menu data currently available in your market."],
  },
};

export function getMealPeriodFallback(mealPeriod) {
  return WAITER_MEAL_PERIOD_FALLBACKS[mealPeriod] || WAITER_MEAL_PERIOD_FALLBACKS.lunch;
}

export function getDefaultMealPeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "dinner";
  return "late_night";
}

export function getWaiterGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
