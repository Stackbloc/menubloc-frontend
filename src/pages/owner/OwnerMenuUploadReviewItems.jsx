import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import OwnerRestaurantContextBar from "./OwnerRestaurantContextBar.jsx";
import OcrEditSplitLayout from "./OcrEditSplitLayout.jsx";
import {
  getUploadReviewItems,
  getOwnerMenuUpload,
  approveReviewItem,
  rejectReviewItem,
  bulkReviewItems,
} from "../../lib/ownerApi.js";
import {
  looksGluedForSplitFields,
  splitGluedMenuItemFields,
} from "../../lib/splitGluedMenuItemLine.js";

function resolveItemSection(item) {
  return String(
    item?.section_name ||
      item?.parsed_section ||
      item?.proposed_section ||
      item?.section ||
      ""
  ).trim();
}

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

const nameTextareaStyle = {
  ...inputStyle,
  minHeight: 56,
  resize: "vertical",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.35,
};

const descriptionTextareaStyle = {
  ...inputStyle,
  minHeight: 88,
  resize: "vertical",
  lineHeight: 1.45,
  whiteSpace: "pre-wrap",
};

/** Short codes for the Hold column; full wording is shown on hover via title. */
const HOLD_REASON_META = {
  price_zero_unverified: { code: "PRICE", label: "Missing or unverified price" },
  price_invalid: { code: "PRICE", label: "Invalid price value" },
  low_confidence: { code: "LOW", label: "Low extraction confidence" },
  mojibake: { code: "ENC", label: "Encoding / character issue" },
  text_corrupted: { code: "ENC", label: "Corrupted or unreadable text" },
  identity_conflict: { code: "ID", label: "Identity conflict with an existing item" },
  incoherent_parse: { code: "PARSE", label: "Incoherent or incomplete parse" },
  name_missing: { code: "NAME", label: "Missing item name" },
  name_too_long: { code: "NAME", label: "Item name is unusually long" },
  description_merged_into_name: {
    code: "MERGE",
    label: "Description appears merged into the name",
  },
  icon_only_name: { code: "ICON", label: "Name looks like icons/symbols only" },
  fragment_incomplete: { code: "FRAG", label: "Incomplete name fragment" },
  modifier_not_item: { code: "MOD", label: "Looks like a modifier, not a menu item" },
  section_heading_row: { code: "HEAD", label: "Looks like a section heading, not an item" },
  attribution_mismatch: { code: "ATTR", label: "Restaurant attribution mismatch" },
  attribution_missing: { code: "ATTR", label: "Restaurant attribution missing" },
  duplicate_conflicting_price: {
    code: "DUP",
    label: "Duplicate item with conflicting price",
  },
};

function resolveHoldReason(reason) {
  const raw =
    typeof reason === "string"
      ? reason
      : reason?.code || reason?.reason || reason?.key || "";
  const key = String(raw || "").trim();
  const meta = HOLD_REASON_META[key];
  if (meta) return { code: meta.code, title: `${meta.code}: ${meta.label}` };
  // Fallback: compact unknown snake_case into a short upper token
  const code = key
    ? key
        .replace(/[^a-zA-Z0-9_]/g, "")
        .split("_")
        .map((part) => part.slice(0, 4).toUpperCase())
        .join("-")
        .slice(0, 12) || "HOLD"
    : "HOLD";
  return { code, title: key || "Hold reason" };
}

