import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { errorStyle, inputStyle, labelStyle, mutedStyle, primaryButtonStyle, secondaryButtonStyle } from "./OwnerFranchiseBot.jsx";
import {
  addLabCorrection,
  attachConversationFiles,
  createConversation,
  createLabBatch,
  getConversation,
  getLabCase,
  getLabRun,
  getLearningSwitches,
  listConversationFiles,
  listConversations,
  listLessons,
  listModelProfiles,
  promoteLabCorrection,
  proposeConversationLesson,
  queueLabRun,
  reviewLabCorrection,
  reviewLesson,
  sendConversationMessage,
  setLearningSwitch,
} from "../../lib/ownerApi.js";
import { StatusTag, Tag, TextLink } from "./knowledgeUi.jsx";
import { humanClass } from "./knowledgeFormat.js";

/**
 * Owner → Agent 000 → Talk (plan 50; plan 55 renamed it from Teach CK). One place to teach the local agent:
 *  - talk with it: it answers from approved knowledge (cited), asks when unclear, explains a menu run, and
 *    proposes lessons;
 *  - give it a menu: the real extraction runs in the Lab sandbox (nothing is published); correct what it got
 *    wrong, approve the correction, turn it into a lesson;
 *  - approve lessons and watch the next answer / next run use them.
 * Approved lessons are retrieved; the model's weights never change.
 */

