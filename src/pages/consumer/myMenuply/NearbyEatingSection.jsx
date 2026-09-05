/**
 * Who's Eating — up to 5 registered-diner text links (not a video list).
 * Videos play on that diner's profile or in Feed — not embedded here.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchWantDiscovery,
  listSeeWhosEating,
} from "../../../lib/consumerApi.js";
import {
  dinerPeerProfilePath,
  liveFeedCreatorProfilePath,
} from "../../../lib/liveFeedCategory.js";
import { SectionHead } from "./myMenuplyBits.jsx";
import SectionEmptyState from "./SectionEmptyState.jsx";
import * as s from "./myMenuplyStyles.js";

const MAX_LINES = 5;

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

function buildWhosEatingLines({ feedItems, connectLines }) {
  const out = [];
  const seen = new Set();

  function push({ dinerId, displayName, food, href }) {
    if (!dinerId || seen.has(dinerId) || out.length >= MAX_LINES) return;
    const name = String(displayName || "").trim();
    const dish = String(food || "").trim() || "food";
    if (!name || !href) return;
    seen.add(dinerId);
    out.push({
      key: `who-${dinerId}`,
      dinerId,
      href,
      label: `${name} is eating ${dish}`,
    });
  }

  for (const row of connectLines || []) {
    const dinerId = registeredDinerId(row);
    if (!dinerId) continue;
    push({
      dinerId,
      displayName: row.display_name || row.name,
      food: row.food_name || row.food,
      href: dinerPeerProfilePath(dinerId),
    });
  }

  for (const item of feedItems || []) {
    const dinerId = registeredDinerId(item);
    if (!dinerId) continue;
    const href =
      dinerPeerProfilePath(dinerId) ||
      liveFeedCreatorProfilePath(item) ||
      null;
    push({
      dinerId,
      displayName: feedPersonLabel(item),
      food: feedFoodLabel(item),
      href,
    });
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

  const favSignal = Array.isArray(favoriteFoods) ? favoriteFoods[0] : null;
  const favKey = favSignal
    ? `${favSignal.key || ""}:${favSignal.label || ""}`
    : "";

  useEffect(() => {
    if (hidden) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");

    const discoveryPromise = favSignal
      ? fetchWantDiscovery({
          foodName: favSignal.label || favSignal.key,
          foodInterestKey: favSignal.key,
          limit: 6,
        }).catch(() => null)
      : Promise.resolve(null);

    Promise.all([
      listSeeWhosEating({
        city: locationCity || undefined,
        state: locationState || undefined,
        limit: 12,
        kind: "ate",
      }).catch((err) => ({ __error: err })),
      discoveryPromise,
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

  if (hidden) return null;

  return (
    <section style={s.section} data-testid="see-others-nearby-eating">
      <div style={s.presentationBlock}>
        <SectionHead
          kicker="Nearby"
          title="Who's Eating"
          subtitle="Registered diners nearby — open their profile to watch video if they posted one"
        />

        {error ? <p style={s.error}>{error}</p> : null}

        {loading ? (
          <p style={{ ...s.muted, fontSize: 13 }} data-testid="nearby-eating-loading">
            Loading who&apos;s eating…
          </p>
        ) : null}

        {!loading && lines.length > 0 ? (
          <ul style={styles.list} data-testid="whos-eating-links">
            {lines.map((row) => (
              <li key={row.key} style={styles.row} data-testid="whos-eating-row">
                <Link to={row.href} style={styles.link}>
                  {row.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && lines.length === 0 ? (
          <SectionEmptyState testId="nearby-eating-empty">
            No registered diners nearby yet. When someone posts what they&apos;re eating, you&apos;ll
            see a short link here — videos play on their profile or in Feed.
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
};
