import { Link } from "react-router-dom";
import DinerAvatar from "../social/DinerAvatar.jsx";

/**
 * Social on the search results switch (Andre 2026-11-01, same as the app): every social result for
 * this search — Available now, Want it, Love it — from `social_summary` on the search response.
 * Who's in it is the backend's call (each person's own settings); this only lays it out.
 */

// One color per vibe, same as Who's Available (app src/features/social/vibeColors.ts).
const VIBE_COLORS = {
  open_for_lunch: "#D97706",
  open_for_dinner: "#4F46E5",
  hungry: "#DC2626",
  coffee: "#92400E",
};

const SECTIONS = [
  ["available", "Available now"],
  ["want", "Want it"],
  ["love", "Love it"],
];

export function socialSummaryPeopleCount(summary) {
  if (!summary || typeof summary !== "object") return 0;
  const n = Number(summary.people_count);
  if (Number.isFinite(n) && n > 0) return n;
  const ids = new Set(
    SECTIONS.flatMap(([key]) => (Array.isArray(summary[key]) ? summary[key] : [])).map((e) => e?.consumer_user_id)
  );
  ids.delete(undefined);
  return ids.size;
}

function personHref(row) {
  const id = Number(row?.consumer_user_id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return row.second_degree || row.everyone ? `/diners/${id}` : `/account/connections/${id}`;
}

function placeHref(row) {
  const id = Number(row?.restaurant_id);
  return Number.isInteger(id) && id > 0 ? `/restaurants/${id}` : null;
}

export default function SearchSocialSummary({ summary }) {
  const people = socialSummaryPeopleCount(summary);
  if (!people) return null;
  const available = Number(summary.available_count) || (summary.available || []).length;

  return (
    <div data-testid="search-social-view" style={styles.wrap}>
      <p style={styles.summary} data-testid="search-social-summary">
        {[`${people} ${people === 1 ? "person" : "people"}`, available ? `${available} available now` : null]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {SECTIONS.map(([key, title]) => {
        const rows = Array.isArray(summary[key]) ? summary[key].filter((r) => r && String(r.line || "").trim()) : [];
        if (!rows.length) return null;
        return (
          <section key={key} style={styles.card} data-testid={`search-social-${key}`}>
            <h3 style={styles.heading}>{title}</h3>
            {rows.map((row) => {
              const href = personHref(row);
              const place = [row.dish_name, row.restaurant_name].filter(Boolean).join(" · ");
              const toPlace = placeHref(row);
              const dot = VIBE_COLORS[row.current_vibe];
              const PersonTag = href ? Link : "span";
              const ctaLabel = String(row.cta_label || "").trim();
              const ctaHref = String(row.cta_href || "").trim();
              const showCta = Boolean(ctaLabel && ctaHref) && !row.second_degree && !row.everyone;
              // Available but not your Connect yet: Connect, so the row has something to do (Andre 2026-11-01).
              const showConnect = !showCta && href && row.current_vibe && (row.second_degree || row.everyone);
              return (
                <div key={row.activity_id || `${row.kind}:${row.consumer_user_id}`} style={styles.row} data-testid="search-social-row">
                  <PersonTag {...(href ? { to: href } : {})} style={styles.person}>
                    <DinerAvatar
                      avatarUrl={row.avatar_url}
                      avatarMotionUrl={row.avatar_motion_url}
                      displayName={row.display_name}
                      size={32}
                      title={null}
                    />
                    <span style={styles.text}>
                      <span style={styles.line}>
                        {dot ? <span style={{ ...styles.dot, background: dot }} aria-hidden /> : null}
                        {/* A Connect's Catch Me trip in this city (Andre 2026-11-01). */}
                        {row.kind === "catch_me" ? `✈️ ${row.line}` : row.line}
                      </span>
                      {place ? (
                        toPlace ? null : <span style={styles.place}>{place}</span>
                      ) : null}
                    </span>
                  </PersonTag>
                  {showCta ? (
                    <a href={ctaHref} style={styles.cta} data-testid="search-social-cta">
                      {ctaLabel}
                    </a>
                  ) : showConnect ? (
                    <Link to={href} style={styles.cta} data-testid="search-social-connect">
                      Connect
                    </Link>
                  ) : null}
                  {place && toPlace ? (
                    <Link to={toPlace} style={styles.placeLink}>
                      {place} ›
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

const styles = {
  wrap: { display: "grid", gap: 12, marginBottom: 16 },
  summary: { margin: 0, fontSize: 13, fontWeight: 600, color: "#6B7280" },
  card: {
    background: "#0B0F0C",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 16,
    display: "grid",
    gap: 4,
  },
  heading: { margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#F9FAFB" },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px", padding: "8px 0" },
  person: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" },
  text: { display: "grid", gap: 2, minWidth: 0 },
  line: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#E5E7EB" },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  place: { fontSize: 13, color: "#9CA3AF" },
  placeLink: { flexBasis: "100%", paddingLeft: 42, fontSize: 13, color: "#9CA3AF", textDecoration: "none" },
  // Outlined pill, same as the Invite on a search card's Connect line.
  cta: {
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 10px",
    border: "1px solid var(--gb-color-accent)",
    background: "transparent",
    color: "var(--gb-color-accent)",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    textDecoration: "none",
  },
};
