import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  Pill,
  Step,
  errorStyle,
  inputStyle,
  labelStyle,
  mutedStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  tdStyle,
  thStyle,
} from "./OwnerFranchiseBot.jsx";
import {
  getAgentObjective,
  listAgentObjectives,
  objectiveAgentAction,
  prepareAgentPlace,
  proposeAgentCluster,
  publishAgentPlace,
  rejectAgentPlace,
  startAgentObjective,
} from "../../lib/ownerApi.js";

/**
 * Owner → Bots → Agent.
 *   1. Where: a place name or address + a radius → the map finds it (no AI guesses the spot)
 *   2. Start: the agent finds the restaurants there, skips chains and marketplaces, and drafts
 *      menus from the restaurants' own sites. Nothing goes live.
 *   3. Review: send a draft to Menubot to see its preview, then Publish (goes live through
 *      Menubot) or Reject.
 */

const RADII = [
  { label: "2 blocks", m: 200 },
  { label: "¼ mile", m: 402 },
  { label: "½ mile", m: 804 },
  { label: "1 mile", m: 1609 },
];
// The server accepts 50–5000 m, so "Other" takes miles between these.
const OTHER_MIN_MI = 0.05;
const OTHER_MAX_MI = 3.1;

const RUN_TONES = { running: "blue", queued: "blue", paused: "amber", needs_info: "amber", completed: "green", failed: "red", cancelled: "grey" };
const RUN_LABELS = { running: "Running", queued: "Starting", paused: "Paused", needs_info: "Needs info", completed: "Done", failed: "Stopped", cancelled: "Cancelled", awaiting_approval: "Waiting for you" };

const PLACE_TONES = { review: "blue", ready: "green", approved: "green", needs_info: "amber", failed: "red", rejected: "grey", duplicate: "grey", not_restaurant: "grey", discovered: "grey", researching: "blue" };
const PLACE_LABELS = { review: "Draft ready", ready: "On Menuply", approved: "Published", needs_info: "Needs info", failed: "Couldn't finish", rejected: "Rejected", duplicate: "Duplicate", not_restaurant: "Not a restaurant", discovered: "Waiting", researching: "Reading…" };

const smallButton = { ...secondaryButtonStyle, padding: "5px 12px", fontSize: 13 };

// Places still waiting or being read; duplicates and non-restaurants don't count toward the total.
const PLACE_PENDING = new Set(["discovered", "researching"]);
const PLACE_UNCOUNTED = new Set(["duplicate", "not_restaurant"]);

