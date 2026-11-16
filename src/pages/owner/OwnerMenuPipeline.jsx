import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, useReactFlow, ReactFlowProvider } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import {
  getOwnerMenuPipelineRegistry,
  getOwnerMenuPipelineMetrics,
  searchOwnerMenuPipelineRestaurants,
  getOwnerMenuPipelineTrace,
} from "../../lib/ownerApi.js";

/**
 * Owner → Menu Pipeline (Pipeline Explorer).
 * Draws the menu pipeline from the backend registry (/api/owner/menu-pipeline/registry):
 * no stage, edge or bot is defined in this file. Read-only — it never changes menus or
 * starts jobs. Metrics come only from tables the pipeline already writes; stages
 * without instrumentation are labelled "Not instrumented".
 */

const NODE_W = 220;
const NODE_H = 84;
const RES_W = 200;

const RED = "#B42318";
const AMBER = "#B54708";
const BLUE = "#175CD3";
const PURPLE = "#6941C6";
const GRAY = "#98A2B3";

const KIND_LABEL = { process: "Process", gate: "Gate", queue: "Queue", human: "Owner step", terminal: "End", automatic: "Automatic", bot: "Bot" };
const EDGE_STYLE = {
  flow: { stroke: "#667085" },
  async: { stroke: "#667085", strokeDasharray: "6 4" },
  branch: { stroke: AMBER },
  hold: { stroke: RED, strokeDasharray: "4 3" },
  retry: { stroke: PURPLE, strokeDasharray: "2 4" },
  approve: { stroke: BLUE },
  problem: { stroke: RED, strokeDasharray: "1 4", strokeWidth: 1.5 },
};
const STEP_COLOR = { done: "#12B76A", failed: RED, waiting: AMBER, running: BLUE, skipped: GRAY, unknown: GRAY, superseded: GRAY };

const fmtNum = (n) => (n == null ? "–" : Number(n).toLocaleString());
function fmtDur(s) {
  if (s == null) return "–";
  if (s < 90) return `${s}s`;
  if (s < 5400) return `${(s / 60).toFixed(1)} min`;
  if (s < 172800) return `${(s / 3600).toFixed(1)} h`;
  return `${(s / 86400).toFixed(1)} d`;
}
const when = (v) => (v ? new Date(v).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

function metricLine(m) {
  if (!m) return null;
  if (!m.instrumented) return { text: "Not instrumented", muted: true };
  if (m.available === false) return { text: "Metrics unavailable", warn: true };
  if (m.events) {
    const parts = Object.entries(m.events).map(([k, v]) => `${fmtNum(v)} ${k.replace(/_/g, " ")}`);
    return { text: parts.join(" · ") };
  }
  if (m.unresolved_held != null) return { text: `${fmtNum(m.unresolved_held)} rows held, unresolved`, warn: m.unresolved_held > 0 };
  const parts = [];
  if (m.processed != null) parts.push(`${fmtNum(m.processed)} in`);
  if (m.failed) parts.push(`${fmtNum(m.failed)} failed`);
  if (m.queued) parts.push(`${fmtNum(m.queued)} ${m.queued_label || "queued"}`);
  if (m.active) parts.push(`${fmtNum(m.active)} active`);
  if (m.drafts_total != null && m.processed == null) parts.push(`${fmtNum(m.succeeded)} published · ${fmtNum(m.drafts_total)} drafts`);
  return { text: parts.join(" · ") || "No activity in window", warn: Boolean(m.failed) };
}

function StageNode({ data }) {
  const { node, metric, traceStatus, selected, dim } = data;
  const line = metricLine(metric);
  const isResolver = node.type === "resolver";
  const ring = traceStatus ? STEP_COLOR[traceStatus] : selected ? OWNER_COLORS.ink : OWNER_COLORS.line;
  return (
    <div
      style={{
        width: isResolver ? RES_W : NODE_W,
        minHeight: NODE_H - 8,
        boxSizing: "border-box",
        background: isResolver ? "#FFF6F5" : "#fff",
        border: `${traceStatus || selected ? 2 : 1}px ${isResolver ? "dashed" : "solid"} ${isResolver ? (selected ? OWNER_COLORS.ink : "#F4B9B3") : ring}`,
        borderRadius: node.kind === "gate" ? 4 : 10,
        padding: "8px 10px",
        opacity: dim ? 0.35 : 1,
        fontSize: 12,
        color: OWNER_COLORS.ink,
        cursor: "pointer",
      }}
      title={node.summary}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "baseline" }}>
        <strong style={{ fontSize: 13, lineHeight: 1.2 }}>{node.label}</strong>
        {!node.implementation_ok ? (
          <span style={{ color: RED, fontWeight: 700 }} title="Implementation reference not found in code">!</span>
        ) : null}
      </div>
      <div style={{ color: OWNER_COLORS.muted, fontSize: 11, marginTop: 2 }}>{KIND_LABEL[node.kind] || node.kind}</div>
      {line ? (
        <div style={{ marginTop: 4, fontSize: 11, color: line.muted ? GRAY : line.warn ? RED : OWNER_COLORS.ink, fontStyle: line.muted ? "italic" : "normal" }}>
          {line.text}
        </div>
      ) : null}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { stage: StageNode };

function layoutGraph(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 28, ranksep: 56, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: n.type === "resolver" ? RES_W : NODE_W, height: NODE_H });
  // Retry loops are drawn but do not shape the layout (they point backwards).
  for (const e of edges) if (e.kind !== "retry") g.setEdge(e.source, e.target);
  dagre.layout(g);
  const pos = {};
  for (const n of nodes) {
    const p = g.node(n.id);
    pos[n.id] = { x: p.x - (n.type === "resolver" ? RES_W : NODE_W) / 2, y: p.y - NODE_H / 2 };
  }
  return pos;
}

