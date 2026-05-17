/**
 * src/pages/operator/OperatorMenuEditor.jsx
 *
 * Menu Editor — select a menu, manage its items.
 *
 * GUARDRAIL: Upload paths (PDF, MKS Spreadsheet, paste) are the primary
 * onboarding workflow. Manual single-item entry is the secondary correction
 * workflow. Do NOT promote manual entry above upload actions in the empty state.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { API_BASE } from "../../lib/operatorApi.js";

const CANONICAL_MENU_CATEGORIES = [
  "Appetizers",
  "Drinks",
  "Desserts",
  "Entrees",
  "Salads",
  "Soups",
];

// ── Tiny shared styles ─────────────────────────────────────────────────────
const INPUT = {
  padding: "9px 12px",
  fontSize: 13,
  border: "1.5px solid #e4e9f0",
  borderRadius: 8,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const BTN = (variant = "primary") => ({
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "inherit",
  ...(variant === "primary"  && { background: "#1F4E3D", color: "#fff" }),
  ...(variant === "ghost"    && { background: "transparent", color: "#1F4E3D", border: "1.5px solid #1F4E3D" }),
  ...(variant === "danger"   && { background: "transparent", color: "#b91c1c", border: "1.5px solid #fecaca" }),
  ...(variant === "muted"    && { background: "#f4f3ef", color: "#5b6675" }),
  ...(variant === "publish"  && { background: "#1F4E3D", color: "#fff", fontSize: 12, padding: "5px 12px" }),
});

function StatusBadge({ status }) {
  const map = {
    active:   { bg: "#d1fae5", color: "#065f46" },
    draft:    { bg: "#fef9c3", color: "#854d0e" },
    removed:  { bg: "#fee2e2", color: "#991b1b" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
      {status || "draft"}
    </span>
  );
}

// ── New/Edit item form ─────────────────────────────────────────────────────
function ItemForm({ initial = {}, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    description: initial.description || "",
    price: initial.price ?? "",
    canonical_category: initial.canonical_category || "",
    display_category_label: initial.display_category_label || "",
  });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{
      background: "#f8faf9",
      border: "1.5px solid #1F4E3D",
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div className="operator-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Item name *</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.name} onChange={f("name")} placeholder="e.g. House Burger" required />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Price</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.price} onChange={f("price")} placeholder="12.99" type="number" step="0.01" min="0" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Canonical category *</label>
          <select style={{ ...INPUT, width: "100%", cursor: "pointer" }} value={form.canonical_category} onChange={f("canonical_category")}>
            <option value="">Select a canonical category</option>
            {CANONICAL_MENU_CATEGORIES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 4 }}>
            Canonical categories are controlled by Common Knowledge. Display labels are presentation-only.
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Description</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.description} onChange={f("description")} placeholder="Short description" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Display label</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.display_category_label} onChange={f("display_category_label")} placeholder="e.g. Mains or Starters" />
        </div>
      </div>
      <div className="operator-responsive-card-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={BTN("muted")} onClick={onCancel} type="button">Cancel</button>
        <button
          style={{ ...BTN("primary"), opacity: busy ? 0.6 : 1 }}
          disabled={busy || !form.name.trim() || !form.canonical_category}
          onClick={() => onSave(form)}
          type="button"
        >
          {busy ? "Saving…" : initial.id ? "Save changes" : "Add item"}
        </button>
      </div>
    </div>
  );
}

// ── Item row ───────────────────────────────────────────────────────────────
function ItemRow({ item, photoUrl, onEdit, onPublish, onDelete, onPhotoUpload, actionBusy }) {
  const fileRef = useRef(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadBusy(true);
    onPhotoUpload(item, file).finally(() => {
      setUploadBusy(false);
      e.target.value = "";
    });
  }

  return (
    <div className="operator-responsive-row" style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 14px",
      background: "#fff",
      border: "1px solid #e4e9f0",
      borderRadius: 10,
    }}>
      {/* Photo thumbnail */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: 6, background: "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0, color: "#b0bbc8",
        }}>
          🍽
        </div>
      )}

      <div style={{ fontSize: 11, color: "#b0bbc8", fontWeight: 600, minWidth: 52 }}>
        {item.item_number || "—"}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f1720" }}>{item.name}</span>
        {item.description && (
          <span style={{ fontSize: 12, color: "#8a9ab0", marginLeft: 8 }}>{item.description}</span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1720", minWidth: 52, textAlign: "right" }}>
        {item.price != null ? `$${Number(item.price).toFixed(2)}` : ""}
      </div>
      <StatusBadge status={item.status} />

      <div className="operator-responsive-card-actions" style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {/* Photo upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          style={{ ...BTN("muted"), fontSize: 12, padding: "5px 10px", opacity: uploadBusy ? 0.6 : 1 }}
          disabled={uploadBusy || actionBusy}
          onClick={() => fileRef.current?.click()}
          title="Add photo"
        >
          {uploadBusy ? "…" : "📷"}
        </button>

        {/* Publish — always available */}
        <button style={BTN("publish")} disabled={actionBusy} onClick={() => onPublish(item)}>
          Publish
        </button>
        <button style={{ ...BTN("ghost"), fontSize: 12, padding: "5px 10px" }} onClick={() => onEdit(item)}>
          Edit
        </button>
        <button style={{ ...BTN("danger"), fontSize: 12, padding: "5px 10px" }} disabled={actionBusy} onClick={() => onDelete(item)}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Upload action card ─────────────────────────────────────────────────────
function UploadCard({ icon, label, sub, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "18px 12px",
        background: hovered ? "#f0f7f4" : "#f8faf9",
        border: `1.5px solid ${hovered ? "#1F4E3D" : "#d1e7dd"}`,
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "inherit",
        minWidth: 120,
        flex: 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1F4E3D" }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: "#8a9ab0", textAlign: "center" }}>{sub}</span>}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function OperatorMenuEditor() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const navigate = useNavigate();

  const [menus, setMenus]             = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [items, setItems]             = useState([]);
  const [itemPhotos, setItemPhotos]   = useState({});
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError]             = useState("");
  const [upgradePrompt, setUpgradePrompt] = useState(false);

  const [showNewMenuForm, setShowNewMenuForm] = useState(false);
  const [newMenuName, setNewMenuName]         = useState("");
  const [newMenuBusy, setNewMenuBusy]         = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [actionBusy, setActionBusy]   = useState(false);

  const [showPasteForm, setShowPasteForm] = useState(false);
  const [pasteText, setPasteText]         = useState("");
  const [pasteBusy, setPasteBusy]         = useState(false);
  const [pasteSuccess, setPasteSuccess]   = useState(false);

  const [renamingMenuId, setRenamingMenuId] = useState(null);
  const [renameValue, setRenameValue]       = useState("");
  const [renameBusy, setRenameBusy]         = useState(false);
  const [deletingMenuId, setDeletingMenuId] = useState(null);

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  // Load menus
  useEffect(() => {
    if (!rid) return;
    setLoadingMenus(true);
    setError("");
    api.getMenus(rid)
      .then(d => {
        const list = d.menus || [];
        setMenus(list);
        if (list.length) setSelectedMenuId(list[0].id);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingMenus(false));
  }, [rid]);

  // Load items when menu changes
  const loadItems = useCallback(async (menuId) => {
    if (!rid || !menuId) return;
    setLoadingItems(true);
    try {
      const d = await api.getMenuItems(rid, menuId);
      setItems(d.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingItems(false);
    }
  }, [rid]);

  useEffect(() => {
    if (selectedMenuId) loadItems(selectedMenuId);
  }, [selectedMenuId, loadItems]);

  // Create menu
  async function handleCreateMenu() {
    if (!newMenuName.trim()) return;
    setNewMenuBusy(true);
    setUpgradePrompt(false);
    try {
      const d = await api.createMenu(rid, { name: newMenuName.trim(), is_primary: menus.length === 0 });
      const updated = [...menus, d.menu];
      setMenus(updated);
      setSelectedMenuId(d.menu.id);
      setNewMenuName("");
      setShowNewMenuForm(false);
    } catch (e) {
      if (e.status === 403 && e.payload?.upgrade_required) {
        setUpgradePrompt(true);
        setShowNewMenuForm(false);
      } else {
        setError(e.message);
      }
    } finally {
      setNewMenuBusy(false);
    }
  }

  // Publish menu
  async function handlePublishMenu() {
    if (!selectedMenuId) return;
    setActionBusy(true);
    try {
      const d = await api.publishMenu(rid, selectedMenuId);
      setMenus(menus.map(m => m.id === selectedMenuId ? { ...m, status: d.menu?.status } : m));
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  // Add item
  async function handleAddItem(form) {
    setActionBusy(true);
    try {
      const d = await api.createMenuItem(rid, selectedMenuId, {
        name: form.name,
        description: form.description || null,
        price: form.price !== "" ? form.price : null,
        canonical_category: form.canonical_category,
        display_category_label: form.display_category_label || null,
      });
      setItems(prev => [...prev, d.item]);
      setShowAddItem(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  // Update item (save draft then publish immediately)
  async function handleEditSave(form) {
    setActionBusy(true);
    try {
      await api.updateMenuItem(rid, editingItem.id, {
        name: form.name,
        description: form.description || null,
        price: form.price !== "" ? form.price : null,
        canonical_category: form.canonical_category,
        display_category_label: form.display_category_label || null,
      });
      const published = await api.publishMenuItem(rid, editingItem.id);
      setItems(prev => prev.map(i => i.id === editingItem.id ? published.item : i));
      setEditingItem(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  // Publish item
  async function handlePublish(item) {
    setActionBusy(true);
    try {
      const d = await api.publishMenuItem(rid, item.id);
      setItems(prev => prev.map(i => i.id === item.id ? d.item : i));
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  // Delete item
  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.name}"?`)) return;
    setActionBusy(true);
    try {
      await api.deleteMenuItem(rid, item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  // Upload photo for an item
  async function handlePhotoUpload(item, file) {
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await fetch(`${API_BASE}/operator/menu-items/${item.id}/photo`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Photo upload failed");
      const url = json.photo?.photo_url;
      if (url) setItemPhotos(prev => ({ ...prev, [item.id]: url }));
    } catch (e) {
      setError(e.message);
    }
  }

  // Paste text submit
  async function handlePasteSubmit() {
    if (!pasteText.trim() || !rid) return;
    setPasteBusy(true);
    try {
      const res = await fetch("/api/operator/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ restaurant_id: rid, text: pasteText.trim(), source: "paste" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Submission failed");
      }
      setPasteText("");
      setShowPasteForm(false);
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 6000);
    } catch (e) {
      setError(e.message);
    } finally {
      setPasteBusy(false);
    }
  }

  // Rename menu
  async function handleRenameMenu() {
    if (!renameValue.trim() || !renamingMenuId) return;
    setRenameBusy(true);
    try {
      const d = await api.updateMenu(rid, renamingMenuId, { name: renameValue.trim() });
      setMenus(prev => prev.map(m => m.id === renamingMenuId ? { ...m, name: d.menu?.name ?? renameValue.trim() } : m));
      setRenamingMenuId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setRenameBusy(false);
    }
  }

  // Delete menu
  async function handleDeleteMenu(menuId) {
    const menu = menus.find(m => m.id === menuId);
    if (!window.confirm(`Delete "${menu?.name}"? This cannot be undone.`)) return;
    setDeletingMenuId(menuId);
    try {
      await api.deleteMenu(rid, menuId);
      const remaining = menus.filter(m => m.id !== menuId);
      setMenus(remaining);
      if (selectedMenuId === menuId) {
        setSelectedMenuId(remaining.length ? remaining[0].id : null);
        setItems([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingMenuId(null);
    }
  }

  const grouped = items.reduce((acc, item) => {
    const key = item.display_category_label || item.canonical_category || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (!rid) {
    return (
      <OperatorLayout title="Menu Editor">
        <p style={{ color: "#8a9ab0" }}>Select a restaurant from the sidebar to manage its menu.</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Menu Editor">
      {/* ── Top bar: New → Edit → Publish → Delete ───────────────── */}
      <div className="operator-responsive-actions" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>

        {/* Menu selector */}
        {loadingMenus ? (
          <span style={{ color: "#8a9ab0", fontSize: 13 }}>Loading menus…</span>
        ) : menus.length === 0 ? (
          <span style={{ color: "#8a9ab0", fontSize: 13 }}>No menus yet</span>
        ) : (
          <select
            className="operator-responsive-select"
            value={selectedMenuId || ""}
            onChange={e => setSelectedMenuId(Number(e.target.value))}
            style={{ ...INPUT, minWidth: 200, cursor: "pointer" }}
          >
            {menus.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.status === "draft" ? "(draft)" : ""}
              </option>
            ))}
          </select>
        )}

        {/* New — always first */}
        <button style={BTN("muted")} onClick={() => { setShowNewMenuForm(v => !v); setUpgradePrompt(false); }}>
          + New
        </button>

        {/* Edit / Publish / Delete — for selected menu */}
        {selectedMenu && (
          renamingMenuId === selectedMenuId ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                style={{ ...INPUT, minWidth: 180 }}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") handleRenameMenu();
                  if (e.key === "Escape") setRenamingMenuId(null);
                }}
              />
              <button
                style={{ ...BTN("primary"), padding: "8px 12px" }}
                onClick={handleRenameMenu}
                disabled={renameBusy || !renameValue.trim()}
              >
                {renameBusy ? "…" : "Save"}
              </button>
              <button style={{ ...BTN("muted"), padding: "8px 10px" }} onClick={() => setRenamingMenuId(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                style={BTN("ghost")}
                onClick={() => { setRenamingMenuId(selectedMenuId); setRenameValue(selectedMenu.name); }}
              >
                Edit
              </button>
              <button
                style={BTN("ghost")}
                onClick={handlePublishMenu}
                disabled={actionBusy}
              >
                Publish
              </button>
              <button
                style={BTN("danger")}
                disabled={deletingMenuId === selectedMenuId}
                onClick={() => handleDeleteMenu(selectedMenuId)}
              >
                {deletingMenuId === selectedMenuId ? "…" : "Delete"}
              </button>
            </>
          )
        )}

        {/* Right side: upload + add item */}
        {menus.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              style={BTN("ghost")}
              onClick={() => navigate(`/restaurant/spreadsheet-upload?restaurantId=${rid}`)}
            >
              Upload menu
            </button>
            <button
              style={BTN("primary")}
              onClick={() => { setShowAddItem(v => !v); setEditingItem(null); }}
            >
              Add item
            </button>
          </div>
        )}
      </div>

      {/* New menu inline form */}
      {showNewMenuForm && (
        <div className="operator-responsive-inline-form" style={{
          background: "#fff",
          border: "1.5px solid #1F4E3D",
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 20,
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Menu name</label>
            <input
              style={{ ...INPUT, width: "100%" }}
              value={newMenuName}
              onChange={e => setNewMenuName(e.target.value)}
              placeholder="e.g. Lunch Menu, Seasonal Specials"
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleCreateMenu()}
            />
          </div>
          <button style={BTN("primary")} onClick={handleCreateMenu} disabled={newMenuBusy || !newMenuName.trim()}>
            {newMenuBusy ? "Creating…" : "Create"}
          </button>
          <button style={BTN("muted")} onClick={() => setShowNewMenuForm(false)}>Cancel</button>
        </div>
      )}

      {/* Upgrade prompt */}
      {upgradePrompt && (
        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10,
          padding: "12px 16px", fontSize: 13, marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <span style={{ color: "#92400e" }}>
            Multiple menus require a paid plan.{" "}
            <button
              onClick={() => navigate("/operator/subscription")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#1F4E3D", fontWeight: 700, fontSize: 13, padding: 0, textDecoration: "underline" }}
            >
              Upgrade to Pro →
            </button>
          </span>
          <button onClick={() => setUpgradePrompt(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#92400e", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
          padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 16,
          display: "flex", justifyContent: "space-between",
        }}>
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Paste success banner */}
      {pasteSuccess && (
        <div style={{
          background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 10,
          padding: "10px 14px", color: "#065f46", fontSize: 13, marginBottom: 16,
        }}>
          Menu text received. Menuply will structure it for review shortly.
        </div>
      )}

      {/* Add item form */}
      {showAddItem && (
        <div style={{ marginBottom: 20 }}>
          <ItemForm
            onSave={handleAddItem}
            onCancel={() => setShowAddItem(false)}
            busy={actionBusy}
          />
        </div>
      )}

      {/* ── Items area ───────────────────────────────────────────────── */}
      {loadingItems ? (
        <p style={{ color: "#8a9ab0", fontSize: 13 }}>Loading items…</p>
      ) : !selectedMenuId ? (

        /* No menu selected */
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "40px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>☰</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 8 }}>No menu selected</div>
          <div style={{ fontSize: 13, color: "#8a9ab0", marginBottom: 20 }}>
            Create a menu above, then upload your existing menu to get started quickly.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              style={BTN("ghost")}
              onClick={() => navigate(`/restaurant/spreadsheet-upload?restaurantId=${rid}`)}
            >
              Upload spreadsheet
            </button>
            <button style={BTN("muted")} onClick={() => setShowNewMenuForm(true)}>
              + New menu
            </button>
          </div>
        </div>

      ) : items.length === 0 ? (

        /* Empty menu — upload-first (no Menu Photos card) */
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "36px 32px",
        }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 6 }}>
              Upload your existing menu
            </div>
            <div style={{ fontSize: 13, color: "#8a9ab0" }}>
              Upload your menu to let Menuply structure it for review. You can edit items after processing.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <UploadCard
              icon="📄"
              label="PDF Menu"
              sub="Upload a PDF or image"
              onClick={() => navigate(`/restaurant/pdf-upload?restaurantId=${rid}`)}
            />
            <UploadCard
              icon="📊"
              label="MKS Spreadsheet"
              sub="Upload .xlsx or .csv"
              onClick={() => navigate(`/restaurant/spreadsheet-upload?restaurantId=${rid}`)}
            />
            <UploadCard
              icon="📋"
              label="Paste Menu Text"
              sub="Copy-paste from any source"
              onClick={() => setShowPasteForm(v => !v)}
            />
          </div>

          {showPasteForm && (
            <div style={{
              background: "#f8faf9", border: "1.5px solid #1F4E3D", borderRadius: 12,
              padding: "16px 18px", marginBottom: 20,
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 6 }}>
                Paste your menu text below
              </label>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste menu items, sections, prices — any format is fine."
                rows={6}
                style={{ ...INPUT, width: "100%", resize: "vertical", lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                <button style={BTN("muted")} onClick={() => setShowPasteForm(false)} type="button">Cancel</button>
                <button
                  style={{ ...BTN("primary"), opacity: (pasteBusy || !pasteText.trim()) ? 0.6 : 1 }}
                  disabled={pasteBusy || !pasteText.trim()}
                  onClick={handlePasteSubmit}
                  type="button"
                >
                  {pasteBusy ? "Sending…" : "Send to Menuply"}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#e4e9f0" }} />
            <span style={{ fontSize: 12, color: "#b0bbc8" }}>or add items one by one</span>
            <div style={{ flex: 1, height: 1, background: "#e4e9f0" }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <button style={BTN("muted")} onClick={() => setShowAddItem(true)}>
              Add single item manually
            </button>
          </div>
        </div>

      ) : (
        Object.entries(grouped).map(([section, sectionItems]) => (
          <div key={section} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", color: "#8a9ab0", marginBottom: 8 }}>
              {section}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sectionItems.map(item =>
                editingItem?.id === item.id ? (
                  <ItemForm
                    key={item.id}
                    initial={item}
                    onSave={handleEditSave}
                    onCancel={() => setEditingItem(null)}
                    busy={actionBusy}
                  />
                ) : (
                  <ItemRow
                    key={item.id}
                    item={item}
                    photoUrl={itemPhotos[item.id] || null}
                    onEdit={setEditingItem}
                    onPublish={handlePublish}
                    onDelete={handleDelete}
                    onPhotoUpload={handlePhotoUpload}
                    actionBusy={actionBusy}
                  />
                )
              )}
            </div>
          </div>
        ))
      )}
    </OperatorLayout>
  );
}
