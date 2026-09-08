/**
 * Activity prose row — identity + "is eating … at …"
 * Video: whole activity line is tappable (no ▶ glyph).
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { formatDinerScanIdentity } from "../../../lib/dinerDiscoverySummary.js";
import { formatActivityProseClause } from "../../../lib/dinerSocialEmojiLanguage.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

function initialLetter(name) {
  const ch = String(name || "?").trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
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
  mealPeriod = null,
  eatenOn = null,
  homemade = false,
  icon = null,
  activityLineOverride = null,
  videoUrl = null,
  profileHref = null,
  restaurantHref = null,
  testId = "diner-activity-scan-row",
  onSelect = null,
  selected = false,
  combineProse = true,
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
      icon,
    });
  const identityCommas = (identity || displayName || "Diner").replace(/ · /g, ", ");
  const proseSentence = combineProse
    ? `${identityCommas} ${clause}.`
    : null;
  const hasVideo = Boolean(String(videoUrl || "").trim());
  const resolvedAvatar = avatarUrl
    ? resolveConsumerMediaUrl(avatarUrl) || avatarUrl
    : null;

  function handleActivityActivate(e) {
    e.preventDefault();
    e.stopPropagation();
    if (hasVideo) {
      setExpanded((v) => !v);
      return;
    }
    onSelect?.();
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
      {!combineProse ? (
        <span style={styles.identityText} data-testid="diner-activity-scan-identity">
          {identity || displayName || "Diner"}
        </span>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        ...styles.wrap,
        ...(selected ? styles.wrapSelected : null),
      }}
      data-testid={testId}
      data-has-video={hasVideo ? "true" : "false"}
    >
      <div style={styles.topRow}>
        {profileHref ? (
          <Link
            to={profileHref}
            style={styles.identityLink}
            data-testid="diner-activity-scan-profile"
          >
            {identityBlock}
          </Link>
        ) : (
          identityBlock
        )}

        <button
          type="button"
          style={{
            ...styles.activityBtn,
            ...(hasVideo || typeof onSelect === "function"
              ? styles.activityBtnClickable
              : styles.activityBtnStatic),
            ...(hasVideo ? styles.activityBtnVideo : null),
          }}
          data-testid="diner-activity-scan-line"
          aria-expanded={hasVideo ? expanded : undefined}
          disabled={!hasVideo && typeof onSelect !== "function"}
          onClick={handleActivityActivate}
        >
          <span
            style={styles.proseLine}
            data-testid="diner-activity-scan-identity"
          >
            {proseSentence || clause}
          </span>
        </button>

        {restaurantHref && restaurantName ? (
          <Link
            to={restaurantHref}
            style={styles.placeLink}
            data-testid="diner-activity-scan-place"
            onClick={(e) => e.stopPropagation()}
          >
            {String(restaurantName).slice(0, 2).toUpperCase()}
          </Link>
        ) : null}
      </div>

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
  },
  wrapSelected: {
    background: "rgba(22, 163, 74, 0.06)",
    margin: "0 -8px",
    padding: "10px 8px",
    borderRadius: 10,
    borderBottom: "1px solid transparent",
  },
  topRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    minWidth: 0,
  },
  identityLink: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
    flexShrink: 0,
  },
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
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  activityBtn: {
    appearance: "none",
    border: "none",
    background: "transparent",
    padding: "4px 0 0",
    margin: 0,
    display: "block",
    textAlign: "left",
    font: "inherit",
    flex: 1,
    minWidth: 0,
  },
  activityBtnClickable: {
    cursor: "pointer",
  },
  activityBtnStatic: {
    cursor: "default",
  },
  activityBtnVideo: {
    textDecoration: "underline",
    textUnderlineOffset: 3,
    textDecorationColor: "#86efac",
  },
  proseLine: {
    fontSize: 15,
    fontWeight: 650,
    lineHeight: 1.4,
    color: "#0f172a",
  },
  placeLink: {
    flexShrink: 0,
    width: 36,
    height: 28,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    display: "grid",
    placeItems: "center",
    fontSize: 10,
    fontWeight: 800,
    color: "#0f172a",
    textDecoration: "none",
    background: "#f8fafc",
    marginTop: 4,
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
