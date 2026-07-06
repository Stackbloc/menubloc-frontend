import React, { useEffect, useState } from "react";
import { EmptyState, OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import {
  addMenuConsoleItem,
  updateMenuConsoleItem,
  deleteMenuConsoleItem,
  updateMenuConsoleMenu,
  publishMenuConsoleMenu,
  unpublishMenuConsoleMenu,
  deleteMenuConsoleMenu,
} from "../../lib/ownerApi.js";

export const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
  color: "#101828",
  boxSizing: "border-box",
  outline: "none",
};

const STATUS_BADGE = {
  draft:        { background: "#e8f0fe", color: "#1a56db" },
  published:    { background: "#f0fdf4", color: "#15803d" },
  archived:     { background: "#f3f4f6", color: "#6b7280" },
  removed:      { background: "#fef2f2", color: "#991b1b" },
  pending:      { background: "#fffbeb", color: "#92400e" },
  failed:       { background: "#fef2f2", color: "#991b1b" },
  needs_review: { background: "#fffbeb", color: "#92400e" },
};

export function StatusChip({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.draft;
  return (
    <span style={{
      display: "inline-block", padding: "3px 9px", borderRadius: 6,
      fontSize: 11, fontWeight: 700, ...s,
    }}>
      {status}
    </span>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: OWNER_COLORS.muted,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export function MenuEditor({ restaurantId, menuDetail, onMenuUpdated, onMenuDeleted, onReload }) {
  const { menu, sections: initialSections, item_count } = menuDetail;
  const [sections, setSections] = useState(initialSections || []);
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgOk, setSaveMsgOk] = useState(true);

  // Pending edits: { itemId: { name, description, price, section } }
  const [pendingEdits, setPendingEdits] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);

  // New item form state per section
  const [newItemSection, setNewItemSection] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", section: "" });
  const [addingItem, setAddingItem] = useState(false);
  const [addItemErr, setAddItemErr] = useState("");

  // Menu name edit
  const [editingMenuName, setEditingMenuName] = useState(false);
  const [menuNameDraft, setMenuNameDraft] = useState(menu.display_name || menu.name || "");
  const [menuNameSaving, setMenuNameSaving] = useState(false);

  // New section name
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  useEffect(() => {
    setSections(menuDetail.sections || []);
    setUnsaved(false);
    setPendingEdits({});
    setEditingItemId(null);
    setSaveMsg("");
    setMenuNameDraft(menuDetail.menu?.display_name || menuDetail.menu?.name || "");
  }, [menuDetail]);

  function startEditItem(itemId) {
    const allItems = sections.flatMap((s) => s.items);
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;
    setPendingEdits((prev) => ({
      ...prev,
      [itemId]: prev[itemId] || {
        name: item.name || "",
        description: item.description || "",
        price: item.price != null ? String(item.price) : "",
        section: item.section || "",
      },
    }));
    setEditingItemId(itemId);
  }

  function updatePendingEdit(itemId, field, value) {
    setPendingEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
    setUnsaved(true);
  }

  function cancelEditItem(itemId) {
    setPendingEdits((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setEditingItemId(null);
  }

  async function saveEditItem(itemId) {
    const edits = pendingEdits[itemId];
    if (!edits) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const body = {};
      if (edits.name !== undefined) body.name = edits.name;
      if (edits.description !== undefined) body.description = edits.description;
      if (edits.price !== undefined) body.price = edits.price === "" ? null : Number(edits.price);
      if (edits.section !== undefined) body.section = edits.section || null;

      const data = await updateMenuConsoleItem(restaurantId, menu.id, itemId, body);

      if (data.ok) {
        setSaveMsg("Saved.");
        setSaveMsgOk(true);
        setPendingEdits((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
        setEditingItemId(null);
        onReload();
      }
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Save failed.");
      setSaveMsgOk(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function handleDeleteItem(itemId) {
    if (!window.confirm("Delete this item?")) return;
    setSaving(true);
    try {
      await deleteMenuConsoleItem(restaurantId, menu.id, itemId);
      setSaveMsg("Item deleted.");
      setSaveMsgOk(true);
      onReload();
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Delete failed.");
      setSaveMsgOk(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  function openAddItem(sectionName) {
    setNewItemSection(sectionName);
    setNewItem({ name: "", description: "", price: "", section: sectionName || "" });
    setAddItemErr("");
  }

  async function handleAddItem(e) {
    e.preventDefault();
    if (!newItem.name.trim()) { setAddItemErr("Item name is required."); return; }
    setAddingItem(true);
    setAddItemErr("");
    try {
      await addMenuConsoleItem(restaurantId, menu.id, {
        name: newItem.name.trim(),
        description: newItem.description.trim() || null,
        price: newItem.price === "" ? null : Number(newItem.price),
        section: newItem.section.trim() || null,
      });
      setSaveMsg("Item added.");
      setSaveMsgOk(true);
      setNewItemSection(null);
      onReload();
    } catch (err) {
      setAddItemErr(err?.payload?.error || err?.message || "Could not add item.");
    } finally {
      setAddingItem(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function handleAddSection(e) {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    // Add the first item in that section to create it
    setAddingSection(true);
    setNewItemSection(newSectionName.trim());
    setNewItem({ name: "", description: "", price: "", section: newSectionName.trim() });
    setNewSectionName("");
    setAddingSection(false);
  }

  async function handlePublish() {
    setSaving(true);
    setSaveMsg("");
    try {
      const data = menu.status === "published"
        ? await unpublishMenuConsoleMenu(restaurantId, menu.id)
        : await publishMenuConsoleMenu(restaurantId, menu.id);
      setSaveMsg(menu.status === "published" ? "Menu set to draft." : "Menu published.");
      setSaveMsgOk(true);
      onMenuUpdated(data.menu);
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Action failed.");
      setSaveMsgOk(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  }

  async function handleDeleteMenu() {
    if (!window.confirm("Delete this menu and its items? This cannot be undone.")) return;
    setSaving(true);
    try {
      await deleteMenuConsoleMenu(restaurantId, menu.id);
      onMenuDeleted(menu.id);
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Delete failed.");
      setSaveMsgOk(false);
      setSaving(false);
    }
  }

  async function saveMenuName() {
    if (!menuNameDraft.trim()) return;
    setMenuNameSaving(true);
    try {
      const data = await updateMenuConsoleMenu(restaurantId, menu.id, { display_name: menuNameDraft.trim() });
      setEditingMenuName(false);
      onMenuUpdated(data.menu);
      setSaveMsg("Menu name saved.");
      setSaveMsgOk(true);
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Save failed.");
      setSaveMsgOk(false);
    } finally {
      setMenuNameSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  const isPublished = menu.status === "published";

  return (
    <PageCard style={{ padding: 22 }}>
      {/* Menu header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          {editingMenuName ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={menuNameDraft}
                onChange={(e) => setMenuNameDraft(e.target.value)}
                style={{ ...inputStyle, fontSize: 18, fontWeight: 700, padding: "6px 10px" }}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveMenuName(); if (e.key === "Escape") setEditingMenuName(false); }}
              />
              <button onClick={saveMenuName} disabled={menuNameSaving} style={{ padding: "7px 14px", borderRadius: 8, background: OWNER_COLORS.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {menuNameSaving ? "…" : "Save"}
              </button>
              <button onClick={() => setEditingMenuName(false)} style={{ padding: "7px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: OWNER_COLORS.ink }}>
                {menu.display_name || menu.name}
              </h2>
              <button onClick={() => setEditingMenuName(true)} style={{ background: "none", border: "none", cursor: "pointer", color: OWNER_COLORS.muted, fontSize: 12, padding: "2px 6px" }}>
                ✏️ Rename
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
            <StatusChip status={menu.status} />
            <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{item_count} items</span>
            {menu.menu_type && <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{menu.menu_type}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={handlePublish}
            disabled={saving}
            style={{
              padding: "9px 16px", borderRadius: 10,
              background: isPublished ? "#fff" : "#15803d",
              color: isPublished ? OWNER_COLORS.ink : "#fff",
              border: isPublished ? `1px solid ${OWNER_COLORS.line}` : "none",
              fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {isPublished ? "Set to Draft" : "Publish Menu"}
          </button>
          {!menu.is_primary && (
            <button
              onClick={handleDeleteMenu}
              disabled={saving}
              style={{ padding: "9px 14px", borderRadius: 10, background: "#fff", color: "#991b1b", border: "1px solid #fca5a5", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}
            >
              Delete Menu
            </button>
          )}
        </div>
      </div>

      {/* Save message */}
      {saveMsg && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: saveMsgOk ? "#f0fdf4" : "#fff1ef", color: saveMsgOk ? "#15803d" : "#8b2e1a", fontWeight: 700, fontSize: 13 }}>
          {saveMsg}
        </div>
      )}

      {unsaved && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#fffbeb", color: "#92400e", fontWeight: 600, fontSize: 13, border: "1px solid #fde68a" }}>
          You have unsaved changes — save each edited item individually using the Save button next to it.
        </div>
      )}

      {/* Add section */}
      <div style={{ marginBottom: 18 }}>
        <form onSubmit={handleAddSection} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="New section name (e.g. Appetizers)"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" disabled={!newSectionName.trim() || addingSection} style={{ padding: "9px 14px", borderRadius: 10, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Add Section
          </button>
        </form>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <EmptyState>No items yet. Add a section above, then add items below.</EmptyState>
      ) : (
        sections.map((section) => (
          <SectionEditor
            key={section.name}
            section={section}
            editingItemId={editingItemId}
            pendingEdits={pendingEdits}
            saving={saving}
            onStartEdit={startEditItem}
            onCancelEdit={cancelEditItem}
            onUpdateEdit={updatePendingEdit}
            onSaveEdit={saveEditItem}
            onDeleteItem={handleDeleteItem}
            newItemSection={newItemSection}
            newItem={newItem}
            onSetNewItem={setNewItem}
            addItemErr={addItemErr}
            addingItem={addingItem}
            onOpenAddItem={openAddItem}
            onAddItem={handleAddItem}
            onCancelAdd={() => setNewItemSection(null)}
          />
        ))
      )}

      {/* Add item to "no section" */}
      {newItemSection === "" && (
        <AddItemForm
          sectionName=""
          newItem={newItem}
          onSetNewItem={setNewItem}
          addItemErr={addItemErr}
          addingItem={addingItem}
          onSubmit={handleAddItem}
          onCancel={() => setNewItemSection(null)}
        />
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 14 }}>
        <button
          type="button"
          onClick={() => openAddItem("")}
          style={{ padding: "9px 16px", borderRadius: 10, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          + Add Item (No Section)
        </button>
      </div>
    </PageCard>
  );
}

function SectionEditor({ section, editingItemId, pendingEdits, saving, onStartEdit, onCancelEdit, onUpdateEdit, onSaveEdit, onDeleteItem, newItemSection, newItem, onSetNewItem, addItemErr, addingItem, onOpenAddItem, onAddItem, onCancelAdd }) {
  const isAddingHere = newItemSection === section.name;

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: OWNER_COLORS.ink, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {section.name}
        </h3>
        <button
          type="button"
          onClick={() => onOpenAddItem(section.name)}
          style={{ padding: "5px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
        >
          + Add Item
        </button>
      </div>

      {section.items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          isEditing={editingItemId === item.id}
          pendingEdit={pendingEdits[item.id]}
          saving={saving}
          onStartEdit={() => onStartEdit(item.id)}
          onCancelEdit={() => onCancelEdit(item.id)}
          onUpdateEdit={(field, value) => onUpdateEdit(item.id, field, value)}
          onSaveEdit={() => onSaveEdit(item.id)}
          onDelete={() => onDeleteItem(item.id)}
        />
      ))}

      {isAddingHere && (
        <AddItemForm
          sectionName={section.name}
          newItem={newItem}
          onSetNewItem={onSetNewItem}
          addItemErr={addItemErr}
          addingItem={addingItem}
          onSubmit={onAddItem}
          onCancel={onCancelAdd}
        />
      )}
    </div>
  );
}

function ItemRow({ item, isEditing, pendingEdit, saving, onStartEdit, onCancelEdit, onUpdateEdit, onSaveEdit, onDelete }) {
  if (isEditing && pendingEdit) {
    return (
      <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f8f7f4", border: `1px solid ${OWNER_COLORS.accent}`, marginBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Item Name *</label>
            <input value={pendingEdit.name} onChange={(e) => onUpdateEdit("name", e.target.value)} style={inputStyle} placeholder="Item name" />
          </div>
          <div>
            <label style={labelStyle}>Price</label>
            <input value={pendingEdit.price} onChange={(e) => onUpdateEdit("price", e.target.value)} style={inputStyle} placeholder="9.99" type="number" step="0.01" min="0" />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={pendingEdit.description} onChange={(e) => onUpdateEdit("description", e.target.value)} style={{ ...inputStyle, resize: "vertical", minHeight: 56, lineHeight: 1.5 }} placeholder="Optional description" rows={2} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Section / Category</label>
          <input value={pendingEdit.section} onChange={(e) => onUpdateEdit("section", e.target.value)} style={inputStyle} placeholder="e.g. Appetizers" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onSaveEdit} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, background: OWNER_COLORS.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save Item"}
          </button>
          <button onClick={onCancelEdit} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, marginBottom: 6, background: "#fff", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
        {item.description && <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2, whiteSpace: "pre-wrap" }}>{item.description}</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12, color: OWNER_COLORS.muted }}>
          {item.price != null && <span style={{ fontWeight: 600, color: OWNER_COLORS.ink }}>${Number(item.price).toFixed(2)}</span>}
          {item.section && <span>{item.section}</span>}
          {item.item_number && <span style={{ opacity: 0.6 }}>{item.item_number}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onStartEdit} style={{ padding: "5px 10px", borderRadius: 7, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
          Edit
        </button>
        <button onClick={onDelete} style={{ padding: "5px 10px", borderRadius: 7, background: "#fff", border: "1px solid #fca5a5", color: "#991b1b", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
          Delete
        </button>
      </div>
    </div>
  );
}

function AddItemForm({ sectionName, newItem, onSetNewItem, addItemErr, addingItem, onSubmit, onCancel }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: "#15803d", marginBottom: 10 }}>
        New item{sectionName ? ` in "${sectionName}"` : ""}
      </div>
      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input value={newItem.name} onChange={(e) => onSetNewItem((p) => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Item name" autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Price</label>
            <input value={newItem.price} onChange={(e) => onSetNewItem((p) => ({ ...p, price: e.target.value }))} style={inputStyle} placeholder="9.99" type="number" step="0.01" min="0" />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Description</label>
          <input value={newItem.description} onChange={(e) => onSetNewItem((p) => ({ ...p, description: e.target.value }))} style={inputStyle} placeholder="Optional" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Section</label>
          <input value={newItem.section} onChange={(e) => onSetNewItem((p) => ({ ...p, section: e.target.value }))} style={inputStyle} placeholder={sectionName || "e.g. Entrees"} />
        </div>
        {addItemErr && <div style={{ marginBottom: 8, fontSize: 12, color: "#991b1b" }}>{addItemErr}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={addingItem} style={{ padding: "8px 16px", borderRadius: 8, background: "#15803d", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: addingItem ? "not-allowed" : "pointer" }}>
            {addingItem ? "Adding…" : "Add Item"}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
