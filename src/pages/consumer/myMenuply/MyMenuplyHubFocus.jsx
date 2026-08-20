/**
 * Selected My Menuply library: Connects, Restaurants, Dishes, or Events.
 */

import { Link } from "react-router-dom";
import { restaurantHref, foodHref } from "./myMenuplyBits.jsx";
import * as s from "./myMenuplyStyles.js";

function formatEventWhen(ev) {
  const raw = ev?.starts_at || ev?.event_date;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function MyMenuplyHubFocus({
  focusId,
  connections = [],
  followed = [],
  liked = [],
  eating = [],
  events = [],
  eventGroups = [],
  viewerUserId = null,
}) {
  if (!focusId) return null;

  return (
    <div style={styles.panel} data-testid={`hub-focus-${focusId}`}>
      {focusId === "connects" ? (
        <ConnectsList connections={connections} viewerUserId={viewerUserId} />
      ) : null}
      {focusId === "restaurants" ? <RestaurantsList followed={followed} /> : null}
      {focusId === "dishes" ? <DishesList liked={liked} eating={eating} /> : null}
      {focusId === "events" ? <EventsList events={events} eventGroups={eventGroups} /> : null}
    </div>
  );
}

function ConnectsList({ connections, viewerUserId }) {
  const rows = connections || [];
  if (!rows.length) {
    return (
      <>
        <h3 style={s.displaySectionTitle}>Connects</h3>
        <p style={s.muted}>No connects yet.</p>
      </>
    );
  }
  return (
    <>
      <div style={styles.head}>
        <h3 style={{ ...s.displaySectionTitle, margin: 0 }}>Connects</h3>
        <Link to="/my-menuply/connections-eating" style={styles.link}>
          See who&apos;s eating
        </Link>
      </div>
      <ul style={styles.list}>
        {rows.map((c) => {
          const peerId = c.peer?.id;
          const name = c.peer?.display_name || "Connect";
          if (!peerId) return null;
          const isSelf = viewerUserId != null && Number(peerId) === Number(viewerUserId);
          return (
            <li key={c.id || peerId}>
              <Link
                to={isSelf ? "/my-menuply" : `/account/connections/${encodeURIComponent(String(peerId))}`}
                style={styles.row}
              >
                <span style={styles.name}>{name}</span>
                <span style={styles.meta}>Open</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function RestaurantsList({ followed }) {
  const rows = followed || [];
  if (!rows.length) {
    return (
      <>
        <h3 style={s.displaySectionTitle}>Restaurants</h3>
        <p style={s.muted}>Follow restaurants from menus or when you log a meal.</p>
      </>
    );
  }
  return (
    <>
      <h3 style={s.displaySectionTitle}>Restaurants</h3>
      <ul style={styles.list}>
        {rows.map((row) => {
          const href = restaurantHref(row);
          return (
            <li key={row.restaurant_id}>
              <Link to={href || "#"} style={styles.row}>
                <span style={styles.name}>{row.restaurant_name}</span>
                <span style={styles.meta}>
                  {[row.city, row.state].filter(Boolean).join(", ") || "Open"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function DishesList({ liked, eating }) {
  const fromLikes = (liked || []).map((row) => ({
    key: `like-${row.menu_item_id}`,
    label: row.item_name || "Dish",
    sub: row.restaurant_name || "",
    href: foodHref(row),
  }));
  const fromDiary = (eating || [])
    .filter((row) => row.menu_item_id || row.food_name)
    .slice(0, 20)
    .map((row) => ({
      key: `eat-${row.entry_id || row.id}`,
      label: row.food_name || row.item_name || "Food",
      sub: row.restaurant_name || (String(row.comment || "").startsWith("Homemade") ? "Homemade" : ""),
      href: foodHref(row),
    }));
  const seen = new Set();
  const rows = [...fromLikes, ...fromDiary].filter((row) => {
    const k = `${row.label}|${row.sub}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (!rows.length) {
    return (
      <>
        <h3 style={s.displaySectionTitle}>Dishes</h3>
        <p style={s.muted}>Saved and logged dishes will show here.</p>
      </>
    );
  }
  return (
    <>
      <h3 style={s.displaySectionTitle}>Dishes</h3>
      <ul style={styles.list}>
        {rows.map((row) => (
          <li key={row.key}>
            {row.href ? (
              <Link to={row.href} style={styles.row}>
                <span style={styles.name}>{row.label}</span>
                <span style={styles.meta}>{row.sub || "Open"}</span>
              </Link>
            ) : (
              <div style={styles.row}>
                <span style={styles.name}>{row.label}</span>
                <span style={styles.meta}>{row.sub || ""}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function EventsList({ events, eventGroups }) {
  const evs = events || [];
  const groups = eventGroups || [];
  if (!evs.length && !groups.length) {
    return (
      <>
        <h3 style={s.displaySectionTitle}>Events</h3>
        <p style={s.muted}>Events you RSVP to will show here.</p>
      </>
    );
  }
  return (
    <>
      <h3 style={s.displaySectionTitle}>Events</h3>
      <ul style={styles.list}>
        {evs.map((ev) => (
          <li key={ev.id || ev.slug}>
            <Link to={`/events/${encodeURIComponent(String(ev.slug))}`} style={styles.row}>
              <span style={styles.name}>{ev.name}</span>
              <span style={styles.meta}>
                {[ev.rsvp_status === "going" ? "Going" : "Interested", formatEventWhen(ev)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
        {groups.map((g) => (
          <li key={g.id || g.slug}>
            <Link to={`/events/groups/${encodeURIComponent(String(g.slug))}`} style={styles.row}>
              <span style={styles.name}>{g.name}</span>
              <span style={styles.meta}>{g.event_name || "Event group"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

const styles = {
  panel: {
    marginTop: 14,
    padding: "16px 14px 12px",
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #d1fae5",
    boxShadow: "0 6px 18px rgba(20, 83, 45, 0.08)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  link: {
    fontSize: 13,
    fontWeight: 700,
    color: "#15803d",
    textDecoration: "none",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 8px",
    textDecoration: "none",
    color: "inherit",
    borderRadius: 10,
  },
  name: {
    fontWeight: 800,
    fontSize: 14,
    color: "#14532d",
  },
  meta: {
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    textAlign: "right",
  },
};
