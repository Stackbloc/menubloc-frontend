/**
 * Upcoming Events — Venue capability profile section (Phase 3/4).
 * Lists published venue_events cards with links to /events/:slug.
 */
import { Link } from "react-router-dom";
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
      {list.map((ev) => {
        const href = ev.slug ? `/events/${encodeURIComponent(String(ev.slug))}` : null;
        const body = (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>
              {ev.name || "Event"}
              {ev.age_requirement_label ? (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#9a3412",
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    borderRadius: 999,
                    padding: "2px 8px",
                    verticalAlign: "middle",
                  }}
                >
                  {ev.age_requirement_label}
                </span>
              ) : null}
            </div>
            {ev.starts_at || ev.date ? (
              <div style={{ fontSize: 13, color: PROFILE_MUTED, marginTop: 2 }}>
                {[ev.date || ev.starts_at, ev.start_time].filter(Boolean).join(" · ")}
              </div>
            ) : null}
          </>
        );
        const style = {
          padding: "12px 14px",
          borderRadius: 12,
          background: "#fff",
          border: "1px solid #e7e5e4",
          textDecoration: "none",
          color: "inherit",
          display: "block",
        };
        return href ? (
          <Link key={ev.id || ev.slug || ev.name} to={href} style={style}>
            {body}
          </Link>
        ) : (
          <div key={ev.id || ev.slug || ev.name} style={style}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
