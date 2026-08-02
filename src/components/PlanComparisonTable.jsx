import React, { useEffect, useState } from "react";
import { API_BASE } from "../lib/api.js";

const GREEN = "#1F4E3D";
const AMBER = "#92400e";

/**
 * Hardcoded fallback — temporary production safety net only.
 * Remove after Subscription Designer chart API is live on all deploy targets
 * for ≥1 release cycle with zero fallback log hits.
 * See docs/handoffs/2026-07-23_subscription-designer_handoff.md
 */
const FALLBACK_FEATURES = [
  { label: "Searchable restaurant listing on Menuply", published: true, starter: true, founders: true },
  { label: "Searchable menu items", published: true, starter: true, founders: true },
  { label: "Professional restaurant profile", published: "Limited", starter: true, founders: true },
  { label: "Restaurant logo on profile", published: false, starter: true, founders: true },
  { label: "Logo and product photos", published: false, starter: true, founders: true },
  { label: "QR Code", published: false, starter: true, founders: true },
  { label: "Unlimited menus and menu items", published: false, starter: true, founders: true },
  { label: "Edit menus and menu items", published: false, starter: true, founders: true },
  { label: "Premium menu management tools", published: false, starter: false, founders: true },
  { label: "Rich searchable menu data", published: false, starter: true, founders: true },
  { label: "Social sharing of menus and menu items", published: false, starter: true, founders: true },
  { label: "Customers can follow your restaurant", published: false, starter: true, founders: true },
  { label: "Create deals and promotions free of charge", published: false, starter: false, founders: true },
  { label: "Online ordering", published: false, starter: true, founders: true },
];

const FALLBACK_PLAN_COLUMNS = [
  {
    key: "published",
    name: "Standard",
    commission: "No order commission",
    prices: ["Free"],
    nameColor: GREEN,
    highlight: false,
  },
  {
    key: "starter",
    name: "Pro",
    commission: "11% commission",
    prices: ["$20/month", "or $199/year"],
    nameColor: GREEN,
    highlight: false,
  },
  {
    key: "founders",
    name: "Founder's*",
    commission: "8% · 2-year lock",
    prices: ["$39/month", "or $319/year"],
    nameColor: AMBER,
    highlight: true,
  },
];

const FALLBACK_FOOTNOTE =
  "* Window QR Code included with Founder's Annual plan. Founder's Membership is available for a limited time to early restaurant partners.";

function isStrictChartMode() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test") return true;
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") return true;
  } catch {
    /* ignore */
  }
  return false;
}

function logFallback(reason, detail) {
  const msg = `[PlanComparisonTable] Subscription Designer chart fallback used: ${reason}`;
  console.warn(msg, detail || "");
}

function columnWidth(key) {
  if (key === "founders") return 120;
  if (key === "starter") return 110;
  return 100;
}

function CellValue({ value }) {
  if (value === true) {
    return <span style={{ color: GREEN, fontWeight: 800, fontSize: 15 }}>✓</span>;
  }
  if (typeof value === "string" && value.trim()) {
    const display = value === "Limited" ? `(${value})` : value;
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", lineHeight: 1.25 }}>
        {display}
      </span>
    );
  }
  return <span style={{ color: "#d1d5db", fontSize: 15 }}>—</span>;
}

function FeatureRow({ label, columns, values, shade }) {
  return (
    <tr style={{ background: shade ? "#f8faf9" : "#fff" }}>
      <td
        style={{
          padding: "11px 16px",
          fontSize: 13,
          color: "#374151",
          fontWeight: 500,
          borderRight: "1px solid #f0f4f8",
        }}
      >
        {label}
      </td>
      {columns.map((plan) => {
        const highlightCol = plan.highlight;
        return (
          <td
            key={plan.key}
            style={{
              padding: "11px 6px",
              textAlign: "center",
              width: columnWidth(plan.key),
              background: highlightCol ? (shade ? "#fef9f0" : "#fffdf7") : undefined,
            }}
          >
            <CellValue value={values[plan.key]} />
          </td>
        );
      })}
    </tr>
  );
}

