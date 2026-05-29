import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerMenuUploads } from "../../lib/ownerApi.js";

const FILTERS = [
  { key: "all",          label: "All" },
  { key: "pending",      label: "Pending" },
  { key: "failed",       label: "Failed" },
  { key: "needs_review", label: "Needs Review" },
  { key: "published",    label: "Published" },
  { key: "today",        label: "Today" },
  { key: "last7days",    label: "Last 7 Days" },
];

const STATUS_STYLE = {
  pending:      { background: "#e8f0fe", color: "#1a56db" },
  processing:   { background: "#fff7ed", color: "#9a3412" },
  parsed:       { background: "#ecfdf5", color: "#065f46" },
  failed:       { background: "#fef2f2", color: "#991b1b" },
  needs_review: { background: "#fffbeb", color: "#92400e" },
  published:    { background: "#f0fdf4", color: "#15803d" },
};

const COL_HEADS = ["Restaurant", "Email", "Type", "Status", "Items (inserted/parsed)", "Uploaded", "Location", ""];

export default function OwnerMenuUploads() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const activeFilter = searchParams.get("status") || "all";

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = {};
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
    }, 15000);

    getOwnerMenuUploads(params)
      .then((result) => { if (!settled) setData(result); })
      .catch(() => { if (!settled) setError("Upload data is temporarily unavailable."); })
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
    setSearchParams(key === "all" ? {} : { status: key });
  }

  return (
    <OwnerLayout title="Menu Uploads">
      {error ? <ErrorBanner message={error} /> : null}

      <SectionTitle
        title="Upload Activity"
        subtitle="Menu ingestion sessions submitted by restaurant owners."
      />

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
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

      {data?.total > 0 && (
        <div style={{ marginTop: 12, color: OWNER_COLORS.muted, fontSize: 13, textAlign: "right" }}>
          Showing {data.uploads?.length ?? 0} of {data.total} uploads
        </div>
      )}
    </OwnerLayout>
  );
}

function UploadRow({ upload }) {
  const badge = STATUS_STYLE[upload.display_status] || STATUS_STYLE.pending;
  const hasItems = upload.parsed_item_count > 0 || upload.inserted_item_count > 0;
  const location = upload.city && upload.state ? `${upload.city}, ${upload.state}` : null;

  return (
    <tr style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
      <td style={{ padding: "11px 14px" }}>
        <div style={{ fontWeight: 600 }}>{upload.restaurant_name || <em style={{ color: OWNER_COLORS.muted }}>Unknown</em>}</div>
        <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 2 }}>#{upload.restaurant_id}</div>
      </td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {upload.email}
      </td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted }}>
        {upload.upload_type || "pdf"}
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
        {upload.failure_reason && (
          <div style={{ fontSize: 11, color: "#991b1b", marginTop: 4, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {upload.failure_reason}
          </div>
        )}
      </td>
      <td style={{ padding: "11px 14px", textAlign: "center" }}>
        {hasItems ? (
          <span style={{ fontWeight: 600 }}>
            {upload.inserted_item_count} / {upload.parsed_item_count}
          </span>
        ) : (
          <span style={{ color: OWNER_COLORS.muted }}>—</span>
        )}
        {upload.human_review_items > 0 && (
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>
            {upload.human_review_items} to review
          </div>
        )}
      </td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted, fontSize: 12, whiteSpace: "nowrap" }}>
        {formatDate(upload.created_at)}
      </td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted, fontSize: 12 }}>
        {location || "—"}
      </td>
      <td style={{ padding: "11px 14px" }}>
        <Link
          to={`/owner/menu-uploads/${upload.id}`}
          style={{ color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 12, textDecoration: "none" }}
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
      {message}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}