const MODE_LABEL = { answer: "Answer", clarify: "Question for you", explain: "Explanation", propose_lesson: "Proposed lesson", propose_correction: "Proposed correction", unparsed: "Unstructured reply", error: "Error" };
const MODE_TONE = { answer: "info", clarify: "warn", explain: "info", propose_lesson: "warn", propose_correction: "warn", unparsed: "muted", error: "bad" };
const TOOL_LABEL = {
  ck_find_restaurants: "Restaurant search", ck_get_restaurant: "Restaurant record", ck_menu_items: "Menu items", ck_compare_restaurants: "Restaurant comparison",
  ck_mks_lookup: "MKS ontology", ck_item_classification: "Item classification", ck_ingestion_jobs: "Menubot jobs", ck_ingestion_job: "Menubot job",
  ck_pipeline_trace: "Pipeline trace", ck_problem_classes: "Pipeline problem classes", ck_validation_failures: "Review queue",
  ck_data_quality: "Data quality scan", ck_lessons: "Lessons", ck_bot_activity: "Bot activity",
};
const FIX_KINDS = [
  { id: "modifier", label: "It's an add-on of the item above", op: "relink", error_class: "modifier_mistake" },
  { id: "not_item", label: "It isn't something to order", op: "delete", error_class: "heading_as_item" },
  { id: "price", label: "The price is wrong", op: "edit", error_class: "wrong_price" },
  { id: "name", label: "The name is wrong", op: "edit", error_class: "item_boundary" },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const box = { border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: 12, background: "#fff" };
const small = { fontSize: 12, color: OWNER_COLORS.muted };

function useSwitches() {
  const [switches, setSwitches] = useState(null);
  const load = useCallback(() => getLearningSwitches().then((r) => setSwitches(r.switches)).catch(() => setSwitches({})), []);
  useEffect(() => { load(); }, [load]);
  return [switches, load];
}

function SwitchLine({ switches, onChange }) {
  const [busy, setBusy] = useState(false);
  if (!switches) return null;
  const toggle = async (key) => {
    setBusy(true);
    try { await setLearningSwitch(key, !switches[key]); await onChange(); } finally { setBusy(false); }
  };
  const row = (key, label) => (
    <span style={{ marginRight: 18, fontSize: 13 }}>
      {label}: <strong style={{ color: switches[key] ? "#146c2e" : "#b42318" }}>{switches[key] ? "On" : "Off"}</strong>{" "}
      <TextLink disabled={busy} onClick={() => toggle(key)}>{switches[key] ? "Turn off" : "Turn on"}</TextLink>
    </span>
  );
  return (
    <div style={{ ...small, marginBottom: 12 }}>
      {row("learning_retrieval", "Agent uses approved knowledge")}
      {row("learning_lab_llm", "Agent reviews menus")}
      {row("learning_ck_data", "Agent 000 looks things up in the database")}
    </div>
  );
}

const SCOPE_OPTIONS = [
  ["chain", "One chain"], ["site_platform", "One website platform"], ["doc_type", "One kind of menu document"],
  ["cluster", "One cluster"], ["capability", "One capability"], ["global", "Every restaurant"],
];
const EVIDENCE_LABEL = { conversation_message: "Your message in a teaching conversation", lab_correction: "Approved Lab correction", library_chunk: "Approved Library passage", fact: "Record shown in that turn" };
const FLAG_LABEL = {
  instruction_override: "tells the model to ignore its rules", ai_directed: "addressed to an AI", role_markup: "prompt markup",
  policy_override: "tries to change approvals or checks", hidden_text: "hidden characters", encoded_instruction: "encoded instructions",
};

/**
 * Agent audit G-04: the approval view. Evidence, scope, source and who proposed it are shown before Approve;
 * a flagged lesson can be edited or rejected, never approved as is; an agent-proposed lesson needs a scope choice.
 */
function LessonCard({ lesson, onDecided }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title || "");
  const [rule, setRule] = useState(lesson.body || "");
  const rv = lesson.review || null;
  const [scope, setScope] = useState(rv?.needs_scope_choice ? "" : lesson.scope || "global");
  const [scopeKey, setScopeKey] = useState(lesson.scope_key || "");
  const [revokeNote, setRevokeNote] = useState("");
  const [revoking, setRevoking] = useState(false);
  if (!lesson?.id) return null;
  const decide = async (decision, extra = {}) => {
    setBusy(true);
    setErr("");
    try {
      const body = { ...(editing ? { title, rule } : {}), ...extra };
      if (decision === "approve") Object.assign(body, { scope, scope_key: scope === "global" ? null : scopeKey.trim() || null });
      await reviewLesson(lesson.id, decision, body);
      setEditing(false);
      setRevoking(false);
      await onDecided?.();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const flags = [...new Set([...(rv?.screening?.flags || []), ...(rv?.screening?.evidence_flags || [])])];
  const needsKey = scope && scope !== "global" && !scopeKey.trim();
  const approveDisabled = busy || !scope || needsKey || (!rv?.can_approve && !editing);
  return (
    <div style={{ ...box, borderColor: lesson.status === "proposed" ? "#f2c48d" : OWNER_COLORS.line, marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontSize: 14 }}>Lesson #{lesson.id}</strong>
        <StatusTag status={lesson.status === "active" ? "approved" : lesson.status} />
        {lesson.error_class ? <Tag>{humanClass(lesson.error_class)}</Tag> : null}
        {flags.length ? <Tag tone="bad">Reads like instructions</Tag> : null}
        {rv?.revoked ? <Tag tone="bad">Approval withdrawn</Tag> : null}
      </div>
      {editing ? (
        <div style={{ marginTop: 8 }}>
          <input aria-label="Lesson title" style={{ ...inputStyle, width: "100%" }} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea aria-label="Lesson rule" style={{ ...inputStyle, width: "100%", minHeight: 70, marginTop: 6 }} value={rule} onChange={(e) => setRule(e.target.value)} />
        </div>
      ) : (
        <>
          <div style={{ fontWeight: 700, marginTop: 6 }}>{lesson.title}</div>
          <div style={{ fontSize: 14, marginTop: 2 }}>{lesson.body}</div>
        </>
      )}
      {rv ? (
        <div style={{ fontSize: 13, marginTop: 8, display: "grid", gap: 3 }}>
          <div><span style={small}>Proposed by</span> {rv.proposer === "agent" ? "Agent 000" : rv.proposer === "owner_correction" ? "You (Lab correction)" : "You"}{rv.model ? ` · ${rv.model}` : ""}{rv.source ? ` · ${rv.source}` : ""}</div>
          <div><span style={small}>Applies to</span> {rv.scope_label}{rv.needs_scope_choice ? " (not chosen yet)" : ""}</div>
          <div>
            <span style={small}>Evidence</span>
            {rv.evidence.length ? (
              <ul style={{ margin: "2px 0 0 18px", padding: 0 }}>
                {rv.evidence.map((e, i) => (
                  <li key={i}>
                    {EVIDENCE_LABEL[e.kind] || e.kind}{e.cite ? ` ${e.cite}` : ""}: {e.verified ? "checked" : e.supporting ? "supporting only" : `not verified${e.note ? ` (${e.note})` : ""}`}
                    {e.excerpt ? <div style={{ ...small, whiteSpace: "pre-wrap" }}>“{e.excerpt}”</div> : null}
                  </li>
                ))}
              </ul>
            ) : " none"}
          </div>
          {flags.length ? <div style={{ color: "#b42318" }}>Screening: {flags.map((f) => FLAG_LABEL[f] || f).join(", ")}. Edit the text or reject it.</div> : null}
          {rv.blocked_reason ? <div style={{ color: "#b42318" }}>{rv.blocked_reason}</div> : null}
          {rv.revoked ? <div style={small}>Withdrawn: {rv.revoked.reason}</div> : null}
        </div>
      ) : lesson.status === "proposed" ? (
        <div style={{ ...small, marginTop: 8 }}>Open it under Lessons to see its evidence and scope before approving.</div>
      ) : null}
      {lesson.status === "proposed" && rv ? (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={small} htmlFor={`scope-${lesson.id}`}>Applies to</label>
            <select id={`scope-${lesson.id}`} style={inputStyle} value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="">Choose…</option>
              {SCOPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {scope && scope !== "global" ? (
              <input aria-label="Which one" placeholder={scope === "chain" ? "Chain id" : scope === "site_platform" ? "e.g. wix" : "Which one"} style={{ ...inputStyle, width: 160 }} value={scopeKey} onChange={(e) => setScopeKey(e.target.value)} />
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" style={primaryButtonStyle({ busy, disabled: approveDisabled })} disabled={approveDisabled} onClick={() => decide("approve")}>Approve lesson</button>
            <TextLink disabled={busy} onClick={() => setEditing(!editing)}>{editing ? "Cancel edit" : "Edit first"}</TextLink>
            <TextLink tone="bad" disabled={busy} onClick={() => decide("reject")}>Reject</TextLink>
            <span style={small}>Nothing is used until you approve it.</span>
          </div>
        </>
      ) : lesson.status === "proposed" ? (
        <div style={{ marginTop: 8 }}><TextLink tone="bad" disabled={busy} onClick={() => decide("reject")}>Reject</TextLink></div>
      ) : lesson.status === "active" ? (
        <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <TextLink disabled={busy} onClick={() => decide("retire")}>Retire</TextLink>
          <TextLink tone="bad" disabled={busy} onClick={() => setRevoking(!revoking)}>{revoking ? "Cancel" : "Withdraw approval"}</TextLink>
          <span style={small}>· retrieved in answers and menu reviews</span>
          {revoking ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
              <input aria-label="Why" placeholder="Why is the approval withdrawn?" style={{ ...inputStyle, width: 280 }} value={revokeNote} onChange={(e) => setRevokeNote(e.target.value)} />
              <button type="button" style={primaryButtonStyle({ busy, disabled: !revokeNote.trim() })} disabled={busy || !revokeNote.trim()} onClick={() => decide("revoke", { note: revokeNote.trim() })}>Withdraw</button>
            </div>
          ) : null}
        </div>
      ) : null}
      {err ? <div style={errorStyle}>{err}</div> : null}
    </div>
  );
}

function AssistantMessage({ m, onLessonDecided }) {
  const s = m.structured || {};
  const byCite = new Map((m.retrieved || []).map((r) => [r.cite, r]));
  const lookups = s.db_lookups || [];
  const byDb = new Map(lookups.filter((l) => l.cite).map((l) => [l.cite, l]));
  const factById = new Map((s.facts || []).map((f) => [f.id, f]));
  const label = (cite) => {
    const d = byDb.get(cite);
    if (d) return `${cite} · Database: ${TOOL_LABEL[d.tool] || d.tool}`;
    if (/^F\d+$/.test(cite)) return `${cite} · Menu run`;
    const r = byCite.get(cite);
    if (!r) return cite;
    return `${cite} · ${r.kind === "lesson" ? `Lesson #${r.rule_id}` : "Library"}${r.title ? `: ${r.title}` : ""}`;
  };
  const claims = s.retrieved_claims || [];
  const dbClaims = claims.filter((c) => /^D\d+$/.test(c.cite));
  const otherClaims = claims.filter((c) => !/^D\d+$/.test(c.cite));
  const lesson = m.proposed_rule_id ? { id: m.proposed_rule_id, title: m.lesson_title, body: m.lesson_body, status: m.lesson_status, error_class: m.lesson_error_class } : null;
  return (
    <div style={{ ...box, background: "#fbfbfd" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <strong style={{ fontSize: 13 }}>Agent 000</strong>
        <Tag tone={MODE_TONE[m.mode] || "muted"}>{MODE_LABEL[m.mode] || m.mode}</Tag>
        {s.database_backed ? <Tag tone="info">Database records</Tag> : null}
        {s.partial_data?.length ? <Tag tone="warn">Partial data</Tag> : null}
        {s.flagged_facts?.length ? <Tag tone="bad">Source text flagged</Tag> : null}
        {s.unverified ? <Tag tone="warn">Not checked in the database</Tag> : s.basis === "inference_only" && m.mode !== "clarify" && m.mode !== "error" ? <Tag tone="warn">No approved source</Tag> : null}
      </div>
      <div style={{ fontSize: 15, whiteSpace: "pre-wrap" }}>{m.content}</div>
      {dbClaims.length ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ ...small, fontWeight: 700 }}>From the database (records read just now)</div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 14 }}>
            {dbClaims.map((c, i) => <li key={i}>{c.claim} <span style={small}>({label(c.cite)})</span></li>)}
          </ul>
        </div>
      ) : null}
      {otherClaims.length ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ ...small, fontWeight: 700 }}>From approved knowledge</div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 14 }}>
            {otherClaims.map((c, i) => <li key={i}>{c.claim} <span style={small}>({label(c.cite)})</span></li>)}
          </ul>
        </div>
      ) : null}
      {s.correction ? (
        <div style={{ ...box, borderColor: "#f2c48d", marginTop: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ fontSize: 14 }}>Proposed correction</strong>
            <StatusTag status="proposed" />
            <span style={small}>Not applied. Agent 000 can't change data.</span>
          </div>
          <div style={{ fontSize: 14, marginTop: 6 }}>
            {s.correction.record.replace(/_/g, " ")} <strong>#{s.correction.id}</strong> · {s.correction.field}: {s.correction.current ?? "?"} → <strong>{s.correction.proposed ?? "?"}</strong>
          </div>
          {s.correction.reason ? <div style={{ fontSize: 14, marginTop: 4 }}>{s.correction.reason}</div> : null}
          <div style={{ ...small, marginTop: 6 }}>Evidence: {label(s.correction.cite)} · To apply it, use {s.correction.label}{s.correction.writes_live ? " (live change, needs your approval there)" : ""}.</div>
        </div>
      ) : null}
      {s.correction_problem ? <div style={{ ...small, marginTop: 6 }}>Agent 000 suggested a correction that was set aside: {s.correction_problem}.</div> : null}
      {s.inference?.length ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ ...small, fontWeight: 700 }}>Agent 000's own inference (not from an approved source)</div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 14 }}>{s.inference.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      ) : null}
      {s.unknowns?.length ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ ...small, fontWeight: 700 }}>Unknown</div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 14 }}>{s.unknowns.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      ) : null}
      {lookups.length ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ ...small, cursor: "pointer" }}>Database lookups it ran ({lookups.length})</summary>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 13 }}>
            {lookups.map((l, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <strong>{l.cite || "—"}</strong> {TOOL_LABEL[l.tool] || l.tool} <code style={{ fontSize: 12 }}>{JSON.stringify(l.args)}</code>
                {l.ok ? <span style={small}> · {l.source} · {l.ms} ms{s.citations?.includes(l.cite) ? " · cited" : " · not cited"}{l.complete === false ? ` · partial (${(l.partial || []).join("; ")})` : ""}</span> : <span style={{ color: "#b42318" }}> · refused: {l.error}</span>}
                {l.rebound ? <div style={small}>Id corrected: Agent 000 asked for {l.rebound.from.join(", ")}; used {l.rebound.to} ({l.rebound.restaurant}) because it is {l.rebound.reason}.</div> : null}
                {l.ok && factById.get(l.cite) ? (
                  <details><summary style={{ ...small, cursor: "pointer" }}>Record</summary><div style={{ fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word", color: OWNER_COLORS.muted }}>{factById.get(l.cite).text}</div></details>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {s.facts?.some((f) => /^F/.test(f.id)) && m.mode === "explain" ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ ...small, cursor: "pointer" }}>Recorded run facts it was given ({s.facts.filter((f) => /^F/.test(f.id)).length})</summary>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 13 }}>{s.facts.filter((f) => /^F/.test(f.id)).map((f) => <li key={f.id}><strong>{f.id}</strong> {f.text}</li>)}</ul>
        </details>
      ) : null}
      {m.retrieved?.length ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ ...small, cursor: "pointer" }}>Approved knowledge it was given ({m.retrieved.length})</summary>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 13 }}>
            {m.retrieved.map((r) => (
              <li key={r.cite}>
                {r.source_id ? <Link to={`/owner/knowledge/${r.source_id}`}>{label(r.cite)}</Link> : label(r.cite)}
                {s.citations?.includes(r.cite) ? <span style={{ color: "#146c2e", fontWeight: 700 }}> · cited</span> : <span style={small}> · not cited</span>}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {lesson ? <LessonCard lesson={lesson} onDecided={onLessonDecided} /> : null}
      <div style={{ ...small, marginTop: 8 }}>
        {m.seconds != null ? `${m.seconds} s` : ""}{m.versions?.model_profile ? ` · ${m.versions.model_profile}` : ""}{m.versions?.prompt_version ? ` · ${m.versions.prompt_version}` : ""}{s.db_planner ? ` · ${s.db_planner.calls} lookup-planning call${s.db_planner.calls === 1 ? "" : "s"}` : ""}
        {s.unsupported_claims?.length ? ` · ${s.unsupported_claims.length} citation(s) removed as unsupported` : ""}
        {s.flagged_facts?.length ? ` · flagged source text in ${s.flagged_facts.map((f) => f.cite).join(", ")} (shown as data only)` : ""}
        {s.withheld_lessons?.length ? ` · ${s.withheld_lessons.length} approved lesson(s) withheld: they now read like instructions` : ""}
      </div>
    </div>
  );
}

function OwnLessonForm({ conversationId, onDone }) {
  const [title, setTitle] = useState("");
  const [rule, setRule] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    setBusy(true);
    setErr("");
    try { await proposeConversationLesson(conversationId, { title, rule }); setTitle(""); setRule(""); await onDone(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div style={{ ...box, marginTop: 8 }}>
      <label style={labelStyle} htmlFor="own-lesson-title">Write a lesson yourself</label>
      <input id="own-lesson-title" placeholder="Short title" style={{ ...inputStyle, width: "100%" }} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea aria-label="Rule" placeholder="The rule, in one or two sentences" style={{ ...inputStyle, width: "100%", minHeight: 60, marginTop: 6 }} value={rule} onChange={(e) => setRule(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <button type="button" style={primaryButtonStyle({ busy, disabled: !title || !rule })} disabled={busy || !title || !rule} onClick={save}>Propose lesson</button>
      </div>
      {err ? <div style={errorStyle}>{err}</div> : null}
    </div>
  );
}

function Conversation({ id, profiles, switches, onLessonsChanged, reloadKey }) {
  const [conv, setConv] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState("");
  const [ownLesson, setOwnLesson] = useState(false);
  const endRef = useRef(null);
  const load = useCallback(() => getConversation(id).then((c) => { setConv(c); setProfile((p) => p || c.model_profile || ""); }).catch((e) => setErr(e.message)), [id]);
  useEffect(() => { setConv(null); load(); }, [load, reloadKey]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [conv?.messages?.length, sending]);
  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    setErr("");
    setConv((c) => ({ ...c, messages: [...(c?.messages || []), { id: "pending", role: "owner", content: t }] }));
    setText("");
    try {
      await sendConversationMessage(id, t, profile || null);
      await load();
      await onLessonsChanged();
    } catch (e) {
      setErr(e.payload?.code === "LEARNING_FLAG_OFF" ? "The agent can't use approved knowledge while that switch is off. Turn it on above." : e.message);
      await load();
      setText(t);
    } finally { setSending(false); }
  };
  if (!conv) return <div style={mutedStyle}>{err || "Loading…"}</div>;
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <strong style={{ fontSize: 16 }}>{conv.title}</strong>
        {conv.lab_case_id ? <Tag tone="info">About a menu</Tag> : null}
        <span style={{ marginLeft: "auto" }} />
        <label style={{ ...small, display: "flex", gap: 6, alignItems: "center" }}>
          Model
          <select aria-label="Model" value={profile} onChange={(e) => setProfile(e.target.value)} style={{ ...inputStyle, padding: "5px 8px", fontSize: 13 }}>
            <option value="">Default</option>
            {(profiles || []).map((p) => <option key={p.id} value={p.id} disabled={!p.available}>{p.label}{p.available ? "" : " (not running)"}</option>)}
          </select>
        </label>
      </div>
      <ConversationFiles id={id} reloadKey={reloadKey} />
      <div style={{ display: "grid", gap: 10 }}>
        {conv.messages.length === 0 ? <div style={mutedStyle}>Ask Agent 000 about menus and Menubloc's data ("How many California restaurants do we have?"), "Is 'Add Bacon $1.50' a dish?", "What's wrong with the Wendy's prices in Dothan?", "Which MKS key does a smash burger use?", "Why is Menubot job #619 risky?" Attach a menu photo, PDF or spreadsheet and ask about it. Teach it a rule and it proposes a lesson; ask it to fix data and it proposes a correction.</div> : null}
        {conv.messages.map((m) => (m.role === "owner" ? (
          <div key={m.id} style={{ justifySelf: "end", maxWidth: "85%", ...box, background: OWNER_COLORS.accentSoft || "#eef2ff", whiteSpace: "pre-wrap", fontSize: 15 }}>{m.content}</div>
        ) : (
          <AssistantMessage key={m.id} m={m} onLessonDecided={async () => { await load(); await onLessonsChanged(); }} />
        )))}
        {sending ? <div style={mutedStyle}>Agent 000 is thinking on the Mac (usually 5–60 s)…</div> : null}
        <div ref={endRef} />
      </div>
      <div style={{ marginTop: 12 }}>
        <textarea
          aria-label="Message to Agent 000"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
          placeholder={switches?.learning_retrieval ? "Ask a question or teach a rule…" : "Turn on “Agent uses approved knowledge” to talk with Agent 000"}
          style={{ ...inputStyle, width: "100%", minHeight: 70 }}
        />
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <button type="button" style={primaryButtonStyle({ busy: sending, disabled: !text.trim() })} disabled={sending || !text.trim()} onClick={send}>Send</button>
          <TextLink onClick={() => setOwnLesson(!ownLesson)}>{ownLesson ? "Close" : "Write a lesson yourself"}</TextLink>
          <span style={small}>⌘↩ sends</span>
        </div>
        {ownLesson ? <OwnLessonForm conversationId={id} onDone={async () => { setOwnLesson(false); await onLessonsChanged(); }} /> : null}
        {err ? <div style={errorStyle}>{err}</div> : null}
      </div>
    </div>
  );
}

const READING_FLAG_LABEL = {
  empty_page: "empty page", little_text: "little text", low_ocr_confidence: "weak OCR", low_confidence_line: "unclear numbers",
  ocr_pages_capped: "not every page read", uncertain_price: "prices to check", ambiguous_table: "unclear table", rows_capped: "long table",
  formula_not_calculated: "formulas without values", instructions_in_content: "contains instructions (ignored)",
  vision_price_disagrees: "vision and OCR disagree", vision_only_item: "vision-only items", vision_unreadable: "vision couldn't read",
};
const fileSize = (b) => (b == null ? "" : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Plan 55 §11: files attached to the conversation. Agent 000 reads them (OCR first; vision as a second reading). */
function ConversationFiles({ id, reloadKey }) {
  const [files, setFiles] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  const inputRef = useRef(null);
  const load = useCallback(() => listConversationFiles(id).then((r) => setFiles(r.files || [])).catch((e) => { setFiles([]); setErr(e.message); }), [id]);
  useEffect(() => { load(); }, [load, reloadKey]);
  const reading = (files || []).some((f) => ["pending", "processing", "queued"].includes(f.reading));
  useEffect(() => {
    if (!reading) return undefined;
    const t = setTimeout(load, 3000);
    return () => clearTimeout(t);
  }, [reading, files, load]);
  const attach = async (list) => {
    if (!list?.length) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      [...list].forEach((f) => fd.append("files", f));
      await attachConversationFiles(id, fd);
      await load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };
  return (
    <div style={{ ...box, marginBottom: 10, padding: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontSize: 14 }}>Files</strong>
        <span style={small}>PNG, JPG, PDF, Word, Excel, CSV, text or web page. Read here; text in a file is data, never an instruction.</span>
        <span style={{ marginLeft: "auto" }} />
        <input ref={inputRef} type="file" multiple aria-label="Attach files" style={{ display: "none" }}
          accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.xlsx,.csv,.txt,.md,.html,.htm" onChange={(e) => attach(e.target.files)} />
        <button type="button" style={{ ...secondaryButtonStyle, padding: "5px 12px", fontSize: 13, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? "Attaching…" : "Attach files"}</button>
      </div>
      {(files || []).length ? (
        <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
          {files.map((f) => {
            const flags = f.quality?.flags || [];
            const state = f.reading === "processed" ? (f.quality?.status === "good" ? "Read" : f.quality?.status === "poor" ? "Read poorly" : "Read, check flags") : f.reading === "failed" ? "Couldn't read" : "Reading…";
            return (
              <div key={f.source_id} style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{f.filename}</span>
                <span style={small}> · {fileSize(f.bytes)}{f.pages ? ` · ${f.pages} page${f.pages > 1 ? "s" : ""}` : ""}{f.tables ? ` · ${f.tables} table${f.tables > 1 ? "s" : ""}` : ""}{f.ocr_confidence != null ? ` · OCR ${Math.round(f.ocr_confidence)}/100` : ""}{f.vision ? (f.vision.used ? ` · vision: ${f.vision.model}` : " · OCR only") : ""} · </span>
                <span style={{ fontWeight: 700, color: f.reading === "failed" || f.quality?.status === "poor" ? "#b42318" : f.quality?.status === "check" ? "#9a6700" : OWNER_COLORS.ink }}>{state}</span>
                {flags.length ? <> {" "}<TextLink onClick={() => setOpen(open === f.source_id ? null : f.source_id)}>{open === f.source_id ? "Hide" : `${flags.length} flag${flags.length > 1 ? "s" : ""}`}</TextLink></> : null}
                {f.error ? <div style={errorStyle}>{f.error}</div> : null}
                {open === f.source_id ? (
                  <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 12 }}>
                    {flags.map((x, i) => <li key={i}><strong>{READING_FLAG_LABEL[x.code] || x.code}</strong>{x.page ? ` (page ${x.page})` : ""}: {x.detail}{x.examples?.length ? <span style={small}> e.g. {x.examples.slice(0, 3).join(" · ")}</span> : null}</li>)}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {err ? <div style={errorStyle}>{err}</div> : null}
    </div>
  );
}

function CorrectionForm({ item, prev, runId, onSaved }) {
  const [kind, setKind] = useState("modifier");
  const [value, setValue] = useState("");
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const k = FIX_KINDS.find((x) => x.id === kind);
  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      const after = kind === "modifier" ? { kind: "modifier", parent: prev?.name || null } : kind === "price" ? { price: Number(value) } : kind === "name" ? { name: value } : null;
      const c = await addLabCorrection(runId, { op: k.op, target_refs: [item.ref], error_class: k.error_class, after, explanation: why });
      await onSaved(c.correction);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div style={{ ...box, marginTop: 6, background: "#fffdf7" }}>
      <label style={labelStyle} htmlFor={`fix-${item.ref}`}>What's wrong with “{item.name}”?</label>
      <select id={`fix-${item.ref}`} value={kind} onChange={(e) => setKind(e.target.value)} style={{ ...inputStyle, padding: "6px 8px" }}>
        {FIX_KINDS.map((x) => <option key={x.id} value={x.id} disabled={x.id === "modifier" && !prev}>{x.label}</option>)}
      </select>
      {kind === "modifier" && prev ? <div style={{ ...small, marginTop: 4 }}>It will be attached to “{prev.name}”.</div> : null}
      {kind === "price" || kind === "name" ? (
        <input aria-label={kind === "price" ? "Correct price" : "Correct name"} placeholder={kind === "price" ? "Correct price" : "Correct name"} value={value} onChange={(e) => setValue(e.target.value)} style={{ ...inputStyle, marginLeft: 8, width: 160 }} />
      ) : null}
      <textarea aria-label="Why is it wrong?" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Why is it wrong? Say it as a rule Agent 000 can use on other menus." style={{ ...inputStyle, width: "100%", minHeight: 60, marginTop: 8 }} />
      <div style={{ marginTop: 8 }}>
        <button type="button" style={primaryButtonStyle({ busy, disabled: !why.trim() || ((kind === "price" || kind === "name") && !value) })} disabled={busy || !why.trim()} onClick={save}>Save correction</button>
      </div>
      {err ? <div style={errorStyle}>{err}</div> : null}
    </div>
  );
}

function RunItems({ run, onCorrect, openRef, setOpenRef }) {
  const items = run.candidates || [];
  const lessonChanges = (run.decisions || []).filter((d) => d.stage === "lessonsReview" && d.ref);
  return (
    <div>
      {lessonChanges.length ? (
        <div style={{ ...box, marginBottom: 8, background: "#f6f8ff" }}>
          <div style={{ ...small, fontWeight: 700 }}>What Agent 000 changed using lessons</div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 14 }}>
            {lessonChanges.map((d) => (
              <li key={d.ref}>
                “{d.name}”: {d.applied ? (d.decision === "modifier" ? "made an add-on of the item above" : "held as not an item") : d.decision === "keep" ? "kept" : `not changed (${d.not_applied || "no citation"})`}
                {d.lesson_ids?.length ? <span style={small}> · lesson {d.lesson_ids.map((x) => `#${x}`).join(", ")}</span> : null}
              </li>
            ))}
          </ul>
          {run.debug_same_case ? <div style={{ ...small, marginTop: 6 }}>Same-menu rerun: it may use this menu's own lessons, so it shows the lesson working, not that Agent 000 learned. Try a different menu for that.</div> : null}
        </div>
      ) : null}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>
          {items.map((it, i) => (
            <React.Fragment key={it.ref}>
              <tr style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                <td style={{ padding: "6px 4px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700 }}>{it.name}</div>
                  {it.section ? <div style={small}>{it.section}</div> : null}
                  {(it.modifiers || []).length ? <div style={small}>Add-ons: {it.modifiers.map((m) => `${m.name}${m.price != null ? ` ${m.price}` : ""}`).join(" · ")}</div> : null}
                </td>
                <td style={{ padding: "6px 4px", verticalAlign: "top", whiteSpace: "nowrap" }}>{it.price != null ? `$${Number(it.price).toFixed(2)}` : "—"}</td>
                <td style={{ padding: "6px 4px", verticalAlign: "top" }}>{it.validation?.status && it.validation.status !== "accepted" ? <StatusTag status={it.validation.status} /> : null}</td>
                <td style={{ padding: "6px 4px", verticalAlign: "top", textAlign: "right" }}>
                  {onCorrect ? <TextLink onClick={() => setOpenRef(openRef === it.ref ? null : it.ref)}>{openRef === it.ref ? "Close" : "Correct"}</TextLink> : null}
                </td>
              </tr>
              {openRef === it.ref ? (
                <tr><td colSpan={4}><CorrectionForm item={it} prev={items[i - 1]} runId={run.id} onSaved={onCorrect} /></td></tr>
              ) : null}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {(run.held || []).length ? <div style={{ ...small, marginTop: 6 }}>Held, not shown as dishes: {run.held.map((h) => h.name).join(" · ")}</div> : null}
    </div>
  );
}

function MenuWorkbench({ conversation, switches, onNewConversation, onLessonsChanged }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [lab, setLab] = useState(null); // { case, runs }
  const [run, setRun] = useState(null);
  const [openRef, setOpenRef] = useState(null);
  const caseId = conversation?.lab_case_id || null;

  const loadCase = useCallback(async (id, wantRunId = null) => {
    const c = await getLabCase(id);
    setLab(c);
    const target = wantRunId || c.runs.find((r) => r.status === "done")?.id || c.runs[0]?.id;
    if (target) {
      const r = await getLabRun(target);
      setRun(r?.run ? r : null);
    }
    return c;
  }, []);
  useEffect(() => { setLab(null); setRun(null); if (caseId) loadCase(caseId).catch((e) => setErr(e.message)); }, [caseId, loadCase]);

  const waitForRun = async (runId) => {
    for (let i = 0; i < 240; i += 1) {
      const r = await getLabRun(runId);
      if (!["queued", "running"].includes(r.run.status)) return r;
      await sleep(1500);
    }
    throw new Error("The run is taking longer than 6 minutes; check the Training Lab.");
  };

  const readMenu = async () => {
    setErr("");
    setBusy("Reading the menu with the real extraction (sandbox)…");
    try {
      const fd = new FormData();
      const name = title.trim() || (files[0]?.name) || "Menu I'm teaching with";
      if (files.length) {
        files.forEach((f) => fd.append("files", f));
        fd.append("groups", JSON.stringify([files.map((_, i) => i)]));
        fd.append("cases", JSON.stringify([{ title: name, split: "dev" }]));
      } else {
        fd.append("texts", JSON.stringify([{ title: name, text }]));
        fd.append("cases", JSON.stringify([{ title: name, split: "dev" }]));
      }
      fd.append("label", `Teach: ${name}`);
      const b = await createLabBatch(fd);
      const c = b.cases[0];
      const caseView = await getLabCase(c.id);
      const first = caseView.runs[0];
      const done = await waitForRun(first.id);
      if (done.run.status !== "done") throw new Error(done.run.error || `The run ${done.run.status}`);
      const conv = await createConversation({ lab_run_id: done.run.id, title: `About: ${name}` });
      setText(""); setTitle(""); setFiles([]);
      onNewConversation(conv.conversation.id);
    } catch (e) { setErr(e.message); } finally { setBusy(""); }
  };

  const rerun = async (opts) => {
    setErr("");
    setBusy(opts.arm === "lessons" ? "Agent 000 is reviewing the menu with approved lessons…" : "Running the extraction again…");
    try {
      const q = await queueLabRun(caseId, opts);
      const done = await waitForRun(q.run_id);
      await loadCase(caseId, done.run.id);
    } catch (e) {
      setErr(e.payload?.code === "LEARNING_FLAG_OFF" ? "Turn on both switches above to let Agent 000 review menus." : e.message);
    } finally { setBusy(""); }
  };

  const corrections = run ? (lab?.corrections || []).filter((c) => String(c.run_id) === String(run.run.id)) : [];
  const act = async (fn) => {
    setErr("");
    try { await fn(); await loadCase(caseId, run?.run.id); await onLessonsChanged(); } catch (e) { setErr(e.message); }
  };

  if (!caseId) {
    return (
      <div>
        <div style={mutedStyle}>Paste a menu (or choose its photos/PDF). It runs through the real extraction in the sandbox; nothing is published. Then correct what it got wrong.</div>
        <input aria-label="Menu name" placeholder="Menu name (optional)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...inputStyle, width: "100%", marginTop: 10 }} />
        <textarea aria-label="Menu text" placeholder={"BURGERS\nClassic Burger 9.99\nAdd Bacon 1.50"} value={text} onChange={(e) => setText(e.target.value)} disabled={files.length > 0} style={{ ...inputStyle, width: "100%", minHeight: 150, marginTop: 8, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }} />
        <div style={{ marginTop: 8, fontSize: 13 }}>
          or files: <input aria-label="Menu files" type="file" multiple accept=".pdf,image/*" onChange={(e) => setFiles([...e.target.files])} />
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="button" style={primaryButtonStyle({ busy: Boolean(busy), disabled: !text.trim() && !files.length })} disabled={Boolean(busy) || (!text.trim() && !files.length)} onClick={readMenu}>Read this menu</button>
        </div>
        {busy ? <div style={{ ...mutedStyle, marginTop: 8 }}>{busy}</div> : null}
        {err ? <div style={errorStyle}>{err}</div> : null}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <strong>{lab?.case?.title || "Menu"}</strong>
        {lab?.case ? <Tag>{lab.case.split === "dev" ? "Teaching menu" : lab.case.split}</Tag> : null}
        <span style={{ marginLeft: "auto" }} />
        {lab?.case ? <Link to={`/owner/training-lab/${lab.case.id}`} style={{ fontSize: 13, fontWeight: 700 }}>Open in Training Lab ›</Link> : null}
      </div>
      {lab?.runs?.length ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
          {lab.runs.filter((r) => r.status === "done").slice().reverse().map((r) => (
            <button key={r.id} type="button" onClick={() => loadCase(caseId, r.id)}
              style={{ ...secondaryButtonStyle, padding: "4px 10px", fontSize: 12, borderColor: String(run?.run.id) === String(r.id) ? OWNER_COLORS.accent : OWNER_COLORS.line }}>
              Run {r.id} · {r.arm === "lessons" ? `with lessons${r.debug_same_case ? " (same menu)" : ""}` : "baseline"}
            </button>
          ))}
        </div>
      ) : null}
      {run ? <RunItems run={run.run} openRef={openRef} setOpenRef={setOpenRef} onCorrect={async () => { setOpenRef(null); await loadCase(caseId, run.run.id); }} /> : <div style={mutedStyle}>Loading the run…</div>}
      {run?.diff && (run.diff.added?.length || run.diff.removed?.length || run.diff.changed?.length) ? (
        <div style={{ ...small, marginTop: 8 }}>Compared with the run before: {run.diff.removed?.length || 0} removed · {run.diff.added?.length || 0} added · {run.diff.changed?.length || 0} changed</div>
      ) : null}

      {corrections.length ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...small, fontWeight: 700 }}>Your corrections on this run</div>
          {corrections.map((c) => (
            <div key={c.id} style={{ ...box, marginTop: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <strong style={{ fontSize: 14 }}>{(c.before || []).map((b) => b.name).join(", ")}</strong>
                <Tag>{humanClass(c.error_class)}</Tag>
                <StatusTag status={c.status} />
                {c.agent_rule_id ? <Tag tone="info">Lesson #{c.agent_rule_id}</Tag> : null}
              </div>
              {c.explanation ? <div style={{ fontSize: 14, marginTop: 4 }}>{c.explanation}</div> : null}
              <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                {c.status === "proposed" ? <TextLink onClick={() => act(() => reviewLabCorrection(c.id, "approved"))}>Approve correction</TextLink> : null}
                {c.status === "proposed" ? <TextLink tone="bad" onClick={() => act(() => reviewLabCorrection(c.id, "rejected"))}>Reject</TextLink> : null}
                {c.status === "approved" && !c.agent_rule_id ? <TextLink onClick={() => act(() => promoteLabCorrection(c.id))}>Make it a lesson</TextLink> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
        <button type="button" style={primaryButtonStyle({ busy: Boolean(busy), disabled: !switches?.learning_lab_llm || !switches?.learning_retrieval })} disabled={Boolean(busy)} onClick={() => rerun({ arm: "lessons", debug_same_case: true })}>Run again with lessons</button>
        <TextLink disabled={Boolean(busy)} onClick={() => rerun({ arm: "baseline" })}>Run again without lessons</TextLink>
        <TextLink onClick={() => onNewConversation(null)}>Teach with another menu</TextLink>
      </div>
      <div style={{ ...small, marginTop: 6 }}>To see whether Agent 000 really learned, give it a different menu with the same kind of mistake.</div>
      {busy ? <div style={{ ...mutedStyle, marginTop: 8 }}>{busy}</div> : null}
      {err ? <div style={errorStyle}>{err}</div> : null}
    </div>
  );
}

function LessonsPanel({ lessons, reload }) {
  const [showAll, setShowAll] = useState(false);
  if (!lessons) return <div style={mutedStyle}>Loading…</div>;
  const proposed = lessons.filter((l) => l.status === "proposed");
  const active = lessons.filter((l) => l.status === "active");
  return (
    <div>
      {proposed.length ? <div style={{ ...small, fontWeight: 700 }}>Waiting for you ({proposed.length})</div> : null}
      {proposed.map((l) => <LessonCard key={l.id} lesson={l} onDecided={reload} />)}
      <div style={{ ...small, fontWeight: 700, marginTop: 12 }}>Approved and in use ({active.length})</div>
      {active.length === 0 ? <div style={mutedStyle}>None yet.</div> : null}
      {(showAll ? active : active.slice(0, 4)).map((l) => <LessonCard key={l.id} lesson={l} onDecided={reload} />)}
      {active.length > 4 ? <div style={{ marginTop: 6 }}><TextLink onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : `Show all ${active.length}`}</TextLink></div> : null}
    </div>
  );
}

/**
 * Plan 55: the same page is the Talk tab of the Agent 000 workspace (embedded, basePath /owner/agent-000/talk).
 * /owner/teach keeps working for old links.
 */
export default function OwnerTeach({ embedded = false, basePath = "/owner/teach" }) {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [switches, reloadSwitches] = useSwitches();
  const [profiles, setProfiles] = useState(null);
  const [conversations, setConversations] = useState(null);
  const [current, setCurrent] = useState(null);
  const [lessons, setLessons] = useState(null);
  const [err, setErr] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadLessons = useCallback(() => listLessons().then((r) => setLessons(r.lessons)).catch(() => setLessons([])), []);
  const loadConversations = useCallback(() => listConversations().then((r) => setConversations(r.conversations)).catch((e) => setErr(e.message)), []);
  useEffect(() => {
    loadLessons();
    loadConversations();
    listModelProfiles().then((r) => setProfiles(r.profiles)).catch(() => setProfiles([]));
  }, [loadLessons, loadConversations]);
  useEffect(() => {
    if (!conversationId) return;
    getConversation(conversationId).then(setCurrent).catch((e) => setErr(e.message));
  }, [conversationId, reloadKey]);
  const shownConversation = conversationId && current?.id === conversationId ? current : null;

  const startConversation = async () => {
    setErr("");
    try {
      const c = await createConversation({ title: `Conversation ${new Date().toLocaleDateString()}` });
      await loadConversations();
      navigate(`${basePath}/${c.conversation.id}`);
    } catch (e) { setErr(e.message); }
  };
  const openConversation = async (id) => {
    await loadConversations();
    if (id) navigate(`${basePath}/${id}`);
    else navigate(`${basePath}?menu=new`);
  };
  const lessonsChanged = async () => { await loadLessons(); setReloadKey((k) => k + 1); };

  const body = (
    <>
      <div style={{ ...mutedStyle, marginBottom: 8 }}>
        Agent 000 answers from knowledge you approved, says when it's guessing, and proposes lessons. Approved lessons are looked up in later answers and menu reviews. They don't change the model itself. Runs on this Mac; nothing here is published.
      </div>
      <SwitchLine switches={switches} onChange={reloadSwitches} />
      {err ? <div style={errorStyle}>{err}</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", gap: 16 }} className="teach-grid">
        <style>{"@media (max-width: 1000px) { .teach-grid { grid-template-columns: minmax(0,1fr) !important; } }"}</style>
        <PageCard>
          <SectionTitle
            title="Conversation"
            action={<span style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {conversations?.length ? (
                <select aria-label="Open a conversation" value={conversationId || ""} onChange={(e) => navigate(e.target.value ? `${basePath}/${e.target.value}` : basePath)} style={{ ...inputStyle, padding: "5px 8px", fontSize: 13, maxWidth: 220 }}>
                  <option value="">Conversations…</option>
                  {conversations.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.messages})</option>)}
                </select>
              ) : null}
              <TextLink onClick={startConversation}>New conversation</TextLink>
            </span>}
          />
          {conversationId ? (
            <Conversation id={conversationId} profiles={profiles} switches={switches} onLessonsChanged={lessonsChanged} reloadKey={reloadKey} />
          ) : (
            <div style={mutedStyle}>Start a new conversation, or read a menu on the right and talk about it.</div>
          )}
        </PageCard>
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <PageCard>
            <SectionTitle title="Teach with a menu" />
            <MenuWorkbench conversation={shownConversation} switches={switches} onNewConversation={openConversation} onLessonsChanged={lessonsChanged} />
          </PageCard>
          <PageCard>
            <SectionTitle title="Lessons" />
            <LessonsPanel lessons={lessons} reload={lessonsChanged} />
          </PageCard>
        </div>
      </div>
    </>
  );
  if (embedded) return body;
  return (
    <OwnerLayout title="Agent 000" actions={<span style={{ display: "flex", gap: 14 }}><Link to="/owner/agent-000" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>Workspace ›</Link><Link to="/owner/knowledge" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>Knowledge Library ›</Link><Link to="/owner/training-lab" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>Training Lab ›</Link></span>}>
      {body}
    </OwnerLayout>
  );
}
