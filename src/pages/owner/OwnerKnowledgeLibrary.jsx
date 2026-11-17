import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { errorStyle, inputStyle, labelStyle, mutedStyle, primaryButtonStyle, secondaryButtonStyle, tdStyle, thStyle } from "./OwnerFranchiseBot.jsx";
import {
  addKnowledgeVersion,
  createKnowledgeSources,
  getKnowledgeSource,
  knowledgeSourceAction,
  listKnowledgeSources,
  reprocessKnowledgeSource,
  resolveKnowledgeConflict,
  reviewKnowledgeConcept,
  rollbackKnowledgeSource,
  updateKnowledgeSource,
} from "../../lib/ownerApi.js";
import { StatusTag, Tag, TextLink } from "./knowledgeUi.jsx";
import { when } from "./knowledgeFormat.js";

/**
 * Owner → Knowledge Library (plan 50 §2, §9). Reference knowledge for the local Qwen agent:
 * write or upload docs (many at once), review, approve, set authority/scope/license, see versions,
 * concepts, conflicts, audit and retrieval history. Approving here never changes menus or the ontology.
 */

const SOURCE_TYPES = ["article", "pasted", "file", "url", "menu", "ontology_record", "ingestion_correction", "paper", "training_set", "eval_set"];
const STATUSES = ["draft", "pending_review", "approved", "rejected", "superseded", "archived"];
const AUTHORITIES = ["authoritative", "reference", "experimental"];

