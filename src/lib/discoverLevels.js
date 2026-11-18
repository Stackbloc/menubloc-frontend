/**
 * How discoverable are you? (Profile "Who can find you", Andre 2026-11-02): Hidden · My Connects
 * (default) · Connects of Connects · Everyone. Shared by AppDiscoverabilityCard and My Vibe.
 */
export const DISCOVER_LEVELS = [
  { value: "hidden", label: "Hidden", hint: "Nobody can find you, and you won’t see or discover anyone either. Your Connects stay connected." },
  { value: "connects", label: "My Connects", hint: "Your Connects see your vibe in food search. (Default)" },
  { value: "connects_of_connects", label: "Connects of Connects", hint: "Also their Connects (they see your first name only)." },
  { value: "everyone", label: "Everyone", hint: "Anyone on Menuply searching food in your city sees your first name, photo and vibe." },
];

/** Minors are Connects only (Andre 2026-11-18): the wider levels are locked under 18. */
export const MINOR_CONNECTS_ONLY_NOTE = "You’re under 18, so only your Connects can find you or see your vibe.";
export const MINOR_LOCKED_LEVELS = ["connects_of_connects", "everyone"];

/** Level → its label: "My Connects". */
export const discoverLabelOf = (level) => DISCOVER_LEVELS.find((l) => l.value === level)?.label || "";

export function discoverLevelOf(profile) {
  if (profile?.discoverability === "nobody") return "hidden";
  // A minor's older wider setting reads as My Connects (the server only uses Connects anyway).
  if (profile?.minor_connects_only === true) return "connects";
  if (profile?.search_vibe_audience === "everyone") return "everyone";
  return profile?.search_vibe_audience === "connects_of_connects" ? "connects_of_connects" : "connects";
}
