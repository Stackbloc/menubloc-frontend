import React, { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useParams, Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerMenuUpload,
  markOwnerMenuUploadReview,
  markOwnerMenuUploadReviewed,
  retryOwnerMenuUpload,
  archiveOwnerMenuUpload,
  OWNER_API_BASE,
} from "../../lib/ownerApi.js";

// ─── Retry / Recovery Panel ───────────────────────────────────────────────────
function RetryPanel({ upload, uploadId, onComplete }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState(upload.restaurant_name || "");
  const [city, setCity] = useState(upload.city || "");
  const [stateVal, setStateVal] = useState(upload.state || "");

  const canRetry = (upload.pages || []).some((p) => p.pdf_storage_url || p.image_url);
  const totalItems = (upload.pages || []).reduce((sum, p) => sum + (p.item_count || 0), 0);
  const needsIdentity = !upload.restaurant_name;

  async function handleRun(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Restaurant name is required."); return; }
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await retryOwnerMenuUpload(uploadId, {
        restaurant_name: name.trim(),
        city: city.trim(),
        state: stateVal.trim(),
      });
      setResult(res.report);
      if (onComplete) onComplete();
    } catch (err) {
      setError(err?.payload?.error || err?.message || "Retry failed. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={!canRetry}
        style={{
          padding: "10px 18px",
          borderRadius: 10,
          border: `1px solid ${!canRetry ? OWNER_COLORS.line : OWNER_COLORS.line}`,
          background: !canRetry ? "#f3f4f6" : "#fff",
          color: !canRetry ? "#9ca3af" : OWNER_COLORS.ink,
          fontWeight: 700,
          fontSize: 13,
          cursor: !canRetry ? "not-allowed" : "pointer",
          opacity: !canRetry ? 0.6 : 1,
        }}
      >
        Retry Processing
      </button>
    );
  }

  return (
    <div style={{
      marginTop: 12,
      padding: "18px 20px",
      borderRadius: 14,
      border: `1px solid ${OWNER_COLORS.line}`,
      background: "#fafafa",
      width: "100%",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: OWNER_COLORS.ink }}>Recovery Wizard</span>
        <button onClick={() => { setOpen(false); setResult(null); setError(""); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: OWNER_COLORS.muted, fontSize: 18 }}>×</button>
      </div>

      {result ? (
        <div>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: result.items_promoted > 0 ? "#f0fdf4" : "#fef2f2", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: result.items_promoted > 0 ? "#15803d" : "#991b1b" }}>
              {result.items_promoted > 0 ? "Recovery complete" : "Recovery incomplete"}
            </div>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <span>Pages scanned: <strong>{result.pages_read}</strong></span>
              <span>Items found: <strong>{result.items_found}</strong></span>
              <span>Items published: <strong style={{ color: "#15803d" }}>{result.items_promoted}</strong></span>
              <span>Items for review: <strong style={{ color: result.items_to_review > 0 ? "#92400e" : "inherit" }}>{result.items_to_review}</strong></span>
              {result.items_cleared > 0 && (
                <span style={{ gridColumn: "1/-1" }}>Old wrong items removed: <strong>{result.items_cleared}</strong></span>
              )}
            </div>
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b" }}>{result.errors[0]}</div>
            )}
          </div>
          <button
            onClick={() => { setResult(null); setOpen(false); if (onComplete) onComplete(); }}
            style={{ padding: "8px 16px", borderRadius: 8, background: OWNER_COLORS.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Refresh
          </button>
        </div>
      ) : (
        <form onSubmit={handleRun}>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 14 }}>
            {totalItems > 0
              ? `${totalItems} items found across ${(upload.pages || []).length} page(s) — ready for promotion.`
              : `${(upload.pages || []).length} page(s) scanned. Confirm restaurant identity to recover.`}
          </div>
          {needsIdentity && (
            <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 12, color: "#92400e" }}>
              Restaurant name could not be determined automatically. Please enter it below.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 4, textTransform: "uppercase" }}>
                Restaurant Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Restaurant name"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 4, textTransform: "uppercase" }}>
                City
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 4, textTransform: "uppercase" }}>
                State
              </label>
              <input
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                placeholder="CA"
                maxLength={2}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          </div>
          {error && (
            <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "#fef2f2", fontSize: 12, color: "#991b1b" }}>{error}</div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={running || !name.trim()}
              style={{
                padding: "10px 20px", borderRadius: 10, background: running || !name.trim() ? "#9ca3af" : "#1a56db",
                color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: running || !name.trim() ? "not-allowed" : "pointer",
              }}
            >
              {running ? "Recovering…" : "Run Recovery"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(""); }}
              style={{ padding: "10px 16px", borderRadius: 10, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 13, cursor: "pointer", color: OWNER_COLORS.muted }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const STATUS_STYLE = {
  pending:      { background: "#e8f0fe", color: "#1a56db" },
  processing:   { background: "#e8f0fe", color: "#1a56db" },
  failed:       { background: "#fef2f2", color: "#991b1b" },
  needs_review: { background: "#fffbeb", color: "#92400e" },
  published:    { background: "#f0fdf4", color: "#15803d" },
  stalled:      { background: "#fef2f2", color: "#7c3aed" },
};

function isStalled(upload) {
  if (!upload) return false;
  const s = upload.status || "";
  if (s !== "open" && s !== "queued" && s !== "processing") return false;
  if (!upload.created_at) return false;
  const ageMs = Date.now() - new Date(upload.created_at).getTime();
  return ageMs > 24 * 60 * 60 * 1000;
}

function resolveDisplayStatus(upload) {
  if (!upload) return "pending";
  if (isStalled(upload)) return "stalled";
  return upload.display_status || "pending";
}

function buildImageUrl(relativePath) {
  if (!relativePath) return null;
  if (/^https?:\/\//.test(relativePath)) return relativePath;
  return `${OWNER_API_BASE}${relativePath}`;
}

export default function OwnerMenuUploadDetail() {
  const { t } = useLanguage();
  const { uploadId } = useParams();
  const [upload, setUpload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [photoPage, setPhotoPage] = useState(0);
  const [expandedOcr, setExpandedOcr] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await getOwnerMenuUpload(uploadId);
      setUpload(d.upload);
    } catch {
      setError("Owner dashboard data is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => { load(); }, [load]);

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

  const displayStatus = resolveDisplayStatus(upload);
  const statusBadge = STATUS_STYLE[displayStatus] || STATUS_STYLE.pending;
  const pages = upload.pages || [];
  const hasPhotos = pages.some((p) => p.image_url);

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
        <span style={{ display: "inline-block", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, ...statusBadge }}>
          {displayStatus}
        </span>
        <span style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>
          ID: <code style={{ fontSize: 12 }}>{upload.id}</code>
        </span>
        {displayStatus === "needs_review" && upload.human_review_items > 0 && (
          <Link
            to={`/owner/menu-manager/uploads/${uploadId}/review-items`}
            style={{
              marginLeft: "auto",
              padding: "9px 18px",
              borderRadius: 10,
              background: "#92400e",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Review {upload.human_review_items} Items →
          </Link>
        )}
      </div>

      {/* Stalled warning */}
      {displayStatus === "stalled" && (
        <div style={{ marginBottom: 18, padding: "14px 18px", borderRadius: 12, background: "#f5f3ff", border: "1px solid #c4b5fd", color: "#5b21b6", fontSize: 13, fontWeight: 600 }}>
          ⚠️ This upload has been pending for over 24 hours with no activity. It may be stalled.
          Use "Retry Processing" to requeue, or "Archive" to dismiss.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Restaurant identity */}
        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Restaurant" />
          <DetailRow label="Name"     value={upload.restaurant_name || "Unknown"} />
          <DetailRow label="Location" value={upload.city && upload.state ? `${upload.city}, ${upload.state}` : "—"} />
        </PageCard>

        {/* Upload metadata */}
        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Upload Info" />
          <DetailRow label="Upload Type" value={upload.upload_type || "photo"} />
          <DetailRow label="Source File" value={upload.source_filename || "—"} />
          <DetailRow label="Submitted"   value={formatDateTime(upload.created_at)} />
          <DetailRow label="Finished"    value={upload.finished_at ? formatDateTime(upload.finished_at) : "—"} />
          <DetailRow label="Pages"       value={pages.length > 0 ? pages.length : (upload.page_count || "—")} />
        </PageCard>
      </div>

      {/* Parsing Results */}
      <PageCard style={{ padding: 22, marginBottom: 18 }}>
        <SectionTitle title="Parsing Results" subtitle="Item counts from OCR processing." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {[
            ["Total Extracted", upload.parsed_item_count],
            ["Published",       upload.complete_items],
            ["Partial",         upload.partial_items],
            ["Rejected",        upload.unresolved_items],
            ["Needs Review",    upload.human_review_items],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: 14, borderRadius: 12, background: label === "Needs Review" && value > 0 ? "#fffbeb" : "#f7f1ea", textAlign: "center", border: label === "Needs Review" && value > 0 ? "1px solid #fde68a" : "none" }}>
              <div style={{ fontSize: 11, color: OWNER_COLORS.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, color: label === "Needs Review" && value > 0 ? "#92400e" : "inherit" }}>
                {value ?? 0}
              </div>
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
              to={`/owner/menu-manager/uploads/${uploadId}/review-items`}
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
              Open Review Queue ({upload.human_review_items} items)
            </Link>
          </div>
        )}
      </PageCard>

      {/* Source Photos */}
      {hasPhotos && (
        <PageCard style={{ padding: 22, marginBottom: 18 }}>
          <SectionTitle
            title="Source Photos"
            subtitle={`${pages.filter((p) => p.image_url).length} page(s) uploaded`}
          />
          <SourcePhotoViewer pages={pages} photoPage={photoPage} setPhotoPage={setPhotoPage} />
        </PageCard>
      )}

      {/* OCR Output */}
      {pages.length > 0 && pages.some((p) => p.ocr_text || p.ocr_text_preview) && (
        <PageCard style={{ padding: 22, marginBottom: 18 }}>
          <SectionTitle title="OCR Output" subtitle="Raw text extracted from each page." />
          <div style={{ display: "grid", gap: 14 }}>
            {pages.map((p) => (
              <OcrPageBlock
                key={p.page_number}
                page={p}
                expanded={!!expandedOcr[p.page_number]}
                onToggle={() => setExpandedOcr((prev) => ({ ...prev, [p.page_number]: !prev[p.page_number] }))}
              />
            ))}
          </div>
        </PageCard>
      )}

      {/* Exception queue (Pipeline B) */}
      {(upload.exceptions || []).length > 0 && (
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
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: ex.status === "OPEN" ? "#fffbeb" : "#f0fdf4", color: ex.status === "OPEN" ? "#92400e" : "#15803d", whiteSpace: "nowrap" }}>
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
        <StatusActions
          upload={upload}
          displayStatus={displayStatus}
          uploadId={uploadId}
          doAction={doAction}
          onRetryComplete={load}
        />
      </PageCard>
    </OwnerLayout>
  );
}

function SourcePhotoViewer({ pages, photoPage, setPhotoPage }) {
  const photoPages = pages.filter((p) => p.image_url);
  if (!photoPages.length) return null;
  const current = photoPages[Math.min(photoPage, photoPages.length - 1)];
  const imageUrl = buildImageUrl(current.image_url);

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button
          onClick={() => setPhotoPage((p) => Math.max(0, p - 1))}
          disabled={photoPage === 0}
          style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: photoPage === 0 ? "#f3f4f6" : "#fff", cursor: photoPage === 0 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 13, color: OWNER_COLORS.muted, fontWeight: 600 }}>
          Photo {Math.min(photoPage + 1, photoPages.length)} of {photoPages.length}
          {current.page_role && current.page_role !== "menu_items" && (
            <span style={{ marginLeft: 8, fontSize: 11, color: OWNER_COLORS.muted }}>({current.page_role})</span>
          )}
        </span>
        <button
          onClick={() => setPhotoPage((p) => Math.min(photoPages.length - 1, p + 1))}
          disabled={photoPage >= photoPages.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: photoPage >= photoPages.length - 1 ? "#f3f4f6" : "#fff", cursor: photoPage >= photoPages.length - 1 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}
        >
          Next →
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {imageUrl && (
            <>
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", color: OWNER_COLORS.ink, fontWeight: 700, fontSize: 12, textDecoration: "none" }}
              >
                View Full Size
              </a>
              <a
                href={imageUrl}
                download
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", color: OWNER_COLORS.ink, fontWeight: 700, fontSize: 12, textDecoration: "none" }}
              >
                Download
              </a>
            </>
          )}
        </div>
      </div>

      {/* Photo */}
      {imageUrl ? (
        <div style={{ background: "#111", borderRadius: 12, overflow: "hidden", textAlign: "center", maxHeight: 600 }}>
          <img
            src={imageUrl}
            alt={`Menu page ${current.page_number}`}
            style={{ maxWidth: "100%", maxHeight: 600, objectFit: "contain" }}
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
            }}
          />
          <div
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              color: "#9ca3af",
              fontSize: 13,
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32 }}>📷</span>
            <span>Photo not available for this page</span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{current.image_url}</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: 32, background: "#f3f4f6", borderRadius: 12, textAlign: "center", color: OWNER_COLORS.muted, fontSize: 13 }}>
          No photo available for this page
        </div>
      )}

      {/* Thumbnail strip */}
      {photoPages.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", padding: "4px 0" }}>
          {photoPages.map((p, idx) => (
            <button
              key={p.page_number}
              onClick={() => setPhotoPage(idx)}
              style={{
                padding: 0,
                border: idx === photoPage ? `2px solid ${OWNER_COLORS.accent}` : `2px solid transparent`,
                borderRadius: 8,
                cursor: "pointer",
                background: "#f3f4f6",
                flexShrink: 0,
                overflow: "hidden",
                width: 60,
                height: 60,
              }}
            >
              {p.image_url ? (
                <img
                  src={buildImageUrl(p.image_url)}
                  alt={`Page ${p.page_number}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: OWNER_COLORS.muted }}>
                  p{p.page_number}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Per-page metadata */}
      {(current.item_count > 0 || current.ocr_quality_score != null) && (
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>
          {current.item_count > 0 && <span>{current.item_count} items extracted</span>}
          {current.ocr_quality_score != null && (
            <span>
              OCR quality:{" "}
              <strong style={{ color: current.ocr_quality_score >= 0.9 ? "#15803d" : current.ocr_quality_score >= 0.7 ? "#92400e" : "#991b1b" }}>
                {(current.ocr_quality_score * 100).toFixed(0)}%
              </strong>
            </span>
          )}
          {current.ocr_quality_flags?.length > 0 && (
            <span style={{ color: "#92400e" }}>flags: {current.ocr_quality_flags.join(", ")}</span>
          )}
        </div>
      )}
    </div>
  );
}

function OcrPageBlock({ page, expanded, onToggle }) {
  const text = page.ocr_text || page.ocr_text_preview || "";
  if (!text) return null;
  const preview = text.slice(0, 400);
  const isLong = text.length > 400;

  return (
    <div style={{ borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, overflow: "hidden" }}>
      <div
        style={{
          padding: "10px 14px",
          background: "#f8f7f4",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: isLong ? "pointer" : "default",
        }}
        onClick={isLong ? onToggle : undefined}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>Page {page.page_number}</span>
          {page.item_count > 0 && (
            <span style={{ fontSize: 11, color: OWNER_COLORS.muted }}>{page.item_count} items</span>
          )}
          {page.ocr_quality_score != null && (
            <span
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 5,
                fontWeight: 700,
                background: page.ocr_quality_score >= 0.9 ? "#f0fdf4" : "#fffbeb",
                color: page.ocr_quality_score >= 0.9 ? "#15803d" : "#92400e",
              }}
            >
              {(page.ocr_quality_score * 100).toFixed(0)}% OCR
            </span>
          )}
        </div>
        {isLong && (
          <span style={{ fontSize: 11, color: OWNER_COLORS.accent, fontWeight: 700 }}>
            {expanded ? "Collapse ▲" : "Expand ▼"}
          </span>
        )}
      </div>
      <pre
        style={{
          fontSize: 11,
          fontFamily: "monospace",
          background: "#f9f9f9",
          padding: 14,
          maxHeight: expanded ? "none" : 120,
          overflow: expanded ? "visible" : "hidden",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          margin: 0,
          color: OWNER_COLORS.ink,
          lineHeight: 1.5,
        }}
      >
        {expanded ? text : preview}
        {!expanded && isLong && <span style={{ color: OWNER_COLORS.muted }}> …</span>}
      </pre>
    </div>
  );
}

function StatusActions({ upload, displayStatus, uploadId, doAction, onRetryComplete }) {
  const actions = [];

  if (displayStatus === "needs_review" && upload.human_review_items > 0) {
    actions.push(
      <Link
        key="review"
        to={`/owner/menu-manager/uploads/${uploadId}/review-items`}
        style={{
          display: "inline-block",
          padding: "10px 18px",
          borderRadius: 10,
          background: OWNER_COLORS.accent,
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        Review Items ({upload.human_review_items})
      </Link>
    );
  }

  if (displayStatus === "published") {
    if (upload.restaurant_id) {
      actions.push(
        <Link
          key="view-menu"
          to={`/public/restaurants/${upload.restaurant_id}/menu`}
          style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#15803d", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
        >
          View Published Menu
        </Link>
      );
    }
    if (upload.status === "finished" && !upload.owner_review_flagged) {
      actions.push(
        <ActionButton key="flag" label="Flag for Review" onClick={() => doAction(markOwnerMenuUploadReview, "Flagged for review.")} />
      );
    }
  }

  if (displayStatus === "pending" || displayStatus === "processing") {
    actions.push(
      <ActionButton
        key="refresh"
        label="Refresh Status"
        onClick={async () => {
          const refreshed = await getOwnerMenuUpload(uploadId);
          // Parent state updated via doAction, but we can also just reload
          window.location.reload();
        }}
      />
    );
  }

  if (displayStatus === "stalled" || displayStatus === "failed" || upload.status === "rejected" || upload.status === "abandoned") {
    actions.push(
      <RetryPanel key="retry" upload={upload} uploadId={uploadId} onComplete={onRetryComplete} />
    );
  }

  if (upload.status !== "finished") {
    actions.push(
      <ActionButton key="archive" label="Archive" onClick={() => doAction(archiveOwnerMenuUpload, "Upload archived.")} />
    );
  }

  if (upload.status === "finished") {
    actions.push(
      <ActionButton
        key="mark-reviewed"
        label="Mark Reviewed"
        accent
        onClick={() => doAction(markOwnerMenuUploadReviewed, "Marked as reviewed.")}
      />
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {actions}
    </div>
  );
}

function BackLink() {
  return (
    <div style={{ marginBottom: 20 }}>
      <Link to="/owner/menu-uploads" style={{ color: OWNER_COLORS.muted, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
        ← Menu Uploads
      </Link>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 }}>
      <span style={{ color: OWNER_COLORS.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}

function ActionButton({ label, onClick, accent, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: "10px 18px",
        borderRadius: 10,
        border: `1px solid ${disabled ? OWNER_COLORS.line : accent ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
        background: disabled ? "#f3f4f6" : accent ? OWNER_COLORS.accent : "#fff",
        color: disabled ? "#9ca3af" : accent ? "#fff" : OWNER_COLORS.ink,
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
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
