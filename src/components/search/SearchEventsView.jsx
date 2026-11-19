import OpenInvitesSection from "../openInvite/OpenInvitesSection.jsx";
import { SearchEventsSection, SearchPlansSection } from "./SearchSocialSections.jsx";

/**
 * Events radio on search results (Andre 2026-11-19: "dish, restaurants, social, and events each
 * have their own dial" + "plans goes under events"). Order: Open Invites · Plans · Events.
 * Open Invites come from the food search's `social_summary`; plans and events from GET /search/social.
 * Who's in each list is the backend's call; this only lays it out.
 */

function openInvites(summary) {
  return Array.isArray(summary?.open_invites) ? summary.open_invites : [];
}

/** Count on the Events radio: Open Invites + plans + events. */
export function eventsViewCount(summary, groups) {
  return openInvites(summary).length + (groups?.plans?.length || 0) + (groups?.events?.length || 0);
}

export default function SearchEventsView({ summary, groups = null }) {
  const invites = openInvites(summary);
  const plans = groups?.plans || [];
  const events = groups?.events || [];
  if (!invites.length && !plans.length && !events.length) return null;
  return (
    <div data-testid="search-events-view" style={{ display: "grid", gap: 12, marginBottom: 16 }}>
      {invites.length ? <OpenInvitesSection invites={invites} /> : null}
      <SearchPlansSection plans={plans} />
      <SearchEventsSection events={events} />
    </div>
  );
}