function Square({ children, color = OWNER_COLORS.ink, bg = "#F2F4F7" }) {
  return (
    <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4, background: bg, color, fontSize: 11, fontWeight: 600, marginRight: 4 }}>
      {children}
    </span>
  );
}

function KV({ k, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13, padding: "3px 0" }}>
      <span style={{ color: OWNER_COLORS.muted }}>{k}</span>
      <span>{children}</span>
    </div>
  );
}

function List({ items }) {
  if (!items?.length) return <span style={{ color: GRAY }}>–</span>;
  return (
    <ul style={{ margin: 0, paddingLeft: 16 }}>
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

function MetricsBlock({ m }) {
  if (!m) return null;
  if (!m.instrumented) {
    return (
      <div style={{ color: GRAY, fontStyle: "italic", fontSize: 13 }}>
        Not instrumented. {m.gap}
      </div>
    );
  }
  if (m.available === false) return <div style={{ color: RED, fontSize: 13 }}>Could not read {m.source}: {m.error}</div>;
  return (
    <div>
      <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginBottom: 4 }}>Source: {m.source}</div>
      {m.processed != null ? <KV k="Processed">{fmtNum(m.processed)}</KV> : null}
      {m.succeeded != null ? <KV k="Succeeded">{fmtNum(m.succeeded)}</KV> : null}
      {m.failed != null ? <KV k="Failed">{fmtNum(m.failed)}</KV> : null}
      {m.retried != null ? <KV k="Retried">{`${fmtNum(m.retried)} jobs · ${fmtNum(m.attempts)} attempts`}</KV> : null}
      {m.avg_duration_s !== undefined ? <KV k="Avg duration">{`${fmtDur(m.avg_duration_s)}${m.avg_duration_label ? ` (${m.avg_duration_label})` : ""}`}</KV> : null}
      {m.queued != null ? <KV k={m.queued_label ? "Waiting" : "Queued"}>{fmtNum(m.queued)}</KV> : null}
      {m.active != null ? <KV k="Active">{fmtNum(m.active)}</KV> : null}
      {m.oldest_queued_at ? <KV k="Oldest queued">{when(m.oldest_queued_at)}</KV> : null}
      {m.drafts_total != null ? <KV k="Drafts (all)">{fmtNum(m.drafts_total)}</KV> : null}
      {m.items_total != null ? <KV k="Items">{`${fmtNum(m.items_total)} written · ${fmtNum(m.items_held)} held`}</KV> : null}
      {m.unresolved_held != null ? <KV k="Held, unresolved">{fmtNum(m.unresolved_held)}</KV> : null}
      {m.events ? (
        <KV k="Events">
          <List items={Object.entries(m.events).map(([k, v]) => `${k}: ${fmtNum(v)}`)} />
        </KV>
      ) : null}
      {m.counts ? (
        <KV k="By status">
          {Object.entries(m.counts).map(([k, v]) => (
            <Square key={k}>{`${k} ${fmtNum(v)}`}</Square>
          ))}
        </KV>
      ) : null}
      {m.notes?.length ? <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>{m.notes.join(" ")}</div> : null}
      {m.recent_failures?.length ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Recent failures</div>
          {m.recent_failures.map((f) => (
            <div key={f.id} style={{ fontSize: 12, borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "4px 0" }}>
              <div style={{ color: OWNER_COLORS.muted }}>
                {when(f.updated_at)} · {f.target_name || f.capture_session_id || f.id}
                {f.attempts != null ? ` · ${f.attempts} attempt${f.attempts === 1 ? "" : "s"}` : ""}
              </div>
              <div style={{ color: RED, wordBreak: "break-word" }}>{f.last_error || f.error_message || "No error text stored"}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DetailPanel({ node, metric, problems, resolversById, traceSteps, onClose }) {
  if (!node) {
    return (
      <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>
        Click a stage to see what it does, the code behind it, its inputs and outputs, and recent activity.
      </div>
    );
  }
  const originating = problems.filter((p) => p.origin === node.id);
  const routedHere = problems.filter((p) => p.resolvers.includes(node.id));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{node.label}</div>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            {KIND_LABEL[node.kind] || node.kind}
            {node.lane ? ` · ${node.lane}` : ""} · <code>{node.id}</code>
          </div>
        </div>
        <button type="button" onClick={onClose} style={btn}>
          Close
        </button>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.45 }}>{node.summary}</p>
      {node.route?.length ? <KV k="Triggered by"><List items={node.route} /></KV> : null}
      {node.inputs ? <KV k="Inputs"><List items={node.inputs} /></KV> : null}
      {node.outputs ? <KV k="Outputs"><List items={node.outputs} /></KV> : null}
      {node.revalidation ? <KV k="Revalidation">{node.revalidation}</KV> : null}
      {node.notes?.length ? <KV k="Notes"><List items={node.notes} /></KV> : null}

      <h4 style={h4}>Implementation</h4>
      {node.implementation.map((r, i) => (
        <div key={i} style={{ fontSize: 12, fontFamily: "ui-monospace, Menlo, monospace", color: r.ok ? OWNER_COLORS.ink : RED, padding: "2px 0" }}>
          {r.ok ? "✓" : "✗"} {r.file}
          {r.symbol ? ` → ${r.symbol}()` : ""}
          {r.text ? ` ⟨${r.text}⟩` : ""}
          {!r.ok ? <div style={{ fontFamily: "inherit" }}>{r.detail}</div> : null}
        </div>
      ))}

      <h4 style={h4}>Activity</h4>
      <MetricsBlock m={metric} />

      {originating.length ? (
        <>
          <h4 style={h4}>Problems that start here</h4>
          {originating.map((p) => (
            <div key={p.id} style={{ fontSize: 13, padding: "3px 0" }}>
              <strong>{p.label}</strong> → {p.resolvers.map((r) => resolversById[r]?.label || r).join(", ")}
              {p.unresolved != null ? <span style={{ color: p.unresolved ? RED : OWNER_COLORS.muted }}> · {fmtNum(p.unresolved)} unresolved</span> : null}
              {p.instrumented === false ? <span style={{ color: GRAY }}> · not instrumented</span> : null}
            </div>
          ))}
        </>
      ) : null}
      {routedHere.length ? (
        <>
          <h4 style={h4}>Problems routed here</h4>
          <List items={routedHere.map((p) => `${p.label}${p.unresolved != null ? ` (${fmtNum(p.unresolved)} unresolved)` : ""}`)} />
        </>
      ) : null}

      {traceSteps?.length ? (
        <>
          <h4 style={h4}>This restaurant at this stage</h4>
          {traceSteps.map((s, i) => (
            <div key={i} style={{ fontSize: 12, padding: "3px 0", borderTop: `1px solid ${OWNER_COLORS.line}` }}>
              <Square color="#fff" bg={STEP_COLOR[s.status] || GRAY}>{s.status}</Square>
              {s.runLabel} {s.at ? `· ${when(s.at)}` : ""}
              {s.detail ? <div style={{ color: OWNER_COLORS.muted }}>{s.detail}</div> : null}
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}

const btn = {
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  color: OWNER_COLORS.ink,
};
const h4 = { margin: "14px 0 6px", fontSize: 13 };

function Graph({ graph, metrics, showProblems, traceByStage, selectedId, onSelect, focusIds }) {
  const { fitView } = useReactFlow();
  const problems = metrics?.problems || graph.problem_classes;

  const { rfNodes, rfEdges } = useMemo(() => {
    const baseNodes = [...graph.nodes];
    const baseEdges = graph.edges.map((e) => ({ ...e }));
    if (showProblems) {
      const used = new Set(problems.flatMap((p) => p.resolvers));
      for (const r of graph.resolvers) if (used.has(r.id)) baseNodes.push(r);
      for (const p of problems) {
        for (const rid of p.resolvers) {
          const count = p.unresolved ?? p.occurrences;
          baseEdges.push({
            id: `p_${p.id}_${rid}`,
            source: p.origin,
            target: rid,
            kind: "problem",
            label: `${p.label}${count != null ? ` · ${fmtNum(count)}` : p.instrumented === false ? " · not instrumented" : ""}`,
          });
        }
      }
    }
    const pos = layoutGraph(baseNodes, baseEdges);
    const stageMetrics = { ...(metrics?.stages || {}), ...(metrics?.resolvers || {}) };
    const nodes = baseNodes.map((n) => ({
      id: n.id,
      type: "stage",
      position: pos[n.id],
      data: {
        node: n,
        metric: stageMetrics[n.id],
        traceStatus: traceByStage?.[n.id]?.status || null,
        selected: selectedId === n.id,
        dim: focusIds ? !focusIds.has(n.id) : false,
      },
    }));
    const edges = baseEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      labelStyle: { fontSize: 10, fill: e.kind === "problem" || e.kind === "hold" ? RED : "#475467" },
      labelBgStyle: { fill: "#fff" },
      style: { strokeWidth: 1.25, ...(EDGE_STYLE[e.kind] || EDGE_STYLE.flow), opacity: focusIds && !(focusIds.has(e.source) && focusIds.has(e.target)) ? 0.2 : 1 },
      animated: e.kind === "retry",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: (EDGE_STYLE[e.kind] || EDGE_STYLE.flow).stroke },
    }));
    return { rfNodes: nodes, rfEdges: edges };
  }, [graph, metrics, showProblems, traceByStage, selectedId, focusIds, problems]);

  const firstFit = useRef(false);
  useEffect(() => {
    // Refit when the shape changes (problem overlay on/off); not on every metrics refresh.
    const t = setTimeout(() => fitView({ padding: 0.08, duration: firstFit.current ? 250 : 0 }), 30);
    firstFit.current = true;
    return () => clearTimeout(t);
  }, [showProblems, graph, fitView]);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodeClick={(_e, n) => onSelect(n.id)}
      onPaneClick={() => onSelect(null)}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      minZoom={0.15}
      maxZoom={2}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} color="#EEF0F3" />
      <Controls showInteractive={false} position="top-left" />
    </ReactFlow>
  );
}

function Legend() {
  const item = (kind, label) => (
    <span key={kind} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 14, fontSize: 12, color: OWNER_COLORS.muted }}>
      <svg width="28" height="8" aria-hidden="true">
        <line x1="0" y1="4" x2="28" y2="4" stroke={EDGE_STYLE[kind].stroke} strokeWidth="2" strokeDasharray={EDGE_STYLE[kind].strokeDasharray} />
      </svg>
      {label}
    </span>
  );
  return (
    <div style={{ marginTop: 8 }}>
      {item("flow", "flow")}
      {item("async", "after commit / queued")}
      {item("branch", "branch")}
      {item("hold", "held for review")}
      {item("approve", "owner approval")}
      {item("retry", "retry loop")}
      {item("problem", "problem → resolver")}
    </div>
  );
}

function ProblemsTable({ metrics, resolversById, stagesById, onPick }) {
  if (!metrics) return null;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
            <th style={th}>Problem</th>
            <th style={th}>Starts at</th>
            <th style={th}>Routed to</th>
            <th style={th}>Unresolved</th>
            <th style={th}>Revalidation after fix</th>
          </tr>
        </thead>
        <tbody>
          {metrics.problems.map((p) => (
            <tr key={p.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" }}>
              <td style={td}>
                <strong>{p.label}</strong>
                {p.codes?.length ? (
                  <div style={{ marginTop: 3 }}>
                    {p.codes.slice(0, 6).map((c) => (
                      <Square key={c.code}>{`${c.code} ${fmtNum(c.count)}`}</Square>
                    ))}
                  </div>
                ) : null}
                {p.examples?.length ? <div style={{ color: OWNER_COLORS.muted, fontSize: 12, marginTop: 3 }}>e.g. {p.examples[0].last_error || p.examples[0].error_message}</div> : null}
              </td>
              <td style={td}>
                <button type="button" style={linkBtn} onClick={() => onPick(p.origin)}>
                  {stagesById[p.origin]?.label || p.origin}
                </button>
              </td>
              <td style={td}>
                {p.resolvers.map((r) => (
                  <div key={r}>
                    <button type="button" style={linkBtn} onClick={() => onPick(r, true)}>
                      {resolversById[r]?.label || r}
                    </button>
                    <span style={{ color: OWNER_COLORS.muted, fontSize: 11 }}> {KIND_LABEL[resolversById[r]?.kind] || ""}</span>
                  </div>
                ))}
              </td>
              <td style={{ ...td, color: p.unresolved ? RED : OWNER_COLORS.ink }}>
                {p.instrumented === false ? (
                  <span style={{ color: GRAY, fontStyle: "italic" }}>Not instrumented</span>
                ) : p.available === false ? (
                  <span style={{ color: RED }}>Unavailable</span>
                ) : p.unresolved != null ? (
                  `${fmtNum(p.unresolved)}${p.window ? ` (last ${metrics.window_days} d)` : ""}`
                ) : (
                  `${fmtNum(p.occurrences)} seen (last ${metrics.window_days} d)`
                )}
              </td>
              <td style={{ ...td, fontSize: 12, color: OWNER_COLORS.muted }}>
                {p.resolvers.map((r) => resolversById[r]?.revalidation).filter(Boolean).join(" / ") || "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {metrics.unclassified_hold_codes?.length ? (
        <div style={{ marginTop: 10, fontSize: 12, color: AMBER }}>
          Hold codes with no registered problem class:{" "}
          {metrics.unclassified_hold_codes.map((c) => (
            <Square key={c.code} color={AMBER} bg="#FFFAEB">{`${c.code} ${fmtNum(c.count)}`}</Square>
          ))}
        </div>
      ) : null}
      <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
        Resources used per fix (time, OCR / Places calls) are not recorded today; attempts are recorded only for capture jobs.
      </div>
    </div>
  );
}
const th = { padding: "6px 8px", fontWeight: 600, fontSize: 12 };
const td = { padding: "8px" };
const linkBtn = { background: "none", border: 0, padding: 0, color: BLUE, cursor: "pointer", fontSize: 13, textAlign: "left" };

function TracePanel({ trace, selectedRun, onSelectRun }) {
  if (!trace) return null;
  const { restaurant, menus, runs } = trace;
  const menuRow = (m) => (
    <div key={m.id} style={{ fontSize: 13, padding: "2px 0" }}>
      #{m.id} {m.name || "(no name)"} <span style={{ color: OWNER_COLORS.muted }}>· {m.status}{m.is_public === false ? " · not public" : ""} · updated {when(m.updated_at)}</span>
    </div>
  );
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>
        {restaurant.name} <span style={{ color: OWNER_COLORS.muted, fontWeight: 400 }}>#{restaurant.id} · {[restaurant.city, restaurant.state].filter(Boolean).join(", ")}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Live now (published)</div>
          {menus.live.length ? menus.live.map(menuRow) : <div style={{ fontSize: 13, color: GRAY }}>No published menu</div>}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: AMBER }}>Pending update (draft, not live)</div>
          {menus.pending_updates.length ? menus.pending_updates.map(menuRow) : <div style={{ fontSize: 13, color: GRAY }}>None</div>}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, margin: "14px 0 4px" }}>Processing runs ({runs.length})</div>
      {!runs.length ? <div style={{ fontSize: 13, color: GRAY }}>No upload sessions, capture sessions or Menubot jobs recorded for this restaurant.</div> : null}
      {runs.map((r) => {
        const open = selectedRun === r.id;
        return (
          <div key={r.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "6px 0" }}>
            <button type="button" onClick={() => onSelectRun(open ? null : r.id)} style={{ ...linkBtn, color: OWNER_COLORS.ink, width: "100%" }}>
              <strong>{r.label}</strong> <span style={{ color: OWNER_COLORS.muted }}>· {r.status} · {when(r.created_at)}</span>
              {r.attempts > 1 ? <span style={{ color: PURPLE }}> · {r.attempts} attempts</span> : null}
              {r.review && r.review.open + r.review.edited > 0 ? <span style={{ color: AMBER }}> · {r.review.open + r.review.edited} awaiting review</span> : null}
              <span style={{ float: "right", color: BLUE }}>{open ? "Hide" : "Show on graph"}</span>
            </button>
            {open ? (
              <div style={{ marginTop: 6 }}>
                {r.steps.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "2px 0 2px 8px", borderLeft: `3px solid ${STEP_COLOR[s.status] || GRAY}`, marginBottom: 3 }}>
                    <strong>{s.stage}</strong> · {s.status}
                    {s.at ? ` · ${when(s.at)}` : ""}
                    {s.detail ? <span style={{ color: OWNER_COLORS.muted }}> — {s.detail}</span> : null}
                  </div>
                ))}
                {r.hold_codes?.length ? (
                  <div style={{ marginTop: 4 }}>
                    {r.hold_codes.map((c) => (
                      <Square key={c.code}>{`${c.code} ${fmtNum(c.count)}`}</Square>
                    ))}
                  </div>
                ) : null}
                <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>id {r.id}</div>
              </div>
            ) : null}
          </div>
        );
      })}
      <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>Not recorded by the pipeline today: {trace.not_recorded.join("; ")}.</div>
      {Object.keys(trace.errors || {}).length ? (
        <div style={{ marginTop: 6, fontSize: 12, color: RED }}>Some sources could not be read: {Object.keys(trace.errors).join(", ")}</div>
      ) : null}
    </div>
  );
}

