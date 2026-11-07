import React, { useCallback, useEffect, useState } from "react";
import { OWNER_COLORS } from "../OwnerLayout.jsx";

/** Small shared pieces for Owner → Food Intelligence. Compact buttons only (no full-width bars, no green pills). */

export function Btn({ children, onClick, kind = "plain", disabled, title, type = "button", small }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: small ? "5px 11px" : "8px 15px",
    fontSize: small ? 12 : 13,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    whiteSpace: "nowrap",
  };
  const kinds = {
    plain: { background: "#fff", color: OWNER_COLORS.ink, border: `1px solid ${OWNER_COLORS.line}` },
    primary: { background: OWNER_COLORS.ink, color: "#fff", border: `1px solid ${OWNER_COLORS.ink}` },
    danger: { background: "#fff", color: "#b42318", border: "1px solid #f3c5c0" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} style={{ ...base, ...kinds[kind] }}>
      {children}
    </button>
  );
}

export function Tag({ children, tone = "neutral" }) {
  const tones = {
    neutral: { background: "#f2f4f7", color: OWNER_COLORS.ink },
    warn: { background: "#fff6e5", color: "#8a5300" },
    bad: { background: "#fdecea", color: "#b42318" },
    info: { background: "#eef4ff", color: "#1d4ed8" },
  };
  return (
    <span style={{ display: "inline-block", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 700, ...tones[tone] }}>
      {children}
    </span>
  );
}

export function Banner({ tone = "info", children }) {
  const tones = {
    info: { background: "#eef4ff", border: "#c7d7fe", color: "#1e3a8a" },
    warn: { background: "#fff8eb", border: "#fedf89", color: "#7a4b00" },
    error: { background: "#fef3f2", border: "#fecdca", color: "#912018" },
    ok: { background: "#f6fef9", border: "#d1fadf", color: "#05603a" },
  };
  const t = tones[tone];
  return (
    <div style={{ background: t.background, border: `1px solid ${t.border}`, color: t.color, borderRadius: 12, padding: "11px 14px", fontSize: 13, lineHeight: 1.5, margin: "0 0 14px" }}>
      {children}
    </div>
  );
}

export function Loading() {
  return <div style={{ color: OWNER_COLORS.muted, fontSize: 13, padding: 12 }}>Loading…</div>;
}

export function useLoad(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return fn()
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((error) => setState({ loading: false, data: null, error }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    reload();
  }, [reload]);
  return { ...state, reload };
}

export function when(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "B 95 · L · D 80" — mealtime codes in standard order (no score shown when there isn't one). */
const CODE_ORDER = ["B", "BR", "L", "D", "S", "DS", "LN", "A"];
export function codesText(codes) {
  if (!codes || typeof codes !== "object") return "—";
  const parts = CODE_ORDER.filter((c) => codes[c]).map((c) => (codes[c].score == null ? c : `${c} ${codes[c].score}`));
  return parts.length ? parts.join(" · ") : "—";
}

export function recordTitle(system, key, rec) {
  if (!rec) return key;
  if (system === "mks") return rec.canonical_name || key;
  if (system === "mealtime") return rec.scope === "category" ? `${rec.target} (category)` : rec.label || rec.target;
  if (key.startsWith("K")) return rec.label || key;
  return `Rule ${rec.anchor_key} → ${rec.candidate_key}`;
}

export function recordSub(system, key, rec) {
  if (!rec) return "";
  if (system === "mks") return `${key} · ${rec.parent_category}`;
  if (system === "mealtime") return `${rec.scope === "category" ? "category" : rec.target} · ${codesText(rec.codes)}${rec.proposal ? " · suggestion waiting" : ""}`;
  if (key.startsWith("K")) return `${rec.key} · level ${rec.level}${rec.parent_key ? ` · in ${rec.parent_key}` : ""}`;
  return rec.ruling;
}

export function isActive(system, key, rec) {
  if (!rec) return false;
  if (system === "mks" || system === "mealtime") return rec.active !== false;
  if (key.startsWith("K")) return rec.status !== "deprecated";
  return rec.enabled !== false;
}

export function fmtValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    if (!v.length) return "—";
    return v.map((x) => (x && typeof x === "object" ? `${x.alias_text}${x.match_type && x.match_type !== "exact" ? ` (${x.match_type})` : ""}` : String(x))).join(", ");
  }
  if (typeof v === "object") {
    const parts = Object.entries(v).filter(([, val]) => !(Array.isArray(val) && !val.length)).map(([k, val]) => `${k}: ${fmtValue(val)}`);
    return parts.length ? parts.join("; ") : "—";
  }
  return String(v);
}

const OP_LABEL = { add: "Added", change: "Changed", deactivate: "Turned off", reactivate: "Turned back on", remove: "Not in this version" };
const OP_TONE = { add: "info", change: "neutral", deactivate: "warn", reactivate: "info", remove: "bad" };

