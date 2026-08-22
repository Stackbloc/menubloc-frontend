/**
 * Pick a crew or diner social event to share an invite link (from X → Plan & Invite).
 */

import { useState } from "react";

export default function InvitePickerSheet({
  open,
  kind = "crew",
  items = [],
  busy = false,
  emptyMessage,
  onClose,
  onPick,
}) {
  const [query, setQuery] = useState("");
  if (!open) return null;

  const title = kind === "event" ? "Invite to event" : "Invite to crew";
  const lead =
    kind === "event"
      ? "Pick one of your events. Anyone with the link can view it and accept Join Me if you turned that on."
      : "Pick a crew to share its join link.";

  const q = String(query || "").trim().toLowerCase();
  const filtered = (items || []).filter((row) => {
    if (!q) return true;
    const name =
      kind === "event"
        ? String(row.title || "").toLowerCase()
        : String(row.name || "").toLowerCase();
    return name.includes(q);
  });

  return (
    <div
      role="presentation"
      style={styles.backdrop}
      data-testid={`invite-picker-${kind}`}
      onClick={() => onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.head}>
          <p style={styles.title}>{title}</p>
          <button type="button" style={styles.close} onClick={() => onClose?.()} aria-label="Close">
            ✕
          </button>
        </div>
        <p style={styles.lead}>{lead}</p>
        {items.length > 3 ? (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            style={styles.search}
            data-testid="invite-picker-search"
          />
        ) : null}
        {filtered.length === 0 ? (
          <p style={styles.empty} data-testid="invite-picker-empty">
            {emptyMessage ||
              (kind === "event"
                ? "Create an event first from X → My Events."
                : "Create a crew first from X → My Crews.")}
          </p>
        ) : (
          <ul style={styles.list}>
            {filtered.map((row) => {
              const key = kind === "event" ? `ev-${row.id}` : `crew-${row.id}`;
              const label =
                kind === "event" ? String(row.title || "Event").trim() : String(row.name || "Crew").trim();
              const meta =
                kind === "event"
                  ? [row.event_date, row.location_label, row.join_me_open ? "Join Me open" : null]
                      .filter(Boolean)
                      .join(" · ")
                  : [
                      row.viewer_role === "owner" ? "Organized" : null,
                      `${row.member_count || 0} members`,
                    ]
                      .filter(Boolean)
                      .join(" · ");
              return (
                <li key={key}>
                  <button
                    type="button"
                    style={styles.rowBtn}
                    disabled={busy}
                    data-testid={`invite-picker-item-${row.id}`}
                    onClick={() => onPick?.(row)}
                  >
                    <span style={styles.rowTitle}>{label}</span>
                    {meta ? <span style={styles.rowMeta}>{meta}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    zIndex: 1100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "20px 20px 14px 14px",
    padding: "16px 16px 20px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
    maxHeight: "min(78vh, 560px)",
    overflowY: "auto",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
  close: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    cursor: "pointer",
  },
  lead: { margin: "0 0 12px", fontSize: 13, color: "#64748b", lineHeight: 1.45 },
  search: {
    width: "100%",
    minHeight: 40,
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    fontSize: 15,
    marginBottom: 10,
    boxSizing: "border-box",
  },
  empty: { margin: "12px 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.45 },
  list: { listStyle: "none", margin: 0, padding: 0 },
  rowBtn: {
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "transparent",
    padding: "12px 4px",
    borderTop: "1px solid #f2f4f7",
    cursor: "pointer",
  },
  rowTitle: { display: "block", fontSize: 15, fontWeight: 800, color: "#1F4E3D" },
  rowMeta: { display: "block", marginTop: 2, fontSize: 12, color: "#667085" },
};
