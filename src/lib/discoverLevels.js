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

/** Level → its label: "My Connects". */
export const discoverLabelOf = (level) => DISCOVER_LEVELS.find((l) => l.value === level)?.label || "";

export function discoverLevelOf(profile) {
  if (profile?.discoverability === "nobody") return "hidden";
  if (profile?.search_vibe_audience === "everyone") return "everyone";
  return profile?.search_vibe_audience === "connects_of_connects" ? "connects_of_connects" : "connects";
}
