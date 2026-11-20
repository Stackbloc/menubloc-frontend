import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OWNER_COLORS as C, PageCard, EmptyState } from "./OwnerLayout.jsx";
import { getOwnerMenuPipelineReport, getOwnerMenuPipelineRun } from "../../lib/ownerApi.js";

/**
 * Owner → Menu Pipeline → Report (plan 67, 2026-11-20). Laid out like MIMS (Owner → Menu Items):
 * filter bar, summary tiles, a paged table and a detail panel on the right.
 * No stage selected = the whole pipeline, one row per run. A stage selected in the diagram = that step's own rows.
 * Every filter lives in the address (the diagram owns ?page= and ?stage=, so the table page is ?rpage=).
 * Read-only: GET /api/owner/menu-pipeline/report and /report/run.
 */

const REPORT_KEYS = [
  "days", "from", "to", "entry", "status", "restaurant", "chain", "state", "city", "problem", "hold_code", "attention", "sort", "rpage", "run",
];

const RED = "#B42318";
const AMBER = "#B54708";
const BLUE = "#175CD3";
const GRAY = "#98A2B3";
const STATUS = {
  running: { label: "Running", color: BLUE },
  waiting: { label: "Waiting", color: AMBER },
  done: { label: "Done", color: "#067647" },
  failed: { label: "Failed", color: RED },
  stopped: { label: "Stopped", color: "#475467" },
  skipped: { label: "Skipped", color: GRAY },
  unknown: { label: "Not recorded", color: GRAY },
  superseded: { label: "Replaced", color: GRAY },
  // A step's own rows keep their table's words (capture jobs, held dishes, menus).
  completed: { label: "Completed", color: "#067647" },
  queued: { label: "Queued", color: AMBER },
  pending: { label: "Pending", color: AMBER },
  processing: { label: "Processing", color: BLUE },
  open: { label: "Open", color: AMBER },
  edited: { label: "Edited, open", color: AMBER },
  approved: { label: "Approved", color: "#067647" },
  rejected: { label: "Rejected", color: "#475467" },
  published: { label: "Published", color: "#067647" },
  draft: { label: "Draft", color: AMBER },
  hidden: { label: "Hidden", color: GRAY },
  archived: { label: "Archived", color: GRAY },
};
const SORT_LABEL = { newest: "Newest", oldest: "Oldest", longest: "Took longest", restaurant: "Restaurant A–Z" };

const inputStyle = {
  height: 34,
  padding: "0 10px",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: "#fff",
  color: C.ink,
  fontSize: 13,
  minWidth: 0,
  boxSizing: "border-box",
};
const buttonStyle = {
  height: 32,
  padding: "0 12px",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: "#fff",
  color: C.ink,
  fontSize: 13,
  cursor: "pointer",
};
const linkBtn = { background: "none", border: 0, padding: 0, color: BLUE, cursor: "pointer", fontSize: 13, textAlign: "left" };
const TH = { textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };
const TD = { padding: "9px 10px", fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.line}`, verticalAlign: "top" };

const when = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};
const day = (v) => (v ? new Date(v).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "");
function ago(v) {
  if (!v) return "—";
  const ms = Date.now() - new Date(v).getTime();
  const h = ms / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(ms / 60000))} min ago`;
  if (h < 48) return `${Math.round(h)} h ago`;
  return `${Math.round(h / 24)} days ago`;
}
const humanKey = (k) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function Select({ label, value, onChange, children, width = 140 }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 11, color: C.muted, width }}>
      {label}
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {children}
      </select>
    </label>
  );
}

/** Text box that writes to the address 350 ms after typing stops, and follows the address when it changes from outside. */
function Text({ label, value, onChange, width = 120, placeholder, type = "text" }) {
  const [v, setV] = useState(value || "");
  const [seen, setSeen] = useState(value || "");
  const timer = useRef(null);
  if ((value || "") !== seen) {
    setSeen(value || "");
    if ((value || "") !== v.trim()) setV(value || "");
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  const type_ = (x) => {
    setV(x);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(x.trim()), type === "date" ? 0 : 350);
  };
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 11, color: C.muted, width }}>
      {label}
      <input type={type} value={v} placeholder={placeholder} onChange={(e) => type_(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
    </label>
  );
}