/** Combobox: pick an existing section or type a new one (added to the shared option list). */
function SectionCombobox({ value, options, onChange, disabled, invalid }) {
  const listId = "owner-review-section-options";
  return (
    <div>
      <input
        type="text"
        list={listId}
        value={value || ""}
        disabled={disabled}
        required
        aria-required="true"
        aria-invalid={invalid ? "true" : "false"}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Section (required)"
        style={{
          ...inputStyle,
          width: 120,
          minWidth: 110,
          borderColor: invalid ? "#dc2626" : OWNER_COLORS.line,
          background: invalid ? "#fef2f2" : "#fff",
        }}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
      {invalid ? (
        <div style={{ marginTop: 3, fontSize: 10, color: "#991b1b", fontWeight: 600 }}>
          Required
        </div>
      ) : null}
    </div>
  );
}

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
  if (!Array.isArray(reasons) || !reasons.length) {
    return <span style={{ color: OWNER_COLORS.muted }}>—</span>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 72 }}>
      {reasons.map((r, i) => {
        const { code, title } = resolveHoldReason(r);
        return (
          <span
            key={`${code}-${i}`}
            title={title}
            aria-label={title}
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.04em",
              padding: "2px 5px",
              borderRadius: 4,
              background: "#fffbeb",
              color: "#92400e",
              border: "1px solid #fde68a",
              whiteSpace: "nowrap",
              cursor: "help",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {code}
          </span>
        );
      })}
    </div>
  );
}

function ItemQualityBadge({ ocr, extraction }) {
  const score = ocr != null ? Number(ocr) : extraction != null ? Number(extraction) : null;
  if (score == null) return <span style={{ color: OWNER_COLORS.muted }}>—</span>;
  const pct = (score * 100).toFixed(0);
  const color = score >= 0.7 ? "#15803d" : score >= 0.4 ? "#92400e" : "#991b1b";
  return <span style={{ fontWeight: 700, color, fontSize: 12 }}>{pct}%</span>;
}

function SourceTextToggle({ text }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span style={{ color: OWNER_COLORS.muted, fontSize: 11 }}>—</span>;
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: OWNER_COLORS.accent, fontSize: 11, fontWeight: 600 }}
      >
        {open ? "Hide" : "Source text"}
      </button>
      {open && (
        <pre style={{ marginTop: 6, fontSize: 10, fontFamily: "monospace", background: "#f9f9f9", padding: "8px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", color: OWNER_COLORS.muted, lineHeight: 1.4 }}>
          {text}
        </pre>
      )}
    </div>
  );
}

function liveMenuHref(restaurantId) {
  if (!restaurantId) return null;
  return `/restaurants/${restaurantId}/menu`;
}

