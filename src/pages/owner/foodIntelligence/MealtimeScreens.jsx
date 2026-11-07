import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { fiApi, MEALTIME_CODES, MEALTIME_LABEL } from "../../../lib/ownerFoodIntelligenceApi.js";
import {
  Banner, Btn, ConfirmDialog, DiffList, IssueList, Loading, SummaryLine, Tag,
  codesText, inputStyle, labelStyle, useLoad,
} from "./fiUi.jsx";

/**
 * Owner → Food Intelligence → Mealtimes (Phase 2, Stage A).
 * Codes attach to MKS food types; a food type without its own codes takes its category's.
 * Menu dishes take their food type's codes. Nothing here changes live results.
 */

const BASE = "/owner/food-intelligence";
const STAGE_A_NOTE = "Mealtimes only ever change the order of results; they never hide a food. Publishing records the official mealtimes. Live Search, clusters, Similar and Post don't use them until a separate go-live is approved.";
const PAGE_MAX = 50;

function errText(err) {
  return err ? err.message || String(err) : "";
}

// ---------------------------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------------------------

/** Neutral code chips. Inherited codes are shown lighter with "from category". */
export function Codes({ codes, inherited, pending }) {
  const keys = MEALTIME_CODES.map((c) => c.code).filter((c) => codes && codes[c]);
  if (!keys.length) return <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Unclassified</span>;
  return (
    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
      {keys.map((c) => (
        <span key={c} title={MEALTIME_LABEL[c]}
          style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "2px 6px", border: `1px ${pending ? "dashed" : "solid"} ${OWNER_COLORS.line}`, background: inherited ? "#fff" : "#f2f4f7", color: inherited ? OWNER_COLORS.muted : OWNER_COLORS.ink }}>
          {c}{codes[c].score != null ? ` ${codes[c].score}` : ""}
        </span>
      ))}
      {inherited ? <span style={{ fontSize: 11, color: OWNER_COLORS.muted }}>from category</span> : null}
    </span>
  );
}

function OriginTag({ origin }) {
  if (origin === "owner") return <Tag tone="info">Set by owner</Tag>;
  if (origin === "proposal") return <Tag>Approved suggestion</Tag>;
  return null;
}

