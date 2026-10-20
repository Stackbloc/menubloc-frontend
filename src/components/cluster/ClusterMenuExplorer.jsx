import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { restaurantMenuPathFromRow } from "../../lib/canonicalUrl.js";
import { appendClusterReturnQuery } from "../../lib/clusterReturnNavigation.js";
import { formatClusterDishExcerpt } from "../../lib/clusterDishExcerpt.js";
import { formatMoney, getConsumerDisplayPrice } from "../../lib/pricingDisplay.js";
import { useClusterVideos } from "./video/ClusterVideoContext.jsx";
import ClusterVideoPlayButton from "./video/ClusterVideoPlayButton.jsx";
import ClusterDishActions, { resolveClusterDishCkId } from "./ClusterDishActions.jsx";
import { fetchMenuItemSocialCounts } from "../../lib/foodCommentsApi.js";

export const CLUSTER_PLACEHOLDER_FOOD_CARD_STYLE = {
  display: "grid",
  gap: "0.3rem",
  padding: "0.85rem 1rem",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
};

export function ClusterPlaceholderFoodCard({ item }) {
  const itemName = item?.name || item?.menu_item_name || "Menu item";
  const description = String(item?.description || item?.item_description || "").trim();
  const concessionName = item?.concession_name || item?.restaurant_name || null;
  const location = item?.location ? String(item.location).trim() : "";
  const area = item?.area ? String(item.area).trim() : "";

  return (
    <div style={CLUSTER_PLACEHOLDER_FOOD_CARD_STYLE}>
      <div style={{ fontWeight: 700, color: "#111827", fontSize: "1rem", overflowWrap: "anywhere" }}>
        {itemName}
      </div>
      {description ? (
        <div style={{ color: "#4b5563", fontSize: "0.86rem", lineHeight: 1.45, overflowWrap: "anywhere" }}>
          {description}
        </div>
      ) : null}
      {concessionName ? (
        <div style={{ color: "#374151", fontSize: "0.9rem", overflowWrap: "anywhere" }}>
          {concessionName}
        </div>
      ) : null}
      {location || area ? (
        <div style={{ color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.4, overflowWrap: "anywhere" }}>
          {[area, location].filter(Boolean).join(" · ")}
        </div>
      ) : null}
      <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>Prices vary by event</div>
    </div>
  );
}

export const CLUSTER_DISH_CHIP_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  width: "100%",
  boxSizing: "border-box",
  padding: "0.55rem 0.75rem 0.55rem 0.7rem",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  borderLeft: "3px solid #16a34a",
  background: "#ffffff",
  color: "#111827",
  textDecoration: "none",
  textAlign: "left",
  overflowWrap: "anywhere",
};

function buildDishHref(item, clusterReturnTo, clusterReturnLabel) {
  const menuItemId = item?.menu_item_id ?? item?.id;
  if (menuItemId) {
    const encodedId = encodeURIComponent(String(menuItemId));
    const base = `/menu-items/${encodedId}`;
    return clusterReturnTo
      ? appendClusterReturnQuery(base, clusterReturnTo, clusterReturnLabel)
      : `${base}?from=cluster`;
  }

  const menuPath = restaurantMenuPathFromRow(item);
  return clusterReturnTo
    ? appendClusterReturnQuery(menuPath, clusterReturnTo, clusterReturnLabel)
    : menuPath;
}

