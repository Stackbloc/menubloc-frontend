/**
 * src/pages/operator/OperatorMenuEditor.jsx
 *
 * Menu Editor — select a menu, manage its items.
 *
 * Features:
 *   • Menu selector dropdown + "New Menu" button
 *   • Items grouped by category/section
 *   • Add, inline-edit, publish, delete items
 *   • Status badge per item (draft / active)
 *   • Empty-state prompt to create first menu
 */

import React, { useState, useEffect, useCallback } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const STARTER_MENU_PRESETS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "custom", label: "Custom" },
];
const SCHEDULE_DAY_OPTIONS = [
  { value: "sunday", label: "Sun" },
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
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
      {status}
    </span>
  );
}

// ── New/Edit item form ─────────────────────────────────────────────────────
function ItemForm({ initial = {}, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    description: initial.description || "",
    price: initial.price ?? "",
    category: initial.category || "",
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Item name *</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.name} onChange={f("name")} placeholder="e.g. House Burger" required />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Price</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.price} onChange={f("price")} placeholder="12.99" type="number" step="0.01" min="0" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Section / Category</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.category} onChange={f("category")} placeholder="e.g. Burgers, Salads, Drinks" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Description</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.description} onChange={f("description")} placeholder="Short description" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={BTN("muted")} onClick={onCancel} type="button">Cancel</button>
        <button
          style={{ ...BTN("primary"), opacity: busy ? 0.6 : 1 }}
          disabled={busy || !form.name.trim()}
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
function ItemRow({ item, onEdit, onPublish, onDelete, actionBusy }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 14px",
      background: "#fff",
      border: "1px solid #e4e9f0",
      borderRadius: 10,
    }}>
      <div style={{ fontSize: 11, color: "#b0bbc8", fontWeight: 600, minWidth: 68 }}>
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
      <div style={{ display: "flex", gap: 6 }}>
        {item.status === "draft" && (
          <button style={BTN("publish")} disabled={actionBusy} onClick={() => onPublish(item)}>
            Publish
          </button>
        )}
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

