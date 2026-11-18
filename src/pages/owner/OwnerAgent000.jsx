import React, { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { errorStyle, inputStyle, labelStyle, mutedStyle, primaryButtonStyle, secondaryButtonStyle, tdStyle, thStyle } from "./OwnerFranchiseBot.jsx";
import { StatusTag, Tag, TextLink } from "./knowledgeUi.jsx";
import OwnerTeach from "./OwnerTeach.jsx";
import {
  agent000AssignmentAction,
  applyAgent000Proposals,
  createAgent000Assignment,
  decideAgent000Proposals,
  getAgent000Assignment,
  getAgent000History,
  getAgent000ReviewPacket,
  getAgent000Status,
  listAgent000Assignments,
  listAgent000Proposals,
  recordAgent000Review,
} from "../../lib/ownerApi.js";

/**
 * Owner → Agent 000 (plan 55). One workspace for the agent:
 *   Talk         the conversation (database lookups, uploaded files, lessons): the Teach page, embedded
 *   Assignments  work on many items (preset: Nutribot exceptions), progress, pause/resume/cancel, findings
 *   Proposals    changes Agent 000 recommends; nothing happens until the owner approves and applies.
 *                "Copy for ChatGPT" gives a review packet; ChatGPT's verdict is recorded beside it as advice only.
 *   History      what happened, newest first
 *   Status       model, Mac relay, vision model, switches
 */

const TABS = [
  { id: "talk", label: "Talk" },
  { id: "assignments", label: "Assignments" },
  { id: "proposals", label: "Proposals" },
  { id: "history", label: "History" },
  { id: "status", label: "Status" },
];
const small = { fontSize: 12, color: OWNER_COLORS.muted };
const box = { border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: 12, background: "#fff" };
const smallButton = { ...secondaryButtonStyle, padding: "5px 12px", fontSize: 13 };
const FINDING_LABEL = {
  template_found: "Template found", none_fits: "No template fits", no_candidate: "No candidate template", invalid_pick: "Refused pick",
  unreadable_reply: "Unreadable reply", answer: "Answer", clarify: "Question", explain: "Explanation", propose_lesson: "Proposed lesson", error: "Error",
};
const when = (t) => (t ? new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");
const duration = (s) => (s == null ? null : s > 5400 ? `${(s / 3600).toFixed(1)} h` : s > 90 ? `${Math.round(s / 60)} min` : `${s} s`);

function StatusLine({ status }) {
  if (!status) return null;
  const model = (status.models?.profiles || []).find((p) => p.id === status.models?.default) || (status.models?.profiles || [])[0];
  const relay = status.relay;
  const parts = [
    ["Model", model ? (model.available ? `${model.label}: answering` : `${model.label}: ${model.error || "not answering"}`) : "unknown", model?.available],
    ["Vision", status.vision?.configured ? (status.vision.reachable ? `${status.vision.model}: answering` : `${status.vision.model}: not answering`) : "not set up (images read by OCR only)", status.vision?.reachable],
  ];
  // The learning switches are shown (live) by the Talk tab's switch line, not here, so this bar never goes stale.
  if (relay?.token_configured) parts.splice(1, 0, ["Mac relay", relay.online ? `online (seen ${when(relay.last_seen_at)})` : relay.last_seen_at ? `offline since ${when(relay.last_seen_at)}` : "never connected", relay.online]);
  return (
    <div style={{ ...small, display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 12 }}>
      {parts.map(([k, v, ok]) => <span key={k}>{k}: <strong style={{ color: ok ? "#146c2e" : "#b42318" }}>{v}</strong></span>)}
    </div>
  );
}

function NewAssignment({ presets, onCreated }) {
  const [preset, setPreset] = useState("nutribot_exceptions");
  const [text, setText] = useState("");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const start = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await createAgent000Assignment({ preset: preset || null, text: text.trim() || null, limit: limit ? Number(limit) : null });
      setText("");
      await onCreated(r.assignment.id);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <label style={labelStyle} htmlFor="a000-preset">What should Agent 000 work on?</label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select id="a000-preset" value={preset} onChange={(e) => setPreset(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          {(presets || []).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          <option value="">A question (free text)</option>
        </select>
        {preset ? (
          <input aria-label="How many items" placeholder="All items" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} style={{ ...inputStyle, width: 120 }} />
        ) : null}
      </div>
      <textarea aria-label="Assignment note" value={text} onChange={(e) => setText(e.target.value)} placeholder={preset ? "Note (optional)" : "e.g. Which Los Angeles restaurants have menus with no prices?"}
        style={{ ...inputStyle, width: "100%", minHeight: 56, marginTop: 8 }} />
      <div style={{ ...small, margin: "6px 0 8px" }}>
        {preset === "nutribot_exceptions"
          ? "One item at a time: Agent 000 reads the item, looks at the dish templates that match its name, and picks one or says none fits. Confident picks become proposals; nothing changes until you approve and apply them. Franchise items are never included."
          : "One full Agent 000 answer, with database lookups. Lessons it proposes wait for your approval."}
      </div>
      <button type="button" style={primaryButtonStyle({ busy, disabled: !preset && !text.trim() })} disabled={busy || (!preset && !text.trim())} onClick={start}>Start</button>
      {err ? <div style={errorStyle}>{err}</div> : null}
    </div>
  );
}

function AssignmentDetail({ id, onChanged }) {
  const [data, setData] = useState(null);
  const [finding, setFinding] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => getAgent000Assignment(id, { finding: finding || undefined, limit: 200 }).then(setData).catch((e) => setErr(e.message)), [id, finding]);
  useEffect(() => { setData(null); load(); }, [load]);
  const running = data?.assignment?.status === "running" || data?.assignment?.status === "queued";
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [running, load]);
  const act = async (action) => {
    setBusy(true);
    try { await agent000AssignmentAction(id, action); await load(); await onChanged(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  if (!data) return <div style={mutedStyle}>{err || "Loading…"}</div>;
  const a = data.assignment;
  const p = data.progress;
  const findings = a.counts?.findings || {};
  const offline = a.status === "paused" && /offline|didn't answer|budget/i.test(a.error_message || "");
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <strong>#{a.id}</strong> <StatusTag status={a.status} />
        <span style={small}>{p.done.toLocaleString()} of {p.total.toLocaleString()} done{p.failed ? ` · ${p.failed} failed` : ""}{p.eta_seconds ? ` · about ${duration(p.eta_seconds)} left` : ""} · {a.llm_calls} model calls</span>
        <span style={{ marginLeft: "auto" }} />
        {a.status === "running" || a.status === "queued" ? <button type="button" style={smallButton} disabled={busy} onClick={() => act("pause")}>Pause</button> : null}
        {a.status === "paused" || a.status === "failed" ? <button type="button" style={smallButton} disabled={busy} onClick={() => act("resume")}>Resume</button> : null}
        {!["completed", "cancelled"].includes(a.status) ? <TextLink tone="bad" disabled={busy} onClick={() => act("cancel")}>Cancel</TextLink> : null}
      </div>
      <div style={{ ...small, marginTop: 4 }}>{a.objective_text}</div>
      {offline ? <div style={{ ...small, color: "#93370d", marginTop: 4 }}>Paused: the model didn't answer (is the Mac awake and the relay running?). It starts again by itself when the model answers.</div> : null}
      {p.total ? (
        <div style={{ height: 6, background: OWNER_COLORS.line, borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${Math.round((p.done / p.total) * 100)}%`, height: "100%", background: OWNER_COLORS.accent }} />
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "10px 0" }}>
        <TextLink tone={finding ? "muted" : "info"} onClick={() => setFinding("")}>All findings</TextLink>
        {Object.entries(findings).map(([k, n]) => <TextLink key={k} tone={finding === k ? "info" : "muted"} onClick={() => setFinding(k)}>{FINDING_LABEL[k] || k} ({n})</TextLink>)}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={thStyle}>Item</th><th style={thStyle}>Finding</th><th style={thStyle}>Recommendation</th><th style={thStyle}>Why</th></tr></thead>
          <tbody>
            {data.tasks.map((t) => {
              const r = t.result || {};
              const item = t.input || {};
              return (
                <tr key={t.id}>
                  <td style={tdStyle}>
                    {item.name ? <><div style={{ fontWeight: 700 }}>{item.name}</div><div style={small}>{item.restaurant?.name || ""}{item.reason ? ` · ${item.reason.replace(/_/g, " ")}` : ""}</div></> : <div style={{ fontWeight: 700 }}>{item.text}</div>}
                  </td>
                  <td style={tdStyle}>{t.status === "done" ? <Tag tone={r.finding === "template_found" || r.finding === "answer" ? "ok" : r.finding === "invalid_pick" ? "bad" : "muted"}>{FINDING_LABEL[r.finding] || r.finding}</Tag> : <StatusTag status={t.status} />}{r.confidence ? <div style={small}>{r.confidence} confidence</div> : null}</td>
                  <td style={tdStyle}>{r.recommendation?.template_name ? <>{r.recommendation.template_name}<div style={small}>{r.approval_id ? `Proposal #${r.approval_id}` : "Not proposed (low confidence)"}</div></> : r.conversation_id ? <Link to={`/owner/agent-000/talk/${r.conversation_id}`}>Open in Talk ›</Link> : "—"}</td>
                  <td style={{ ...tdStyle, maxWidth: 420 }}>{r.summary || t.error_message || ""}{r.flags?.length ? <div style={{ ...small, color: "#93370d" }}>Item text flagged ({r.flags.join(", ")}); treated as data.</div> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.tasks_total > data.tasks.length ? <div style={{ ...small, marginTop: 6 }}>Showing {data.tasks.length} of {data.tasks_total.toLocaleString()}.</div> : null}
      {err ? <div style={errorStyle}>{err}</div> : null}
    </div>
  );
}

function AssignmentsTab({ status }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const load = useCallback(() => listAgent000Assignments().then((r) => { setList(r.assignments); setOpen((o) => o || r.assignments[0]?.id || null); }).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", gap: 16 }} className="a000-grid">
      <style>{"@media (max-width: 1000px) { .a000-grid { grid-template-columns: minmax(0,1fr) !important; } }"}</style>
      <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <PageCard><SectionTitle title="New assignment" /><NewAssignment presets={status?.presets} onCreated={async (id) => { await load(); setOpen(id); }} /></PageCard>
        <PageCard>
          <SectionTitle title="Assignments" />
          {!list ? <div style={mutedStyle}>Loading…</div> : !list.length ? <div style={mutedStyle}>None yet.</div> : (
            <div style={{ display: "grid", gap: 6 }}>
              {list.map((a) => (
                <button key={a.id} type="button" onClick={() => setOpen(a.id)}
                  style={{ ...box, padding: 8, textAlign: "left", cursor: "pointer", borderColor: String(open) === String(a.id) ? OWNER_COLORS.accent : OWNER_COLORS.line }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}><strong>#{a.id}</strong><StatusTag status={a.status} />{a.proposals_pending ? <Tag tone="warn">{a.proposals_pending} to review</Tag> : null}</div>
                  <div style={{ ...small, marginTop: 2 }}>{a.objective_text.slice(0, 120)}</div>
                  <div style={small}>{(a.done_live ?? a.counts?.done ?? 0).toLocaleString()} of {(a.plan?.items || 0).toLocaleString()} · {when(a.created_at)}</div>
                </button>
              ))}
            </div>
          )}
        </PageCard>
      </div>
      <PageCard>{open ? <AssignmentDetail id={open} onChanged={load} /> : <div style={mutedStyle}>Start an assignment, or pick one on the left.</div>}</PageCard>
    </div>
  );
}

function ReviewBox({ kind, id, onSaved }) {
  const [packet, setPacket] = useState(null);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const copy = async () => {
    setErr("");
    try {
      const p = await getAgent000ReviewPacket(kind, id);
      setPacket(p);
      await navigator.clipboard?.writeText(`${p.brief}\n\nPacket JSON:\n${JSON.stringify(p.packet, null, 2)}`).then(() => setMsg("Copied. Paste it into ChatGPT, then paste its reply below.")).catch(() => setMsg("Select the text below and copy it."));
    } catch (e) { setErr(e.message); }
  };
  const save = async () => {
    setBusy(true);
    setErr("");
    try { await recordAgent000Review(kind, id, { pasted }); setPasted(""); setMsg("ChatGPT's verdict is recorded. It doesn't approve anything; your click does."); await onSaved(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div style={{ ...box, background: "#fafbff", marginTop: 8 }}>
      <TextLink onClick={copy}>Copy for ChatGPT review</TextLink>
      {msg ? <div style={{ ...small, marginTop: 4 }}>{msg}</div> : null}
      {packet && !navigator.clipboard ? <textarea readOnly aria-label="Review packet" value={`${packet.brief}\n\n${JSON.stringify(packet.packet, null, 2)}`} style={{ ...inputStyle, width: "100%", minHeight: 120, marginTop: 6, fontSize: 12 }} /> : null}
      <textarea aria-label="ChatGPT's reply" value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder={"Paste ChatGPT's reply (VERDICT: approve | reject | unsure, NOTES: …)"} style={{ ...inputStyle, width: "100%", minHeight: 56, marginTop: 6 }} />
      <button type="button" style={{ ...smallButton, marginTop: 6 }} disabled={busy || !pasted.trim()} onClick={save}>Record verdict</button>
      {err ? <div style={errorStyle}>{err}</div> : null}
    </div>
  );
}

function ProposalsTab() {
  const [status, setStatus] = useState("pending");
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => listAgent000Proposals({ status: status || undefined, limit: 200 }).then(setData).catch((e) => setErr(e.message)), [status]);
  useEffect(() => { setSelected(new Set()); load(); }, [load]);
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const ids = [...selected];
  const run = async (fn) => {
    setBusy(true);
    setErr("");
    try { const r = await fn(); setResults(r.results); setSelected(new Set()); await load(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <PageCard>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        {["pending", "approved", "executed", "rejected", "failed", ""].map((s) => (
          <TextLink key={s || "all"} tone={status === s ? "info" : "muted"} onClick={() => setStatus(s)}>{s ? `${s === "executed" ? "Applied" : s.charAt(0).toUpperCase() + s.slice(1)}${data?.counts?.[s] != null ? ` (${data.counts[s]})` : ""}` : "All"}</TextLink>
        ))}
        <span style={{ marginLeft: "auto" }} />
        {status === "pending" ? <>
          <button type="button" style={primaryButtonStyle({ busy, disabled: !ids.length })} disabled={busy || !ids.length} onClick={() => run(() => decideAgent000Proposals(ids, true))}>Approve {ids.length || ""}</button>
          <button type="button" style={smallButton} disabled={busy || !ids.length} onClick={() => run(() => decideAgent000Proposals(ids, false))}>Reject</button>
        </> : null}
        {status === "approved" ? <button type="button" style={primaryButtonStyle({ busy, disabled: !ids.length })} disabled={busy || !ids.length} onClick={() => run(() => applyAgent000Proposals(ids))}>Apply {ids.length || ""}</button> : null}
      </div>
      <div style={{ ...small, marginBottom: 8 }}>Approve first, then apply. Applying runs the normal Nutribot assignment for that item and recalculates its nutrition. Franchise items are always refused.</div>
      {results ? (
        <div style={{ ...box, marginBottom: 10 }}>
          {results.map((r) => <div key={r.id} style={{ fontSize: 13 }}>#{r.id}: {r.ok ? (r.result?.results ? r.result.results.map((x) => `${x.name || x.menu_item_id}: ${x.message}`).join("; ") : r.approval?.status || "done") : <span style={{ color: "#b42318" }}>{r.error}</span>}</div>)}
          <TextLink tone="muted" onClick={() => setResults(null)}>Close</TextLink>
        </div>
      ) : null}
      {!data ? <div style={mutedStyle}>{err || "Loading…"}</div> : !data.proposals.length ? <div style={mutedStyle}>Nothing here.</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={thStyle} /><th style={thStyle}>Proposal</th><th style={thStyle}>Agent 000</th><th style={thStyle}>ChatGPT</th><th style={thStyle}>Status</th></tr></thead>
            <tbody>
              {data.proposals.map((p) => {
                const r = p.task_result || {};
                const review = (p.external_reviews || []).slice(-1)[0];
                const selectable = ["pending", "approved"].includes(p.status);
                return (
                  <React.Fragment key={p.id}>
                    <tr>
                      <td style={tdStyle}>{selectable ? <input type="checkbox" aria-label={`Select proposal ${p.id}`} checked={selected.has(p.id)} onChange={() => toggle(p.id)} /> : null}</td>
                      <td style={tdStyle}><div style={{ fontWeight: 700 }}>{p.summary}</div><div style={small}>#{p.id} · assignment #{p.objective_id} · {when(p.requested_at)}</div></td>
                      <td style={{ ...tdStyle, maxWidth: 380 }}>{r.confidence ? <Tag tone={r.confidence === "high" ? "ok" : "warn"}>{r.confidence}</Tag> : null} {r.summary}<div><TextLink onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? "Hide evidence" : "Evidence + review"}</TextLink></div></td>
                      <td style={tdStyle}>{review ? <><Tag tone={review.verdict === "approve" ? "ok" : review.verdict === "reject" ? "bad" : "muted"}>{review.verdict}</Tag><div style={small}>{review.notes.slice(0, 120)}</div></> : <span style={small}>Not reviewed</span>}</td>
                      <td style={tdStyle}><StatusTag status={p.status === "executed" ? "applied" : p.status} />{p.decided_at ? <div style={small}>{when(p.decided_at)}</div> : null}</td>
                    </tr>
                    {open === p.id ? (
                      <tr><td colSpan={5} style={tdStyle}>
                        <div style={small}>Candidates Agent 000 could choose from: {(r.candidates || []).map((c) => `${c.cite} ${c.name}`).join(" · ") || "—"}</div>
                        {r.unknowns?.length ? <div style={small}>Unknowns: {r.unknowns.join("; ")}</div> : null}
                        <ReviewBox kind="action" id={p.id} onSaved={load} />
                      </td></tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {err ? <div style={errorStyle}>{err}</div> : null}
    </PageCard>
  );
}

function HistoryTab() {
  const [rows, setRows] = useState(null);
  useEffect(() => { getAgent000History(150).then((r) => setRows(r.history)).catch(() => setRows([])); }, []);
  return (
    <PageCard>
      {!rows ? <div style={mutedStyle}>Loading…</div> : !rows.length ? <div style={mutedStyle}>Nothing yet.</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={thStyle}>When</th><th style={thStyle}>What</th><th style={thStyle}>Who</th><th style={thStyle}>Detail</th></tr></thead>
          <tbody>
            {rows.map((h) => (
              <tr key={`${h.source}-${h.id}`}>
                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{when(h.at)}</td>
                <td style={tdStyle}>{h.action.replace(/_/g, " ")}<div style={small}>{h.source === "agent" ? `assignment #${h.ref}` : h.ref}</div></td>
                <td style={tdStyle}>{h.actor === "owner" ? `owner${h.operator_id ? ` #${h.operator_id}` : ""}` : h.actor}</td>
                <td style={{ ...tdStyle, ...small, maxWidth: 520, wordBreak: "break-word" }}>{h.detail ? JSON.stringify(h.detail).slice(0, 220) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PageCard>
  );
}

function StatusTab({ status, reload }) {
  if (!status) return <div style={mutedStyle}>Loading…</div>;
  const relay = status.relay;
  return (
    <PageCard>
      <SectionTitle title="Connection" action={<TextLink onClick={reload}>Check again</TextLink>} />
      <StatusLine status={status} />
      <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {(status.models?.profiles || []).map((p) => <tr key={p.id}><td style={tdStyle}>{p.label}</td><td style={tdStyle}>{p.available ? "answering" : p.error || "not answering"}{p.digest ? <span style={small}> · {p.digest}</span> : null}</td></tr>)}
          <tr><td style={tdStyle}>Vision model</td><td style={tdStyle}>{status.vision?.configured ? `${status.vision.model} (${status.vision.transport})${status.vision.reachable ? ", answering" : ", not answering"}` : "Not set up: images are read by OCR only."}</td></tr>
          <tr><td style={tdStyle}>Mac relay</td><td style={tdStyle}>{relay?.token_configured ? `${relay.online ? "online" : "offline"}${relay.last_seen_at ? `, last seen ${when(relay.last_seen_at)}` : ""}${relay.model ? ` · serves ${relay.model}` : ""}${relay.queue ? ` · queue ${relay.queue.queued || 0}, running ${relay.queue.running || 0}` : ""}` : "Not used here (the model is called directly)."}</td></tr>
          <tr><td style={tdStyle}>Assignments running</td><td style={tdStyle}>{status.assignments_running ?? "—"}</td></tr>
        </tbody>
      </table>
      <div style={{ ...small, marginTop: 10 }}>Switches are on the Talk tab. The model runs on Andre's Mac; nothing Agent 000 proposes changes data until you approve and apply it.</div>
    </PageCard>
  );
}

export default function OwnerAgent000() {
  const { tab = "talk" } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const loadStatus = useCallback(() => getAgent000Status().then(setStatus).catch(() => setStatus({})), []);
  useEffect(() => { loadStatus(); }, [loadStatus]);
  const current = TABS.find((t) => t.id === tab) ? tab : "talk";
  useEffect(() => { if (current !== tab) navigate("/owner/agent-000", { replace: true }); }, [current, tab, navigate]);
  return (
    <OwnerLayout title="Agent 000" actions={<span style={{ display: "flex", gap: 14 }}><Link to="/owner/knowledge" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>Knowledge Library ›</Link><Link to="/owner/training-lab" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>Training Lab ›</Link></span>}>
      <nav aria-label="Agent 000 sections" style={{ display: "flex", gap: 20, borderBottom: `1px solid ${OWNER_COLORS.line}`, marginBottom: 12, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <NavLink key={t.id} to={t.id === "talk" ? "/owner/agent-000" : `/owner/agent-000/${t.id}`} end={t.id === "talk"}
            style={() => ({ padding: "8px 0", fontWeight: 700, fontSize: 14, textDecoration: "none", color: current === t.id ? OWNER_COLORS.ink : OWNER_COLORS.muted, borderBottom: current === t.id ? `2px solid ${OWNER_COLORS.accent}` : "2px solid transparent" })}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <StatusLine status={status} />
      {current === "talk" ? <OwnerTeach embedded basePath="/owner/agent-000/talk" /> : null}
      {current === "assignments" ? <AssignmentsTab status={status} /> : null}
      {current === "proposals" ? <ProposalsTab /> : null}
      {current === "history" ? <HistoryTab /> : null}
      {current === "status" ? <StatusTab status={status} reload={loadStatus} /> : null}
    </OwnerLayout>
  );
}
