import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import { SimpleTable } from "./intelligence/intelligenceShared.jsx";
import { downloadOwnerDinerListCsv, getOwnerDinerList } from "../../lib/ownerApi.js";
import { dinerProfilePath } from "./diners/dinerMetricDisplay.js";
import { shortDate } from "./diners/profileDisplay.js";
import { timeAgo } from "./diners/liveDisplay.js";
import { SOURCE_OPTIONS, TIER_NAMES, TIER_OPTIONS, listApiParams, listStateFromParams, sourceName } from "./diners/networkDisplay.js";

/**
 * /owner/diners/list?set=…: the diners behind a Social Network Health or USC number (Stage 6, plan 39).
 * Filters: registration cohort, connection tier, acquisition source (the period and cluster come from the link).
 * Each row opens the diner's profile with period and lifetime numbers. Owner only; CSV has names and emails.
 */

const PAGE_SIZE = 50;
const inputStyle = { padding: "6px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 };

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

export default function OwnerDinerList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const state = listStateFromParams(params);
  const apiParams = listApiParams(state, PAGE_SIZE);
  const paramKey = JSON.stringify(apiParams);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    getOwnerDinerList(apiParams)
      .then((payload) => !cancelled && setData(payload))
      .catch((err) => !cancelled && setError(err?.status === 400 && err.message ? err.message : "This list couldn't be loaded just now."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  };

  const downloadCsv = async () => {
    setBusy(true);
    try {
      saveBlob(await downloadOwnerDinerListCsv({ ...apiParams, page: null, page_size: null }), `menuply-diners-${state.set}-${data?.range?.from || ""}-to-${data?.range?.to || ""}.csv`);
    } catch {
      window.alert("The CSV couldn't be made. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const matched = data?.paging?.matched ?? 0;
  const pages = Math.max(1, Math.ceil(matched / PAGE_SIZE));
  const backTo = state.set.startsWith("usc_") ? "/owner/diners/usc" : "/owner/diners";

  return (
    <OwnerLayout title={data?.title || "Diners"}>
      <div style={{ marginBottom: 12 }}>
        <Link to={backTo} style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>
          ← {state.set.startsWith("usc_") ? "USC launch" : "Diner accounts"}
        </Link>
      </div>
      <PageCard style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: OWNER_COLORS.ink }} data-testid="diner-list-title">{data?.title || "Diners"}</div>
        {data ? (
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
            {matched.toLocaleString("en-US")} diner{matched === 1 ? "" : "s"} · period {shortDate(data.range.from)} through {shortDate(data.range.to)} (Los Angeles days)
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 14 }}>
          <label style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            Joined from <input type="date" data-testid="diner-list-cohort-from" value={state.cohortFrom} onChange={(e) => update({ cohort_from: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            to <input type="date" data-testid="diner-list-cohort-to" value={state.cohortTo} onChange={(e) => update({ cohort_to: e.target.value })} style={inputStyle} />
          </label>
          <select data-testid="diner-list-tier" value={state.tier} onChange={(e) => update({ tier: e.target.value })} style={inputStyle}>
            {TIER_OPTIONS.map(([k, label]) => <option key={k || "any"} value={k}>{label}</option>)}
          </select>
          <select data-testid="diner-list-source" value={state.source} onChange={(e) => update({ source: e.target.value })} style={inputStyle}>
            {SOURCE_OPTIONS.map(([k, label]) => <option key={k || "any"} value={k}>{label}</option>)}
          </select>
          <button
            type="button"
            data-testid="diner-list-csv"
            onClick={downloadCsv}
            disabled={busy || !data}
            style={{ border: 0, background: "none", padding: 0, fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink, textDecoration: "underline", cursor: busy || !data ? "default" : "pointer" }}
          >
            {busy ? "Making CSV…" : "Download CSV"}
          </button>
        </div>
        {error ? <div style={{ marginTop: 10, fontSize: 13, color: "#9f1239" }}>{error}</div> : null}
        {!data && !error ? <div style={{ marginTop: 10, fontSize: 13, color: OWNER_COLORS.muted }}>Loading…</div> : null}
      </PageCard>
      {data ? (
        <PageCard style={{ padding: 18 }}>
          <div data-testid="diner-list-table">
            <SimpleTable
              rows={data.rows}
              emptyLabel="No diners match."
              onRowClick={(r) => navigate(dinerProfilePath(r.id, state.range.key === "custom" ? "30d" : state.range.key))}
              columns={[
                ["Diner", "name", (r) => r.name || r.email || `Diner ${r.id}`],
                ["Email", "email", (r) => r.email || "—"],
                ["Joined", "registered_day", (r) => shortDate(r.registered_day)],
                ["Student", "is_student", (r) => (r.is_usc ? "USC" : r.is_student ? "Yes" : "—")],
                ["Connects", "connects"],
                ["Tier", "tier", (r) => TIER_NAMES[r.tier] || "—"],
                ["Source", "source", (r) => sourceName(r.source)],
                ["Social days", "social_days"],
                ["Last activity", "last_activity", (r) => (r.last_activity ? `${r.last_activity.label}, ${timeAgo(r.last_activity.at)}` : "—")],
              ]}
            />
          </div>
          {pages > 1 ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, fontSize: 13 }}>
              <button type="button" disabled={state.page <= 1} onClick={() => update({ page: state.page - 1 })} data-testid="diner-list-prev"
                style={{ border: 0, background: "none", padding: 0, fontWeight: 700, color: state.page <= 1 ? OWNER_COLORS.muted : OWNER_COLORS.ink, cursor: "pointer" }}>Previous</button>
              <span style={{ color: OWNER_COLORS.muted }}>Page {state.page} of {pages}</span>
              <button type="button" disabled={state.page >= pages} onClick={() => update({ page: state.page + 1 })} data-testid="diner-list-next"
                style={{ border: 0, background: "none", padding: 0, fontWeight: 700, color: state.page >= pages ? OWNER_COLORS.muted : OWNER_COLORS.ink, cursor: "pointer" }}>Next</button>
            </div>
          ) : null}
        </PageCard>
      ) : null}
    </OwnerLayout>
  );
}
