import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import { getOwnerDinerDetail } from "../../lib/ownerApi.js";
import {
  DINER_INTERVAL_LABELS,
  DINER_INTERVAL_OPTIONS,
  displayDinerCount,
} from "./diners/dinerMetricDisplay.js";

/**
 * /owner/diners/:dinerId: the admin diner profile (Diner Intelligence Stage 1, plan 39). It was a modal on
 * /owner/diners, so nothing could link to it. Read-only, Owner only (OwnerRoute + requireOwnerAuth on the API).
 */

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function HubSection({ title, items, emptyLabel }) {
  return (
    <section style={{ marginTop: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 8 }}>{title}</div>
      {!items?.length ? (
        <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{emptyLabel}</div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {items.map((item, idx) => (
            <li
              key={`${item.kind || item.type || "item"}-${item.created_at || idx}`}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>{item.title || "—"}</div>
              {item.subtitle ? (
                <div style={{ marginTop: 4, fontSize: 12, color: OWNER_COLORS.muted }}>{item.subtitle}</div>
              ) : null}
              {item.eaten_on || item.event_date || item.plan_date ? (
                <div style={{ marginTop: 4, fontSize: 11, color: OWNER_COLORS.muted }}>
                  {item.eaten_on || item.event_date || item.plan_date}
                </div>
              ) : null}
              {item.created_at ? (
                <div style={{ marginTop: 4, fontSize: 11, color: OWNER_COLORS.muted }}>
                  {formatDateTime(item.created_at)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const SUMMARY_ROWS = [
  ["Posts: eating at", "im_eating_at"],
  ["Posts: what I ate", "what_i_ate_today"],
  ["Wish List", "want_to_eat"],
  ["Plans: events", "social_events"],
  ["Invites sent", "invites_sent"],
  ["Clips", "video_uploads"],
  ["Connects", "accepted_connects", { lifetimeOnly: true }],
];

function SummaryGrid({ summary, intervalLabel }) {
  if (!summary) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
        marginTop: 16,
      }}
      data-testid="diner-hub-summary-grid"
    >
      {SUMMARY_ROWS.map(([label, key, opts = {}]) => {
        const unavailable = summary.status?.[key] === "unavailable";
        return (
          <div
            key={key}
            title={unavailable ? "Couldn't be counted just now. Not the same as 0." : undefined}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${OWNER_COLORS.line}`,
              background: "#faf7f4",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted }}>{label}</div>
            {!opts.lifetimeOnly ? (
              <div style={{ marginTop: 4, fontSize: 12, color: OWNER_COLORS.ink }}>
                {intervalLabel}: <strong>{displayDinerCount(summary.interval?.[key])}</strong>
              </div>
            ) : null}
            <div style={{ marginTop: 2, fontSize: 12, color: OWNER_COLORS.ink }}>
              Lifetime: <strong>{displayDinerCount(summary.lifetime?.[key])}</strong>
            </div>
            {unavailable ? <div style={{ marginTop: 4, fontSize: 11, color: "#9f1239" }}>Unavailable</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function IntervalPicker({ interval, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>Activity window</span>
      {DINER_INTERVAL_OPTIONS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          data-testid={`diner-profile-interval-${key}`}
          aria-pressed={interval === key}
          onClick={() => onChange(key)}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            // Selected chip = dark fill + white text; never a green pill (Andre 2026-11-06).
                border: `1px solid ${interval === key ? OWNER_COLORS.ink : OWNER_COLORS.line}`,
            background: interval === key ? OWNER_COLORS.ink : "#fff",
            color: interval === key ? "#fff" : OWNER_COLORS.ink,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function OwnerDinerProfile() {
  const { dinerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("interval");
  const interval = DINER_INTERVAL_LABELS[requested] ? requested : "7d";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dinerId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    getOwnerDinerDetail(dinerId, { interval })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setError(err?.status === 404 ? "No diner with this id." : "This diner profile couldn't be loaded just now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dinerId, interval]);

  const changeInterval = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === "7d") params.delete("interval");
    else params.set("interval", next);
    setSearchParams(params, { replace: true });
  };

  const identity = data?.identity;
  const intervalLabel = DINER_INTERVAL_LABELS[interval] || interval;

  return (
    <OwnerLayout title="Diner profile">
      <div style={{ marginBottom: 12 }}>
        <Link
          to={interval === "7d" ? "/owner/diners" : `/owner/diners?interval=${interval}`}
          data-testid="diner-profile-back"
          style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}
        >
          ← All diners
        </Link>
      </div>

      <div data-testid="owner-diner-profile">
        <PageCard style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
            {identity?.avatar_url ? (
              <img
                src={identity.avatar_url}
                alt=""
                width={56}
                height={56}
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `1px solid ${OWNER_COLORS.line}` }}
              />
            ) : null}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: OWNER_COLORS.ink }}>
                {loading && !identity ? "Loading…" : identity?.name || identity?.email || "Diner"}
              </div>
              {identity?.email ? (
                <div style={{ marginTop: 4, fontSize: 13, color: OWNER_COLORS.muted }}>{identity.email}</div>
              ) : null}
              {identity ? (
                <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
                  {identity.status || "—"}
                  {identity.geographic_market ? ` · ${identity.geographic_market}` : ""}
                  {identity.referral_source_label ? ` · ${identity.referral_source_label}` : ""}
                  {identity.opened_at ? ` · Joined ${formatDateTime(identity.opened_at)}` : ""}
                </div>
              ) : null}
              {identity?.is_test ? (
                <div data-testid="diner-profile-test-badge" style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#92400e" }}>
                  Test diner: left out of every diner number.
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <IntervalPicker interval={interval} onChange={changeInterval} />
            {data?.from && data?.to ? (
              <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
                {data.from} through {data.to} (Los Angeles days)
              </div>
            ) : null}
          </div>

          {error ? <div style={{ marginTop: 14, color: "#9f1239", fontSize: 13 }}>{error}</div> : null}

          {!error && data ? (
            <>
              {identity?.diner_about ? (
                <section style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>About</div>
                  <div style={{ fontSize: 13, color: OWNER_COLORS.ink, lineHeight: 1.5 }}>{identity.diner_about}</div>
                </section>
              ) : null}

              <SummaryGrid summary={data.summary} intervalLabel={intervalLabel} />

              <HubSection title="Posts: eating at" items={data.hub?.recent_eating} emptyLabel="No eating-at posts." />
              <HubSection title="Posts: what I ate" items={data.hub?.what_i_ate} emptyLabel="No what-I-ate posts." />
              <HubSection title="Wish List" items={data.hub?.want_to_eat} emptyLabel="Nothing on the Wish List." />
              <HubSection title="Plans: events" items={data.hub?.events} emptyLabel="No events." />
              <HubSection title="Plans: group plans" items={data.hub?.plans} emptyLabel="No group plans." />

              <section style={{ marginTop: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 8 }}>Recent activity</div>
                {!data.recent_activity?.length ? (
                  <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>No recent activity.</div>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                    {data.recent_activity.map((item, idx) => (
                      <li
                        key={`${item.type}-${item.created_at || idx}`}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1px solid ${OWNER_COLORS.line}`,
                          background: "#fff",
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase" }}>
                          {item.type?.replace(/_/g, " ") || "activity"}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700 }}>{item.title}</div>
                        {item.subtitle ? (
                          <div style={{ marginTop: 4, fontSize: 12, color: OWNER_COLORS.muted }}>{item.subtitle}</div>
                        ) : null}
                        <div style={{ marginTop: 4, fontSize: 11, color: OWNER_COLORS.muted }}>{formatDateTime(item.created_at)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </PageCard>
      </div>
    </OwnerLayout>
  );
}
