import React, { useState } from "react";
import { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { fiApi } from "../../../lib/ownerFoodIntelligenceApi.js";
import { Banner, Btn, ConfirmDialog, Loading, Tag, inputStyle, labelStyle, useLoad, when } from "./fiUi.jsx";

/**
 * 2026-11-28 (plan 72): Food Ontology → Proposals. Andre reviews what CK is holding for him: new keys, concepts,
 * vocabulary, relationships and mealtime rules. Approve / Reject / Revise go to CK
 * (/api/owner/food-intelligence/food_ontology/review/…), which writes the same mks.* / cio.* rows production
 * classification reads. This screen keeps no copy of its own.
 */

const KINDS = [
  ["ontology_key", "Keys"],
  ["food_concept", "Concepts"],
  ["ontology_alias", "Vocabulary"],
  ["key_relationship", "Relationships"],
  ["meal_eligibility", "Mealtime"],
  ["ontology_gap", "Gaps"],
  ["food_concept_alias", "Concept names"],
];
const MEALS = ["breakfast", "lunch", "dinner", "late_night"];
// What Andre may change on a revision (matches REVISABLE in src/services/ck/ontologyReview.js).
const REVISE_FIELDS = {
  ontology_key: [["canonical_name", "Name"], ["parent_key", "Parent key", "number"], ["definition", "Definition", "long"], ["distinguishing_traits", "Traits", "list"], ["exclusions", "Not this (exclusions)", "list"], ["examples", "Examples", "list"]],
  ontology_alias: [["alias_text", "Term"], ["product_key", "Key", "number"], ["alias_kind", "Kind"], ["locale", "Language code"]],
  key_relationship: [["product_key", "Key", "number"], ["relation_type", "Kind"], ["target_id", "Concept or facet"]],
  meal_eligibility: [["meals", "Meals", "meals"], ["note", "Note"]],
  ontology_gap: [["summary", "Summary", "long"], ["suggested_key", "Suggested key", "number"]],
  food_concept: [["canonical_name", "Name"], ["parent_ingredient_id", "Parent concept"], ["ingredient_family", "Family"]],
  food_concept_alias: [["alias_text", "Name"], ["locale", "Language code"]],
};
const errText = (e) => (e ? e.message || String(e) : "");
const show = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join("; ") : v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));

function ReviseForm({ hold, onDone, onCancel }) {
  const fields = REVISE_FIELDS[hold.kind] || [];
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map(([k, , t]) => [k, t === "list" ? (hold.fields[k] || []).join("; ") : t === "meals" ? hold.fields[k] || [] : hold.fields[k] ?? ""])));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  async function save() {
    const changed = {};
    for (const [k, , t] of fields) {
      let v = vals[k];
      if (t === "list") v = String(v).split(";").map((s) => s.trim()).filter(Boolean);
      if (t === "number") v = v === "" ? null : Number(v);
      if (JSON.stringify(v) !== JSON.stringify(hold.fields[k] ?? (t === "list" || t === "meals" ? [] : t === "number" ? null : ""))) changed[k] = v;
    }
    if (!Object.keys(changed).length) { setErr("Nothing changed."); return; }
    setBusy(true);
    setErr(null);
    try {
      const out = await fiApi.ontologyReviewRevise(hold.hold_id, changed, note);
      if (out.result?.revised === false) setErr(`CK would refuse this revision, so nothing changed: ${(out.result.reasons || []).map((r) => r.message).join(" ")}`);
      else onDone(`Revised. The new version waits for your approval (hold #${out.result?.hold_id}).`);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, marginTop: 10, paddingTop: 10 }}>
      {err ? <Banner tone="error">{err}</Banner> : null}
      {fields.map(([k, label, t]) => (
        <div key={k}>
          <label style={labelStyle} htmlFor={`rv-${hold.hold_id}-${k}`}>{label}{t === "list" ? " (separate with ;)" : ""}</label>
          {t === "meals" ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
              {MEALS.map((m) => (
                <label key={m} style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                  <input type="checkbox" checked={vals.meals.includes(m)} onChange={(e) => setVals((v) => ({ ...v, meals: e.target.checked ? [...v.meals, m] : v.meals.filter((x) => x !== m) }))} />
                  {m.replace("_", " ")}
                </label>
              ))}
            </div>
          ) : t === "long" ? (
            <textarea id={`rv-${hold.hold_id}-${k}`} value={vals[k]} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} rows={3} style={{ ...inputStyle, width: "100%" }} />
          ) : (
            <input id={`rv-${hold.hold_id}-${k}`} value={vals[k]} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} style={{ ...inputStyle, width: "100%", maxWidth: 420 }} />
          )}
        </div>
      ))}
      <label style={labelStyle} htmlFor={`rv-${hold.hold_id}-note`}>Why (optional)</label>
      <input id={`rv-${hold.hold_id}-note`} value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, width: "100%", maxWidth: 420 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Btn kind="primary" onClick={save} disabled={busy}>{busy ? "Checking with CK…" : "Save revision"}</Btn>
        <Btn onClick={onCancel} disabled={busy}>Cancel</Btn>
      </div>
    </div>
  );
}

