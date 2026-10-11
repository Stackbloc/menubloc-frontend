import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  approveMenubotClusterJobs,
  getMenubotClusterRun,
  listKnowledgeBotClusters,
  startMenubotClusterBatch,
} from "../../lib/ownerApi.js";

/**
 * Menubot — Cluster run.
 * Finds menus for a cluster's restaurants in small batches (never the whole
 * cluster at once). Each batch is reviewed; nothing is published until approved.
 */

const STATUS_LABELS = {
  review: "Menu found — review",
  low_confidence: "Low confidence",
  nothing_found: "Nothing found — upload photos/PDF",
  needs_choice: "Needs a choice",
  failed: "Failed",
  queued: "Queued",
  finding: "Finding menu…",
  publishing: "Publishing…",
  published: "Published",
  has_menu: "Already has a menu",
  claimed: "Claimed — operator manages menu",
  not_started: "Not started",
};

const FILTERS = [
  { id: "todo", label: "Needs review", statuses: ["review", "low_confidence", "nothing_found", "needs_choice", "failed"] },
  { id: "batch", label: "In progress", statuses: ["queued", "finding", "publishing"] },
  { id: "not_started", label: "Not started", statuses: ["not_started"] },
  { id: "done", label: "Done", statuses: ["published", "has_menu", "claimed"] },
  { id: "all", label: "All", statuses: null },
];

const APPROVABLE = new Set(["review", "low_confidence"]);

const inputStyle = {
  boxSizing: "border-box",
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontFamily: "inherit",
  fontSize: 14,
  background: "#fff",
};

function primaryButtonStyle({ busy = false, disabled = false } = {}) {
  return {
    border: "none",
    background: OWNER_COLORS.accent,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : busy ? "wait" : "pointer",
    opacity: disabled ? 0.45 : busy ? 0.7 : 1,
  };
}

