/**
 * Immediate discovery return after What I Wanna Eat save.
 * Value-extraction principle — not a matching UI.
 */

import { Link } from "react-router-dom";
import { labelWithFoodIcon } from "../../../lib/foodInterestIcons.js";
import { MY_MENUPLY_PROFILE_PATH } from "../../../lib/myMenuplyRoutes.js";

export default function WantDiscoveryPanel({
  discovery = null,
  onClose,
  onOpenFeed,
  mode = "want",
}) {
  if (!discovery) return null;

  const connects = Array.isArray(discovery.connects_related)
    ? discovery.connects_related
    : [];
  const nearby = Array.isArray(discovery.nearby) ? discovery.nearby : [];
  const videos = Array.isArray(discovery.videos) ? discovery.videos : [];
  const signal = discovery.food_signal || null;
  const savedVerb = mode === "ate" ? "You're eating" : "You saved";

  return (
    <section
      data-testid="want-discovery-panel"
      data-discovery-mode={mode}
      style={styles.wrap}
      aria-live="polite"
    >
      <div style={styles.head}>
        <p style={styles.headline}>{discovery.headline}</p>
        {typeof onClose === "function" ? (
          <button type="button" style={styles.close} onClick={onClose} aria-label="Dismiss">
            ×
          </button>
        ) : null}
      </div>

      {signal ? (
        <p style={styles.signal} data-testid="want-discovery-signal">
          {savedVerb}{" "}
          {labelWithFoodIcon(signal.food_interest_key || "food", signal.label || signal.food_name)}
        </p>
      ) : null}

      {connects.length > 0 ? (
        <div style={styles.block} data-testid="want-discovery-connects">
          <p style={styles.blockTitle}>From your connects</p>
          <ul style={styles.list}>
            {connects.map((row) => (
              <li key={`c-${row.kind}-${row.id}`} style={styles.item}>
                <Link
                  to={`/account/connections/${encodeURIComponent(String(row.consumer_user_id))}`}
                  style={styles.link}
                >
                  {row.message}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={styles.block} data-testid="want-discovery-nearby">
        <p style={styles.blockTitle}>People nearby</p>
        {nearby.length === 0 && connects.length === 0 ? (
          <p style={styles.empty}>
            No one nearby has posted this yet — keep watching Feed as diners share what they’re
            eating.
          </p>
        ) : nearby.length === 0 ? (
          <p style={styles.empty}>More community activity will show here as diners post nearby.</p>
        ) : (
          <ul style={styles.list}>
            {nearby.map((row) => (
              <li key={`n-${row.kind}-${row.id}`} style={styles.item}>
                <span style={styles.icon}>{row.icon || "🍽️"}</span>
                <span>
                  <strong>{row.display_name}</strong>
                  {row.kind === "want" ? " wants " : " is eating "}
                  {row.food_name}
                  {row.restaurant_name ? ` · ${row.restaurant_name}` : ""}
                  {row.local ? " · near you" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {videos.length > 0 ? (
        <div style={styles.block} data-testid="want-discovery-videos">
          <p style={styles.blockTitle}>Videos</p>
          <div style={styles.videoRow}>
            {videos.slice(0, 4).map((row) => (
              <a
                key={`v-${row.kind}-${row.id}`}
                href={row.video_url}
                target="_blank"
                rel="noreferrer"
                style={styles.videoChip}
              >
                {row.icon || "🎥"} {row.display_name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.actions}>
        <Link to="/feed" style={styles.primary} onClick={onOpenFeed}>
          See Who’s Eating
        </Link>
        <Link to={MY_MENUPLY_PROFILE_PATH} style={styles.secondary}>
          Back to My Menuply
        </Link>
      </div>
    </section>
  );
}

const styles = {
  wrap: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
  },
  head: { display: "flex", gap: 8, alignItems: "flex-start" },
  headline: {
    margin: 0,
    flex: 1,
    fontSize: 15,
    fontWeight: 700,
    color: "#14532d",
    lineHeight: 1.35,
  },
  close: {
    border: "none",
    background: "transparent",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
    color: "#64748b",
  },
  signal: { margin: "8px 0 0", fontSize: 13, color: "#166534" },
  block: { marginTop: 12 },
  blockTitle: {
    margin: "0 0 6px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  item: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  icon: { flexShrink: 0 },
  link: { color: "#166534", textDecoration: "none" },
  empty: { margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.4 },
  videoRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  videoChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ecfdf5",
    color: "#166534",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
  primary: {
    display: "inline-flex",
    padding: "10px 14px",
    borderRadius: 10,
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 14,
  },
  secondary: {
    display: "inline-flex",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    color: "#334155",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  },
};
