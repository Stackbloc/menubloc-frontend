import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { getOwnerRestaurantPanel } from "../../lib/ownerApi.js";

/**
 * 2026-11-20 (plan 68 step 3): Owner → Restaurant Management → restaurant panel. READ ONLY.
 * Everything about one restaurant in one place, like the Menu Items dish panel: place, IDs, dishes and
 * menus, hours, Today, sources and recent changes. Edits stay in the Edit form (button at the top).
 * Data: GET /api/owner/restaurants/operations/:id/panel (ownerRestaurantPanelService).
 */

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WROTE = { platform_owner: "Owner portal", operator: "Restaurant", hours_bot: "Hours Bot", menubot: "Menubot", location_bot: "Location Bot", address_bot: "Address Bot", source_visit: "Source visit" };
const BLOCKER = { franchise_hq_record: "Franchise HQ record", inactive: "Inactive", test_fixture: "Test listing", no_coordinates: "No coordinates", no_dishes: "No dishes" };
const MISSING = { hours: "hours", cuisine: "cuisine", coordinates: "coordinates", service: "service modes", website: "website", dishes: "dishes" };
const FIELD = { cuisine: "Cuisine", dine_in: "Dine-in", pickup: "Pickup", delivery: "Delivery", active: "Active", hours: "Hours", today_types: "Today type" };
const ACTION = {
  "restaurant_management.edit": "Edit",
  "restaurant_management.coverage_send": "Sent to a bot",
  "restaurant_management.cluster_check": "Cluster Check",
};

