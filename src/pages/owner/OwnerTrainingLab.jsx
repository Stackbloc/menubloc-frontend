import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { errorStyle, inputStyle, labelStyle, mutedStyle, primaryButtonStyle, secondaryButtonStyle, tdStyle, thStyle } from "./OwnerFranchiseBot.jsx";
import {
  OWNER_API_BASE,
  addLabCorrection,
  createLabBatch,
  getLabCase,
  getLabDashboard,
  getLabMeta,
  getLabRun,
  labCasePartUrl,
  listLabCases,
  queueLabRun,
  reviewLabCorrection,
  saveLabReference,
  updateLabCase,
  verifyLabReference,
} from "../../lib/ownerApi.js";
import { StatusTag, Tag, TextLink } from "./knowledgeUi.jsx";
import { humanClass, pct, when } from "./knowledgeFormat.js";

/**
 * Owner → Training Lab (plan 50 §5). Test menus go through the real Menubot extraction in a sandbox
 * (nothing is published). Review the source beside the extracted items, correct them with an
 * explanation, save a verified reference answer, rerun and compare. Many menus can be uploaded at once.
 */

void OWNER_API_BASE;

// ───────────────────────── Upload (many menus at once) ─────────────────────────

function BatchUpload({ onDone }) {
  const [files, setFiles] = useState([]); // [{file, group, split}]
  const [texts, setTexts] = useState("");
  const [urls, setUrls] = useState("");
  const [defaults, setDefaults] = useState({ split: "dev", chain_id: "", restaurant_id: "", license: "", training_allowed: false });
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const pick = (list) => setFiles([...list].map((file, i) => ({ file, group: i + 1, split: "" })));
  const setRow = (i, patch) => setFiles(files.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const pastedMenus = texts.split(/\n-{3,}\n/).map((t) => t.trim()).filter(Boolean);
  const urlList = urls.split(/\s+/).map((u) => u.trim()).filter(Boolean);
  const groupIds = [...new Set(files.map((f) => Number(f.group) || 0))];
  const menuCount = groupIds.length + pastedMenus.length + urlList.length;

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f.file));
      const groups = groupIds.map((g) => files.map((f, i) => ((Number(f.group) || 0) === g ? i : -1)).filter((i) => i >= 0));
      fd.append("groups", JSON.stringify(groups));
      const cases = groups.map((g) => ({ split: files[g[0]].split || undefined, title: g.length > 1 ? `${files[g[0]].file.name} (+${g.length - 1})` : undefined }));
      pastedMenus.forEach(() => cases.push({}));
      urlList.forEach(() => cases.push({}));
      fd.append("cases", JSON.stringify(cases));
      fd.append("texts", JSON.stringify(pastedMenus.map((t, i) => ({ title: t.split("\n")[0].slice(0, 60) || `Pasted menu ${i + 1}`, text: t }))));
      fd.append("urls", JSON.stringify(urlList));
      fd.append("defaults", JSON.stringify(defaults));
      if (label) fd.append("label", label);
      const out = await createLabBatch(fd);
      setMsg(`${out.cases.length} test menu${out.cases.length > 1 ? "s" : ""} added; each runs in the background.`);
      setFiles([]); setTexts(""); setUrls(""); setLabel("");
      onDone();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageCard>
      <SectionTitle title="Add test menus" subtitle="Upload many menus at once. Each file is its own menu unless you give files the same menu number (e.g. 3 photos of one menu)." />
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <span style={labelStyle}>Menu PDFs, photos or screenshots</span>
          <input type="file" multiple accept=".pdf,image/*" onChange={(e) => pick(e.target.files)} />
        </div>
        {files.length > 0 && (
          <table style={{ borderCollapse: "collapse", maxWidth: 640 }}>
            <thead><tr><th style={thStyle}>File</th><th style={thStyle}>Menu #</th><th style={thStyle}>Use for</th></tr></thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={`${f.file.name}-${i}`}>
                  <td style={tdStyle}>{f.file.name} <span style={mutedStyle}>{Math.round(f.file.size / 1024)} KB</span></td>
                  <td style={tdStyle}><input style={{ ...inputStyle, width: 64 }} type="number" min="1" value={f.group} onChange={(e) => setRow(i, { group: e.target.value })} /></td>
                  <td style={tdStyle}>
                    <select style={inputStyle} value={f.split} onChange={(e) => setRow(i, { split: e.target.value })}>
                      <option value="">Batch default</option><option value="dev">Teaching</option><option value="heldout">Unseen test</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <label><span style={labelStyle}>Pasted menu text</span>
          <textarea style={{ ...inputStyle, width: "100%", minHeight: 80 }} placeholder={"Paste a menu. Separate several menus with a line of ---"} value={texts} onChange={(e) => setTexts(e.target.value)} />
        </label>
        <label><span style={labelStyle}>Menu web pages</span>
          <textarea style={{ ...inputStyle, width: "100%", minHeight: 50 }} placeholder="One URL per line" value={urls} onChange={(e) => setUrls(e.target.value)} />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <label><span style={labelStyle}>Batch name</span><input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} /></label>
          <label><span style={labelStyle}>Use for</span>
            <select style={inputStyle} value={defaults.split} onChange={(e) => setDefaults({ ...defaults, split: e.target.value })}>
              <option value="dev">Teaching</option><option value="heldout">Unseen test (never taught from)</option>
            </select>
          </label>
          <label><span style={labelStyle}>Chain id</span><input style={{ ...inputStyle, width: 90 }} value={defaults.chain_id} onChange={(e) => setDefaults({ ...defaults, chain_id: e.target.value })} /></label>
          <label><span style={labelStyle}>Restaurant id</span><input style={{ ...inputStyle, width: 110 }} value={defaults.restaurant_id} onChange={(e) => setDefaults({ ...defaults, restaurant_id: e.target.value })} /></label>
          <label><span style={labelStyle}>License</span><input style={inputStyle} value={defaults.license} onChange={(e) => setDefaults({ ...defaults, license: e.target.value })} /></label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 10 }}>
            <input type="checkbox" checked={defaults.training_allowed} onChange={(e) => setDefaults({ ...defaults, training_allowed: e.target.checked })} /> Allowed for training
          </label>
          <button type="button" style={primaryButtonStyle({ busy, disabled: !menuCount })} disabled={!menuCount || busy} onClick={submit}>
            {busy ? "Uploading…" : `Add ${menuCount || ""} menu${menuCount === 1 ? "" : "s"}`}
          </button>
        </div>
        {msg && <div style={mutedStyle}>{msg}</div>}
      </div>
    </PageCard>
  );
}

