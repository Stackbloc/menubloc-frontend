import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import { getOwnerClusterCheck, getOwnerClusterCheckRun, startOwnerClusterCheck, undoOwnerClusterCheck } from "../../lib/ownerApi.js";

/**
 * Owner → Bots → Cluster Check (plan 42 step 6).
 * Checks every restaurant in a cluster for missing info, fills in what it's sure of
 * (unclaimed places only, with Undo), then starts Hours Bot, Address Bot and Menubot.
 * A cluster only picks which restaurants to check; Today never changes because of it.
 */

const BOT_PAGES = { hours_bot: "/owner/bots/hours-bot", address_bot: "/owner/bots/address-bot", menubot: "/owner/menubot" };
const BOT_NAMES = { hours_bot: "Hours Bot", address_bot: "Address Bot", menubot: "Menubot" };
const HANDOFF_STATUS = {
  started: "started",
  busy: "already busy; run it again later",
  nothing: "nothing left for it to do",
  skipped: "not started",
  unavailable: "not set up yet",
  error: "couldn't start",
};

const when = (v) => (v ? new Date(v).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

export default function OwnerClusterCheck() {
  const [data, setData] = useState(null);
  const [clusterId, setClusterId] = useState("");
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => getOwnerClusterCheck().then(setData).catch((e) => setError(e?.message || "Could not load")), []);
  const loadDetail = useCallback((id) => getOwnerClusterCheckRun(id).then(setDetail).catch((e) => setError(e?.message || "Could not load this check")), []);

  useEffect(() => {
    load();
  }, [load]);

  const running = (data?.runs || []).find((r) => r.status === "running");
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => {
      load();
      if (openId === running.id) loadDetail(running.id);
    }, 3000);
    return () => clearInterval(t);
  }, [running, load, loadDetail, openId]);

  useEffect(() => {
    if (!openId) return;
    setFilter("");
    loadDetail(openId);
  }, [openId, loadDetail]);

  async function run() {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await startOwnerClusterCheck({ cluster_id: clusterId === "all" ? null : Number(clusterId) });
      setNote(`${res.resumed ? "Picked up" : "Checking"} ${res.label}: ${res.total} restaurants.`);
      await load();
      setOpenId(res.run_id);
    } catch (e) {
      setError(e?.message || "Could not start");
    } finally {
      setBusy(false);
    }
  }

  async function undo(id) {
    setBusy(true);
    setError("");
    try {
      const res = await undoOwnerClusterCheck(id);
      setNote(`${res.undone} put back${res.left ? ` · ${res.left} left alone (changed since)` : ""}.`);
      await Promise.all([load(), loadDetail(id)]);
    } catch (e) {
      setError(e?.message || "Could not undo");
    } finally {
      setBusy(false);
    }
  }

  const clusters = data?.clusters || [];
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };

  return (
    <OwnerLayout title="Cluster Check">
      <div style={{ display: "grid", gap: 16 }}>
        <PageCard style={{ padding: 20 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            <Link to="/owner/bots" style={{ color: OWNER_COLORS.accent, fontWeight: 700, textDecoration: "none" }}>← Bots</Link>
          </div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Cluster Check</h2>
          <p style={{ ...muted, margin: "6px 0 0" }}>
            Checks every restaurant in a cluster for missing hours, cuisine, address, map pin, dishes, website, service and kind of place.
            It fills in a website or cuisine when it's sure (unclaimed restaurants only, with Undo), then starts Hours Bot, Address Bot and Menubot for the rest.
            Clusters only pick which restaurants to check; Today doesn't change because of them.
          </p>
          {data && data.ready === false ? (
            <div style={{ marginTop: 14, fontSize: 13 }}>Not set up yet (migration 0435).</div>
          ) : (
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 16 }}>
              <select value={clusterId} onChange={(e) => setClusterId(e.target.value)} style={select} aria-label="Cluster">
                <option value="">Pick a cluster…</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.restaurant_count != null ? ` (${c.restaurant_count})` : ""}</option>
                ))}
                <option value="all">Every cluster</option>
              </select>
              <button type="button" style={{ ...darkBtn, opacity: clusterId && !busy && !running ? 1 : 0.4 }} disabled={!clusterId || busy || Boolean(running)} onClick={run}>
                Run check
              </button>
              {running ? <span style={muted}>Checking {running.label}… {running.counts?.checked || 0} of {running.total}</span> : null}
            </div>
          )}
          {clusterId === "all" ? <div style={{ ...muted, marginTop: 8 }}>Menubot isn't started for every cluster at once; run one cluster to find menus.</div> : null}
          {note ? <div style={{ ...muted, marginTop: 10 }}>{note}</div> : null}
          {error ? <div style={{ color: "#9f3a22", fontSize: 13, marginTop: 10 }}>{error}</div> : null}
        </PageCard>

        <PageCard style={{ padding: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Recent checks</h3>
          {!data ? <div style={{ ...muted, marginTop: 10 }}>Loading…</div> : null}
          {data && !data.runs?.length ? <div style={{ ...muted, marginTop: 10 }}>No checks yet.</div> : null}
          <div style={{ display: "grid", marginTop: 8 }}>
            {(data?.runs || []).map((r) => (
              <button key={r.id} type="button" onClick={() => setOpenId(openId === r.id ? null : r.id)} style={{ ...rowBtn, background: openId === r.id ? OWNER_COLORS.page : "transparent" }}>
                <span style={{ fontWeight: 700 }}>{r.label}</span>
                <span style={muted}>
                  {when(r.started_at)} · {r.status === "running" ? `checking ${r.counts?.checked || 0} of ${r.total}` : statusText(r)}
                </span>
              </button>
            ))}
          </div>
        </PageCard>

        {openId && detail && detail.run?.id === openId ? (
          <RunDetail detail={detail} filter={filter} setFilter={setFilter} onUndo={() => undo(openId)} busy={busy} />
        ) : null}
      </div>
    </OwnerLayout>
  );
}

function statusText(r) {
  const c = r.counts || {};
  const base = `${c.checked || 0} checked · ${c.with_issues || 0} need something · ${c.filled || 0} filled in`;
  if (r.status === "completed") return base;
  if (r.status === "stopped") return `stopped · ${base}`;
  return `didn't finish · ${base}`;
}

function RunDetail({ detail, filter, setFilter, onUndo, busy }) {
  const { run, issues, restaurants } = detail;
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };
  const filled = restaurants.filter((r) => r.fills.length);
  const canUndo = filled.some((r) => r.fills.some((f) => !f.undone && !f.conflict));
  const shown = useMemo(() => (filter ? restaurants.filter((r) => r.issues.some((i) => i.key === filter)) : restaurants.filter((r) => r.issues.length)), [restaurants, filter]);

  return (
    <PageCard style={{ padding: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>{run.label}</h3>
      <div style={{ ...muted, marginTop: 4 }}>{when(run.started_at)} · {run.status === "running" ? `checking ${run.counts?.checked || 0} of ${run.total}` : statusText(run)}</div>

      {run.handoffs?.length ? (
        <Section title="Other bots started">
          {run.handoffs.map((h) => (
            <div key={h.bot} style={{ fontSize: 13 }}>
              {BOT_PAGES[h.bot] ? <Link to={BOT_PAGES[h.bot]} style={link}>{BOT_NAMES[h.bot]}</Link> : <b>{h.bot}</b>}
              {` · ${h.label}${h.count ? ` (${h.count})` : ""}: ${HANDOFF_STATUS[h.status] || h.status}`}
              {h.message && h.status !== "started" ? <span style={muted}> · {h.message}</span> : null}
            </div>
          ))}
        </Section>
      ) : null}

      {filled.length ? (
        <Section title="Filled in">
          {filled.map((r) => (
            <div key={r.restaurant_id} style={{ fontSize: 13 }}>
              <b>{r.restaurant_name}</b> #{r.restaurant_id}
              {r.fills.map((f) => (
                <div key={f.field} style={muted}>
                  {f.label}: {f.after}{f.undone ? " · put back" : f.conflict ? " · changed since, left alone" : ""} <span>({f.evidence})</span>
                </div>
              ))}
            </div>
          ))}
          {canUndo ? (
            <button type="button" style={{ ...link, justifySelf: "start", opacity: busy ? 0.4 : 1 }} disabled={busy} onClick={onUndo}>Undo fills</button>
          ) : null}
        </Section>
      ) : null}

      {issues.length ? (
        <Section title="What's missing">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
            <button type="button" style={{ ...link, color: filter ? OWNER_COLORS.accent : OWNER_COLORS.ink }} onClick={() => setFilter("")}>All</button>
            {issues.map((i) => (
              <button key={i.key} type="button" style={{ ...link, color: filter === i.key ? OWNER_COLORS.ink : OWNER_COLORS.accent }} onClick={() => setFilter(i.key)}>
                {i.label} ({i.count})
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
            {shown.map((r) => (
              <div key={r.restaurant_id} style={{ fontSize: 13, borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 6 }}>
                <b>{r.restaurant_name}</b> #{r.restaurant_id}{r.claimed ? <span style={muted}> · Claimed</span> : null}
                <div style={muted}>{r.issues.map((i) => i.label).join(" · ")}</div>
              </div>
            ))}
          </div>
        </Section>
      ) : run.status !== "running" ? (
        <div style={{ ...muted, marginTop: 14 }}>Nothing missing.</div>
      ) : null}
    </PageCard>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 16, display: "grid", gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>
      {children}
    </div>
  );
}

const select = { padding: "7px 8px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 13, minWidth: 220 };
const darkBtn = { padding: "8px 18px", borderRadius: 10, border: "none", background: OWNER_COLORS.ink, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const link = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 13, textDecoration: "none" };
const rowBtn = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", textAlign: "left", padding: "10px 8px", border: "none", borderTop: `1px solid ${OWNER_COLORS.line}`, cursor: "pointer", color: OWNER_COLORS.ink, fontSize: 14, borderRadius: 8 };
