import React, { useMemo, useState } from "react";
import { OWNER_COLORS } from "../OwnerLayout.jsx";
import { fiApi } from "../../../lib/ownerFoodIntelligenceApi.js";
import { Loading, Tag, inputStyle, useLoad } from "./fiUi.jsx";

/**
 * Food Ontology browsing aids (read-only): branches you can fold, gap filters, and for one key its
 * path, children, how live Search / Similar / Compare treat it, rules and mapped dishes.
 * Path, children and labels come from the official version's records; usage and dishes come from
 * GET /food_ontology/key-stats and /keys/:key/context (live checks in code + mks.item_key_map).
 */

const SHOW = [
  ["", "All keys"],
  ["no_definition", "No definition"],
  ["no_dishes", "No dishes mapped"],
  ["no_words", "No matching words"],
  ["not_compare", "Not used by Compare"],
  ["rules", "Rules"],
];

const isKey = (r) => r.kind === "key" || String(r.key).startsWith("K");
const keyNum = (r) => Number(r.record?.key ?? String(r.key).slice(1));


export function OntologyList({ records, selected, onSelect, stats }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState("");
  const [open, setOpen] = useState(() => new Set());
  const statsByKey = stats?.keys || {};

  const keys = useMemo(() => records.filter(isKey), [records]);
  const rules = useMemo(() => records.filter((r) => !isKey(r)), [records]);
  const branchOf = useMemo(() => {
    const parent = new Map(keys.map((r) => [keyNum(r), r.record.parent_key]));
    const memo = new Map();
    const find = (k) => {
      if (memo.has(k)) return memo.get(k);
      let cur = k;
      for (let i = 0; i < 6 && parent.get(cur) != null; i += 1) cur = parent.get(cur);
      memo.set(k, cur);
      return cur;
    };
    return find;
  }, [keys]);
  const branchSize = useMemo(() => {
    const m = new Map();
    for (const r of keys) m.set(branchOf(keyNum(r)), (m.get(branchOf(keyNum(r))) || 0) + 1);
    return m;
  }, [keys, branchOf]);

  const tests = {
    no_definition: (r) => !String(r.record.notes || "").trim(),
    no_dishes: (r) => {
      const d = statsByKey[keyNum(r)]?.dishes;
      return Number(r.record.level) === 3 && (!d || d.approved + d.pending === 0);
    },
    no_words: (r) => !(r.record.aliases || []).length,
    not_compare: (r) => statsByKey[keyNum(r)] && !statsByKey[keyNum(r)].usage.compare,
  };
  const counts = useMemo(() => {
    const out = { "": keys.length, rules: rules.length };
    for (const [k, fn] of Object.entries(tests)) out[k] = keys.filter(fn).length;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, rules, stats]);

  const t = text.trim().toLowerCase();
  const folding = !t && !show;
  let shown;
  if (show === "rules") shown = rules;
  else {
    shown = keys.filter((r) => (show ? tests[show](r) : true));
    if (t) shown = shown.filter((r) => `${keyNum(r)} ${r.record.label} ${(r.record.aliases || []).map((a) => a.alias_text).join(" ")}`.toLowerCase().includes(t));
    if (folding) shown = shown.filter((r) => Number(r.record.level) === 1 || open.has(branchOf(keyNum(r))));
  }
  const toggle = (k) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    return n;
  });

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search name, key or matching word" style={{ ...inputStyle, flex: 1, minWidth: 0 }} aria-label="Search keys" />
        <select value={show} onChange={(e) => setShow(e.target.value)} style={inputStyle} aria-label="Show">
          {SHOW.map(([v, l]) => <option key={v} value={v}>{l} ({counts[v] ?? 0})</option>)}
        </select>
      </div>
      {folding ? (
        <div style={{ display: "flex", gap: 14, fontSize: 12, marginBottom: 6 }}>
          <button type="button" style={linkBtn} onClick={() => setOpen(new Set(keys.filter((r) => Number(r.record.level) === 1).map(keyNum)))}>Open all</button>
          <button type="button" style={linkBtn} onClick={() => setOpen(new Set())}>Close all</button>
        </div>
      ) : null}
      <div style={{ maxHeight: 560, overflow: "auto", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, background: "#fff" }}>
        {shown.map((r) => {
          const k = isKey(r) ? keyNum(r) : null;
          const level = Number(r.record.level || 1);
          const top = isKey(r) && level === 1;
          const d = k != null ? statsByKey[k]?.dishes : null;
          return (
            <div key={r.key} style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${OWNER_COLORS.line}`, background: selected === r.key ? "#f2f4f7" : "#fff" }}>
              {top && folding ? (
                <button type="button" onClick={() => toggle(k)} aria-label={open.has(k) ? "Fold branch" : "Open branch"} style={{ ...linkBtn, width: 28, color: OWNER_COLORS.muted, fontSize: 12 }}>
                  {open.has(k) ? "▾" : "▸"}
                </button>
              ) : <span style={{ width: folding ? 28 : 8 }} />}
              <button type="button" onClick={() => onSelect(r.key)} style={{ flex: 1, minWidth: 0, textAlign: "left", padding: "8px 12px 8px 0", border: 0, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: top ? 800 : 700, color: r.active ? OWNER_COLORS.ink : OWNER_COLORS.muted, paddingLeft: isKey(r) && !show && !t ? (level - 1) * 14 : 0 }}>
                  {isKey(r) ? r.record.label : `Rule ${r.record.anchor_key} → ${r.record.candidate_key}`}
                </span>
                <span style={{ display: "block", fontSize: 11, color: OWNER_COLORS.muted, paddingLeft: isKey(r) && !show && !t ? (level - 1) * 14 : 0 }}>
                  {isKey(r) ? `${k} · level ${level}${top ? ` · ${branchSize.get(k) - 1} keys` : ""}${d && d.approved + d.pending ? ` · ${d.approved + d.pending} dish${d.approved + d.pending === 1 ? "" : "es"}` : ""}` : r.record.ruling}
                </span>
              </button>
              {!r.active ? <span style={{ paddingRight: 10 }}><Tag tone="warn">Off</Tag></span> : null}
            </div>
          );
        })}
        {!shown.length ? <div style={{ padding: 14, fontSize: 13, color: OWNER_COLORS.muted }}>Nothing matches.</div> : null}
      </div>
    </>
  );
}

function usageLines(u, label) {
  if (!u) return [];
  const fam = label(u.family_key);
  const yes = (b) => (b ? "yes" : "no");
  if (!u.search && !u.similar && !u.compare) return [`Not used by Search, Similar or Compare: the whole ${label(u.branch_key)} branch is left out.`];
  const out = [`Search: ${yes(u.search)}`];
  out.push(u.similar ? `Similar: dishes on this key; ${u.family_similar ? `also other ${fam} keys` : `not other ${fam} keys (too varied)`}` : `Similar: no (${label(u.branch_key)} is search only)`);
  out.push(u.compare ? `Compare: dishes on this key; ${u.family_compare ? `also other ${fam} keys` : `not other ${fam} keys (too varied)`}` : `Compare: no (${label(u.branch_key)} is search only)`);
  return out;
}

export function OntologyKeyContext({ record, records, onSelect }) {
  const k = Number(record.key);
  const ctx = useLoad(() => fiApi.ontologyKeyContext(k), [k]);
  const byNum = useMemo(() => new Map(records.filter(isKey).map((r) => [keyNum(r), r])), [records]);
  const label = (n) => byNum.get(Number(n))?.record.label || String(n);
  const path = [];
  for (let cur = byNum.get(k), i = 0; cur && i < 6; cur = byNum.get(Number(cur.record.parent_key)), i += 1) path.unshift(cur);
  const children = records.filter((r) => isKey(r) && Number(r.record.parent_key) === k);
  const rules = records.filter((r) => !isKey(r) && (Number(r.record.anchor_key) === k || Number(r.record.candidate_key) === k));
  const muted = { fontSize: 12, color: OWNER_COLORS.muted };
  const link = (r) => (
    <button key={r.key} type="button" style={linkBtn} onClick={() => onSelect(r.key)}>{r.record.label}</button>
  );

  return (
    <div style={{ display: "grid", gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
      <div style={{ fontSize: 13, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
        {path.map((r, i) => (
          <React.Fragment key={r.key}>
            {i ? <span style={muted}>›</span> : null}
            {keyNum(r) === k ? <strong>{r.record.label}</strong> : link(r)}
          </React.Fragment>
        ))}
      </div>

      <Section title="Definition">
        {String(record.notes || "").trim() ? <div style={{ fontSize: 13 }}>{record.notes}</div> : <div style={muted}>No definition yet. Add one in a draft (Notes).</div>}
      </Section>

      {children.length ? (
        <Section title={`Inside (${children.length})`}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 13 }}>{children.map(link)}</div>
        </Section>
      ) : null}

      {ctx.loading ? <Loading /> : ctx.error ? <div style={muted}>Couldn't load live use and dishes.</div> : (
        <>
          <Section title="Live use">
            {usageLines(ctx.data.usage, label).map((l) => <div key={l} style={{ fontSize: 13 }}>{l}</div>)}
            {record.is_eligible === false ? <div style={muted}>This record is marked not for Compare; live Compare follows the checks above.</div> : null}
            {rules.length ? rules.map((r) => (
              <div key={r.key} style={{ fontSize: 13 }}>
                Rule: {r.record.ruling === "deny" ? "never" : "also"} compare {label(r.record.anchor_key)} with {label(r.record.candidate_key)}{r.record.reason ? ` (${r.record.reason})` : ""}
              </div>
            )) : null}
          </Section>
          <Section title="Dishes mapped here">
            {ctx.data.dishes.approved + ctx.data.dishes.pending === 0 ? (
              <div style={muted}>None yet.</div>
            ) : (
              <>
                <div style={{ fontSize: 13 }}>
                  {ctx.data.dishes.approved} approved{ctx.data.dishes.pending ? ` · ${ctx.data.dishes.pending} waiting for review` : ""}
                </div>
                {ctx.data.dishes.samples.map((s) => (
                  <div key={`${s.item_schema}:${s.menu_item_id}`} style={muted}>
                    {s.item_name || `Item #${s.menu_item_id}`}{s.restaurant_name ? ` · ${s.restaurant_name}` : ""}{s.status !== "approved" ? " · waiting" : ""}
                  </div>
                ))}
              </>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>
      {children}
    </div>
  );
}

const linkBtn = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" };