function ClusterDishChipText({ item, showExcerpt = false }) {
  const priceCents = getConsumerDisplayPrice(item);
  const priceLabel = priceCents != null ? formatMoney(priceCents) : null;
  const excerpt = showExcerpt ? formatClusterDishExcerpt(item) : null;

  return (
    <>
      <span
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "0.75rem",
          minWidth: 0,
        }}
      >
        <span
          data-testid="cluster-dish-name"
          style={{
            fontWeight: 650,
            fontSize: "0.95rem",
            lineHeight: 1.3,
            color: "#111827",
            overflowWrap: "anywhere",
            minWidth: 0,
          }}
        >
          {item.name}
        </span>
        {priceLabel ? (
          <span
            data-testid="cluster-dish-price"
            style={{
              flexShrink: 0,
              fontWeight: 650,
              fontSize: "0.9rem",
              lineHeight: 1.3,
              color: "#111827",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {priceLabel}
          </span>
        ) : null}
      </span>
      {excerpt ? (
        <span
          className="cluster-card-muted"
          data-testid="cluster-dish-excerpt"
          style={{
            fontWeight: 500,
            fontSize: "0.82rem",
            lineHeight: 1.35,
            color: "#4b5563",
            overflowWrap: "anywhere",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {excerpt}
        </span>
      ) : null}
    </>
  );
}

/** Restaurant + area on the left, the dish actions on the right (same line, no wrap). */
function ClusterDishChipMeta({ item, counts }) {
  const restaurantName = String(item?.restaurant_name || "").trim();
  const area = String(item?.area || "").trim();

  return (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", minWidth: 0 }}>
      <span style={{ display: "grid", gap: "0.15rem", minWidth: 0, flex: 1 }}>
        {restaurantName ? (
          <span
            data-testid="cluster-dish-restaurant"
            style={{
              fontWeight: 500,
              fontSize: "0.8rem",
              lineHeight: 1.3,
              color: "#6b7280",
              overflowWrap: "anywhere",
            }}
          >
            {restaurantName}
          </span>
        ) : null}
        {area ? (
          <span
            data-testid="cluster-dish-area"
            style={{
              fontWeight: 500,
              fontSize: "0.75rem",
              lineHeight: 1.3,
              color: "#9ca3af",
              overflowWrap: "anywhere",
            }}
          >
            {area}
          </span>
        ) : null}
      </span>
      <ClusterDishActions item={item} counts={counts} />
    </span>
  );
}

export function ClusterDishChip({
  item,
  clusterReturnTo = null,
  clusterReturnLabel = null,
  showExcerpt = false,
  counts = null,
}) {
  if (!item?.name) return null;

  if (item?.placeholder_item) {
    return <ClusterPlaceholderFoodCard item={item} />;
  }

  return (
    <ClusterDishChipWithVideo
      item={item}
      href={buildDishHref(item, clusterReturnTo, clusterReturnLabel)}
      showExcerpt={showExcerpt}
      counts={counts}
    />
  );
}

/**
 * The whole row opens the dish: the name/price block is the link, and taps anywhere else on
 * the row (restaurant line, padding) click that same link. Action and play icons stop
 * propagation. Rows whose dish appears in a cluster video get a play control on the left.
 */
function ClusterDishChipWithVideo({ item, href, showExcerpt, counts }) {
  const { index, activeVideoKey } = useClusterVideos();
  const videos = index.forDish(item);
  const linkRef = useRef(null);
  const hasVideo = videos.length > 0;
  const playing = hasVideo && videos.some((v) => v.video_key === activeVideoKey);

  const text = <ClusterDishChipText item={item} showExcerpt={showExcerpt} />;
  const link = href ? (
    <Link
      ref={linkRef}
      to={href}
      style={CLUSTER_DISH_CHIP_LINK_STYLE}
      data-mp-event="menu_item_click"
      data-mp-menu-item-id={item?.menu_item_id ?? item?.id}
      data-mp-restaurant-id={item?.restaurant_id ?? undefined}
      data-mp-subtype="detail_page"
      data-mp-label={item?.name}
      data-mp-placement="cluster_menu_explorer"
    >
      {text}
    </Link>
  ) : (
    <span style={CLUSTER_DISH_CHIP_LINK_STYLE}>{text}</span>
  );

  function openFromRow(event) {
    if (!linkRef.current || event.defaultPrevented) return;
    if (event.target instanceof Element && event.target.closest("a, button")) return;
    linkRef.current.click();
  }

  return (
    <div
      data-testid={hasVideo ? "cluster-dish-video-row" : "cluster-dish-row"}
      data-playing={hasVideo ? (playing ? "1" : "0") : undefined}
      onClick={openFromRow}
      style={{
        ...CLUSTER_DISH_CHIP_STYLE,
        ...(hasVideo ? CLUSTER_DISH_VIDEO_ROW_STYLE : null),
        ...(playing ? CLUSTER_DISH_PLAYING_STYLE : null),
        cursor: href ? "pointer" : undefined,
      }}
    >
      {hasVideo ? (
        <ClusterVideoPlayButton
          videos={videos}
          trigger="dish_icon"
          item={item}
          label={`Play clip of ${item.name}`}
          testId="cluster-dish-video-play"
        />
      ) : null}
      <span style={{ display: "grid", gap: "0.15rem", minWidth: 0, flex: 1 }}>
        {link}
        <ClusterDishChipMeta item={item} counts={counts} />
      </span>
    </div>
  );
}

const CLUSTER_DISH_VIDEO_ROW_STYLE = {
  gap: "0.6rem",
  padding: "0.45rem 0.75rem 0.45rem 0.55rem",
};

const CLUSTER_DISH_PLAYING_STYLE = {
  background: "#fffbeb",
  boxShadow: "0 0 0 2px #fbbf24",
};

const CLUSTER_DISH_CHIP_LINK_STYLE = {
  display: "grid",
  gap: "0.15rem",
  minWidth: 0,
  color: "#111827",
  textDecoration: "none",
  textAlign: "left",
  overflowWrap: "anywhere",
};

/** One batched counts read per list (100 ids per call); counts show only when above 0. */
function useClusterDishSocialCounts(items) {
  const [counts, setCounts] = useState({});
  const idsKey = useMemo(
    () =>
      [...new Set((Array.isArray(items) ? items : []).map(resolveClusterDishCkId).filter(Boolean))]
        .sort((a, b) => a - b)
        .join(","),
    [items]
  );

  useEffect(() => {
    if (!idsKey) return undefined;
    let alive = true;
    const ids = idsKey.split(",").map(Number);
    const chunks = [];
    for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
    Promise.all(chunks.map((chunk) => fetchMenuItemSocialCounts(chunk).catch(() => ({})))).then((parts) => {
      if (alive) setCounts(Object.assign({}, ...parts));
    });
    return () => {
      alive = false;
    };
  }, [idsKey]);

  return counts;
}

export function ClusterDishList({
  items = [],
  showRestaurantBreaks = false,
  clusterReturnTo = null,
  clusterReturnLabel = null,
  midListAd = null,
  insertAfterIndex = null,
  showExcerpt = false,
}) {
  const socialCounts = useClusterDishSocialCounts(items);
  if (!Array.isArray(items) || items.length === 0) return null;

  let lastRestaurantId = null;
  const insertAt =
    midListAd && insertAfterIndex != null && insertAfterIndex >= 0 ? Number(insertAfterIndex) : -1;

  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      {items.map((item, index) => {
        const restaurantId = Number(item.restaurant_id) || null;
        const showRestaurantHeading =
          showRestaurantBreaks &&
          restaurantId &&
          restaurantId !== lastRestaurantId &&
          item.restaurant_name;
        if (restaurantId) lastRestaurantId = restaurantId;

        return (
          <React.Fragment key={item.placeholder_key || `${item.menu_item_id}-${item.restaurant_id}-${item.name}`}>
            {showRestaurantHeading ? (
              <div
                style={{
                  marginTop: "0.35rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {item.restaurant_name}
              </div>
            ) : null}
            <ClusterDishChip
              item={item}
              clusterReturnTo={clusterReturnTo}
              clusterReturnLabel={clusterReturnLabel}
              showExcerpt={showExcerpt}
              counts={socialCounts[String(resolveClusterDishCkId(item))] || null}
            />
            {index === insertAt ? midListAd : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function flattenClusterSearchGroups(groups = []) {
  const items = [];
  for (const group of groups) {
    for (const item of group.menu_items || []) {
      items.push({
        ...item,
        restaurant_id: item.restaurant_id ?? group.restaurant_id,
        restaurant_name: item.restaurant_name ?? group.restaurant_name,
        restaurant_slug: item.restaurant_slug ?? group.restaurant_slug,
        city: item.city ?? group.city,
        state: item.state ?? group.state,
      });
    }
  }
  return items;
}

export function ClusterMenuExplorerReservedFilters() {
  return null;
}
