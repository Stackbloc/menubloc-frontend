import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { formatApiErrorForDisplay } from "../../lib/apiErrorDisplay.js";
import {
  FEEDBACK_CATEGORIES,
  createOwnerFeedbackIssue,
  getOwnerFeedbackIssue,
  getOwnerFeedbackSuggestions,
  getOwnerFeedbackSummary,
  linkOwnerFeedbackSubmission,
  listOwnerFeedbackIssues,
  listOwnerFeedbackSubmissions,
  reviewOwnerFeedbackSubmission,
  unlinkOwnerFeedbackSubmission,
  updateOwnerFeedbackIssue,
} from "../../lib/feedbackApi.js";

const PRIORITIES = [
  { value: "critical", label: "Critical", hint: "Security, privacy, data problems, or a major failure" },
  { value: "high", label: "High", hint: "Repeated problems stopping people from using key features" },
  { value: "medium", label: "Medium", hint: "Real usability problems or often-requested improvements" },
  { value: "low", label: "Low", hint: "Minor, cosmetic, or one person's preference" },
];
const STATUSES = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "planned", label: "Planned" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];
const CAT_LABEL = Object.fromEntries(FEEDBACK_CATEGORIES.map((c) => [c.value, c.label]));
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));
const TABS = [
  { id: "summary", label: "Summary" },
  { id: "inbox", label: "Inbox" },
  { id: "issues", label: "Issues" },
];

/** Owner → Feedback: what people report, what repeats, what to fix first, what's done. */
export default function OwnerFeedback() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === searchParams.get("tab")) ? searchParams.get("tab") : "summary";
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    getOwnerFeedbackSummary(days)
      .then((json) => { setSummary(json); setError(""); })
      .catch((err) => setError(formatApiErrorForDisplay(err)));
  }, [days, refreshKey]);

  const go = (next, extra = {}) => setSearchParams({ tab: next, ...extra });

  return (
    <OwnerLayout
      title="Feedback"
      actions={(
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={inputStyle} aria-label="Summary range">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      )}
    >
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 18 }}>
        <Metric label="Total feedback" value={summary?.total_submissions} sub={summary ? `${summary.received} in ${days} days` : null} />
        <Metric label="New (not looked at)" value={summary?.new_submissions} onClick={() => go("inbox", { state: "new" })} />
        <Metric label="Open issues" value={summary?.open_issues} onClick={() => go("issues")} />
        <Metric label="High priority open" value={summary?.high_priority_open} tone={summary?.high_priority_open ? "alert" : null} onClick={() => go("issues")} />
        <Metric label={`Resolved (${days} days)`} value={summary?.resolved?.length} />
      </div>

      <div role="tablist" style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => go(t.id)} style={{ ...tabStyle, ...(tab === t.id ? tabOn : null) }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summary" ? <SummaryTab summary={summary} days={days} onOpenIssue={(id) => go("issues", { issue: String(id) })} /> : null}
      {tab === "inbox" ? <InboxTab onChanged={refresh} /> : null}
      {tab === "issues" ? <IssuesTab onChanged={refresh} /> : null}
    </OwnerLayout>
  );
}

// ───────────────────────────── Summary ─────────────────────────────

function SummaryTab({ summary, days, onOpenIssue }) {
  if (!summary) return <Loading />;
  const max = Math.max(1, ...summary.by_category.map((c) => c.n));
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 18 }}>
        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Feedback by category" subtitle={`${plural(summary.received, "report")} from ${plural(summary.received_people, "person", "people")} in the last ${days} days`} />
          <div style={{ display: "grid", gap: 10 }}>
            {summary.by_category.map((c) => (
              <div key={c.category}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>{c.label}</span><strong>{c.n}</strong>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#f2e8e1", marginTop: 4 }}>
                  <div style={{ width: `${(c.n / max) * 100}%`, height: 8, borderRadius: 4, background: "#9f3a22" }} />
                </div>
              </div>
            ))}
          </div>
        </PageCard>
        <IssueListCard
          title="Most reported"
          subtitle={`Issues with the most reports in the last ${days} days`}
          rows={summary.top_issues}
          empty="No reports linked to issues yet."
          right={(i) => `${plural(i.reports_in_range, "report")} · ${plural(i.people_in_range, "person", "people")}`}
          onOpen={onOpenIssue}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 18 }}>
        <IssueListCard
          title="Repeating this week"
          subtitle="Open issues with 2 or more reports in the last 7 days"
          rows={summary.recurring}
          empty="Nothing is repeating right now."
          right={(i) => `${i.reports_7d} this week`}
          onOpen={onOpenIssue}
        />
        <IssueListCard
          title="Top 5 unresolved"
          subtitle="Highest priority first, then most reports"
          rows={summary.top_unresolved}
          empty="No open issues."
          right={(i) => plural(i.report_count, "report")}
          onOpen={onOpenIssue}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 18 }}>
        <IssueListCard title="New high-priority" subtitle={`Created in the last ${days} days`} rows={summary.new_high_priority} empty="None." right={(i) => formatDate(i.created_at)} onOpen={onOpenIssue} />
        <IssueListCard title="Resolved" subtitle={`In the last ${days} days`} rows={summary.resolved} empty="None yet." right={(i) => formatDate(i.resolved_at)} onOpen={onOpenIssue} />
        <IssueListCard title="Reopened" subtitle={`In the last ${days} days`} rows={summary.reopened} empty="None." right={(i) => formatDate(i.last_reopened_at)} onOpen={onOpenIssue} />
      </div>
    </div>
  );
}

