/**
 * Upcoming Events — Venue capability profile section (Phase 3).
 * Empty until Phase 4 Event objects exist. Only mount when venue capability is on.
 */
import { PROFILE_MUTED, ProfileSectionBlank } from "./profilePrimitives.jsx";

export default function ProfileUpcomingEvents({ events = [] }) {
  const list = Array.isArray(events) ? events : [];
  if (!list.length) {
    return (
      <ProfileSectionBlank
        testId="profile-upcoming-events-blank"
        message="No upcoming events yet."
      />
    );
  }

  return (
    <div data-testid="profile-upcoming-events" style={{ display: "grid", gap: 10 }}>
      {list.map((ev) => (
        <div
          key={ev.id || ev.slug || ev.name}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "#fff",
            border: "1px solid #e7e5e4",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>
            {ev.name || "Event"}
          </div>
          {ev.starts_at || ev.date ? (
            <div style={{ fontSize: 13, color: PROFILE_MUTED, marginTop: 2 }}>
              {[ev.date || ev.starts_at, ev.start_time].filter(Boolean).join(" · ")}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
