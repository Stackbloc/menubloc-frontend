import React, { useEffect, useState } from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { getOwnerDinerDetail } from "../../lib/ownerApi.js";

const INTERVAL_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Week",
  "30d": "Month",
  "365d": "Year",
};

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

function SummaryGrid({ summary, intervalLabel }) {
  if (!summary) return null;
  const entries = [
    ["I'm Eating At", summary.interval?.im_eating_at, summary.lifetime?.im_eating_at],
    ["What I Ate", summary.interval?.what_i_ate_today, summary.lifetime?.what_i_ate_today],
    ["Want to Eat", summary.interval?.want_to_eat, summary.lifetime?.want_to_eat],
    ["Events", summary.interval?.social_events, summary.lifetime?.social_events],
    ["Invites sent", summary.interval?.invites_sent, summary.lifetime?.invites_sent],
    ["Videos", summary.interval?.video_uploads, summary.lifetime?.video_uploads],
    ["Connects", null, summary.lifetime?.accepted_connects],
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10,
        marginTop: 16,
      }}
      data-testid="diner-hub-summary-grid"
    >
      {entries.map(([label, intervalCount, lifetimeCount]) => (
        <div
          key={label}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${OWNER_COLORS.line}`,
            background: "#faf7f4",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted }}>{label}</div>
          {intervalCount != null ? (
            <div style={{ marginTop: 4, fontSize: 12, color: OWNER_COLORS.ink }}>
              {intervalLabel}: <strong>{intervalCount}</strong>
            </div>
          ) : null}
          {lifetimeCount != null ? (
            <div style={{ marginTop: 2, fontSize: 12, color: OWNER_COLORS.ink }}>
              Lifetime: <strong>{lifetimeCount}</strong>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function OwnerDinerHubDialog({ dinerId, interval, onClose }) {
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
      .catch(() => {
        if (!cancelled) setError("Could not load diner My Menuply snapshot.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dinerId, interval]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!dinerId) return null;

  const identity = data?.identity;
  const intervalLabel = INTERVAL_LABELS[interval] || interval;

  return (
    <div
      data-testid="owner-diner-hub-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Diner My Menuply snapshot"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(20, 16, 14, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          maxHeight: "min(88vh, 900px)",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${OWNER_COLORS.line}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          padding: "20px 22px",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase" }}>
              My Menuply snapshot
            </div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: OWNER_COLORS.ink }}>
              {loading ? "Loading…" : identity?.name || identity?.email || "Diner"}
            </div>
            {identity?.email ? (
              <div style={{ marginTop: 4, fontSize: 13, color: OWNER_COLORS.muted }}>{identity.email}</div>
            ) : null}
            {identity ? (
              <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
                {identity.status || "—"}
                {identity.geographic_market ? ` · ${identity.geographic_market}` : ""}
                {identity.referral_source_label ? ` · ${identity.referral_source_label}` : ""}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="owner-diner-hub-dialog-close"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${OWNER_COLORS.line}`,
              background: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {error ? <div style={{ marginTop: 14, color: "#9f1239", fontSize: 13 }}>{error}</div> : null}

        {!loading && !error && data ? (
          <>
            <div
              style={{
                marginTop: 14,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#faf7f4",
                border: `1px solid ${OWNER_COLORS.line}`,
                fontSize: 12,
                color: OWNER_COLORS.muted,
                lineHeight: 1.45,
              }}
            >
              Read-only owner view of this diner&apos;s hub content for {intervalLabel}. Consumer hub lives at{" "}
              <code>/my-menuply</code> (session-owned).
            </div>

            {identity?.diner_about ? (
              <section style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>About</div>
                <div style={{ fontSize: 13, color: OWNER_COLORS.ink, lineHeight: 1.5 }}>{identity.diner_about}</div>
              </section>
            ) : null}

            <SummaryGrid summary={data.summary} intervalLabel={intervalLabel} />

            <HubSection
              title="Recent I'm Eating At"
              items={data.hub?.recent_eating}
              emptyLabel="No recent eating activity."
            />
            <HubSection
              title="What I Ate Today"
              items={data.hub?.what_i_ate}
              emptyLabel="No What I Ate entries."
            />
            <HubSection
              title="Food I Want to Eat"
              items={data.hub?.want_to_eat}
              emptyLabel="No want-to-eat entries."
            />
            <HubSection title="My Events" items={data.hub?.events} emptyLabel="No diner events." />
            <HubSection title="Future plans" items={data.hub?.plans} emptyLabel="No What We Doing plans." />

            <section style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 8 }}>
                Recent activity
              </div>
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
                      <div style={{ marginTop: 4, fontSize: 11, color: OWNER_COLORS.muted }}>
                        {formatDateTime(item.created_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
