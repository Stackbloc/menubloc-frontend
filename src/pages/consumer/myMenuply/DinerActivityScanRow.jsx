/**
 * Activity-first scan row — compact identity + emoji activity line.
 * Video is optional media behind the activity line (▶ + inline expand).
 * No camera / record controls on this card.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  formatDinerActivityLine,
  formatDinerScanIdentity,
} from "../../../lib/dinerDiscoverySummary.js";
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
  icon = null,
  activityLineOverride = null,
  videoUrl = null,
  profileHref = null,
  testId = "diner-activity-scan-row",
  /** When set, selecting the want/ate signal (without video) can still notify parent. */
  onSelect = null,
  selected = false,
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
  const activityLine =
    (activityLineOverride && String(activityLineOverride).trim()) ||
    formatDinerActivityLine({
      kind,
      food_name: foodName,
      food_interest_key: foodInterestKey,
      icon,
    });
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
      <span style={styles.identityText} data-testid="diner-activity-scan-identity">
        {identity || displayName || "Diner"}
      </span>
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
      {profileHref ? (
        <Link to={profileHref} style={styles.identityLink} data-testid="diner-activity-scan-profile">
          {identityBlock}
        </Link>
      ) : (
        identityBlock
      )}

      <button
        type="button"
        style={{
          ...styles.activityBtn,
          ...(hasVideo ? styles.activityBtnExpandable : null),
          ...(!hasVideo && !onSelect ? styles.activityBtnStatic : null),
        }}
        data-testid="diner-activity-scan-line"
        aria-expanded={hasVideo ? expanded : undefined}
        disabled={!hasVideo && typeof onSelect !== "function"}
        onClick={handleActivityActivate}
      >
        <span style={styles.activityText}>{activityLine}</span>
        {hasVideo ? (
          <span style={styles.play} aria-hidden="true" data-testid="diner-activity-scan-play">
            ▶
          </span>
        ) : null}
      </button>

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
  identityLink: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
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
    padding: "2px 0 0 46px",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    textAlign: "left",
    cursor: "pointer",
    color: GREEN_MID,
    font: "inherit",
  },
  activityBtnExpandable: {
    cursor: "pointer",
  },
  activityBtnStatic: {
    cursor: "default",
  },
  activityText: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  play: {
    fontSize: 11,
    lineHeight: 1,
    color: GREEN_MID,
    flexShrink: 0,
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
