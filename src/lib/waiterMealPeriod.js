export const WAITER_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "brunch", label: "Brunch" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
];

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