const secondaryButtonStyle = {
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  borderRadius: 10,
  padding: "6px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const mutedStyle = { color: OWNER_COLORS.muted, fontSize: 13 };

export default function OwnerMenubotClusterRun() {
  const [searchParams, setSearchParams] = useSearchParams();
  const slug = searchParams.get("cluster") || "";

  const [clusters, setClusters] = useState([]);
  const [overview, setOverview] = useState(null);
  const [batchSize, setBatchSize] = useState(10);
  const [filter, setFilter] = useState("todo");
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    listKnowledgeBotClusters()
      .then((data) => setClusters(data?.clusters || []))
      .catch((err) => setError(err?.message || "Could not load clusters"));
  }, []);

  const load = useCallback(async () => {
    if (!slug) {
      setOverview(null);
      return;
    }
    try {
      const data = await getMenubotClusterRun(slug);
      setOverview(data);
      setBatchSize((n) => Math.min(n, data?.batch_size?.max || 15));
    } catch (err) {
      setError(err?.message || "Could not load cluster");
    }
  }, [slug]);

  useEffect(() => {
    setSelected(new Set());
    setNotice("");
    setError("");
    load();
  }, [load]);

  // Poll while a batch is running.
  useEffect(() => {
    if (!overview?.running) {
      setNotice((n) => (n.startsWith("Batch ") || n.startsWith("Resumed ") ? "Batch finished — review the restaurants below." : n));
      return undefined;
    }
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [overview?.running, load]);

  async function run(kind, fn) {
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setBusy("");
    }
  }

  function handleStartBatch() {
    run("batch", async () => {
      const data = await startMenubotClusterBatch(slug, batchSize);
      setNotice(
        data.resumed
          ? `Resumed ${data.resumed} unfinished restaurant${data.resumed === 1 ? "" : "s"} from the last batch.`
          : `Batch ${data.batch_no}: finding menus for ${data.queued.length} restaurant${data.queued.length === 1 ? "" : "s"}. This page refreshes while it runs.`
      );
      setFilter("batch");
      await load();
    });
  }

  function handleApprove(jobIds) {
    if (!jobIds.length) return;
    run("approve", async () => {
      const data = await approveMenubotClusterJobs(slug, jobIds);
      const ok = data.results.filter((r) => r.ok).length;
      const failed = data.results.filter((r) => !r.ok);
      setNotice(
        `Published ${ok} menu${ok === 1 ? "" : "s"}.` +
          (failed.length ? ` ${failed.length} not published: ${failed.map((f) => `${f.restaurant_name || f.job_id} (${f.error})`).join("; ")}` : "")
      );
      setSelected(new Set());
      await load();
    });
  }

  const rows = overview?.rows || [];
  const visibleRows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    return f?.statuses ? rows.filter((r) => f.statuses.includes(r.status)) : rows;
  }, [rows, filter]);

  const credibleJobIds = rows
    .filter((r) => r.status === "review" && !r.possible_duplicates.length)
    .map((r) => r.job.id);
  const counts = overview?.counts || {};
  const needsMenu = (counts.not_started || 0);

  function toggle(jobId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  return (
    <OwnerLayout
      title="Menubot — Cluster run"
      actions={
        <Link to="/owner/menubot" style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}>
          Single restaurant
        </Link>
      }
    >
      <div style={{ display: "grid", gap: 20 }}>
        <PageCard style={{ padding: "22px 24px" }}>
          <SectionTitle
            title="Find menus for a cluster"
            subtitle="Menubot works through the cluster a small batch at a time, only for restaurants without a menu. Review each batch — nothing is published until you approve it."
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select
              aria-label="Cluster"
              value={slug}
              onChange={(e) => setSearchParams(e.target.value ? { cluster: e.target.value } : {})}
              style={{ ...inputStyle, flex: "1 1 240px", minWidth: 0 }}
            >
              <option value="">Choose a cluster…</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                  {c.city ? ` — ${c.city}${c.state ? `, ${c.state}` : ""}` : ""}
                </option>
              ))}
            </select>
          </div>

          {overview ? (
            <>
              <div style={{ ...mutedStyle, marginTop: 14 }}>
                {rows.length} restaurants · {counts.has_menu || 0} already have a menu · {counts.published || 0} published by Menubot ·{" "}
                {needsMenu} not started
                {counts.claimed ? ` · ${counts.claimed} claimed` : ""}
                {overview.last_batch_no ? ` · ${overview.last_batch_no} batch${overview.last_batch_no === 1 ? "" : "es"} run` : ""}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }} htmlFor="menubot-batch-size">
                  Batch size
                </label>
                <select
                  id="menubot-batch-size"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  style={inputStyle}
                >
                  {[5, 10, 15].filter((n) => n <= (overview.batch_size?.max || 15)).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleStartBatch}
                  disabled={Boolean(busy) || overview.running || needsMenu === 0}
                  style={primaryButtonStyle({ busy: busy === "batch", disabled: overview.running || needsMenu === 0 })}
                >
                  {overview.running
                    ? "Batch running…"
                    : needsMenu === 0
                      ? "No restaurants left"
                      : `Find menus for next ${Math.min(batchSize, needsMenu)}`}
                </button>
              </div>
            </>
          ) : null}

          {notice ? <div style={{ marginTop: 14, fontSize: 14, color: OWNER_COLORS.ink }}>{notice}</div> : null}
          {error ? <div style={{ marginTop: 14, color: "#b42318", fontSize: 14, fontWeight: 600 }}>{error}</div> : null}
        </PageCard>

        {overview ? (
          <PageCard style={{ padding: "22px 24px" }}>
            <SectionTitle
              title="Restaurants"
              subtitle="Approve the menus that look right. Open a restaurant in Menubot to add photos or a PDF, choose between matches, or check the menu before publishing."
              action={
                <button
                  type="button"
                  onClick={() => handleApprove(credibleJobIds)}
                  disabled={Boolean(busy) || !credibleJobIds.length}
                  style={primaryButtonStyle({ busy: busy === "approve", disabled: !credibleJobIds.length })}
                  title="Publishes every 'Menu found' row that has no possible duplicate"
                >
                  Approve all credible ({credibleJobIds.length})
                </button>
              }
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {FILTERS.map((f) => {
                const n = f.statuses ? rows.filter((r) => f.statuses.includes(r.status)).length : rows.length;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    style={{
                      ...secondaryButtonStyle,
                      background: filter === f.id ? OWNER_COLORS.accentSoft : "#fff",
                      borderColor: filter === f.id ? OWNER_COLORS.accent : OWNER_COLORS.line,
                    }}
                  >
                    {f.label} ({n})
                  </button>
                );
              })}
            </div>

            {visibleRows.length === 0 ? (
              <EmptyState>No restaurants in this view.</EmptyState>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {visibleRows.map((r) => {
                  const approvable = APPROVABLE.has(r.status) && r.job;
                  return (
                    <div
                      key={r.restaurant_id}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        alignItems: "center",
                        padding: 12,
                        borderRadius: 12,
                        border: `1px solid ${OWNER_COLORS.line}`,
                        background: "#fff",
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Approve ${r.restaurant_name}`}
                        disabled={!approvable || Boolean(busy)}
                        checked={approvable ? selected.has(r.job.id) : false}
                        onChange={() => approvable && toggle(r.job.id)}
                        style={{ width: 18, height: 18 }}
                      />
                      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                        <div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                          {r.restaurant_name} <span style={{ ...mutedStyle, fontWeight: 400 }}>#{r.restaurant_id}</span>
                        </div>
                        <div style={mutedStyle}>
                          {STATUS_LABELS[r.status] || r.status}
                          {r.job && r.job.found_item_count && !["published", "has_menu"].includes(r.status)
                            ? ` · ${r.job.found_item_count} items`
                            : ""}
                          {r.status === "has_menu" ? ` · ${r.menu_item_count} items` : ""}
                          {r.job?.batch_no ? ` · batch ${r.job.batch_no}` : ""}
                        </div>
                        {r.job?.chosen_url && !["has_menu", "published"].includes(r.status) ? (
                          <div style={{ ...mutedStyle, overflowWrap: "anywhere" }}>From {r.job.chosen_url}</div>
                        ) : null}
                        {r.status === "failed" && r.job?.error ? (
                          <div style={{ color: "#b42318", fontSize: 12, overflowWrap: "anywhere" }}>{r.job.error}</div>
                        ) : null}
                        {r.possible_duplicates.length ? (
                          <div style={{ color: "#b54708", fontSize: 12 }}>
                            Possible duplicate of{" "}
                            {r.possible_duplicates.map((d) => `${d.restaurant_name} (#${d.id})`).join(", ")} — check before publishing
                          </div>
                        ) : null}
                      </div>
                      {r.job ? (
                        <Link
                          to={`/owner/menubot?job=${encodeURIComponent(r.job.id)}`}
                          style={{ ...secondaryButtonStyle, textDecoration: "none", color: OWNER_COLORS.ink }}
                        >
                          Open in Menubot
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => handleApprove([...selected])}
                disabled={Boolean(busy) || !selected.size}
                style={primaryButtonStyle({ busy: busy === "approve", disabled: !selected.size })}
              >
                Publish {selected.size} selected
              </button>
              <div style={mutedStyle}>Publishing adds the menu to the restaurant's existing profile. Claimed restaurants are never changed.</div>
            </div>
          </PageCard>
        ) : slug ? null : (
          <EmptyState>Choose a cluster to see its restaurants.</EmptyState>
        )}
      </div>
    </OwnerLayout>
  );
}
