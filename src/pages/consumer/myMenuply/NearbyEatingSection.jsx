/**
 * See What Others Nearby Are Eating — discovery entry before What I Wanna Eat.
 * Reuses Feed (see-who's-eating) + optional want-discovery connects; food icons for scan.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchWantDiscovery,
  listSeeWhosEating,
} from "../../../lib/consumerApi.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import {
  dinerPeerProfilePath,
  liveFeedCategoryLabel,
  liveFeedCreatorProfilePath,
  liveFeedFullCategoryLabel,
  liveFeedRestaurantProfilePath,
  resolveLiveFeedContentLink,
} from "../../../lib/liveFeedCategory.js";
import { SectionHead } from "./myMenuplyBits.jsx";
import SectionEmptyState from "./SectionEmptyState.jsx";
import * as s from "./myMenuplyStyles.js";

function feedFoodLabel(item) {
  return (
    item?.food_name ||
    item?.menu_item_name ||
    item?.item_name ||
    item?.caption ||
    item?.title ||
    liveFeedFullCategoryLabel(item?.kind) ||
    "Food"
  );
}

function feedPersonLabel(item) {
  return (
    item?.diner?.display_name ||
    item?.display_name ||
    item?.creator?.display_name ||
    item?.poster_name ||
    "A diner"
  );
}

export default function NearbyEatingSection({
  locationCity = null,
  locationState = null,
  favoriteFoods = [],
  hidden = false,
}) {
  const [feedItems, setFeedItems] = useState([]);
  const [connectLines, setConnectLines] = useState([]);
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
        kind: "all",
      }).catch((err) => ({ __error: err })),
      discoveryPromise,
    ]).then(([feed, discovery]) => {
      if (cancelled) return;
      if (feed?.__error) {
        setError(feed.__error.message || "Unable to load nearby eating");
        setFeedItems([]);
      } else {
        setFeedItems(Array.isArray(feed?.items) ? feed.items : []);
      }
      const connects = Array.isArray(discovery?.connects_related)
        ? discovery.connects_related
        : [];
      const nearby = Array.isArray(discovery?.nearby) ? discovery.nearby : [];
      setConnectLines([...connects, ...nearby.filter((n) => n.message)].slice(0, 6));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // favKey captures favorite food signal without unstable array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps -- favKey stands in for favoriteFoods[0]
  }, [hidden, locationCity, locationState, favKey]);

  if (hidden) return null;

  return (
    <section style={s.section} data-testid="see-others-nearby-eating">
      <div style={s.presentationBlock}>
        <SectionHead
          kicker="Nearby"
          title="See What Others Nearby Are Eating"
          to="/feed"
          subtitle="Discover what’s happening around you — then say what you wanna eat"
        />

        {error ? <p style={s.error}>{error}</p> : null}

        {loading ? (
          <p style={{ ...s.muted, fontSize: 13 }} data-testid="nearby-eating-loading">
            Loading nearby food activity…
          </p>
        ) : null}

        {!loading && connectLines.length > 0 ? (
          <ul style={styles.list} data-testid="nearby-connect-lines">
            {connectLines.slice(0, 4).map((row) => (
              <li key={`c-${row.kind}-${row.id}`} style={styles.row}>
                <span style={styles.icon} aria-hidden="true">
                  {row.icon || iconForFoodText(row.food_name)}
                </span>
                <Link
                  to={
                    dinerPeerProfilePath(row.consumer_user_id) ||
                    "/feed"
                  }
                  style={styles.link}
                >
                  {row.message ||
                    `${row.display_name} · ${row.food_name}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && feedItems.length > 0 ? (
          <ul style={styles.list} data-testid="nearby-feed-items">
            {feedItems.slice(0, 8).map((item) => {
              const food = feedFoodLabel(item);
              const person = feedPersonLabel(item);
              const icon = iconForFoodText(food);
              const contentHref = resolveLiveFeedContentLink(item) || "/feed";
              const personHref =
                liveFeedCreatorProfilePath(item) ||
                liveFeedRestaurantProfilePath(item) ||
                "/feed";
              return (
                <li
                  key={`${item.kind || "feed"}-${item.id}`}
                  style={styles.row}
                  data-testid="nearby-feed-row"
                >
                  <span style={styles.icon} aria-hidden="true">
                    {icon}
                  </span>
                  <div style={styles.body}>
                    <Link to={personHref} style={styles.person}>
                      {person}
                    </Link>
                    <span style={styles.meta}>
                      {" "}
                      · {liveFeedCategoryLabel(item.kind)} ·{" "}
                    </span>
                    <Link to={contentHref} style={styles.link}>
                      {food}
                    </Link>
                    {item.restaurant_name || item?.referenced_restaurant?.name ? (
                      <span style={styles.meta}>
                        {" "}
                        @ {item.restaurant_name || item.referenced_restaurant.name}
                      </span>
                    ) : null}
                    {item.video_url ? (
                      <span style={styles.videoBadge} title="Has video">
                        {" "}
                        🎥
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!loading && feedItems.length === 0 && connectLines.length === 0 ? (
          <SectionEmptyState testId="nearby-eating-empty">
            No nearby posts yet — open Feed as diners share what they’re eating. You can still say
            what you wanna eat below.
          </SectionEmptyState>
        ) : null}

        <div style={styles.actions}>
          <Link to="/feed" style={styles.primary} data-testid="nearby-open-feed">
            Open Feed
          </Link>
        </div>
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
  person: {
    fontWeight: 700,
    color: "#166534",
    textDecoration: "none",
  },
  link: { color: "#166534", textDecoration: "none", fontWeight: 600 },
  meta: { color: "#64748b", fontSize: 13 },
  videoBadge: { fontSize: 13 },
  actions: { marginTop: 12 },
  primary: {
    display: "inline-flex",
    padding: "10px 14px",
    borderRadius: 10,
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 14,
  },
};
