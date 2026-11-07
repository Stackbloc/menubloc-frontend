import React, { useEffect, useMemo, useState } from "react";
import { OWNER_COLORS } from "../OwnerLayout.jsx";
import { Btn, Tag, fmtValue, inputStyle, isActive, labelStyle, recordTitle } from "./fiUi.jsx";

const list = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function Field({ label, children, hint }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint ? <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 3 }}>{hint}</div> : null}
    </div>
  );
}

function Locked({ label, value }) {
  return (
    <div>
      <div style={labelStyle}>{label} <span title="Fixed: can't be changed here">🔒</span></div>
      <div style={{ fontSize: 13 }}>{fmtValue(value)}</div>
    </div>
  );
}

/** Form for one MKS food type. Returns the edited fields only. */
function MksForm({ rec, meta, onChange }) {
  const dicts = meta?.attribute_dictionaries || {};
  const [form, setForm] = useState(() => ({
    canonical_name: rec.canonical_name || "",
    parent_category: rec.parent_category || "",
    aliases: (rec.aliases || []).join(", "),
    core_terms: (rec.core_terms || []).join(", "),
    entity_status: rec.entity_status,
    popularity_tier: rec.popularity_tier,
    regional_flag: Boolean(rec.regional_flag),
    default_attributes: JSON.parse(JSON.stringify(rec.default_attributes || {})),
  }));
  useEffect(() => {
    const fields = {
      canonical_name: form.canonical_name.trim(),
      parent_category: form.parent_category,
      aliases: list(form.aliases),
      core_terms: list(form.core_terms),
      entity_status: form.entity_status,
      popularity_tier: form.popularity_tier,
      regional_flag: form.regional_flag,
      default_attributes: form.default_attributes,
    };
    const changed = Object.fromEntries(Object.entries(fields).filter(([k, v]) => !same(v, rec[k] ?? (k === "aliases" || k === "core_terms" ? [] : undefined))));
    onChange(changed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const toggleAttr = (attr, value) =>
    setForm((f) => {
      const cur = f.default_attributes[attr] || [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...f, default_attributes: { ...f.default_attributes, [attr]: next } };
    });
  return (
    <div>
      <Locked label="Code" value={rec.mks_code} />
      <Field label="Name"><input value={form.canonical_name} onChange={set("canonical_name")} style={{ ...inputStyle, width: "100%" }} /></Field>
      <Field label="Category">
        <select value={form.parent_category} onChange={set("parent_category")} style={inputStyle}>
          {(meta?.parent_categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Other names (aliases)" hint="Comma-separated. What people call it on menus.">
        <textarea value={form.aliases} onChange={set("aliases")} rows={2} style={{ ...inputStyle, width: "100%" }} />
      </Field>
      <Field label="Core words" hint="Comma-separated. Words a dish name must contain to match.">
        <input value={form.core_terms} onChange={set("core_terms")} style={{ ...inputStyle, width: "100%" }} />
      </Field>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Field label="Status">
          <select value={form.entity_status} onChange={set("entity_status")} style={inputStyle}>
            {(meta?.entity_status_values || []).map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Popularity">
          <select value={form.popularity_tier} onChange={set("popularity_tier")} style={inputStyle}>
            {(meta?.popularity_tier_values || []).map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Regional">
          <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", paddingTop: 6 }}>
            <input type="checkbox" checked={form.regional_flag} onChange={set("regional_flag")} /> Regional food
          </label>
        </Field>
      </div>
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Attributes</summary>
        {Object.keys(dicts).map((attr) => (
          <div key={attr} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 4 }}>{attr.replace(/_/g, " ")}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {(dicts[attr] || []).map((v) => {
                const on = (form.default_attributes[attr] || []).includes(v);
                return (
                  <button key={v} type="button" onClick={() => toggleAttr(attr, v)} aria-pressed={on}
                    style={{ borderRadius: 6, padding: "3px 8px", fontSize: 12, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${on ? OWNER_COLORS.ink : OWNER_COLORS.line}`, background: on ? OWNER_COLORS.ink : "#fff", color: on ? "#fff" : OWNER_COLORS.ink }}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </details>
    </div>
  );
}

function KeyForm({ rec, onChange }) {
  const [notes, setNotes] = useState(rec.notes || "");
  const [eligible, setEligible] = useState(rec.is_eligible !== false);
  const [aliases, setAliases] = useState(() => (rec.aliases || []).map((a) => ({ ...a })));
  useEffect(() => {
    const fields = { notes: notes.trim() || null, is_eligible: eligible, aliases: aliases.filter((a) => a.alias_text.trim()).map((a) => ({ alias_text: a.alias_text.trim(), match_type: a.match_type })) };
    onChange(Object.fromEntries(Object.entries(fields).filter(([k, v]) => !same(v, rec[k] ?? (k === "aliases" ? [] : null)))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, eligible, aliases]);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
        <Locked label="Key" value={rec.key} />
        <Locked label="Level" value={rec.level} />
        <Locked label="Parent" value={rec.parent_key} />
      </div>
      <Locked label="Label" value={rec.label} />
      <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 3 }}>A key's meaning is fixed. To rename, add a new key and retire this one.</div>
      <Field label="Compare">
        <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={eligible} onChange={(e) => setEligible(e.target.checked)} /> Can be compared with similar dishes
        </label>
      </Field>
      <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, width: "100%" }} aria-label="Notes" /></Field>
      <Field label="Matching words (aliases)">
        <div style={{ display: "grid", gap: 6 }}>
          {aliases.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <input value={a.alias_text} onChange={(e) => setAliases((l) => l.map((x, j) => (j === i ? { ...x, alias_text: e.target.value } : x)))} style={{ ...inputStyle, flex: 1 }} aria-label="Alias" />
              <select value={a.match_type} onChange={(e) => setAliases((l) => l.map((x, j) => (j === i ? { ...x, match_type: e.target.value } : x)))} style={inputStyle} aria-label="Match type">
                {["exact", "prefix", "contains", "regex"].map((m) => <option key={m}>{m}</option>)}
              </select>
              <Btn small onClick={() => setAliases((l) => l.filter((_, j) => j !== i))} title="Remove this alias">✕</Btn>
            </div>
          ))}
          <div><Btn small onClick={() => setAliases((l) => [...l, { alias_text: "", match_type: "exact" }])}>＋ Alias</Btn></div>
        </div>
      </Field>
    </div>
  );
}

function RuleForm({ rec, onChange }) {
  const [ruling, setRuling] = useState(rec.ruling);
  const [reason, setReason] = useState(rec.reason || "");
  useEffect(() => {
    const fields = { ruling, reason: reason.trim() || null };
    onChange(Object.fromEntries(Object.entries(fields).filter(([k, v]) => !same(v, rec[k] ?? null))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruling, reason]);
  return (
    <div>
      <Locked label="Keys" value={`${rec.anchor_key} → ${rec.candidate_key}`} />
      <Field label="Ruling">
        <select value={ruling} onChange={(e) => setRuling(e.target.value)} style={inputStyle}>
          <option value="deny">Never compare</option>
          <option value="approve_cross">Allow compare across families</option>
        </select>
      </Field>
      <Field label="Reason"><input value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></Field>
    </div>
  );
}

/**
 * Edit one record in a draft. onSave(ops) sends changes; readOnly shows values only.
 */
export default function RecordEditor({ system, recordKey, record, meta, readOnly, onSave, busy, allKeys }) {
  const [fields, setFields] = useState({});
  const [replacedBy, setReplacedBy] = useState("");
  const active = isActive(system, recordKey, record);
  const kind = system === "mks" ? "mks" : recordKey.startsWith("K") ? "key" : "rule";
  const editKey = `${recordKey}-${JSON.stringify(record)}`;
  const options = useMemo(() => (allKeys || []).filter((k) => k !== recordKey), [allKeys, recordKey]);

  if (readOnly) {
    return (
      <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
        {Object.entries(record).map(([k, v]) => (
          <div key={k}><span style={{ color: OWNER_COLORS.muted }}>{k.replace(/_/g, " ")}: </span>{fmtValue(v)}</div>
        ))}
      </div>
    );
  }
  const dirty = Object.keys(fields).length > 0;
  return (
    <div key={editKey}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <strong style={{ fontSize: 15 }}>{recordTitle(system, recordKey, record)}</strong>
        {!active ? <Tag tone="warn">Off</Tag> : null}
      </div>
      {kind === "mks" ? <MksForm rec={record} meta={meta} onChange={setFields} /> : kind === "key" ? <KeyForm rec={record} onChange={setFields} /> : <RuleForm rec={record} onChange={setFields} />}
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
        <Btn kind="primary" disabled={!dirty || busy} onClick={() => onSave([{ op: "update", key: recordKey, fields }])}>✓ Save change</Btn>
        {active ? (
          <>
            {kind !== "rule" ? (
              <select value={replacedBy} onChange={(e) => setReplacedBy(e.target.value)} style={inputStyle} aria-label="Replaced by">
                <option value="">Not replaced</option>
                {options.map((k) => <option key={k} value={k}>Replaced by {k}</option>)}
              </select>
            ) : null}
            <Btn kind="danger" disabled={busy} onClick={() => onSave([{ op: "deactivate", key: recordKey, superseded_by: replacedBy || null }])}>⏻ Turn off</Btn>
          </>
        ) : (
          <Btn disabled={busy} onClick={() => onSave([{ op: "reactivate", key: recordKey }])}>↺ Turn back on</Btn>
        )}
      </div>
      <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 8 }}>Records are never deleted. Turning one off keeps it and its history.</div>
    </div>
  );
}

/** Add a new record to a draft. */
export function AddRecordForm({ system, meta, keys, onAdd, busy }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [cat, setCat] = useState((meta?.parent_categories || [])[0] || "");
  const [terms, setTerms] = useState("");
  const [parent, setParent] = useState("");
  const parents = (keys || []).filter((r) => r.kind === "key" && r.active && r.record.level < 3);
  const add = async (ops) => {
    if (await onAdd(ops)) {
      setCode("");
      setName("");
      setTerms("");
    }
  };
  if (system === "mks") {
    return (
      <div style={{ display: "grid", gap: 4 }}>
        <label style={labelStyle}>Code (e.g. DES-MOCHI)</label>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={inputStyle} aria-label="New food type code" />
        <label style={labelStyle}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} aria-label="New food type name" />
        <label style={labelStyle}>Category</label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={inputStyle} aria-label="New food type category">
          {(meta?.parent_categories || []).map((c) => <option key={c}>{c}</option>)}
        </select>
        <label style={labelStyle}>Core words (comma-separated)</label>
        <input value={terms} onChange={(e) => setTerms(e.target.value)} style={inputStyle} aria-label="New food type core words" />
        <div style={{ marginTop: 10 }}>
          <Btn kind="primary" disabled={busy || !code || !name} onClick={() => add([{ op: "add", key: code.trim(), record: { canonical_name: name.trim(), parent_category: cat, core_terms: list(terms) } }])}>＋ Add food type</Btn>
        </div>
      </div>
    );
  }
  const p = parents.find((r) => String(r.record.key) === String(parent));
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label style={labelStyle}>Inside</label>
      <select value={parent} onChange={(e) => setParent(e.target.value)} style={inputStyle} aria-label="New key parent">
        <option value="">Top level</option>
        {parents.map((r) => <option key={r.key} value={r.record.key}>{r.record.key} · {r.record.label}</option>)}
      </select>
      <label style={labelStyle}>Key number{p ? ` (between ${p.record.key + 1} and ${p.record.key + (p.record.level === 1 ? 99999 : 9999)})` : " (multiple of 100000)"}</label>
      <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} style={inputStyle} inputMode="numeric" aria-label="New key number" />
      <label style={labelStyle}>Label</label>
      <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} aria-label="New key label" />
      <div style={{ marginTop: 10 }}>
        <Btn kind="primary" disabled={busy || !code || !name} onClick={() => add([{ op: "add", key: `K${code}`, record: { label: name.trim(), parent_key: p ? p.record.key : null, level: p ? p.record.level + 1 : 1 } }])}>＋ Add key</Btn>
      </div>
    </div>
  );
}
