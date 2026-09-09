/**
 * Compact category activity row for profile sections.
 * [thumb 40] [text] [meal tag] [▶ if video] — uniform size; real video play inline.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { formatDinerScanIdentity } from "../../../lib/dinerDiscoverySummary.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import { WHAT_I_ATE_MEAL_PERIODS } from "../../../lib/whatIAteTodayMealPeriod.js";
import { shouldPreferRestaurantMark } from "../../../lib/restaurantMarkPreference.js";
import { restaurantHref } from "./myMenuplyBits.jsx";
import { resolveEatingDishVisual } from "./eatingDishVisual.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

const THUMB = 40;

function initialLetter(name) {
  const ch = String(name || "?").trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function dishHref(menuItemId) {
  if (menuItemId == null || menuItemId === "") return null;
  const n = Number(menuItemId);
  if (Number.isFinite(n) && n > 0) return `/menu-items/${n}`;
  return `/menu-items/${encodeURIComponent(String(menuItemId))}`;
}

function mealTag(mealPeriod) {
  const id = String(mealPeriod || "").trim();
  if (!id) return null;
  return WHAT_I_ATE_MEAL_PERIODS.find((p) => p.id === id)?.label || null;
}

function DishLink({ href, children }) {
  if (!href) return <span data-testid="diner-activity-scan-dish-text">{children}</span>;
  return (
    <Link
      to={href}
      style={styles.inlineLink}
      data-testid="diner-activity-scan-dish"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}

function PlaceLink({ href, children, markUrl = null }) {
  if (markUrl && href) {
    return (
      <Link
        to={href}
        style={styles.inlineMark}
        data-testid="diner-activity-scan-place"
        title={typeof children === "string" ? children : "Restaurant"}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={markUrl} alt="" style={styles.inlineMarkImg} />
      </Link>
    );
  }
  if (href) {
    return (
      <Link
        to={href}
        style={styles.inlineLink}
        data-testid="diner-activity-scan-place"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Link>
    );
  }
  return <span data-testid="diner-activity-scan-place-text">{children}</span>;
}

export default function DinerActivityScanRow({
  displayName = "",
  avatarUrl = null,
  ageYears = null,
  affiliation = null,
  includeSex = false,
  dinerSex = null,
  dinerSexShort = null,
  kind = "ate",
  foodName = null,
  restaurantName = null,
  restaurantId = null,
  restaurantSlug = null,
  restaurantCity = null,
  restaurantState = null,
  restaurantLogoUrl = null,
  restaurantBillboardUrl = null,
  restaurantChainId = null,
  menuItemId = null,
  dishPhotoUrl = null,
  mealPeriod = null,
  homemade = false,
  icon = null,
  videoUrl = null,
  profileHref = null,
  testId = "diner-activity-scan-row",
  onSelect = null,
  selected = false,
  ownerCompact = false,
  showIdentity = true,
  /** When false, omit 40px dish/place thumb (Connect profile preview). */
  showThumb = true,
  /** Fold display name into prose: "Andre B is eating …" (no avatar row). */
  nameInProse = false,
  /** Always render restaurant as text link (never inline logo mark). */
  placeAsText = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const hasVideo = Boolean(String(videoUrl || "").trim());
  const videoSrc = hasVideo ? String(videoUrl).trim() : "";

  const identity = formatDinerScanIdentity(
    {
      display_name: displayName,
      age_years: ageYears,
      school_affiliation: affiliation,
      diner_sex: dinerSex,
      diner_sex_short: dinerSexShort,
    },
    { includeSex }
  );

  const placeHref = restaurantHref({
    restaurant_id: restaurantId,
    restaurant_slug: restaurantSlug,
    slug: restaurantSlug,
    city: restaurantCity,
    state: restaurantState,
  });
  const itemHref = dishHref(menuItemId);
  const food = String(foodName || "").trim() || null;
  const place = String(restaurantName || "").trim() || null;
  const isWant = kind === "want" || kind === "wanna_eat" || kind === "want_to_eat";
  const proseName = String(displayName || "").trim() || "Diner";

  const specificNamed = Boolean(food && (place || homemade));
  const cuisineOnly = Boolean(food) && !place && !homemade && !menuItemId;
  const foodEmoji =
    !specificNamed && (cuisineOnly || homemade)
      ? iconForFoodText(food) || icon || null
      : null;

  const preferMark =
    !placeAsText &&
    !homemade &&
    shouldPreferRestaurantMark({
      chain_id: restaurantChainId,
      restaurant_name: place,
    });

  const placeVisual = preferMark
    ? resolveEatingDishVisual({
        restaurant_logo_url: restaurantLogoUrl,
        restaurant_billboard_image_url: restaurantBillboardUrl,
      })
    : null;
  const placeMarkUrl =
    placeVisual?.source === "logo" || placeVisual?.source === "billboard"
      ? placeVisual.url
      : null;

  const dishVisual = dishPhotoUrl
    ? resolveConsumerMediaUrl(dishPhotoUrl) || dishPhotoUrl
    : null;

  const thumbUrl = dishVisual || (!preferMark ? null : placeMarkUrl) || null;
  const inlinePlaceMark = preferMark ? placeMarkUrl : null;

  const resolvedAvatar = avatarUrl
    ? resolveConsumerMediaUrl(avatarUrl) || avatarUrl
    : null;
  const meal = mealTag(mealPeriod);

  function openVideo(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!hasVideo) {
      onSelect?.();
      return;
    }
    setExpanded((v) => !v);
  }

  const identityBlock =
    showIdentity && !ownerCompact ? (
      <div style={styles.identityRow}>
        {resolvedAvatar ? (
          <img src={resolvedAvatar} alt="" style={styles.avatar} />
        ) : (
          <div style={styles.avatarFallback} aria-hidden="true">
            {initialLetter(displayName)}
          </div>
        )}
        <span style={styles.identityText} data-testid="diner-activity-scan-identity">
          {(identity || displayName || "Diner").replace(/ · /g, ", ")}
        </span>
      </div>
    ) : null;

  function renderClause() {
    const nameLead =
      nameInProse && !ownerCompact ? <span data-testid="diner-activity-scan-prose-name">{proseName} </span> : null;

    if (ownerCompact) {
      return (
        <>
          {meal ? <span style={styles.mealInline}>{meal} · </span> : null}
          {homemade ? (
            <>
              {food ? <DishLink href={itemHref}>{food}</DishLink> : <span>food</span>}
              <span> @home</span>
            </>
          ) : isWant ? (
            <>
              {food ? <DishLink href={itemHref}>{food}</DishLink> : null}
              {food && place ? <span> at </span> : null}
              {!food && place ? <span>at </span> : null}
              {place ? (
                <PlaceLink href={placeHref} markUrl={inlinePlaceMark}>
                  {place}
                </PlaceLink>
              ) : null}
              {!food && !place ? <span>Wanna eat</span> : null}
            </>
          ) : (
            <>
              {food ? <DishLink href={itemHref}>{food}</DishLink> : null}
              {food && place ? <span> at </span> : null}
              {!food && place ? <span>at </span> : null}
              {place ? (
                <PlaceLink href={placeHref} markUrl={inlinePlaceMark}>
                  {place}
                </PlaceLink>
              ) : null}
              {!food && !place ? <span>eating</span> : null}
            </>
          )}
        </>
      );
    }

    if (homemade) {
      return (
        <>
          {nameLead}
          <span>is cooking </span>
          {food ? <DishLink href={itemHref}>{food}</DishLink> : <span>food</span>}
          <span> @home</span>
        </>
      );
    }
    if (isWant) {
      return (
        <>
          {nameLead}
          <span>wants </span>
          {food ? <DishLink href={itemHref}>{food}</DishLink> : null}
          {food && place ? <span> at </span> : null}
          {!food && place ? <span>to eat at </span> : null}
          {place ? (
            <PlaceLink href={placeHref} markUrl={inlinePlaceMark}>
              {place}
            </PlaceLink>
          ) : null}
          {!food && !place ? <span>something to eat</span> : null}
        </>
      );
    }
    return (
      <>
        {nameLead}
        <span>is eating </span>
        {food ? <DishLink href={itemHref}>{food}</DishLink> : null}
        {food && place ? <span> at </span> : null}
        {!food && place ? <span>at </span> : null}
        {place ? (
          <PlaceLink href={placeHref} markUrl={inlinePlaceMark}>
            {place}
          </PlaceLink>
        ) : null}
        {!food && !place ? <span>…</span> : null}
      </>
    );
  }

  return (
    <div
      style={{
        ...styles.wrap,
        ...(selected ? styles.wrapSelected : null),
      }}
      data-testid={testId}
      data-has-video={hasVideo ? "true" : "false"}
    >
      {profileHref && identityBlock ? (
        <Link to={profileHref} style={styles.identityLink} data-testid="diner-activity-scan-profile">
          {identityBlock}
        </Link>
      ) : (
        identityBlock
      )}

      <button
        type="button"
        style={styles.rowBtn}
        data-testid="diner-activity-scan-line"
        aria-expanded={hasVideo ? expanded : undefined}
        onClick={openVideo}
      >
        {showThumb ? (
          <span style={styles.thumb} data-testid="diner-activity-scan-thumb">
            {thumbUrl ? (
              <img src={thumbUrl} alt="" style={styles.thumbImg} />
            ) : foodEmoji ? (
              <span style={styles.thumbEmoji} aria-hidden="true">
                {foodEmoji}
              </span>
            ) : (
              <span style={styles.thumbFallback} aria-hidden="true">
                {homemade ? "⌂" : initialLetter(food || place || "F")}
              </span>
            )}
          </span>
        ) : null}

        <span style={styles.body}>
          <span style={styles.prose}>{renderClause()}</span>
        </span>

        {!ownerCompact && meal ? (
          <span style={styles.mealTag} data-testid="diner-activity-scan-meal">
            {meal}
          </span>
        ) : null}

        {hasVideo ? (
          <span style={styles.playGlyph} aria-hidden="true" data-testid="diner-activity-scan-play">
            ▶
          </span>
        ) : null}
      </button>

      {hasVideo && expanded ? (
        <div style={styles.videoWrap} data-testid="diner-activity-scan-video">
          <video
            src={videoSrc}
            controls
            playsInline
            autoPlay
            poster={thumbUrl || undefined}
            style={styles.video}
          />
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: 6,
    padding: "8px 0",
    borderBottom: "1px solid #eef2f7",
  },
  wrapSelected: {
    background: "rgba(22, 163, 74, 0.06)",
    margin: "0 -8px",
    padding: "8px 8px",
    borderRadius: 10,
    borderBottom: "1px solid transparent",
  },
  identityLink: { textDecoration: "none", color: "inherit", display: "block" },
  identityRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    marginBottom: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    background: "#e2e8f0",
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    background: GREEN_MID,
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
  },
  identityText: {
    fontSize: 13,
    fontWeight: 750,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  rowBtn: {
    appearance: "none",
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    textAlign: "left",
    cursor: "pointer",
    font: "inherit",
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    flexShrink: 0,
    overflow: "hidden",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    display: "grid",
    placeItems: "center",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  thumbEmoji: { fontSize: 18, lineHeight: 1 },
  thumbFallback: {
    fontSize: 13,
    fontWeight: 800,
    color: "#64748b",
  },
  body: { flex: 1, minWidth: 0 },
  prose: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.35,
    color: "#0f172a",
  },
  mealInline: { color: "#64748b", fontWeight: 650 },
  inlineLink: {
    color: GREEN_MID,
    fontWeight: 750,
    textDecoration: "none",
  },
  inlineMark: {
    display: "inline-block",
    width: 22,
    height: 22,
    borderRadius: 6,
    overflow: "hidden",
    verticalAlign: "middle",
    marginLeft: 2,
    border: "1px solid #e2e8f0",
    background: "#fff",
  },
  inlineMarkImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  mealTag: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "3px 8px",
  },
  playGlyph: {
    flexShrink: 0,
    fontSize: 11,
    color: "#16a34a",
    fontWeight: 800,
  },
  videoWrap: {
    marginTop: 6,
    marginLeft: 0,
    borderRadius: 12,
    overflow: "hidden",
    background: "#0f172a",
    maxWidth: 360,
  },
  video: {
    display: "block",
    width: "100%",
    maxHeight: 420,
    background: "#0f172a",
  },
};
