/**
 * Inbox for Make Me This requests others sent to the signed-in diner.
 */

import * as s from "./myMenuplyStyles.js";

export default function MakeMeThisInboxPanel({
  items = [],
  onOpen,
  loading = false,
}) {
  if (loading) {
    return (
      <p style={s.muted} data-testid="mmt-inbox-loading">
        Loading Make Me This…
      </p>
    );
  }
  if (!items.length) return null;

  return (
    <div style={styles.wrap} data-testid="mmt-inbox-panel">
      <h3 style={styles.title}>Make Me This for you</h3>
      <p style={styles.sub}>Private requests from Connections — not on the public Feed.</p>
      <ul style={styles.list}>
        {items.map((row) => {
          const food = String(row.food_name || row.item_name || "Dish").trim();
          const who = row.requester?.display_name || "Someone";
          return (
            <li key={row.id} style={styles.item}>
              <div>
                <div style={styles.food}>{food}</div>
                <div style={s.muted}>
                  from {who}
                  {row.viewer_has_responded ? " · You responded" : ""}
                </div>
              </div>
              <button type="button" style={s.chipBtn} onClick={() => onOpen?.(row)}>
                {row.viewer_has_responded ? "View" : "Respond"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const styles = {
  wrap: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  title: { margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#0f172a" },
  sub: { margin: "0 0 10px", fontSize: 12, color: "#64748b" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "8px 0",
    borderTop: "1px solid #e2e8f0",
  },
  food: { fontWeight: 700, fontSize: 14, color: "#0f172a" },
};
