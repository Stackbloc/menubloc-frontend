/**
 * Restaurant page — People who want to go (explicit dining intent).
 * Profile surface shows aggregate demand + avatar previews only; full list is
 * behind "See people who want to go".
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { captureEvent } from "../../services/posthog.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  fetchMyRestaurantDiningIntent,
  fetchRestaurantDiningIntent,
  resolveConsumerMediaUrl,
} from "../../lib/consumerApi.js";
import { ProfileSection } from "./publicProfile/profilePrimitives.jsx";
import DiningIntentSheet from "./DiningIntentSheet.jsx";
import DiningIntentPeopleSheet from "./DiningIntentPeopleSheet.jsx";

const PREVIEW_AVATAR_LIMIT = 5;

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function aggregateHeadline(summary, restaurantName) {
  const total = Number(summary?.total) || 0;
  if (total <= 0) return null;
  const noun = total === 1 ? "person" : "people";
  const place = restaurantName ? ` to ${restaurantName}` : "";
  return `${total} ${noun} want to go${place}`;
}

function uniqueDinerPreviews(items, limit = PREVIEW_AVATAR_LIMIT) {
  const seen = new Set();
  const out = [];
  for (const row of items || []) {
    const id = row?.diner?.id;
    if (id == null || seen.has(id)) continue;
    seen.add(id);
    out.push(row.diner);
    if (out.length >= limit) break;
  }
  return out;
}

export default function RestaurantDiningIntentSection({ restaurantId, restaurantName = "" }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [mine, setMine] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [peopleSheetOpen, setPeopleSheetOpen] = useState(false);

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

  const headline = useMemo(
    () => aggregateHeadline(summary, restaurantName),
    [summary, restaurantName]
  );
  const avatarPreviews = useMemo(() => uniqueDinerPreviews(items), [items]);
  const hasIntent = Number(summary?.total) > 0;

  function openIntentSheet() {
    if (!isAuthenticated) {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
      );
      navigate(`/account/login?next=${next}`);
      return;
    }
    setSheetOpen(true);
  }

  function openPeopleSheet() {
    captureEvent("dining_intent_people_list_opened", {
      restaurant_id: restaurantId,
      total: summary?.total || 0,
      source_surface: "restaurant_profile",
    });
    setPeopleSheetOpen(true);
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

      {!loading && avatarPreviews.length > 0 ? (
        <div style={styles.avatarRow} data-testid="restaurant-dining-intent-avatars" aria-hidden>
          {avatarPreviews.map((peer, index) => {
            const avatar = peer.avatar_url ? resolveConsumerMediaUrl(peer.avatar_url) : "";
            return (
              <div
                key={peer.id}
                style={{
                  ...styles.avatar,
                  marginLeft: index === 0 ? 0 : -8,
                }}
              >
                {avatar ? (
                  <img src={avatar} alt="" style={styles.avatarImg} loading="lazy" />
                ) : (
                  <span>{initials(peer.display_name)}</span>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {!loading && hasIntent ? (
        <button
          type="button"
          style={styles.seePeopleLink}
          onClick={openPeopleSheet}
          data-testid="restaurant-dining-intent-see-people"
        >
          See people who want to go →
        </button>
      ) : null}

      <div style={styles.ctaRow}>
        <button
          type="button"
          style={styles.cta}
          onClick={openIntentSheet}
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

      <DiningIntentPeopleSheet
        open={peopleSheetOpen}
        onClose={() => setPeopleSheetOpen(false)}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        items={items}
        onConnectionChange={load}
      />
    </ProfileSection>
  );
}

const styles = {
  muted: { margin: 0, fontSize: 14, color: "rgba(0,0,0,0.55)" },
  summary: { margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#1c1917" },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    margin: "0 0 12px",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: "#e7e5e4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 13,
    flexShrink: 0,
    overflow: "hidden",
    border: "2px solid #fff",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  seePeopleLink: {
    display: "inline-block",
    margin: "0 0 14px",
    padding: 0,
    border: "none",
    background: "none",
    color: "#1F4E3D",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    textDecoration: "underline",
    textAlign: "left",
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
