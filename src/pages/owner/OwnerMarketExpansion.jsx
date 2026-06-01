import React, { useEffect, useState } from "react";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerMarketExpansion, getOwnerMarketExpansionByZip } from "../../lib/ownerApi.js";

const DINER_THRESHOLD_DEFAULT = 250;
const RESTAURANT_THRESHOLD_DEFAULT = 25;

function ThresholdBar({ value, threshold, color }) {
  const pct = Math.min(100, Math.round((value / threshold) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 99, background: "#f1e3d8", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, minWidth: 44, textAlign: "right" }}>
        {value}/{threshold}
      </div>
    </div>
  );
}

function ActiveBadge() {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 99,
      background: "#d4edda",
      color: "#155724",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.04em",
    }}>
      ACTIVE
    </span>
  );
}

function MarketMessage({ market, state, isActive }) {
  const cityLabel = market && market !== "Unknown" ? market : "Your City";
  if (isActive) {
    return (
      <div style={{ padding: "16px 18px", borderRadius: 12, background: "#d4edda", borderLeft: "4px solid #28a745", marginTop: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: "#155724" }}>{cityLabel}, {state} is an Active Launch Market</div>
        <div style={{ fontSize: 13, color: "#155724", lineHeight: 1.5 }}>
          Restaurants and diners across the area are already joining Menuply. Sign up today and be part of the movement.
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, background: "#fff8ee", borderLeft: "4px solid #f0ad4e", marginTop: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#856404" }}>Join the Movement in {cityLabel}</div>
      <div style={{ fontSize: 13, color: "#856404", lineHeight: 1.5 }}>
        Restaurants and diners are looking for a lower-cost alternative. Menuply is expanding into {cityLabel}. Sign up for your free account today.
      </div>
    </div>
  );
}

function ZipDrilldown({ market, state, thresholds, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOwnerMarketExpansionByZip({ market, state })
      .then(setData)
      .catch(() => setError("Could not load ZIP data."));
  }, [market, state]);

  return (
    <div style={{ marginTop: 16, padding: "20px 22px", borderRadius: 16, background: "#f9f3ee", border: `1px solid ${OWNER_COLORS.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>ZIP Breakdown — {market}, {state}</div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: OWNER_COLORS.muted, fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {error ? (
        <div style={{ color: "#8b2e1a", fontSize: 13 }}>{error}</div>
      ) : !data ? (
        <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>Loading...</div>
      ) : data.zips.length === 0 ? (
        <EmptyState>No ZIP-level data yet for this market.</EmptyState>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
              <th style={{ textAlign: "left", padding: "6px 8px", color: OWNER_COLORS.muted, fontWeight: 700 }}>ZIP</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: OWNER_COLORS.muted, fontWeight: 700 }}>Diners</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: OWNER_COLORS.muted, fontWeight: 700 }}>Restaurants</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: OWNER_COLORS.muted, fontWeight: 700 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.zips.map((row) => (
              <tr key={row.zip} style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                <td style={{ padding: "8px 8px", fontWeight: 700 }}>{row.zip}</td>
                <td style={{ padding: "8px 8px", textAlign: "right" }}>{row.diner_count}</td>
                <td style={{ padding: "8px 8px", textAlign: "right" }}>{row.restaurant_count}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700 }}>{row.total_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function OwnerMarketExpansion() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [drilldown, setDrilldown] = useState(null);

  useEffect(() => {
    getOwnerMarketExpansion()
      .then(setData)
      .catch(() => setError("Market expansion data is temporarily unavailable."));
  }, []);

  const markets = data?.markets || [];
  const thresholds = data?.thresholds || { diner_threshold: DINER_THRESHOLD_DEFAULT, restaurant_threshold: RESTAURANT_THRESHOLD_DEFAULT };
  const activeMarkets = markets.filter((m) => m.is_active_launch_market);
  const pendingMarkets = markets.filter((m) => !m.is_active_launch_market);

  return (
    <OwnerLayout title="Market Expansion">
      {error ? (
        <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
          {error}
        </div>
      ) : null}

      <SectionTitle
        title="Market Expansion"
        subtitle={`Active when a market reaches ${thresholds.diner_threshold} diners and ${thresholds.restaurant_threshold} restaurants.`}
      />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          ["Total Markets", markets.length],
          ["Active Launch Markets", activeMarkets.length],
          ["Total Diner Signups", markets.reduce((s, m) => s + m.diner_signups, 0)],
          ["Total Restaurant Signups", markets.reduce((s, m) => s + m.restaurant_signups, 0)],
          ["Total Signups", markets.reduce((s, m) => s + m.total_signups, 0)],
        ].map(([label, value]) => (
          <PageCard key={label} style={{ padding: 18 }}>
            <div style={{ color: OWNER_COLORS.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {label}
            </div>
            <div style={{ marginTop: 10, fontSize: 26, fontWeight: 800 }}>{data ? value : "—"}</div>
          </PageCard>
        ))}
      </div>

      {/* Market table */}
      {!data ? (
        <EmptyState>Loading market data...</EmptyState>
      ) : markets.length === 0 ? (
        <EmptyState>No signups recorded yet. Data appears here as diners and restaurants join.</EmptyState>
      ) : (
        <PageCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${OWNER_COLORS.line}`, background: "#faf3ec" }}>
                  <th style={{ textAlign: "left", padding: "12px 18px", fontWeight: 700, color: OWNER_COLORS.ink }}>Market</th>
                  <th style={{ textAlign: "left", padding: "12px 12px", fontWeight: 700, color: OWNER_COLORS.ink }}>State</th>
                  <th style={{ textAlign: "right", padding: "12px 12px", fontWeight: 700, color: OWNER_COLORS.ink }}>Diners</th>
                  <th style={{ textAlign: "right", padding: "12px 12px", fontWeight: 700, color: OWNER_COLORS.ink }}>Restaurants</th>
                  <th style={{ textAlign: "right", padding: "12px 12px", fontWeight: 700, color: OWNER_COLORS.ink }}>Total</th>
                  <th style={{ textAlign: "left", padding: "12px 18px", fontWeight: 700, color: OWNER_COLORS.ink }}>Progress</th>
                  <th style={{ textAlign: "center", padding: "12px 12px", fontWeight: 700, color: OWNER_COLORS.ink }}>Status</th>
                  <th style={{ padding: "12px 18px" }} />
                </tr>
              </thead>
              <tbody>
                {markets.map((market, idx) => (
                  <React.Fragment key={`${market.market}-${market.state}`}>
                    <tr
                      style={{
                        borderBottom: `1px solid ${OWNER_COLORS.line}`,
                        background: idx % 2 === 0 ? "#fff" : "#fffdf8",
                      }}
                    >
                      <td style={{ padding: "12px 18px", fontWeight: 700 }}>{market.market}</td>
                      <td style={{ padding: "12px 12px", color: OWNER_COLORS.muted }}>{market.state}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>{market.diner_signups}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>{market.restaurant_signups}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700 }}>{market.total_signups}</td>
                      <td style={{ padding: "12px 18px", minWidth: 200 }}>
                        <div style={{ marginBottom: 4, fontSize: 11, color: OWNER_COLORS.muted }}>Diners</div>
                        <ThresholdBar value={market.diner_signups} threshold={thresholds.diner_threshold} color="#1F4E3D" />
                        <div style={{ marginTop: 6, marginBottom: 4, fontSize: 11, color: OWNER_COLORS.muted }}>Restaurants</div>
                        <ThresholdBar value={market.restaurant_signups} threshold={thresholds.restaurant_threshold} color={OWNER_COLORS.accent} />
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center" }}>
                        {market.is_active_launch_market ? <ActiveBadge /> : (
                          <span style={{ fontSize: 12, color: OWNER_COLORS.muted, fontWeight: 500 }}>Building</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "right" }}>
                        <button
                          onClick={() =>
                            setDrilldown(
                              drilldown?.market === market.market && drilldown?.state === market.state
                                ? null
                                : { market: market.market, state: market.state }
                            )
                          }
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: `1px solid ${OWNER_COLORS.line}`,
                            background: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: OWNER_COLORS.ink,
                          }}
                        >
                          {drilldown?.market === market.market && drilldown?.state === market.state
                            ? "Hide ZIPs"
                            : "View ZIPs"}
                        </button>
                      </td>
                    </tr>
                    {drilldown?.market === market.market && drilldown?.state === market.state ? (
                      <tr style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                        <td colSpan={8} style={{ padding: "0 18px 18px" }}>
                          <ZipDrilldown
                            market={market.market}
                            state={market.state}
                            thresholds={thresholds}
                            onClose={() => setDrilldown(null)}
                          />
                        </td>
                      </tr>
                    ) : null}
                    {/* Market messaging preview row */}
                    <tr style={{ borderBottom: `2px solid ${OWNER_COLORS.line}` }}>
                      <td colSpan={8} style={{ padding: "0 18px 16px" }}>
                        <MarketMessage
                          market={market.market}
                          state={market.state}
                          isActive={market.is_active_launch_market}
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </PageCard>
      )}
    </OwnerLayout>
  );
}
