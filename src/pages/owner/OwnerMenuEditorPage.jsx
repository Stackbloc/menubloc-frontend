import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import OwnerRestaurantContextBar from "./OwnerRestaurantContextBar.jsx";
import { MenuEditor, StatusChip, inputStyle } from "./ownerMenuEditorComponents.jsx";
import {
  getMenuConsoleMenu,
  getMenuConsoleRestaurantMenus,
  getOwnerMenuUploads,
  getUploadReviewItems,
  approveReviewItem,
  rejectReviewItem,
  submitOwnerMenuFilePdf,
  submitOwnerMenuTextIngest,
} from "../../lib/ownerApi.js";

const HOLD_REASON_LABELS = {
  price_zero_unverified: "Missing price",
  low_confidence: "Low confidence",
  mojibake: "Encoding issue",
  identity_conflict: "Identity conflict",
  incoherent_parse: "Parse error",
};

const fieldLabel = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: OWNER_COLORS.muted,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

function ReviewItemRow({ item, onApprove, onReject }) {
  const [name, setName] = useState(item.parsed_name || item.proposed_item_name || "");
  const [price, setPrice] = useState(item.proposed_price != null ? String(item.proposed_price) : "");
  const [description, setDescription] = useState(item.parsed_description || item.proposed_description || "");
  const [section, setSection] = useState(item.section_name || "");
  const [acting, setActing] = useState(false);

  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>
        {(Array.isArray(item.hold_reasons) ? item.hold_reasons : [])
          .map((r) => HOLD_REASON_LABELS[r] || r)
          .filter(Boolean)
          .join(", ") || "Needs review"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={fieldLabel}>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
        </div>
        <div>
          <label style={fieldLabel}>Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" min="0" style={{ ...inputStyle, fontSize: 12 }} />
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={fieldLabel}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, fontSize: 12, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={fieldLabel}>Section</label>
        <input value={section} onChange={(e) => setSection(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          disabled={acting || !name.trim()}
          onClick={async () => {
            setActing(true);
            await onApprove({
              name: name.trim(),
              price: price === "" ? null : Number(price),
              description: description.trim() || null,
              section: section.trim() || null,
            });
            setActing(false);
          }}
          style={{ padding: "7px 16px", borderRadius: 8, background: "#15803d", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={acting}
          onClick={async () => {
            setActing(true);
            await onReject();
            setActing(false);
          }}
          style={{ padding: "7px 14px", borderRadius: 8, background: "#fff", color: "#991b1b", border: "1px solid #fca5a5", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function MenuUploadPanel({ restaurantId, onUploaded, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState("file");
  const [menuText, setMenuText] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);
    setSubmitting(true);
    try {
      if (mode === "text") {
        if (!menuText.trim()) throw new Error("Please paste menu text.");
        const res = await submitOwnerMenuTextIngest(restaurantId, menuText);
        setResult({
          ok: true,
          message: `Parsed ${res.parsed_item_count} items, inserted ${res.inserted_item_count}.`,
        });
        setMenuText("");
      } else {
        if (!file) throw new Error("Please choose a PDF or image file.");
        const json = await submitOwnerMenuFilePdf(restaurantId, file);
        const inserted = (json.inserted_items || json.inserted || 0) + (json.updated_items || json.updated || 0);
        const reviewCount = json.review_count || 0;
        setResult({
          ok: true,
          message: `Processed file — ${inserted} item${inserted !== 1 ? "s" : ""} added${reviewCount ? `, ${reviewCount} need review below` : ""}.`,
        });
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
      onUploaded?.();
    } catch (err) {
      setResult({ ok: false, message: err?.payload?.error || err?.message || "Upload failed." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageCard style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <SectionTitle title="Upload Menu PDF / Photo" subtitle="Add items from a file or pasted text — no manual Supabase upload." />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            padding: "9px 16px", borderRadius: 10, flexShrink: 0,
            background: open ? OWNER_COLORS.accent : "#fff",
            color: open ? "#fff" : OWNER_COLORS.ink,
            border: `1px solid ${open ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          {open ? "Close" : "+ Upload Menu"}
        </button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              { key: "file", label: "PDF / Image" },
              { key: "text", label: "Paste Text" },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setResult(null); }}
                style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${mode === m.key ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                  background: mode === m.key ? OWNER_COLORS.accentSoft : "#fff",
                  color: mode === m.key ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          {mode === "file" ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 6 }}>PDF, JPEG, PNG, or WebP — max 20 MB.</div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ ...inputStyle, padding: "10px 12px" }}
              />
              {file && <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>Selected: {file.name}</div>}
            </div>
          ) : (
            <textarea
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              rows={8}
              placeholder={"APPETIZERS\nSpring Rolls  $8.99\n\nMAINS\nGrilled Salmon  $24"}
              style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical", marginBottom: 14, lineHeight: 1.6 }}
            />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: submitting ? OWNER_COLORS.muted : OWNER_COLORS.accent,
                color: "#fff", fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Processing…" : "Process Upload"}
            </button>
            {result && (
              <div style={{
                flex: 1, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                background: result.ok ? "#f0fdf4" : "#fff1ef",
                color: result.ok ? "#15803d" : "#8b2e1a",
              }}>
                {result.message}
              </div>
            )}
          </div>
        </form>
      )}
    </PageCard>
  );
}

export default function OwnerMenuEditorPage() {
  const { restaurantId, menuId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoOpenUpload = searchParams.get("upload") === "1";
  const rid = Number(restaurantId);
  const mid = Number(menuId);

  const [restaurant, setRestaurant] = useState(null);
  const [menuDetail, setMenuDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewItems, setReviewItems] = useState([]);

  const loadMenu = useCallback(async () => {
    if (!Number.isFinite(rid) || !Number.isFinite(mid)) {
      setError("Invalid restaurant or menu ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [menusData, detail] = await Promise.all([
        getMenuConsoleRestaurantMenus(rid),
        getMenuConsoleMenu(rid, mid),
      ]);
      if (menusData.restaurant) setRestaurant(menusData.restaurant);
      setMenuDetail(detail);
    } catch (err) {
      setError(err?.payload?.error || err?.message || "Could not load menu.");
    } finally {
      setLoading(false);
    }
  }, [rid, mid]);

  const loadReviewItems = useCallback(async () => {
    if (!Number.isFinite(rid)) return;
    try {
      const uploadsRes = await getOwnerMenuUploads({ restaurant_id: rid, limit: 50 });
      const pending = (uploadsRes.uploads || []).filter((u) => (u.human_review_items || 0) > 0);
      const groups = await Promise.all(
        pending.map(async (u) => {
          try {
            const res = await getUploadReviewItems(u.id);
            return (res.items || [])
              .filter((item) => item.status === "open" || item.status === "edited")
              .map((item) => ({ ...item, uploadId: u.id }));
          } catch {
            return [];
          }
        })
      );
      setReviewItems(groups.flat());
    } catch {
      setReviewItems([]);
    }
  }, [rid]);

  useEffect(() => {
    loadMenu();
    loadReviewItems();
  }, [loadMenu, loadReviewItems]);

  function handleUploaded() {
    loadMenu();
    loadReviewItems();
  }

  async function handleApproveReview(uploadId, itemId, edits) {
    await approveReviewItem(uploadId, itemId, edits);
    await loadReviewItems();
    await loadMenu();
  }

  async function handleRejectReview(uploadId, itemId) {
    await rejectReviewItem(uploadId, itemId);
    await loadReviewItems();
    await loadMenu();
  }

  function handleMenuDeleted() {
    navigate(`/owner/menu-manager?tab=workspace&restaurant=${rid}`);
  }

  const restaurantName = restaurant?.restaurant_name || restaurant?.name || "Restaurant";
  const menuName = menuDetail?.menu?.display_name || menuDetail?.menu?.name || "Menu";

  return (
    <OwnerLayout title="Menu Editor">
      <div style={{ marginBottom: 16 }}>
        <Link
          to={Number.isFinite(rid) ? `/owner/menu-manager?tab=workspace&restaurant=${rid}` : "/owner/menu-manager?tab=activity"}
          style={{ color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13, textDecoration: "none" }}
        >
          ← Back to Menu Manager
        </Link>
      </div>

      {restaurant ? (
        <OwnerRestaurantContextBar
          name={restaurantName}
          id={restaurant.id || rid}
          city={restaurant.city}
          state={restaurant.state}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <PageCard style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: OWNER_COLORS.ink }}>{menuName}</h1>
            {menuDetail?.menu && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <StatusChip status={menuDetail.menu.status} />
                {menuDetail.menu.menu_type && (
                  <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{menuDetail.menu.menu_type}</span>
                )}
              </div>
            )}
          </div>
          {Number.isFinite(rid) && (
            <a
              href={`/public/restaurants/${rid}/menu`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none", marginTop: 4 }}
            >
              View public menu ↗
            </a>
          )}
        </div>
      </PageCard>

      {autoOpenUpload && (
        <PageCard style={{ padding: "14px 18px", marginBottom: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
            Restaurant created — upload a menu PDF or photo below to get started.
          </div>
        </PageCard>
      )}

      {Number.isFinite(rid) && (
        <MenuUploadPanel restaurantId={rid} onUploaded={handleUploaded} defaultOpen={autoOpenUpload} />
      )}

      {reviewItems.length > 0 && (
        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <SectionTitle
            title="Items Needing Review"
            subtitle="From recent PDF/photo uploads — approve to add to the menu, or reject to discard."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {reviewItems.map((item) => (
              <ReviewItemRow
                key={`${item.uploadId}-${item.id}`}
                item={item}
                onApprove={(edits) => handleApproveReview(item.uploadId, item.id, edits)}
                onReject={() => handleRejectReview(item.uploadId, item.id)}
              />
            ))}
          </div>
        </PageCard>
      )}

      {loading ? (
        <PageCard style={{ padding: 40, color: OWNER_COLORS.muted }}>Loading menu…</PageCard>
      ) : error ? (
        <PageCard style={{ padding: 24, color: "#991b1b", fontWeight: 600 }}>{error}</PageCard>
      ) : menuDetail ? (
        <MenuEditor
          restaurantId={rid}
          menuDetail={menuDetail}
          onMenuUpdated={(updated) => setMenuDetail((prev) => (prev ? { ...prev, menu: { ...prev.menu, ...updated } } : prev))}
          onMenuDeleted={handleMenuDeleted}
          onReload={loadMenu}
        />
      ) : (
        <PageCard style={{ padding: 40 }}><EmptyState>Menu not found.</EmptyState></PageCard>
      )}
    </OwnerLayout>
  );
}
