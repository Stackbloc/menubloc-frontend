/**
 * Upcoming food-truck stops from opportunistic schedule payload (no fake data).
 */
import { PROFILE_GREEN, PROFILE_INK, PROFILE_MUTED } from "./profilePrimitives.jsx";

export default function FoodTruckUpcomingStops({ stops = [] }) {
  return (
    <div data-testid="food-truck-upcoming" style={{ display: "grid", gap: 10 }}>
      {stops.length ? (
        stops.map((stop, idx) => (
          <div
            key={`${stop.day}-${stop.location}-${idx}`}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff",
              border: "1px solid #e7e5e4",
            }}
          >
            {stop.day ? (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  color: PROFILE_GREEN,
                  marginBottom: 4,
                }}
              >
                {stop.day}
              </div>
            ) : null}
            {stop.eventName ? (
              <div style={{ fontSize: 13, fontWeight: 600, color: PROFILE_MUTED, marginBottom: 2 }}>
                {stop.eventName}
              </div>
            ) : null}
            {stop.location ? (
              <div style={{ fontSize: 14, fontWeight: 700, color: PROFILE_INK, lineHeight: 1.35 }}>
                {stop.location}
              </div>
            ) : null}
            {stop.time ? (
              <div style={{ fontSize: 13, color: PROFILE_MUTED, marginTop: 2 }}>{stop.time}</div>
            ) : null}
          </div>
        ))
      ) : (
        <div style={{ fontSize: 14, color: PROFILE_MUTED, lineHeight: 1.5, fontStyle: "italic" }}>
          No upcoming stops yet.
        </div>
      )}
    </div>
  );
}
