import React, { useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { fiApi, SYSTEM_LABELS, SYSTEMS } from "../../../lib/ownerFoodIntelligenceApi.js";
import RecordEditor, { AddRecordForm } from "./RecordEditor.jsx";
import {
  Banner, Btn, ConfirmDialog, DiffList, IssueList, Loading, SummaryLine, Tag,
  inputStyle, linkStyle, recordSub, recordTitle, useLoad, when,
} from "./fiUi.jsx";

/**
 * Owner → Food Intelligence (Phase 1).
 * Versioned editing of the Food Ontology (MKS v2 keys) and MKS (Common Knowledge food types).
 * Publishing records the official version; it does not change live Search/clusters/Similar yet.
 */

const BASE = "/owner/food-intelligence";
const PHASE1_NOTE = "Publishing records the official version. Live Search, clusters and Similar keep using today's data until a separate go-live is approved.";

function errText(err) {
  return err ? err.message || String(err) : "";
}

function SystemTabs({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {SYSTEMS.map((s) => (
        <Btn key={s} small kind={value === s ? "primary" : "plain"} onClick={() => onChange(s)}>{SYSTEM_LABELS[s]}</Btn>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------------------------

function Overview() {
  const { data, loading, error } = useLoad(() => fiApi.overview(), []);
  return (
    <>
      <Banner tone="info">{PHASE1_NOTE}</Banner>
      {error ? <Banner tone="error">{errText(error)}</Banner> : null}
      {loading ? <Loading /> : (
        <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
          {(data?.systems || []).map((s) => (
            <PageCard key={s.system} style={{ padding: 20 }}>
              <SectionTitle title={s.label} subtitle={s.system === "mks" ? "Common Knowledge food types (Search, clusters, Post)" : "MKS v2 numbered keys (Similar and Compare)"} />
              {!s.baseline ? (
                <Banner tone="warn">The original isn't saved yet. <Link to={`${BASE}/checks`}>Save it as version 0</Link> to start.</Banner>
              ) : (
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  <div>Official version: <strong>{s.current.number}</strong> · {s.current.title} · {s.current.record_count} records</div>
                  <div style={{ color: OWNER_COLORS.muted }}>Published {when(s.current.published_at)} by {s.current.published_by}</div>
                  <div>{s.drafts} draft{s.drafts === 1 ? "" : "s"} · {s.published} published version{s.published === 1 ? "" : "s"}</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Link to={`${BASE}/${s.system}`}><Btn small>Browse</Btn></Link>
                <Link to={`${BASE}/versions?system=${s.system}`}><Btn small>Versions</Btn></Link>
              </div>
            </PageCard>
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Browse (Food Ontology / MKS)
// ---------------------------------------------------------------------------------------------

function RecordList({ system, records, selected, onSelect, changedKeys, filter }) {
  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return records.filter((r) => {
      if (changedKeys && filter === "__changed") return changedKeys.has(r.key);
      if (!f) return true;
      return `${r.key} ${recordTitle(system, r.key, r.record)} ${recordSub(system, r.key, r.record)}`.toLowerCase().includes(f);
    });
  }, [records, filter, system, changedKeys]);
  return (
    <div style={{ maxHeight: 560, overflow: "auto", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, background: "#fff" }}>
      {shown.slice(0, 600).map((r) => (
        <button key={r.key} type="button" onClick={() => onSelect(r.key)}
          style={{ display: "flex", width: "100%", textAlign: "left", gap: 8, alignItems: "center", padding: "8px 12px", border: 0, borderBottom: `1px solid ${OWNER_COLORS.line}`, background: selected === r.key ? "#f2f4f7" : "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: r.active ? OWNER_COLORS.ink : OWNER_COLORS.muted }}>
              {system === "food_ontology" && r.kind === "key" ? "  ".repeat((r.record.level || 1) - 1) : ""}{recordTitle(system, r.key, r.record)}
            </span>
            <span style={{ display: "block", fontSize: 11, color: OWNER_COLORS.muted }}>{recordSub(system, r.key, r.record)}</span>
          </span>
          {changedKeys?.has(r.key) ? <Tag tone="info">Edited</Tag> : null}
          {!r.active ? <Tag tone="warn">Off</Tag> : null}
        </button>
      ))}
      {!shown.length ? <div style={{ padding: 14, fontSize: 13, color: OWNER_COLORS.muted }}>Nothing matches.</div> : null}
      {shown.length > 600 ? <div style={{ padding: 10, fontSize: 12, color: OWNER_COLORS.muted }}>Showing 600 of {shown.length}. Search to narrow.</div> : null}
    </div>
  );
}

function Browse() {
  const { system } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const ov = useLoad(() => fiApi.overview(), [system]);
  const sys = ov.data?.systems?.find((s) => s.system === system);
  const rev = useLoad(() => (sys?.current ? fiApi.revision(system, sys.current.id) : Promise.resolve(null)), [system, sys?.current?.id]);
  if (!SYSTEMS.includes(system)) return <EmptyState>Unknown system.</EmptyState>;
  const records = rev.data?.records || [];
  const sel = records.find((r) => r.key === selected);
  async function startDraft() {
    setBusy(true);
    try {
      const out = await fiApi.createDraft(system, `${SYSTEM_LABELS[system]} edits`);
      navigate(`${BASE}/${system}/drafts/${out.revision.id}`);
    } catch (e) {
      setMsg(errText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {msg ? <Banner tone="error">{msg}</Banner> : null}
      {ov.loading || rev.loading ? <Loading /> : !sys?.current ? (
        <Banner tone="warn">The original isn't saved yet. <Link to={`${BASE}/checks`}>Save it as version 0</Link> first.</Banner>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13 }}>
              Viewing official version <strong>{sys.current.number}</strong> ({sys.current.title}) · {records.length} records · {records.filter((r) => !r.active).length} off
            </div>
            <Btn kind="primary" onClick={startDraft} disabled={busy}>✎ Start a draft</Btn>
          </div>
          <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
            <div>
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search name, code or key" style={{ ...inputStyle, width: "100%", marginBottom: 8 }} aria-label="Search records" />
              <RecordList system={system} records={records} selected={selected} onSelect={setSelected} filter={filter} />
            </div>
            <PageCard style={{ padding: 18 }}>
              {sel ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{recordTitle(system, sel.key, sel.record)}</div>
                  <RecordEditor system={system} recordKey={sel.key} record={sel.record} readOnly />
                </>
              ) : <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>Pick a record to see it. To change anything, start a draft.</div>}
            </PageCard>
          </div>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------------------------

function DraftsList() {
  const navigate = useNavigate();
  const lists = useLoad(() => Promise.all(SYSTEMS.map((s) => fiApi.revisions(s).then((r) => r.revisions))), []);
  const [msg, setMsg] = useState(null);
  const drafts = (lists.data || []).flat().filter((r) => r.status === "draft");
  async function start(system) {
    try {
      const out = await fiApi.createDraft(system, `${SYSTEM_LABELS[system]} edits`);
      navigate(`${BASE}/${system}/drafts/${out.revision.id}`);
    } catch (e) {
      setMsg(errText(e));
    }
  }
  return (
    <>
      {msg ? <Banner tone="error">{msg}</Banner> : null}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {SYSTEMS.map((s) => <Btn key={s} onClick={() => start(s)}>✎ New {SYSTEM_LABELS[s]} draft</Btn>)}
      </div>
      {lists.loading ? <Loading /> : !drafts.length ? <EmptyState>No open drafts. Drafts never change the official version until you publish them.</EmptyState> : (
        <PageCard style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}><th style={th}>Draft</th><th style={th}>System</th><th style={th}>Started from</th><th style={th}>Checked</th><th style={th}>Updated</th></tr></thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}` }}>
                  <td style={td}><Link style={linkStyle} to={`${BASE}/${d.system}/drafts/${d.id}`}>{d.number} · {d.title}</Link></td>
                  <td style={td}>{SYSTEM_LABELS[d.system]}</td>
                  <td style={td}>version id {d.parent_revision_id}</td>
                  <td style={td}>{d.validated ? <Tag tone="info">Checked</Tag> : <Tag>Not checked</Tag>}</td>
                  <td style={td}>{when(d.updated_at)} · {d.created_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PageCard>
      )}
    </>
  );
}

function DraftEditor() {
  const { system, id } = useParams();
  const navigate = useNavigate();
  const rev = useLoad(() => fiApi.revision(system, id), [system, id]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [check, setCheck] = useState(null);
  const [panel, setPanel] = useState("edit");
  const [publishing, setPublishing] = useState(false);

  const data = rev.data;
  const records = data?.records || [];
  const changedKeys = useMemo(() => new Set((data?.diff?.changes || []).map((c) => c.record_key)), [data]);
  const sel = records.find((r) => r.key === selected);
  const r = data?.revision;
  const isDraft = r?.status === "draft";
  const lastCheck = check || (data?.last_validation && data.last_validation.snapshot_sha256 === r?.snapshot_sha256 ? data.last_validation : null);

  async function save(ops, confirmBulk = false) {
    setBusy(true);
    setMsg(null);
    try {
      await fiApi.editDraft(system, id, ops, { confirmBulk });
      setCheck(null);
      await rev.reload();
      setMsg({ tone: "ok", text: "Saved to the draft. Nothing official has changed." });
      return true;
    } catch (e) {
      if (e.code === "BULK_CONFIRM_REQUIRED" && window.confirm(`${e.message}`)) return save(ops, true);
      setMsg({ tone: "error", text: errText(e) });
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function runCheck() {
    setBusy(true);
    setMsg(null);
    try {
      const out = await fiApi.validate(system, id);
      setCheck(out.validation);
      setPanel("check");
      await rev.reload();
    } catch (e) {
      setMsg({ tone: "error", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setBusy(true);
    try {
      const out = await fiApi.publish(system, id);
      navigate(`${BASE}/versions?system=${system}&published=${out.revision.number}`);
    } catch (e) {
      setPublishing(false);
      setMsg({ tone: "error", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }
  async function abandon() {
    if (!window.confirm("Throw away this draft? It is kept in history as abandoned.")) return;
    try {
      await fiApi.abandon(system, id);
      navigate(`${BASE}/drafts`);
    } catch (e) {
      setMsg({ tone: "error", text: errText(e) });
    }
  }

  if (rev.loading && !data) return <Loading />;
  if (rev.error) return <Banner tone="error">{errText(rev.error)}</Banner>;
  const validated = r.validated && lastCheck?.ok;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{SYSTEM_LABELS[system]} · {isDraft ? "Draft" : "Version"} {r.number}: {r.title}</div>
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
            {data.diff ? <>Compared with version {data.diff.against_number}: <SummaryLine summary={data.diff.summary} /></> : "Original"}
            {" · "}{isDraft ? (r.validated ? "checked after last edit" : "not checked since last edit") : r.status}
          </div>
        </div>
        {isDraft ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn onClick={() => setPanel("preview")} disabled={busy}>☰ Preview changes</Btn>
            <Btn onClick={runCheck} disabled={busy}>✓ Check draft</Btn>
            <Btn kind="primary" onClick={() => setPublishing(true)} disabled={busy || !validated} title={validated ? "" : "Check the draft first"}>⇪ Publish</Btn>
            <Btn kind="danger" onClick={abandon} disabled={busy}>Discard</Btn>
          </div>
        ) : null}
      </div>
      {msg ? <Banner tone={msg.tone || "error"}>{msg.text || msg}</Banner> : null}
      {!isDraft ? <Banner tone="info">This version is {r.status} and can't be edited.</Banner> : null}

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input value={filter === "__changed" ? "" : filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search records" style={{ ...inputStyle, flex: 1 }} aria-label="Search records" />
            <Btn small kind={filter === "__changed" ? "primary" : "plain"} onClick={() => setFilter(filter === "__changed" ? "" : "__changed")}>Edited ({changedKeys.size})</Btn>
          </div>
          <RecordList system={system} records={records} selected={selected} onSelect={(k) => { setSelected(k); setPanel("edit"); }} changedKeys={changedKeys} filter={filter} />
          {isDraft ? (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 13 }}>＋ Add a new {system === "mks" ? "food type" : "key"}</summary>
              <AddRecordForm system={system} meta={data.meta} keys={records} onAdd={save} busy={busy} />
            </details>
          ) : null}
        </div>
        <PageCard style={{ padding: 18 }}>
          {panel === "check" && lastCheck ? (
            <>
              <SectionTitle title={lastCheck.ok ? "Check passed" : "Check found problems"} subtitle={<SummaryLine summary={lastCheck.summary} />} />
              {lastCheck.ok ? <Banner tone="ok">Ready to publish.</Banner> : <Banner tone="error">Fix these before publishing:<IssueList items={lastCheck.errors} tone="bad" /></Banner>}
              {lastCheck.warnings?.length ? <Banner tone="warn">Worth knowing ({lastCheck.warnings.length}):<IssueList items={lastCheck.warnings} /></Banner> : null}
              <Btn small onClick={() => setPanel("edit")}>Back to editing</Btn>
            </>
          ) : panel === "preview" ? (
            <>
              <SectionTitle title="Changes in this draft" subtitle={data.diff ? <SummaryLine summary={data.diff.summary} /> : null} />
              <DiffList system={system} changes={data.diff?.changes || []} />
              <div style={{ marginTop: 12 }}><Btn small onClick={() => setPanel("edit")}>Back to editing</Btn></div>
            </>
          ) : sel ? (
            <RecordEditor key={`${sel.key}-${r.snapshot_sha256}`} system={system} recordKey={sel.key} record={sel.record} meta={data.meta} readOnly={!isDraft} onSave={save} busy={busy} allKeys={records.filter((x) => x.active && x.kind !== "rule").map((x) => x.key)} />
          ) : (
            <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>Pick a record on the left to edit it.</div>
          )}
        </PageCard>
      </div>

      {publishing ? (
        <ConfirmDialog title={`Publish ${SYSTEM_LABELS[system]} version ${r.number}?`} word="PUBLISH" actionLabel="Publish" busy={busy} onCancel={() => setPublishing(false)} onConfirm={publish}>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div>This becomes the official {SYSTEM_LABELS[system]}: <SummaryLine summary={data.diff?.summary} />.</div>
            <div>The version it replaces stays saved and can be restored any time.</div>
            {lastCheck?.warnings?.filter((w) => !w.preexisting).length ? (
              <Banner tone="warn">Affects things already using these records:<IssueList items={lastCheck.warnings.filter((w) => !w.preexisting)} /></Banner>
            ) : null}
            <Banner tone="info">{PHASE1_NOTE}</Banner>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Published versions (+ compare + restore)
// ---------------------------------------------------------------------------------------------

function RestoreDialog({ system, target, current, onClose, onDone }) {
  const [keys, setKeys] = useState(null);
  const [picking, setPicking] = useState(false);
  const preview = useLoad(() => fiApi.restorePreview(system, target.id, keys), [system, target.id, JSON.stringify(keys)]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const p = preview.data?.preview;
  async function go() {
    setBusy(true);
    setErr(null);
    try {
      const out = await fiApi.restore(system, { target: target.id, keys, expectedCurrent: current.id });
      onDone(out.revision);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }
  const since = p?.changed_since_target?.changes || [];
  return (
    <ConfirmDialog title={`Restore version ${target.number}?`} word="RESTORE" actionLabel="Restore" busy={busy} disabled={!p?.can_restore} onCancel={onClose} onConfirm={go}>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <div>Today's version ({current.number}) is kept. Restoring makes a <strong>new</strong> version with the content of version {target.number}.</div>
        {preview.loading ? <Loading /> : preview.error ? <Banner tone="error">{errText(preview.error)}</Banner> : (
          <>
            <div style={{ margin: "10px 0 6px", fontWeight: 700 }}>Changed since version {target.number}: <SummaryLine summary={p.changed_since_target.summary} /></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Btn small kind={!picking ? "primary" : "plain"} onClick={() => { setPicking(false); setKeys(null); }}>Restore everything</Btn>
              <Btn small kind={picking ? "primary" : "plain"} onClick={() => { setPicking(true); setKeys([]); }}>Only some records</Btn>
            </div>
            {picking ? (
              <div style={{ maxHeight: 180, overflow: "auto", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: 8 }}>
                {since.map((c) => (
                  <label key={c.record_key} style={{ display: "flex", gap: 6, fontSize: 12, padding: "2px 0" }}>
                    <input type="checkbox" checked={(keys || []).includes(c.record_key)} onChange={(e) => setKeys((k) => (e.target.checked ? [...(k || []), c.record_key] : (k || []).filter((x) => x !== c.record_key)))} />
                    {recordTitle(system, c.record_key, c.after || c.before)} <span style={{ color: OWNER_COLORS.muted }}>({c.op})</span>
                  </label>
                ))}
              </div>
            ) : null}
            {p.blockers?.length ? <Banner tone="error">Can't restore this safely:<IssueList items={p.blockers} tone="bad" /></Banner> : (
              <div style={{ margin: "10px 0" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>This restore will make: <SummaryLine summary={p.summary} /></div>
                <DiffList system={system} changes={p.changes} max={40} />
              </div>
            )}
            {p.warnings?.filter((w) => !w.preexisting).length ? <Banner tone="warn"><IssueList items={p.warnings.filter((w) => !w.preexisting)} /></Banner> : null}
          </>
        )}
        {err ? <Banner tone="error">{err}</Banner> : null}
      </div>
    </ConfirmDialog>
  );
}

function Versions() {
  const [params, setParams] = useSearchParams();
  const system = SYSTEMS.includes(params.get("system")) ? params.get("system") : "food_ontology";
  const list = useLoad(() => fiApi.revisions(system), [system]);
  const published = (list.data?.revisions || []).filter((r) => r.status === "published");
  const current = published.find((r) => r.is_current);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const cmp = useLoad(() => (from && to ? fiApi.compare(system, from, to) : Promise.resolve(null)), [system, from, to]);
  const [restoring, setRestoring] = useState(null);
  const [done, setDone] = useState(params.get("published") ? `Version ${params.get("published")} is now the official version.` : null);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <SystemTabs value={system} onChange={(s) => { setFrom(""); setTo(""); setParams({ system: s }); }} />
      </div>
      {done ? <Banner tone="ok">{done}</Banner> : null}
      {list.loading ? <Loading /> : !published.length ? <EmptyState>No versions yet. Save the original on Checks &amp; recovery.</EmptyState> : (
        <PageCard style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}><th style={th}>Version</th><th style={th}>What changed</th><th style={th}>Published</th><th style={th} /></tr></thead>
            <tbody>
              {published.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}` }}>
                  <td style={td}>
                    <Link style={linkStyle} to={`${BASE}/${system}/drafts/${r.id}`}><strong>{r.number}</strong> · {r.title}</Link>{" "}
                    {r.is_current ? <Tag tone="info">Official</Tag> : null} {r.is_baseline ? <Tag>Original 🔒</Tag> : null} {r.kind === "restore" ? <Tag>Restore</Tag> : null}
                  </td>
                  <td style={td}>{r.is_baseline ? "—" : <SummaryLine summary={{ total: Object.values(r.change_counts || {}).reduce((a, b) => a + b, 0), ...r.change_counts }} />}</td>
                  <td style={td}>{when(r.published_at)} · {r.published_by}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {!r.is_current && current ? <Btn small onClick={() => setRestoring(r)}>↺ Restore…</Btn> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PageCard>
      )}
      <PageCard style={{ padding: 18 }}>
        <SectionTitle title="Compare two versions" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <select value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} aria-label="Older version">
            <option value="">From…</option>
            {published.map((r) => <option key={r.id} value={r.id}>{r.number} · {r.title}</option>)}
          </select>
          →
          <select value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} aria-label="Newer version">
            <option value="">To…</option>
            {published.map((r) => <option key={r.id} value={r.id}>{r.number} · {r.title}</option>)}
          </select>
        </div>
        {cmp.loading ? <Loading /> : cmp.data ? (
          <>
            <div style={{ fontSize: 13, marginBottom: 10 }}>{cmp.data.identical ? "These two versions are identical." : <SummaryLine summary={cmp.data.summary} />}</div>
            <DiffList system={system} changes={cmp.data.changes} />
          </>
        ) : <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Pick two versions.</div>}
      </PageCard>
      {restoring && current ? (
        <RestoreDialog system={system} target={restoring} current={current} onClose={() => setRestoring(null)}
          onDone={(rev) => { setRestoring(null); setDone(`Restored. Version ${rev.number} is now official; version ${current.number} is kept.`); list.reload(); }} />
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Change history (audit log)
// ---------------------------------------------------------------------------------------------

const ACTION_LABELS = {
  baseline_saved: "Saved the original as version 0",
  draft_created: "Started a draft",
  draft_edited: "Edited a draft",
  draft_validated: "Checked a draft",
  draft_abandoned: "Discarded a draft",
  published: "Published",
  versions_compared: "Compared versions",
  restore_previewed: "Previewed a restore",
  restored: "Restored",
};

function History() {
  const [system, setSystem] = useState("");
  const log = useLoad(() => fiApi.audit({ system, limit: 300 }), [system]);
  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn small kind={!system ? "primary" : "plain"} onClick={() => setSystem("")}>All</Btn>
        {SYSTEMS.map((s) => <Btn key={s} small kind={system === s ? "primary" : "plain"} onClick={() => setSystem(s)}>{SYSTEM_LABELS[s]}</Btn>)}
      </div>
      {log.loading ? <Loading /> : !log.data?.entries?.length ? <EmptyState>Nothing yet.</EmptyState> : (
        <PageCard style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}><th style={th}>When</th><th style={th}>Who</th><th style={th}>What</th><th style={th}>Details</th></tr></thead>
            <tbody>
              {log.data.entries.map((e) => (
                <tr key={e.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" }}>
                  <td style={td}>{when(e.at)}</td>
                  <td style={td}>{e.actor}</td>
                  <td style={td}>{ACTION_LABELS[e.action] || e.action}{e.system ? ` · ${SYSTEM_LABELS[e.system]}` : ""}</td>
                  <td style={{ ...td, fontSize: 12, color: OWNER_COLORS.muted }}>{auditDetail(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PageCard>
      )}
    </>
  );
}

function auditDetail(e) {
  const d = e.detail || {};
  if (e.action === "draft_edited") return (d.ops || []).map((o) => `${o.op} ${o.key}`).join(", ");
  if (e.action === "draft_validated") return d.ok ? `passed · ${d.warnings} note(s)` : `${d.errors} problem(s)`;
  if (e.action === "published" || e.action === "restored") return d.summary ? `${d.summary.total} record(s)` : "";
  if (e.action === "baseline_saved") return `${d.records} records · ${String(d.sha256 || "").slice(0, 12)}`;
  if (e.action === "versions_compared") return `ids ${d.from} → ${d.to}`;
  return e.revision_id ? `version id ${e.revision_id}` : "";
}

// ---------------------------------------------------------------------------------------------
// Checks & recovery
// ---------------------------------------------------------------------------------------------

const LIVE_TEXT = {
  live_matches_published: "Live data matches the official version.",
  live_matches_original: "Live data still matches the original. Published edits aren't live yet (Phase 1).",
  live_differs: "Live data differs from both the original and the official version (changed outside Food Intelligence).",
  unknown: "Couldn't read live data.",
};

function Checks() {
  const c = useLoad(() => fiApi.checks(), []);
  const ov = useLoad(() => fiApi.overview(), []);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  async function saveBaseline(system) {
    setBusy(system);
    try {
      await fiApi.saveBaseline(system);
      setMsg({ tone: "ok", text: `Original ${SYSTEM_LABELS[system]} saved as version 0.` });
      c.reload();
      ov.reload();
    } catch (e) {
      setMsg({ tone: "error", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      {msg ? <Banner tone={msg.tone}>{msg.text}</Banner> : null}
      {c.loading ? <Loading /> : c.error ? <Banner tone="error">{errText(c.error)}</Banner> : (
        <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
          {c.data.systems.map((s) => {
            const baseline = ov.data?.systems?.find((x) => x.system === s.system)?.baseline;
            return (
              <PageCard key={s.system} style={{ padding: 20 }}>
                <SectionTitle title={s.label} />
                {!s.baseline_saved ? (
                  <>
                    <Banner tone="warn">The original hasn't been saved yet. Saving it makes a locked copy (version 0) that can never be changed or deleted.</Banner>
                    <Btn kind="primary" disabled={busy === s.system} onClick={() => saveBaseline(s.system)}>🔒 Save original as version 0</Btn>
                  </>
                ) : (
                  <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                    <div>{s.baseline_intact ? "✓" : "✕"} Original (version 0) is {s.baseline_intact ? "intact" : "DAMAGED"} <span style={{ color: OWNER_COLORS.muted }}>· {String(s.baseline_sha256).slice(0, 12)}</span></div>
                    <div>{s.all_versions_intact ? "✓" : "✕"} All {s.published_versions} published versions {s.all_versions_intact ? "intact" : "— some are damaged"}</div>
                    <div>Official version: {s.current_number}</div>
                    <div>{s.live_status === "live_differs" ? "⚠" : "✓"} {LIVE_TEXT[s.live_status]}</div>
                    {s.live_vs_original ? <div style={{ color: OWNER_COLORS.muted }}>Live vs original: <SummaryLine summary={s.live_vs_original} /></div> : null}
                    {s.live_error ? <Banner tone="error">{s.live_error}</Banner> : null}
                    {baseline ? (
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <Link to={`${BASE}/${s.system}/drafts/${baseline.id}`}><Btn small>View original</Btn></Link>
                        <Link to={`${BASE}/versions?system=${s.system}`}><Btn small>↺ Restore the original…</Btn></Link>
                      </div>
                    ) : null}
                  </div>
                )}
              </PageCard>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------------------------

const th = { padding: "10px 14px", fontWeight: 700, fontSize: 12 };
const td = { padding: "10px 14px" };

const TITLES = {
  "": "Food Intelligence",
  food_ontology: "Food Ontology",
  mks: "MKS",
  drafts: "Draft revisions",
  versions: "Published versions",
  history: "Change history",
  checks: "Checks & recovery",
};

export default function FoodIntelligence() {
  const params = useParams();
  const first = (params["*"] || "").split("/")[0];
  const title = first && params["*"].includes("/drafts/") ? `${TITLES[first] || ""} draft` : TITLES[first] ?? "Food Intelligence";
  return (
    <OwnerLayout title={title}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="drafts" element={<DraftsList />} />
        <Route path="versions" element={<Versions />} />
        <Route path="history" element={<History />} />
        <Route path="checks" element={<Checks />} />
        <Route path=":system" element={<Browse />} />
        <Route path=":system/drafts/:id" element={<DraftEditor />} />
      </Routes>
    </OwnerLayout>
  );
}
