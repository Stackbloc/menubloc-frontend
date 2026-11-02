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
  createAgentPlaceProfile,
  getAgentObjective,
  listAgentClusters,
  listAgentPublished,
  listAgentObjectives,
  objectiveAgentAction,
  prepareAgentPlace,
  proposeAgentCluster,
  publishAgentPlace,
  publishAllAgentRun,
  recheckAgentPlace,
  rejectAgentPlace,
  runAgentAgain,
  startAgentObjective,
  takeDownAgentPlace,
} from "../../lib/ownerApi.js";
import { restaurantMenuPath } from "../../lib/canonicalUrlCore.js";

/**
 * Owner → Bots → Agent.
 *   1. Where: a place name or address + a radius → the map finds it (no AI guesses the spot)
 *   2. Start: the agent finds the restaurants there, skips chains and marketplaces, reads
 *      menus from the restaurants' own sites and publishes them through Menubot. Places whose
 *      menu it can't find get a claimable profile. The owner reviews later.
 *   3. Review: anything Menubot wouldn't apply on its own stays as a draft (Publish / Reject).
 *   4. Published by the agent: every menu it put live, checked again (site links, review
 *      sentences, too few prices); Take down sends one back to draft.
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

// Run row buttons by run status (Andre 2026-11-02: Pause, Cancel and Run again right on the row).
const RUN_ROW_ACTIONS = [
  { action: "pause", label: "Pause", busy: "Pausing…", when: ["running", "queued"] },
  { action: "resume", label: "Resume", busy: "Resuming…", when: ["paused", "needs_info"], primary: true },
  { action: "run-again", label: "Run again", busy: "Starting…", when: ["completed", "failed", "cancelled"], primary: true },
  { action: "cancel", label: "Cancel", busy: "Cancelling…", when: ["running", "queued", "paused", "needs_info", "failed"] },
];

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

function clusterLine(c) {
  const where = [c.city, c.state].filter(Boolean).join(", ");
  const count = `${c.restaurants} restaurant${c.restaurants === 1 ? "" : "s"}`;
  const missing = c.without_menu ? `, ${c.without_menu} without a menu` : ", all have menus";
  return `${c.name}${where ? ` — ${where}` : ""} · ${count}${c.restaurants ? missing : ""}`;
}

function WhereStep({ onStarted }) {
  const [mode, setMode] = useState("cluster");
  const [clusters, setClusters] = useState(null);
  const [clusterId, setClusterId] = useState("");
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

  useEffect(() => {
    let alive = true;
    listAgentClusters()
      .then((out) => { if (alive) setClusters(out.clusters || []); })
      .catch(() => { if (alive) setClusters([]); });
    return () => { alive = false; };
  }, []);

  function pickMode(next) {
    setMode(next);
    setProposal(null);
    setQuestion("");
    setError("");
  }

  async function find(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setQuestion("");
    setProposal(null);
    try {
      const out = mode === "cluster"
        ? await proposeAgentCluster({ cluster_id: Number(clusterId) })
        : await proposeAgentCluster({ place, radius_m: radius, name: name || null });
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
      setClusterId("");
      onStarted(out.objective);
    } catch (err) {
      setError(err?.message || "Couldn't start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Step
      number={1}
      title="Where"
      subtitle={mode === "cluster"
        ? "Pick a Menuply cluster. The agent finds the menus for the restaurants already in it."
        : "A landmark, campus, street corner or address, and how far around it. The agent finds the restaurants there."}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {[["cluster", "A Menuply cluster"], ["spot", "A new spot on the map"]].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => pickMode(k)}
            style={{ ...smallButton, ...(mode === k ? { background: OWNER_COLORS.ink, color: "#fff", borderColor: OWNER_COLORS.ink } : {}) }}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "cluster" ? (
        <form onSubmit={find} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="agent-cluster">Cluster</label>
            {clusters === null ? (
              <div style={mutedStyle}>Loading clusters…</div>
            ) : clusters.length === 0 ? (
              <div style={mutedStyle}>No clusters found. Use a new spot on the map instead.</div>
            ) : (
              <select id="agent-cluster" style={{ ...inputStyle, width: "100%", maxWidth: 560 }} value={clusterId} onChange={(e) => { setClusterId(e.target.value); setProposal(null); setQuestion(""); }}>
                <option value="">Choose a cluster…</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id} disabled={!c.restaurants}>{clusterLine(c)}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <button type="submit" style={primaryButtonStyle({ busy, disabled: !clusterId })} disabled={busy || !clusterId}>
              {busy && !proposal ? "Looking…" : "Find menus"}
            </button>
          </div>
        </form>
      ) : (
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
      )}
      {question ? <div style={{ ...errorStyle, color: "#93370d" }}>{question}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}
      {proposal ? (
        <div style={{ marginTop: 16, padding: 14, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>{proposal.name}</div>
          {proposal.city || proposal.state ? (
            <div style={{ fontSize: 20, fontWeight: 800 }}>{[proposal.city, proposal.state].filter(Boolean).join(", ")}</div>
          ) : null}
          <div style={mutedStyle}>{proposal.found_on_map}</div>
          {proposal.cluster_id ? (
            <div style={mutedStyle}>
              {proposal.restaurants} restaurant{proposal.restaurants === 1 ? "" : "s"} in this cluster
              {proposal.without_menu != null ? `, ${proposal.without_menu} without a menu` : ""}. The agent looks only at these restaurants
              (no map search) and puts each menu it finds on that restaurant's profile.
            </div>
          ) : (
            <div style={mutedStyle}>
              {proposal.radius_m} m around {proposal.center_lat}, {proposal.center_lng}
              {" · "}
              <a href={`https://www.openstreetmap.org/?mlat=${proposal.center_lat}&mlon=${proposal.center_lng}#map=16/${proposal.center_lat}/${proposal.center_lng}`} target="_blank" rel="noreferrer">
                Check the spot
              </a>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={primaryButtonStyle({ busy })} disabled={busy} onClick={start}>
              Start
            </button>
            <button type="button" style={secondaryButtonStyle} disabled={busy} onClick={() => setProposal(null)}>
              {proposal.cluster_id ? "Not this one" : "Not this spot"}
            </button>
          </div>
          <div style={mutedStyle}>
            {proposal.cluster_id
              ? "It publishes the menus it can read. Places it can't find a menu for show Add info, where you can give it the menu's web address or paste the menu."
              : "It finds the restaurants, publishes the menus it can read, and makes claimable profiles for places whose menu it can't find. You can review everything later."}
          </div>
        </div>
      ) : null}
    </Step>
  );
}

/** Add info: a more precise web address or the pasted menu, then the agent checks the place again. */
function AddInfo({ place, onChanged }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("url");
  const [url, setUrl] = useState(place.owner_hint_url || "");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (place.rechecking) return <span style={mutedStyle}>Rechecking…</span>;
  if (!place.can_recheck) return null;
  if (!open) {
    return (
      <button type="button" style={smallButton} onClick={() => setOpen(true)}>
        Add info ▾
      </button>
    );
  }
  const value = kind === "url" ? url.trim() : text.trim();
  async function recheck() {
    setBusy(true);
    setError("");
    try {
      await recheckAgentPlace(place.id, kind === "url" ? { url: value } : { text: value });
      setOpen(false);
      setText("");
      await onChanged();
    } catch (err) {
      setError(err?.message || "Didn't work");
    } finally {
      setBusy(false);
    }
  }
  const tab = (k, label) => (
    <button
      type="button"
      onClick={() => setKind(k)}
      style={{ ...smallButton, padding: "3px 10px", fontSize: 12, ...(kind === k ? { background: OWNER_COLORS.ink, color: "#fff", border: "none" } : {}) }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "grid", gap: 6, minWidth: 260, padding: 10, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, background: "#fafbfd" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {tab("url", "Web address")}
        {tab("text", "Paste menu")}
      </div>
      {kind === "url" ? (
        <input
          style={{ ...inputStyle, fontSize: 13 }}
          placeholder="https://restaurant.com/menu"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value && !busy) recheck(); }}
        />
      ) : (
        <textarea
          style={{ ...inputStyle, fontSize: 13, minHeight: 110, fontFamily: "inherit" }}
          placeholder={"One dish per line with its price\nSpicy Miso Ramen $16.50"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          style={{ ...smallButton, background: OWNER_COLORS.accent, color: "#fff", border: "none", opacity: value ? 1 : 0.45 }}
          disabled={busy || !value}
          onClick={recheck}
        >
          {busy ? "Starting…" : "Recheck"}
        </button>
        <button type="button" style={smallButton} disabled={busy} onClick={() => { setOpen(false); setError(""); }}>
          Close
        </button>
      </div>
      {error ? <div style={{ ...errorStyle, marginTop: 0 }}>{error}</div> : null}
    </div>
  );
}

/** The check's verdict on a published menu: green, red with why, or nothing when unchecked. */
function MenuCheckPill({ check }) {
  if (!check) return null;
  return check.ok ? <Pill tone="green">Looks like a menu</Pill> : <Pill tone="red">Not a menu?</Pill>;
}

function menuCheckWhy(check) {
  if (!check || check.ok) return "";
  const ex = check.examples?.length ? ` (e.g. ${check.examples.slice(0, 3).map((e) => `"${String(e).slice(0, 30)}"`).join(", ")})` : "";
  return `${check.reason}${ex}`;
}

function TakeDownButton({ place, name, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function takeDown() {
    if (!window.confirm(`Take down the menu the agent published for ${name}? It goes back to draft and the place goes to Needs info, so you can add the right menu.`)) return;
    setBusy(true);
    setError("");
    try {
      await takeDownAgentPlace(place.id);
      await onDone();
    } catch (err) {
      setError(err?.message || "Didn't work");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" style={{ ...smallButton, color: "#b42318" }} disabled={busy} onClick={takeDown}>
        {busy ? "Taking down…" : "Take down"}
      </button>
      {error ? <div style={{ ...errorStyle, marginTop: 0 }}>{error}</div> : null}
    </>
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
    const addInfo = <AddInfo place={place} onChanged={onChanged} />;
    if (place.can_create_profile) {
      return (
        <div style={{ display: "grid", gap: 6, justifyItems: "start" }}>
          {addInfo}
          <button
            type="button"
            style={smallButton}
            disabled={Boolean(busy)}
            onClick={() => {
              if (window.confirm(`Create a claimable Menuply profile for ${place.name}? It has no menu yet; the restaurant can claim it and add one.`)) {
                run("profile", () => createAgentPlaceProfile(place.id));
              }
            }}
          >
            {busy === "profile" ? "Creating…" : "Create profile"}
          </button>
          {error ? <div style={{ ...errorStyle, marginTop: 0 }}>{error}</div> : null}
        </div>
      );
    }
    if (place.can_recheck || place.rechecking) {
      return (
        <div style={{ display: "grid", gap: 6, justifyItems: "start" }}>
          {addInfo}
          {place.profile_created && place.matched_restaurant_id ? <span style={mutedStyle}>Restaurant #{place.matched_restaurant_id}</span> : null}
        </div>
      );
    }
    if (place.status === "approved" && place.menubot_job_id && place.matched_restaurant_id) {
      return (
        <div style={{ display: "grid", gap: 6, justifyItems: "start" }}>
          <MenuCheckPill check={place.menu_check} />
          <span style={mutedStyle}>Restaurant #{place.matched_restaurant_id}</span>
          <TakeDownButton place={place} name={place.name} onDone={onChanged} />
        </div>
      );
    }
    return ["approved", "ready"].includes(place.status) && place.matched_restaurant_id ? (
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
  const [pollKey, setPollKey] = useState(0);

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
      if (status === "running" || status === "queued" || out?.objective?.publishing_now || (out?.places || []).some((p) => p.rechecking)) timer.current = setTimeout(tick, 5000);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer.current);
    };
  }, [load, pollKey]);

  // After a place action: refresh now, and keep refreshing while something is still going.
  const changed = useCallback(async () => {
    clearTimeout(timer.current);
    setPollKey((k) => k + 1);
  }, []);

  async function publishAll() {
    const drafts = review.length;
    const profiles = places.filter((p) => p.can_create_profile).length;
    const parts = [
      drafts ? `publish ${drafts} menu${drafts === 1 ? "" : "s"} through Menubot` : null,
      profiles ? `create ${profiles} claimable profile${profiles === 1 ? "" : "s"} for places with no menu yet` : null,
    ].filter(Boolean);
    if (!window.confirm(`Publish all: ${parts.join(" and ")}? Places already on Menuply are skipped, and any change too big for one click stays here for you.`)) return;
    setBusy("publish_all");
    try {
      await publishAllAgentRun(objectiveId);
      clearTimeout(timer.current);
      await load();
      const poll = async () => {
        const out = await load();
        if (out?.objective?.publishing_now) timer.current = setTimeout(poll, 5000);
      };
      timer.current = setTimeout(poll, 2000);
    } catch (err) {
      setError(err?.message || "Didn't work");
    } finally {
      setBusy("");
    }
  }

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
  const profileable = places.filter((p) => p.can_create_profile).length;

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
        {!live && (review.length || profileable) ? (
          <button
            type="button"
            style={{ ...smallButton, background: OWNER_COLORS.accent, color: "#fff", border: "none" }}
            disabled={Boolean(busy) || o.publishing_now}
            onClick={publishAll}
          >
            {o.publishing_now || busy === "publish_all" ? "Publishing…" : "Publish all"}
          </button>
        ) : null}
        <RunSummary report={o.seed?.report} />
        {live || o.publishing_now || places.some((p) => p.rechecking) ? <span style={mutedStyle}>· updates every few seconds</span> : null}
      </div>
      {o.status !== "cancelled" ? <RunProgress places={places} status={o.status} /> : null}
      {o.error_message && o.status === "failed" ? <div style={{ ...errorStyle, marginTop: 0, marginBottom: 12 }}>Stopped: {o.error_message}</div> : null}
      {o.error_message && !["completed", "failed"].includes(o.status) ? <div style={{ ...mutedStyle, marginBottom: 12 }}>Last stop: {o.error_message}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}
      {review.length ? (
        <div style={{ ...mutedStyle, marginBottom: 8 }}>
          {review.length} draft{review.length === 1 ? "" : "s"} waiting for you. Send each to Menubot to check the preview, then Publish, or use Publish all.
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
                  <td style={tdStyle}><Pill tone={p.profile_created ? "amber" : PLACE_TONES[p.status] || "grey"}>{p.profile_created ? "Profile, no menu" : PLACE_LABELS[p.status] || p.status}</Pill></td>
                  <td style={{ ...tdStyle, ...mutedStyle, maxWidth: 360 }}>
                    {p.notes || ""}
                    {p.menu_check && !p.menu_check.ok ? <div style={{ color: "#b42318", marginTop: 4 }}>Not a menu? {menuCheckWhy(p.menu_check)}</div> : null}
                  </td>
                  <td style={tdStyle}><PlaceActions place={p} onChanged={changed} /></td>
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

/** Every menu the agent published, the ones the check doesn't like first, each with Take down. */
function PublishedMenus({ refreshKey, onChanged }) {
  const [places, setPlaces] = useState(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let alive = true;
    listAgentPublished()
      .then((out) => {
        if (!alive) return;
        setPlaces(out.places || []);
        setError("");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || "Couldn't load published menus");
        setPlaces([]);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey, reloads]);

  const flagged = (places || []).filter((p) => p.check && !p.check.ok);
  const shown = showAll ? [...flagged, ...(places || []).filter((p) => !(p.check && !p.check.ok))] : flagged;

  return (
    <PageCard style={{ padding: 20 }}>
      <SectionTitle
        title="Published by the agent"
        subtitle={places === null ? "" : `${places.length} menu${places.length === 1 ? "" : "s"} live · ${flagged.length} flagged as not a menu`}
      />
      {error ? <div style={errorStyle}>{error}</div> : null}
      {places === null ? (
        <div style={mutedStyle}>Loading…</div>
      ) : !places.length ? (
        <EmptyState>The agent hasn't published any menus yet.</EmptyState>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button type="button" style={{ ...smallButton, ...(showAll ? {} : { background: "#eef2ff" }) }} onClick={() => setShowAll(false)}>
              Not a menu? ({flagged.length})
            </button>
            <button type="button" style={{ ...smallButton, ...(showAll ? { background: "#eef2ff" } : {}) }} onClick={() => setShowAll(true)}>
              All ({places.length})
            </button>
          </div>
          {shown.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Restaurant</th>
                    <th style={thStyle}>Check</th>
                    <th style={thStyle}>Why</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => {
                    const menuPath = restaurantMenuPath({ slug: p.slug, city: p.city, state: p.state, id: p.restaurant_id });
                    return (
                      <tr key={p.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700 }}>
                            {menuPath ? <a href={menuPath} target="_blank" rel="noreferrer" style={{ color: OWNER_COLORS.ink }}>{p.name}</a> : p.name}
                          </div>
                          <div style={{ ...mutedStyle, fontSize: 12 }}>
                            {p.run_name || `Run ${p.objective_id}`}
                            {p.published_at ? ` · ${new Date(p.published_at).toLocaleDateString()}` : ""}
                          </div>
                        </td>
                        <td style={tdStyle}>{p.check ? <MenuCheckPill check={p.check} /> : <Pill tone="grey">Not checked</Pill>}</td>
                        <td style={{ ...tdStyle, ...mutedStyle, maxWidth: 360 }}>
                          {p.check ? (p.check.ok ? `${p.check.real_dishes} dishes, ${p.check.priced} with prices` : menuCheckWhy(p.check)) : "Menubot kept no dish list for this one."}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <Link to={`/owner/menubot?job=${p.menubot_job_id}`} style={{ ...smallButton, textDecoration: "none", color: OWNER_COLORS.ink }}>Open in Menubot</Link>
                            <TakeDownButton
                              place={p}
                              name={p.name}
                              onDone={async () => {
                                setReloads((n) => n + 1);
                                await onChanged();
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={mutedStyle}>Every published menu passes the check.</div>
          )}
        </>
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

  const [rowBusy, setRowBusy] = useState("");
  const [detailKey, setDetailKey] = useState(0);
  async function rowAction(r, a) {
    const runName = r.name || `run ${r.id}`;
    if (a.action === "cancel" && !window.confirm(`Cancel the ${runName} run? Menus it already published stay.`)) return;
    if (a.action === "run-again" && !window.confirm(`Run ${runName} again? It checks every place that has no menu yet; places with a menu are left alone.`)) return;
    setRowBusy(`${r.id}:${a.action}`);
    setError("");
    try {
      if (a.action === "run-again") await runAgentAgain(r.id);
      else await objectiveAgentAction(r.id, a.action);
      await loadRuns();
      setSelected(r.id);
      setDetailKey((k) => k + 1); // the run panel shows the new status and keeps refreshing
    } catch (err) {
      setError(err?.message || "Didn't work");
    } finally {
      setRowBusy("");
    }
  }

  // Opening a run scrolls its panel into view (it sits below the list).
  const detailRef = useRef(null);
  useEffect(() => {
    if (selected && detailRef.current) detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected]);

  return (
    <OwnerLayout title="Agent">
      <div style={{ display: "grid", gap: 16 }}>
        <div style={mutedStyle}>
          Pick a Menuply cluster and the agent finds the menus for its restaurants, or pick a new spot and it finds the restaurants
          there too. It reads menus from the restaurants' own sites (never delivery marketplaces) and publishes them through
          Menubot; you can review everything later.{" "}
          <Link to="/owner/bots">All bots</Link>
        </div>

        <WhereStep
          onStarted={(objective) => {
            setSelected(objective.id);
            loadRuns();
          }}
        />

        <PageCard style={{ padding: 20 }}>
          <SectionTitle title="Runs" subtitle="Newest first. Click a run to see its places." />
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
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} onClick={() => setSelected(r.id)} style={{ cursor: "pointer", background: selected === r.id ? "#f5f8ff" : "transparent" }}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{r.name || `Run ${r.id}`}</td>
                      <td style={tdStyle}><Pill tone={RUN_TONES[r.status] || "grey"}>{RUN_LABELS[r.status] || r.status}</Pill></td>
                      <td style={tdStyle}><RunSummary report={r.seed?.report} /></td>
                      <td style={{ ...tdStyle, ...mutedStyle }}>{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {RUN_ROW_ACTIONS.filter((a) => a.when.includes(r.status)).map((a) => (
                            <button key={a.action} type="button" style={a.primary ? { ...smallButton, background: OWNER_COLORS.accent, color: "#fff", border: "none" } : smallButton} disabled={Boolean(rowBusy)} onClick={() => rowAction(r, a)}>
                              {rowBusy === `${r.id}:${a.action}` ? a.busy : a.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>

        {selected ? (
          <div ref={detailRef}>
            <RunDetail key={`${selected}-${detailKey}`} objectiveId={selected} onListChanged={loadRuns} />
          </div>
        ) : null}

        <PublishedMenus
          refreshKey={detailKey}
          onChanged={async () => {
            await loadRuns();
            setDetailKey((k) => k + 1);
          }}
        />
      </div>
    </OwnerLayout>
  );
}
