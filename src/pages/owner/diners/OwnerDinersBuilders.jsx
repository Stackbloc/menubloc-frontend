import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { SimpleTable } from "../intelligence/intelligenceShared.jsx";
import { downloadOwnerDinerBuildersCsv, getOwnerDinerBuilders } from "../../../lib/ownerApi.js";
import { ProfileRangePicker } from "./DinerIntelligencePanel.jsx";
import { PROFILE_RANGE_OPTIONS, shortDate } from "./profileDisplay.js";
import { dinerProfilePath } from "./dinerMetricDisplay.js";
import { NetworkTile, TILE_GRID } from "./OwnerDinersNetwork.jsx";
import {
  BUILDER_PAGE_SIZE,
  BUILDER_SORT_KEYS,
  CATEGORY_OPTIONS,
  builderApiParams,
  builderStateFromParams,
  nextSort,
  trendLabel,
} from "./builderDisplay.js";

/**
 * Diner Intelligence Stage 7 (plan 39, Phase 6): Network Builder on /owner/diners.
 * The Network Value leaderboard (scored daily; unchanged, and still on Owner Analytics → Network Value) plus two
 * columns for the selected period: social days (repeat = 2+ days) and multi-diner plans. Owner only.
 */

const inputStyle = { padding: "6px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 };
const labelStyle = { fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted };
const linkButton = { border: 0, background: "none", padding: 0, fontWeight: 700, color: OWNER_COLORS.ink, cursor: "pointer", fontSize: 13, textDecoration: "underline" };

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function OwnerDinersBuilders() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const state = builderStateFromParams(params);
  const apiParams = builderApiParams(state);
  const paramKey = JSON.stringify(apiParams);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError("");
    getOwnerDinerBuilders(apiParams)
      .then((payload) => !cancelled && setData(payload))
      .catch((err) => !cancelled && setError(err?.status === 400 && err.message ? err.message : "Network Builder couldn't be loaded just now."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "" || v === false) next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
  };

  const csv = async () => {
    setBusy(true);
    try {
      saveBlob(await downloadOwnerDinerBuildersCsv({ ...apiParams, page: null, page_size: null }),
        `menuply-network-builders-${data?.range?.from || ""}-to-${data?.range?.to || ""}.csv`);
    } catch {
      setError("The CSV couldn't be made just now.");
    } finally {
      setBusy(false);
    }
  };

  const matched = data?.paging?.matched || 0;
  const pages = Math.max(1, Math.ceil(matched / BUILDER_PAGE_SIZE));

  return (
    <div data-testid="diner-builders">
      <SectionTitle
        title="Network Builder"
        subtitle="Who is building the dining network. Network Value scores are the latest daily score (now); social days and multi-diner plans are for the period you pick. Repeat = socially active on 2+ days. A multi-diner plan has 2+ diners saying yes or maybe. Staff and test diners are left out."
      />
      <PageCard style={{ padding: 18, marginBottom: 14 }}>
        <ProfileRangePicker
          range={state.range}
          options={PROFILE_RANGE_OPTIONS}
          testPrefix="builders-range"
          onChange={(r) => update({ brange: r.key, bfrom: r.key === "custom" ? r.from : null, bto: r.key === "custom" ? r.to : null, bpage: null })}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginTop: 12 }}>
          <select data-testid="builders-category" value={state.category} onChange={(e) => update({ bcat: e.target.value, bpage: null })} style={inputStyle}>
            {CATEGORY_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <label style={labelStyle}>
            <input type="checkbox" data-testid="builders-repeat" checked={state.repeat} onChange={(e) => update({ brepeat: e.target.checked ? "1" : null, bpage: null })} />{" "}
            Repeat social only
          </label>
          <label style={labelStyle}>
            <input type="checkbox" data-testid="builders-plans" checked={state.plans} onChange={(e) => update({ bplans: e.target.checked ? "1" : null, bpage: null })} />{" "}
            In a multi-diner plan only
          </label>
          <button type="button" onClick={csv} disabled={busy || !data?.scored} data-testid="builders-csv" style={linkButton}>
            {busy ? "Making CSV…" : "Download CSV"}
          </button>
          <Link to={data?.leaderboard_path || "/owner/analytics?tab=network_value"} data-testid="builders-leaderboard-link" style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>
            Full Network Value leaderboard and rewards
          </Link>
        </div>
        {data ? (
          <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>
            {data.scored ? `Network Value scored ${shortDate(data.as_of)} · ` : ""}
            Period {shortDate(data.range.from)} through {shortDate(data.range.to)} (Los Angeles days)
          </div>
        ) : null}
        {error ? <div style={{ marginTop: 10, fontSize: 13, color: "#9f1239" }}>{error}</div> : null}
        {!data && !error ? <div style={{ marginTop: 10, fontSize: 13, color: OWNER_COLORS.muted }}>Loading…</div> : null}
      </PageCard>

      {data && !data.scored ? (
        <PageCard style={{ padding: 18, marginBottom: 14 }}>
          <div data-testid="builders-not-scored" style={{ fontSize: 13, color: OWNER_COLORS.muted }}>{data.note}</div>
        </PageCard>
      ) : null}

      {data?.scored ? (
        <>
          <div style={{ ...TILE_GRID, marginBottom: 14 }} data-testid="builders-summary">
            {data.summary.map((x) => <NetworkTile key={x.key} metric={x} state={null} />)}
          </div>
          <PageCard style={{ padding: 18, marginBottom: 14 }}>
            <div data-testid="builders-table">
              <SimpleTable
                rows={data.rows}
                emptyLabel="No diners match."
                onRowClick={(r) => navigate(dinerProfilePath(r.id, state.range.key === "custom" ? "30d" : state.range.key))}
                sort={{ key: state.sort, dir: state.dir }}
                onSortChange={(key) => update(nextSort(state, key))}
                sortableKeys={BUILDER_SORT_KEYS}
                columns={[
                  ["Diner", "display_name", (r) => r.display_name || `Diner ${r.id}`],
                  ["Category", "category"],
                  ["NVS", "nvs", (r) => (r.nvs == null ? "—" : r.nvs)],
                  ["30-day change", "trend", (r) => trendLabel(r.trend)],
                  ["Connects", "friends"],
                  ["Active friends", "active_friends"],
                  ["Recruits", "activated_recruits"],
                  ["Hosted", "confirmed_hosted"],
                  ["Joined", "joined_plans"],
                  ["Social days", "social_days", (r) => (r.repeat_social ? `${r.social_days} · repeat` : r.social_days)],
                  ["Multi-diner plans", "multi_diner_plans"],
                ]}
              />
            </div>
            {pages > 1 ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, fontSize: 13 }}>
                <button type="button" disabled={state.page <= 1} onClick={() => update({ bpage: state.page - 1 })} data-testid="builders-prev"
                  style={{ ...linkButton, textDecoration: "none", color: state.page <= 1 ? OWNER_COLORS.muted : OWNER_COLORS.ink }}>Previous</button>
                <span style={{ color: OWNER_COLORS.muted }}>Page {state.page} of {pages} · {matched} diners</span>
                <button type="button" disabled={state.page >= pages} onClick={() => update({ bpage: state.page + 1 })} data-testid="builders-next"
                  style={{ ...linkButton, textDecoration: "none", color: state.page >= pages ? OWNER_COLORS.muted : OWNER_COLORS.ink }}>Next</button>
              </div>
            ) : null}
          </PageCard>
        </>
      ) : null}
    </div>
  );
}