function RunProgress({ places, status }) {
  const counted = places.filter((p) => !PLACE_UNCOUNTED.has(p.status));
  const done = counted.filter((p) => !PLACE_PENDING.has(p.status)).length;
  const finished = status === "completed";
  const live = status === "running" || status === "queued";
  const pct = finished ? 100 : counted.length ? Math.round((done / counted.length) * 100) : 0;
  const label = finished
    ? `All ${counted.length} places checked`
    : counted.length
      ? `${done} of ${counted.length} places checked`
      : live ? "Finding places on the map…" : "No places found yet";
  return (
    <div style={{ marginBottom: 12 }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Run progress">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={mutedStyle}>{label}</span>
        <span style={{ ...mutedStyle, fontWeight: 600, color: OWNER_COLORS.ink }}>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: OWNER_COLORS.line, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: OWNER_COLORS.accent, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function RunSummary({ report }) {
  if (!report) return <span style={mutedStyle}>—</span>;
  return (
    <span style={mutedStyle}>
      {report.unique_places ?? 0} places · {report.menus_drafted_for_review ?? 0} drafts · {report.needs_info ?? 0} need info
    </span>
  );
}

function WhereStep({ onStarted }) {
  const [place, setPlace] = useState("");
  const [radius, setRadius] = useState(804);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherMiles, setOtherMiles] = useState("");
  const [name, setName] = useState("");
  const otherValue = Number(otherMiles);
  const otherValid = otherMiles.trim() !== "" && otherValue >= OTHER_MIN_MI && otherValue <= OTHER_MAX_MI;
  const radiusReady = !otherOpen || otherValid;
  const [proposal, setProposal] = useState(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function find(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setQuestion("");
    setProposal(null);
    try {
      const out = await proposeAgentCluster({ place, radius_m: radius, name: name || null });
      if (out.status === "proposed") setProposal(out.proposal);
      else setQuestion(out.question);
    } catch (err) {
      setError(err?.message || "Couldn't look that up");
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setBusy(true);
    setError("");
    try {
      const out = await startAgentObjective(proposal);
      setProposal(null);
      setPlace("");
      setName("");
      onStarted(out.objective);
    } catch (err) {
      setError(err?.message || "Couldn't start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Step number={1} title="Where" subtitle="A landmark, campus, street corner or address, and how far around it.">
      <form onSubmit={find} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
          <div>
            <label style={labelStyle} htmlFor="agent-place">Place</label>
            <input id="agent-place" style={{ ...inputStyle, width: "100%" }} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Dothan Civic Center, Dothan AL" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="agent-name">Cluster name (optional)</label>
            <input id="agent-name" style={{ ...inputStyle, width: "100%" }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Downtown Dothan" />
          </div>
        </div>
        <div>
          <div style={labelStyle}>How far around it</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {RADII.map((r) => (
              <button
                key={r.m}
                type="button"
                onClick={() => { setOtherOpen(false); setRadius(r.m); }}
                style={{ ...smallButton, borderColor: !otherOpen && radius === r.m ? OWNER_COLORS.accent : OWNER_COLORS.line, color: !otherOpen && radius === r.m ? OWNER_COLORS.accent : OWNER_COLORS.ink }}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOtherOpen(true)}
              style={{ ...smallButton, borderColor: otherOpen ? OWNER_COLORS.accent : OWNER_COLORS.line, color: otherOpen ? OWNER_COLORS.accent : OWNER_COLORS.ink }}
            >
              Other
            </button>
          </div>
          {otherOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input
                aria-label="Distance in miles"
                type="number"
                inputMode="decimal"
                min={OTHER_MIN_MI}
                max={OTHER_MAX_MI}
                step="0.1"
                autoFocus
                style={{ ...inputStyle, width: 90 }}
                value={otherMiles}
                onChange={(e) => {
                  setOtherMiles(e.target.value);
                  const mi = Number(e.target.value);
                  if (mi >= OTHER_MIN_MI && mi <= OTHER_MAX_MI) setRadius(Math.round(mi * 1609.34));
                }}
                placeholder="1.5"
              />
              <span style={mutedStyle}>miles (up to {OTHER_MAX_MI})</span>
            </div>
          )}
          {otherOpen && otherMiles.trim() !== "" && !otherValid && (
            <div style={{ ...mutedStyle, color: "#b42318", marginTop: 4 }}>Pick a distance between {OTHER_MIN_MI} and {OTHER_MAX_MI} miles.</div>
          )}
        </div>
        <div>
          <button type="submit" style={primaryButtonStyle({ busy, disabled: !place.trim() || !radiusReady })} disabled={busy || !place.trim() || !radiusReady}>
            {busy && !proposal ? "Looking…" : "Find on map"}
          </button>
        </div>
      </form>
      {question ? <div style={{ ...errorStyle, color: "#93370d" }}>{question}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}
      {proposal ? (
        <div style={{ marginTop: 16, padding: 14, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>{proposal.name}</div>
          <div style={mutedStyle}>{proposal.found_on_map}</div>
          <div style={mutedStyle}>
            {proposal.radius_m} m around {proposal.center_lat}, {proposal.center_lng}
            {" · "}
            <a href={`https://www.openstreetmap.org/?mlat=${proposal.center_lat}&mlon=${proposal.center_lng}#map=16/${proposal.center_lat}/${proposal.center_lng}`} target="_blank" rel="noreferrer">
              Check the spot
            </a>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={primaryButtonStyle({ busy })} disabled={busy} onClick={start}>
              Start
            </button>
            <button type="button" style={secondaryButtonStyle} disabled={busy} onClick={() => setProposal(null)}>
              Not this spot
            </button>
          </div>
          <div style={mutedStyle}>It finds the restaurants and drafts menus. Nothing goes live until you publish.</div>
        </div>
      ) : null}
    </Step>
  );
}

function PlaceActions({ place, onChanged }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function run(kind, fn) {
    setBusy(kind);
    setError("");
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(err?.message || "Didn't work");
    } finally {
      setBusy("");
    }
  }

  if (place.status !== "review") {
    return place.status === "approved" && place.matched_restaurant_id ? (
      <span style={mutedStyle}>Restaurant #{place.matched_restaurant_id}</span>
    ) : null;
  }
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {place.menubot_job_id ? (
          <Link to={`/owner/menubot?job=${place.menubot_job_id}`} style={{ ...smallButton, textDecoration: "none", color: OWNER_COLORS.ink }}>Open in Menubot</Link>
        ) : (
          <button type="button" style={smallButton} disabled={Boolean(busy)} onClick={() => run("prepare", () => prepareAgentPlace(place.id))}>
            {busy === "prepare" ? "Sending…" : "Send to Menubot"}
          </button>
        )}
        <button
          type="button"
          style={{ ...smallButton, background: OWNER_COLORS.accent, color: "#fff", border: "none", opacity: place.menubot_job_id ? 1 : 0.45 }}
          disabled={Boolean(busy) || !place.menubot_job_id}
          title={place.menubot_job_id ? "" : "Send it to Menubot first to see the preview"}
          onClick={() => {
            if (window.confirm(`Publish the menu for ${place.name}? It goes live through Menubot.`)) run("publish", () => publishAgentPlace(place.id));
          }}
        >
          {busy === "publish" ? "Publishing…" : "Publish"}
        </button>
        <button type="button" style={smallButton} disabled={Boolean(busy)} onClick={() => run("reject", () => rejectAgentPlace(place.id))}>
          Reject
        </button>
      </div>
      {error ? <div style={{ ...errorStyle, marginTop: 0 }}>{error}</div> : null}
    </div>
  );
}

function RunDetail({ objectiveId, onListChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const out = await getAgentObjective(objectiveId);
      setData(out);
      setError("");
      return out;
    } catch (err) {
      setError(err?.message || "Couldn't load this run");
      return null;
    }
  }, [objectiveId]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const out = await load();
      if (!alive) return;
      const status = out?.objective?.status;
      if (status === "running" || status === "queued") timer.current = setTimeout(tick, 5000);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer.current);
    };
  }, [load]);

  async function act(action) {
    setBusy(action);
    try {
      await objectiveAgentAction(objectiveId, action);
      clearTimeout(timer.current);
      const out = await load();
      if (out?.objective?.status === "running" || out?.objective?.status === "queued") timer.current = setTimeout(() => load(), 5000);
      onListChanged();
    } catch (err) {
      setError(err?.message || "Didn't work");
    } finally {
      setBusy("");
    }
  }

  if (!data) return error ? <div style={errorStyle}>{error}</div> : <div style={mutedStyle}>Loading…</div>;
  const o = data.objective;
  const live = o.status === "running" || o.status === "queued";
  const places = data.places || [];
  const review = places.filter((p) => p.status === "review");

  return (
    <PageCard style={{ padding: 20 }}>
      <SectionTitle
        title={o.name || `Run ${o.id}`}
        subtitle={o.objective_text}
        action={<Pill tone={RUN_TONES[o.status] || "grey"}>{RUN_LABELS[o.status] || o.status}</Pill>}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        {live ? (
          <button type="button" style={smallButton} disabled={Boolean(busy)} onClick={() => act("pause")}>Pause</button>
        ) : null}
        {["paused", "failed", "needs_info"].includes(o.status) ? (
          <button type="button" style={smallButton} disabled={Boolean(busy)} onClick={() => act("resume")}>Resume</button>
        ) : null}
        {!["completed", "cancelled"].includes(o.status) ? (
          <button
            type="button"
            style={smallButton}
            disabled={Boolean(busy)}
            onClick={() => {
              if (window.confirm("Cancel this run? Drafts it already made stay here.")) act("cancel");
            }}
          >
            Cancel
          </button>
        ) : null}
        <RunSummary report={o.seed?.report} />
        {live ? <span style={mutedStyle}>· updates every few seconds</span> : null}
      </div>
      {o.status !== "cancelled" ? <RunProgress places={places} status={o.status} /> : null}
      {o.error_message && o.status === "failed" ? <div style={{ ...errorStyle, marginTop: 0, marginBottom: 12 }}>Stopped: {o.error_message}</div> : null}
      {o.error_message && !["completed", "failed"].includes(o.status) ? <div style={{ ...mutedStyle, marginBottom: 12 }}>Last stop: {o.error_message}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}
      {review.length ? (
        <div style={{ ...mutedStyle, marginBottom: 8 }}>
          {review.length} draft{review.length === 1 ? "" : "s"} waiting for you. Send each to Menubot to check the preview, then Publish.
        </div>
      ) : null}
      {places.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Place</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>What happened</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {places.map((p) => (
                <tr key={p.id}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    {p.website_url ? (
                      <a href={p.website_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                        {p.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").slice(0, 40)}
                      </a>
                    ) : null}
                  </td>
                  <td style={tdStyle}><Pill tone={PLACE_TONES[p.status] || "grey"}>{PLACE_LABELS[p.status] || p.status}</Pill></td>
                  <td style={{ ...tdStyle, ...mutedStyle, maxWidth: 360 }}>{p.notes || ""}</td>
                  <td style={tdStyle}><PlaceActions place={p} onChanged={load} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={mutedStyle}>{live ? "Looking for places…" : "No places found."}</div>
      )}
    </PageCard>
  );
}

export default function OwnerAgent() {
  const [runs, setRuns] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const loadRuns = useCallback(async () => {
    try {
      const out = await listAgentObjectives();
      setRuns(out.objectives || []);
      setError("");
    } catch (err) {
      setError(err?.message || "Couldn't load runs");
      setRuns([]);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  return (
    <OwnerLayout title="Agent">
      <div style={{ display: "grid", gap: 16 }}>
        <div style={mutedStyle}>
          Pick a spot and the agent finds the restaurants around it, skips chains and delivery marketplaces, and drafts menus from
          the restaurants' own sites. Drafts wait here; they go live only when you publish them through Menubot.{" "}
          <Link to="/owner/bots">All bots</Link>
        </div>

        <WhereStep
          onStarted={(objective) => {
            setSelected(objective.id);
            loadRuns();
          }}
        />

        <PageCard style={{ padding: 20 }}>
          <SectionTitle title="Runs" subtitle="Newest first. Open one to review its drafts." />
          {error ? <div style={errorStyle}>{error}</div> : null}
          {runs === null ? (
            <div style={mutedStyle}>Loading…</div>
          ) : runs.length === 0 ? (
            <EmptyState>No runs yet. Find a spot above to start the first one.</EmptyState>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Cluster</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Result</th>
                    <th style={thStyle}>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} onClick={() => setSelected(r.id)} style={{ cursor: "pointer", background: selected === r.id ? "#f5f8ff" : "transparent" }}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{r.name || `Run ${r.id}`}</td>
                      <td style={tdStyle}><Pill tone={RUN_TONES[r.status] || "grey"}>{RUN_LABELS[r.status] || r.status}</Pill></td>
                      <td style={tdStyle}><RunSummary report={r.seed?.report} /></td>
                      <td style={{ ...tdStyle, ...mutedStyle }}>{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>

        {selected ? <RunDetail key={selected} objectiveId={selected} onListChanged={loadRuns} /> : null}
      </div>
    </OwnerLayout>
  );
}
