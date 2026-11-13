import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import { getOwnerDinerUsc } from "../../lib/ownerApi.js";
import { ProfileRangePicker } from "./diners/DinerIntelligencePanel.jsx";
import { PROFILE_RANGE_OPTIONS, shortDate } from "./diners/profileDisplay.js";
import { NetworkTile, TILE_GRID } from "./diners/OwnerDinersNetwork.jsx";
import { goalPercent, rangeApiParams, rangeStateFromParams } from "./diners/networkDisplay.js";

/**
 * /owner/diners/usc: the USC launch view (Diner Intelligence Stage 6, plan 39). Goal: 500 engaged student
 * diners in 30 days. Engaged = 1+ meaningful action in the first 30 days after joining; registrations,
 * Connects and invites are shown beside it, never counted as engagement. Owner only.
 */
export default function OwnerDinersUsc() {
  const [params, setParams] = useSearchParams();
  const state = rangeStateFromParams(params);
  const apiParams = rangeApiParams({ ...state, clusterId: 0 });
  const paramKey = JSON.stringify(apiParams);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    getOwnerDinerUsc(apiParams)
      .then((payload) => !cancelled && setData(payload))
      .catch((err) => !cancelled && setError(err?.status === 400 && err.message ? err.message : "The USC numbers couldn't be loaded just now."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  const changeRange = (r) => {
    const next = new URLSearchParams(params);
    next.set("range", r.key);
    if (r.key === "custom") { next.set("from", r.from); next.set("to", r.to); } else { next.delete("from"); next.delete("to"); }
    setParams(next, { replace: true });
  };
  const pctDone = data ? goalPercent(data.goal.engaged, data.goal.target) : 0;

  return (
    <OwnerLayout title="USC launch">
      <div style={{ marginBottom: 12 }}>
        <Link to="/owner/diners" style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>← Diner accounts</Link>
      </div>
      <PageCard style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: OWNER_COLORS.ink }}>Goal: 500 engaged USC students in 30 days</div>
        <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4, lineHeight: 1.45 }}>{data?.definition}</div>
        <div style={{ marginTop: 14 }}>
          <ProfileRangePicker range={state.range} onChange={changeRange} options={PROFILE_RANGE_OPTIONS} testPrefix="usc-range" />
        </div>
        {data ? (
          <div style={{ marginTop: 14 }} data-testid="usc-goal">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>
              <span>{data.goal.engaged.toLocaleString("en-US")} of {data.goal.target.toLocaleString("en-US")} engaged students</span>
              <span>{pctDone}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 6, background: OWNER_COLORS.line, marginTop: 6, overflow: "hidden" }}>
              <div style={{ width: `${pctDone}%`, height: "100%", background: OWNER_COLORS.ink }} />
            </div>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 6 }}>
              Students who joined {shortDate(data.range.from)} through {shortDate(data.range.to)} (Los Angeles days)
            </div>
          </div>
        ) : null}
        {error ? <div style={{ marginTop: 10, fontSize: 13, color: "#9f1239" }}>{error}</div> : null}
        {!data && !error ? <div style={{ marginTop: 10, fontSize: 13, color: OWNER_COLORS.muted }}>Loading…</div> : null}
      </PageCard>
      {data ? (
        <div style={TILE_GRID} data-testid="usc-metrics">
          {data.metrics.map((x) => <NetworkTile key={x.key} metric={x} state={{ ...state, clusterId: 0 }} />)}
        </div>
      ) : null}
    </OwnerLayout>
  );
}
