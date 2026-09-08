/**
 * Phase 5 — Social food information from connects (informational only).
 * Activity-first scan rows — same grammar as Who's Eating.
 * Information sharing only — not a match engine.
 */

import { useEffect, useState } from "react";
import { listSocialFoodInfo } from "../../../lib/consumerApi.js";
import {
  formatConnectEatingLine,
  resolveDinerAffiliation,
} from "../../../lib/dinerDiscoverySummary.js";
import { dinerPeerProfilePath } from "../../../lib/liveFeedCategory.js";
import DinerActivityScanRow from "./DinerActivityScanRow.jsx";
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
              return (
                <li
                  key={`${row.kind}-${row.id}`}
                  style={styles.row}
                  data-testid="social-food-info-row"
                >
                  <DinerActivityScanRow
                    displayName={row.display_name || "Connect"}
                    avatarUrl={row.avatar_url || null}
                    ageYears={row.age_years ?? null}
                    affiliation={resolveDinerAffiliation(row)}
                    kind={row.kind || row.signal_kind || "want"}
                    foodName={row.food_name || "food"}
                    foodInterestKey={row.food_interest_key || null}
                    icon={row.icon || null}
                    videoUrl={row.video_url || null}
                    profileHref={peerHref}
                    restaurantName={row.restaurant_name || null}
                    mealPeriod={row.meal_period || null}
                    activityLineOverride={
                      formatConnectEatingLine({
                        kind: row.kind || row.signal_kind || "want",
                        restaurant_name: row.restaurant_name,
                        food_name: row.food_name,
                        meal_period: row.meal_period,
                        food_interest_key: row.food_interest_key,
                      })
                    }
                  />
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
    gap: 0,
  },
  row: {
    fontSize: 14,
    lineHeight: 1.35,
    color: "#0f172a",
  },
};
