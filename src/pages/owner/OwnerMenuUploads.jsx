import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerMenuUploads,
  searchOwnerRestaurantsForUpload,
  submitOwnerMenuTextIngest,
  submitOwnerMenuFilePdf,
} from "../../lib/ownerApi.js";

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

  function onUploadSuccess() {
    // Refresh the list after a successful upload
    setLoading(true);
    setError("");
    getOwnerMenuUploads({})
      .then((result) => setData(result))
      .catch(() => setError("Upload data is temporarily unavailable."))
      .finally(() => setLoading(false));
  }

  return (
    <OwnerLayout title="Menu Uploads">
      {error ? <ErrorBanner message={error} /> : null}

      {/* New upload form */}
      <NewUploadSection onSuccess={onUploadSuccess} />

      <SectionTitle
        title="Upload Activity"
        subtitle="All restaurant menu imports (PDF, camera, multi-page) — filter by pending, needs review, or published."
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

// ─── New Upload Section ────────────────────────────────────────────────────────

function NewUploadSection({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("text"); // "text" | "file"
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantResults, setRestaurantResults] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuText, setMenuText] = useState("");
  const [file, setFile] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }
  const fileRef = useRef(null);
  const searchTimeout = useRef(null);

  function handleQueryChange(e) {
    const q = e.target.value;
    setRestaurantQuery(q);
    setSelectedRestaurant(null);

    clearTimeout(searchTimeout.current);
    if (q.length < 2) { setRestaurantResults([]); return; }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchOwnerRestaurantsForUpload(q);
        setRestaurantResults(data.restaurants || []);
      } catch {
        setRestaurantResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function selectRestaurant(r) {
    setSelectedRestaurant(r);
    setRestaurantQuery(r.name + (r.city ? ` — ${r.city}, ${r.state}` : ""));
    setRestaurantResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);

    if (!selectedRestaurant) {
      setResult({ ok: false, message: "Please select a restaurant from the search results." });
      return;
    }

    if (mode === "text") {
      if (!menuText.trim()) {
        setResult({ ok: false, message: "Please paste the menu text before submitting." });
        return;
      }
      setSubmitting(true);
      try {
        const res = await submitOwnerMenuTextIngest(selectedRestaurant.id, menuText);
        setResult({
          ok: true,
          message: `Submitted. ${res.inserted_item_count} item${res.inserted_item_count !== 1 ? "s" : ""} inserted from ${res.parsed_item_count} parsed.`,
        });
        setMenuText("");
        setSelectedRestaurant(null);
        setRestaurantQuery("");
        onSuccess();
      } catch (err) {
        setResult({ ok: false, message: err?.payload?.error || err?.message || "Submission failed." });
      } finally {
        setSubmitting(false);
      }
    } else {
      // File upload — POST to /menu-upload/pdf (admin bypass via session auth)
      if (!file) {
        setResult({ ok: false, message: "Please choose a PDF or image file." });
        return;
      }
      setSubmitting(true);
      try {
        const json = await submitOwnerMenuFilePdf(selectedRestaurant.id, file);
        const inserted = (json.inserted || 0) + (json.updated || 0);
        setResult({
          ok: true,
          message: `File processed. ${inserted} item${inserted !== 1 ? "s" : ""} inserted.`,
        });
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        setSelectedRestaurant(null);
        setRestaurantQuery("");
        onSuccess();
      } catch (err) {
        setResult({ ok: false, message: err?.payload?.error || err?.message || "File upload failed." });
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 16 : 0 }}>
        <SectionTitle title="New Upload" subtitle="Submit a menu on behalf of a restaurant." />
        <button
          onClick={() => { setOpen((v) => !v); setResult(null); }}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: `1px solid ${open ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
            background: open ? OWNER_COLORS.accent : "#fff",
            color: open ? "#fff" : OWNER_COLORS.ink,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {open ? "Cancel" : "+ New Upload"}
        </button>
      </div>

      {open && (
        <PageCard style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            {/* Restaurant search */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                Restaurant
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={restaurantQuery}
                  onChange={handleQueryChange}
                  placeholder="Type restaurant name to search…"
                  style={inputStyle}
                  autoComplete="off"
                />
                {searching && (
                  <div style={{ position: "absolute", right: 12, top: 10, color: OWNER_COLORS.muted, fontSize: 12 }}>
                    Searching…
                  </div>
                )}
              </div>
              {restaurantResults.length > 0 && (
                <div style={{
                  border: `1px solid ${OWNER_COLORS.line}`,
                  borderRadius: 10,
                  background: "#fff",
                  marginTop: 4,
                  maxHeight: 200,
                  overflowY: "auto",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}>
                  {restaurantResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRestaurant(r)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        border: "none",
                        background: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: 13,
                        borderBottom: `1px solid ${OWNER_COLORS.line}`,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      {r.city && (
                        <span style={{ color: OWNER_COLORS.muted, marginLeft: 8, fontSize: 12 }}>
                          {r.city}, {r.state}
                        </span>
                      )}
                      <span style={{ color: OWNER_COLORS.muted, marginLeft: 8, fontSize: 11 }}>#{r.id}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedRestaurant && (
                <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>
                  Selected: <strong style={{ color: OWNER_COLORS.ink }}>#{selectedRestaurant.id} — {selectedRestaurant.name}</strong>
                </div>
              )}
            </div>

            {/* Mode toggle */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                Upload Method
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { key: "text", label: "Paste Menu Text" },
                  { key: "file", label: "Upload PDF / Image" },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => { setMode(m.key); setResult(null); }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: `1px solid ${mode === m.key ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                      background: mode === m.key ? OWNER_COLORS.accentSoft : "#fff",
                      color: mode === m.key ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                      fontWeight: mode === m.key ? 700 : 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text paste */}
            {mode === "text" && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Menu Text
                </label>
                <div style={{ marginBottom: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.6 }}>
                  Paste the menu below. Format each item as <code>Item Name  $Price</code> or <code>Item Name  9.99</code>.
                  Use ALL CAPS or Title Case lines as section headers (e.g. <code>APPETIZERS</code>).
                </div>
                <textarea
                  value={menuText}
                  onChange={(e) => setMenuText(e.target.value)}
                  placeholder={"APPETIZERS\nSpring Rolls  $8.99\nEdamame  $6\n\nMAINS\nGrilled Salmon  $24\nPasta Primavera  $18"}
                  rows={12}
                  style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical", lineHeight: 1.6 }}
                />
              </div>
            )}

            {/* File upload */}
            {mode === "file" && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  PDF or Image File
                </label>
                <div style={{ marginBottom: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.6 }}>
                  Accepted: PDF, JPEG, PNG, WebP. Max 20 MB. Requires Adobe credentials on the server.
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ ...inputStyle, padding: "10px 12px" }}
                />
                {file && (
                  <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>
                    Selected: <strong style={{ color: OWNER_COLORS.ink }}>{file.name}</strong> ({(file.size / 1024).toFixed(0)} KB)
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "11px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: submitting ? OWNER_COLORS.muted : OWNER_COLORS.accent,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting…" : "Submit Upload"}
              </button>
              {result && (
                <div
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: result.ok ? "#f0fdf4" : "#fff1ef",
                    color: result.ok ? "#15803d" : "#8b2e1a",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {result.message}
                </div>
              )}
            </div>
          </form>
        </PageCard>
      )}
    </div>
  );
}

// ─── Monitoring list helpers ───────────────────────────────────────────────────

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

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
  color: "#101828",
  boxSizing: "border-box",
  outline: "none",
};