function AddSources({ onDone }) {
  const [mode, setMode] = useState("write");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [urls, setUrls] = useState("");
  const [files, setFiles] = useState([]);
  const [meta, setMeta] = useState({ source_type: "article", authority: "reference", topics: "", author: "", license: "", training_allowed: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      const m = { ...meta, topics: meta.topics, title: title || undefined };
      if (mode !== "write") delete m.source_type;
      fd.append("meta", JSON.stringify(m));
      if (mode === "write") fd.append("texts", JSON.stringify([{ title, text, source_type: meta.source_type }]));
      if (mode === "urls") fd.append("urls", JSON.stringify(urls.split(/\s+/).map((u) => u.trim()).filter(Boolean)));
      if (mode === "files") files.forEach((f) => fd.append("files", f));
      const out = await createKnowledgeSources(fd);
      setMsg(`${out.created.length} added${out.failed.length ? `, ${out.failed.length} failed: ${out.failed.map((f) => `${f.label} (${f.error})`).join("; ")}` : ""}. Processing runs in the background.`);
      setTitle(""); setText(""); setUrls(""); setFiles([]);
      onDone();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  const ready = mode === "write" ? title.trim() && text.trim() : mode === "urls" ? urls.trim() : files.length > 0;
  return (
    <PageCard>
      <SectionTitle title="Add knowledge" subtitle="New material starts as a draft. Nothing is used by the agent until it is approved." />
      <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
        {[["write", "Write or paste"], ["files", "Upload files"], ["urls", "Web pages"]].map(([k, l]) => (
          <TextLink key={k} tone={mode === k ? "info" : "muted"} onClick={() => setMode(k)}>{mode === k ? `• ${l}` : l}</TextLink>
        ))}
      </div>
      {mode === "write" && (
        <div style={{ display: "grid", gap: 10 }}>
          <input style={inputStyle} placeholder="Title, e.g. Menu items vs modifiers" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea style={{ ...inputStyle, minHeight: 160, fontFamily: "inherit" }} placeholder={"Use # for headings.\n\n# Menu items vs modifiers\nAn add-on like Add Bacon is a modifier…"} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      )}
      {mode === "files" && (
        <div>
          <input type="file" multiple accept=".pdf,.docx,.txt,.md,.html,.htm,.csv,image/*" onChange={(e) => setFiles([...e.target.files])} />
          <div style={mutedStyle}>PDF, DOCX, TXT, MD, HTML, CSV or photos. Up to 50 files, 20 MB each. Each file becomes its own document.</div>
          {files.length > 0 && <div style={{ ...mutedStyle, marginTop: 6 }}>{files.length} selected: {files.map((f) => f.name).join(", ")}</div>}
        </div>
      )}
      {mode === "urls" && (
        <textarea style={{ ...inputStyle, minHeight: 90, width: "100%" }} placeholder="One URL per line" value={urls} onChange={(e) => setUrls(e.target.value)} />
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12, alignItems: "flex-end" }}>
        {mode === "write" && (
          <label><span style={labelStyle}>Type</span>
            <select style={inputStyle} value={meta.source_type} onChange={(e) => setMeta({ ...meta, source_type: e.target.value })}>
              {SOURCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </label>
        )}
        <label><span style={labelStyle}>Authority</span>
          <select style={inputStyle} value={meta.authority} onChange={(e) => setMeta({ ...meta, authority: e.target.value })}>
            {AUTHORITIES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label><span style={labelStyle}>Topics</span><input style={inputStyle} placeholder="modifiers, prices" value={meta.topics} onChange={(e) => setMeta({ ...meta, topics: e.target.value })} /></label>
        <label><span style={labelStyle}>Author</span><input style={inputStyle} value={meta.author} onChange={(e) => setMeta({ ...meta, author: e.target.value })} /></label>
        <label><span style={labelStyle}>License</span><input style={inputStyle} placeholder="Menuply-owned" value={meta.license} onChange={(e) => setMeta({ ...meta, license: e.target.value })} /></label>
        <label style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 10 }}>
          <input type="checkbox" checked={meta.training_allowed} onChange={(e) => setMeta({ ...meta, training_allowed: e.target.checked })} /> Allowed for training
        </label>
        <button type="button" style={primaryButtonStyle({ busy, disabled: !ready })} disabled={!ready || busy} onClick={submit}>{busy ? "Adding…" : "Add"}</button>
      </div>
      {msg && <div style={{ ...mutedStyle, marginTop: 10 }}>{msg}</div>}
    </PageCard>
  );
}

function LibraryList() {
  const [filters, setFilters] = useState({ q: "", status: "", authority: "", source_type: "", topic: "", author: "", from: "", to: "" });
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(() => {
    listKnowledgeSources(filters).then((r) => { setRows(r.sources); setErr(null); }).catch((e) => setErr(e.message));
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!rows?.some((r) => ["pending", "processing"].includes(r.processing_status))) return undefined;
    const t = setTimeout(load, 4000);
    return () => clearTimeout(t);
  }, [rows, load]);
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <AddSources onDone={load} />
      <PageCard>
        <SectionTitle title="Library" subtitle="Search titles and text. Only approved, retrievable documents ever reach the agent." />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <input style={{ ...inputStyle, minWidth: 220 }} placeholder="Search" value={filters.q} onChange={set("q")} />
          <select style={inputStyle} value={filters.status} onChange={set("status")}><option value="">Any status</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
          <select style={inputStyle} value={filters.authority} onChange={set("authority")}><option value="">Any authority</option>{AUTHORITIES.map((a) => <option key={a}>{a}</option>)}</select>
          <select style={inputStyle} value={filters.source_type} onChange={set("source_type")}><option value="">Any type</option>{SOURCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select>
          <input style={{ ...inputStyle, width: 120 }} placeholder="Topic" value={filters.topic} onChange={set("topic")} />
          <input style={{ ...inputStyle, width: 120 }} placeholder="Author" value={filters.author} onChange={set("author")} />
          <input style={inputStyle} type="date" value={filters.from} onChange={set("from")} title="Added from" />
          <input style={inputStyle} type="date" value={filters.to} onChange={set("to")} title="Added to" />
        </div>
        {err && <div style={errorStyle}>{err}</div>}
        {rows && !rows.length && <EmptyState>No documents match.</EmptyState>}
        {rows && rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Title", "Type", "Status", "Authority", "Version", "Chunks", "Processing", "Updated"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={tdStyle}>
                      <Link to={`/owner/knowledge/${r.id}`} style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>{r.title}</Link>
                      {r.topics?.length > 0 && <div style={mutedStyle}>{r.topics.join(", ")}</div>}
                      {r.open_conflicts > 0 && <div><Tag tone="warn">{r.open_conflicts} conflict{r.open_conflicts > 1 ? "s" : ""}</Tag></div>}
                    </td>
                    <td style={tdStyle}>{r.source_type.replace(/_/g, " ")}</td>
                    <td style={tdStyle}><StatusTag status={r.status} /></td>
                    <td style={tdStyle}>{r.authority}{!r.retrieval_allowed && <div style={mutedStyle}>not retrievable</div>}</td>
                    <td style={tdStyle}>v{r.version_no ?? "—"}</td>
                    <td style={tdStyle}>{r.chunk_count}</td>
                    <td style={tdStyle}><StatusTag status={r.processing_status} />{r.processing_error && <div style={errorStyle}>{r.processing_error}</div>}</td>
                    <td style={tdStyle}>{when(r.updated_at)}</td>
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

const ACTIONS_FOR = {
  draft: ["submit", "approve", "reject", "archive"],
  pending_review: ["approve", "reject", "archive"],
  approved: ["archive"],
  rejected: ["submit", "archive"],
  superseded: ["archive"],
  archived: ["restore"],
};

function SourceDetail({ id }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newText, setNewText] = useState("");
  const [newFile, setNewFile] = useState(null);
  const load = useCallback(() => getKnowledgeSource(id).then((r) => { setD(r); setErr(null); }).catch((e) => setErr(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!d || !["pending", "processing"].includes(d.source.processing_status)) return undefined;
    const t = setTimeout(load, 3000);
    return () => clearTimeout(t);
  }, [d, load]);

  const run = async (fn) => {
    setBusy(true);
    setErr(null);
    try { await fn(); await load(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (!d) return <PageCard>{err ? <div style={errorStyle}>{err}</div> : "Loading…"}</PageCard>;
  const s = d.source;
  const scope = s.scope || { subject: "global" };
  return (
    <>
      <PageCard>
        <div style={{ marginBottom: 8 }}><Link to="/owner/knowledge" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>‹ Library</Link></div>
        <SectionTitle
          title={s.title}
          subtitle={`${s.source_type.replace(/_/g, " ")} · ${s.author || "no author"} · added ${when(s.created_at)}${s.approved_at ? ` · approved ${when(s.approved_at)}` : ""}`}
          action={<div style={{ display: "flex", gap: 8 }}><StatusTag status={s.status} /><StatusTag status={s.processing_status} /></div>}
        />
        {s.processing_error && <div style={errorStyle}>Processing failed: {s.processing_error}</div>}
        {s.superseded_by && <div style={mutedStyle}>Replaced by <Link to={`/owner/knowledge/${s.superseded_by}`}>a newer document</Link>; no longer retrieved.</div>}
        {s.supersedes_id && <div style={mutedStyle}>Will replace <Link to={`/owner/knowledge/${s.supersedes_id}`}>this document</Link> when approved.</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, margin: "12px 0" }}>
          {(ACTIONS_FOR[s.status] || []).map((a) => (
            <TextLink key={a} tone={a === "reject" || a === "archive" ? "bad" : "info"} disabled={busy || (a === "approve" && s.processing_status !== "processed")} onClick={() => run(() => knowledgeSourceAction(s.id, a))}>
              {a === "submit" ? "Send for review" : a.charAt(0).toUpperCase() + a.slice(1)}
            </TextLink>
          ))}
          {s.status !== "approved" && <TextLink disabled={busy} onClick={() => run(() => reprocessKnowledgeSource(s.id))}>Reprocess</TextLink>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <label><span style={labelStyle}>Authority</span>
            <select style={inputStyle} value={s.authority} disabled={busy} onChange={(e) => run(() => updateKnowledgeSource(s.id, { authority: e.target.value }))}>
              {AUTHORITIES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label><span style={labelStyle}>Applies to</span>
            <select style={inputStyle} value={scope.subject} disabled={busy} onChange={(e) => {
              const subject = e.target.value;
              if (subject === "global") return run(() => updateKnowledgeSource(s.id, { scope: { subject } }));
              const idText = window.prompt(subject === "chain" ? "Chain id" : "Restaurant id");
              if (!idText) return undefined;
              const key = subject === "chain" ? "chain_id" : "restaurant_id";
              return run(() => updateKnowledgeSource(s.id, { scope: { subject, [key]: Number(idText) } }));
            }}>
              {["global", "chain", "restaurant", "location"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          {scope.chain_id && <span style={mutedStyle}>chain #{scope.chain_id}</span>}
          {scope.restaurant_id && <span style={mutedStyle}>restaurant #{scope.restaurant_id}</span>}
          <label style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 10 }}>
            <input type="checkbox" checked={s.retrieval_allowed} disabled={busy} onChange={(e) => run(() => updateKnowledgeSource(s.id, { retrieval_allowed: e.target.checked }))} /> Retrievable
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 10 }}>
            <input type="checkbox" checked={s.training_allowed} disabled={busy} onChange={(e) => run(() => updateKnowledgeSource(s.id, { training_allowed: e.target.checked }))} /> Allowed for training
          </label>
          <span style={{ ...mutedStyle, paddingBottom: 10 }}>License: {s.license || "not set"}</span>
        </div>
        {err && <div style={errorStyle}>{err}</div>}
      </PageCard>

      <PageCard>
        <SectionTitle title="Passages" subtitle="How the agent will see this document: each passage keeps its page and heading for citations." />
        {d.chunks.map((c) => (
          <div key={c.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "10px 0" }}>
            <div style={mutedStyle}>#{c.ordinal + 1}{c.heading_path ? ` · ${c.heading_path}` : ""}{c.page_from ? ` · p.${c.page_from}${c.page_to !== c.page_from ? `–${c.page_to}` : ""}` : ""} · ~{c.token_estimate} tokens {c.flags?.includes("possible_prompt_injection") && <Tag tone="bad" title="This passage contains text that tries to instruct a model. It is kept as data and never followed.">possible instructions</Tag>}</div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 4 }}>{c.text}</div>
          </div>
        ))}
        {!d.chunks.length && <EmptyState>No passages yet.</EmptyState>}
      </PageCard>

      <PageCard>
        <SectionTitle title="Ontology concepts" subtitle="Found by name. These are suggestions and never change the ontology." />
        {!d.concepts.length && <div style={mutedStyle}>No known concepts mentioned.</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {d.concepts.map((c) => (
            <span key={c.id} style={{ display: "inline-flex", gap: 6, alignItems: "center", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 6, padding: "3px 8px", fontSize: 13 }}>
              <b>{c.concept_label || c.concept_key}</b><span style={mutedStyle}>{c.concept_system.replace("_", " ")}</span>
              <StatusTag status={c.status} />
              {c.status === "proposed" && <>
                <TextLink onClick={() => run(() => reviewKnowledgeConcept(c.id, "approved"))}>Confirm</TextLink>
                <TextLink tone="bad" onClick={() => run(() => reviewKnowledgeConcept(c.id, "rejected"))}>Wrong</TextLink>
              </>}
            </span>
          ))}
        </div>
      </PageCard>

      {d.conflicts.length > 0 && (
        <PageCard>
          <SectionTitle title="Duplicates and contradictions" />
          {d.conflicts.map((f) => (
            <div key={f.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "8px 0" }}>
              <Tag tone={f.kind === "contradiction" ? "bad" : "warn"}>{f.kind.replace("_", " ")}</Tag>{" "}
              with <Link to={`/owner/knowledge/${f.b_source === s.id ? f.a_source : f.b_source}`}>{f.b_title}</Link>
              {f.detail?.a_price != null && <span style={mutedStyle}> · ${f.detail.a_price} vs ${f.detail.b_price}</span>}
              <div style={{ ...mutedStyle, whiteSpace: "pre-wrap" }}>{f.b_text}</div>
              {f.resolution ? <div style={mutedStyle}>Resolved: {f.resolution.replace(/_/g, " ")}</div> : (
                <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                  {["keep_both", "keep_a", "keep_b", "not_a_conflict"].map((r) => <TextLink key={r} onClick={() => run(() => resolveKnowledgeConflict(f.id, r))}>{r === "keep_a" ? "Keep this one" : r === "keep_b" ? "Keep the other" : r.replace(/_/g, " ")}</TextLink>)}
                </div>
              )}
            </div>
          ))}
        </PageCard>
      )}

      <PageCard>
        <SectionTitle title="Versions" subtitle={s.status === "approved" ? "Changing an approved document creates a replacement that goes live only when approved." : "Each change is kept; you can go back to any processed version."} />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Version", "Read with", "Pages", "Passages", "Added", ""].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {d.versions.map((v) => (
              <tr key={v.id}>
                <td style={tdStyle}>v{v.version_no}{v.id === s.current_version_id && " (current)"}</td>
                <td style={tdStyle}>{v.extractor || "—"}{v.warnings?.length > 0 && <div style={mutedStyle}>{v.warnings.join(", ")}</div>}</td>
                <td style={tdStyle}>{v.page_count ?? "—"}</td>
                <td style={tdStyle}>{v.chunk_count}</td>
                <td style={tdStyle}>{when(v.created_at)}</td>
                <td style={tdStyle}>{v.id !== s.current_version_id && v.chunk_count > 0 && <TextLink onClick={() => run(() => rollbackKnowledgeSource(s.id, v.id))}>Use this version</TextLink>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!["superseded", "archived"].includes(s.status) && (
          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <textarea style={{ ...inputStyle, minHeight: 70, flex: "1 1 320px" }} placeholder="Paste new text for a new version" value={newText} onChange={(e) => setNewText(e.target.value)} />
            <input type="file" onChange={(e) => setNewFile(e.target.files[0] || null)} />
            <button type="button" style={secondaryButtonStyle} disabled={busy || (!newText.trim() && !newFile)} onClick={() => run(async () => {
              const fd = new FormData();
              if (newFile) fd.append("file", newFile); else fd.append("text", newText);
              const out = await addKnowledgeVersion(s.id, fd);
              setNewText(""); setNewFile(null);
              if (out.successor_source_id) window.location.assign(`/owner/knowledge/${out.successor_source_id}`);
            })}>New version</button>
          </div>
        )}
      </PageCard>

      <PageCard>
        <SectionTitle title="History" subtitle="Every change, and every time the agent retrieved this document." />
        {d.retrievals.length > 0 && <div style={{ marginBottom: 10 }}>{d.retrievals.map((r) => <div key={r.id} style={mutedStyle}>{when(r.created_at)} · retrieved by {r.consumer}{r.consumer_ref ? ` (${r.consumer_ref})` : ""}{r.query ? ` for “${r.query}”` : ""}</div>)}</div>}
        {d.audit.map((a) => <div key={a.id} style={mutedStyle}>{when(a.created_at)} · {a.action.replace(/_/g, " ")}{a.actor_operator_id ? ` · operator #${a.actor_operator_id}` : ""}{a.after?.note ? ` · ${a.after.note}` : ""}</div>)}
      </PageCard>
    </>
  );
}

export default function OwnerKnowledgeLibrary() {
  const { sourceId } = useParams();
  return (
    <OwnerLayout title="Knowledge Library" actions={<Link to="/owner/training-lab" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>Training Lab ›</Link>}>
      {sourceId ? <SourceDetail id={sourceId} /> : <LibraryList />}
    </OwnerLayout>
  );
}
