/**
 * Profile section header — icon + eyebrow, serif title, short accent bar.
 * Header chrome only; do not reuse these per-section colors on pills/chips.
 */

import { Link } from "react-router-dom";
import {
  IconBuildingStore,
  IconCalendarEvent,
  IconCalendarStar,
  IconFlame,
  IconIdBadge,
  IconPhoto,
  IconToolsKitchen2,
  IconUsers,
} from "@tabler/icons-react";

const ICON_MAP = {
  "ti-id-badge": IconIdBadge,
  "ti-photo": IconPhoto,
  "ti-building-store": IconBuildingStore,
  "ti-tools-kitchen-2": IconToolsKitchen2,
  "ti-flame": IconFlame,
  "ti-calendar-event": IconCalendarEvent,
  "ti-users": IconUsers,
  "ti-calendar-star": IconCalendarStar,
};

const TITLE_FONT = 'Georgia, "Times New Roman", serif';

/**
 * @param {object} props
 * @param {string} props.icon Tabler icon name (e.g. ti-flame)
 * @param {string} props.eyebrowLabel
 * @param {string} props.eyebrowColor hex — icon, eyebrow, and optional count
 * @param {string} props.title
 * @param {string} props.accentColor hex — accent bar only
 * @param {number} [props.count]
 * @param {import('react').ReactNode} [props.aside] trailing actions (Add, calendar, …)
 * @param {string} [props.to] optional title link
 * @param {string} [props.testId]
 */
export default function SectionHeader({
  icon,
  eyebrowLabel,
  eyebrowColor,
  title,
  accentColor,
  count,
  aside = null,
  to = null,
  testId,
}) {
  const Icon = ICON_MAP[String(icon || "")] || null;
  const showCount = count != null && Number.isFinite(Number(count));

  const titleNode = to ? (
    <Link to={to} style={styles.titleLink}>
      {title}
    </Link>
  ) : (
    title
  );

  return (
    <div style={styles.root} data-testid={testId || "profile-section-header"}>
      <div style={{ ...styles.eyebrowRow, color: eyebrowColor }}>
        {Icon ? <Icon size={14} stroke={1.75} aria-hidden style={styles.icon} /> : null}
        <span style={styles.eyebrowLabel}>{eyebrowLabel}</span>
      </div>
      <div style={styles.titleRow}>
        <h2 style={styles.title}>{titleNode}</h2>
        <div style={styles.titleTrailing}>
          {showCount ? (
            <span style={{ ...styles.count, color: eyebrowColor }} data-testid="section-header-count">
              {Number(count)}
            </span>
          ) : null}
          {aside ? <div style={styles.aside}>{aside}</div> : null}
        </div>
      </div>
      <div
        style={{ ...styles.accentBar, background: accentColor }}
        aria-hidden="true"
        data-testid="section-header-accent"
      />
    </div>
  );
}

/** Canonical profile section header configs (eyebrow / accent pair). */
export const PROFILE_SECTION_HEADERS = {
  about: {
    icon: "ti-id-badge",
    eyebrowLabel: "My vibe",
    eyebrowColor: "#5F5E5A",
    title: "About me",
    accentColor: "#888780",
  },
  highlights: {
    icon: "ti-photo",
    eyebrowLabel: "Snapshots",
    eyebrowColor: "#0F6E56",
    title: "My reel",
    accentColor: "#1D9E75",
  },
  favs: {
    icon: "ti-building-store",
    eyebrowLabel: "Following",
    eyebrowColor: "#993C1D",
    title: "My Favs",
    accentColor: "#D85A30",
  },
  eating: {
    icon: "ti-tools-kitchen-2",
    eyebrowLabel: "Daily log",
    eyebrowColor: "#0F6E56",
    title: "What I'm eating",
    accentColor: "#1D9E75",
  },
  wannaEat: {
    icon: "ti-flame",
    eyebrowLabel: "Cravings",
    eyebrowColor: "#993556",
    title: "What I wanna eat",
    accentColor: "#D4537E",
  },
  plans: {
    icon: "ti-calendar-event",
    eyebrowLabel: "Coming up",
    eyebrowColor: "#3C3489",
    title: "What's cookin'",
    accentColor: "#7F77DD",
  },
  crews: {
    icon: "ti-users",
    eyebrowLabel: "Groups",
    eyebrowColor: "#0C447C",
    title: "My crews",
    accentColor: "#378ADD",
  },
  events: {
    icon: "ti-calendar-star",
    eyebrowLabel: "Calendar",
    eyebrowColor: "#633806",
    title: "My events",
    accentColor: "#EF9F27",
  },
};

const styles = {
  root: {
    marginBottom: 12,
    background: "#fff",
  },
  eyebrowRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  icon: {
    flexShrink: 0,
    display: "block",
  },
  eyebrowLabel: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: 1.2,
  },
  titleRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#14532d",
    fontFamily: TITLE_FONT,
    lineHeight: 1.2,
    minWidth: 0,
  },
  titleLink: {
    color: "inherit",
    textDecoration: "none",
  },
  titleTrailing: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  count: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.2,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  aside: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  accentBar: {
    marginTop: 8,
    width: 32,
    height: 2,
    borderRadius: 1,
  },
};
