import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { OWNER_COLORS } from "../OwnerLayout.jsx";
import { getOwnerDinerIntelligence } from "../../../lib/ownerApi.js";
import { timeAgo } from "./liveDisplay.js";
import {
  PROFILE_RANGE_OPTIONS,
  metricCell,
  metricFootnote,
  rangeCaption,
  shortDate,
  tierLabel,
} from "./profileDisplay.js";

/**
 * Diner Intelligence Stage 4 (plan 39): one diner's numbers on /owner/diners/:id.
 * The selected period and lifetime are side by side; "Not tracked", "Unavailable" and tracking gaps (*)
 * are labelled, never shown as 0.
 */

const TONE_COLOR = { value: OWNER_COLORS.ink, zero: OWNER_COLORS.ink, not_tracked: OWNER_COLORS.muted, unavailable: "#9f1239" };

function Chip({ selected, onClick, children, testId }) {
  // Selected chip = dark fill + white text; never a green pill (Andre 2026-11-06).
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${selected ? OWNER_COLORS.ink : OWNER_COLORS.line}`,
        background: selected ? OWNER_COLORS.ink : "#fff",
        color: selected ? "#fff" : OWNER_COLORS.ink,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function ProfileRangePicker({ range, onChange, options = PROFILE_RANGE_OPTIONS, testPrefix = "diner-range" }) {
  const [from, setFrom] = useState(range.from || "");
  const [to, setTo] = useState(range.to || "");
  const [custom, setCustom] = useState(range.key === "custom");
  useEffect(() => {
    setCustom(range.key === "custom");
    if (range.from) setFrom(range.from);
    if (range.to) setTo(range.to);
  }, [range.key, range.from, range.to]);
  const inputStyle = { padding: "6px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>Period</span>
        {options.map(([key, label]) => (
          <Chip
            key={key}
            testId={`${testPrefix}-${key}`}
            selected={key === "custom" ? custom : !custom && range.key === key}
            onClick={() => (key === "custom" ? setCustom(true) : (setCustom(false), onChange({ key })))}
          >
            {label}
          </Chip>
        ))}
      </div>
      {custom ? (
        <form
          style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 10 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (from && to) onChange({ key: "custom", from, to });
          }}
        >
          <label style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            From <input type="date" data-testid={`${testPrefix}-from`} value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            To <input type="date" data-testid={`${testPrefix}-to`} value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
          </label>
          <Chip testId={`${testPrefix}-apply`} selected onClick={() => from && to && onChange({ key: "custom", from, to })}>
            Show
          </Chip>
        </form>
      ) : null}
    </div>
  );
}

function Fact({ label, children, testId }) {
  return (
    <div data-testid={testId} style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: OWNER_COLORS.ink, marginTop: 3, lineHeight: 1.35 }}>{children}</div>
    </div>
  );
}

function Facts({ facts }) {
  if (!facts) return null;
  const tier = facts.tier;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginTop: 16 }} data-testid="diner-facts">
      <Fact label="Registered" testId="diner-fact-registered">{shortDate(facts.registered_at)}</Fact>
      <Fact label="Came from">
        {facts.invited_by ? (
          <>
            Invite from{" "}
            <Link to={`/owner/diners/${facts.invited_by.id}`} style={{ color: OWNER_COLORS.ink }}>
              {facts.invited_by.name || `Diner ${facts.invited_by.id}`}
            </Link>
          </>
        ) : (
          facts.referral_source || facts.signup_source || "Direct"
        )}
      </Fact>
      <Fact label="Last sign-in" testId="diner-fact-last-login">{facts.last_login_at ? timeAgo(facts.last_login_at) : "—"}</Fact>
      <Fact label="Last seen">{facts.last_seen_at ? timeAgo(facts.last_seen_at) : "Not seen since tracking began (Nov 12, 2026)"}</Fact>
      <Fact label="Last meaningful activity" testId="diner-fact-last-activity">
        {facts.last_activity ? `${facts.last_activity.label} · ${timeAgo(facts.last_activity.at)}` : "—"}
      </Fact>
      <Fact label="Network tier" testId="diner-fact-tier">
        {tier ? (
          <>
            {tierLabel(tier.classification)}
            <span style={{ fontWeight: 500, color: OWNER_COLORS.muted, fontSize: 12 }}>
              {" "}
              · NVS {tier.nvs ?? "—"} · as of {shortDate(tier.as_of)}
            </span>
          </>
        ) : facts.tier_status === "ok" ? (
          "Not scored yet"
        ) : (
          "Not tracked"
        )}
      </Fact>
      {facts.is_student ? <Fact label="Student">Verified .edu</Fact> : null}
    </div>
  );
}

function Cell({ metric, field }) {
  const c = metricCell(metric, field);
  return (
    <span style={{ color: TONE_COLOR[c.tone], fontWeight: c.tone === "value" || c.tone === "zero" ? 800 : 600, fontSize: c.tone === "not_tracked" || c.tone === "unavailable" ? 12 : 14 }}>
      {c.text}
      {c.partial ? <span title="Recorded only part of this time" style={{ color: OWNER_COLORS.muted }}>*</span> : null}
    </span>
  );
}

function MetricGroup({ group, metrics, lifetimeOnly, periodLabel }) {
  return (
    <section style={{ marginTop: 18 }} data-testid={`diner-group-${group.key}`}>
      <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>{group.label}</div>
      <div style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: lifetimeOnly ? "1fr 90px" : "1fr 90px 90px",
            gap: 8,
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: OWNER_COLORS.muted,
            background: OWNER_COLORS.page,
          }}
        >
          <span />
          {lifetimeOnly ? null : <span style={{ textAlign: "right" }}>{periodLabel}</span>}
          <span style={{ textAlign: "right" }}>Lifetime</span>
        </div>
        {metrics.map((m) => {
          const foot = metricFootnote(m);
          return (
            <div key={m.key} data-testid={`diner-metric-${m.key}`} data-status={m.status} style={{ padding: "8px 12px", borderTop: `1px solid ${OWNER_COLORS.line}` }}>
              <div style={{ display: "grid", gridTemplateColumns: lifetimeOnly ? "1fr 90px" : "1fr 90px 90px", gap: 8, alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: OWNER_COLORS.ink }}>{m.label}</span>
                {lifetimeOnly ? null : (
                  <span style={{ textAlign: "right" }}>
                    <Cell metric={m} field="period" />
                  </span>
                )}
                <span style={{ textAlign: "right" }}>
                  <Cell metric={m} field="lifetime" />
                </span>
              </div>
              {foot ? <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 3, lineHeight: 1.35 }}>{foot}</div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function History({ history }) {
  if (!history) return null;
  if (history.status !== "ok") {
    return (
      <div style={{ marginTop: 18, fontSize: 12, color: OWNER_COLORS.muted }}>
        Engagement history {history.status === "unavailable" ? "couldn't be read just now." : "isn't recorded on this database."}
      </div>
    );
  }
  const max = Math.max(1, ...history.weeks.map((w) => w.meaningful_days || 0));
  return (
    <section style={{ marginTop: 18 }} data-testid="diner-history">
      <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>Engagement and retention (12 weeks)</div>
      <div style={{ fontSize: 13, color: OWNER_COLORS.ink, marginBottom: 10, lineHeight: 1.5 }}>
        {history.engaged ? "Engaged" : "Not engaged"} in their first 30 days
        {history.engaged_provisional ? " (still inside those 30 days)" : ""}
        {history.engaged_partial ? " *" : ""} ·{" "}
        {history.returning ? "Returning" : "Not returning"} ({history.meaningful_days_last_30} active days in the last 30)
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 70 }}>
        {history.weeks.map((w) => (
          <div
            key={w.week}
            title={
              w.recorded
                ? `Week of ${shortDate(w.week)}: ${w.meaningful_days} days with a meaningful action, ${w.active_days} active days${w.tier ? `, ${tierLabel(w.tier)}` : ""}`
                : `Week of ${shortDate(w.week)}: not recorded`
            }
            style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}
          >
            {w.recorded ? (
              <div style={{ width: "100%", height: `${((w.meaningful_days || 0) / max) * 100}%`, minHeight: 2, background: OWNER_COLORS.ink, borderRadius: "3px 3px 0 0", opacity: w.meaningful_days ? 0.85 : 0.2 }} />
            ) : (
              <div style={{ width: "100%", height: 6, background: "repeating-linear-gradient(45deg, #ddd, #ddd 3px, #fff 3px, #fff 6px)", borderRadius: 2 }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>
        <span>{shortDate(history.weeks[0]?.week)}</span>
        <span>this week</span>
      </div>
      <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>
        Bars = days with a meaningful action each week. Striped = before this diner joined or before tracking began
        {history.since ? ` (${shortDate(history.since)})` : ""}.
      </div>
    </section>
  );
}

export default function DinerIntelligencePanel({ dinerId, range, onRangeChange }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getOwnerDinerIntelligence(dinerId, { range: range.key, from: range.from, to: range.to })
      .then((payload) => !cancelled && setData(payload))
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setError(err?.status === 400 ? err?.message || "That period isn't valid." : "This diner's numbers couldn't be loaded just now.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dinerId, range.key, range.from, range.to]);

  const lifetimeOnly = data?.range === "lifetime";
  const periodLabel = (PROFILE_RANGE_OPTIONS.find(([k]) => k === data?.range) || [])[1] || "Period";
  const anyPartial = data?.metrics?.some((m) => m.lifetime_partial || m.period_partial);

  return (
    <div data-testid="diner-intelligence" style={{ marginTop: 16, opacity: loading && data ? 0.6 : 1 }}>
      <ProfileRangePicker range={range} onChange={onRangeChange} />
      {data ? <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>{rangeCaption(data)}</div> : null}
      {error ? <div style={{ marginTop: 10, color: "#9f1239", fontSize: 13 }}>{error}</div> : null}
      {!data && loading ? <div style={{ marginTop: 10, fontSize: 13, color: OWNER_COLORS.muted }}>Loading this diner's numbers…</div> : null}
      {data ? (
        <>
          <Facts facts={data.facts} />
          {data.groups.map((g) => (
            <MetricGroup
              key={g.key}
              group={g}
              metrics={data.metrics.filter((m) => m.group === g.key)}
              lifetimeOnly={lifetimeOnly}
              periodLabel={periodLabel}
            />
          ))}
          <History history={data.history} />
          <div style={{ marginTop: 12, fontSize: 11, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
            {anyPartial ? "* Only part of this time was recorded; the number may be low. " : ""}
            "Not tracked" = Menuply doesn't record this yet. "Unavailable" = it couldn't be read just now. Neither is a zero.
          </div>
        </>
      ) : null}
    </div>
  );
}