function IssueListCard({ title, subtitle, rows, empty, right, onOpen }) {
  return (
    <PageCard style={{ padding: 22 }}>
      <SectionTitle title={title} subtitle={subtitle} />
      {!rows?.length ? <EmptyState>{empty}</EmptyState> : (
        <div style={{ display: "grid", gap: 2 }}>
          {rows.map((i) => (
            <button key={i.id} type="button" onClick={() => onOpen(i.id)} style={listRow}>
              <PriorityBadge priority={i.priority} />
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</span>
              <span style={{ color: "#667085", fontSize: 13, whiteSpace: "nowrap" }}>{right(i)}</span>
            </button>
          ))}
        </div>
      )}
    </PageCard>
  );
}

// ───────────────────────────── Inbox ─────────────────────────────

function InboxTab({ onChanged }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    state: searchParams.get("state") || "all",
    category: searchParams.get("category") || "",
    platform: searchParams.get("platform") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    q: searchParams.get("q") || "",
  };
  const selectedId = searchParams.get("id") || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("id");
    setSearchParams(next);
  };
  const select = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("id", String(id)); else next.delete("id");
    setSearchParams(next);
  };

  const key = JSON.stringify(filters);
  useEffect(() => {
    listOwnerFeedbackSubmissions({ ...filters, state: filters.state === "all" ? "" : filters.state, limit: 200 })
      .then((json) => { setData(json); setError(""); })
      .catch((err) => setError(formatApiErrorForDisplay(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reload]);

  const changed = () => { setReload((r) => r + 1); onChanged(); };
  const selected = data?.submissions?.find((s) => String(s.id) === selectedId) || null;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select value={filters.state} onChange={(e) => setFilter("state", e.target.value === "all" ? "" : e.target.value)} style={inputStyle} aria-label="Show">
          <option value="all">All feedback</option>
          <option value="new">New (not looked at)</option>
          <option value="unlinked">Not in an issue</option>
          <option value="linked">In an issue</option>
        </select>
        <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} style={inputStyle} aria-label="Category">
          <option value="">Every category</option>
          {FEEDBACK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filters.platform} onChange={(e) => setFilter("platform", e.target.value)} style={inputStyle} aria-label="Platform">
          <option value="">Every platform</option>
          <option value="ios">iPhone</option>
          <option value="android">Android</option>
          <option value="web">Web</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} style={inputStyle} aria-label="From date" />
        <input type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} style={inputStyle} aria-label="To date" />
        <input defaultValue={filters.q} placeholder="Search words" onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", e.currentTarget.value.trim()); }} onBlur={(e) => setFilter("q", e.currentTarget.value.trim())} style={inputStyle} aria-label="Search feedback" />
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      {selected ? <SubmissionDetail sub={selected} onClose={() => select(null)} onChanged={changed} /> : null}

      <PageCard style={{ padding: 22 }}>
        <SectionTitle title="Inbox" subtitle={data ? `${plural(data.total, "report")}, newest first. Click one to read it and group it.` : "Newest first."} />
        {!data ? <Loading /> : !data.submissions.length ? <EmptyState>No feedback matches these filters.</EmptyState> : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr>{["When", "Category", "Message", "From", "Issue"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {data.submissions.map((s) => (
                  <tr key={s.id} onClick={() => select(s.id)} style={{ cursor: "pointer", background: String(s.id) === selectedId ? "#fff6ef" : undefined }}>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {!s.reviewed_at && !s.issue_id ? <span style={newDot} title="New" /> : null}
                      {formatDate(s.created_at)}
                    </td>
                    <td style={tdStyle}>{s.category_label}</td>
                    <td style={{ ...tdStyle, maxWidth: 420 }}><div style={clamp2}>{s.message}</div></td>
                    <td style={{ ...tdStyle, color: "#667085", fontSize: 13 }}>{senderLabel(s)}</td>
                    <td style={tdStyle}>{s.issue_id ? <span style={{ fontSize: 13 }}>#{s.issue_id} {s.issue_title}</span> : <span style={{ color: "#98a2b3" }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </div>
  );
}

function SubmissionDetail({ sub, onClose, onChanged }) {
  const [, setSearchParams] = useSearchParams();
  const [suggestions, setSuggestions] = useState(null);
  const [openIssues, setOpenIssues] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(sub.suggested_priority);
  const [linkTo, setLinkTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef(null);

  useEffect(() => {
    setTitle(sub.message.replace(/\s+/g, " ").slice(0, 80));
    setPriority(sub.suggested_priority);
    setLinkTo("");
    setError("");
    setSuggestions(null);
    panelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    getOwnerFeedbackSuggestions(sub.id).then(setSuggestions).catch(() => setSuggestions({ issues: [], submissions: [] }));
    listOwnerFeedbackIssues({ status: "all", limit: 300 }).then((r) => setOpenIssues(r.issues || [])).catch(() => setOpenIssues([]));
  }, [sub.id, sub.message, sub.suggested_priority]);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      onChanged();
    } catch (err) {
      if (err?.status === 409 && err?.payload?.issue_id) {
        setError(`Already part of issue #${err.payload.issue_id}.`);
        onChanged();
      } else setError(formatApiErrorForDisplay(err));
    } finally {
      setBusy(false);
    }
  };

  const openIssue = (id) => setSearchParams({ tab: "issues", issue: String(id) });

  return (
    <div ref={panelRef} style={{ scrollMarginTop: 16 }}>
      <PageCard style={{ padding: 22, border: "1px solid #f0c9b3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ color: "#667085", fontSize: 13 }}>
            #{sub.id} · {sub.category_label} · {formatDate(sub.created_at)}
          </div>
          <button type="button" onClick={onClose} style={smallButton}>Close</button>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "12px 0" }}>{sub.message}</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#667085", fontSize: 13 }}>
          <span>From: {senderLabel(sub)}</span>
          {sub.screen ? <span>Screen: <code>{sub.screen}</code></span> : null}
          {sub.app_version ? <span>App {sub.app_version}</span> : null}
          <span>Suggested priority: <PriorityBadge priority={sub.suggested_priority} /></span>
        </div>
        {error ? <div style={{ marginTop: 12 }}><Banner tone="error">{error}</Banner></div> : null}

        {sub.issue_id ? (
          <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span>In issue <button type="button" style={linkButton} onClick={() => openIssue(sub.issue_id)}>#{sub.issue_id} {sub.issue_title}</button> ({STATUS_LABEL[sub.issue_status] || sub.issue_status})</span>
            <button type="button" disabled={busy} style={smallButton} onClick={() => run(() => unlinkOwnerFeedbackSubmission(sub.id))}>Remove from issue</button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
            {suggestions?.issues?.length ? (
              <div>
                <div style={fieldLabel}>Looks similar to</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {suggestions.issues.map((i) => (
                    <div key={i.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <PriorityBadge priority={i.priority} />
                      <button type="button" style={linkButton} onClick={() => openIssue(i.id)}>#{i.id} {i.title}</button>
                      <span style={{ color: "#98a2b3", fontSize: 12 }}>shares: {i.shared.slice(0, 5).join(", ")}</span>
                      <button type="button" disabled={busy} style={smallButtonDark} onClick={() => run(() => linkOwnerFeedbackSubmission(sub.id, i.id))}>Add to this issue</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div style={fieldLabel}>Create an issue</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 160))} placeholder="Short title" style={{ ...inputStyle, flex: "1 1 280px" }} aria-label="Issue title" />
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle} aria-label="Priority">
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value} title={p.hint}>{p.label}</option>)}
                </select>
                <button type="button" disabled={busy || !title.trim()} style={smallButtonDark} onClick={() => run(() => createOwnerFeedbackIssue(sub.id, { title: title.trim(), priority }))}>Create issue</button>
              </div>
            </div>

            <div>
              <div style={fieldLabel}>Or add to an existing issue</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select value={linkTo} onChange={(e) => setLinkTo(e.target.value)} style={{ ...inputStyle, flex: "1 1 280px" }} aria-label="Existing issue">
                  <option value="">Pick an issue…</option>
                  {openIssues.map((i) => <option key={i.id} value={i.id}>#{i.id} {i.title} ({STATUS_LABEL[i.status]}, {plural(i.report_count, "report")})</option>)}
                </select>
                <button type="button" disabled={busy || !linkTo} style={smallButtonDark} onClick={() => run(() => linkOwnerFeedbackSubmission(sub.id, Number(linkTo)))}>Add</button>
              </div>
            </div>

            {suggestions?.submissions?.length ? (
              <div>
                <div style={fieldLabel}>Similar reports not in an issue yet</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#344054", fontSize: 14 }}>
                  {suggestions.submissions.map((s) => <li key={s.id} style={{ marginBottom: 4 }}>#{s.id} · {formatDate(s.created_at)} · {s.message.slice(0, 140)}</li>)}
                </ul>
                <div style={{ color: "#98a2b3", fontSize: 12, marginTop: 4 }}>Create the issue first, then add these from the Inbox.</div>
              </div>
            ) : null}

            {!sub.reviewed_at ? (
              <div>
                <button type="button" disabled={busy} style={smallButton} onClick={() => run(() => reviewOwnerFeedbackSubmission(sub.id, true))}>Mark as looked at</button>
              </div>
            ) : null}
          </div>
        )}
      </PageCard>
    </div>
  );
}

// ───────────────────────────── Issues ─────────────────────────────

function IssuesTab({ onChanged }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    status: searchParams.get("status") || "open",
    priority: searchParams.get("priority") || "",
    category: searchParams.get("category") || "",
    recurring: searchParams.get("recurring") || "",
    q: searchParams.get("q") || "",
  };
  const selectedId = searchParams.get("issue") || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };
  const select = (id) => setFilter("issue", id ? String(id) : "");

  const key = JSON.stringify(filters);
  useEffect(() => {
    listOwnerFeedbackIssues(filters).then((json) => { setData(json); setError(""); }).catch((err) => setError(formatApiErrorForDisplay(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reload]);

  const changed = () => { setReload((r) => r + 1); onChanged(); };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} style={inputStyle} aria-label="Status">
          <option value="open">Open (New, Under Review, Planned)</option>
          <option value="done">Resolved or Closed</option>
          <option value="all">All issues</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilter("priority", e.target.value)} style={inputStyle} aria-label="Priority">
          <option value="">Every priority</option>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} style={inputStyle} aria-label="Category">
          <option value="">Every category</option>
          {FEEDBACK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
          <input type="checkbox" checked={filters.recurring === "1"} onChange={(e) => setFilter("recurring", e.target.checked ? "1" : "")} />
          Repeating this week
        </label>
        <input defaultValue={filters.q} placeholder="Search titles" onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", e.currentTarget.value.trim()); }} onBlur={(e) => setFilter("q", e.currentTarget.value.trim())} style={inputStyle} aria-label="Search issues" />
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      {selectedId ? <IssueDetail id={selectedId} onClose={() => select(null)} onChanged={changed} /> : null}

      <PageCard style={{ padding: 22 }}>
        <SectionTitle title="Issues" subtitle="Highest priority first, then most recent activity." />
        {!data ? <Loading /> : !data.issues.length ? <EmptyState>No issues match these filters. Create one from a report in the Inbox.</EmptyState> : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr>{["Priority", "Issue", "Status", "Reports", "People", "Last activity"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {data.issues.map((i) => (
                  <tr key={i.id} onClick={() => select(i.id)} style={{ cursor: "pointer", background: String(i.id) === selectedId ? "#fff6ef" : undefined }}>
                    <td style={tdStyle}><PriorityBadge priority={i.priority} /></td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>#{i.id} {i.title}</div>
                      <div style={{ color: "#667085", fontSize: 12 }}>
                        {i.category_label}
                        {i.recurring ? <span style={repeatTag}>{i.reports_7d} this week</span> : null}
                        {i.reopened_count ? <span style={{ marginLeft: 8 }}>reopened {i.reopened_count}×</span> : null}
                      </div>
                    </td>
                    <td style={tdStyle}>{STATUS_LABEL[i.status] || i.status}</td>
                    <td style={tdStyle}>{i.report_count}</td>
                    <td style={tdStyle}>{i.distinct_reporters}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{formatDate(latest(i.last_activity_at, i.last_report_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </div>
  );
}

function IssueDetail({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    getOwnerFeedbackIssue(id)
      .then((json) => {
        setData(json);
        setError("");
        const i = json.issue;
        setForm({ title: i.title, description: i.description || "", category: i.category, priority: i.priority, status: i.status, owner_notes: i.owner_notes || "" });
      })
      .catch((err) => setError(formatApiErrorForDisplay(err)));
  }, [id, reload]);

  useEffect(() => {
    setSaved("");
    panelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [id]);

  const save = async (patch, note) => {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      await updateOwnerFeedbackIssue(id, patch);
      setSaved(note || "Saved.");
      setReload((r) => r + 1);
      onChanged();
    } catch (err) {
      setError(formatApiErrorForDisplay(err));
    } finally {
      setBusy(false);
    }
  };

  const unlink = async (subId) => {
    setBusy(true);
    try {
      await unlinkOwnerFeedbackSubmission(subId);
      setReload((r) => r + 1);
      onChanged();
    } catch (err) {
      setError(formatApiErrorForDisplay(err));
    } finally {
      setBusy(false);
    }
  };

  const i = data?.issue;
  const done = i && (i.status === "resolved" || i.status === "closed");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div ref={panelRef} style={{ scrollMarginTop: 16 }}>
      <PageCard style={{ padding: 22, border: "1px solid #f0c9b3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            {i ? <PriorityBadge priority={i.priority} /> : null}
            <h2 style={{ fontSize: 19, margin: "8px 0 4px" }}>{i ? `#${i.id} ${i.title}` : "Loading…"}</h2>
            {i ? (
              <div style={{ color: "#667085", fontSize: 13 }}>
                {plural(i.report_count, "report")} from {plural(i.distinct_reporters, "person", "people")} · {i.reports_7d} in the last 7 days
                {i.recurring ? " · repeating" : ""} · created {formatDate(i.created_at)}
                {i.resolved_at ? ` · resolved ${formatDate(i.resolved_at)}` : ""}
                {i.reopened_count ? ` · reopened ${i.reopened_count}×` : ""}
              </div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} style={smallButton}>Close</button>
        </div>
        {error ? <div style={{ marginTop: 12 }}><Banner tone="error">{error}</Banner></div> : null}
        {saved ? <div style={{ marginTop: 12 }}><Banner tone="info">{saved}</Banner></div> : null}

        {form ? (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {done ? (
                <button type="button" disabled={busy} style={smallButtonDark} onClick={() => save({ status: "under_review" }, "Reopened.")}>Reopen</button>
              ) : (
                <button type="button" disabled={busy} style={smallButtonDark} onClick={() => save({ status: "resolved", owner_notes: form.owner_notes }, "Marked resolved.")}>Mark resolved</button>
              )}
            </div>
            <label style={fieldLabel}>Title
              <input value={form.title} onChange={set("title")} maxLength={160} style={{ ...inputStyle, width: "100%", boxSizing: "border-box", marginTop: 4 }} />
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label style={fieldLabel}>Priority
                <select value={form.priority} onChange={set("priority")} style={{ ...inputStyle, display: "block", marginTop: 4 }}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              <label style={fieldLabel}>Status
                <select value={form.status} onChange={set("status")} style={{ ...inputStyle, display: "block", marginTop: 4 }}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label style={fieldLabel}>Category
                <select value={form.category} onChange={set("category")} style={{ ...inputStyle, display: "block", marginTop: 4 }}>
                  {FEEDBACK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
            </div>
            <div style={{ color: "#98a2b3", fontSize: 12 }}>{PRIORITIES.find((p) => p.value === form.priority)?.hint}</div>
            <label style={fieldLabel}>Description
              <textarea value={form.description} onChange={set("description")} rows={3} maxLength={4000} style={textareaStyle} />
            </label>
            <label style={fieldLabel}>Internal notes (only Owner sees these)
              <textarea value={form.owner_notes} onChange={set("owner_notes")} rows={3} maxLength={8000} placeholder="Why this priority, why deferred, how it was fixed…" style={textareaStyle} />
            </label>
            <div>
              <button
                type="button"
                disabled={busy || !form.title.trim()}
                style={smallButtonDark}
                onClick={() => save({ title: form.title, description: form.description, category: form.category, priority: form.priority, status: form.status, owner_notes: form.owner_notes })}
              >
                Save changes
              </button>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={fieldLabel}>Reports in this issue ({data.submissions.length})</div>
              {!data.submissions.length ? <EmptyState>No reports linked.</EmptyState> : (
                <div style={{ display: "grid", gap: 8 }}>
                  {data.submissions.map((s) => (
                    <div key={s.id} style={{ padding: 12, borderRadius: 10, background: "#fbf7f4", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#667085", fontSize: 12 }}>#{s.id} · {formatDate(s.created_at)} · {senderLabel(s)}{s.screen ? ` · ${s.screen}` : ""}</div>
                        <div style={{ fontSize: 14, whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginTop: 4 }}>{s.message}</div>
                      </div>
                      <button type="button" disabled={busy} style={smallButton} onClick={() => unlink(s.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </PageCard>
    </div>
  );
}

// ───────────────────────────── bits ─────────────────────────────

function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.fg, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{PRIORITIES.find((p) => p.value === priority)?.label || priority}</span>;
}

function Metric({ label, value, sub, tone, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} style={{ all: onClick ? "unset" : undefined, cursor: onClick ? "pointer" : undefined, display: "block" }}>
      <PageCard style={{ padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10, color: tone === "alert" ? "#b42318" : undefined }}>{value ?? "—"}</div>
        {sub ? <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>{sub}</div> : null}
      </PageCard>
    </Tag>
  );
}

function Banner({ tone, children }) {
  const colors = tone === "error" ? { background: "#fff1ef", color: "#8b2e1a" } : { background: "#eef4ff", color: "#1d3a8a" };
  return <div style={{ marginBottom: 4, padding: "12px 14px", borderRadius: 12, ...colors }}>{children}</div>;
}

function Loading() {
  return <div style={{ padding: 32, textAlign: "center", color: "#667085", fontSize: 14 }}>Loading…</div>;
}

function senderLabel(s) {
  const who = s.sender === "diner" ? `Diner #${s.consumer_user_id}` : s.sender === "restaurant" ? `Restaurant account #${s.operator_id}` : "Not signed in";
  const where = { ios: "iPhone", android: "Android", web: "Web" }[s.platform];
  return where ? `${who} · ${where}` : who;
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${Number(n) === 1 ? one : many}`;
}

function latest(a, b) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) > new Date(b) ? a : b;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

const PRIORITY_COLORS = {
  critical: { bg: "#fee4e2", fg: "#912018" },
  high: { bg: "#ffead5", fg: "#93370d" },
  medium: { bg: "#fef7c3", fg: "#713b12" },
  low: { bg: "#f2f4f7", fg: "#475467" },
};
const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff", fontSize: 14 };
const textareaStyle = { ...inputStyle, width: "100%", boxSizing: "border-box", marginTop: 4, fontFamily: "inherit", resize: "vertical", fontWeight: 400 };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "0 12px 12px 0", fontSize: 12, color: "#667085" };
const tdStyle = { padding: "12px 12px 12px 0", borderTop: "1px solid #ead9ce", fontSize: 14, verticalAlign: "top" };
const tabStyle = { padding: "8px 16px", borderRadius: 999, border: "1px solid #d7c5b8", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 };
const tabOn = { background: "#1d2939", color: "#fff", borderColor: "#1d2939" };
const smallButton = { padding: "7px 14px", borderRadius: 999, border: "1px solid #d7c5b8", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const smallButtonDark = { ...smallButton, background: "#1d2939", color: "#fff", borderColor: "#1d2939" };
const linkButton = { background: "none", border: 0, padding: 0, color: "#9f3a22", fontWeight: 700, cursor: "pointer", font: "inherit", textAlign: "left" };
const listRow = { boxSizing: "border-box", display: "flex", gap: 10, alignItems: "center", padding: "8px 4px", border: 0, borderTop: "1px solid #f2e8e1", background: "none", cursor: "pointer", textAlign: "left", font: "inherit", width: "100%" };
const fieldLabel = { fontSize: 12, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, display: "block" };
const clamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
const newDot = { display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#9f3a22", marginRight: 6, verticalAlign: "middle" };
const repeatTag = { marginLeft: 8, padding: "1px 6px", borderRadius: 4, background: "#fee4e2", color: "#912018", fontWeight: 700 };
