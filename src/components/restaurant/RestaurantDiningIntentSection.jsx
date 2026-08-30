/**
 * Restaurant page — People who want to go (explicit dining intent).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { captureEvent } from "../../services/posthog.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  fetchMyRestaurantDiningIntent,
  fetchRestaurantDiningIntent,
  requestConnection,
  resolveConsumerMediaUrl,
} from "../../lib/consumerApi.js";
import { ProfileSection } from "./publicProfile/profilePrimitives.jsx";
import DiningIntentSheet from "./DiningIntentSheet.jsx";

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

function summaryLine(summary) {
  const total = Number(summary?.total) || 0;
  if (total <= 0) return null;
  const counts = summary?.counts || {};
  const parts = [];
  if (counts.planning_to_go > 0) {
    parts.push(`${counts.planning_to_go} planning to go`);
  }
  if (counts.looking_for_company > 0) {
    parts.push(`${counts.looking_for_company} looking for company`);
  }
  if (counts.want_to_go > 0) {
    parts.push(`${counts.want_to_go} interested`);
  }
  if (parts.length === 0) return `${total} ${total === 1 ? "person" : "people"} interested`;
  return `${total} ${total === 1 ? "person" : "people"} · ${parts.join(" · ")}`;
}

export default function RestaurantDiningIntentSection({ restaurantId, restaurantName = "" }) {
  const navigate = useNavigate();
  const { isAuthenticated, consumer } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [mine, setMine] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [connectBusyId, setConnectBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [publicData, mineData] = await Promise.all([
        fetchRestaurantDiningIntent(restaurantId),
        isAuthenticated ? fetchMyRestaurantDiningIntent(restaurantId) : Promise.resolve({ intent: null }),
      ]);
      setSummary(publicData?.summary || null);
      setItems(Array.isArray(publicData?.items) ? publicData.items : []);
      setMine(mineData?.intent || null);
      if (publicData?.summary?.has_intent) {
        captureEvent("dining_intent_viewed", {
          restaurant_id: restaurantId,
          total: publicData.summary.total,
          source_surface: "restaurant_profile",
        });
      }
    } catch {
      setSummary(null);
      setItems([]);
      setMine(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const headline = useMemo(() => summaryLine(summary), [summary]);

  function openSheet() {
    if (!isAuthenticated) {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
      );
      navigate(`/account/login?next=${next}`);
      return;
    }
    setSheetOpen(true);
  }

  async function onConnect(peer) {
    if (!peer?.id || connectBusyId) return;
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
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
        source_surface: "restaurant_profile",
      });
      const status = data?.connection?.status;
      setNotice(
        status === "accepted"
          ? `You're now Connects with ${peer.display_name}.`
          : `Connect request sent to ${peer.display_name}.`
      );
      await load();
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

  if (!restaurantId) return null;

  return (
    <ProfileSection title="People who want to go" testId="restaurant-dining-intent-section">
      {loading ? (
        <p style={styles.muted} data-testid="restaurant-dining-intent-loading">
          Loading…
        </p>
      ) : null}

      {!loading && headline ? (
        <p style={styles.summary} data-testid="restaurant-dining-intent-summary">
          {headline}
        </p>
      ) : null}

      {!loading && !headline ? (
        <p style={styles.muted} data-testid="restaurant-dining-intent-empty">
          No one has shared that they want to go yet. Be the first.
        </p>
      ) : null}

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
      ) : null}

      <div style={styles.ctaRow}>
        <button
          type="button"
          style={styles.cta}
          onClick={openSheet}
          data-testid="restaurant-dining-intent-cta"
        >
          {mine ? "Update my plan" : "I want to go"}
        </button>
        {mine ? (
          <span style={styles.mineBadge} data-testid="restaurant-dining-intent-mine-badge">
            You&apos;re on this list
          </span>
        ) : null}
      </div>

      <DiningIntentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        existingIntent={mine}
        onSaved={() => load()}
      />
    </ProfileSection>
  );
}

const styles = {
  muted: { margin: 0, fontSize: 14, color: "rgba(0,0,0,0.55)" },
  summary: { margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1c1917" },
  notice: { margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#166534" },
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
  ctaRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 },
  cta: {
    padding: "11px 18px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  mineBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: "#166534",
    background: "#ecfdf5",
    padding: "6px 10px",
    borderRadius: 999,
  },
};
