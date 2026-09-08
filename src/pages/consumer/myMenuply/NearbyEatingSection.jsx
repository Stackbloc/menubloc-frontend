/**
 * Who's Eating — activity-first scan rows (max 8 + Show more).
 * Avatar + Name, Age, Affiliation · emoji activity line · ▶ when video exists.
 */

import { useEffect, useMemo, useState } from "react";
import {
  fetchWantDiscovery,
  listSeeWhosEating,
} from "../../../lib/consumerApi.js";
import {
  formatDinerScanIdentity,
  formatWhosEatingDiscoveryLine,
  resolveDinerAffiliation,
} from "../../../lib/dinerDiscoverySummary.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import {
  dinerPeerProfilePath,
  liveFeedCreatorProfilePath,
} from "../../../lib/liveFeedCategory.js";
import DinerActivityScanRow from "./DinerActivityScanRow.jsx";
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
  const identitySource = {
    display_name: displayName,
    age_years: row.age_years ?? row.diner?.age_years ?? null,
    school_affiliation:
      resolveDinerAffiliation(row) || resolveDinerAffiliation(row.diner || {}),
  };
  if (!formatDinerScanIdentity(identitySource) || !href) return;
  const videoUrl =
    row.video_url ||
    row.diner?.video_url ||
    null;
  seen.add(dinerId);
  const restaurantName =
    row.restaurant_name ||
    row.diner?.restaurant_name ||
    row.referenced_restaurant?.restaurant_name ||
    null;
  out.push({
    key: `who-${dinerId}`,
    dinerId,
    href,
    displayName,
    avatarUrl: row.avatar_url || row.diner?.avatar_url || null,
    ageYears: identitySource.age_years,
    affiliation: identitySource.school_affiliation,
    dinerSex: row.diner_sex || row.diner_sex_short || row.diner?.diner_sex || null,
    dinerSexShort: row.diner_sex_short || row.diner?.diner_sex_short || null,
    kind: row.kind || row.signal_kind || "ate",
    foodName,
    restaurantName,
    mealPeriod: row.meal_period || null,
    foodInterestKey: row.food_interest_key || null,
    icon: row.icon || iconForFoodText(foodName),
    videoUrl: videoUrl ? String(videoUrl).trim() : null,
    discoveryLine: formatWhosEatingDiscoveryLine({
      display_name: displayName,
      diner_sex: row.diner_sex || row.diner?.diner_sex,
      diner_sex_short: row.diner_sex_short || row.diner?.diner_sex_short,
      age_years: identitySource.age_years,
      school_affiliation: identitySource.school_affiliation,
      food_name: foodName,
      restaurant_name: restaurantName,
    }),
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
          subtitle="See what nearby diners are eating — open profile to connect; planned activities stay private"
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
                  <DinerActivityScanRow
                    displayName={row.displayName}
                    avatarUrl={row.avatarUrl}
                    ageYears={row.ageYears}
                    affiliation={row.affiliation}
                    includeSex
                    dinerSex={row.dinerSex}
                    dinerSexShort={row.dinerSexShort}
                    kind={row.kind}
                    foodName={row.foodName}
                    foodInterestKey={row.foodInterestKey}
                    icon={row.icon}
                    videoUrl={row.videoUrl}
                    profileHref={row.href}
                    activityLineOverride={
                      row.restaurantName
                        ? `is having ${row.restaurantName} ${row.foodName} at ${row.restaurantName}`
                        : `is having ${row.foodName}`
                    }
                  />
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
            see a short summary here — tap ▶ when a video is attached, or open their profile.
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
    gap: 0,
  },
  row: {
    fontSize: 15,
    lineHeight: 1.4,
    color: "#0f172a",
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
