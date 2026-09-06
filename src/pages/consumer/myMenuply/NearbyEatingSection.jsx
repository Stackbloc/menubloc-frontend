/**
 * Who's Eating — up to 8 compact diner summary rows (+ Show more).
 * Example: "SusyQ · F · 25 · USC wants 🍔" → peer profile (videos there / Feed).
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchWantDiscovery,
  listSeeWhosEating,
} from "../../../lib/consumerApi.js";
import { formatDinerDiscoverySummary } from "../../../lib/dinerDiscoverySummary.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import {
  dinerPeerProfilePath,
  liveFeedCreatorProfilePath,
} from "../../../lib/liveFeedCategory.js";
import { SectionHead } from "./myMenuplyBits.jsx";
import SectionEmptyState from "./SectionEmptyState.jsx";
import * as s from "./myMenuplyStyles.js";

const INITIAL_VISIBLE = 8;
const FETCH_LIMIT = 24;

function feedFoodLabel(item) {
  return (
    item?.food_name ||
    item?.menu_item_name ||
    item?.item_name ||
    item?.caption ||
    item?.title ||
    "food"
  );
}

function feedPersonLabel(item) {
  return (
    item?.diner?.display_name ||
    item?.display_name ||
    item?.creator?.display_name ||
    item?.poster_name ||
    ""
  );
}

function registeredDinerId(row) {
  const id =
    row?.consumer_user_id ??
    row?.diner?.id ??
    row?.diner?.consumer_user_id ??
    row?.creator?.id ??
    row?.creator_user_id ??
    row?.user_id;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pushRow(out, seen, row) {
  const dinerId = registeredDinerId(row);
  if (!dinerId || seen.has(dinerId) || out.length >= FETCH_LIMIT) return;
  const href =
    dinerPeerProfilePath(dinerId) ||
    liveFeedCreatorProfilePath(row) ||
    null;
  const displayName =
    row.display_name || feedPersonLabel(row) || row.name || "";
  const foodName = row.food_name || row.food || feedFoodLabel(row);
  const label = formatDinerDiscoverySummary({
    ...row,
    display_name: displayName,
    food_name: foodName,
    kind: row.kind || row.signal_kind || "ate",
    icon: row.icon || iconForFoodText(foodName),
  });
  if (!label || !href) return;
  seen.add(dinerId);
  out.push({
    key: `who-${dinerId}`,
    dinerId,
    href,
    label,
  });
}

function buildWhosEatingLines({ feedItems, connectLines }) {
  const out = [];
  const seen = new Set();

  for (const row of connectLines || []) {
    pushRow(out, seen, row);
  }
  for (const item of feedItems || []) {
    pushRow(out, seen, item);
  }
  return out;
}

export default function NearbyEatingSection({
  locationCity = null,
  locationState = null,
  favoriteFoods = [],
  hidden = false,
}) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const favSignal = Array.isArray(favoriteFoods) ? favoriteFoods[0] : null;
  const favKey = favSignal
    ? `${favSignal.key || ""}:${favSignal.label || ""}`
    : "";

  useEffect(() => {
    if (hidden) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    setExpanded(false);

    Promise.all([
      listSeeWhosEating({
        city: locationCity || undefined,
        state: locationState || undefined,
        limit: FETCH_LIMIT,
        kind: "ate",
      }).catch((err) => ({ __error: err })),
      fetchWantDiscovery({
        foodName: favSignal?.label || favSignal?.key || undefined,
        foodInterestKey: favSignal?.key || undefined,
        limit: FETCH_LIMIT,
      }).catch(() => null),
    ]).then(([feed, discovery]) => {
      if (cancelled) return;
      let feedItems = [];
      if (feed?.__error) {
        setError(feed.__error.message || "Unable to load who's eating");
      } else {
        feedItems = Array.isArray(feed?.items) ? feed.items : [];
      }
      const connects = Array.isArray(discovery?.connects_related)
        ? discovery.connects_related
        : [];
      const nearby = Array.isArray(discovery?.nearby) ? discovery.nearby : [];
      const connectLines = [...connects, ...nearby].filter(Boolean);
      setLines(buildWhosEatingLines({ feedItems, connectLines }));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // favKey stands in for favoriteFoods[0]
    // eslint-disable-next-line react-hooks/exhaustive-deps -- favKey
  }, [hidden, locationCity, locationState, favKey]);

  const visibleLines = useMemo(() => {
    if (expanded) return lines;
    return lines.slice(0, INITIAL_VISIBLE);
  }, [expanded, lines]);

  const hasMore = lines.length > INITIAL_VISIBLE;

  if (hidden) return null;

  return (
    <section style={s.section} data-testid="see-others-nearby-eating">
      <div style={s.presentationBlock}>
        <SectionHead
          kicker="Nearby"
          title="Who's Eating"
          subtitle="Short diner summaries — open a profile to explore their videos"
        />

        {error ? <p style={s.error}>{error}</p> : null}

        {loading ? (
          <p style={{ ...s.muted, fontSize: 13 }} data-testid="nearby-eating-loading">
            Loading who&apos;s eating…
          </p>
        ) : null}

        {!loading && lines.length > 0 ? (
          <>
            <ul style={styles.list} data-testid="whos-eating-links">
              {visibleLines.map((row) => (
                <li key={row.key} style={styles.row} data-testid="whos-eating-row">
                  <Link to={row.href} style={styles.link}>
                    {row.label}
                  </Link>
                </li>
              ))}
            </ul>
            {hasMore && !expanded ? (
              <button
                type="button"
                style={styles.showMore}
                data-testid="whos-eating-show-more"
                onClick={() => setExpanded(true)}
              >
                Show more ({lines.length - INITIAL_VISIBLE} more)
              </button>
            ) : null}
            {hasMore && expanded ? (
              <button
                type="button"
                style={styles.showMore}
                data-testid="whos-eating-show-less"
                onClick={() => setExpanded(false)}
              >
                Show less
              </button>
            ) : null}
          </>
        ) : null}

        {!loading && lines.length === 0 ? (
          <SectionEmptyState testId="nearby-eating-empty">
            No registered diners nearby yet. When someone posts what they&apos;re eating, you&apos;ll
            see a short summary here — videos play on their profile or in Feed.
          </SectionEmptyState>
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
    fontSize: 15,
    lineHeight: 1.4,
    color: "#0f172a",
  },
  link: {
    color: "#166534",
    textDecoration: "none",
    fontWeight: 700,
  },
  showMore: {
    appearance: "none",
    marginTop: 10,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#166534",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
};
