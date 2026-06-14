import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getUploadReviewItems,
  approveReviewItem,
  rejectReviewItem,
  bulkReviewItems,
} from "../../lib/ownerApi.js";

const STATUS_BADGE = {
  open:     { background: "#fffbeb", color: "#92400e" },
  edited:   { background: "#eff6ff", color: "#1d4ed8" },
  approved: { background: "#f0fdf4", color: "#15803d" },
  rejected: { background: "#fef2f2", color: "#991b1b" },
};

const th = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 11,
  color: OWNER_COLORS.muted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};
const td = { padding: "10px 12px", verticalAlign: "top" };

const inputStyle = {
  width: "100%",
  padding: "5px 8px",
  borderRadius: 6,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 12,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

function approveBtn(disabled) {
  return {
    padding: "5px 12px",
    borderRadius: 7,
    border: "none",
    background: disabled ? "#d1fae5" : "#16a34a",
    color: disabled ? "#6b7280" : "#fff",
    fontWeight: 700,
    fontSize: 11,
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
  };
}

function rejectBtn(disabled) {
  return {
    padding: "5px 12px",
    borderRadius: 7,
    border: "none",
    background: disabled ? "#fee2e2" : "#dc2626",
    color: disabled ? "#6b7280" : "#fff",
    fontWeight: 700,
    fontSize: 11,
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
  };
}

function HoldReasonChips({ reasons }) {
  if (!Array.isArray(reasons) || !reasons.length) return <span style={{ color: OWNER_COLORS.muted }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {reasons.map((r, i) => (
        <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#fffbeb", color: "#92400e", whiteSpace: "nowrap" }}>
          {r}
        </span>
      ))}
    </div>
  );
}

function QualityScore({ ocr, extraction }) {
  const score = ocr != null ? Number(ocr) : extraction != null ? Number(extraction) : null;
  if (score == null) return <span style={{ color: OWNER_COLORS.muted }}>—</span>;
  const pct = (score * 100).toFixed(0);
  const color = score >= 0.7 ? "#15803d" : score >= 0.4 ? "#92400e" : "#991b1b";
  return <span style={{ fontWeight: 700, color }}>{pct}%</span>;
}

export default function OwnerMenuUploadReviewItems() {
  const { uploadId } = useParams();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ open: 0, edited: 0, approved: 0, rejected: 0 });
  const [edits, setEdits] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUploadReviewItems(uploadId);
      setItems(data.items || []);
      setCounts(data.counts || { open: 0, edited: 0, approved: 0, rejected: 0 });
      const initEdits = {};
      for (const it of data.items || []) {
        initEdits[it.id] = {
          name: it.parsed_name || it.proposed_item_name || "",
          description: it.parsed_description || it.proposed_description || "",
          price: it.proposed_price != null ? String(it.proposed_price) : "",
          section: "",
        };
      }
      setEdits(initEdits);
    } catch {
      setError("Failed to load review items.");
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => { load(); }, [load]);

  function getEdit(id) { return edits[id] || {}; }

  function updateEdit(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleApprove(item) {
    const edit = getEdit(item.id);
    setBusy((prev) => new Set([...prev, item.id]));
    setStatusMsg("");
    setError("");
    try {
      const result = await approveReviewItem(uploadId, item.id, {
        name: edit.name || undefined,
        description: edit.description !== undefined ? edit.description : undefined,
        price: edit.price !== "" ? Number(edit.price) : undefined,
        section: edit.section || undefined,
      });
      setCounts(result.counts);
      setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: "approved" } : it));
      setStatusMsg(`"${edit.name || item.proposed_item_name}" approved.`);
    } catch (e) {
      setError(`Approve failed: ${e?.message || "Server error"}`);
    } finally {
      setBusy((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  }

  async function handleReject(item) {
    setBusy((prev) => new Set([...prev, item.id]));
    setStatusMsg("");
    setError("");
    try {
      const result = await rejectReviewItem(uploadId, item.id);
      setCounts(result.counts);
      setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: "rejected" } : it));
      setStatusMsg("Item rejected.");
    } catch {
      setError("Reject failed. Try again.");
    } finally {
      setBusy((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  }

  async function handleBulk(action) {
    const ids = [...selected].filter((id) => {
      const it = items.find((x) => x.id === id);
      return it && ["open", "edited"].includes(it.status);
    });
    if (!ids.length) return;
    setBulkBusy(true);
    setStatusMsg("");
    setError("");
    try {
      const result = await bulkReviewItems(uploadId, { action, item_ids: ids });
      setCounts(result.counts);
      const newStatus = action === "approve" ? "approved" : "rejected";
      setItems((prev) => prev.map((it) => ids.includes(it.id) ? { ...it, status: newStatus } : it));
      setSelected(new Set());
      setStatusMsg(`${ids.length} item${ids.length !== 1 ? "s" : ""} ${newStatus}.`);
    } catch {
      setError(`Bulk ${action} failed.`);
    } finally {
      setBulkBusy(false);
    }
  }

  const actionable = items.filter((it) => ["open", "edited"].includes(it.status));
  const allSelected = actionable.length > 0 && actionable.every((it) => selected.has(it.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(actionable.map((it) => it.id)));
  }

  function toggleItem(id) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  const needsReview = counts.open + counts.edited;

  if (loading) {
    return (
      <OwnerLayout title="Review Queue">
        <div style={{ padding: 32, color: OWNER_COLORS.muted }}>Loading…</div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="OCR Review Queue">
      <div style={{ marginBottom: 20 }}>
        <Link
          to={`/owner/menu-uploads/${uploadId}`}
          style={{ color: OWNER_COLORS.accent, fontSize: 13, textDecoration: "none" }}
        >
          ← Back to Upload Detail
        </Link>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: "#fef2f2", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}
      {statusMsg && !error && (
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", color: "#15803d", fontSize: 13, fontWeight: 600 }}>
          {statusMsg}
        </div>
      )}

      {/* Live counts */}
      <PageCard style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            ["Needs Review", needsReview, "#fffbeb", "#92400e"],
            ["Approved",     counts.approved, "#f0fdf4", "#15803d"],
            ["Rejected",     counts.rejected, "#fef2f2", "#991b1b"],
            ["Total",        needsReview + counts.approved + counts.rejected, "#f3f4f6", "#374151"],
          ].map(([label, value, bg, color]) => (
            <div key={label} style={{ padding: 14, borderRadius: 10, background: bg, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: OWNER_COLORS.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color }}>{value ?? 0}</div>
            </div>
          ))}
        </div>
      </PageCard>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, padding: "12px 16px", background: "#f8f7f4", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}` }}>
          <span style={{ fontSize: 13, color: OWNER_COLORS.muted, flex: 1 }}>
            {selected.size} item{selected.size !== 1 ? "s" : ""} selected
          </span>
          <button disabled={bulkBusy} onClick={() => handleBulk("approve")} style={approveBtn(bulkBusy)}>
            Approve Selected
          </button>
          <button disabled={bulkBusy} onClick={() => handleBulk("reject")} style={rejectBtn(bulkBusy)}>
            Reject Selected
          </button>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <PageCard style={{ padding: 40, textAlign: "center", color: OWNER_COLORS.muted, fontSize: 14 }}>
          No review items found for this upload.
        </PageCard>
      ) : (
        <PageCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8f7f4", borderBottom: `2px solid ${OWNER_COLORS.line}` }}>
                  <th style={th}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
                  </th>
                  <th style={{ ...th, width: 180 }}>OCR Text</th>
                  <th style={{ ...th, width: 160 }}>Name</th>
                  <th style={{ ...th, width: 120 }}>Description</th>
                  <th style={{ ...th, width: 80 }}>Price</th>
                  <th style={{ ...th, width: 100 }}>Section</th>
                  <th style={{ ...th, width: 160 }}>Hold Reasons</th>
                  <th style={{ ...th, width: 60, textAlign: "center" }}>Score</th>
                  <th style={{ ...th, width: 70, textAlign: "center" }}>Status</th>
                  <th style={{ ...th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const edit = getEdit(item.id);
                  const isBusy = busy.has(item.id);
                  const isDone = ["approved", "rejected"].includes(item.status);
                  const isOpen = ["open", "edited"].includes(item.status);
                  const rowBg = item.status === "approved"
                    ? "#f0fdf4"
                    : item.status === "rejected"
                    ? "#fef2f2"
                    : idx % 2 === 0 ? "#fff" : "#fafaf9";

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: `1px solid ${OWNER_COLORS.line}`,
                        background: rowBg,
                        opacity: isBusy ? 0.55 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {/* Checkbox */}
                      <td style={td}>
                        {isOpen && (
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                            style={{ cursor: "pointer" }}
                          />
                        )}
                      </td>

                      {/* OCR Text */}
                      <td style={td}>
                        <div
                          style={{
                            maxWidth: 180,
                            maxHeight: 72,
                            overflow: "auto",
                            fontFamily: "monospace",
                            fontSize: 10,
                            whiteSpace: "pre-wrap",
                            color: OWNER_COLORS.muted,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.original_text || item.raw_text || "—"}
                        </div>
                      </td>

                      {/* Name */}
                      <td style={td}>
                        {isDone ? (
                          <span style={{ fontWeight: 600 }}>
                            {item.parsed_name || item.proposed_item_name || "—"}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={edit.name || ""}
                            onChange={(e) => updateEdit(item.id, "name", e.target.value)}
                            style={inputStyle}
                            placeholder="Item name"
                          />
                        )}
                      </td>

                      {/* Description */}
                      <td style={td}>
                        {isDone ? (
                          <span style={{ color: OWNER_COLORS.muted, fontSize: 11 }}>
                            {item.parsed_description || item.proposed_description || "—"}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={edit.description || ""}
                            onChange={(e) => updateEdit(item.id, "description", e.target.value)}
                            style={inputStyle}
                            placeholder="Description"
                          />
                        )}
                      </td>

                      {/* Price */}
                      <td style={td}>
                        {isDone ? (
                          <span>
                            {item.proposed_price != null
                              ? `$${Number(item.proposed_price).toFixed(2)}`
                              : "—"}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={edit.price || ""}
                            onChange={(e) => updateEdit(item.id, "price", e.target.value)}
                            style={{ ...inputStyle, width: 72 }}
                            placeholder="0.00"
                          />
                        )}
                      </td>

                      {/* Section */}
                      <td style={td}>
                        {isDone ? (
                          <span style={{ color: OWNER_COLORS.muted }}>—</span>
                        ) : (
                          <input
                            type="text"
                            value={edit.section || ""}
                            onChange={(e) => updateEdit(item.id, "section", e.target.value)}
                            style={{ ...inputStyle, width: 90 }}
                            placeholder="Section"
                          />
                        )}
                      </td>

                      {/* Hold Reasons */}
                      <td style={td}>
                        <HoldReasonChips reasons={item.hold_reasons} />
                      </td>

                      {/* Quality Score */}
                      <td style={{ ...td, textAlign: "center" }}>
                        <QualityScore ocr={item.ocr_quality_score} extraction={item.extraction_quality_score} />
                      </td>

                      {/* Status */}
                      <td style={{ ...td, textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontWeight: 700,
                            ...(STATUS_BADGE[item.status] || {}),
                          }}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...td, textAlign: "right" }}>
                        {isOpen && (
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              disabled={isBusy}
                              onClick={() => handleApprove(item)}
                              style={approveBtn(isBusy)}
                            >
                              {isBusy ? "…" : "Approve"}
                            </button>
                            <button
                              disabled={isBusy}
                              onClick={() => handleReject(item)}
                              style={rejectBtn(isBusy)}
                            >
                              {isBusy ? "…" : "Reject"}
                            </button>
                          </div>
                        )}
                        {item.status === "approved" && (
                          <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>✓ Approved</span>
                        )}
                        {item.status === "rejected" && (
                          <span style={{ fontSize: 11, color: "#991b1b", fontWeight: 600 }}>✗ Rejected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PageCard>
      )}
    </OwnerLayout>
  );
}