export default function OwnerMenuUploadReviewItems() {
  const { uploadId } = useParams();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ open: 0, edited: 0, approved: 0, rejected: 0 });
  const [pages, setPages] = useState([]);
  const [edits, setEdits] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [publicRestaurantId, setPublicRestaurantId] = useState(null);
  /** Restaurant identity from upload detail — shown in context bar. */
  const [uploadContext, setUploadContext] = useState(null);
  /** Rows that failed validation for missing section (show required styling). */
  const [sectionErrors, setSectionErrors] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reviewData, uploadDetail] = await Promise.allSettled([
        getUploadReviewItems(uploadId),
        getOwnerMenuUpload(uploadId),
      ]);

      if (reviewData.status === "fulfilled") {
        const data = reviewData.value;
        setItems(data.items || []);
        setCounts(data.counts || { open: 0, edited: 0, approved: 0, rejected: 0 });
        const fromReview = Number(data.public_restaurant_id);
        if (Number.isFinite(fromReview) && fromReview > 0) {
          setPublicRestaurantId(fromReview);
        }
        const initEdits = {};
        for (const it of data.items || []) {
          initEdits[it.id] = {
            name: it.parsed_name || it.proposed_item_name || "",
            description: it.parsed_description || it.proposed_description || "",
            price: it.proposed_price != null ? String(it.proposed_price) : "",
            section: resolveItemSection(it),
          };
        }
        setEdits(initEdits);
      }

      // Pages with image_url come from the upload detail endpoint
      if (uploadDetail.status === "fulfilled") {
        const detail = uploadDetail.value;
        const detailPages = detail.pages || detail.upload?.pages || [];
        if (detailPages.length > 0) setPages(detailPages);
        const upload = detail.upload || {};
        setUploadContext({
          name: upload.restaurant_name || null,
          id: upload.restaurant_id || detail.public_restaurant_id || null,
          city: upload.city || null,
          state: upload.state || null,
        });
        const fromUpload = Number(upload.restaurant_id || detail.public_restaurant_id);
        if (Number.isFinite(fromUpload) && fromUpload > 0) {
          setPublicRestaurantId((prev) => prev || fromUpload);
        }
      }
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
    if (field === "section" && String(value || "").trim()) {
      setSectionErrors((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  /** Fill Name / Price / Description from a glued OCR name cell (local only until Approve). */
  function handleSplitFields(itemId) {
    const edit = getEdit(itemId);
    const source = [edit.name, edit.description].filter(Boolean).join(" ").trim()
      || String(edit.name || "").trim();
    const split = splitGluedMenuItemFields(source);
    if (!split) {
      setError("Could not split this line into name, price, and description. Edit the fields manually.");
      return;
    }
    setEdits((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        name: split.name,
        price: String(split.price),
        description: split.description || prev[itemId]?.description || "",
      },
    }));
    setStatusMsg(
      split.fragment_count > 1
        ? `Split fields applied (first of ${split.fragment_count} dishes found). Approve or edit, then handle other dishes separately if needed.`
        : "Split fields applied — review Name, Price, and Description, then Approve."
    );
    setError("");
  }

  /** Sections typed on any row become dropdown options for all subsequent rows. */
  const sectionOptions = useMemo(() => {
    const set = new Set();
    for (const edit of Object.values(edits)) {
      const s = String(edit?.section || "").trim();
      if (s) set.add(s);
    }
    for (const it of items) {
      const s = resolveItemSection(it);
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [edits, items]);

  async function handleApprove(item) {
    const edit = getEdit(item.id);
    const section = String(edit.section || "").trim();
    if (!section) {
      setSectionErrors((prev) => new Set([...prev, item.id]));
      setError("Section is required before approving an item.");
      return;
    }
    const approvedPrice = edit.price !== "" ? Number(edit.price) : undefined;
    setBusy((prev) => new Set([...prev, item.id]));
    setStatusMsg("");
    setError("");
    try {
      const result = await approveReviewItem(uploadId, item.id, {
        name: edit.name || undefined,
        description: edit.description !== undefined ? edit.description : undefined,
        price: approvedPrice,
        section,
      });
      setCounts(result.counts || { open: 0, edited: 0, approved: 0, rejected: 0 });
      // Update local item to reflect the user's edits in the done-state display
      setItems((prev) => prev.map((it) => {
        if (it.id !== item.id) return it;
        return {
          ...it,
          status: "approved",
          parsed_name: edit.name || it.parsed_name,
          proposed_price: approvedPrice !== undefined ? approvedPrice : it.proposed_price,
          parsed_description: edit.description !== undefined ? edit.description : it.parsed_description,
          section_name: section,
          section,
        };
      }));
      setStatusMsg(`"${edit.name || item.parsed_name || item.proposed_item_name}" approved — now live on the menu.`);
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
    if (action === "approve") {
      const missingSection = ids.filter((id) => !String(getEdit(id).section || "").trim());
      if (missingSection.length) {
        setSectionErrors((prev) => new Set([...prev, ...missingSection]));
        setError(
          `Section is required before approving. ${missingSection.length} selected item${
            missingSection.length === 1 ? "" : "s"
          } still need a section.`
        );
        return;
      }
    }
    setBulkBusy(true);
    setStatusMsg("");
    setError("");
    try {
      // Approve one-by-one when sections/descriptions must be sent; bulk reject stays batched.
      if (action === "approve") {
        let approved = 0;
        let lastCounts = counts;
        for (const id of ids) {
          const it = items.find((x) => x.id === id);
          if (!it) continue;
          const edit = getEdit(id);
          const section = String(edit.section || "").trim();
          const approvedPrice = edit.price !== "" ? Number(edit.price) : undefined;
          const result = await approveReviewItem(uploadId, id, {
            name: edit.name || undefined,
            description: edit.description !== undefined ? edit.description : undefined,
            price: approvedPrice,
            section,
          });
          lastCounts = result.counts || lastCounts;
          approved += 1;
          setItems((prev) =>
            prev.map((row) =>
              row.id === id
                ? {
                    ...row,
                    status: "approved",
                    parsed_name: edit.name || row.parsed_name,
                    proposed_price:
                      approvedPrice !== undefined ? approvedPrice : row.proposed_price,
                    parsed_description:
                      edit.description !== undefined
                        ? edit.description
                        : row.parsed_description,
                    section_name: section,
                    section,
                  }
                : row
            )
          );
        }
        setCounts(lastCounts);
        setSelected(new Set());
        setStatusMsg(`Approved ${approved} item${approved === 1 ? "" : "s"} — now live on the menu.`);
        return;
      }

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
  const allDone = !loading && needsReview === 0 && items.length > 0;
  const menuHref = liveMenuHref(publicRestaurantId);
  const showLiveMenu = Boolean(menuHref) && counts.approved > 0;
  const liveItems = items
    .filter((it) => it.status === "approved")
    .map((it) => ({
      name: it.parsed_name || it.proposed_item_name || it.name || "",
      section: it.section_name || it.section || "Menu",
      price: it.proposed_price ?? it.price ?? null,
      description: it.parsed_description || it.description || "",
    }));

  if (loading) {
    return (
      <OwnerLayout title="Review Queue">
        <div style={{ padding: 32, color: OWNER_COLORS.muted }}>Loading…</div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="OCR Review Queue">
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <Link
          to={`/owner/menu-manager/uploads/${uploadId}`}
          style={{ color: OWNER_COLORS.accent, fontSize: 13, textDecoration: "none" }}
        >
          ← Back to Upload Detail
        </Link>
        {showLiveMenu && (
          <a
            href={menuHref}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "8px 14px",
              borderRadius: 9,
              background: "#16a34a",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View live menu →
          </a>
        )}
      </div>

      {uploadContext ? (
        <OwnerRestaurantContextBar
          name={uploadContext.name}
          id={uploadContext.id || publicRestaurantId}
          city={uploadContext.city}
          state={uploadContext.state}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {counts.approved > 0 && !allDone && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600 }}>
          {counts.approved} approved item{counts.approved !== 1 ? "s" : ""} already appear on the live menu
          {showLiveMenu ? (
            <>
              {" — "}
              <a href={menuHref} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 800 }}>
                View live menu →
              </a>
            </>
          ) : (
            "."
          )}
          {" "}No separate Publish step is required for these approvals.
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: "#fef2f2", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}
      {statusMsg && !error && (
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", color: "#15803d", fontSize: 13, fontWeight: 600 }}>
          {statusMsg}
          {showLiveMenu && (
            <>
              {" "}
              <a href={menuHref} target="_blank" rel="noreferrer" style={{ color: "#15803d", fontWeight: 800 }}>
                View live menu →
              </a>
            </>
          )}
        </div>
      )}

      {/* All-done banner */}
      {allDone && (
        <div style={{ marginBottom: 18, padding: "16px 20px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            ✓ All items have been reviewed.
          </div>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            {counts.approved > 0
              ? `${counts.approved} item${counts.approved !== 1 ? "s" : ""} approved and now live on the public menu. No separate Publish step is required.`
              : "No items were approved."}
            {counts.rejected > 0 && ` ${counts.rejected} rejected.`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
            {showLiveMenu && (
              <a
                href={menuHref}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 14px",
                  borderRadius: 9,
                  background: "#16a34a",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                View live menu →
              </a>
            )}
            <Link
              to={`/owner/menu-manager/uploads/${uploadId}`}
              style={{ fontSize: 13, color: "#15803d", fontWeight: 700, textDecoration: "underline" }}
            >
              ← Back to Upload
            </Link>
          </div>
        </div>
      )}

      <OcrEditSplitLayout
        pages={pages}
        liveItems={liveItems}
        railTitle="Source menu"
        defaultRailMode="ocr"
      >
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

        {/* Item table */}
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
                    <th style={{ ...th, minWidth: 240, width: "24%" }}>Name</th>
                    <th style={{ ...th, width: 72 }}>Price</th>
                    <th style={{ ...th, minWidth: 280, width: "34%" }}>Description</th>
                    <th style={{ ...th, width: 130 }}>Section *</th>
                    <th style={{ ...th, width: 72 }} title="Hover codes for full hold reason">
                      Hold
                    </th>
                    <th style={{ ...th, width: 70, textAlign: "center" }}>Quality</th>
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

                        {/* Name — primary editable field (with description) */}
                        <td style={{ ...td, minWidth: 240 }}>
                          {isDone ? (
                            <div>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>
                                {item.parsed_name || item.proposed_item_name || "—"}
                              </span>
                              <SourceTextToggle text={item.original_text || item.raw_text} />
                            </div>
                          ) : (
                            <div>
                              <textarea
                                value={edit.name || ""}
                                onChange={(e) => updateEdit(item.id, "name", e.target.value)}
                                style={nameTextareaStyle}
                                placeholder="Item name"
                                rows={2}
                              />
                              <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <SourceTextToggle text={item.original_text || item.raw_text} />
                                {looksGluedForSplitFields(edit.name, edit.price) ? (
                                  <button
                                    type="button"
                                    data-testid="owner-review-split-fields"
                                    disabled={isBusy}
                                    onClick={() => handleSplitFields(item.id)}
                                    title="Pull name, price, and description out of a glued OCR line"
                                    style={{
                                      border: "none",
                                      background: "none",
                                      padding: 0,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: OWNER_COLORS.accent,
                                      cursor: isBusy ? "not-allowed" : "pointer",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    Split fields
                                  </button>
                                ) : null}
                              </div>
                            </div>
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

                        {/* Description — largest text field */}
                        <td style={{ ...td, minWidth: 260 }}>
                          {isDone ? (
                            <span
                              style={{
                                color: OWNER_COLORS.muted,
                                fontSize: 12,
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.45,
                                display: "block",
                              }}
                            >
                              {item.parsed_description || item.proposed_description || "—"}
                            </span>
                          ) : (
                            <textarea
                              value={edit.description || ""}
                              onChange={(e) => updateEdit(item.id, "description", e.target.value)}
                              style={descriptionTextareaStyle}
                              placeholder="Description"
                              rows={4}
                            />
                          )}
                        </td>

                        {/* Section — required combobox that grows from prior inputs */}
                        <td style={td}>
                          {isDone ? (
                            <span style={{ color: OWNER_COLORS.ink, fontWeight: 600 }}>
                              {resolveItemSection(item) || edit.section || "—"}
                            </span>
                          ) : (
                            <SectionCombobox
                              value={edit.section || ""}
                              options={sectionOptions}
                              disabled={isBusy}
                              invalid={sectionErrors.has(item.id) && !String(edit.section || "").trim()}
                              onChange={(value) => updateEdit(item.id, "section", value)}
                            />
                          )}
                        </td>

                        {/* Hold Reasons */}
                        <td style={td}>
                          <HoldReasonChips reasons={item.hold_reasons} />
                        </td>

                        {/* Quality */}
                        <td style={{ ...td, textAlign: "center" }}>
                          <ItemQualityBadge ocr={item.ocr_quality_score} extraction={item.extraction_quality_score} />
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
                                disabled={isBusy || !String(edit.section || "").trim()}
                                onClick={() => handleApprove(item)}
                                title={
                                  !String(edit.section || "").trim()
                                    ? "Enter a section before approving"
                                    : undefined
                                }
                                style={approveBtn(isBusy || !String(edit.section || "").trim())}
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
      </OcrEditSplitLayout>
    </OwnerLayout>
  );
}
