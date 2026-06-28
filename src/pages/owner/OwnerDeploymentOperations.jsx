import React, { useEffect, useState } from "react";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  freezeDeployments,
  getDeploymentOperationsSummary,
  resumeDeployments,
  runDeploymentSmoke,
  runDeploymentWatchdog,
} from "../../lib/ownerApi.js";

const GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 };
const button = {
  border: 0, borderRadius: 10, padding: "10px 13px", fontWeight: 750,
  cursor: "pointer", background: OWNER_COLORS.accent, color: "white",
};

function Status({ value }) {
  const good = ["PASS", "OPERATIONAL", "CERTIFIED"].includes(value);
  return (
    <span style={{
      display: "inline-block", borderRadius: 999, padding: "5px 9px", fontSize: 12, fontWeight: 800,
      color: good ? "#176c45" : "#992f25", background: good ? "#e4f5ec" : "#ffebe8",
    }}>
      {value || "UNKNOWN"}
    </span>
  );
}

function ValueCard({ label, value, detail }) {
  return (
    <PageCard style={{ padding: 17 }}>
      <div style={{ color: OWNER_COLORS.muted, fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 9, fontWeight: 800, fontSize: 18, overflowWrap: "anywhere" }}>{value || "Not recorded"}</div>
      {detail ? <div style={{ color: OWNER_COLORS.muted, marginTop: 6, fontSize: 12 }}>{detail}</div> : null}
    </PageCard>
  );
}

export default function OwnerDeploymentOperations() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setData(await getDeploymentOperationsSummary()); }
    catch (error) { setMessage(error.message); }
  };

  useEffect(() => { load(); }, []);

  const action = async (fn, success) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const deployment = data?.deployment || {};
  const business = data?.business || {};
  const platform = data?.platform || {};

  return (
    <OwnerLayout title="Deployment Operations">
      {message ? <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#fff7e8" }}>{message}</div> : null}

      <SectionTitle title="Platform Status" subtitle="Infrastructure reachability. Separate from PHMS and business capability." />
      <div style={GRID}>
        <ValueCard label="Platform" value={platform.status} detail="Frontend and backend reachability" />
        <ValueCard label="Frontend" value={platform.frontend?.status} detail={platform.frontend?.url} />
        <ValueCard label="Backend" value={platform.backend?.status} detail={platform.backend?.url} />
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionTitle title="Business Status" subtitle="Can customers and restaurant operators complete critical work?" />
        <PageCard style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong>{business.status || "UNKNOWN"}</strong>
            <Status value={business.status} />
          </div>
          <div style={{ ...GRID, marginTop: 14 }}>
            {Object.entries(business.capabilities || {}).map(([name, status]) => (
              <div key={name} style={{ padding: 12, background: "white", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}` }}>
                <div style={{ textTransform: "capitalize", fontWeight: 700 }}>{name.replaceAll("_", " ")}</div>
                <div style={{ marginTop: 7 }}><Status value={status} /></div>
              </div>
            ))}
          </div>
          {business.impacts?.length ? (
            <div style={{ marginTop: 14, color: "#992f25", fontWeight: 700 }}>{business.impacts.join(" · ")}</div>
          ) : null}
        </PageCard>
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionTitle title="Deployment" subtitle="Certified release identity across production and staging." />
        <div style={GRID}>
          <ValueCard label="Current Production" value={deployment.current_production?.deployment_number ? `Deployment ${deployment.current_production.deployment_number}` : null} detail={deployment.current_production?.certification} />
          <ValueCard label="Current Staging" value={deployment.current_staging?.deployment_number ? `Deployment ${deployment.current_staging.deployment_number}` : null} detail={deployment.current_staging?.certification} />
          <ValueCard label="Current BLUE" value={deployment.current_blue} />
          <ValueCard label="Current GREEN" value={deployment.current_green?.deployment_id} />
          <ValueCard label="Deployment Freeze" value={deployment.freeze?.frozen ? "FROZEN" : "ACTIVE"} detail={deployment.freeze?.latest?.reason} />
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionTitle title="Rollback" subtitle="Frontend is alias-based. Backend rollback is guided and confirmation-gated." />
        <PageCard style={{ padding: 18 }}>
          <div>{data?.rollback?.frontend}</div>
          <div style={{ marginTop: 8 }}>{data?.rollback?.backend}</div>
        </PageCard>
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionTitle title="Watchdog" subtitle="Latest independent monitoring and smoke evidence." />
        <PageCard style={{ padding: 18 }}>
          <Status value={data?.watchdog?.status} />
          <div style={{ marginTop: 10 }}>{data?.watchdog?.latest_results?.length || 0} recorded checks</div>
        </PageCard>
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionTitle title="Latest Incident" />
        <PageCard style={{ padding: 18 }}>
          {data?.latest_incident ? (
            <>
              <strong>{data.latest_incident.failure_type}</strong>
              <div style={{ marginTop: 7 }}>{data.latest_incident.action_taken}</div>
            </>
          ) : (
            <EmptyState>No recorded incident.</EmptyState>
          )}
        </PageCard>
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionTitle title="Release History" />
        <PageCard style={{ padding: 18 }}>
          {data?.release_history?.length ? (
            data.release_history.map((item) => (
              <div key={item.deployment_number} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                <span>Deployment {item.deployment_number} · {item.environment}</span>
                <Status value={item.certification || "NOT CERTIFIED"} />
              </div>
            ))
          ) : (
            <EmptyState>No deployment records.</EmptyState>
          )}
        </PageCard>
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionTitle title="Controlled Actions" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button disabled={busy} style={button} type="button" onClick={() => action(runDeploymentSmoke, "Smoke tests completed.")}>Run Smoke Tests</button>
          <button disabled={busy} style={button} type="button" onClick={() => action(runDeploymentWatchdog, "Watchdog completed.")}>Run Watchdog</button>
          <button disabled={busy} style={{ ...button, background: "#992f25" }} type="button" onClick={() => action(() => freezeDeployments("Owner control center freeze"), "Deployments frozen.")}>Freeze Deployments</button>
          <button disabled={busy} style={{ ...button, background: "white", color: OWNER_COLORS.accent, border: `1px solid ${OWNER_COLORS.line}` }} type="button" onClick={() => action(() => resumeDeployments("Owner control center resume"), "Deployments resumed.")}>Resume Deployments</button>
        </div>
      </div>
    </OwnerLayout>
  );
}