function PlanHeaderCell({ plan }) {
  return (
    <th
      style={{
        padding: "6px 8px 10px",
        textAlign: "center",
        width: columnWidth(plan.key),
        background: plan.highlight ? "#fffdf7" : undefined,
        verticalAlign: "top",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: plan.nameColor, lineHeight: 1.3 }}>
        {plan.name}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 800,
          color: plan.highlight ? AMBER : GREEN,
          lineHeight: 1.3,
        }}
      >
        {plan.commission}
      </div>
      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
        {(plan.prices || []).map((line) => (
          <div
            key={line}
            style={{
              fontSize: 10,
              color: plan.highlight ? AMBER : "#6b7280",
              lineHeight: 1.35,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </th>
  );
}

function normalizeApiPayload(json) {
  if (!json?.ok || !Array.isArray(json.plans) || !json.plans.length) return null;
  if (!Array.isArray(json.features) || !json.features.length) return null;
  return {
    plans: json.plans,
    features: json.features.map((f) => {
      const values = {};
      for (const plan of json.plans) {
        values[plan.key] = f[plan.key];
      }
      return { key: f.key, label: f.label, values };
    }),
    footnote: json.footnote || FALLBACK_FOOTNOTE,
  };
}

function fallbackPayload() {
  return {
    plans: FALLBACK_PLAN_COLUMNS,
    features: FALLBACK_FEATURES.map((row) => ({
      key: row.label,
      label: row.label,
      values: {
        published: row.published,
        starter: row.starter,
        founders: row.founders,
      },
    })),
    footnote: FALLBACK_FOOTNOTE,
  };
}

/**
 * @param {{ plans?: object[], features?: object[], footnote?: string }} [props.data]
 * @param {"restaurant"|"food_truck"} [props.audience] public chart audience (default restaurant)
 */
export default function PlanComparisonTable({
  data: injectedData = null,
  audience = "restaurant",
} = {}) {
  const chartAudience = audience === "food_truck" ? "food_truck" : "restaurant";
  const allowRestaurantFallback = chartAudience === "restaurant";

  const [chart, setChart] = useState(() => {
    if (injectedData) {
      return normalizeApiPayload({ ok: true, ...injectedData }) || null;
    }
    // Do not paint restaurant fallback for food_truck or until fetch settles in strict/dev.
    return isStrictChartMode() || !allowRestaurantFallback ? null : fallbackPayload();
  });
  const [loadError, setLoadError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    if (injectedData) {
      const normalized = normalizeApiPayload({ ok: true, ...injectedData });
      if (normalized) {
        setChart(normalized);
        setLoadError(null);
      } else {
        setLoadError("Invalid preview chart payload");
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/public/subscription-comparison?audience=${encodeURIComponent(chartAudience)}`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const normalized = normalizeApiPayload(json);
        if (!normalized) {
          throw new Error("empty_or_invalid_subscription_designer_chart");
        }
        if (!cancelled) {
          setChart(normalized);
          setLoadError(null);
          setUsedFallback(false);
        }
      } catch (err) {
        const reason = err?.message || "fetch_failed";
        logFallback(reason, {
          api: `${API_BASE}/api/public/subscription-comparison`,
          audience: chartAudience,
        });
        if (cancelled) return;
        // Restaurant-only hardcoded fallback — never paint restaurant columns for food_truck.
        if (isStrictChartMode() || !allowRestaurantFallback) {
          setChart(null);
          setLoadError(
            `Subscription Designer chart unavailable (${reason}). Fallback disabled in development/test.`
          );
          setUsedFallback(false);
        } else {
          setChart(fallbackPayload());
          setUsedFallback(true);
          setLoadError(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [injectedData, chartAudience, allowRestaurantFallback]);

  if (loadError && !chart) {
    return (
      <div
        style={{
          marginBottom: 32,
          padding: 16,
          border: "1px solid #fca5a5",
          borderRadius: 14,
          background: "#fef2f2",
          color: "#991b1b",
          fontSize: 13,
        }}
        data-testid="plan-comparison-error"
      >
        {loadError}
      </div>
    );
  }

  if (!chart) {
    return (
      <div style={{ marginBottom: 32, color: "#6b7280", fontSize: 13 }}>Loading plan comparison…</div>
    );
  }

  const { plans, features, footnote } = chart;

  return (
    <div style={{ marginBottom: 32 }} data-chart-fallback={usedFallback ? "true" : "false"}>
      {usedFallback ? (
        <div
          style={{
            marginBottom: 10,
            fontSize: 12,
            color: "#92400e",
            fontWeight: 600,
          }}
        >
          Showing temporary fallback chart — Subscription Designer API unavailable.
        </div>
      ) : null}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e4e9f0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8faf9", borderBottom: "1px solid #e4e9f0" }}>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0f1720",
                    width: "42%",
                  }}
                >
                  Feature
                </th>
                <th
                  colSpan={plans.length || 3}
                  style={{
                    padding: "12px 0",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0f1720",
                  }}
                >
                  Subscription
                </th>
              </tr>
              <tr style={{ background: "#f8faf9", borderBottom: "2px solid #e4e9f0" }}>
                <th style={{ padding: "6px 16px 10px", width: "42%" }} />
                {plans.map((plan) => (
                  <PlanHeaderCell key={plan.key} plan={plan} />
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((row, idx) => (
                <FeatureRow
                  key={row.key || row.label}
                  label={row.label}
                  columns={plans}
                  values={row.values}
                  shade={idx % 2 === 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {footnote ? (
        <p
          style={{
            margin: "14px 0 0",
            paddingLeft: 17,
            paddingRight: 16,
            fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
            fontSize: 13,
            color: "#374151",
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {footnote}
        </p>
      ) : null}
    </div>
  );
}

export { FALLBACK_FEATURES, FALLBACK_PLAN_COLUMNS, FALLBACK_FOOTNOTE, normalizeApiPayload };