// ───────────────────────── Dashboard + list ─────────────────────────

const METRICS = [
  ["item_precision", "Items right"],
  ["item_recall", "Items found"],
  ["price_accuracy", "Prices"],
  ["category_accuracy", "Categories"],
  ["modifier_recognition", "Modifiers"],
  ["rejection_accuracy", "Rejections"],
  ["citation_accuracy", "Citations"],
];

function Dashboard({ data }) {
  if (!data) return null;
  const c = data.counts || {};
  return (
    <PageCard>
      <SectionTitle title="Performance" subtitle={`${c.cases || 0} test menus (${c.heldout || 0} unseen) · ${c.runs || 0} runs · ${c.corrections || 0} corrections · ${c.verified_references || 0} verified answers${c.active_runs ? ` · ${c.active_runs} running` : ""}`} />
      {!data.summary.length ? <div style={mutedStyle}>Scores appear once a menu has a verified answer.</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr><th style={thStyle}>Run type</th><th style={thStyle}>Menus</th>{METRICS.map(([, l]) => <th key={l} style={thStyle}>{l}</th>)}<th style={thStyle}>Made up</th><th style={thStyle}>Missed</th></tr></thead>
            <tbody>
              {data.summary.map((s) => (
                <tr key={`${s.arm}:${s.split}`}>
                  <td style={tdStyle}>{s.arm === "baseline" ? "Current pipeline" : s.arm}{s.split === "heldout" ? " · unseen" : ""}</td>
                  <td style={tdStyle}>{s.cases}</td>
                  {METRICS.map(([k]) => <td key={k} style={tdStyle}>{pct(s[k])}</td>)}
                  <td style={tdStyle}>{s.hallucinations}</td>
                  <td style={tdStyle}>{s.missed_items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.error_classes.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <span style={labelStyle}>Recurring errors</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {Object.entries(data.error_classes.reduce((m, e) => ({ ...m, [e.error_class]: (m[e.error_class] || 0) + e.n }), {})).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
              <span key={k} style={{ fontSize: 13 }}>{humanClass(k)} <b>{n}</b></span>
            ))}
          </div>
        </div>
      )}
    </PageCard>
  );
}

function LabHome() {
  const [cases, setCases] = useState(null);
  const [dash, setDash] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(() => {
    Promise.all([listLabCases(), getLabDashboard()]).then(([c, d]) => { setCases(c.cases); setDash(d); setErr(null); }).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!cases?.some((c) => ["queued", "running"].includes(c.last_run_status))) return undefined;
    const t = setTimeout(load, 4000);
    return () => clearTimeout(t);
  }, [cases, load]);

  return (
    <>
      <Dashboard data={dash} />
      <BatchUpload onDone={load} />
      <PageCard>
        <SectionTitle title="Test menus" subtitle="Runs never publish anything." />
        {err && <div style={errorStyle}>{err}</div>}
        {cases && !cases.length && <EmptyState>No test menus yet.</EmptyState>}
        {cases && cases.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Menu", "Input", "Use", "Last run", "Items", "Answer", "Corrections", "Items right", "Prices"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td style={tdStyle}><Link to={`/owner/training-lab/${c.id}`} style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>{c.title}</Link>{c.batch_label && <div style={mutedStyle}>{c.batch_label}</div>}</td>
                    <td style={tdStyle}>{c.input_kind}{c.part_count > 1 ? ` · ${c.part_count} parts` : ""}</td>
                    <td style={tdStyle}>{c.split === "heldout" ? <Tag tone="info">unseen</Tag> : "teaching"}</td>
                    <td style={tdStyle}><StatusTag status={c.last_run_status} />{c.last_run_error && <div style={errorStyle}>{c.last_run_error}</div>}</td>
                    <td style={tdStyle}>{c.last_run_candidates ?? "—"}</td>
                    <td style={tdStyle}>{c.reference_status ? <StatusTag status={c.reference_status} /> : "—"}</td>
                    <td style={tdStyle}>{c.corrections || "—"}</td>
                    <td style={tdStyle}>{pct(c.last_metrics?.item_precision)}</td>
                    <td style={tdStyle}>{pct(c.last_metrics?.price_accuracy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </>
  );
}

// ───────────────────────── Case: side-by-side review ─────────────────────────

/** Fetches an owner-only file with the session cookie and shows it (PDF in a frame, photo as an image). */
function PartFile({ caseId, part }) {
  const [url, setUrl] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let revoke = null;
    fetch(labCasePartUrl(caseId, part.ordinal), { credentials: "include" })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`Could not load the file (${r.status})`))))
      .then((b) => { revoke = URL.createObjectURL(b); setUrl(revoke); })
      .catch((e) => setErr(e.message));
    return () => { if (revoke) URL.revokeObjectURL(revoke); setUrl(null); };
  }, [caseId, part.ordinal]);
  if (err) return <div style={errorStyle}>{err}</div>;
  if (!url) return <div style={mutedStyle}>Loading file…</div>;
  return part.kind === "pdf"
    ? <iframe title={`part ${part.ordinal + 1}`} src={url} style={{ width: "100%", height: 520, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8 }} />
    : <img alt={`part ${part.ordinal + 1}`} src={url} style={{ maxWidth: "100%", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8 }} />;
}

