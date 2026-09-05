/**
 * Phase 5 — Social food information from connects (informational only).
 * Example: "Your connect, Lori also wants to get 🍔 burgers."
 * Information sharing only — not a match engine.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSocialFoodInfo } from "../../../lib/consumerApi.js";
import { dinerPeerProfilePath } from "../../../lib/liveFeedCategory.js";
import { SectionHead } from "./myMenuplyBits.jsx";
import SectionEmptyState from "./SectionEmptyState.jsx";
import * as s from "./myMenuplyStyles.js";

export default function SocialFoodInfoSection({ hidden = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [hasConnects, setHasConnects] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (hidden) return undefined;
    let cancelled = false;
    setLoading(true);

    listSocialFoodInfo({ limit: 12 })
      .then((data) => {
        if (cancelled) return;
        setEnabled(data?.enabled !== false);
        setHasConnects(Boolean(data?.has_connects));
        setItems(Array.isArray(data?.items) ? data.items : []);
        setNote(typeof data?.note === "string" ? data.note : "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <section style={s.section} data-testid="social-food-info">
      <div style={s.presentationBlock}>
        <SectionHead
          kicker="Connects"
          title="From your connects"
          to="/account/connections"
          subtitle="What people you know want and are eating — information, not matching"
        />

        {loading ? (
          <p style={{ ...s.muted, fontSize: 13 }} data-testid="social-food-info-loading">
            Loading connects’ food activity…
          </p>
        ) : null}

        {!loading && !enabled ? (
          <SectionEmptyState testId="social-food-info-pref-off">
            Connection food activity is off in settings — turn it on to see what your connects are
            into.
          </SectionEmptyState>
        ) : null}

        {!loading && enabled && !hasConnects ? (
          <SectionEmptyState testId="social-food-info-no-connects">
            {note ||
              "Connect with diners to see what they’re into. This is information sharing — not matching."}
          </SectionEmptyState>
        ) : null}

        {!loading && enabled && hasConnects && items.length === 0 ? (
          <SectionEmptyState testId="social-food-info-empty">
            Your connects haven’t posted recent wants or eating yet.
          </SectionEmptyState>
        ) : null}

        {!loading && items.length > 0 ? (
          <ul style={styles.list} data-testid="social-food-info-list">
            {items.map((row) => {
              const peerHref =
                dinerPeerProfilePath(row.consumer_user_id) || "/account/connections";
              const foodHref = row.menu_item_id
                ? `/menu-items/${encodeURIComponent(String(row.menu_item_id))}`
                : row.restaurant_id
                  ? `/restaurants/${encodeURIComponent(String(row.restaurant_id))}`
                  : peerHref;
              return (
                <li
                  key={`${row.kind}-${row.id}`}
                  style={styles.row}
                  data-testid="social-food-info-row"
                >
                  <span style={styles.icon} aria-hidden="true">
                    {row.icon || "🍽️"}
                  </span>
                  <div style={styles.body}>
                    <Link to={peerHref} style={styles.link}>
                      {row.message ||
                        `Your connect, ${row.display_name} · ${row.food_name}`}
                    </Link>
                    {row.restaurant_name ? (
                      <div style={styles.meta}>
                        <Link to={foodHref} style={styles.metaLink}>
                          @ {row.restaurant_name}
                        </Link>
                        {row.video_url ? " · 🎥" : ""}
                      </div>
                    ) : row.video_url ? (
                      <div style={styles.meta}>🎥 video</div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

const styles = {
  list: {
    listStyle: "none",
    margin: "10px 0 0",
    padding: 0,
    display: "grid",
    gap: 10,
  },
  row: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 14,
    lineHeight: 1.35,
    color: "#0f172a",
  },
  icon: { fontSize: 20, lineHeight: 1, flexShrink: 0 },
  body: { minWidth: 0 },
  link: {
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 600,
  },
  meta: { color: "#64748b", fontSize: 13, marginTop: 2 },
  metaLink: { color: "#166534", textDecoration: "none" },
};
