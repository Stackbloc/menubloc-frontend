import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import {
  activateSdPlan,
  archiveSdPlan,
  deactivateSdPlan,
  duplicateSdPlan,
  listSdPlans,
} from "../../../lib/ownerApi.js";

function Badge({ children, tone = "neutral" }) {
  const bg =
    tone === "ok" ? "#d4edda" : tone === "warn" ? "#fff3cd" : tone === "bad" ? "#f8d7da" : "#eef1f0";
  const color =
    tone === "ok" ? "#155724" : tone === "warn" ? "#856404" : tone === "bad" ? "#721c24" : OWNER_COLORS.muted;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 99,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function formatPrice(plan) {
  const prices = plan.prices || [];
  if (!prices.length) return "—";
  return prices.map((p) => p.public_price_label || `${p.amount_cents}¢`).join(" · ");
}

function statusTone(plan) {
  if (plan.archived) return "bad";
  if (!plan.active) return "warn";
  return "ok";
}

export default function SubscriptionDesignerList() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listSdPlans();
      setPlans(res.plans || []);
    } catch (err) {
      setError(err.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function runAction(id, fn) {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <OwnerLayout
      title="Subscription Designer"
      actions={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to="/owner/subscription-designer/features" style={linkBtn}>
            Feature catalog
          </Link>
          <Link to="/owner/subscription-designer/preview" style={linkBtn}>
            Preview chart
          </Link>
          <Link to="/owner/subscription-designer/audit" style={linkBtn}>
            Change log
          </Link>
          <button type="button" style={primaryBtn} onClick={() => navigate("/owner/subscription-designer/new")}>
            Create plan
          </button>
        </div>
      }
    >
      <PageCard style={{ padding: 20 }}>
        <SectionTitle
          title="Plans"
          subtitle="Source of truth for plan entitlements, public prices, and comparison-chart content. Stripe billing stays in the existing catalog and Stripe dashboard."
        />
        {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
        {loading ? (
          <EmptyState>Loading plans…</EmptyState>
        ) : !plans.length ? (
          <EmptyState>No plans yet. Run migration 0206 or create a plan.</EmptyState>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {plans.map((plan) => {
              const impact = plan.assignment_impact || {};
              return (
                <div
                  key={plan.id}
                  style={{
                    border: `1px solid ${OWNER_COLORS.line}`,
                    borderRadius: 14,
                    padding: 16,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: OWNER_COLORS.ink }}>
                        {plan.public_name}
                        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: OWNER_COLORS.muted }}>
                          {plan.internal_key}
                        </span>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Badge tone={statusTone(plan)}>
                          {plan.archived ? "Archived" : plan.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge>{plan.restaurant_type}</Badge>
                        <Badge tone={plan.online_ordering_enabled ? "ok" : "neutral"}>
                          Ordering {plan.online_ordering_enabled ? "on" : "off"}
                        </Badge>
                        <Badge tone={plan.publicly_available ? "ok" : "warn"}>
                          {plan.publicly_available ? "Public" : "Not public"}
                        </Badge>
                        <Badge tone={plan.visible_in_comparison_chart ? "ok" : "neutral"}>
                          Chart {plan.visible_in_comparison_chart ? "visible" : "hidden"}
                        </Badge>
                        {plan.has_pricing_mismatch ? (
                          <Badge tone="warn">Display ≠ billing catalog</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13, color: OWNER_COLORS.muted }}>
                      <div>{formatPrice(plan)}</div>
                      <div style={{ marginTop: 4 }}>
                        Restaurants: {impact.restaurants_assigned ?? "—"} · Subs:{" "}
                        {impact.active_subscriptions ?? "—"} (mo {impact.monthly_subscribers ?? 0} / yr{" "}
                        {impact.annual_subscribers ?? 0})
                      </div>
                      <div style={{ marginTop: 4 }}>
                        Updated {plan.updated_at ? new Date(plan.updated_at).toLocaleString() : "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={secondaryBtn}
                      onClick={() => navigate(`/owner/subscription-designer/plans/${plan.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={secondaryBtn}
                      disabled={busyId === plan.id}
                      onClick={() => runAction(plan.id, () => duplicateSdPlan(plan.id))}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      style={secondaryBtn}
                      onClick={() => navigate("/owner/subscription-designer/preview")}
                    >
                      Preview
                    </button>
                    {plan.active ? (
                      <button
                        type="button"
                        style={secondaryBtn}
                        disabled={busyId === plan.id}
                        onClick={() => runAction(plan.id, () => deactivateSdPlan(plan.id))}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        style={secondaryBtn}
                        disabled={busyId === plan.id}
                        onClick={() => runAction(plan.id, () => activateSdPlan(plan.id))}
                      >
                        Activate
                      </button>
                    )}
                    {!plan.archived ? (
                      <button
                        type="button"
                        style={{ ...secondaryBtn, color: "#b91c1c" }}
                        disabled={busyId === plan.id}
                        onClick={() => {
                          const n = impact.active_subscriptions || 0;
                          if (
                            !window.confirm(
                              n
                                ? `This plan has ${n} active subscription(s). Archive may be blocked. Continue?`
                                : "Archive this plan?"
                            )
                          ) {
                            return;
                          }
                          runAction(plan.id, () => archiveSdPlan(plan.id));
                        }}
                      >
                        Archive
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageCard>
    </OwnerLayout>
  );
}

const linkBtn = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 10,
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  color: OWNER_COLORS.ink,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
};

const primaryBtn = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "none",
  background: OWNER_COLORS.accent,
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "7px 12px",
  borderRadius: 10,
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  color: OWNER_COLORS.ink,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
