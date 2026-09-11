/**
 * Compact category activity row for profile sections.
 * Owner hub (ownerCompact): timeline — meal dot/meta, dish, place.
 * Discovery / Who's Eating (nameInProse): "BillS is eating lunch at ABC, Chicken Sandwich."
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  formatDinerScanIdentity,
  formatWhosEatingScanIdentity,
} from "../../../lib/dinerDiscoverySummary.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import { WHAT_I_ATE_MEAL_PERIODS } from "../../../lib/whatIAteTodayMealPeriod.js";
import { shouldPreferRestaurantMark } from "../../../lib/restaurantMarkPreference.js";
import { restaurantHref } from "./myMenuplyBits.jsx";
import { resolveEatingDishVisual } from "./eatingDishVisual.js";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import { GREEN_MID } from "./myMenuplyStyles.js";
import * as s from "./myMenuplyStyles.js";
import {
  formatMealPeriodClockLead,
  mealPeriodClockParts,
} from "./dinerHubFormat.js";
import { mealPeriodProseWord } from "../../../lib/dinerSocialEmojiLanguage.js";

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

function PlaceLink({ href, children, markUrl = null, linkStyle = null }) {
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
        style={linkStyle || styles.inlineLink}
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
  /** Occupation fallback when no college affiliation (Who's Eating). */
  occupation = null,
  includeSex = false,
  dinerSex = null,
  dinerSexShort = null,
  kind = "ate",
  foodName = null,
  /** Extra dishes/sides folded on the muted place line (ownerCompact timeline). */
  secondaryFoodName = null,
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
  /** ISO eaten_at — shown as clock after meal period on ownerCompact rows. */
  eatenAt = null,
  /** Settings: hide clock time globally. */
  omitMealClock = false,
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
  /** Owner profile: long-press / right-click to delete this entry. */
  onDelete = null,
  deleteBusy = false,
  deleteLabel = "Delete",
  /** Timeline rail ends — soften connector above/below first/last meal. */
  timelineFirst = false,
  timelineLast = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const canDelete = typeof onDelete === "function";
  const { open: deleteOpen, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);
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

  const whosEatingIdentity = formatWhosEatingScanIdentity({
    display_name: displayName,
    age_years: ageYears,
    diner_sex: dinerSex,
    diner_sex_short: dinerSexShort,
    school_affiliation: affiliation,
    diner_occupation: occupation,
  });

  const placeHref = restaurantHref({
    restaurant_id: restaurantId,
    restaurant_slug: restaurantSlug,
    slug: restaurantSlug,
    city: restaurantCity,
    state: restaurantState,
  });
  const itemHref = dishHref(menuItemId);
  const place = String(restaurantName || "").trim() || null;
  const foodRaw = String(foodName || "").trim() || null;
  /** Never treat the restaurant brand as the dish ("eating Yoshinoya at Yoshinoya"). */
  const food =
    foodRaw && place && foodRaw.toLowerCase() === place.toLowerCase() ? null : foodRaw;
  const isWant = kind === "want" || kind === "wanna_eat" || kind === "want_to_eat";
  const proseName = String(displayName || "").trim() || "Diner";
  const identitySuffix =
    nameInProse && whosEatingIdentity.startsWith(proseName)
      ? whosEatingIdentity.slice(proseName.length)
      : "";

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
  const mealParts = ownerCompact
    ? mealPeriodClockParts(mealPeriod, eatenAt, { omitClock: omitMealClock })
    : { meal: "", mealUpper: "", clock: "", accent: "#64748b" };
  const mealClockLead = ownerCompact
    ? formatMealPeriodClockLead(mealPeriod, eatenAt, { omitClock: omitMealClock })
    : "";
  const secondaryFood = String(secondaryFoodName || "").trim();
  const mealAccent = mealParts.accent || "#64748b";

  function openVideo(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (consumeArmedClick() || deleteOpen) {
      dismiss();
      return;
    }
    if (!hasVideo) {
      onSelect?.();
      return;
    }
    setExpanded((v) => !v);
  }

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (deleteBusy) return;
    dismiss();
    onDelete?.();
  }

  const identityBlock =
    showIdentity && !ownerCompact && !nameInProse ? (
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

  function renderInlineAvatar() {
    if (!nameInProse || ownerCompact) return null;
    const avatarEl = resolvedAvatar ? (
      <img src={resolvedAvatar} alt="" style={styles.inlineAvatar} />
    ) : (
      <span style={styles.inlineAvatarFallback} aria-hidden="true">
        {initialLetter(displayName)}
      </span>
    );
    if (profileHref) {
      return (
        <Link
          to={profileHref}
          style={styles.inlineAvatarLink}
          data-testid="diner-activity-scan-inline-avatar"
          onClick={(e) => e.stopPropagation()}
        >
          {avatarEl}
        </Link>
      );
    }
    return <span style={styles.inlineAvatarLink}>{avatarEl}</span>;
  }

  function renderProseNameLead() {
    if (!nameInProse || ownerCompact) return null;
    const nameNode = profileHref ? (
      <Link
        to={profileHref}
        style={styles.inlineLink}
        data-testid="diner-activity-scan-prose-name"
        onClick={(e) => e.stopPropagation()}
      >
        {proseName}
      </Link>
    ) : (
      <span data-testid="diner-activity-scan-prose-name">{proseName}</span>
    );
    return (
      <>
        {renderInlineAvatar()}
        {nameNode}
        {identitySuffix ? <span>{identitySuffix}</span> : null}
        <span> </span>
      </>
    );
  }

  function renderClause() {
    const nameLead = renderProseNameLead();

    if (ownerCompact) {
      // Timeline body renders dish / place / secondary separately.
      return null;
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

    // Discovery / Who's Eating reporting:
    // "BillS is eating lunch at ABC Restaurant, Chicken Sandwich."
    const mealProse = mealPeriodProseWord(mealPeriod);
    const placeNode = homemade ? (
      <span data-testid="diner-activity-scan-place-text">@home</span>
    ) : place ? (
      <PlaceLink href={placeHref} markUrl={inlinePlaceMark}>
        {place}
      </PlaceLink>
    ) : null;

    return (
      <>
        {nameLead}
        <span>is eating </span>
        {mealProse ? <span>{mealProse} </span> : null}
        {placeNode ? (
          <>
            <span>at </span>
            {placeNode}
          </>
        ) : null}
        {placeNode && food ? <span>, </span> : null}
        {!placeNode && mealProse && food ? <span>, </span> : null}
        {food ? <DishLink href={itemHref}>{food}</DishLink> : null}
        {!mealProse && !placeNode && !food ? <span>…</span> : null}
      </>
    );
  }

  function renderOwnerTimelineBody() {
    const placeLabel = homemade ? "@home" : place;
    const placeNode = homemade ? (
      <span data-testid="diner-activity-scan-place-text">@home</span>
    ) : place ? (
      <PlaceLink href={placeHref} markUrl={null} linkStyle={styles.placeLinkTimeline}>
        {place}
      </PlaceLink>
    ) : null;
    const showPlaceLine = Boolean(placeNode || secondaryFood);
    const dishLabel =
      food ||
      (isWant ? "Wanna eat" : null) ||
      (placeLabel ? null : "eating") ||
      null;

    return (
      <span style={styles.timelineBody} data-testid="diner-activity-scan-timeline-body">
        {mealParts.mealUpper || mealParts.clock ? (
          <span
            style={styles.metaRow}
            data-testid="diner-activity-scan-meal-inline"
            aria-label={mealClockLead}
          >
            {mealParts.mealUpper ? (
              <span
                style={{ ...styles.metaMeal, color: mealAccent }}
                data-testid="diner-activity-scan-meal-pill"
              >
                {mealParts.mealUpper}
              </span>
            ) : null}
            {mealParts.clock ? (
              <span style={styles.metaClock} data-testid="diner-activity-scan-meal-clock">
                {mealParts.clock}
              </span>
            ) : null}
          </span>
        ) : null}
        {dishLabel ? (
          <span style={styles.dishLead} data-testid="diner-activity-scan-dish-lead">
            <DishLink href={itemHref}>
              <span style={styles.dishEmphasis}>{dishLabel}</span>
            </DishLink>
          </span>
        ) : null}
        {showPlaceLine ? (
          <span style={styles.placeLine} data-testid="diner-activity-scan-place-line">
            {placeNode ? (
              <>
                <span style={styles.atMuted}>at </span>
                {placeNode}
              </>
            ) : null}
            {secondaryFood ? (
              <span style={styles.secondaryFood}>
                {placeNode ? " - " : ""}
                {secondaryFood}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      style={{
        ...styles.wrap,
        ...(ownerCompact ? styles.wrapTimeline : null),
        ...(selected ? styles.wrapSelected : null),
        ...(canDelete ? s.hubCardShell : null),
      }}
      data-testid={testId}
      data-has-video={hasVideo ? "true" : "false"}
      {...bind}
    >
      {deleteOpen ? (
        <button
          type="button"
          style={s.hubCardDelete}
          data-testid="diner-activity-scan-delete"
          aria-label={deleteLabel}
          disabled={deleteBusy}
          onClick={handleDelete}
        >
          Delete
        </button>
      ) : null}
      {profileHref && identityBlock ? (
        <Link to={profileHref} style={styles.identityLink} data-testid="diner-activity-scan-profile">
          {identityBlock}
        </Link>
      ) : (
        identityBlock
      )}

      <button
        type="button"
        style={ownerCompact ? styles.timelineRowBtn : styles.rowBtn}
        data-testid="diner-activity-scan-line"
        aria-expanded={hasVideo ? expanded : undefined}
        onClick={openVideo}
      >
        {ownerCompact ? (
          <>
            <span style={styles.timelineRail} aria-hidden="true">
              <span
                style={{
                  ...styles.timelineLine,
                  ...(timelineFirst ? styles.timelineLineFirst : null),
                  ...(timelineLast ? styles.timelineLineLast : null),
                }}
              />
              <span
                style={{ ...styles.timelineDot, background: mealAccent }}
                data-testid="diner-activity-scan-meal-dot"
              />
            </span>
            {renderOwnerTimelineBody()}
          </>
        ) : (
          <>
            {showThumb && (thumbUrl || foodEmoji) ? (
              <span style={styles.thumb} data-testid="diner-activity-scan-thumb">
                {thumbUrl ? (
                  <img src={thumbUrl} alt="" style={styles.thumbImg} />
                ) : (
                  <span style={styles.thumbEmoji} aria-hidden="true">
                    {foodEmoji}
                  </span>
                )}
              </span>
            ) : null}

            <span style={styles.body}>
              <span style={nameInProse ? styles.proseContinuous : styles.prose}>
                {renderClause()}
              </span>
            </span>

            {meal ? (
              <span style={styles.mealTag} data-testid="diner-activity-scan-meal">
                {meal}
              </span>
            ) : null}
          </>
        )}

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
  wrapTimeline: {
    gap: 0,
    padding: 0,
    borderBottom: "none",
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
  body: { flex: 1, minWidth: 0 },
  prose: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.35,
    color: "#0f172a",
  },
  proseContinuous: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
    color: "#0f172a",
    display: "inline",
  },
  inlineAvatarLink: {
    display: "inline-flex",
    verticalAlign: "middle",
    marginRight: 6,
    textDecoration: "none",
    flexShrink: 0,
  },
  inlineAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    background: "#e2e8f0",
  },
  inlineAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: GREEN_MID,
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
  },
  mealInline: {
    color: "#64748b",
    fontWeight: 650,
    flexShrink: 0,
    marginRight: 8,
    whiteSpace: "nowrap",
  },
  timelineRowBtn: {
    appearance: "none",
    border: "none",
    background: "transparent",
    padding: "10px 0",
    margin: 0,
    width: "100%",
    display: "flex",
    alignItems: "stretch",
    gap: 12,
    textAlign: "left",
    cursor: "pointer",
    font: "inherit",
  },
  timelineRail: {
    position: "relative",
    width: 14,
    flexShrink: 0,
    display: "flex",
    justifyContent: "center",
  },
  timelineLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 2,
    marginLeft: -1,
    background: "#e2e8f0",
  },
  timelineLineFirst: {
    top: 8,
  },
  timelineLineLast: {
    bottom: "calc(100% - 14px)",
  },
  timelineDot: {
    position: "relative",
    zIndex: 1,
    width: 10,
    height: 10,
    marginTop: 4,
    borderRadius: "50%",
    boxShadow: "0 0 0 3px #fff",
    flexShrink: 0,
  },
  timelineBody: {
    flex: 1,
    minWidth: 0,
    display: "grid",
    gap: 3,
    paddingBottom: 2,
  },
  metaRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    minWidth: 0,
  },
  metaMeal: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  },
  metaClock: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  },
  dishLead: {
    minWidth: 0,
    lineHeight: 1.25,
  },
  dishEmphasis: {
    fontSize: 16,
    fontWeight: 780,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  placeLine: {
    fontSize: 13,
    lineHeight: 1.35,
    color: "#64748b",
    fontWeight: 500,
    minWidth: 0,
  },
  atMuted: {
    color: "#94a3b8",
    fontWeight: 500,
  },
  placeLinkTimeline: {
    color: "#2563eb",
    fontWeight: 650,
    textDecoration: "none",
  },
  secondaryFood: {
    color: "#94a3b8",
    fontWeight: 500,
  },
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
    alignSelf: "center",
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