function Filters({ p, setParam, filters, statuses, onClear }) {
  const f = filters || {};
  const custom = Boolean(p.from || p.to);
  return (
    <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <Select
          label="Window"
          value={custom ? "custom" : p.days || "7"}
          onChange={(v) => {
            if (v === "custom") setParam({ from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), days: "" });
            else setParam({ days: v === "7" ? "" : v, from: "", to: "" });
          }}
          width={120}
        >
          <option value="1">24 hours</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
          <option value="custom">Dates…</option>
        </Select>
        {custom ? (
          <>
            <Text label="From" type="date" value={p.from} onChange={(v) => setParam({ from: v })} width={140} />
            <Text label="To (whole day)" type="date" value={p.to} onChange={(v) => setParam({ to: v })} width={140} />
          </>
        ) : null}
        <Select label="Entry" value={p.entry} onChange={(v) => setParam({ entry: v })} width={190}>
          <option value="">Every way in</option>
          {(f.entries || []).map((e) => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </Select>
        <Select label="Status" value={p.status} onChange={(v) => setParam({ status: v })} width={120}>
          <option value="">Any</option>
          {(statuses || []).map((s) => (
            <option key={s} value={s}>{STATUS[s]?.label || s}</option>
          ))}
        </Select>
        <Text label="Restaurant (name or #id)" value={p.restaurant} onChange={(v) => setParam({ restaurant: v })} width={200} placeholder="e.g. Wendy's or #1234" />
        <Select label="Chain" value={p.chain} onChange={(v) => setParam({ chain: v })} width={150}>
          <option value="">Any (chain or not)</option>
          <option value="independent">Independent</option>
          <option value="chain">Any chain</option>
        </Select>
        <Text label="City" value={p.city} onChange={(v) => setParam({ city: v })} width={130} />
        <Text label="State" value={p.state} onChange={(v) => setParam({ state: v.toUpperCase() })} width={70} placeholder="CA" />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginTop: 12 }}>
        <Select label="Problem" value={p.problem} onChange={(v) => setParam({ problem: v })} width={230}>
          <option value="">Any</option>
          {(f.problems || []).map((x) => (
            <option key={x.id} value={x.id} disabled={!x.filterable}>
              {x.label}{x.filterable ? "" : " (not recorded)"}
            </option>
          ))}
        </Select>
        <Text label="Hold code" value={p.hold_code} onChange={(v) => setParam({ hold_code: v })} width={170} placeholder="e.g. price_missing" />
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: C.ink, height: 34 }}>
          <input type="checkbox" checked={p.attention === "1"} onChange={(e) => setParam({ attention: e.target.checked ? "1" : "" })} />
          Needs attention only
        </label>
        <Select label="Sort" value={p.sort || "newest"} onChange={(v) => setParam({ sort: v === "newest" ? "" : v })} width={150}>
          {(f.sorts || Object.keys(SORT_LABEL)).map((s) => (
            <option key={s} value={s}>{SORT_LABEL[s] || s}</option>
          ))}
        </Select>
        <button type="button" onClick={onClear} style={buttonStyle}>Clear</button>
      </div>
    </div>
  );
}

function StatusText({ s }) {
  const st = STATUS[s] || { label: s || "—", color: C.muted };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: st.color, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: st.color, flex: "0 0 auto" }} />
      {st.label}
    </span>
  );
}

function Tile({ label, value, sub, color, onClick, on }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        textAlign: "left",
        minWidth: 110,
        padding: "8px 12px",
        border: `1px solid ${on ? color || C.ink : C.line}`,
        borderRadius: 10,
        background: on ? "#F9FAFB" : "#fff",
        cursor: onClick ? "pointer" : "default",
        font: "inherit",
      }}
    >
      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || C.ink, lineHeight: 1.3 }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: C.muted }}>{sub}</div> : null}
    </Tag>
  );
}

