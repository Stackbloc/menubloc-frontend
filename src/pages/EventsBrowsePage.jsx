/**
 * Events browse — published restaurant/venue events near the diner's location.
 * Separate from clusters (Find events must not redirect to /clusters).
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { fetchPublicEventsNear } from "../lib/eventsApi.js";
import { splitEventsByLocalDay } from "../lib/clusterDashboardModel.js";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { listMyVenueEvents } from "../lib/consumerApi.js";

const DEFAULT_LAT = 34.0522;
const DEFAULT_LNG = -118.2437;

function EventCard({ event }) {
  const where = [event.venue_label, event.restaurant_name, event.city && event.state ? `${event.city}, ${event.state}` : null]
    .filter(Boolean)[0];
  const when =
    event.start_time ||
    (event.starts_at
      ? new Date(event.starts_at).toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : event.date || "");
  const miles =
    event.distance_miles != null && Number.isFinite(Number(event.distance_miles))
      ? `${Number(event.distance_miles)} mi`
      : null;
  const href = event.href || (event.slug ? `/events/${encodeURIComponent(String(event.slug))}` : null);

  const inner = (
    <>
      <div style={styles.cardTitle}>{event.name || "Event"}</div>
      <p style={styles.cardMeta}>{[when, where, miles].filter(Boolean).join(" · ")}</p>
      {event.age_requirement_label ? (
        <p style={styles.cardHint}>{event.age_requirement_label}</p>
      ) : null}
    </>
  );

  if (!href) {
    return (
      <li style={styles.card} data-testid="events-browse-item">
        {inner}
      </li>
    );
  }

  return (
    <li style={styles.card} data-testid="events-browse-item">
      <Link to={href} style={styles.cardLink}>
        {inner}
      </Link>
    </li>
  );
}

export default function EventsBrowsePage() {
  const { isAuthenticated } = useConsumer();
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, source: "default" });
  const [events, setEvents] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: "device",
          });
        },
        () => {
          if (!cancelled) setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, source: "default" });
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchPublicEventsNear(coords.lat, coords.lng, { radiusMiles: 30, limit: 24 })
      .then((data) => {
        if (cancelled) return;
        setEvents(Array.isArray(data?.events) ? data.events : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setEvents([]);
          setError(err?.message || "Could not load events");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMine([]);
      return undefined;
    }
    let cancelled = false;
    listMyVenueEvents()
      .then((data) => {
        if (!cancelled) setMine(Array.isArray(data?.events) ? data.events : []);
      })
      .catch(() => {
        if (!cancelled) setMine([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const { today, upcoming } = useMemo(
    () => splitEventsByLocalDay(events, new Date()),
    [events]
  );

  return (
    <>
      <StickyPageHeader title="Events" />
      <main style={styles.main} data-testid="events-browse-page">
        <p style={styles.lead}>
          Dining events at restaurants and venues near you.
          {coords.source === "device" ? "" : " Showing Los Angeles area until location is available."}
        </p>

        {isAuthenticated && mine.length > 0 ? (
          <section style={styles.section} data-testid="events-browse-mine">
            <h2 style={styles.sectionTitle}>Your events</h2>
            <ul style={styles.list}>
              {mine.map((event) => (
                <EventCard key={event.id || event.slug} event={event} />
              ))}
            </ul>
          </section>
        ) : null}

        <section style={styles.section} data-testid="events-browse-nearby">
          <h2 style={styles.sectionTitle}>Near you</h2>
          {loading ? <p style={styles.muted}>Loading events…</p> : null}
          {error ? <p style={styles.error}>{error}</p> : null}
          {!loading && !error && events.length === 0 ? (
            <p style={styles.muted}>No published events nearby yet. Check back soon.</p>
          ) : null}
          {!loading && today.length > 0 ? (
            <>
              <div style={styles.subTitle}>Today</div>
              <ul style={styles.list}>
                {today.map((event) => (
                  <EventCard key={event.id || event.slug} event={event} />
                ))}
              </ul>
            </>
          ) : null}
          {!loading && upcoming.length > 0 ? (
            <>
              <div style={styles.subTitle}>Upcoming</div>
              <ul style={styles.list}>
                {upcoming.map((event) => (
                  <EventCard key={event.id || event.slug} event={event} />
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </main>
      <BottomNav />
    </>
  );
}

const styles = {
  main: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "12px 16px calc(var(--bottom-nav-h, 72px) + 24px)",
    fontFamily: "Inter, Arial, sans-serif",
  },
  lead: { margin: "0 0 16px", fontSize: 14, color: "#4b5563", lineHeight: 1.45 },
  section: { marginBottom: 24 },
  sectionTitle: { margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#0B0F0C" },
  subTitle: { margin: "12px 0 6px", fontSize: 13, fontWeight: 800, color: "#374151" },
  list: { listStyle: "none", margin: 0, padding: 0 },
  card: {
    margin: 0,
    padding: 0,
    borderTop: "1px solid #e5e7eb",
  },
  cardLink: { display: "block", padding: "12px 0", color: "inherit", textDecoration: "none" },
  cardTitle: { fontSize: 15, fontWeight: 800, color: "#111827", lineHeight: 1.35 },
  cardMeta: { margin: "4px 0 0", fontSize: 13, color: "#4b5563", lineHeight: 1.4 },
  cardHint: { margin: "2px 0 0", fontSize: 12, color: "#6b7280" },
  muted: { fontSize: 13, color: "#6b7280", margin: "8px 0" },
  error: { fontSize: 13, color: "#b91c1c", margin: "8px 0" },
};