function RestaurantPicker({ onPick }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState("");
  useEffect(() => {
    // Filling the box with the picked name must not reopen the list.
    if (q.trim().length < 2 || q === picked) {
      setResults([]);
      return undefined;
    }
    const t = setTimeout(() => {
      searchOwnerMenuPipelineRestaurants(q.trim())
        .then((r) => setResults(r.restaurants || []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, picked]);
  return (
    <div style={{ position: "relative", maxWidth: 420 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Restaurant name or id"
        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8, fontSize: 14 }}
      />
      {results.length ? (
        <div style={{ position: "absolute", zIndex: 5, top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8, marginTop: 4, maxHeight: 260, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onPick(r.id);
                setResults([]);
                setPicked(r.name);
                setQ(r.name);
              }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, padding: "8px 10px", cursor: "pointer", fontSize: 13 }}
            >
              {r.name} <span style={{ color: OWNER_COLORS.muted }}>#{r.id} · {[r.city, r.state].filter(Boolean).join(", ")}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OwnerMenuPipelineInner() {
  const [graph, setGraph] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");
  const [metricsError, setMetricsError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showProblems, setShowProblems] = useState(false);
  const [trace, setTrace] = useState(null);
  const [traceError, setTraceError] = useState("");
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    getOwnerMenuPipelineRegistry()
      .then(setGraph)
      .catch((e) => setError(e?.message || "Could not load the pipeline registry"));
  }, []);

  const loadMetrics = useCallback(() => {
    setMetricsError("");
    return getOwnerMenuPipelineMetrics(days)
      .then(setMetrics)
      .catch((e) => setMetricsError(e?.message || "Could not load metrics"));
  }, [days]);

  useEffect(() => {
    loadMetrics();
    const t = setInterval(loadMetrics, 60000);
    return () => clearInterval(t);
  }, [loadMetrics]);

  const pickRestaurant = useCallback((id) => {
    setTraceError("");
    setSelectedRun(null);
    getOwnerMenuPipelineTrace(id)
      .then((t) => {
        setTrace(t);
        if (t.runs?.[0]) setSelectedRun(t.runs[0].id);
      })
      .catch((e) => setTraceError(e?.message || "Could not load this restaurant"));
  }, []);

  const stagesById = useMemo(() => Object.fromEntries((graph?.nodes || []).map((n) => [n.id, n])), [graph]);
  const resolversById = useMemo(() => Object.fromEntries((graph?.resolvers || []).map((n) => [n.id, n])), [graph]);

  const run = trace?.runs?.find((r) => r.id === selectedRun) || null;
  const traceByStage = useMemo(() => {
    if (!run) return null;
    const out = {};
    for (const s of run.steps) {
      const prev = out[s.stage];
      // A failure or wait at a stage outranks an earlier "done" at the same stage.
      if (!prev || ["failed", "waiting", "running"].includes(s.status)) out[s.stage] = s;
    }
    return out;
  }, [run]);
  const focusIds = useMemo(() => (traceByStage ? new Set(Object.keys(traceByStage)) : null), [traceByStage]);

  const selectedNode = stagesById[selectedId] || resolversById[selectedId] || null;
  const selectedMetric = metrics ? metrics.stages?.[selectedId] || metrics.resolvers?.[selectedId] : null;
  const problems = metrics?.problems || graph?.problem_classes || [];
  const selectedTraceSteps = run ? run.steps.filter((s) => s.stage === selectedId).map((s) => ({ ...s, runLabel: run.label })) : null;

  const v = graph?.verification;

  return (
    <OwnerLayout title="Menu Pipeline">
      <div style={{ display: "grid", gap: 16 }}>
        <PageCard style={{ padding: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: OWNER_COLORS.muted, maxWidth: 720, lineHeight: 1.45 }}>
              How a menu gets from a source to a live Menuply menu, drawn from the backend's pipeline registry
              {graph?.commit ? ` (build ${graph.commit.slice(0, 8)})` : ""}. Read-only: nothing on this page changes menus or starts jobs.
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
                Window{" "}
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ ...btn, padding: "5px 8px" }}>
                  {[1, 7, 30, 90].map((d) => (
                    <option key={d} value={d}>
                      {d === 1 ? "24 hours" : `${d} days`}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" style={btn} onClick={loadMetrics}>
                Refresh
              </button>
              <button type="button" style={{ ...btn, borderColor: showProblems ? RED : OWNER_COLORS.line, color: showProblems ? RED : OWNER_COLORS.ink }} onClick={() => setShowProblems((x) => !x)}>
                {showProblems ? "Hide problem routing" : "Show problem routing"}
              </button>
            </div>
          </div>
          {v ? (
            <div style={{ marginTop: 10, fontSize: 13, color: v.ok ? OWNER_COLORS.ink : RED }}>
              {v.ok
                ? `Registry matches the code: ${graph.nodes.length} stages, ${graph.resolvers.length} resolvers, ${graph.problem_classes.length} problem classes checked; every file that writes a pipeline table is registered.`
                : `Registry and code disagree (${v.problems.length}):`}
              {!v.ok ? <List items={v.problems.map((p) => `${p.type}: ${p.id} — ${p.detail}`)} /> : null}
            </div>
          ) : null}
          {error ? <div style={{ marginTop: 8, color: RED }}>{error}</div> : null}
          {metricsError ? <div style={{ marginTop: 8, color: RED }}>{metricsError}</div> : null}
        </PageCard>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 16, alignItems: "start" }} className="owner-menu-pipeline-grid">
          <PageCard style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 760 }}>{graph ? <Graph graph={graph} metrics={metrics} showProblems={showProblems} traceByStage={traceByStage} selectedId={selectedId} onSelect={setSelectedId} focusIds={focusIds} /> : <div style={{ padding: 20, color: OWNER_COLORS.muted }}>Loading pipeline…</div>}</div>
            <div style={{ padding: "0 14px 12px" }}>
              <Legend />
              {run ? (
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 6 }}>
                  Highlighting {run.label} ({when(run.created_at)}).{" "}
                  <button type="button" style={linkBtn} onClick={() => setSelectedRun(null)}>
                    Clear
                  </button>
                </div>
              ) : null}
            </div>
          </PageCard>
          <PageCard style={{ padding: 16, maxHeight: 760, overflowY: "auto" }}>
            <DetailPanel
              node={selectedNode}
              metric={selectedMetric}
              problems={problems}
              resolversById={resolversById}
              traceSteps={selectedTraceSteps}
              onClose={() => setSelectedId(null)}
            />
          </PageCard>
        </div>

        <PageCard style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>Problems: where they start, who resolves them</h3>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 10 }}>
            Highest unresolved first. Review-queue counts are the full open backlog; job failures are for the selected window.
          </div>
          {metrics ? (
            <ProblemsTable
              metrics={metrics}
              resolversById={resolversById}
              stagesById={stagesById}
              onPick={(id, isResolver) => {
                if (isResolver) setShowProblems(true);
                setSelectedId(id);
              }}
            />
          ) : (
            <div style={{ color: OWNER_COLORS.muted }}>Loading…</div>
          )}
        </PageCard>

        <PageCard style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Trace a restaurant's menu</h3>
          <RestaurantPicker onPick={pickRestaurant} />
          {traceError ? <div style={{ marginTop: 8, color: RED }}>{traceError}</div> : null}
          <div style={{ marginTop: 12 }}>
            <TracePanel trace={trace} selectedRun={selectedRun} onSelectRun={setSelectedRun} />
          </div>
        </PageCard>
      </div>
      <style>{`@media (max-width: 1100px){.owner-menu-pipeline-grid{grid-template-columns:minmax(0,1fr)!important}}`}</style>
    </OwnerLayout>
  );
}

export default function OwnerMenuPipeline() {
  return (
    <ReactFlowProvider>
      <OwnerMenuPipelineInner />
    </ReactFlowProvider>
  );
}
