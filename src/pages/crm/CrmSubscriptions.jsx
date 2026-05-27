import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import CrmLayout from "./CrmLayout.jsx";
import { getCrmSubscriptions } from "../../lib/crmApi.js";

const STATUS_COLORS = {
  active:    { bg: "#e8f3ef", color: "#173f35", label: "Active" },
  trialing:  { bg: "#fffbe6", color: "#92400e", label: "Trial" },
  past_due:  { bg: "#fef2f2", color: "#991b1b", label: "Past Due" },
  cancelled: { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" },
};

function fmt(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function priceCents(cents) {
  if (!cents) return "Free";
  return `$${(cents / 100).toFixed(2)}/mo`;
}

const PLAN_ORDER = { enterprise: 0, pro: 1, starter: 2, verified: 3, public: 4, free: 5 };

export default function CrmSubscriptions() {
  const { t } = useLanguage();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getCrmSubscriptions()
      .then((data) => setSubscriptions(data.subscriptions || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subscriptions.filter((s) => filter === "all" || s.status === filter);

  const planBreakdown = subscriptions
    .filter((s) => s.status === "active" || s.status === "trialing")
    .reduce((acc, s) => {
      acc[s.plan_slug] = (acc[s.plan_slug] || 0) + 1;
      return acc;
    }, {});

  const paid = subscriptions.filter((s) => (s.monthly_price_cents > 0 || s.annual_price_cents > 0) && s.status === "active");

  return (
    <CrmLayout title="Subscriptions">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total", value: subscriptions.length },
          { label: "Active", value: subscriptions.filter((s) => s.status === "active").length },
          { label: "Paid Active", value: paid.length },
          { label: "Cancelled", value: subscriptions.filter((s) => s.status === "cancelled").length },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.04em" }}>{value}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {Object.keys(planBreakdown).length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16, padding: "18px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 12 }}>Active by Plan</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(planBreakdown)
              .sort(([a], [b]) => (PLAN_ORDER[a] ?? 9) - (PLAN_ORDER[b] ?? 9))
              .map(([slug, count]) => (
                <div key={slug} style={{ background: "#e8f3ef", borderRadius: 10, padding: "6px 14px", fontSize: 13, fontWeight: 700, color: "#173f35" }}>
                  {slug.charAt(0).toUpperCase() + slug.slice(1)}: {count}
                </div>
              ))}
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #d9e0ea", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginRight: 6 }}>Status:</span>
          {["all", "active", "trialing", "past_due", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 12px", borderRadius: 10, border: "1px solid",
                borderColor: filter === f ? "#173f35" : "#d9e0ea",
                background: filter === f ? "#173f35" : "#fff",
                color: filter === f ? "#fff" : "#0f1720",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading subscriptions…</div>
        )}
        {error && (
          <div style={{ padding: 20, color: "#991b1b", fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>No subscriptions match this filter.</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Subscriber", "Plan", "Billing", "Status", "Subscribed", "Expires"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", borderBottom: "1px solid #d9e0ea" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const badge = STATUS_COLORS[s.status] || STATUS_COLORS.cancelled;
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f1720" }}>{s.full_name || "—"}</div>
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{s.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f1720" }}>
                      {s.plan_name}
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>
                        {priceCents(s.monthly_price_cents)}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b", textTransform: "capitalize" }}>{s.billing_cycle}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 8, padding: "3px 10px", fontWeight: 700, fontSize: 11 }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#0f1720" }}>{fmt(s.subscribed_at)}</td>
                    <td style={{ padding: "12px 16px", color: s.expires_at ? "#0f1720" : "#64748b" }}>{fmt(s.expires_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </CrmLayout>
  );
}
