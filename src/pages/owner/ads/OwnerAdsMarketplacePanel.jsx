/**
 * Owner > Ads > Marketplace (plan 22 Phase 4): the cluster's launch date, the
 * monthly users figure used for prices after the early-bird window, and paid
 * bookings (attach the creative, pause or resume).
 * Backend: /api/owner/ads/bookings, /clusters/:id/launch, /clusters/:id/mau.
 */
import React, { useCallback, useEffect, useState } from "react";
import { EmptyState, PageCard, SectionTitle, OWNER_COLORS } from "../OwnerLayout.jsx";
import {
  attachOwnerBookingCreative,
  listOwnerAdBookings,
  setOwnerBookingAutoRenew,
  setOwnerBookingPaused,
  setOwnerClusterLaunch,
  setOwnerClusterMau,
} from "../../../lib/venueApi.js";
import { formatUsd, termLabel } from "../../../lib/adMarketplaceApi.js";

const STATUS = {
  awaiting_creative: { label: "Needs artwork", bg: "#fef3c7", fg: "#92400e" },
  waiting_for_launch: { label: "Waits for launch date", bg: "#f3f4f6", fg: "#4b5563" },
  scheduled: { label: "Scheduled", bg: "#dbeafe", fg: "#1e40af" },
  delivering: { label: "Showing now", bg: "#dcfce7", fg: "#166534" },
  paused: { label: "Paused", bg: "#fef3c7", fg: "#92400e" },
  ended: { label: "Ended", bg: "#f3f4f6", fg: "#4b5563" },
  refunded: { label: "Refunded", bg: "#fee2e2", fg: "#991b1b" },
};

const inputStyle = {
  padding: 8,
  borderRadius: 8,
  border: `1px solid ${OWNER_COLORS.line}`,
  font: "inherit",
  boxSizing: "border-box",
};
const labelStyle = { display: "grid", gap: 4, fontSize: 13, color: OWNER_COLORS.ink, fontWeight: 600 };
const pill = (primary) => ({
  border: primary ? "none" : `1px solid ${OWNER_COLORS.line}`,
  background: primary ? OWNER_COLORS.accent : "#fff",
  color: primary ? "#fff" : OWNER_COLORS.ink,
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: 700,
  cursor: "pointer",
  font: "inherit",
  fontSize: 13,
});

function shortDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusPill({ status }) {
  const s = STATUS[status] || { label: status, bg: "#f3f4f6", fg: "#4b5563" };
  return (
    <span style={{ background: s.bg, color: s.fg, borderRadius: 999, padding: "2px 9px", fontSize: 12, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

export default function MarketplacePanel({ detail, busy, run }) {
  const { cluster, slots = [] } = detail;
  const [bookings, setBookings] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [launchDate, setLaunchDate] = useState(cluster.launch_date || "");
  const [mau, setMau] = useState(cluster.ad_mau != null ? String(cluster.ad_mau) : "");
  const [mauAsOf, setMauAsOf] = useState(cluster.ad_mau_as_of || "");
  // The parent keys this panel by cluster id, so switching clusters starts fresh.

  const reload = useCallback(
    () =>
      listOwnerAdBookings(cluster.id).then(
        (data) => {
          setLoadError("");
          setBookings(data.bookings || []);
        },
        (err) => {
          setLoadError(err.message || "Couldn't load bookings");
          setBookings([]);
        }
      ),
    [cluster.id]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  async function act(work, message) {
    const result = await run(work, message);
    await reload();
    return result;
  }

  const adsBySpot = new Map(slots.map((s) => [Number(s.id), s.advertisements || []]));
  const forSale = slots.filter((s) => s.active && s.purchasable).length;

  return (
    <PageCard style={{ padding: 20 }}>
      <SectionTitle
        title="Marketplace"
        subtitle={`${forSale} spot${forSale === 1 ? "" : "s"} open for purchase on /advertise. Paid ads show only after launch day.`}
        action={
          cluster.slug ? (
            <a href={`/advertise?cluster=${encodeURIComponent(cluster.slug)}`} target="_blank" rel="noopener noreferrer" style={{ ...pill(false), textDecoration: "none" }}>
              View /advertise
            </a>
          ) : null
        }
      />

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        <form
          style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
          onSubmit={(e) => {
            e.preventDefault();
            act(
              () => setOwnerClusterLaunch(cluster.id, launchDate),
              (r) =>
                `Launch day set to ${r?.launch_date}. ${r?.bookings_moved || 0} paid booking${r?.bookings_moved === 1 ? "" : "s"} moved with it.`
            );
          }}
        >
          <label style={labelStyle}>
            Launch day
            <input type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} style={inputStyle} required />
          </label>
          <button type="submit" style={pill(true)} disabled={busy || !launchDate || launchDate === cluster.launch_date}>
            Save
          </button>
        </form>

        <form
          style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}
          onSubmit={(e) => {
            e.preventDefault();
            act(
              () => setOwnerClusterMau(cluster.id, mau === "" ? null : Number(mau), mauAsOf),
              mau === "" ? "Monthly users cleared." : "Monthly users saved."
            );
          }}
        >
          <label style={labelStyle}>
            Monthly users
            <input
              type="number"
              min="0"
              step="1"
              value={mau}
              onChange={(e) => setMau(e.target.value)}
              style={{ ...inputStyle, width: 130 }}
              placeholder="Not set"
            />
          </label>
          <label style={labelStyle}>
            Counted on
            <input type="date" value={mauAsOf} onChange={(e) => setMauAsOf(e.target.value)} style={inputStyle} />
          </label>
          <button type="submit" style={pill(true)} disabled={busy}>
            Save
          </button>
        </form>
      </div>
      <p style={{ fontSize: 12, color: OWNER_COLORS.muted, margin: "8px 0 0" }}>
        Moving launch day moves paid bookings that haven't started (same length) and their 60-day price lock. It can't move
        after launch. Monthly users picks the price tier once the 60-day early-bird window ends; until it's set, nothing
        is for sale then.
      </p>

      <h3 style={{ fontSize: 15, margin: "20px 0 8px", color: OWNER_COLORS.ink }}>Paid bookings</h3>
      {loadError ? <div role="alert" style={{ color: "#b91c1c", fontWeight: 600 }}>{loadError}</div> : null}
      {bookings === null ? (
        <EmptyState>Loading bookings…</EmptyState>
      ) : bookings.length === 0 ? (
        <EmptyState>No paid bookings yet.</EmptyState>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: OWNER_COLORS.muted, fontSize: 12 }}>
                <th style={{ padding: "6px 8px" }}>Restaurant</th>
                <th style={{ padding: "6px 8px" }}>Spot</th>
                <th style={{ padding: "6px 8px" }}>Runs</th>
                <th style={{ padding: "6px 8px" }}>Paid</th>
                <th style={{ padding: "6px 8px" }}>Status</th>
                <th style={{ padding: "6px 8px" }}>Artwork</th>
                <th style={{ padding: "6px 8px" }}>Renews</th>
                <th style={{ padding: "6px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                // Only the buyer's own ads (never Menuply house banners) can fill a paid booking.
                const ads = (adsBySpot.get(Number(b.spot.inventory_id)) || []).filter(
                  (ad) =>
                    ad.advertiser_type !== "house" &&
                    (ad.restaurant_id == null || !b.restaurant || Number(ad.restaurant_id) === Number(b.restaurant.id))
                );
                const running = b.status === "confirmed" && b.display_status !== "ended";
                return (
                  <tr key={b.booking_id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{b.restaurant?.name || "—"}</td>
                    <td style={{ padding: 8 }}>
                      {b.spot.name}
                      <div style={{ color: OWNER_COLORS.muted, fontSize: 11 }}>{b.spot.spot_id}</div>
                    </td>
                    <td style={{ padding: 8 }}>
                      {termLabel(b.term.period, b.term.count)}
                      <div style={{ color: OWNER_COLORS.muted, fontSize: 11 }}>
                        {b.term.starts_at ? `${shortDate(b.term.starts_at)} – ${shortDate(b.term.ends_at)}` : "Starts on launch day"}
                      </div>
                    </td>
                    <td style={{ padding: 8 }}>{formatUsd(b.price_cents)}</td>
                    <td style={{ padding: 8 }}>
                      <StatusPill status={b.display_status} />
                    </td>
                    <td style={{ padding: 8 }}>
                      {running ? (
                        <select
                          aria-label={`Artwork for booking ${b.booking_id}`}
                          value={b.advertisement_id || ""}
                          disabled={busy}
                          style={{ ...inputStyle, padding: 6, maxWidth: 200 }}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            if (id) act(() => attachOwnerBookingCreative(b.booking_id, id), "Artwork attached.");
                          }}
                        >
                          <option value="">{ads.length ? "Pick their ad on this spot" : "Add their ad to this spot first"}</option>
                          {ads.map((ad) => (
                            <option key={ad.id} value={ad.id}>
                              {ad.name}
                            </option>
                          ))}
                        </select>
                      ) : b.advertisement_id ? (
                        `Ad #${b.advertisement_id}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: 8 }}>
                      {running ? (
                        <button
                          type="button"
                          style={pill(Boolean(b.renewal?.auto_renew))}
                          disabled={busy}
                          aria-label={`Auto-renew for booking ${b.booking_id}`}
                          onClick={() =>
                            act(
                              () => setOwnerBookingAutoRenew(b.booking_id, !b.renewal?.auto_renew),
                              b.renewal?.auto_renew ? "Auto-renew turned off." : "Auto-renew turned on."
                            )
                          }
                        >
                          {b.renewal?.auto_renew ? "On" : "Off"}
                        </button>
                      ) : (
                        "—"
                      )}
                      {running && b.renewal?.notice_sent_at ? (
                        <div style={{ color: OWNER_COLORS.muted, fontSize: 11 }}>Notice sent {shortDate(b.renewal.notice_sent_at)}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: 8 }}>
                      {running ? (
                        <button
                          type="button"
                          style={pill(false)}
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => setOwnerBookingPaused(b.booking_id, b.display_status !== "paused"),
                              b.display_status === "paused" ? "Booking resumed." : "Booking paused."
                            )
                          }
                        >
                          {b.display_status === "paused" ? "Resume" : "Pause"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageCard>
  );
}