/** Tiles from whatever summary the view returns (runs: by status + times; a step: by status / by event / totals). */
function Summary({ data, p, setParam }) {
  const s = data.summary || {};
  const unit = data.unit || "row";
  const tiles = [<Tile key="total" label={`${humanKey(unit)}s`} value={Number(s.total || 0).toLocaleString()} />];
  if (s.by_status) {
    for (const [k, n] of Object.entries(s.by_status)) {
      const filterable = (data.statuses || []).includes(k);
      tiles.push(
        <Tile
          key={`st:${k}`}
          label={STATUS[k]?.label || humanKey(k)}
          value={Number(n).toLocaleString()}
          color={STATUS[k]?.color}
          on={p.status === k}
          onClick={filterable ? () => setParam({ status: p.status === k ? "" : k }) : undefined}
        />
      );
    }
  }
  if (s.by_event) {
    for (const [k, n] of Object.entries(s.by_event)) tiles.push(<Tile key={`ev:${k}`} label={humanKey(k)} value={Number(n).toLocaleString()} color={/failed/.test(k) ? RED : undefined} />);
  }
  if ("avg_took" in s) tiles.push(<Tile key="avg" label="Average time" value={s.avg_took || "—"} sub="finished ones" />);
  if ("oldest_open" in s) tiles.push(<Tile key="oldest" label="Oldest still open" value={s.oldest_open ? ago(s.oldest_open) : "None"} sub={s.oldest_open ? when(s.oldest_open) : null} color={s.oldest_open ? AMBER : undefined} />);
  for (const [k, v] of Object.entries(s)) {
    if (["total", "by_status", "by_event", "avg_took", "oldest_open"].includes(k) || v == null || typeof v === "object") continue;
    tiles.push(<Tile key={`x:${k}`} label={humanKey(k)} value={typeof v === "number" || /^\d+$/.test(String(v)) ? Number(v).toLocaleString() : String(v)} />);
  }
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 14px", borderBottom: `1px solid ${C.line}` }}>{tiles}</div>;
}

function Cell({ col, v }) {
  if (v == null || v === "") return <span style={{ color: C.muted }}>—</span>;
  if (col.kind === "time") return <span style={{ whiteSpace: "nowrap" }}>{when(v)}</span>;
  if (col.kind === "status") return <StatusText s={v} />;
  if (typeof v === "object") {
    return (
      <>
        <div style={{ fontWeight: col.key === "run" || col.key === "restaurant" ? 600 : 400 }}>{v.text ?? "—"}</div>
        {v.sub ? <div style={{ fontSize: 11, color: C.muted, overflowWrap: "anywhere" }}>{v.sub}</div> : null}
      </>
    );
  }
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return typeof v === "number" ? v.toLocaleString() : String(v);
}