function HoldRow({ hold, canDecide, onChanged }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // revise | reject
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const closed = hold.status !== "open";
  async function act(fn, ok) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ tone: "ok", text: ok });
      onChanged();
    } catch (e) {
      setMsg({ tone: "error", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }
  const reasons = (hold.reasons || []).filter((r) => r.code !== "andre_approval_required");
  return (
    <div style={{ borderBottom: `1px solid ${OWNER_COLORS.line}`, padding: "12px 4px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ background: "none", border: 0, padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit", color: OWNER_COLORS.ink, flex: "1 1 320px" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{open ? "▾" : "▸"} {hold.summary}</div>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 3 }}>
            #{hold.hold_id} · {hold.proposer} · {when(hold.created_at)}{closed ? ` · ${hold.status.replace("_", " ")}${hold.resolved_by ? ` by ${hold.resolved_by}` : ""}` : ""}
          </div>
          {reasons.length ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{reasons.map((r, i) => <Tag key={i} tone="warn">{r.message || r.code}</Tag>)}</div> : null}
        </button>
        {!closed && canDecide ? (
          <div style={{ display: "flex", gap: 6 }}>
            <Btn small kind="primary" disabled={busy} onClick={() => act(() => fiApi.ontologyReviewApprove(hold.hold_id), "Approved. CK re-checked it and wrote it.")}>Approve</Btn>
            <Btn small disabled={busy} onClick={() => { setOpen(true); setMode(mode === "revise" ? null : "revise"); }}>Revise</Btn>
            <Btn small kind="danger" disabled={busy} onClick={() => { setOpen(true); setMode(mode === "reject" ? null : "reject"); }}>Reject</Btn>
          </div>
        ) : null}
      </div>
      {msg ? <div style={{ marginTop: 8 }}><Banner tone={msg.tone}>{msg.text}</Banner></div> : null}
      {open ? (
        <div style={{ marginTop: 10, fontSize: 13 }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {Object.entries(hold.fields || {}).filter(([, v]) => show(v) !== "").map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: "3px 10px 3px 0", color: OWNER_COLORS.muted, verticalAlign: "top", whiteSpace: "nowrap" }}>{k.replace(/_/g, " ")}</td>
                  <td style={{ padding: "3px 0", wordBreak: "break-word" }}>{show(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mode === "revise" ? <ReviseForm hold={hold} onCancel={() => setMode(null)} onDone={(t) => { setMode(null); setMsg({ tone: "ok", text: t }); onChanged(); }} /> : null}
          {mode === "reject" ? (
            <div style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, marginTop: 10, paddingTop: 10 }}>
              <label style={labelStyle} htmlFor={`rj-${hold.hold_id}`}>Why (optional)</label>
              <input id={`rj-${hold.hold_id}`} value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, width: "100%", maxWidth: 420 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Btn kind="danger" disabled={busy} onClick={() => act(() => fiApi.ontologyReviewReject(hold.hold_id, note), "Rejected. Nothing was written.")}>Reject</Btn>
                <Btn onClick={() => setMode(null)} disabled={busy}>Cancel</Btn>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Findings() {
  const f = useLoad(() => fiApi.ontologyReviewFindings(), []);
  if (f.loading) return <Loading />;
  if (f.error) return <Banner tone="error">{errText(f.error)}</Banner>;
  const dups = f.data.duplicates || [];
  const bad = f.data.incorrect_aliases || [];
  return (
    <>
      <p style={{ fontSize: 13, color: OWNER_COLORS.muted, margin: "0 0 10px" }}>
        Found by checking the live ontology. Read-only for now: resolving one (retire a duplicate key into its survivor, move an alias) is the next CK action to be built.
      </p>
      <h3 style={{ fontSize: 14, margin: "14px 0 6px" }}>Same name on two keys ({dups.length})</h3>
      {dups.map((d) => (
        <div key={d.id} style={{ fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
          <div><strong>{d.terms.join("; ")}</strong> <Tag tone={d.kind === "duplicate" ? "bad" : "info"}>{d.kind === "duplicate" ? "same dish twice" : "different dishes, shared name"}</Tag></div>
          {d.keys.map((k) => <div key={k.key} style={{ color: OWNER_COLORS.muted }}>{k.key} · {k.path} · {k.items} dishes{d.survivor === k.key ? " · suggested keeper" : ""}</div>)}
        </div>
      ))}
      <h3 style={{ fontSize: 14, margin: "18px 0 6px" }}>Aliases that contradict their key ({bad.length})</h3>
      {bad.map((a, i) => (
        <div key={i} style={{ fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
          “{a.alias_text}” on {a.product_key} {a.label}: {a.detail}{a.suggested_key ? ` → suggested ${a.suggested_key}` : ""}
        </div>
      ))}
    </>
  );
}

function FileReviewSet({ canDecide, onFiled }) {
  const [dry, setDry] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  async function run(apply) {
    setBusy(true);
    setMsg(null);
    try {
      const out = await fiApi.ontologyReviewFile(apply);
      if (apply) { setConfirm(false); setMsg({ tone: "ok", text: `Filed ${out.result.hold || 0} proposals; CK is holding them for you. ${out.result.duplicate_request || 0} were already filed; ${out.result.waiting_for_parent || 0} wait for their key to be approved.` }); onFiled(); }
      else setDry(out.result);
    } catch (e) {
      setMsg({ tone: "error", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p style={{ fontSize: 13, color: OWNER_COLORS.muted, margin: "0 0 10px" }}>
        Puts the Plan 72 proposals (new keys, concepts, vocabulary, relationships, mealtime rules) into this queue. CK checks each one and holds it; nothing is written until you approve it. Aliases and links for a new key are filed once that key is approved (run this again).
      </p>
      {msg ? <Banner tone={msg.tone}>{msg.text}</Banner> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn onClick={() => run(false)} disabled={busy}>Check first (dry run)</Btn>
        <Btn kind="primary" onClick={() => setConfirm(true)} disabled={busy || !canDecide || !dry}>File them for review</Btn>
      </div>
      {dry ? (
        <div style={{ fontSize: 13, marginTop: 10 }}>
          {dry.problems ? <Banner tone="error">The proposal files have problems: {dry.problems.map((p) => p.message).join("; ")}</Banner> : (
            <>CK would hold <strong>{dry.hold || 0}</strong>, refuse <strong>{dry.reject || 0}</strong> (already filed: {dry.duplicate_request || 0}; waiting for their key: {dry.waiting_for_parent || 0}).
              {dry.rejected?.length ? <ul style={{ margin: "6px 0 0 18px" }}>{dry.rejected.slice(0, 30).map((r, i) => <li key={i}>{r.summary}: {(r.reasons || []).map((x) => x.message).join(" ")}</li>)}</ul> : null}</>
          )}
        </div>
      ) : null}
      {confirm ? (
        <ConfirmDialog title="File the proposals for review" word="FILE" actionLabel="File them" busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => run(true)}>
          <p style={{ fontSize: 13 }}>CK records each proposal and holds it for you. Nothing in the live ontology changes until you approve an item.</p>
        </ConfirmDialog>
      ) : null}
    </>
  );
}

export default function OntologyReview() {
  const [kind, setKind] = useState("ontology_key");
  const [status, setStatus] = useState("open");
  const [tab, setTab] = useState("queue");
  const data = useLoad(() => fiApi.ontologyReviewHolds({ kind, status }), [kind, status]);
  const counts = data.data?.open_by_kind || {};
  const canDecide = data.data?.you?.role === "founder";
  return (
    <>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[["queue", "Waiting for you"], ["findings", "Found problems"], ["file", "File proposals"]].map(([t, l]) => <Btn key={t} small kind={tab === t ? "primary" : "plain"} onClick={() => setTab(t)}>{l}</Btn>)}
      </div>
      {tab === "findings" ? <PageCard style={{ padding: 20 }}><SectionTitle title="Found problems" /><Findings /></PageCard> : null}
      {tab === "file" ? <PageCard style={{ padding: 20 }}><SectionTitle title="File proposals" /><FileReviewSet canDecide={canDecide} onFiled={() => { setTab("queue"); data.reload(); }} /></PageCard> : null}
      {tab === "queue" ? (
        <PageCard style={{ padding: 20 }}>
          <SectionTitle title="Proposals CK is holding for you" />
          {!data.loading && !canDecide && !data.error ? <Banner tone="info">Only Andre approves, rejects or revises ontology proposals. You can read them.</Banner> : null}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {KINDS.map(([k, l]) => <Btn key={k} small kind={kind === k ? "primary" : "plain"} onClick={() => setKind(k)}>{l}{counts[k] ? ` · ${counts[k]}` : ""}</Btn>)}
          </div>
          <label style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            Show{" "}
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, padding: "4px 8px" }} aria-label="Show which proposals">
              <option value="open">waiting</option>
              <option value="resolved_new">approved</option>
              <option value="withdrawn">rejected or revised</option>
              <option value="all">all</option>
            </select>
          </label>
          {data.loading ? <Loading /> : data.error ? <Banner tone="error">{errText(data.error)}</Banner> : data.data.holds.length ? (
            data.data.holds.map((h) => <HoldRow key={h.hold_id} hold={h} canDecide={canDecide} onChanged={data.reload} />)
          ) : (
            <div style={{ fontSize: 13, color: OWNER_COLORS.muted, padding: "14px 0" }}>Nothing here.</div>
          )}
        </PageCard>
      ) : null}
    </>
  );
}
