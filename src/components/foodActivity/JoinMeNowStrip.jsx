/**
 * Compact Join Me social strip — never ahead of operational/eating signals.
 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listPublicClusterJoinMe,
  listPublicRestaurantJoinMe,
} from "../../lib/joinMeApi.js";

export default function JoinMeNowStrip({ restaurantId = null, clusterId = null }) {
  const [data, setData] = useState({ inviting_count: 0, summary: null, invites: [] });

  useEffect(() => {
    let cancelled = false;
    const load = restaurantId
      ? listPublicRestaurantJoinMe(restaurantId, { limit: 2 })
      : clusterId
        ? listPublicClusterJoinMe(clusterId, { limit: 2 })
        : Promise.resolve({ inviting_count: 0, summary: null, invites: [] });
    load
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setData({ inviting_count: 0, summary: null, invites: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, clusterId]);

  if (!data.inviting_count) return null;

  return (
    <div data-testid="join-me-now-strip" style={styles.wrap}>
      <div style={styles.title}>Join Me</div>
      <p style={styles.summary}>{data.summary}</p>
      <p style={styles.hint}>Social invites — not a count of people eating here.</p>
      <ul style={styles.list}>
        {(data.invites || []).slice(0, 2).map((invite) => (
          <li key={invite.invitation_token}>
            <Link to={`/join-me/${encodeURIComponent(invite.invitation_token)}`} style={styles.link}>
              {invite.headline}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  wrap: {
    margin: "12px 0 4px",
    padding: "10px 0 0",
    borderTop: "1px dashed #e7e5e4",
  },
  title: { fontSize: 12, fontWeight: 800, letterSpacing: 0.4, color: "#78716c" },
  summary: { margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#1c1917" },
  hint: { margin: "2px 0 8px", fontSize: 12, color: "#78716c" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 },
  link: { color: "#166534", fontWeight: 700, textDecoration: "none", fontSize: 14 },
};