function Table({ data, openKey, onOpen }) {
  const cols = data.columns || [];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: Math.max(720, cols.length * 110) }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} style={{ ...TH, textAlign: c.align || "left" }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(data.rows || []).map((r) => {
            const key = r._run ? `${r._run.kind}:${r._run.id}` : null;
            const on = key && key === openKey;
            return (
              <tr
                key={r._key}
                onClick={key ? () => onOpen(key) : undefined}
                onKeyDown={key ? (e) => (e.key === "Enter" ? onOpen(key) : null) : undefined}
                tabIndex={key ? 0 : undefined}
                title={key ? "Open this run" : undefined}
                style={{ cursor: key ? "pointer" : "default", background: on ? C.accentSoft : "transparent", boxShadow: r._attention ? `inset 3px 0 0 ${RED}` : undefined }}
              >
                {cols.map((c) => (
                  <td key={c.key} style={{ ...TD, textAlign: c.align || "left" }}>
                    <Cell col={c} v={r[c.key]} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Right-hand panel: one run's whole journey, step by step (same steps the diagram highlights when tracing). */
function RunPanel({ runKey, stagesById, onClose, onPickStage, onTrace }) {
  const [state, setState] = useState({ loading: true });
  const [kind, ...rest] = runKey.split(":");
  const id = rest.join(":");
  useEffect(() => {
    let live = true;
    getOwnerMenuPipelineRun(kind, id)
      .then((d) => live && setState({ data: d }))
      .catch((e) => live && setState({ error: e?.message || "Could not load this run" }));
    return () => {
      live = false;
    };
  }, [kind, id]);

  const d = state.data;
  const run = d?.run;
  const r = d?.restaurant;
  const m = d?.menu;
  return (
    <PageCard style={{ padding: 16, position: "sticky", top: 12, maxHeight: "calc(100vh - 24px)", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{run?.label || (state.loading ? "Loading…" : "Run")}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflowWrap: "anywhere" }}>
            {kind} #{id}
          </div>
        </div>
        <button type="button" onClick={onClose} style={buttonStyle} aria-label="Close run">
          Close
        </button>
      </div>
      {state.error ? <div style={{ marginTop: 12, color: RED, fontSize: 13 }}>{state.error}</div> : null}
      {d ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr)", gap: "6px 10px", fontSize: 13, marginTop: 14 }}>
            <span style={{ color: C.muted }}>Status</span>
            <StatusText s={d.status} />
            <span style={{ color: C.muted }}>Started</span>
            <span>{when(run?.created_at)}</span>
            <span style={{ color: C.muted }}>Finished</span>
            <span>{run?.finished_at ? when(run.finished_at) : "—"}</span>
            {run?.attempts ? (
              <>
                <span style={{ color: C.muted }}>Tries</span>
                <span>{run.attempts}</span>
              </>
            ) : null}
            <span style={{ color: C.muted }}>Restaurant</span>
            <span>
              {r ? (
                <>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {[r.city, r.state].filter(Boolean).join(", ") || "—"} · {r.chain_name || "Independent"} · #{r.id}
                  </div>
                </>
              ) : (
                "None recorded"
              )}
            </span>
            <span style={{ color: C.muted }}>Menu</span>
            <span>
              {m ? (
                <>
                  #{m.id} {m.name ? `· ${m.name}` : ""}
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {m.status}{m.is_public === false ? " · not public" : ""}{m.version_number ? ` · version ${m.version_number}` : ""}{m.published_at ? ` · published ${when(m.published_at)}` : ""}
                  </div>
                </>
              ) : (
                "No menu recorded"
              )}
            </span>
          </div>

          {r ? (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
              <button type="button" style={linkBtn} onClick={() => onTrace(r.id)}>
                Trace this restaurant on the diagram
              </button>
              <a href={`/owner/menu-items?q=${encodeURIComponent(r.name || "")}&metro_id=all`} style={{ ...linkBtn, textDecoration: "none" }}>
                Its dishes in Menu Items ›
              </a>
            </div>
          ) : null}

          {d.hold_codes?.length ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, margin: "18px 0 6px" }}>Held dishes by reason</div>
              <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
                {d.hold_codes.map((h) => (
                  <div key={h.code} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>{h.code}</span>
                    <span>{h.n}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, margin: "18px 0 8px" }}>Journey</div>
          {run?.steps?.length ? (
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 0 }}>
              {run.steps.map((s, i) => {
                const st = STATUS[s.status] || STATUS.unknown;
                const label = stagesById[s.stage]?.label || s.stage;
                return (
                  <li key={`${s.stage}:${i}`} style={{ display: "grid", gridTemplateColumns: "14px minmax(0,1fr)", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: st.color, marginTop: 4 }} />
                      {i < run.steps.length - 1 ? <span style={{ flex: 1, width: 2, background: C.line, marginTop: 2 }} /> : null}
                    </div>
                    <div style={{ paddingBottom: 12 }}>
                      <button type="button" style={{ ...linkBtn, fontWeight: 600, color: C.ink }} onClick={() => onPickStage(s.stage)} title="Show this step on the diagram and in the report">
                        {label}
                      </button>
                      <span style={{ fontSize: 12, color: st.color, marginLeft: 8 }}>{st.label}</span>
                      {s.detail ? <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflowWrap: "anywhere" }}>{s.detail}</div> : null}
                      {s.at ? <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{when(s.at)}</div> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div style={{ fontSize: 13, color: C.muted }}>No steps recorded for this run.</div>
          )}
        </>
      ) : null}
    </PageCard>
  );
}

export default function MenuPipelineReport({ selectedId, stagesById, resolversById, onPickStage, onShowAll, onTrace }) {
  const [search, setSearch] = useSearchParams();
  const p = useMemo(() => {
    const o = {};
    for (const k of REPORT_KEYS) if (search.get(k)) o[k] = search.get(k);
    return o;
  }, [search]);
  const stage = selectedId && stagesById[selectedId] ? stagesById[selectedId] : null;
  const resolver = !stage && selectedId ? resolversById[selectedId] : null;

  const query = useMemo(() => {
    const { rpage, run, ...rest } = p; // eslint-disable-line no-unused-vars
    return { ...rest, page: rpage || "", view: stage ? "stage" : "jobs", stage: stage ? stage.id : "" };
  }, [p, stage]);
  const key = JSON.stringify(query);
  const [result, setResult] = useState({ key: null });
  useEffect(() => {
    let live = true;
    getOwnerMenuPipelineReport(query)
      .then((d) => live && setResult({ key, data: d }))
      .catch((e) => live && setResult((prev) => ({ key, data: prev.data, error: e?.message || "Could not load the report" })));
    return () => {
      live = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const loading = result.key !== key;
  const data = result.data;

  // Several keys at once ({status: "failed"}); any filter change goes back to table page 1.
  const setParam = useCallback(
    (changes) => {
      setSearch(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v === "" || v == null) next.delete(k);
            else next.set(k, v);
          }
          if (!("rpage" in changes) && !("run" in changes)) next.delete("rpage");
          return next;
        },
        { replace: true }
      );
    },
    [setSearch]
  );
  const clear = () => setParam(Object.fromEntries(REPORT_KEYS.map((k) => [k, ""])));

  const page = Number(p.rpage || 1);
  const pages = data?.pages || 1;
  const windowText = data?.window ? `${day(data.window.from)} – ${day(new Date(new Date(data.window.to).getTime() - 60000))}` : "";

  return (
    <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: p.run ? "minmax(0, 1.6fr) minmax(320px, 1fr)" : "minmax(0, 1fr)", gap: 16, alignItems: "start", minWidth: 0 }} className="pipeline-report-layout">
        <PageCard style={{ padding: 0, overflow: "hidden", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "14px 14px 0" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15 }}>
                Report: {stage ? stage.label : "Whole pipeline"}
                <span style={{ fontWeight: 400, color: C.muted }}> · {stage ? `one row per ${data?.unit || "row"}` : "one row per run"}</span>
              </h3>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                {stage ? (
                  <>
                    Showing this step only.{" "}
                    <button type="button" style={{ ...linkBtn, fontSize: 12 }} onClick={onShowAll}>
                      Show the whole pipeline
                    </button>
                  </>
                ) : resolver ? (
                  `${resolver.label} is a problem fixer with no table of its own; showing every run. Pick a Problem below to narrow it.`
                ) : (
                  "Click a step in the diagram to see that step's own table."
                )}
                {windowText ? ` · ${windowText}` : ""}
              </div>
            </div>
          </div>

          <Filters p={p} setParam={setParam} filters={data?.filters} statuses={data?.statuses} onClear={clear} />

          {data?.not_recorded ? (
            <div style={{ margin: "12px 14px 0", padding: "10px 12px", border: `1px solid #FEDF89`, background: "#FFFAEB", borderRadius: 8, fontSize: 13, color: "#93370D" }}>
              <b>Not recorded yet.</b> {data.not_recorded} {data.fallback_note || ""}
            </div>
          ) : null}

          {data ? <Summary data={data} p={p} setParam={setParam} /> : null}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: `1px solid ${C.line}`, gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: C.ink }}>
              {loading ? "Loading…" : data ? `${Number(data.total || 0).toLocaleString()} ${data.unit || "row"}${data.total === 1 ? "" : "s"}` : ""}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: C.muted }}>
              <button type="button" style={buttonStyle} disabled={page <= 1 || loading} onClick={() => setParam({ rpage: page - 1 > 1 ? String(page - 1) : "" })}>
                Previous
              </button>
              Page {page} of {Number(pages).toLocaleString()}
              <button type="button" style={buttonStyle} disabled={page >= pages || loading} onClick={() => setParam({ rpage: String(page + 1) })}>
                Next
              </button>
            </div>
          </div>

          {result.error && !loading ? (
            <div style={{ padding: 16, color: RED, fontSize: 13 }}>{result.error}</div>
          ) : data && !(data.rows || []).length && !loading ? (
            <div style={{ padding: 16 }}>
              <EmptyState>Nothing matches these filters in this window.</EmptyState>
            </div>
          ) : data ? (
            <div style={{ opacity: loading ? 0.55 : 1, transition: "opacity 120ms" }}>
              <Table data={data} openKey={p.run} onOpen={(k) => setParam({ run: k })} />
            </div>
          ) : (
            <div style={{ padding: 16, color: C.muted, fontSize: 13 }}>Loading report…</div>
          )}
          <div style={{ padding: "8px 14px 12px", fontSize: 11, color: C.muted }}>
            A red edge on the left marks a row that needs attention (failed, or dishes still held). Click a row to see its whole journey.
          </div>
        </PageCard>

        {p.run ? (
          <RunPanel
            key={p.run}
            runKey={p.run}
            stagesById={stagesById}
            onClose={() => setParam({ run: "" })}
            onPickStage={onPickStage}
            onTrace={onTrace}
          />
        ) : null}
      </div>
      <style>{`@media (max-width: 980px) { .pipeline-report-layout { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </div>
  );
}