/** The text the pipeline read, with the selected item's source lines highlighted. */
function SourceText({ text, span }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.querySelector("[data-hit='1']")?.scrollIntoView({ block: "center" }); }, [span]);
  const lines = String(text || "").split("\n");
  return (
    <div ref={ref} style={{ maxHeight: 520, overflow: "auto", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8, padding: 8, background: "#fff" }}>
      {lines.map((l, i) => {
        const hit = span && span.line_from && i + 1 >= span.line_from && i + 1 <= span.line_to;
        return (
          <div key={i} data-hit={hit ? "1" : "0"} style={{ display: "flex", gap: 8, background: hit ? "#fff4c2" : "transparent" }}>
            <span style={{ color: OWNER_COLORS.muted, minWidth: 30, textAlign: "right" }}>{i + 1}</span>
            <span style={{ whiteSpace: "pre-wrap" }}>{l || " "}</span>
          </div>
        );
      })}
      {!text && <div style={mutedStyle}>The pipeline read no text from this part.</div>}
    </div>
  );
}

const OP_LABEL = { edit: "Fix", delete: "Not a menu item", split: "Split", merge: "Merge", relink: "Is a modifier / add-on", recategorize: "Wrong category", ontology: "Wrong food concept" };

function CorrectionForm({ meta, run, selected, onSaved, onCancel }) {
  const items = run.candidates.filter((c) => selected.includes(c.ref));
  const first = items[0] || {};
  const [op, setOp] = useState(selected.length > 1 ? "merge" : selected.length ? "edit" : "add");
  const [f, setF] = useState({ name: first.name || "", price: first.price ?? "", section: first.section || "", description: first.description || "", parent: "", concept: "" });
  const [splitText, setSplitText] = useState("");
  const [errorClass, setErrorClass] = useState("");
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const ops = selected.length > 1 ? ["merge", "delete"] : selected.length ? ["edit", "delete", "split", "relink", "recategorize", "ontology"] : ["add"];
  const price = (v) => (v === "" || v == null ? null : Number(String(v).replace(/[^0-9.]/g, "")));

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      let after = null;
      if (op === "edit" || op === "add" || op === "merge") after = { name: f.name, price: price(f.price), section: f.section || null, description: f.description || null };
      if (op === "add" && f.parent) after = { ...after, kind: "modifier", parent: f.parent };
      if (op === "recategorize") after = { section: f.section };
      if (op === "relink") after = { kind: "modifier", parent: f.parent || null };
      if (op === "ontology") after = { concept: f.concept };
      if (op === "split") after = splitText.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        const m = /^(.*?)[\s|,]+\$?(\d+(?:\.\d{1,2})?)$/.exec(l);
        return m ? { name: m[1].trim(), price: Number(m[2]), section: first.section || null } : { name: l, price: null, section: first.section || null };
      });
      await addLabCorrection(run.id, { op, target_refs: selected, after, error_class: errorClass, explanation });
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: 12, background: "#fafafa", marginBottom: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{selected.length ? `Correct ${items.map((i) => `“${i.name}”`).join(" + ")}` : "Add a missed item"}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 10 }}>
        {ops.map((o) => <TextLink key={o} tone={op === o ? "info" : "muted"} onClick={() => setOp(o)}>{op === o ? `• ${OP_LABEL[o] || "Add"}` : OP_LABEL[o] || "Add"}</TextLink>)}
      </div>
      {["edit", "add", "merge"].includes(op) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input style={{ ...inputStyle, flex: "2 1 200px" }} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input style={{ ...inputStyle, width: 90 }} placeholder="Price" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          <input style={{ ...inputStyle, flex: "1 1 140px" }} placeholder="Category" value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} />
          <input style={{ ...inputStyle, flex: "3 1 260px" }} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          {op === "add" && <input style={{ ...inputStyle, flex: "1 1 200px" }} placeholder="Add-on for which dish? (blank = a dish)" value={f.parent} onChange={(e) => setF({ ...f, parent: e.target.value })} />}
        </div>
      )}
      {op === "recategorize" && <input style={inputStyle} placeholder="Right category" value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} />}
      {op === "relink" && <input style={{ ...inputStyle, minWidth: 260 }} placeholder="Add-on for which dish?" value={f.parent} onChange={(e) => setF({ ...f, parent: e.target.value })} />}
      {op === "ontology" && <input style={{ ...inputStyle, minWidth: 260 }} placeholder="Right food concept (e.g. MKS key or dish name)" value={f.concept} onChange={(e) => setF({ ...f, concept: e.target.value })} />}
      {op === "split" && <textarea style={{ ...inputStyle, width: "100%", minHeight: 70 }} placeholder={"One item per line, price at the end:\n4 pc Chicken Nuggets 2.99\n6 pc Chicken Nuggets 3.99"} value={splitText} onChange={(e) => setSplitText(e.target.value)} />}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "flex-start" }}>
        <select style={inputStyle} value={errorClass} onChange={(e) => setErrorClass(e.target.value)}>
          <option value="">What went wrong?</option>
          {(meta?.error_classes || []).map((c) => <option key={c} value={c}>{humanClass(c)}</option>)}
        </select>
        <textarea style={{ ...inputStyle, flex: "1 1 320px", minHeight: 60 }} placeholder="Explain the mistake and how to read this kind of menu next time" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>
      {err && <div style={errorStyle}>{err}</div>}
      <div style={{ display: "flex", gap: 14, marginTop: 10, alignItems: "center" }}>
        <button type="button" style={primaryButtonStyle({ busy, disabled: !errorClass })} disabled={!errorClass || busy} onClick={save}>Save correction</button>
        <TextLink tone="muted" onClick={onCancel}>Cancel</TextLink>
      </div>
    </div>
  );
}

