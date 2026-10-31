/**
 * Set up your profile: what the browser remembers for the steps the server can't see (same as the app's
 * src/lib/profileSetup.ts, Andre 2026-10-30). "friends" = the invite-friends share was opened, "out" =
 * an Invite to Eat was made or Deals was opened, "rewarded" = the all-done celebration was shown (the
 * Founding Foodie badge stays after it).
 */
const KEY = "menuply:profile-setup-marks";
export const SETUP_MARKS_EVENT = "menuply:profile-setup-marks";

export function readSetupMarks() {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function markSetup(step) {
  const marks = readSetupMarks();
  if (marks[step]) return marks;
  const next = { ...marks, [step]: true };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Best effort: the step just shows as not done yet.
  }
  try {
    window.dispatchEvent(new Event(SETUP_MARKS_EVENT));
  } catch {
    // No window (tests without a DOM).
  }
  return next;
}
