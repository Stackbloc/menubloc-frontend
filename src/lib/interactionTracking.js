const BACKEND_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
).replace(/\/$/, "");

const SESSION_KEY = "grubbid_session_id";

/**
 * Returns a persistent UUID for this browser session.
 * Stored in localStorage under grubbid_session_id.
 * Returns null if localStorage is unavailable (e.g. private mode restrictions).
 */
function getGrubbidSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Module-level guard — prevents duplicate events within 500ms
// (covers double-clicks and React StrictMode double-invocations)
let lastEventTs = 0;

/**
 * Fire-and-forget interaction tracking.
 * Never blocks navigation. Errors are silently swallowed.
 * Deduplicated within a 500ms window.
 *
 * @param {string|number} menuItemId
 * @param {"view_item"|"click"|"compare"|"compare_item"|"similar_click"|"open_insights"|"open_nutrition"|"open_pairings"|"open_similar_items"|"add_to_cart"|"start_checkout"|"complete_order"} eventType
 */
function trackMenuItemInteraction(menuItemId, eventType) {
  const now = Date.now();
  if (now - lastEventTs < 500) return;
  lastEventTs = now;

  if (!menuItemId || !eventType) return;
  try {
    fetch(
      `${BACKEND_BASE}/menu-items/${encodeURIComponent(menuItemId)}/interact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": getGrubbidSessionId() || "",
        },
        body: JSON.stringify({ event_type: eventType, activity_type: eventType }),
        keepalive: true,
      }
    ).catch(() => {});
  } catch (e) {
    console.log("trackMenuItemInteraction error:", e?.message);
  }
}

export { getGrubbidSessionId, trackMenuItemInteraction };
