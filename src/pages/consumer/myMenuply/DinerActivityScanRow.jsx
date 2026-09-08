/**
 * Activity prose row — identity + activity.
 * Restaurant shown as logo/billboard (tap → profile). Dish text taps → menu-item detail.
 * Video: activity line tappable (no ▶ glyph).
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { formatDinerScanIdentity } from "../../../lib/dinerDiscoverySummary.js";
import { formatActivityProseClause } from "../../../lib/dinerSocialEmojiLanguage.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import { restaurantHref } from "./myMenuplyBits.jsx";
import { resolveEatingDishVisual } from "./eatingDishVisual.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

function initialLetter(name) {
  const ch = String(name || "?").trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function dishHref(item = {}) {
  const id = item.menu_item_id || item.ck_menu_item_id || item.dish_id;
  if (id == null || id === "") return null;
  const n = Number(id);
  if (Number.isFinite(n) && n > 0) return `/menu-items/${n}`;
  const s = String(id);
  if (s.startsWith("cmi:")) return `/menu-items/${encodeURIComponent(s)}`;
  return `/menu-items/${encodeURIComponent(s)}`;
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
  foodInterestKey = null,
  restaurantName = null,
  restaurantId = null,
  restaurantSlug = null,
  restaurantCity = null,
  restaurantState = null,
  restaurantLogoUrl = null,
  restaurantBillboardUrl = null,
  menuItemId = null,
  mealPeriod = null,
  eatenOn = null,
  homemade = false,
  icon = null,
  activityLineOverride = null,
  videoUrl = null,
  profileHref = null,
  testId = "diner-activity-scan-row",
  onSelect = null,
  selected = false,
  secondPerson = false,
}) {
  const [expanded, setExpanded] = useState(false);
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
  const clause =
    String(activityLineOverride || "").trim() ||
    formatActivityProseClause({
      kind,
      food_name: foodName,
      food_interest_key: foodInterestKey,
      restaurant_name: restaurantName,
      meal_period: mealPeriod,
      eaten_on: eatenOn,
      homemade,
      cooking: homemade,
      second_person: secondPerson,
    });

  const placeHref = restaurantHref({
    restaurant_id: restaurantId,
    restaurant_slug: restaurantSlug,
    slug: restaurantSlug,
    city: restaurantCity,
    state: restaurantState,
  });
  const itemHref = dishHref({ menu_item_id: menuItemId });
  const placeVisual = resolveEatingDishVisual({
    restaurant_logo_url: restaurantLogoUrl,
    restaurant_billboard_image_url: restaurantBillboardUrl,
  });
  const placeImg =
    placeVisual?.source === "logo" || placeVisual?.source === "billboard"
      ? placeVisual.url
      : resolveConsumerMediaUrl(restaurantLogoUrl || restaurantBillboardUrl) || null;

  const homeEmoji =
    homemade && foodName ? iconForFoodText(foodName) || icon || null : null;

  const hasVideo = Boolean(String(videoUrl || "").trim());
  const resolvedAvatar = avatarUrl
    ? resolveConsumerMediaUrl(avatarUrl) || avatarUrl
    : null;

  function handleVideoToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((v) => !v);
  }

  function handleSelect(e) {
    if (typeof onSelect !== "function") return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  }

  const identityBlock = (
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
  );

  // Own hub: "You" + "eating …" (never third-person "is" after You). Peers: "is eating".
  const verb = secondPerson
    ? homemade
      ? "cooking"
      : kind === "want"
        ? "want"
        : "eating"
    : homemade
      ? "is cooking"
      : kind === "want"
        ? "wants"
        : "is eating";

  const showPlaceMark = !homemade && Boolean(placeHref || restaurantName);

  return (
    <div
      style={{
        ...styles.wrap,
        ...(selected ? styles.wrapSelected : null),
      }}
      data-testid={testId}
      data-has-video={hasVideo ? "true" : "false"}
    >
      {profileHref ? (
        <Link to={profileHref} style={styles.identityLink} data-testid="diner-activity-scan-profile">
          {identityBlock}
        </Link>
      ) : (
        identityBlock
      )}

      <div style={styles.activityRow} data-testid="diner-activity-scan-line">
        <span style={styles.proseLine}>
          {homeEmoji ? <span aria-hidden="true">{homeEmoji} </span> : null}
          <span>{verb}</span>
          {foodName ? (
            <>
              {" "}
              {itemHref ? (
                <Link
                  to={itemHref}
                  style={styles.inlineLink}
                  data-testid="diner-activity-scan-dish"
                >
                  {foodName}
                </Link>
              ) : (
                <span data-testid="diner-activity-scan-dish-text">{foodName}</span>
              )}
            </>
          ) : null}
          {homemade ? <span> @home</span> : null}
          {!homemade && showPlaceMark ? <span> at </span> : null}
        </span>

        {!homemade && placeHref && placeImg ? (
          <Link
            to={placeHref}
            style={styles.placeMark}
            data-testid="diner-activity-scan-place"
            title={restaurantName || "Restaurant"}
          >
            <img
              src={placeImg}
              alt={restaurantName || "Restaurant"}
              style={styles.placeImg}
            />
          </Link>
        ) : !homemade && placeHref ? (
          <Link
            to={placeHref}
            style={styles.placeFallback}
            data-testid="diner-activity-scan-place"
            title={restaurantName || "Restaurant"}
          >
            {(restaurantName || "R").slice(0, 2).toUpperCase()}
          </Link>
        ) : !homemade && restaurantName ? (
          <span style={styles.placeFallback} data-testid="diner-activity-scan-place-text">
            {restaurantName}
          </span>
        ) : null}

        {hasVideo ? (
          <button
            type="button"
            style={styles.videoHit}
            data-testid="diner-activity-scan-video-toggle"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide video" : "Show video"}
            onClick={handleVideoToggle}
          />
        ) : typeof onSelect === "function" ? (
          <button
            type="button"
            style={styles.videoHit}
            data-testid="diner-activity-scan-select"
            aria-label="Select activity"
            onClick={handleSelect}
          />
        ) : null}
      </div>

      <span style={{ display: "none" }} data-testid="diner-activity-scan-clause">
        {clause}
      </span>

      {hasVideo && expanded ? (
        <div style={styles.videoWrap} data-testid="diner-activity-scan-video">
          <video
            src={String(videoUrl).trim()}
            controls
            playsInline
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
    padding: "10px 0",
    borderBottom: "1px solid #e2e8f0",
    position: "relative",
  },
  wrapSelected: {
    background: "rgba(22, 163, 74, 0.06)",
    margin: "0 -8px",
    padding: "10px 8px",
    borderRadius: 10,
    borderBottom: "1px solid transparent",
  },
  identityLink: { textDecoration: "none", color: "inherit", display: "block" },
  identityRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    background: "#e2e8f0",
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    background: GREEN_MID,
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
  },
  identityText: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.25,
  },
  activityRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingLeft: 46,
    minWidth: 0,
    position: "relative",
  },
  proseLine: {
    fontSize: 15,
    fontWeight: 650,
    lineHeight: 1.4,
    color: "#0f172a",
    minWidth: 0,
    position: "relative",
    zIndex: 1,
  },
  inlineLink: {
    color: GREEN_MID,
    fontWeight: 750,
    textDecoration: "none",
    position: "relative",
    zIndex: 1,
  },
  placeMark: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    position: "relative",
    zIndex: 1,
  },
  placeImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  placeFallback: {
    flexShrink: 0,
    maxWidth: 120,
    minWidth: 44,
    height: 44,
    padding: "0 8px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    display: "grid",
    placeItems: "center",
    fontSize: 11,
    fontWeight: 800,
    color: "#0f172a",
    textDecoration: "none",
    background: "#f8fafc",
    textAlign: "center",
    lineHeight: 1.2,
    position: "relative",
    zIndex: 1,
    overflow: "hidden",
  },
  videoHit: {
    appearance: "none",
    border: "none",
    background: "transparent",
    position: "absolute",
    inset: 0,
    cursor: "pointer",
    zIndex: 0,
  },
  videoWrap: {
    margin: "4px 0 0 46px",
    borderRadius: 12,
    overflow: "hidden",
    background: "#0f172a",
    maxWidth: 320,
  },
  video: {
    display: "block",
    width: "100%",
    maxHeight: 360,
    background: "#0f172a",
  },
};
