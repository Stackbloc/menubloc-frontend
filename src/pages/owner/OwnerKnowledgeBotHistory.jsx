import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getKnowledgeBotJob, listKnowledgeBotJobs, retryKnowledgeBotFailed } from "../../lib/ownerApi.js";

function statusColor(status) {
  if (status === "completed") return "#155724";
  if (status === "failed") return "#8b2e1a";
  if (status === "applying" || status === "researching") return "#856404";
  return OWNER_COLORS.muted;
}

function JobRow({ job, selected, onSelect }) {
  const stats = job.stats || {};
  return (
    <tr
      onClick={() => onSelect(job)}
      style={{
        cursor: "pointer",
        background: selected?.id === job.id ? OWNER_COLORS.accentSoft : "transparent",
      }}
    >
      <td style={{ padding: "10px 8px", fontSize: 13 }}>{new Date(job.created_at).toLocaleString()}</td>
      <td style={{ padding: "10px 8px", fontSize: 13, fontWeight: 700 }}>{job.target_name || "—"}</td>
      <td style={{ padding: "10px 8px", fontSize: 13 }}>{job.target_type}</td>
      <td style={{ padding: "10px 8px", fontSize: 13, color: statusColor(job.status), fontWeight: 700 }}>{job.status}</td>
      <td style={{ padding: "10px 8px", fontSize: 13 }}>{job.operator_email || job.operator_name || "—"}</td>
      <td style={{ padding: "10px 8px", fontSize: 13, textAlign: "right" }}>
        {(stats.records_created || 0) + (stats.records_updated || 0)}
      </td>
      <td style={{ padding: "10px 8px", fontSize: 13, textAlign: "right" }}>{stats.conflicts || job.preview_plan?.conflicts?.length || 0}</td>
      <td style={{ padding: "10px 8px", fontSize: 13, textAlign: "right" }}>{stats.errors || 0}</td>
    </tr>
  );
}

export default function OwnerKnowledgeBotHistory() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listKnowledgeBotJobs({ limit: 100 })
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setError("Could not load Knowledge Bot history."));
  }, []);

  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId) return;
    getKnowledgeBotJob(jobId)
      .then((data) => {
        setDetail(data);
        setSelected(data.job);
      })
      .catch(() => setError("Could not load job detail."));
  }, [searchParams]);

  async function openJob(job) {
    setSelected(job);
    setBusy(true);
    try {
      const data = await getKnowledgeBotJob(job.id);
      setDetail(data);
    } catch (err) {
      setError(err.message || "Could not load job.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRetry() {
    if (!selected?.id) return;
    setBusy(true);
    try {
      await retryKnowledgeBotFailed(selected.id);
      const data = await getKnowledgeBotJob(selected.id);
      setDetail(data);
    } catch (err) {
      setError(err.message || "Retry failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <OwnerLayout
      title="Knowledge Bot History"
      actions={
        <Link to="/owner/knowledge-bot" style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}>
          New job →
        </Link>
      }
    >
      {error ? (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#fdecea", color: "#8b2e1a", fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      <PageCard style={{ padding: "20px 22px", marginBottom: 16 }}>
        <SectionTitle title="Previous ingestion jobs" subtitle="Status, administrator, record counts, conflicts, and errors." />
        {!jobs.length ? (
          <EmptyState>No Knowledge Bot jobs yet.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${OWNER_COLORS.line}`, textAlign: "left" }}>
                  {["Date", "Target", "Type", "Status", "Admin", "Records", "Conflicts", "Errors"].map((h) => (
                    <th key={h} style={{ padding: "8px", fontSize: 11, color: OWNER_COLORS.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <JobRow key={job.id} job={job} selected={selected} onSelect={openJob} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      {detail ? (
        <PageCard style={{ padding: "20px 22px" }}>
          <SectionTitle
            title={detail.job?.target_name || "Job detail"}
            subtitle={`${detail.job?.status} · ${detail.job?.last_mode || "—"} mode`}
            action={
              detail.job?.status === "failed" || (detail.location_tasks || []).some((t) => t.status === "failed") ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRetry}
                  style={{
                    border: "none",
                    background: OWNER_COLORS.accent,
                    color: "#fff",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Retry failed locations
                </button>
              ) : null
            }
          />
          {(detail.job?.restaurant_id || detail.job?.apply_result?.restaurant_id) ? (
            <div style={{ marginBottom: 12, fontSize: 14 }}>
              Public restaurant id:{" "}
              <strong>{detail.job?.restaurant_id || detail.job?.apply_result?.restaurant_id}</strong>
              {" · "}
              <a
                href={`/restaurants/${detail.job?.restaurant_id || detail.job?.apply_result?.restaurant_id}`}
                style={{ color: OWNER_COLORS.accent, fontWeight: 600 }}
                target="_blank"
                rel="noreferrer"
              >
                Open public profile
              </a>
              {" · "}
              <Link
                to={`/owner/knowledge-bot?job=${detail.job?.id}`}
                style={{ color: OWNER_COLORS.accent, fontWeight: 600, textDecoration: "none" }}
              >
                Resume job
              </Link>
            </div>
          ) : null}
          <pre
            style={{
              margin: 0,
              padding: 14,
              borderRadius: 12,
              background: "#faf8f6",
              border: `1px solid ${OWNER_COLORS.line}`,
              fontSize: 12,
              overflow: "auto",
              maxHeight: 520,
            }}
          >
            {JSON.stringify(
              {
                job: detail.job,
                apply_result: detail.job?.apply_result,
                preview_plan: detail.job?.preview_plan,
                research_report: detail.job?.research_report,
                location_tasks: detail.location_tasks,
                audit: detail.audit?.slice(-40),
              },
              null,
              2
            )}
          </pre>
        </PageCard>
      ) : null}
    </OwnerLayout>
  );
}
