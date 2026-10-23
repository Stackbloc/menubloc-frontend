import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import { listOwnerBots } from "../../lib/ownerApi.js";
import {
  SCHEDULED_BOTS,
  STATUS_LABELS,
  STATUS_TONES,
  formatDateTime,
  scheduleSummary,
} from "./ownerBotFormat.js";

/**
 * Owner → Bots: one place for every bot.
 *   On-demand: Menubot (find + import menus), Photo Bot (import dish photos),
 *              Franchise Bot (add a chain's stores from a pasted list)
 *   Scheduled: Nutribot (nutrition), Language Bot (translations)
 */

const ON_DEMAND_BOTS = [
  {
    key: "menubot",
    name: "Menubot",
    path: "/owner/menubot",
    blurb: "Finds a restaurant's menu online or from photos/PDFs and adds it for review.",
  },
  {
    key: "photo_bot",
    name: "Photo Bot",
    path: "/owner/photo-bot",
    blurb: "Copies dish photos from a restaurant's online ordering site into Menu Manager.",
  },
  {
    key: "franchise_bot",
    name: "Franchise Bot",
    path: "/owner/bots/franchise-bot",
    blurb: "Paste a chain's store list; it fills in addresses from the official store locator and adds the stores with the chain menu.",
  },
  {
    key: "location_bot",
    name: "Location Bot",
    path: "/owner/bots/location-bot",
    blurb: "Paste a chain's locations (e.g. Google Maps results); it updates phone, address, map pin and 24-hour hours on the stores we have, and adds missing ones.",
  },
];

const mutedStyle = { color: OWNER_COLORS.muted, fontSize: 13 };

function Pill({ status }) {
  const tone = STATUS_TONES[status] || STATUS_TONES.completed_no_writes;
  return (
    <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: tone.bg, color: tone.fg }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function BotCard({ to, name, kind, blurb, children }) {
  return (
    <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
      <PageCard style={{ padding: 20, height: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
          <h2 style={{ margin: 0, fontSize: 18, color: OWNER_COLORS.ink }}>{name}</h2>
          <span style={{ ...mutedStyle, fontSize: 12, fontWeight: 700 }}>{kind}</span>
        </div>
        <div style={{ ...mutedStyle, marginTop: 6 }}>{blurb}</div>
        {children ? <div style={{ marginTop: 14, display: "grid", gap: 6, fontSize: 13 }}>{children}</div> : null}
        <div style={{ marginTop: 14, color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13 }}>Open {name} →</div>
      </PageCard>
    </Link>
  );
}

export default function OwnerBots() {
  const [bots, setBots] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listOwnerBots()
      .then((data) => { if (!cancelled) setBots(data.bots || []); })
      .catch((err) => { if (!cancelled) setError(err?.message || "Could not load bot status"); });
    return () => { cancelled = true; };
  }, []);

  const statusByKey = Object.fromEntries((bots || []).map((b) => [b.bot_key, b]));

  return (
    <OwnerLayout title="Bots">
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
        {ON_DEMAND_BOTS.map((b) => (
          <BotCard key={b.key} to={b.path} name={b.name} kind="On demand" blurb={b.blurb} />
        ))}
        {Object.values(SCHEDULED_BOTS).map((b) => {
          const s = statusByKey[b.key];
          return (
            <BotCard key={b.key} to={b.path} name={b.name} kind="Scheduled" blurb={b.blurb}>
              {s ? (
                <>
                  <div>
                    <strong>Last run:</strong>{" "}
                    {s.last_run ? (
                      <>
                        {formatDateTime(s.last_run.started_at)} <Pill status={s.last_run.status} />
                      </>
                    ) : "Never"}
                  </div>
                  <div>
                    <strong>Next run:</strong>{" "}
                    {s.active_run ? "Running now" : s.next_run_at ? formatDateTime(s.next_run_at) : "Not scheduled"}
                  </div>
                  <div style={mutedStyle}>{scheduleSummary(s.schedule)}</div>
                </>
              ) : error ? (
                <div style={{ color: "#b91c1c" }}>{error}</div>
              ) : (
                <div style={mutedStyle}>Loading…</div>
              )}
            </BotCard>
          );
        })}
      </div>
    </OwnerLayout>
  );
}