// ── Main page ──────────────────────────────────────────────────────────────
export default function OperatorMenuEditor() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;

  const [menus, setMenus]             = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [items, setItems]             = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError]             = useState("");

  const [showNewMenuForm, setShowNewMenuForm] = useState(false);
  const [newMenuPreset, setNewMenuPreset]     = useState("lunch");
  const [newMenuName, setNewMenuName]         = useState("");
  const [newMenuBusy, setNewMenuBusy]         = useState(false);
  const [menuSettings, setMenuSettings]       = useState(null);
  const [savingMenuSettings, setSavingMenuSettings] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // item being edited inline
  const [actionBusy, setActionBusy]   = useState(false);

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  useEffect(() => {
    if (!selectedMenu) {
      setMenuSettings(null);
      return;
    }
    const presetType = STARTER_MENU_PRESETS.some((preset) => preset.value === selectedMenu.preset_type)
      ? selectedMenu.preset_type
      : ["breakfast", "lunch", "dinner"].includes(selectedMenu.menu_type)
      ? selectedMenu.menu_type
      : "custom";

    setMenuSettings({
      preset_type: presetType || "custom",
      custom_label:
        presetType === "custom"
          ? selectedMenu.custom_label || selectedMenu.display_name || selectedMenu.name || ""
          : "",
      display_priority: selectedMenu.display_priority ?? "",
      is_primary: selectedMenu.is_primary === true,
      is_public: selectedMenu.is_public !== false,
      is_active: selectedMenu.is_active !== false,
      schedule_days: Array.isArray(selectedMenu.schedule_days) ? selectedMenu.schedule_days : [],
      start_time: selectedMenu.start_time || "",
      end_time: selectedMenu.end_time || "",
      timezone: selectedMenu.timezone || "America/Los_Angeles",
    });
  }, [selectedMenu]);

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
    if (newMenuPreset === "custom" && !newMenuName.trim()) return;
    setNewMenuBusy(true);
    try {
      const d = await api.createMenu(rid, {
        preset_type: newMenuPreset,
        custom_label: newMenuPreset === "custom" ? newMenuName.trim() : null,
        is_primary: menus.length === 0,
      });
      const updated = [...menus, d.menu];
      setMenus(updated);
      setSelectedMenuId(d.menu.id);
      setNewMenuName("");
      setNewMenuPreset("lunch");
      setShowNewMenuForm(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setNewMenuBusy(false);
    }
  }

  function toggleScheduleDay(day) {
    setMenuSettings(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(entry => entry !== day)
        : [...prev.schedule_days, day],
    }));
  }

  async function handleSaveMenuSettings() {
    if (!selectedMenuId || !menuSettings) return;
    if (menuSettings.preset_type === "custom" && !menuSettings.custom_label.trim()) {
      setError("Custom menus need a menu name.");
      return;
    }
    setSavingMenuSettings(true);
    try {
      const d = await api.updateMenu(rid, selectedMenuId, {
        preset_type: menuSettings.preset_type,
        custom_label: menuSettings.preset_type === "custom" ? menuSettings.custom_label.trim() : null,
        display_priority:
          menuSettings.display_priority === "" ? null : Number(menuSettings.display_priority),
        is_primary: menuSettings.is_primary,
        is_public: menuSettings.is_public,
        is_active: menuSettings.is_active,
        schedule_days: menuSettings.schedule_days,
        start_time: menuSettings.start_time || null,
        end_time: menuSettings.end_time || null,
        timezone: menuSettings.timezone.trim() || null,
      });
      setMenus(prev => prev.map(menu => (menu.id === d.menu.id ? d.menu : menu)));
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingMenuSettings(false);
    }
  }

  // Publish menu
  async function handlePublishMenu() {
    if (!selectedMenuId) return;
    setActionBusy(true);
    try {
      const d = await api.publishMenu(rid, selectedMenuId);
      setMenus(menus.map(m => m.id === selectedMenuId ? { ...m, status: d.menu.status } : m));
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
        category: form.category || null,
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
        category: form.category || null,
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

  // Group items by category
  const grouped = items.reduce((acc, item) => {
    const key = item.category || "Uncategorized";
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
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {loadingMenus ? (
          <span style={{ color: "#8a9ab0", fontSize: 13 }}>Loading menus…</span>
        ) : menus.length === 0 ? (
          <span style={{ color: "#8a9ab0", fontSize: 13 }}>No menus yet</span>
        ) : (
          <select
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

        {selectedMenu?.status === "draft" && (
          <button style={BTN("ghost")} onClick={handlePublishMenu} disabled={actionBusy}>
            Publish menu
          </button>
        )}

        <button style={BTN("muted")} onClick={() => setShowNewMenuForm(v => !v)}>
          + New menu
        </button>

        {menus.length > 0 && (
          <button
            style={{ ...BTN("primary"), marginLeft: "auto" }}
            onClick={() => { setShowAddItem(v => !v); setEditingItem(null); }}
          >
            + Add item
          </button>
        )}
      </div>

      {/* New menu inline form */}
      {showNewMenuForm && (
        <div style={{
          background: "#fff",
          border: "1.5px solid #1F4E3D",
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 20,
          display: "grid",
          gap: 14,
        }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 8 }}>
              Starter preset
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STARTER_MENU_PRESETS.map((preset) => {
                const active = preset.value === newMenuPreset;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setNewMenuPreset(preset.value)}
                    style={{
                      ...BTN(active ? "primary" : "ghost"),
                      padding: "7px 12px",
                      fontSize: 12,
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {newMenuPreset === "custom" ? (
              <>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>
                  Custom menu name
                </label>
                <input
                  style={{ ...INPUT, width: "100%" }}
                  value={newMenuName}
                  onChange={e => setNewMenuName(e.target.value)}
                  placeholder="e.g. Mimi's Biscuit Bar, Brunch Sippins, Late Night"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleCreateMenu()}
                />
              </>
            ) : (
              <div style={{ color: "#5b6675", fontSize: 13 }}>
                This menu will be created as <strong>{STARTER_MENU_PRESETS.find((preset) => preset.value === newMenuPreset)?.label}</strong>.
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 12, color: "#8a9ab0" }}>
              Suggested custom examples: Brunch, Bar, Catering, Happy Hour, Kids, Bakery, Seasonal.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              style={BTN("primary")}
              onClick={handleCreateMenu}
              disabled={newMenuBusy || (newMenuPreset === "custom" && !newMenuName.trim())}
            >
              {newMenuBusy ? "Creating…" : "Create"}
            </button>
            <button style={BTN("muted")} onClick={() => setShowNewMenuForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {selectedMenu && menuSettings && (
        <div style={{
          background: "#fff",
          border: "1px solid #e4e9f0",
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 20,
          display: "grid",
          gap: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720" }}>Menu settings</div>
              <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 4 }}>
                Public tabs use these saved fields automatically.
              </div>
            </div>
            <button style={BTN("primary")} onClick={handleSaveMenuSettings} disabled={savingMenuSettings}>
              {savingMenuSettings ? "Saving…" : "Save menu settings"}
            </button>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 8 }}>
              Menu type
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STARTER_MENU_PRESETS.map((preset) => {
                const active = preset.value === menuSettings.preset_type;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setMenuSettings(prev => ({
                      ...prev,
                      preset_type: preset.value,
                      custom_label: preset.value === "custom" ? prev.custom_label : "",
                    }))}
                    style={{ ...BTN(active ? "primary" : "ghost"), padding: "7px 12px", fontSize: 12 }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {menuSettings.preset_type === "custom" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>
                Custom menu name
              </label>
              <input
                style={{ ...INPUT, width: "100%" }}
                value={menuSettings.custom_label}
                onChange={e => setMenuSettings(prev => ({ ...prev, custom_label: e.target.value }))}
                placeholder="Late Night, Catering, Brunch Sippins"
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>
                Display priority
              </label>
              <input
                type="number"
                min="0"
                step="1"
                style={{ ...INPUT, width: "100%" }}
                value={menuSettings.display_priority}
                onChange={e => setMenuSettings(prev => ({ ...prev, display_priority: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>
                Timezone
              </label>
              <input
                style={{ ...INPUT, width: "100%" }}
                value={menuSettings.timezone}
                onChange={e => setMenuSettings(prev => ({ ...prev, timezone: e.target.value }))}
                placeholder="America/Los_Angeles"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>
                Start time
              </label>
              <input
                type="time"
                style={{ ...INPUT, width: "100%" }}
                value={menuSettings.start_time}
                onChange={e => setMenuSettings(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>
                End time
              </label>
              <input
                type="time"
                style={{ ...INPUT, width: "100%" }}
                value={menuSettings.end_time}
                onChange={e => setMenuSettings(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 8 }}>
              Active days
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SCHEDULE_DAY_OPTIONS.map((day) => {
                const active = menuSettings.schedule_days.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleScheduleDay(day.value)}
                    style={{ ...BTN(active ? "primary" : "ghost"), padding: "6px 10px", fontSize: 12 }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0f1720" }}>
              <input
                type="checkbox"
                checked={menuSettings.is_primary}
                onChange={e => setMenuSettings(prev => ({ ...prev, is_primary: e.target.checked }))}
              />
              Primary menu fallback
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0f1720" }}>
              <input
                type="checkbox"
                checked={menuSettings.is_public}
                onChange={e => setMenuSettings(prev => ({ ...prev, is_public: e.target.checked }))}
              />
              Publicly visible when published
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0f1720" }}>
              <input
                type="checkbox"
                checked={menuSettings.is_active}
                onChange={e => setMenuSettings(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              Active menu collection
            </label>
          </div>
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

      {/* Items list */}
      {loadingItems ? (
        <p style={{ color: "#8a9ab0", fontSize: 13 }}>Loading items…</p>
      ) : !selectedMenuId ? (
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "40px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>☰</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 8 }}>No menu selected</div>
          <div style={{ fontSize: 13, color: "#8a9ab0" }}>Create your first menu above to get started.</div>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "40px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🍽</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 8 }}>No items yet</div>
          <div style={{ fontSize: 13, color: "#8a9ab0", marginBottom: 20 }}>Add your first menu item using the button above.</div>
          <button style={BTN("primary")} onClick={() => setShowAddItem(true)}>+ Add first item</button>
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
                    onEdit={setEditingItem}
                    onPublish={handlePublish}
                    onDelete={handleDelete}
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
