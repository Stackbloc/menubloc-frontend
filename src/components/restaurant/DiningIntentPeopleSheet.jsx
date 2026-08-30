/**
 * Controlled social discovery for restaurant dining intent — full list behind
 * "See people who want to go" on the public restaurant profile.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { captureEvent } from "../../services/posthog.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { requestConnection, resolveConsumerMediaUrl } from "../../lib/consumerApi.js";

const INTENT_LABELS = {
  want_to_go: "wants to go",
  planning_to_go: "planning to go",
  looking_for_company: "looking for company",
};

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export default function DiningIntentPeopleSheet({
  open,
  onClose,
  restaurantId,
  restaurantName = "",
  items = [],
  onConnectionChange,
}) {
  const { isAuthenticated, consumer } = useConsumer();
  const [connectBusyId, setConnectBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  if (!open) return null;

  async function onConnect(peer) {
    if (!peer?.id || connectBusyId) return;
    if (!isAuthenticated) return;
    if (Number(consumer?.id) === Number(peer.id)) return;

    setConnectBusyId(peer.id);
    setNotice("");
    try {
      const data = await requestConnection({
        recipient_user_id: peer.id,
        source: "restaurant_dining_intent",
        source_ref: String(restaurantId),
      });
      captureEvent("dining_connection_requested", {
        restaurant_id: restaurantId,
        recipient_user_id: peer.id,
        source_surface: "restaurant_dining_intent_people_sheet",
      });
      const status = data?.connection?.status;
      setNotice(
        status === "accepted"
          ? `You're now Connects with ${peer.display_name}.`
          : `Connect request sent to ${peer.display_name}.`
      );
      await onConnectionChange?.();
    } catch (err) {
      const code = err?.payload?.code || err?.code;
      if (code === "already_connected") {
        setNotice(`You're already Connects with ${peer.display_name}.`);
      } else if (code === "already_pending") {
        setNotice("Connect request already pending.");
      } else {
        setNotice(err?.message || "Unable to send Connect request");
      }
    } finally {
      setConnectBusyId(null);
    }
  }

  const title = restaurantName
    ? `People who want to go to ${restaurantName}`
    : "People who want to go";

  return (
    <div style={styles.backdrop} role="presentation" onClick={() => onClose?.()}>
      <div
        style={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dining-intent-people-title"
        data-testid="dining-intent-people-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dining-intent-people-title" style={styles.title}>
          {title}
        </h2>
        <p style={styles.lead}>
          Diners who explicitly shared interest in this restaurant. Connect or invite when you&apos;re
          ready — Menuply respects each diner&apos;s visibility settings.
        </p>

        {notice ? (
          <p style={styles.notice} role="status">
            {notice}
          </p>
        ) : null}

        {items.length > 0 ? (
          <ul style={styles.list} data-testid="restaurant-dining-intent-list">
            {items.map((row) => {
              const peer = row.diner || {};
              const avatar = peer.avatar_url ? resolveConsumerMediaUrl(peer.avatar_url) : "";
              const label = INTENT_LABELS[row.intent_type] || "interested";
              const when =
                row.intent_date || row.time_window
                  ? [row.intent_date, row.time_window].filter(Boolean).join(" · ")
                  : null;
              const isSelf = consumer?.id != null && Number(consumer.id) === Number(peer.id);
              return (
                <li key={row.id} style={styles.row} data-testid={`restaurant-dining-intent-row-${row.id}`}>
                  <div style={styles.avatar} aria-hidden>
                    {avatar ? (
                      <img src={avatar} alt="" style={styles.avatarImg} loading="lazy" />
                    ) : (
                      <span>{initials(peer.display_name)}</span>
                    )}
                  </div>
                  <div style={styles.rowBody}>
                    <div style={styles.rowTitle}>
                      <strong>{peer.display_name || "A diner"}</strong> {label}
                      {row.item_name ? (
                        <>
                          {" "}
                          — <span style={styles.itemName}>{row.item_name}</span>
                        </>
                      ) : null}
                    </div>
                    {when ? <div style={styles.rowMeta}>{when}</div> : null}
                  </div>
                  {!isSelf && isAuthenticated && row.connection_status !== "connected" ? (
                    <button
                      type="button"
                      style={styles.connectBtn}
                      disabled={connectBusyId === peer.id || row.connection_status === "pending"}
                      onClick={() => onConnect(peer)}
                      data-testid={`restaurant-dining-intent-connect-${peer.id}`}
                    >
                      {row.connection_status === "pending" ? "Pending" : "Connect"}
                    </button>
                  ) : null}
                  {row.connection_status === "connected" ? (
                    <Link
                      to={`/account/invite-to-eat?restaurant_id=${encodeURIComponent(String(restaurantId))}`}
                      style={styles.inviteLink}
                      data-testid={`restaurant-dining-intent-invite-${peer.id}`}
                    >
                      Invite to Eat
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={styles.muted}>No visible dining intent right now.</p>
        )}

        <div style={styles.actions}>
          <button type="button" style={styles.secondary} onClick={() => onClose?.()}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 120000,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  },
  sheet: {
    width: "min(480px, 100%)",
    maxHeight: "90dvh",
    overflow: "auto",
    background: "#fff",
    borderRadius: "16px 16px 12px 12px",
    padding: "20px 18px 24px",
    color: "#1c1917",
    boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
  },
  title: { margin: "0 0 6px", fontSize: 20, fontWeight: 800, lineHeight: 1.25 },
  lead: { margin: "0 0 14px", fontSize: 13, lineHeight: 1.45, color: "#57534e" },
  notice: { margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#166534" },
  muted: { margin: "0 0 12px", fontSize: 14, color: "rgba(0,0,0,0.55)" },
  list: { listStyle: "none", margin: "0 0 14px", padding: 0, display: "grid", gap: 10 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.7)",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: "#e7e5e4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 14,
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, lineHeight: 1.4, color: "#1c1917" },
  rowMeta: { fontSize: 12, color: "#78716c", marginTop: 2 },
  itemName: { fontWeight: 600 },
  connectBtn: {
    flexShrink: 0,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #1F4E3D",
    background: "#fff",
    color: "#1F4E3D",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  inviteLink: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: 700,
    color: "#1F4E3D",
    textDecoration: "underline",
  },
  actions: { display: "flex", justifyContent: "flex-end", marginTop: 8 },
  secondary: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid #d6d3d1",
    background: "#fff",
    color: "#44403c",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
};