export function SummaryLine({ summary }) {
  if (!summary) return null;
  if (!summary.total) return <span style={{ color: OWNER_COLORS.muted }}>No changes</span>;
  const parts = ["add", "change", "deactivate", "reactivate", "remove"].filter((k) => summary[k]).map((k) => `${summary[k]} ${OP_LABEL[k].toLowerCase()}`);
  return <span>{parts.join(" · ")}</span>;
}

/** Record-by-record list of changes with field-level before → after. */
export function DiffList({ system, changes, max = 200 }) {
  if (!changes || !changes.length) return <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>No differences.</div>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {changes.slice(0, max).map((c) => {
        const rec = c.after || c.before;
        const hidden = system === "mealtime" ? ["proposal", "source", "confidence", "label", "scope", "target"] : [];
        const fields = c.op === "add"
          ? (system === "mealtime" ? ["codes"] : [])
          : (c.fields || []).filter((f) => (!["superseded_by", "deprecated_at"].includes(f) || c.op === "change") && !hidden.includes(f));
        return (
          <div key={c.record_key} style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: "9px 12px", background: "#fff" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Tag tone={OP_TONE[c.op]}>{OP_LABEL[c.op] || c.op}</Tag>
              <strong style={{ fontSize: 13 }}>{recordTitle(system, c.record_key, rec)}</strong>
              <span style={{ color: OWNER_COLORS.muted, fontSize: 12 }}>{c.record_key}</span>
              {c.op === "deactivate" && c.after?.superseded_by ? <span style={{ fontSize: 12 }}>replaced by {c.after.superseded_by}</span> : null}
            </div>
            {fields.length ? (
              <div style={{ marginTop: 6, display: "grid", gap: 3 }}>
                {fields.map((f) => <FieldChange key={f} field={f} before={c.before?.[f]} after={c.after?.[f]} />)}
              </div>
            ) : null}
          </div>
        );
      })}
      {changes.length > max ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>…and {changes.length - max} more</div> : null}
    </div>
  );
}

function itemLabel(x) {
  return x && typeof x === "object" ? fmtValue([x]) : String(x);
}

/** One changed field. Lists show only what was added / removed; everything else shows before → after. */
function FieldChange({ field, before, after }) {
  const label = <span style={{ color: OWNER_COLORS.muted }}>{field.replace(/_/g, " ")}: </span>;
  if (field === "codes") {
    return (
      <div style={{ fontSize: 12, lineHeight: 1.45 }}>
        {label}
        {before ? <><span style={{ textDecoration: "line-through", color: "#912018" }}>{codesText(before)}</span>{" → "}</> : null}
        <span style={{ color: "#05603a" }}>{codesText(after)}</span>
      </div>
    );
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const b = new Set(before.map(itemLabel));
    const a = new Set(after.map(itemLabel));
    const added = [...a].filter((x) => !b.has(x));
    const removed = [...b].filter((x) => !a.has(x));
    return (
      <div style={{ fontSize: 12, lineHeight: 1.45 }}>
        {label}
        {added.map((x) => <span key={`+${x}`} style={{ color: "#05603a", marginRight: 8 }}>+ {x}</span>)}
        {removed.map((x) => <span key={`-${x}`} style={{ color: "#912018", textDecoration: "line-through", marginRight: 8 }}>− {x}</span>)}
        {!added.length && !removed.length ? <span>order changed</span> : null}
      </div>
    );
  }
  return (
    <div style={{ fontSize: 12, lineHeight: 1.45 }}>
      {label}
      <span style={{ textDecoration: "line-through", color: "#912018" }}>{fmtValue(before)}</span>
      {" → "}
      <span style={{ color: "#05603a" }}>{fmtValue(after)}</span>
    </div>
  );
}

export const linkStyle = { color: OWNER_COLORS.ink, textDecoration: "none", fontWeight: 600 };

export function IssueList({ items, tone }) {
  if (!items || !items.length) return null;
  return (
    <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.55, color: tone === "bad" ? "#912018" : "#7a4b00" }}>
      {items.slice(0, 50).map((i, idx) => <li key={`${i.code}-${i.key}-${idx}`}>{i.message}</li>)}
      {items.length > 50 ? <li>…and {items.length - 50} more</li> : null}
    </ul>
  );
}

/** Modal that only enables its action once the owner types the confirm word. */
export function ConfirmDialog({ title, word, actionLabel, onCancel, onConfirm, busy, disabled, children }) {
  const [typed, setTyped] = useState("");
  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(640px, 100%)", maxHeight: "88vh", overflow: "auto", padding: 22, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h3>
        {children}
        <label style={{ display: "block", marginTop: 14, fontSize: 13 }}>
          Type <strong>{word}</strong> to confirm
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus style={{ ...inputStyle, display: "block", marginTop: 6, width: 200 }} aria-label={`Type ${word} to confirm`} />
        </label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn onClick={onCancel} disabled={busy}>Cancel</Btn>
          <Btn kind="primary" onClick={onConfirm} disabled={typed.trim() !== word || busy || disabled}>{busy ? "Working…" : actionLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

export const inputStyle = {
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "8px 11px",
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
  color: OWNER_COLORS.ink,
  boxSizing: "border-box",
};

export const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, margin: "10px 0 4px" };