function reasonText(c) {
  return (c.validation?.reasons || []).map((r) => humanClass(r.code)).join(", ");
}

function CaseView({ id }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [runData, setRunData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState([]);
  const [focus, setFocus] = useState(null);
  const [form, setForm] = useState(false);
  const [partIdx, setPartIdx] = useState(0);
  const [showRejected, setShowRejected] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const c = await getLabCase(id);
      setData(c);
      const runId = params.get("run") || c.runs[0]?.id;
      setRunData(runId ? await getLabRun(runId) : null);
      setErr(null);
    } catch (e) { setErr(e.message); }
  }, [id, params]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { getLabMeta().then(setMeta).catch(() => {}); }, []);
  useEffect(() => {
    if (!data?.runs.some((r) => ["queued", "running"].includes(r.status))) return undefined;
    const t = setTimeout(load, 3000);
    return () => clearTimeout(t);
  }, [data, load]);

  const act = async (fn) => {
    setBusy(true);
    setErr(null);
    try { await fn(); await load(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const run = runData?.run;
  const shown = useMemo(() => (run?.candidates || []).filter((c) => showRejected || c.validation?.status !== "quarantined"), [run, showRejected]);
  if (!data) return <PageCard>{err ? <div style={errorStyle}>{err}</div> : "Loading…"}</PageCard>;
  const c = data.case;
  const parts = c.parts || [];
  const part = parts[partIdx] || parts[0];
  const extractedPart = run?.extracted?.parts?.find((p) => p.ordinal === part?.ordinal);
  const focusItem = run?.candidates.find((x) => x.ref === focus);
  const span = focusItem?.source_span && focusItem.source_span.part === part?.ordinal ? focusItem.source_span : null;
  const correctedRefs = new Set((runData?.corrections || []).flatMap((k) => k.target_refs));
  const latestRef = data.references[0];
  const evaluation = runData?.evaluations?.[0]?.metrics;
  const rejectedCount = (run?.candidates || []).filter((x) => x.validation?.status === "quarantined").length;

  return (
    <>
      <PageCard>
        <div style={{ marginBottom: 8 }}><Link to="/owner/training-lab" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>‹ Training Lab</Link></div>
        <SectionTitle
          title={c.title}
          subtitle={`${c.input_kind} · ${parts.length} part${parts.length > 1 ? "s" : ""} · ${c.split === "heldout" ? "unseen test menu (never taught from)" : "teaching menu"}${c.chain_id ? ` · chain #${c.chain_id}` : ""}${c.restaurant_id ? ` · restaurant #${c.restaurant_id}` : ""}`}
          action={<div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button type="button" style={secondaryButtonStyle} disabled={busy} onClick={() => act(async () => { const r = await queueLabRun(c.id, {}); setParams({ run: r.run_id }); })}>Run again</button>
            <TextLink tone="muted" onClick={() => act(() => updateLabCase(c.id, { split: c.split === "dev" ? "heldout" : "dev" }))}>{c.split === "dev" ? "Make unseen test" : "Make teaching"}</TextLink>
            <TextLink tone="bad" onClick={() => act(async () => { await updateLabCase(c.id, { status: "archived" }); navigate("/owner/training-lab"); })}>Archive</TextLink>
          </div>}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <span style={labelStyle}>Runs</span>
          {data.runs.map((r) => (
            <TextLink key={r.id} tone={String(r.id) === String(run?.id) ? "info" : "muted"} onClick={() => setParams({ run: r.id })}>
              #{r.id} {r.arm === "baseline" ? "current pipeline" : r.arm} · {r.status}{r.metrics ? ` · ${pct(r.metrics.item_precision)} right` : ""}
            </TextLink>
          ))}
        </div>
        {run && <div style={{ ...mutedStyle, marginTop: 6 }}>Run #{run.id}: {when(run.finished_at || run.created_at)} · {run.seconds ?? "—"} s · code {String(run.git_sha || "").slice(0, 8) || "?"} · pipeline {run.registry_hash || "?"} · model {run.model_digest || "?"} · knowledge {run.knowledge_snapshot_hash || "?"}</div>}
        {run?.error && <div style={errorStyle}>{run.status === "timed_out" ? "Timed out: " : "Failed: "}{run.error}</div>}
        {err && <div style={errorStyle}>{err}</div>}
      </PageCard>

      {evaluation && (
        <PageCard>
          <SectionTitle title="Score against the verified answer" subtitle={`Answer v${runData.evaluations[0].version_no}`} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
            {METRICS.map(([k, l]) => <div key={k}><div style={mutedStyle}>{l}</div><div style={{ fontWeight: 800, fontSize: 18 }}>{pct(evaluation[k])}</div></div>)}
            {[["hallucinations", "Made up"], ["missed_items", "Missed"], ["prices_invented", "Prices made up"], ["duplicates", "Duplicates"], ["real_items_rejected", "Real items rejected"]].map(([k, l]) => (
              <div key={k}><div style={mutedStyle}>{l}</div><div style={{ fontWeight: 800, fontSize: 18 }}>{evaluation[k] ?? "—"}</div></div>
            ))}
          </div>
          {evaluation.missed?.length > 0 && <div style={{ ...mutedStyle, marginTop: 8 }}>Missed: {evaluation.missed.join(", ")}</div>}
          {evaluation.price_errors?.length > 0 && <div style={mutedStyle}>Price errors: {evaluation.price_errors.map((p) => `${p.name} ${p.got} → ${p.expected}`).join(", ")}</div>}
        </PageCard>
      )}

      {runData?.diff && (
        <PageCard>
          <SectionTitle title="Changes since the previous run" />
          {!runData.diff.length ? <div style={mutedStyle}>No changes.</div> : runData.diff.map((d, i) => (
            <div key={i} style={{ fontSize: 13 }}>
              <Tag tone={d.type === "added" ? "info" : d.type === "removed" ? "bad" : "warn"}>{d.type}</Tag> {d.name}
              {d.type === "changed" && <span style={mutedStyle}> · {d.fields.map((f) => `${f}: ${d.before[f] ?? "—"} → ${d.after[f] ?? "—"}`).join(", ")}</span>}
            </div>
          ))}
        </PageCard>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 16, alignItems: "start" }}>
        <PageCard>
          <SectionTitle title="Original" subtitle={parts.length > 1 ? undefined : part?.filename || part?.url || undefined} />
          {parts.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
              {parts.map((p, i) => <TextLink key={i} tone={i === partIdx ? "info" : "muted"} onClick={() => setPartIdx(i)}>Part {i + 1}{p.filename ? ` · ${p.filename}` : ""}</TextLink>)}
            </div>
          )}
          {part?.has_file && <PartFile caseId={c.id} part={part} />}
          {part?.kind === "url" && <div style={{ marginBottom: 8 }}><a href={part.url} target="_blank" rel="noreferrer noopener">{part.url}</a></div>}
          <div style={{ ...labelStyle, marginTop: 10 }}>Text the pipeline read{span ? " (highlighted: where the selected item came from)" : ""}</div>
          <SourceText text={extractedPart?.text ?? part?.text ?? ""} span={span} />
          {extractedPart?.not_a_menu && <div style={{ ...mutedStyle, marginTop: 6 }}><Tag tone="warn">not a menu</Tag> {extractedPart.not_a_menu.doc_type}: {extractedPart.not_a_menu.reasons.join("; ")}</div>}
          {extractedPart?.error && <div style={errorStyle}>Could not read this part: {extractedPart.error}</div>}
        </PageCard>

        <PageCard>
          <SectionTitle
            title="What the agent extracted"
            subtitle={run ? `${run.candidates.length - rejectedCount} for review · ${rejectedCount} rejected by the checks` : "No run yet"}
            action={run?.status === "done" && <div style={{ display: "flex", gap: 14 }}>
              <TextLink onClick={() => { setSelected([]); setForm(true); }}>Add missed item</TextLink>
              {selected.length > 0 && <TextLink onClick={() => setForm(true)}>Correct {selected.length} selected</TextLink>}
            </div>}
          />
          {form && run && <CorrectionForm meta={meta} run={run} selected={selected} onCancel={() => setForm(false)} onSaved={() => { setForm(false); setSelected([]); load(); }} />}
          {run?.status === "done" && (
            <>
              <div style={{ marginBottom: 6 }}><TextLink tone="muted" onClick={() => setShowRejected(!showRejected)}>{showRejected ? "Hide" : "Show"} {rejectedCount} rejected</TextLink></div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["", "Item", "Price", "Category", "Check", "Source"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {shown.map((x) => (
                      <tr key={x.ref} onClick={() => { setFocus(x.ref); if (x.source_span?.part != null) setPartIdx(Math.max(0, parts.findIndex((p) => p.ordinal === x.source_span.part))); }} style={{ background: focus === x.ref ? "#f5f8ff" : "transparent", cursor: "pointer" }}>
                        <td style={tdStyle}><input type="checkbox" checked={selected.includes(x.ref)} onClick={(e) => e.stopPropagation()} onChange={(e) => setSelected(e.target.checked ? [...selected, x.ref] : selected.filter((r) => r !== x.ref))} /></td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700 }}>{x.name}</div>
                          {x.description && <div style={mutedStyle}>{x.description}</div>}
                          {correctedRefs.has(x.ref) && <Tag tone="info">corrected</Tag>}
                        </td>
                        <td style={tdStyle}>{x.price != null ? `$${Number(x.price).toFixed(2)}` : "—"}</td>
                        <td style={tdStyle}>{x.section || "—"}</td>
                        <td style={tdStyle}><StatusTag status={x.validation?.status} />{reasonText(x) && <div style={mutedStyle}>{reasonText(x)}</div>}</td>
                        <td style={tdStyle}>{x.source_span ? (x.source_span.structured ? "structured data" : `part ${(x.source_span.part ?? 0) + 1}, line ${x.source_span.line_from}`) : <span style={{ color: "#b42318", fontWeight: 700 }}>no source evidence</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {run.decisions?.filter((d) => d.stage !== "menuCandidateValidator").length > 0 && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Other decisions</summary>
                  {run.decisions.filter((d) => d.stage !== "menuCandidateValidator").map((d, i) => (
                    <div key={i} style={mutedStyle}>{d.stage}: {d.name ? `“${d.name}” ` : ""}{d.decision} {(d.reasons || []).map((r) => r.detail || r.code).join("; ")}</div>
                  ))}
                </details>
              )}
            </>
          )}
        </PageCard>
      </div>

      <PageCard>
        <SectionTitle title="Corrections" subtitle="Each correction keeps its explanation. Approved corrections become trusted teaching material." />
        {!(runData?.corrections || []).length && <div style={mutedStyle}>No corrections for this run yet. Select items above to correct them.</div>}
        {(runData?.corrections || []).map((k) => (
          <div key={k.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "8px 0", fontSize: 13 }}>
            <StatusTag status={k.status} /> <b>{OP_LABEL[k.op] || "Add"}</b> · {humanClass(k.error_class)} · {(k.before || []).map((b) => `“${b.name}”`).join(" + ") || "new item"}
            {k.after && <span style={mutedStyle}> → {Array.isArray(k.after) ? k.after.map((a) => a.name).join(" / ") : [k.after.name, k.after.price != null ? `$${k.after.price}` : null, k.after.section, k.after.parent ? `add-on for ${k.after.parent}` : null, k.after.concept].filter(Boolean).join(" · ")}</span>}
            {k.explanation && <div style={{ marginTop: 2 }}>“{k.explanation}”</div>}
            <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
              {k.status !== "approved" && <TextLink onClick={() => act(() => reviewLabCorrection(k.id, "approved"))}>Approve</TextLink>}
              {k.status !== "rejected" && <TextLink tone="bad" onClick={() => act(() => reviewLabCorrection(k.id, "rejected"))}>Reject</TextLink>}
            </div>
          </div>
        ))}
      </PageCard>

      <PageCard>
        <SectionTitle title="Verified answer" subtitle="The correct menu for this input. Scores only count against a verified answer." />
        {latestRef ? (
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            v{latestRef.version_no} <StatusTag status={latestRef.status} /> · {latestRef.expect_no_menu ? "not a menu: nothing should be extracted" : `${latestRef.items.length} items`}
            {latestRef.verified_at && <span style={mutedStyle}> · verified {when(latestRef.verified_at)}</span>}
            {latestRef.status === "draft" && <span> · <TextLink onClick={() => act(() => verifyLabReference(latestRef.id))}>Verify this answer</TextLink></span>}
            {latestRef.items.length > 0 && (
              <details style={{ marginTop: 6 }}><summary style={{ cursor: "pointer" }}>Show items</summary>
                {latestRef.items.map((i, n) => <div key={n} style={mutedStyle}>{i.section ? `${i.section} · ` : ""}{i.name}{i.price != null ? ` · $${Number(i.price).toFixed(2)}` : ""}{i.kind === "modifier" ? ` · add-on${i.parent ? ` for ${i.parent}` : ""}` : ""}</div>)}
              </details>
            )}
          </div>
        ) : <div style={{ ...mutedStyle, marginBottom: 10 }}>No answer yet.</div>}
        {run?.status === "done" && (
          <div style={{ display: "flex", gap: 14 }}>
            <button type="button" style={secondaryButtonStyle} disabled={busy} onClick={() => act(() => saveLabReference(c.id, { from_run_id: run.id }))}>Save corrected run #{run.id} as answer (draft)</button>
            <TextLink onClick={() => act(() => saveLabReference(c.id, { expect_no_menu: true, notes: "Not a menu" }))}>This is not a menu</TextLink>
          </div>
        )}
      </PageCard>
    </>
  );
}

export default function OwnerTrainingLab() {
  const { caseId } = useParams();
  return (
    <OwnerLayout title="Training Lab" actions={<Link to="/owner/knowledge" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>Knowledge Library ›</Link>}>
      {caseId ? <CaseView id={caseId} /> : <LabHome />}
    </OwnerLayout>
  );
}
