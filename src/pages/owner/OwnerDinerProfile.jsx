import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import { getOwnerDinerDetail } from "../../lib/ownerApi.js";
import DinerIntelligencePanel from "./diners/DinerIntelligencePanel.jsx";
import { DEFAULT_PROFILE_RANGE, rangeFromParams } from "./diners/profileDisplay.js";

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

export default function OwnerDinerProfile() {
  const { dinerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const range = rangeFromParams(searchParams);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dinerId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    // Identity + recent posts/plans only; the numbers come from DinerIntelligencePanel (Stage 4).
    getOwnerDinerDetail(dinerId)
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
  }, [dinerId]);

  const changeRange = (next) => {
    const params = new URLSearchParams(searchParams);
    for (const k of ["interval", "range", "from", "to"]) params.delete(k);
    if (next.key !== DEFAULT_PROFILE_RANGE) params.set("range", next.key);
    if (next.key === "custom") {
      params.set("from", next.from);
      params.set("to", next.to);
    }
    setSearchParams(params, { replace: true });
  };

  const identity = data?.identity;

  return (
    <OwnerLayout title="Diner profile">
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/owner/diners"
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

          {dinerId && !error ? <DinerIntelligencePanel dinerId={dinerId} range={range} onRangeChange={changeRange} /> : null}

          {error ? <div style={{ marginTop: 14, color: "#9f1239", fontSize: 13 }}>{error}</div> : null}

          {!error && data ? (
            <>
              {identity?.diner_about ? (
                <section style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>About</div>
                  <div style={{ fontSize: 13, color: OWNER_COLORS.ink, lineHeight: 1.5 }}>{identity.diner_about}</div>
                </section>
              ) : null}


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
