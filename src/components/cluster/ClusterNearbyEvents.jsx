/**
 * Cluster landing events — today's and upcoming published venue events
 * within 30 miles. Consumer overview; omit when empty.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchClusterNearbyEvents } from "../../lib/clusterApi.js";
import { getTimezoneForUsState } from "../../lib/timeZoneUtils.js";
import { splitEventsByLocalDay } from "../../lib/clusterDashboardModel.js";

function EventRow({ event }) {
  const where = [event.venue_label, event.restaurant_name].filter(Boolean)[0];
  const when = event.start_time || event.date || null;
  const miles =
    event.distance_miles != null && Number.isFinite(Number(event.distance_miles))
      ? `${Number(event.distance_miles)} mi`
      : null;
  const inner = (
    <>
      <div className="cluster-feed-item-title" style={styles.title}>
        {event.name || "Event"}
      </div>
      <p style={styles.detail}>
        {[when, where, miles].filter(Boolean).join(" · ")}
      </p>
    </>
  );
  return (
    <li data-testid="cluster-event-item" style={styles.row}>
      {event.href || event.slug ? (
        <Link
          to={event.href || `/events/${encodeURIComponent(String(event.slug))}`}
          style={styles.linkWrap}
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}

export default function ClusterNearbyEvents({ cluster }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const slug = cluster?.slug;
  const timeZone = getTimezoneForUsState(cluster?.state);
  const { today, upcoming } = useMemo(
    () => splitEventsByLocalDay(events, new Date(), timeZone),
    [events, timeZone]
  );

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setEvents([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    fetchClusterNearbyEvents(slug, { radiusMiles: 30, limit: 16 })
      .then((data) => {
        if (cancelled) return;
        setEvents(Array.isArray(data?.events) ? data.events : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) return null;
  if (!loading && events.length === 0) return null;

  return (
    <section
      id="cluster-events"
      data-testid="cluster-nearby-events"
      aria-label="Cluster events"
      style={styles.section}
    >
      <div className="cluster-feed-section-label" style={styles.groupLabel}>
        Events nearby
      </div>
      <p style={styles.lead}>Today and coming up within about 30 miles.</p>
      {loading ? <p style={styles.muted}>Loading events…</p> : null}
      {!loading && today.length > 0 ? (
        <div data-testid="cluster-events-today" style={styles.group}>
          <div style={styles.subLabel}>Today</div>
          <ul style={styles.list}>
            {today.map((event) => (
              <EventRow key={event.id || event.slug} event={event} />
            ))}
          </ul>
        </div>
      ) : null}
      {!loading && upcoming.length > 0 ? (
        <div data-testid="cluster-events-upcoming" style={styles.group}>
          <div style={styles.subLabel}>Upcoming</div>
          <ul style={styles.list}>
            {upcoming.map((event) => (
              <EventRow key={event.id || event.slug} event={event} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  section: {
    marginBottom: 18,
    padding: "14px 0 4px",
    borderTop: "1px solid #e5e7eb",
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#0f766e",
    marginBottom: 4,
  },
  lead: {
    margin: "0 0 12px",
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  muted: { fontSize: 13, color: "#6b7280", margin: "0 0 8px" },
  group: { marginBottom: 12 },
  subLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  },
  list: { listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid #e5e7eb" },
  row: { margin: 0, padding: "10px 0", borderBottom: "1px solid #e5e7eb" },
  title: { fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.35 },
  detail: { margin: "3px 0 0", fontSize: 13, color: "#4b5563", lineHeight: 1.4 },
  linkWrap: { color: "inherit", textDecoration: "none", display: "block" },
};
