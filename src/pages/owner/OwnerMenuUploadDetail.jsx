import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useParams, Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerMenuUpload,
  markOwnerMenuUploadReview,
  markOwnerMenuUploadReviewed,
  retryOwnerMenuUpload,
  archiveOwnerMenuUpload,
} from "../../lib/ownerApi.js";

const STATUS_STYLE = {
  pending:      { background: "#e8f0fe", color: "#1a56db" },
  failed:       { background: "#fef2f2", color: "#991b1b" },
  needs_review: { background: "#fffbeb", color: "#92400e" },
  published:    { background: "#f0fdf4", color: "#15803d" },
};

export default function OwnerMenuUploadDetail() {
  const { t } = useLanguage();
  const { uploadId } = useParams();
  const [upload, setUpload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getOwnerMenuUpload(uploadId)
      .then((d) => setUpload(d.upload))
      .catch(() => setError("Owner dashboard data is temporarily unavailable."))
      .finally(() => setLoading(false));
  }, [uploadId]);

  async function doAction(apiFn, successMsg) {
    setActionMsg("");
    setActionErr("");
    try {
      await apiFn(uploadId);
      setActionMsg(successMsg);
      const refreshed = await getOwnerMenuUpload(uploadId);
      setUpload(refreshed.upload);
    } catch {
      setActionErr("Action could not be completed. Please try again.");
    }
  }

  if (loading) {
    return (
      <OwnerLayout title="Upload Detail">
        <div style={{ padding: 32, color: OWNER_COLORS.muted }}>Loading…</div>
      </OwnerLayout>
    );
  }

  if (error || !upload) {
    return (
      <OwnerLayout title="Upload Detail">
        <BackLink />
        <ErrorBanner message={error || "Upload not found."} />
      </OwnerLayout>
    );
  }

  const statusBadge = STATUS_STYLE[upload.display_status] || STATUS_STYLE.pending;

  return (
    <OwnerLayout title="Upload Detail">
      <BackLink />

      {actionMsg && (
        <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#f0fdf4", color: "#15803d", fontWeight: 700 }}>
          {actionMsg}
        </div>
      )}
      {actionErr && <ErrorBanner message={actionErr} />}

      {/* Header row */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22 }}>
        <span
          style={{
            display: "inline-block",
            padding: "5px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            ...statusBadge,
          }}
        >
          {upload.display_status}
        </span>
        <span style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>
          ID: <code style={{ fontSize: 12 }}>{upload.id}</code>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Restaurant identity */}
        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Restaurant" />
          <DetailRow label="Name"        value={upload.restaurant_name || "Unknown"} />
          <DetailRow label="ID"          value={`#${upload.restaurant_id}`} />
          <DetailRow label="Email"       value={upload.email} />
          <DetailRow label="Location"    value={upload.city && upload.state ? `${upload.city}, ${upload.state}` : "—"} />
          {upload.menu_id && (
            <DetailRow
              label="Linked Menu"
              value={<Link to={`/menus/${upload.menu_id}`} style={{ color: OWNER_COLORS.accent }}>Menu #{upload.menu_id}</Link>}
            />
          )}
        </PageCard>

        {/* Upload metadata */}
        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Upload Info" />
          <DetailRow label="Upload Type"   value={upload.upload_type || "pdf"} />
          <DetailRow label="Source File"   value={upload.source_filename || "—"} />
          <DetailRow label="Submitted"     value={formatDateTime(upload.created_at)} />
          <DetailRow label="Finished"      value={upload.finished_at ? formatDateTime(upload.finished_at) : "—"} />
          <DetailRow label="Review Flag"   value={upload.owner_review_flagged ? "Flagged" : "—"} />
          <DetailRow label="Reviewed"      value={upload.owner_reviewed ? "Yes" : "No"} />
        </PageCard>
      </div>

      {/* Parsing results */}
      <PageCard style={{ padding: 22, marginBottom: 18 }}>
        <SectionTitle title="Parsing Results" subtitle="Item counts from the ingestion report." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {[
            ["Total Parsed",   upload.parsed_item_count],
            ["Complete",       upload.complete_items],
            ["Partial",        upload.partial_items],
            ["Unresolved",     upload.unresolved_items],
            ["Needs Review",   upload.human_review_items],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: 14, borderRadius: 12, background: "#f7f1ea", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: OWNER_COLORS.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{value ?? 0}</div>
            </div>
          ))}
        </div>
        {upload.failure_reason && (
          <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>
            <strong>Failure reason:</strong> {upload.failure_reason}
          </div>
        )}
        {upload.human_review_items > 0 && (
          <div style={{ marginTop: 16 }}>
            <Link
              to={`/owner/menu-uploads/${uploadId}/review-items`}
              style={{
                display: "inline-block",
                padding: "10px 20px",
                borderRadius: 10,
                background: "#92400e",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Review Items ({upload.human_review_items})
            </Link>
          </div>
        )}
      </PageCard>

      {/* Pages */}
      {upload.pages?.length > 0 && (
        <PageCard style={{ padding: 22, marginBottom: 18 }}>
          <SectionTitle title="Pages" subtitle={`${upload.pages.length} page(s) uploaded`} />
          <div style={{ display: "grid", gap: 10 }}>
            {upload.pages.map((p) => (
              <div
                key={p.page_number}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "#fff",
                  border: `1px solid ${OWNER_COLORS.line}`,
                  display: "grid",
                  gridTemplateColumns: "60px 1fr",
                  gap: 14,
                  alignItems: "start",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, paddingTop: 2 }}>Page {p.page_number}</div>
                <div>
                  <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 4 }}>
                    Role: {p.page_role} · Status: {p.status}
                    {p.item_count > 0 && ` · ${p.item_count} items`}
                  </div>
                  {p.ocr_text_preview && (
                    <pre
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        background: "#f8f8f8",
                        padding: 10,
                        borderRadius: 8,
                        maxHeight: 120,
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        color: OWNER_COLORS.ink,
                      }}
                    >
                      {p.ocr_text_preview}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PageCard>
      )}

      {/* Exception queue */}
      {upload.exceptions?.length > 0 && (
        <PageCard style={{ padding: 22, marginBottom: 18 }}>
          <SectionTitle
            title="Exception Queue"
            subtitle={`${upload.exceptions.length} item exception(s) linked to this upload`}
          />
          <div style={{ display: "grid", gap: 8 }}>
            {upload.exceptions.map((ex) => (
              <div
                key={ex.id}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: ex.status === "OPEN" ? "#fffbeb" : "#f9fafb",
                  border: `1px solid ${ex.status === "OPEN" ? "#fde68a" : OWNER_COLORS.line}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {ex.normalized_name || ex.raw_item_text || "Unknown item"}
                    </div>
                    <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2 }}>
                      {ex.failure_type}
                      {ex.confidence_score != null && ` · confidence: ${(ex.confidence_score * 100).toFixed(0)}%`}
                    </div>
                    {ex.ai_reason && (
                      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4, fontStyle: "italic" }}>
                        {ex.ai_reason}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: ex.status === "OPEN" ? "#fffbeb" : "#f0fdf4",
                      color: ex.status === "OPEN" ? "#92400e" : "#15803d",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ex.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </PageCard>
      )}

      {/* Actions */}
      <PageCard style={{ padding: 22 }}>
        <SectionTitle title="Actions" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {upload.status === "finished" && !upload.owner_review_flagged && (
            <ActionButton
              label="Flag for Review"
              onClick={() => doAction(markOwnerMenuUploadReview, "Flagged for review.")}
            />
          )}
          {(upload.status === "finished") && (
            <ActionButton
              label="Mark Reviewed"
              accent
              onClick={() => doAction(markOwnerMenuUploadReviewed, "Marked as reviewed. Exceptions dismissed.")}
            />
          )}
          {(upload.status === "rejected" || upload.status === "abandoned") && (
            <ActionButton
              label="Retry Processing"
              onClick={() => doAction(retryOwnerMenuUpload, "Upload reopened for retry.")}
            />
          )}
          {upload.status !== "finished" && (
            <ActionButton
              label="Archive"
              onClick={() => doAction(archiveOwnerMenuUpload, "Upload archived.")}
            />
          )}
          {upload.restaurant_id && (
            <Link
              to={`/restaurants/${upload.restaurant_id}`}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
                color: OWNER_COLORS.ink,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Open Restaurant
            </Link>
          )}
          {upload.menu_id && (
            <Link
              to={`/menus/${upload.menu_id}`}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
                color: OWNER_COLORS.ink,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Open Menu
            </Link>
          )}
        </div>
      </PageCard>
    </OwnerLayout>
  );
}

function BackLink() {
  return (
    <div style={{ marginBottom: 20 }}>
      <Link
        to="/owner/menu-uploads"
        style={{ color: OWNER_COLORS.muted, fontSize: 13, textDecoration: "none", fontWeight: 600 }}
      >
        ← Menu Uploads
      </Link>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderBottom: `1px solid ${OWNER_COLORS.line}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: OWNER_COLORS.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}

function ActionButton({ label, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        borderRadius: 10,
        border: `1px solid ${accent ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
        background: accent ? OWNER_COLORS.accent : "#fff",
        color: accent ? "#fff" : OWNER_COLORS.ink,
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
      {message}
    </div>
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