function date(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function host(url) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function OwnerRestaurantPanel({ restaurant, onClose, onEdit }) {
  const id = restaurant.restaurant_id;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setData(null);
    setError("");
    getOwnerRestaurantPanel(id)
      .then((r) => live && setData(r))
      .catch((e) => live && setError(e?.message || "Could not load this restaurant"));
    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const r = data?.restaurant || restaurant;
  const place = data?.place;

  return createPortal(
    <div role="dialog" aria-label={restaurant.restaurant_name} style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{r.restaurant_name}</div>
            <div style={muted}>
              #{id}
              {r.chain_name ? ` · ${r.chain_name}` : ""}
              {[r.city, r.state].filter(Boolean).length ? ` · ${[r.city, r.state].filter(Boolean).join(", ")}` : ""}
            </div>
          </div>
          <button type="button" style={linkBtn} onClick={onClose}>Close</button>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
          <button type="button" style={linkBtn} onClick={onEdit}>Edit</button>
          <Link to={`/owner/menu-items?metro_id=all&restaurant_id=${encodeURIComponent(id)}`} style={linkA}>Dishes ›</Link>
          <Link to={`/owner/restaurant-manager?restaurant=${encodeURIComponent(id)}&section=details`} style={linkA}>Open in Restaurant Manager ›</Link>
          {r.public_url ? <a href={r.public_url} target="_blank" rel="noreferrer" style={linkA}>Public page ↗</a> : null}
        </div>

        {!data ? (
          <div style={{ ...muted, marginTop: 18 }}>{error || "Loading…"}</div>
        ) : (
          <>
            <Section title="Place">
              <Line label="Address">
                {[place.address_line1, place.address_line2].filter(Boolean).join(", ") || <Gap>No street address</Gap>}
                {place.postal_code ? ` ${place.postal_code}` : ""}
              </Line>
              <Line label="Map pin">
                {place.has_pin ? (
                  <a href={`https://www.google.com/maps?q=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" style={linkA}>
                    {place.lat.toFixed(5)}, {place.lng.toFixed(5)} ↗
                  </a>
                ) : (
                  <Gap>No map pin</Gap>
                )}
              </Line>
              <Line label="Phone">{place.phone || "—"}</Line>
              <Line label="Website">
                {place.website_url ? <a href={place.website_url} target="_blank" rel="noreferrer" style={linkA}>{host(place.website_url)} ↗</a> : "—"}
              </Line>
              {place.google_maps_url ? (
                <Line label="Google">
                  <a href={place.google_maps_url} target="_blank" rel="noreferrer" style={linkA}>Google Maps ↗</a>
                </Line>
              ) : null}
              <Line label="Chain">
                {place.chain_name ? `${place.chain_name}${place.store_code ? ` · store ${place.store_code}` : ""}` : "No chain"}
              </Line>
              <Line label="Status">
                {r.active ? "Active" : <Gap>Inactive</Gap>} · {place.claim_status === "claimed" ? `Claimed${place.claimed_at ? ` ${date(place.claimed_at)}` : ""}` : "Unclaimed"}
                {place.is_canonical_parent ? " · Franchise HQ record" : ""}
                {place.is_demo || place.is_fake ? " · Test listing" : ""}
              </Line>
              <Line label="Service">
                {[r.service.dine_in && "Dine-in", r.service.pickup && "Pickup", r.service.delivery && "Delivery"].filter(Boolean).join(", ") || <Gap>None set</Gap>}
              </Line>
              <Line label="Cuisine">{r.cuisine || <Gap>None</Gap>}</Line>
              <Line label="Record">
                Added {date(place.created_at)} · updated {date(place.updated_at)}
                {place.data_origin ? ` · from ${place.data_origin.replace(/_/g, " ")}` : ""}
              </Line>
            </Section>

            <Section title="IDs">
              <Line label="Menuply">#{data.ids.menuply_id}</Line>
              <Line label="Location ID">
                {data.ids.location ? <Mono>{data.ids.location.universal_id}</Mono> : "—"}
                {data.ids.location && data.ids.location.status !== "active" ? ` · ${data.ids.location.status}` : ""}
              </Line>
              {data.ids.brand ? (
                <Line label={data.ids.brand.source === "mle_group" ? "Group ID" : "Brand ID"}>
                  <Mono>{data.ids.brand.universal_id}</Mono>
                  {data.ids.brand.status !== "active" ? ` · ${data.ids.brand.status}` : ""}
                </Line>
              ) : null}
              {data.ids.external.length ? (
                data.ids.external.map((e) => (
                  <Line key={`${e.system}:${e.external_id}`} label={e.system.replace(/_/g, " ")}>
                    {e.url ? <a href={e.url} target="_blank" rel="noreferrer" style={linkA}><Mono>{e.external_id}</Mono> ↗</a> : <Mono>{e.external_id}</Mono>}
                    {e.status ? <span style={muted}> · {e.status}</span> : null}
                  </Line>
                ))
              ) : (
                <Line label="Other IDs">None</Line>
              )}
            </Section>

            <Section title="Dishes and menus">
              <Line label="In Menu Items">
                {data.dishes.ck.toLocaleString()} dish{data.dishes.ck === 1 ? "" : "es"}
                {data.dishes.ck_store_copies ? <span style={muted}> · {data.dishes.ck_store_copies === 1 ? "1 is a chain store copy" : `${data.dishes.ck_store_copies.toLocaleString()} are chain store copies`}</span> : null}
                {data.dishes.ck_without_menu ? <span style={muted}> · {data.dishes.ck_without_menu.toLocaleString()} not on a menu</span> : null}
              </Line>
              {data.dishes.chain != null ? (
                <Line label="Chain menu">{data.dishes.chain.toLocaleString()} chain dish{data.dishes.chain === 1 ? "" : "es"}</Line>
              ) : null}
              {data.menus.length ? (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
                  <tbody>
                    {data.menus.map((m) => (
                      <tr key={m.id}>
                        <td style={td}>
                          <div style={{ fontWeight: 600 }}>{m.name || `Menu ${m.id}`}</div>
                          <div style={muted}>
                            #{m.id}
                            {m.is_primary ? " · main" : ""}
                            {m.is_franchise_canonical ? " · chain's menu" : ""}
                            {m.source_type ? ` · ${m.source_type.replace(/_/g, " ")}` : ""}
                          </div>
                        </td>
                        <td style={td}>{m.published ? "Published" : <span style={{ color: OWNER_COLORS.muted }}>{m.status || "No status"}</span>}</td>
                        <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                          {m.dishes.toLocaleString()} dish{m.dishes === 1 ? "" : "es"}
                          <div style={muted}>{m.published_at ? `published ${date(m.published_at)}` : `updated ${date(m.updated_at)}`}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Line label="Menus"><Gap>No menus</Gap></Line>
              )}
            </Section>

            <Section title="Hours">
              {data.hours.week.every((d) => !d.known) ? (
                <div style={{ fontSize: 13 }}><Gap>No hours</Gap></div>
              ) : (
                data.hours.week.map((d) => (
                  <Line key={d.day_of_week} label={DAY[d.day_of_week]}>
                    {!d.known ? <span style={muted}>Not known</span> : d.closed ? "Closed" : d.spans.map((s) => `${s.opens_at}–${s.closes_at}${s.label ? ` (${s.label})` : ""}`).join(", ")}
                  </Line>
                ))
              )}
              <div style={{ ...muted, marginTop: 6 }}>
                {data.hours.written_by ? `Written by ${WROTE[data.hours.written_by] || data.hours.written_by} ${date(data.hours.written_at)}` : "No record of who wrote the hours"}
                {data.hours.bot_checked_at ? ` · Hours Bot checked ${date(data.hours.bot_checked_at)}${data.hours.bot_outcome ? ` (${data.hours.bot_outcome.replace(/_/g, " ")})` : ""}` : " · Hours Bot hasn't checked it"}
              </div>
            </Section>

            <Section title="Today">
              <Line label="Type">
                {r.today_type.styles.length ? r.today_type.styles.join(", ") : "No type"}
                <span style={muted}>{r.today_type.source === "owner" ? " · set by hand" : r.today_type.source ? ` · from ${String(r.today_type.source).replace(/_/g, " ")}` : ""}</span>
              </Line>
              <Line label="Basics">
                {r.today_basics.ok ? "OK" : <Gap>{r.today_basics.blockers.map((b) => BLOCKER[b] || b).join(", ") || "Not shown"}</Gap>}
              </Line>
              <Line label="Missing">{r.missing.length ? <Gap>{r.missing.map((m) => MISSING[m] || m).join(", ")}</Gap> : "Nothing"}</Line>
              {r.clusters.length ? <Line label="Clusters">{r.clusters.map((c) => c.name).join(", ")}</Line> : null}
            </Section>

            <Section title="Sources">
              {data.sources.length ? (
                data.sources.map((s) => (
                  <Line key={s.id} label={s.kind.replace(/_/g, " ")}>
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ ...linkA, opacity: s.dead ? 0.55 : 1 }}>{s.host || host(s.url)} ↗</a>
                    <span style={muted}>
                      {" "}· found by {WROTE[s.found_by] || s.found_by.replace(/_/g, " ")}
                      {s.dead ? " · dead link" : s.last_ok_at ? ` · worked ${date(s.last_ok_at)}` : " · not checked yet"}
                    </span>
                  </Line>
                ))
              ) : (
                <div style={{ ...muted, fontSize: 13 }}>No saved sources</div>
              )}
            </Section>

            <Section title="Recent changes">
              {data.changes.length ? (
                data.changes.map((c) => (
                  <Line key={`${c.kind}:${c.id}`} label={date(c.at)}>
                    {c.kind === "bulk" ? `Bulk edit #${c.id}${c.undone_at ? " (undone)" : ""}` : ACTION[c.action] || c.action.replace(/^restaurant_management\./, "").replace(/_/g, " ")}
                    {c.fields.length ? `: ${c.fields.map((f) => FIELD[f] || f.replace(/_/g, " ")).join(", ")}` : ""}
                    {c.by ? <span style={muted}> · {c.by}</span> : null}
                  </Line>
                ))
              ) : (
                <div style={{ ...muted, fontSize: 13 }}>No changes made in Restaurant Management yet</div>
              )}
              <div style={{ ...muted, marginTop: 6 }}>Single edits can't be undone here yet; bulk edits can, from Recent bulk edits.</div>
            </Section>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${OWNER_COLORS.line}` }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Line({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, fontSize: 13, padding: "3px 0" }}>
      <div style={{ color: OWNER_COLORS.muted, textTransform: "capitalize" }}>{label}</div>
      <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</div>
    </div>
  );
}

const Gap = ({ children }) => <span style={{ color: "#9f3a22" }}>{children}</span>;
const Mono = ({ children }) => <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>{children}</span>;

const muted = { fontSize: 12, color: OWNER_COLORS.muted };
const linkBtn = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 13 };
const linkA = { color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13, textDecoration: "none" };
const td = { padding: "6px 8px 6px 0", borderTop: `1px solid ${OWNER_COLORS.line}`, fontSize: 13, verticalAlign: "top" };
const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "flex-end", zIndex: 1000 };
const panel = { width: "min(560px, 100%)", height: "100%", overflowY: "auto", background: "#fff", padding: 20, boxShadow: "-8px 0 24px rgba(0,0,0,0.12)", color: OWNER_COLORS.ink, boxSizing: "border-box" };
