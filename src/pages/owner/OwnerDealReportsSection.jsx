import React, { useCallback, useEffect, useState } from "react";
import { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  extendOwnerDealReport,
  linkOwnerDealReportDish,
  linkOwnerDealReportRestaurant,
  listOwnerDealReports,
  listOwnerUnlistedDealReports,
  respondOwnerDealReport,
} from "../../lib/ownerApi.js";

/**
 * Restaurant Manager → Deals → Diner reports (plan 78, Andre 2026-11-27).
 * Informational use only: a diner report is never a deal and is never charged. The restaurant can
 * Extend the clip date, say Wrong info or Ended, or "Create my deal" (the normal deal editor; the
 * new deal id is then sent as response made_own_deal). Reports that typed this restaurant's name
 * before it was on Menuply can be linked here. CK decides every write.
 */

const STATUS_LABEL = {
  showing: "Showing",
  ended: "Ended",
  hidden: "Hidden",
};
const ENDED_LABEL = {
  ran_out: "14 days ran out",
  expired_marks: "3 diners marked it expired",
  owner_ended: "You ended it",
  clip_removed: "Clip removed",
  moderation: "Removed by Menuply",
};
const RESPONSE_LABEL = {
  wrong_info: "You said: wrong info",
  ended: "You said: deal ended",
  made_own_deal: "You made your own deal",
};

function shortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ymd(value) {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function plusDays(value, days) {
  const d = value ? new Date(value) : new Date();
  const base = Number.isNaN(d.getTime()) || d.getTime() < Date.now() ? new Date() : d;
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function btn(variant = "ghost") {
  return {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: variant === "primary" ? "none" : `1px solid ${OWNER_COLORS.line}`,
    background: variant === "primary" ? OWNER_COLORS.accent : "#fff",
    color: variant === "primary" ? "#fff" : OWNER_COLORS.ink || "#0f172a",
  };
}

const looseName = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/** A typed place name that looks like this restaurant (for "Link to this restaurant"). */
export function unlistedReportMatches(report, restaurantName) {
  const a = looseName(report?.place_name || report?.restaurant_name);
  const b = looseName(restaurantName);
  if (!a || !b || a.length < 3 || b.length < 3) return false;
  return a.includes(b) || b.includes(a);
}

function ReportRow({ report, menu, busy, onAction, onCreateDeal }) {
  const [extendTo, setExtendTo] = useState(() => plusDays(report.show_until, 14));
  const [dishId, setDishId] = useState("");
  const showing = report.showing === true;
  const statusText = report.status === "ended" ? ENDED_LABEL[report.ended_reason] || "Ended" : STATUS_LABEL[report.status] || report.status;

  return (
    <div
      style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: 12, display: "grid", gap: 8 }}
      data-testid="owner-deal-report-row"
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {report.photo_url ? (
          <img src={report.photo_url} alt="" style={{ width: 56, height: 72, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
        ) : null}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{report.dish_name || "Deal report"}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
            User Reported · Reported {shortDate(report.reported_at)}
            {report.reporter_name ? ` by ${report.reporter_name}` : ""}
          </div>
          {report.description ? <div style={{ fontSize: 13, marginTop: 4 }}>{report.description}</div> : null}
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }} data-testid="owner-deal-report-status">
            {statusText}
            {showing ? ` until ${shortDate(report.show_until)}` : ""}
            {report.owner_response && report.owner_response !== "none" ? ` · ${RESPONSE_LABEL[report.owner_response] || report.owner_response}` : ""}
            {Number(report.expired_marks) > 0 ? ` · ${report.expired_marks} of 3 expired marks` : ""}
            {Number(report.wrong_info_marks) > 0 ? ` · ${report.wrong_info_marks} said wrong info` : ""}
            {report.last_still_on_at ? ` · still on ${shortDate(report.last_still_on_at)}` : ""}
          </div>
        </div>
      </div>

      {report.status !== "hidden" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={extendTo}
            min={ymd()}
            onChange={(e) => setExtendTo(e.target.value)}
            style={{ padding: "5px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 12 }}
            aria-label="Show until"
            data-testid="owner-deal-report-extend-date"
          />
          <button
            type="button"
            disabled={busy || !extendTo}
            style={btn()}
            data-testid="owner-deal-report-extend"
            onClick={() => onAction(report, "extend", { showUntil: `${extendTo}T23:59:00` })}
          >
            {showing ? "Extend" : "Show again until"}
          </button>
          {showing ? (
            <button type="button" disabled={busy} style={btn()} data-testid="owner-deal-report-ended" onClick={() => onAction(report, "ended")}>
              Deal ended
            </button>
          ) : null}
          <button type="button" disabled={busy} style={btn()} data-testid="owner-deal-report-wrong" onClick={() => onAction(report, "wrong_info")}>
            Wrong info
          </button>
          {report.owner_response !== "made_own_deal" ? (
            <button type="button" disabled={busy} style={btn("primary")} data-testid="owner-deal-report-create-deal" onClick={() => onCreateDeal(report)}>
              Create my deal
            </button>
          ) : null}
        </div>
      ) : null}

      {!report.dish_listed && menu.items.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Dish not on the menu yet. Link it:</span>
          <select
            value={dishId}
            onChange={(e) => setDishId(e.target.value)}
            style={{ padding: "5px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 12, maxWidth: 240 }}
            data-testid="owner-deal-report-dish-select"
          >
            <option value="">Pick a dish</option>
            {menu.items.map((i) => (
              <option key={i.id} value={String(i.id)}>
                {i.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !dishId}
            style={btn()}
            data-testid="owner-deal-report-link-dish"
            onClick={() => onAction(report, "link_dish", { menuItemId: Number(dishId) })}
          >
            Link dish
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function OwnerDealReportsSection({ restaurantId, restaurantName = "", menu, reloadKey = 0, onCreateDeal }) {
  const rid = Number(restaurantId) || null;
  const [reports, setReports] = useState([]);
  const [unlisted, setUnlisted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    setError("");
    try {
      const [mine, typed] = await Promise.all([
        listOwnerDealReports(rid),
        listOwnerUnlistedDealReports().catch(() => ({ deal_reports: [] })),
      ]);
      setReports(Array.isArray(mine?.deal_reports) ? mine.deal_reports : []);
      setUnlisted(Array.isArray(typed?.deal_reports) ? typed.deal_reports : []);
      setUnavailable(false);
    } catch (err) {
      // 503 deal_reports_unavailable: table not live yet → hide the section quietly.
      if (err?.status === 503) setUnavailable(true);
      else setError(err.message || "Unable to load diner reports");
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => {
    setReports([]);
    setUnlisted([]);
    setNotice("");
    load();
  }, [load, reloadKey]);

  async function onAction(report, action, extra = {}) {
    const id = report.deal_report_id;
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      let res;
      if (action === "extend") res = await extendOwnerDealReport(id, extra.showUntil);
      else if (action === "ended" || action === "wrong_info") res = await respondOwnerDealReport(id, action);
      else if (action === "link_dish") res = await linkOwnerDealReportDish(id, extra.menuItemId, menu.source);
      else if (action === "link_restaurant") res = await linkOwnerDealReportRestaurant(id, rid);
      if (res?.held) setNotice(res.message || "Menuply is checking this one.");
      else
        setNotice(
          action === "extend"
            ? "Report date moved."
            : action === "ended"
              ? "Report ended. It no longer shows on Deals."
              : action === "wrong_info"
                ? "Report hidden as wrong info."
                : action === "link_dish"
                  ? "Dish linked."
                  : "Report linked to this restaurant."
        );
      await load();
    } catch (err) {
      setError(err.message || "That didn't go through");
    } finally {
      setBusyId(null);
    }
  }

  if (!rid || unavailable) return null;
  const typedMatches = unlisted.filter((r) => unlistedReportMatches(r, restaurantName));

  return (
    <PageCard style={{ padding: 18, marginBottom: 16 }}>
      <div data-testid="owner-deal-reports">
        <SectionTitle
          title="Diner reports"
          subtitle="Deals diners saw here and posted with a clip. Informational only: they show as “User Reported · Subject to restaurant confirmation” and are never charged. Each runs 14 days."
        />
        {notice ? <div style={{ color: "#166534", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{notice}</div> : null}
        {error ? <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{error}</div> : null}
        {loading && !reports.length ? (
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading diner reports…</div>
        ) : !reports.length ? (
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted }} data-testid="owner-deal-reports-empty">
            No diner reports for this restaurant.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {reports.map((r) => (
              <ReportRow
                key={r.deal_report_id}
                report={r}
                menu={menu}
                busy={busyId === r.deal_report_id}
                onAction={onAction}
                onCreateDeal={onCreateDeal}
              />
            ))}
          </div>
        )}

        {typedMatches.length ? (
          <div style={{ marginTop: 16, display: "grid", gap: 8 }} data-testid="owner-deal-reports-unlisted">
            <div style={{ fontSize: 13, fontWeight: 800 }}>Reports that typed a similar restaurant name</div>
            {typedMatches.map((r) => (
              <div
                key={r.deal_report_id}
                style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}
                data-testid="owner-deal-report-unlisted-row"
              >
                <span>
                  “{r.place_name || r.restaurant_name}”
                  {r.city ? ` · ${r.city}${r.state ? `, ${r.state}` : ""}` : ""}
                  {r.dish_name ? ` · ${r.dish_name}` : ""} · {shortDate(r.reported_at)}
                </span>
                <button
                  type="button"
                  disabled={busyId === r.deal_report_id}
                  style={btn()}
                  data-testid="owner-deal-report-link-restaurant"
                  onClick={() => onAction(r, "link_restaurant")}
                >
                  Link to this restaurant
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </PageCard>
  );
}
