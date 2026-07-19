import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerMenuUploads } from "../../lib/ownerApi.js";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
  { key: "needs_review", label: "Needs Review" },
  { key: "published", label: "Published" },
  { key: "today", label: "Today" },
  { key: "last7days", label: "Last 7 Days" },
];

const STATUS_STYLE = {
  pending: { background: "#e8f0fe", color: "#1a56db" },
  processing: { background: "#fff7ed", color: "#9a3412" },
  parsed: { background: "#ecfdf5", color: "#065f46" },
  failed: { background: "#fef2f2", color: "#991b1b" },
  needs_review: { background: "#fffbeb", color: "#92400e" },
  published: { background: "#f0fdf4", color: "#15803d" },
  stalled: { background: "#f5f3ff", color: "#5b21b6" },
};

const COL_HEADS = [
  "Restaurant",
  "Source",
  "Status",
  "Items (inserted/parsed)",
  "Uploaded",
  "Location",
];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function sourceBadge(upload) {
  const pipeline = upload.pipeline_source;
  const type = String(upload.upload_type || "").toLowerCase();
  if (pipeline === "pipeline_a" || type === "photo" || type === "camera") {
    return { label: "Camera", background: "#eff6ff", color: "#1d4ed8" };
  }
  if (type === "menu_text" || type === "text") {
    return { label: "Text", background: "#f8fafc", color: "#475569" };
  }
  return { label: type ? type.toUpperCase() : "PDF", background: "#f1f5f9", color: "#334155" };
}

function ErrorBanner({ message }) {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 14px",
        borderRadius: 12,
        background: "#fff1ef",
        color: "#8b2e1a",
      }}
    >
      {message}
    </div>
  );
}

function UploadRow({ upload }) {
  const navigate = useNavigate();
  const badge = STATUS_STYLE[upload.display_status] || STATUS_STYLE.pending;
  const source = sourceBadge(upload);
  const hasItems = upload.parsed_item_count > 0 || upload.inserted_item_count > 0;
  const location = upload.city && upload.state ? `${upload.city}, ${upload.state}` : null;
  const detailPath = `/owner/menu-manager/uploads/${upload.id}`;
  const needsReview = Number(upload.human_review_items || 0) > 0;

  function openDetail() {
    navigate(detailPath);
  }

  return (
    <tr
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open upload detail for ${upload.restaurant_name || "restaurant"}`}
      data-testid={`upload-activity-row-${upload.id}`}
      style={{
        borderBottom: `1px solid ${OWNER_COLORS.line}`,
        cursor: "pointer",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = OWNER_COLORS.accentSoft || "#f0faf6";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "transparent";
      }}
    >
      <td style={{ padding: "11px 14px" }}>
        <div style={{ fontWeight: 600 }}>
          {upload.restaurant_name || <em style={{ color: OWNER_COLORS.muted }}>Unknown / unlocked</em>}
        </div>
        <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 2 }}>
          {upload.restaurant_id ? `#${upload.restaurant_id}` : "No public restaurant lock"}
          {upload.page_count > 0 ? ` · ${upload.page_count} page${upload.page_count === 1 ? "" : "s"}` : ""}
        </div>
      </td>
      <td style={{ padding: "11px 14px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "3px 9px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: source.background,
            color: source.color,
          }}
        >
          {source.label}
        </span>
      </td>
      <td style={{ padding: "11px 14px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "3px 9px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            ...badge,
          }}
        >
          {upload.display_status}
        </span>
        {upload.failure_reason ? (
          <div
            style={{
              fontSize: 11,
              color: "#991b1b",
              marginTop: 4,
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {upload.failure_reason}
          </div>
        ) : null}
      </td>
      <td style={{ padding: "11px 14px", textAlign: "center" }}>
        {hasItems ? (
          <span style={{ fontWeight: 600 }}>
            {upload.inserted_item_count} / {upload.parsed_item_count}
          </span>
        ) : (
          <span style={{ color: OWNER_COLORS.muted }}>—</span>
        )}
        {needsReview ? (
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>
            {upload.human_review_items} to review
          </div>
        ) : null}
      </td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted, fontSize: 12, whiteSpace: "nowrap" }}>
        {formatDate(upload.created_at)}
      </td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted, fontSize: 12 }}>
        {location || "—"}
      </td>
    </tr>
  );
}

/**
 * Global inbox of Pipeline A (camera) + Pipeline B (PDF) uploads.
 * Rendered inside the Menu Manager tab shell (no OwnerLayout wrapper).
 */
export default function OwnerMenuUploadActivity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const activeFilter = searchParams.get("status") || "all";

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = { limit: 50 };
    if (activeFilter === "today") {
      params.today = "1";
    } else if (activeFilter === "last7days") {
      params.last7days = "1";
    } else if (activeFilter !== "all") {
      params.status = activeFilter;
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setLoading(false);
        setError("The request took too long. Please refresh to try again.");
      }
    }, 20000);

    getOwnerMenuUploads(params)
      .then((result) => {
        if (!settled) setData(result);
      })
      .catch(() => {
        if (!settled) setError("Upload data is temporarily unavailable.");
      })
      .finally(() => {
        settled = true;
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      settled = true;
      clearTimeout(timeout);
    };
  }, [activeFilter]);

  function setFilter(key) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "activity");
      next.delete("restaurant");
      next.delete("create");
      next.delete("name");
      next.delete("city");
      next.delete("state");
      if (key === "all") next.delete("status");
      else next.set("status", key);
      return next;
    });
  }

  return (
    <div>
      {error ? <ErrorBanner message={error} /> : null}

      <SectionTitle
        title="Upload Activity"
        subtitle="Camera captures and PDF/text imports — click a row to open upload detail (source photos, holds, publish)."
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                background: active ? OWNER_COLORS.accentSoft : "#fff",
                color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                fontWeight: active ? 700 : 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <PageCard>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: OWNER_COLORS.muted, fontSize: 14 }}>
            Loading uploads…
          </div>
        ) : !data?.uploads?.length ? (
          <div style={{ padding: 24 }}>
            <EmptyState>No uploads found for this filter.</EmptyState>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${OWNER_COLORS.line}` }}>
                  {COL_HEADS.map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: OWNER_COLORS.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.uploads.map((u) => (
                  <UploadRow key={u.id} upload={u} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      {data?.total > 0 ? (
        <div style={{ marginTop: 12, color: OWNER_COLORS.muted, fontSize: 13, textAlign: "right" }}>
          Showing {data.uploads?.length ?? 0} of {data.total} uploads
        </div>
      ) : null}
    </div>
  );
}