function Legend() {
  return (
    <div style={{ fontSize: 12, color: OWNER_COLORS.muted, margin: "0 0 12px" }}>
      {MEALTIME_CODES.map((c) => `${c.code} ${c.label}`).join(" · ")} · numbers are how well it fits (0–100, optional)
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unclassified", label: "Unclassified" },
  { id: "type", label: "Own codes" },
  { id: "category", label: "From category" },
  { id: "owner", label: "Set by owner" },
];

function matchesFilter(t, f) {
  if (f === "unclassified") return !t.effective.from;
  if (f === "type") return t.effective.from === "type";
  if (f === "category") return t.effective.from === "category";
  if (f === "owner") return t.effective.origin === "owner" || t.record?.origin === "owner";
  return true;
}

/** Category → food types list. onPick(key) selects a record. */
function FoodList({ view, filter, search, selected, onPick, showPending }) {
  const q = search.trim().toLowerCase();
  const groups = (view?.categories || [])
    .map((c) => ({
      ...c,
      shown: c.types.filter((t) => matchesFilter(t, filter) && (!q || `${t.name} ${t.mks_code} ${c.category}`.toLowerCase().includes(q))),
    }))
    .filter((c) => c.shown.length || (!q && filter === "all"));
  if (!groups.length) return <div style={{ padding: 14, fontSize: 13, color: OWNER_COLORS.muted }}>Nothing matches.</div>;
  const row = (active) => ({ display: "flex", flexWrap: "wrap", width: "100%", textAlign: "left", gap: "4px 8px", alignItems: "center", padding: "7px 12px", border: 0, borderBottom: `1px solid ${OWNER_COLORS.line}`, background: active ? "#f2f4f7" : "#fff", cursor: "pointer", fontFamily: "inherit" });
  return (
    <div style={{ maxHeight: 620, overflow: "auto", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, background: "#fff" }}>
      {groups.map((c) => (
        <div key={c.category}>
          <button type="button" onClick={() => onPick(c.key)} style={{ ...row(selected === c.key), background: selected === c.key ? "#eaecf0" : "#f9fafb" }}>
            <span style={{ flex: "1 1 180px", minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 800 }}>{c.category}</span>
              <span style={{ display: "block", fontSize: 11, color: OWNER_COLORS.muted }}>Category · {c.types.length} food types{c.menu_items ? ` · ${c.menu_items.toLocaleString()} menu dishes` : ""}</span>
            </span>
            {c.record && c.record.active !== false ? <Codes codes={c.record.codes} /> : <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>No default</span>}
            {showPending && c.record?.proposal ? <Tag tone="warn">Suggestion</Tag> : null}
          </button>
          {c.shown.map((t) => (
            <button key={t.key} type="button" onClick={() => onPick(t.key)} style={row(selected === t.key)}>
              <span style={{ flex: "1 1 180px", minWidth: 0, paddingLeft: 12 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{t.name}</span>
                <span style={{ display: "block", fontSize: 11, color: OWNER_COLORS.muted }}>{t.mks_code}{t.menu_items != null ? ` · ${t.menu_items} menu dishes` : ""}</span>
              </span>
              <Codes codes={t.effective.codes} inherited={t.effective.from === "category"} />
              {showPending && t.record?.proposal ? <Tag tone="warn">Suggestion</Tag> : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function findEntry(view, key) {
  for (const c of view?.categories || []) {
    if (c.key === key) return { kind: "category", category: c, record: c.record };
    const t = c.types.find((x) => x.key === key);
    if (t) return { kind: "type", category: c, type: t, record: t.record };
  }
  return null;
}

/** Read-only details for a food type or category. */
function EntryDetails({ entry }) {
  if (!entry) return <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>Pick a category or food type to see its mealtimes.</div>;
  const r = entry.record;
  return (
    <div style={{ fontSize: 13, lineHeight: 1.7 }}>
      <div style={{ fontWeight: 800, fontSize: 15 }}>{entry.kind === "category" ? `${entry.category.category} (category)` : entry.type.name}</div>
      <div style={{ color: OWNER_COLORS.muted, marginBottom: 8 }}>
        {entry.kind === "category" ? `Applies to food types in this category that have no codes of their own.` : `${entry.type.mks_code} · in ${entry.category.category}${entry.type.menu_items != null ? ` · ${entry.type.menu_items} menu dishes take these codes` : ""}`}
      </div>
      {entry.kind === "type" ? (
        <div style={{ marginBottom: 8 }}>
          <div style={labelStyle}>In use</div>
          <Codes codes={entry.type.effective.codes} inherited={entry.type.effective.from === "category"} /> <OriginTag origin={entry.type.effective.origin} />
        </div>
      ) : null}
      <div style={labelStyle}>{entry.kind === "type" ? "Its own codes" : "Category codes"}</div>
      {r ? (
        <>
          <div><Codes codes={r.active === false ? {} : r.codes} /> <OriginTag origin={r.origin} /> {r.active === false ? <Tag tone="warn">Off</Tag> : null}</div>
          {r.source ? <div style={{ color: OWNER_COLORS.muted, fontSize: 12 }}>Source: {r.source}{r.confidence != null ? ` · confidence ${Math.round(r.confidence * 100)}%` : ""}</div> : null}
          {r.note ? <div style={{ fontSize: 12 }}>Note: {r.note}</div> : null}
        </>
      ) : <div style={{ color: OWNER_COLORS.muted }}>None{entry.kind === "type" ? " — uses the category's codes" : ""}</div>}
      {r?.proposal ? <SuggestionBox proposal={r.proposal} /> : null}
    </div>
  );
}

function SuggestionBox({ proposal }) {
  return (
    <div style={{ marginTop: 10, border: `1px dashed ${OWNER_COLORS.line}`, borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Suggestion waiting for review</div>
      <Codes codes={proposal.codes} pending /> <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>confidence {Math.round((proposal.confidence || 0) * 100)}%</span>
      <SourceList sources={proposal.sources} />
      {proposal.reasons?.length ? <div style={{ fontSize: 12, color: "#7a4b00", marginTop: 4 }}>{proposal.reasons.join(" ")}</div> : null}
    </div>
  );
}

function SourceList({ sources }) {
  if (!sources?.length) return null;
  return (
    <ul style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.5 }}>
      {sources.map((s) => <li key={s.id}>{s.label}: {s.detail} → {codesText(Object.fromEntries(Object.entries(s.codes).map(([c, v]) => [c, { score: v }])))} ({Math.round(s.confidence * 100)}%)</li>)}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------
// Browse (official version)
// ---------------------------------------------------------------------------------------------

export function MealtimeBrowse() {
  const navigate = useNavigate();
  const view = useLoad(() => fiApi.mealtimeView(), []);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  async function startDraft() {
    setBusy(true);
    try {
      const out = await fiApi.createDraft("mealtime", "Mealtime edits");
      navigate(`${BASE}/mealtime/drafts/${out.revision.id}`);
    } catch (e) {
      setMsg(errText(e));
    } finally {
      setBusy(false);
    }
  }
  if (view.loading) return <Loading />;
  if (view.error) {
    if (view.error.code === "NO_BASELINE") return <Banner tone="warn">Mealtimes start empty. <Link to={`${BASE}/checks`}>Save version 0 (nothing classified)</Link> first.</Banner>;
    return <Banner tone="error">{errText(view.error)}</Banner>;
  }
  const v = view.data;
  const entry = findEntry(v, selected);
  return (
    <>
      <Banner tone="info">{STAGE_A_NOTE}</Banner>
      {msg ? <Banner tone="error">{msg}</Banner> : null}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13 }}>
          Official version <strong>{v.revision.number}</strong> ({v.revision.title}) · {v.summary.classified} of {v.summary.food_types} food types classified ({v.summary.own_codes} own, {v.summary.from_category} from category) · {v.summary.unclassified} unclassified
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to={`${BASE}/mealtime/preview`}><Btn>⇅ Ranking preview</Btn></Link>
          <Btn kind="primary" onClick={startDraft} disabled={busy}>✎ Start a draft</Btn>
        </div>
      </div>
      <Legend />
      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)", gap: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search food type or category" style={{ ...inputStyle, flex: 1, minWidth: 160 }} aria-label="Search food types" />
            {FILTERS.map((f) => <Btn key={f.id} small kind={filter === f.id ? "primary" : "plain"} onClick={() => setFilter(f.id)}>{f.label}</Btn>)}
          </div>
          <FoodList view={v} filter={filter} search={search} selected={selected} onPick={setSelected} />
        </div>
        <PageCard style={{ padding: 18 }}>
          <EntryDetails entry={entry} />
          {entry ? <div style={{ marginTop: 12, fontSize: 12, color: OWNER_COLORS.muted }}>To change anything, start a draft.</div> : null}
        </PageCard>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Draft: suggest → review → edit → check → publish
// ---------------------------------------------------------------------------------------------

function CodeEditor({ entry, busy, onSave }) {
  const r = entry.record;
  const start = r && r.active !== false ? r.codes : {};
  const [codes, setCodes] = useState(() => JSON.parse(JSON.stringify(start || {})));
  const [note, setNote] = useState(r?.note || "");
  const key = entry.kind === "category" ? entry.category.key : entry.type.key;
  const label = entry.kind === "category" ? entry.category.category : entry.type.name;
  const toggle = (c) => setCodes((x) => {
    const n = { ...x };
    if (n[c]) delete n[c];
    else n[c] = { score: null };
    return n;
  });
  const setScore = (c, v) => setCodes((x) => ({ ...x, [c]: { score: v === "" ? null : Number(v) } }));
  function save() {
    const ops = r
      ? [{ op: "update", key, fields: { codes, note: note || null } }, ...(r.active === false ? [{ op: "reactivate", key }] : [])]
      : [{ op: "add", key, record: { codes, note: note || null, label } }];
    onSave(ops);
  }
  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Set {entry.kind === "category" ? "category" : "its own"} codes</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 6 }}>
        {MEALTIME_CODES.map((c) => (
          <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <input type="checkbox" checked={Boolean(codes[c.code])} onChange={() => toggle(c.code)} />
              {c.code} · {c.label}
            </label>
            <input type="number" min={0} max={100} step={1} disabled={!codes[c.code]} value={codes[c.code]?.score ?? ""} onChange={(e) => setScore(c.code, e.target.value)}
              placeholder="score" aria-label={`${c.label} score`} style={{ ...inputStyle, width: 72, padding: "5px 8px" }} />
          </div>
        ))}
      </div>
      <label style={labelStyle} htmlFor="mt-note">Note (optional)</label>
      <input id="mt-note" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Btn kind="primary" small onClick={save} disabled={busy}>Save to draft</Btn>
        {r && r.active !== false && Object.keys(r.codes || {}).length ? <Btn small kind="danger" onClick={() => onSave([{ op: "deactivate", key }])} disabled={busy}>Turn off (unclassified)</Btn> : null}
      </div>
      <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 6 }}>Saving marks this as set by owner. Suggestions never change it.</div>
    </div>
  );
}

function ReviewPanel({ view, busy, onSave }) {
  const [filter, setFilter] = useState("look");
  const [picked, setPicked] = useState([]);
  const items = useMemo(() => {
    const out = [];
    for (const c of view?.categories || []) {
      if (c.record?.proposal) out.push({ key: c.key, name: `${c.category} (category)`, record: c.record, items: c.menu_items });
      for (const t of c.types) if (t.record?.proposal) out.push({ key: t.key, name: t.name, sub: `${t.mks_code} · ${c.category}`, record: t.record, items: t.menu_items });
    }
    return out;
  }, [view]);
  const shown = items.filter((i) => (filter === "look" ? i.record.proposal.ambiguous : filter === "clear" ? !i.record.proposal.ambiguous : true));
  if (!items.length) return <EmptyState>No suggestions waiting. Use ✦ Suggest mealtimes to get some.</EmptyState>;
  const toggle = (k) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : p.length >= PAGE_MAX ? p : [...p, k]));
  // Ticked one by one (max 50) and the button shows the count, so this is the bulk confirmation.
  const act = (op) => onSave(picked.map((key) => ({ op, key })), true).then((ok) => ok && setPicked([]));
  const look = items.filter((i) => i.record.proposal.ambiguous).length;
  return (
    <>
      <SectionTitle title={`Suggestions waiting (${items.length})`} subtitle="Tick up to 50, then approve or drop them. Approved codes go into this draft; nothing is official until you publish." />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
        <Btn small kind={filter === "look" ? "primary" : "plain"} onClick={() => setFilter("look")}>Needs a look ({look})</Btn>
        <Btn small kind={filter === "clear" ? "primary" : "plain"} onClick={() => setFilter("clear")}>Clear ({items.length - look})</Btn>
        <Btn small kind={filter === "all" ? "primary" : "plain"} onClick={() => setFilter("all")}>All</Btn>
        <span style={{ flex: 1 }} />
        <Btn small onClick={() => setPicked(shown.slice(0, PAGE_MAX).map((i) => i.key))}>Tick first {Math.min(PAGE_MAX, shown.length)}</Btn>
        <Btn small onClick={() => setPicked([])} disabled={!picked.length}>Clear ticks</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <Btn kind="primary" small onClick={() => act("approve")} disabled={busy || !picked.length}>✓ Approve {picked.length || ""}</Btn>
        <Btn small kind="danger" onClick={() => act("drop")} disabled={busy || !picked.length}>Drop {picked.length || ""}</Btn>
      </div>
      <div style={{ maxHeight: 560, overflow: "auto", display: "grid", gap: 8 }}>
        {shown.map((i) => {
          const p = i.record.proposal;
          return (
            <label key={i.key} style={{ display: "flex", gap: 10, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: "9px 12px", background: picked.includes(i.key) ? "#f2f4f7" : "#fff", cursor: "pointer" }}>
              <input type="checkbox" checked={picked.includes(i.key)} onChange={() => toggle(i.key)} aria-label={`Select ${i.name}`} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <strong>{i.name}</strong>
                  {p.ambiguous ? <Tag tone="warn">Needs a look</Tag> : null}
                  <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{i.sub || ""}{i.items ? ` · ${i.items} menu dishes` : ""}</span>
                </span>
                <span style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Suggested</span> <Codes codes={p.codes} pending />
                  <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>confidence {Math.round((p.confidence || 0) * 100)}%</span>
                  {i.record.origin ? <><span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>· now</span> <Codes codes={i.record.codes} /></> : null}
                </span>
                <SourceList sources={p.sources} />
                {p.reasons?.length ? <span style={{ display: "block", fontSize: 12, color: "#7a4b00", marginTop: 3 }}>{p.reasons.join(" ")}</span> : null}
              </span>
            </label>
          );
        })}
        {!shown.length ? <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Nothing in this list.</div> : null}
      </div>
    </>
  );
}

function SuggestPanel({ draftId, busy, setBusy, onAdded, onCancel }) {
  const prev = useLoad(() => fiApi.mealtimeSuggestions(draftId), [draftId]);
  const [err, setErr] = useState(null);
  // The button names the exact count, so pressing it is the bulk confirmation.
  async function add() {
    setBusy(true);
    setErr(null);
    try {
      const out = await fiApi.mealtimeAddSuggestions(draftId, { confirmBulk: true });
      onAdded(out);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }
  if (prev.loading) return <Loading />;
  if (prev.error) return <Banner tone="error">{errText(prev.error)}</Banner>;
  const s = prev.data.summary;
  return (
    <>
      <SectionTitle title="Suggest mealtimes" subtitle="Worked out from menu sections, the meal-fit table, MKS tags and category defaults. Nothing is added until you say so." />
      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
        <div><strong>{s.suggestions}</strong> suggestions: {s.food_types} food types, {s.categories} categories</div>
        <div><strong>{s.needs_a_look}</strong> need a look (sources disagree, weak evidence, or a guess)</div>
        <div><strong>{(s.menu_items_affected || 0).toLocaleString()}</strong> menu dishes reached by the food-type suggestions</div>
        <div>{s.inherit_category} food types have no evidence of their own and will use their category's codes</div>
        <div>{s.kept_owner_choices} of your own choices kept as they are · {s.unchanged} already match</div>
        {!s.section_evidence ? <Banner tone="warn">Menu-section evidence isn't available here{s.evidence_note ? ` (${s.evidence_note})` : ""}. The other sources are used.</Banner> : null}
      </div>
      {prev.data.kept?.length ? (
        <details style={{ fontSize: 12, marginTop: 6 }}><summary style={{ cursor: "pointer" }}>Kept your choices ({prev.data.kept.length})</summary>{prev.data.kept.map((k) => <div key={k.key}>{k.label}: {codesText(k.codes)}</div>)}</details>
      ) : null}
      {err ? <Banner tone="error">{err}</Banner> : null}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Btn kind="primary" onClick={add} disabled={busy || !s.suggestions}>Add {s.suggestions} suggestions to this draft</Btn>
        <Btn onClick={onCancel} disabled={busy}>Cancel</Btn>
      </div>
    </>
  );
}

export function MealtimeDraft() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rev = useLoad(() => fiApi.revision("mealtime", id), [id]);
  const view = useLoad(() => fiApi.mealtimeView(id), [id]);
  const [panel, setPanel] = useState("review");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [check, setCheck] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const data = rev.data;
  const r = data?.revision;
  const isDraft = r?.status === "draft";
  const lastCheck = check || (data?.last_validation && data.last_validation.snapshot_sha256 === r?.snapshot_sha256 ? data.last_validation : null);
  const reload = () => Promise.all([rev.reload(), view.reload()]);

  async function save(ops, confirmBulk = false) {
    setBusy(true);
    setMsg(null);
    try {
      await fiApi.editDraft("mealtime", id, ops, { confirmBulk });
      setCheck(null);
      await reload();
      setMsg({ tone: "ok", text: "Saved to the draft. Nothing official has changed." });
      return true;
    } catch (e) {
      if (e.code === "BULK_CONFIRM_REQUIRED" && window.confirm(e.message)) return save(ops, true);
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
      const out = await fiApi.validate("mealtime", id);
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
      const out = await fiApi.publish("mealtime", id);
      navigate(`${BASE}/versions?system=mealtime&published=${out.revision.number}`);
    } catch (e) {
      setPublishing(false);
      setMsg({ tone: "error", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }
  async function abandon() {
    if (!window.confirm("Throw away this draft? It is kept in history as discarded.")) return;
    try {
      await fiApi.abandon("mealtime", id);
      navigate(`${BASE}/drafts`);
    } catch (e) {
      setMsg({ tone: "error", text: errText(e) });
    }
  }

  if ((rev.loading && !data) || (view.loading && !view.data)) return <Loading />;
  if (rev.error || view.error) return <Banner tone="error">{errText(rev.error || view.error)}</Banner>;
  const v = view.data;
  const validated = r.validated && lastCheck?.ok;
  const entry = findEntry(v, selected);
  const pending = v.summary.suggestions_waiting;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Mealtimes · {isDraft ? "Draft" : "Version"} {r.number}: {r.title}</div>
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
            {data.diff ? <>Compared with version {data.diff.against_number}: <SummaryLine summary={data.diff.summary} /></> : "Version 0 (nothing classified)"}
            {" · "}{v.summary.classified} of {v.summary.food_types} food types classified{pending ? ` · ${pending} suggestions waiting` : ""}
            {isDraft ? ` · ${r.validated ? "checked after last edit" : "not checked since last edit"}` : ""}
          </div>
        </div>
        {isDraft ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn onClick={() => setPanel("suggest")} disabled={busy}>✦ Suggest mealtimes</Btn>
            <Btn onClick={() => setPanel("preview")} disabled={busy}>☰ Preview changes</Btn>
            <Btn onClick={runCheck} disabled={busy}>✓ Check draft</Btn>
            <Btn kind="primary" onClick={() => setPublishing(true)} disabled={busy || !validated} title={validated ? "" : "Check the draft first"}>⇪ Publish</Btn>
            <Btn kind="danger" onClick={abandon} disabled={busy}>Discard</Btn>
          </div>
        ) : null}
      </div>
      {msg ? <Banner tone={msg.tone || "error"}>{msg.text || msg}</Banner> : null}
      {!isDraft ? <Banner tone="info">This version is {r.status} and can't be edited.</Banner> : null}
      <Legend />
      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)", gap: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search food type or category" style={{ ...inputStyle, flex: 1, minWidth: 160 }} aria-label="Search food types" />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {FILTERS.map((f) => <Btn key={f.id} small kind={filter === f.id ? "primary" : "plain"} onClick={() => setFilter(f.id)}>{f.label}</Btn>)}
          </div>
          <FoodList view={v} filter={filter} search={search} selected={selected} onPick={(k) => { setSelected(k); setPanel("edit"); }} showPending />
        </div>
        <PageCard style={{ padding: 18 }}>
          {panel === "suggest" && isDraft ? (
            <SuggestPanel draftId={id} busy={busy} setBusy={setBusy} onCancel={() => setPanel("review")}
              onAdded={async (out) => { await reload(); setMsg({ tone: "ok", text: `Added ${out.added} suggestions. Review them below; nothing changes until you approve.` }); setPanel("review"); }} />
          ) : panel === "check" && lastCheck ? (
            <>
              <SectionTitle title={lastCheck.ok ? "Check passed" : "Check found problems"} subtitle={<SummaryLine summary={lastCheck.summary} />} />
              {lastCheck.ok ? <Banner tone="ok">Ready to publish.</Banner> : <Banner tone="error">Fix these before publishing:<IssueList items={lastCheck.errors} tone="bad" /></Banner>}
              {lastCheck.warnings?.length ? <Banner tone="warn">Worth knowing ({lastCheck.warnings.length}):<IssueList items={lastCheck.warnings} /></Banner> : null}
              <Btn small onClick={() => setPanel("review")}>Back</Btn>
            </>
          ) : panel === "preview" ? (
            <>
              <SectionTitle title="Changes in this draft" subtitle={data.diff ? <SummaryLine summary={data.diff.summary} /> : null} />
              <DiffList system="mealtime" changes={data.diff?.changes || []} />
              <div style={{ marginTop: 12 }}><Btn small onClick={() => setPanel("review")}>Back</Btn></div>
            </>
          ) : panel === "edit" && entry ? (
            <>
              <EntryDetails entry={entry} />
              {isDraft && entry.record?.proposal ? (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Btn small kind="primary" disabled={busy} onClick={() => save([{ op: "approve", key: entry.kind === "category" ? entry.category.key : entry.type.key }])}>✓ Approve suggestion</Btn>
                  <Btn small kind="danger" disabled={busy} onClick={() => save([{ op: "drop", key: entry.kind === "category" ? entry.category.key : entry.type.key }])}>Drop suggestion</Btn>
                </div>
              ) : null}
              {isDraft ? <CodeEditor key={`${selected}-${v.revision.snapshot_sha256}`} entry={entry} busy={busy} onSave={save} /> : null}
              <div style={{ marginTop: 12 }}><Btn small onClick={() => setPanel("review")}>Back to suggestions</Btn></div>
            </>
          ) : (
            <ReviewPanel view={v} busy={busy} onSave={save} />
          )}
        </PageCard>
      </div>

      {publishing ? (
        <ConfirmDialog title={`Publish mealtimes version ${r.number}?`} word="PUBLISH" actionLabel="Publish" busy={busy} onCancel={() => setPublishing(false)} onConfirm={publish}>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div>This becomes the official mealtimes: <SummaryLine summary={data.diff?.summary} />.</div>
            <div>{v.summary.classified} of {v.summary.food_types} food types will be classified. The version it replaces stays saved and can be restored any time.</div>
            <Banner tone="info">{STAGE_A_NOTE}</Banner>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Ranking preview (read-only)
// ---------------------------------------------------------------------------------------------

export function MealtimeRankingPreview() {
  const list = useLoad(() => fiApi.revisions("mealtime"), []);
  const published = (list.data?.revisions || []).filter((x) => x.status === "published");
  const [revision, setRevision] = useState("");
  const [mealtime, setMealtime] = useState("B");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Los Angeles");
  const [state, setState] = useState("CA");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);
  async function run(e) {
    e?.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      setOut(await fiApi.mealtimeRankingPreview({ revision: revision || undefined, mealtime, q, city, state }));
    } catch (x) {
      setErr(errText(x));
      setOut(null);
    } finally {
      setBusy(false);
    }
  }
  const before = out ? [...out.items].sort((a, b) => a.old_rank - b.old_rank) : [];
  const col = { display: "grid", gap: 4 };
  const row = (x, after) => (
    <div key={`${after ? "a" : "b"}-${x.old_rank}`} style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px", alignItems: "center", fontSize: 13, padding: "5px 8px", borderRadius: 8, background: after && x.moved > 0 ? "#f2f4f7" : "transparent" }}>
      <span style={{ width: 26, textAlign: "right", color: OWNER_COLORS.muted }}>{after ? x.new_rank : x.old_rank}</span>
      <span style={{ flex: "1 1 150px", minWidth: 0 }}>
        <span style={{ fontWeight: 700 }}>{x.name}</span>
        <span style={{ display: "block", fontSize: 11, color: OWNER_COLORS.muted }}>{x.restaurant || ""}{x.mks_name ? ` · ${x.mks_name}` : " · no food type"}</span>
      </span>
      <Codes codes={x.codes} inherited={x.from === "category"} />
      {after ? <span style={{ width: 34, textAlign: "right", fontSize: 12, fontWeight: 700, color: x.moved > 0 ? OWNER_COLORS.ink : OWNER_COLORS.muted }}>{x.moved > 0 ? `↑${x.moved}` : x.moved < 0 ? `↓${-x.moved}` : "–"}</span> : null}
    </div>
  );
  return (
    <>
      <Banner tone="info">Read-only. This runs the normal search and shows how a mealtime version would reorder its dishes. Live results don't change, and nothing is ever removed.</Banner>
      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <form onSubmit={run} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label style={labelStyle} htmlFor="rp-q">Search</label><input id="rp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. burger" style={{ ...inputStyle, width: 200 }} /></div>
          <div>
            <label style={labelStyle} htmlFor="rp-meal">Mealtime</label>
            <select id="rp-meal" value={mealtime} onChange={(e) => setMealtime(e.target.value)} style={inputStyle}>
              {MEALTIME_CODES.filter((c) => c.code !== "A").map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="rp-ver">Mealtimes version</label>
            <select id="rp-ver" value={revision} onChange={(e) => setRevision(e.target.value)} style={inputStyle}>
              <option value="">Official version</option>
              {published.map((x) => <option key={x.id} value={x.id}>{x.number} · {x.title}</option>)}
            </select>
          </div>
          <div><label style={labelStyle} htmlFor="rp-city">City</label><input id="rp-city" value={city} onChange={(e) => setCity(e.target.value)} style={{ ...inputStyle, width: 140 }} /></div>
          <div><label style={labelStyle} htmlFor="rp-state">State</label><input id="rp-state" value={state} onChange={(e) => setState(e.target.value)} style={{ ...inputStyle, width: 60 }} /></div>
          <Btn kind="primary" type="submit" disabled={busy || !q.trim()}>{busy ? "Working…" : "⇅ Preview"}</Btn>
        </form>
      </PageCard>
      {err ? <Banner tone="error">{err}</Banner> : null}
      {out ? (
        <>
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            “{out.query}” for <strong>{out.mealtime_label}</strong> with mealtimes version {out.revision.number}: {out.stats.total} dishes · {out.stats.moved_up} move up · {out.stats.moved_down} move down · {out.stats.unchanged} stay · <strong>0 removed</strong> · {out.stats.typed} have a food type. A dish can move up by at most {Math.round(out.stats.max_lift_share * 100)}% of the list.
          </div>
          <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
            <PageCard style={{ padding: 14 }}><SectionTitle title="Today's order" /><div style={col}>{before.map((x) => row(x, false))}</div></PageCard>
            <PageCard style={{ padding: 14 }}><SectionTitle title={`With ${out.mealtime_label}`} /><div style={col}>{out.items.map((x) => row(x, true))}</div></PageCard>
          </div>
        </>
      ) : null}
    </>
  );
}
