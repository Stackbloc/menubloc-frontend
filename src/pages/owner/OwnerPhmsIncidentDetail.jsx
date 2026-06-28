import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerPhmsIncident,
  assignOwnerPhmsIncident,
  setOwnerPhmsIncidentStatus,
  verifyOwnerPhmsIncident,
  closeOwnerPhmsIncident,
  setOwnerPhmsDeploymentBlocker,
} from "../../lib/ownerApi.js";

function fmtTime(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch (_) { return iso; }
}

function fmtClock(iso) {
  if (!iso) return "??:??";
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (_) { return iso; }
}

export default function OwnerPhmsIncidentDetail() {
  const { incidentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [assignee, setAssignee] = useState("Unassigned");

  function load() {
    setLoading(true);
    setError(null);
    getOwnerPhmsIncident(incidentId)
      .then((d) => {
        setData(d);
        setAssignee(d.incident?.assignedEngineer || "Unassigned");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [incidentId]);

  async function runAction(fn, successLabel) {
    setActionMsg(null);
    setError(null);
    try {
      await fn();
      setActionMsg(successLabel);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const inc = data?.incident;
  const timeline = data?.timeline || [];
  const verifications = data?.verifications || [];

  const btnStyle = {
    fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8,
    border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: "pointer",
  };

  return (
    <OwnerLayout title={inc?.title || "Incident Detail"}>
      <div style={{ marginBottom: 16, fontSize: 13, color: OWNER_COLORS.muted }}>
        <Link to="/owner/phms/incidents" style={{ color: OWNER_COLORS.accent }}>← Incident Manager</Link>
      </div>

      {loading && <div style={{ color: OWNER_COLORS.muted }}>Loading…</div>}
      {error && <div style={{ color: "#991b1b", marginBottom: 12 }}>{error}</div>}
      {actionMsg && <div style={{ color: "#166534", marginBottom: 12, background: "#f0fdf4", padding: 10, borderRadius: 8 }}>{actionMsg}</div>}

      {inc && (
        <>
          <PageCard style={{ padding: "22px 24px", marginBottom: 20 }}>
            <SectionTitle title={inc.title} subtitle={`${inc.incidentId} · ${inc.phmsCheckId}`} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16, fontSize: 13 }}>
              <div><strong>Status</strong><br />{inc.status}</div>
              <div><strong>Priority</strong><br />{inc.priority}</div>
              <div><strong>Severity</strong><br />{inc.severity}</div>
              <div><strong>Department</strong><br />{inc.ownerDepartment}</div>
              <div><strong>Engineer</strong><br />{inc.assignedEngineer}</div>
              <div><strong>Deploy Blocker</strong><br />{inc.deploymentBlocker ? "YES" : "NO"}</div>
              <div><strong>Failures</strong><br />{inc.failureCount}</div>
              <div><strong>Regressions</strong><br />{inc.regressionCount}</div>
              {inc.recurring && <div style={{ color: "#9d174d" }}><strong>Recurring</strong><br />Yes</div>}
            </div>

            {inc.evidence?.actual && (
              <div style={{ marginBottom: 14, fontSize: 13, lineHeight: 1.5 }}>
                <strong>PHMS output:</strong> {inc.evidence.actual}
              </div>
            )}
            {inc.evidence?.recommendedAction && (
              <div style={{ marginBottom: 14, fontSize: 13 }}>
                <strong>Recommended action:</strong> {inc.evidence.recommendedAction}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}
                style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}` }}>
                {(data.assignees || ["Unassigned", "Cursor", "Codex", "Claude"]).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <button type="button" onClick={() => runAction(() => assignOwnerPhmsIncident(incidentId, { assignedEngineer: assignee }), "Assigned")}
                style={btnStyle}>Assign</button>
              <button type="button" onClick={() => runAction(() => setOwnerPhmsIncidentStatus(incidentId, "IN_PROGRESS"), "In progress")}
                style={btnStyle}>Start Work</button>
              <button type="button" onClick={() => runAction(() => setOwnerPhmsIncidentStatus(incidentId, "FIX_SUBMITTED"), "Fix submitted")}
                style={btnStyle}>Submit Fix</button>
              <button type="button" onClick={() => runAction(() => verifyOwnerPhmsIncident(incidentId), "Verification complete")}
                style={{ ...btnStyle, background: "#dbeafe" }}>Run Verification</button>
              <button type="button" onClick={() => runAction(() => closeOwnerPhmsIncident(incidentId), "Closed")}
                style={{ ...btnStyle, background: "#dcfce7" }}>Close (verified only)</button>
              <button type="button" onClick={() => runAction(() => setOwnerPhmsDeploymentBlocker(incidentId, !inc.deploymentBlocker), "Blocker updated")}
                style={btnStyle}>Toggle Deploy Blocker</button>
            </div>
          </PageCard>

          <PageCard style={{ padding: "20px 22px", marginBottom: 20 }}>
            <SectionTitle title="Timeline" subtitle="Append-only history" />
            {timeline.length === 0 ? (
              <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>No events yet.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                {timeline.map((ev, i) => (
                  <li key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 }}>
                    <strong>{fmtClock(ev.recordedAt)}</strong> — {ev.label || ev.message}
                    {ev.toStatus && <span style={{ color: OWNER_COLORS.muted }}> ({ev.fromStatus} → {ev.toStatus})</span>}
                  </li>
                ))}
              </ul>
            )}
          </PageCard>

          <PageCard style={{ padding: "20px 22px", marginBottom: 20 }}>
            <SectionTitle title="Verification History" />
            {verifications.length === 0 ? (
              <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>No verifications run yet.</div>
            ) : (
              verifications.map((v, i) => (
                <div key={i} style={{ fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                  {fmtTime(v.verifiedAt)} — {v.passed ? "PASS" : v.status} — {v.message}
                </div>
              ))
            )}
          </PageCard>

          {(data.relatedIncidents || []).length > 0 && (
            <PageCard style={{ padding: "20px 22px" }}>
              <SectionTitle title="Related Incidents" />
              {data.relatedIncidents.map((r) => (
                <div key={r.incidentId} style={{ fontSize: 13, marginBottom: 8 }}>
                  <Link to={`/owner/phms/incidents/${encodeURIComponent(r.incidentId)}`} style={{ color: OWNER_COLORS.accent }}>
                    {r.title}
                  </Link> — {r.status}
                </div>
              ))}
            </PageCard>
          )}

          <PageCard style={{ padding: "16px 18px", marginTop: 20, background: "#f9fafb" }}>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
              <strong>Future hooks (reserved):</strong> repair ticket, AI agent, GitHub, Jira, Slack, RCA, knowledge base
            </div>
          </PageCard>
        </>
      )}
    </OwnerLayout>
  );
}
