import { Link } from "react-router-dom";
import DinerAvatar from "../social/DinerAvatar.jsx";
import SocialPlanActionButton from "../../pages/consumer/myMenuply/SocialPlanActionButton.jsx";
import { formatWhen } from "../../lib/searchSocial.js";

/**
 * Unified search under Search → Social — web (2026-11-19, same as app 65cbffb
 * SearchSocialSections.tsx). Plans, Events and People for the search words, as plain rows: one
 * line, one text action on the right (no pills, no full-width buttons).
 *   Plan:   "Maya · Tacos at Guisados · Fri, Nov 20 · 7:00 PM"  [Ask to Join]
 *   Event:  "Taco Night · Guisados · Sat, Nov 21 · 7:00 PM"      [View]
 *   Person: "Maya T. · Hungry Now - Tacos"                     [Invite] (Connect) / [Connect]
 * Sections with nothing are left out.
 */

export function planLine(p) {
  const what = p.placeName && p.placeName !== p.title ? `${p.title} at ${p.placeName}` : p.title;
  return [p.peer?.name || null, what, formatWhen(p.date, p.time)].filter(Boolean).join(" · ");
}

export function eventLine(e) {
  const when = formatWhen(e.date, e.time);
  return [e.title, e.placeName, when ? (e.timeLabel ? `${when} · ${e.timeLabel}` : when) : e.timeLabel, e.ageLabel]
    .filter(Boolean)
    .join(" · ");
}

export function personLine(p) {
  return [p.name, p.vibe || p.locationLabel].filter(Boolean).join(" · ");
}

/** Venue events open the public event page; a diner's event opens its join link. */
export function eventHref(e) {
  if (e.kind === "venue_event" && e.slug) return `/events/${encodeURIComponent(e.slug)}`;
  if (e.token) return `/join-event/${encodeURIComponent(e.token)}`;
  return null;
}

/** A Connect → their Connect screen (to invite); anyone else → their public profile (to connect). */
export function personHref(p) {
  return p.isConnect ? `/account/connections/${p.id}` : `/diners/${p.id}`;
}

export function SearchPlansSection({ plans }) {
  if (!plans?.length) return null;
  return (
    <section style={styles.card} data-testid="search-social-plans">
      <h3 style={styles.heading}>Plans</h3>
      {plans.map((p) => (
        <div key={p.key} style={styles.row} data-testid={`search-plan-${p.key}`}>
          <DinerAvatar avatarUrl={p.peer?.avatarUrl} displayName={p.peer?.name} size={32} title={null} />
          <span style={styles.line}>{planLine(p)}</span>
          <SocialPlanActionButton plan={p} plain testId={`search-plan-${p.key}-action`} />
        </div>
      ))}
    </section>
  );
}

export function SearchEventsSection({ events }) {
  if (!events?.length) return null;
  return (
    <section style={styles.card} data-testid="search-social-events">
      <h3 style={styles.heading}>Events</h3>
      {events.map((e) => {
        const href = eventHref(e);
        return (
          <Link key={e.key} to={href} style={styles.rowLink} data-testid={`search-event-${e.key}`}>
            <span style={styles.line}>{eventLine(e)}</span>
            <span style={styles.action}>View</span>
          </Link>
        );
      })}
    </section>
  );
}

export function SearchPeopleSection({ people }) {
  if (!people?.length) return null;
  return (
    <section style={styles.card} data-testid="search-social-people">
      <h3 style={styles.heading}>People</h3>
      {people.map((p) => {
        const href = personHref(p);
        const verb = p.isConnect ? "Invite" : "Connect";
        return (
          <div key={p.key} style={styles.row} data-testid={`search-person-${p.id}`}>
            <Link to={href} style={styles.person}>
              <DinerAvatar avatarUrl={p.avatarUrl} displayName={p.name} size={32} title={null} />
              <span style={styles.line}>{personLine(p)}</span>
            </Link>
            <Link
              to={href}
              style={styles.action}
              aria-label={`${p.isConnect ? "Invite" : "Connect with"} ${p.name}`}
              data-testid={`search-person-${p.id}-${verb.toLowerCase()}`}
            >
              {verb}
            </Link>
          </div>
        );
      })}
    </section>
  );
}

// Same card as SearchSocialSummary's Available now / Want it / Love it.
const styles = {
  card: {
    background: "#0B0F0C",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 16,
    display: "grid",
    gap: 4,
  },
  heading: { margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#F9FAFB" },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0" },
  rowLink: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "inherit", textDecoration: "none" },
  person: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" },
  line: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: "#E5E7EB" },
  action: {
    flexShrink: 0,
    padding: "4px",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--gb-color-accent)",
    textDecoration: "none",
  },
};
