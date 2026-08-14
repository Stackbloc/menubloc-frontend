import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  deriveSectionList,
  resolveSectionCanonical,
} from "../../lib/menuWorksheetHelpers.js";
import MenuItemModifiersEditor, {
  toEditorGroups,
  fromEditorGroups,
} from "./MenuItemModifiersEditor.jsx";

/** Default theme — matches owner Menu Manager palette for visual continuity. */
export const MENU_EDITOR_COLORS = {
  ink: "#101828",
  muted: "#667085",
  panel: "#fffdf8",
  accent: "#9f3a22",
  accentSoft: "#fce6dd",
  line: "#ead9ce",
};

function DefaultPageCard({ children, style = {} }) {
  return (
    <section
      style={{
        background: MENU_EDITOR_COLORS.panel,
        border: `1px solid ${MENU_EDITOR_COLORS.line}`,
        borderRadius: 18,
        boxShadow: "0 12px 40px rgba(86, 47, 29, 0.08)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function DefaultEmptyState({ children, colors }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 14,
        background: "#fff",
        border: `1px dashed ${colors.line}`,
        color: colors.muted,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Section dropdown: existing sections + "+ New section…" (added to options after create).
 */
function SectionSelect({
  value,
  options = [],
  onChange,
  onCreateSection,
  fieldStyle,
  label = "Section",
  labelStyle,
}) {
  const [mode, setMode] = useState("select");
  const [draft, setDraft] = useState("");

  const optionList = useMemo(
    () => deriveSectionList([...(options || []), value]),
    [options, value]
  );

  function commitNew() {
    const canonical = resolveSectionCanonical(draft, optionList);
    if (!canonical) {
      setMode("select");
      return;
    }
    onCreateSection?.(canonical);
    onChange(canonical);
    setDraft("");
    setMode("select");
  }

  if (mode === "create") {
    return (
      <div>
        {labelStyle ? <label style={labelStyle}>{label}</label> : null}
        <input
          autoFocus
          value={draft}
          placeholder="New section name"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (String(draft || "").trim()) commitNew();
            else setMode("select");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitNew();
            }
            if (e.key === "Escape") {
              setDraft("");
              setMode("select");
            }
          }}
          style={fieldStyle}
          aria-label="New section name"
        />
        <button
          type="button"
          onClick={() => {
            setDraft("");
            setMode("select");
          }}
          style={{
            marginTop: 6,
            padding: 0,
            border: "none",
            background: "none",
            color: "#64748b",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      {labelStyle ? <label style={labelStyle}>{label}</label> : null}
      <select
        value={value || ""}
        onChange={(e) => {
          if (e.target.value === "__new__") {
            setMode("create");
            setDraft("");
            return;
          }
          onChange(e.target.value);
        }}
        style={{ ...fieldStyle, cursor: "pointer" }}
        aria-label={label}
      >
        <option value="">— No section —</option>
        {optionList.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        <option value="__new__">+ New section…</option>
      </select>
    </div>
  );
}

export function buildInputStyle(colors = MENU_EDITOR_COLORS) {
  return {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 10,
    border: `1px solid ${colors.line}`,
    fontSize: 13,
    fontFamily: "inherit",
    background: "#fff",
    color: "#101828",
    boxSizing: "border-box",
    outline: "none",
  };
}

export const inputStyle = buildInputStyle(MENU_EDITOR_COLORS);

const STATUS_BADGE = {
  draft: { background: "#e8f0fe", color: "#1a56db" },
  published: { background: "#f0fdf4", color: "#15803d" },
  archived: { background: "#f3f4f6", color: "#6b7280" },
  removed: { background: "#fef2f2", color: "#991b1b" },
  pending: { background: "#fffbeb", color: "#92400e" },
  failed: { background: "#fef2f2", color: "#991b1b" },
  needs_review: { background: "#fffbeb", color: "#92400e" },
};

export function StatusChip({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.draft;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        ...s,
      }}
    >
      {status}
    </span>
  );
}

/**
 * Shared structured menu editor (CK-backed via injected API adapter).
 *
 * @param {object} props
 * @param {number|string} props.restaurantId
 * @param {object} props.menuDetail — { menu, sections, item_count }
 * @param {object} props.api — { updateItem, deleteItem, addItem, updateMenu, publishMenu, unpublishMenu, deleteMenu?, listItemPhotos?, uploadItemPhoto?, deleteItemPhoto? }
 * @param {boolean} [props.allowDeleteMenu=true]
 * @param {object} [props.colors]
 * @param {function} [props.onMenuUpdated]
 * @param {function} [props.onMenuDeleted]
 * @param {function} [props.onReload]
 * @param {function} [props.onItemPhotosChange] — ({ [itemId]: photoUrl })
 */
export function MenuEditor({
  restaurantId,
  menuDetail,
  api,
  onMenuUpdated,
  onMenuDeleted,
  onReload,
  onItemPhotosChange,
  allowDeleteMenu = true,
  colors = MENU_EDITOR_COLORS,
  PageCard = DefaultPageCard,
  EmptyState = DefaultEmptyState,
}) {
  if (!api) {
    throw new Error("MenuEditor requires an api adapter");
  }

  const { menu, sections: initialSections, item_count } = menuDetail;
  const [sections, setSections] = useState(initialSections || []);
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgOk, setSaveMsgOk] = useState(true);

  const [pendingEdits, setPendingEdits] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);
  /** @type {[{ [id: string]: { url: string, photoId: number|null } }, Function]} */
  const [itemPhotos, setItemPhotos] = useState({});
  const [photoBusyId, setPhotoBusyId] = useState(null);

  const [newItemSection, setNewItemSection] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", section: "" });
  const [addingItem, setAddingItem] = useState(false);
  const [addItemErr, setAddItemErr] = useState("");

  const [editingMenuName, setEditingMenuName] = useState(false);
  const [menuNameDraft, setMenuNameDraft] = useState(menu.display_name || menu.name || "");
  const [menuNameSaving, setMenuNameSaving] = useState(false);

  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  const fieldStyle = buildInputStyle(colors);
  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: colors.muted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const canManagePhotos =
    typeof api.listItemPhotos === "function" && typeof api.uploadItemPhoto === "function";

  useEffect(() => {
    setSections(menuDetail.sections || []);
    setUnsaved(false);
    setPendingEdits({});
    setEditingItemId(null);
    setSaveMsg("");
    setMenuNameDraft(menuDetail.menu?.display_name || menuDetail.menu?.name || "");
  }, [menuDetail]);

  useEffect(() => {
    if (!canManagePhotos || !menu?.id || !restaurantId) {
      setItemPhotos({});
      return undefined;
    }
    let cancelled = false;
    const allItems = (menuDetail.sections || []).flatMap((s) => s.items || []);
    (async () => {
      const entries = await Promise.all(
        allItems.map(async (item) => {
          try {
            const data = await api.listItemPhotos(restaurantId, menu.id, item.id);
            const primary =
              (data?.photos || []).find((p) => p.status === "active" && p.is_primary) ||
              (data?.photos || []).find((p) => p.status === "active");
            if (!primary?.photo_url) return null;
            return [item.id, { url: primary.photo_url, photoId: primary.id ?? null }];
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const next = {};
      for (const entry of entries) {
        if (entry) next[entry[0]] = entry[1];
      }
      setItemPhotos(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [canManagePhotos, restaurantId, menu?.id, menuDetail]);

  useEffect(() => {
    if (typeof onItemPhotosChange !== "function") return;
    const urlMap = {};
    for (const [id, meta] of Object.entries(itemPhotos)) {
      if (meta?.url) urlMap[id] = meta.url;
    }
    onItemPhotosChange(urlMap);
  }, [itemPhotos, onItemPhotosChange]);

  async function handlePhotoUpload(itemId, file) {
    if (!canManagePhotos || !file || !menu?.id) return;
    setPhotoBusyId(itemId);
    setSaveMsg("");
    try {
      const json = await api.uploadItemPhoto(restaurantId, menu.id, itemId, file, {
        isPrimary: true,
      });
      const url = json?.photo?.photo_url;
      const photoId = json?.photo?.id ?? null;
      if (url) {
        setItemPhotos((prev) => ({ ...prev, [itemId]: { url, photoId } }));
        setSaveMsg("Photo saved.");
        setSaveMsgOk(true);
      }
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Photo upload failed.");
      setSaveMsgOk(false);
    } finally {
      setPhotoBusyId(null);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function handlePhotoRemove(itemId) {
    if (!canManagePhotos || !menu?.id) return;
    const meta = itemPhotos[itemId];
    if (!meta?.photoId && typeof api.deleteItemPhoto !== "function") {
      setItemPhotos((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }
    setPhotoBusyId(itemId);
    try {
      if (meta?.photoId && typeof api.deleteItemPhoto === "function") {
        await api.deleteItemPhoto(meta.photoId);
      }
      setItemPhotos((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      setSaveMsg("Photo removed.");
      setSaveMsgOk(true);
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Could not remove photo.");
      setSaveMsgOk(false);
    } finally {
      setPhotoBusyId(null);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

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
        modifier_groups: toEditorGroups(item.modifier_groups),
      },
    }));
    setEditingItemId(itemId);
    if (typeof api.getModifierGroups === "function" && menu?.id) {
      api
        .getModifierGroups(restaurantId, menu.id, itemId)
        .then((data) => {
          const groups = toEditorGroups(data?.modifier_groups);
          setPendingEdits((prev) => ({
            ...prev,
            [itemId]: {
              ...(prev[itemId] || {}),
              modifier_groups: groups,
            },
          }));
        })
        .catch(() => {});
    }
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

      const data = await api.updateItem(restaurantId, menu.id, itemId, body);

      if (typeof api.putModifierGroups === "function") {
        await api.putModifierGroups(
          restaurantId,
          menu.id,
          itemId,
          fromEditorGroups(edits.modifier_groups)
        );
      }

      if (data.ok !== false) {
        setSaveMsg("Saved.");
        setSaveMsgOk(true);
        setPendingEdits((prev) => {
          const n = { ...prev };
          delete n[itemId];
          return n;
        });
        setEditingItemId(null);
        onReload?.();
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
      await api.deleteItem(restaurantId, menu.id, itemId);
      setSaveMsg("Item deleted.");
      setSaveMsgOk(true);
      onReload?.();
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
    if (!newItem.name.trim()) {
      setAddItemErr("Item name is required.");
      return;
    }
    setAddingItem(true);
    setAddItemErr("");
    try {
      await api.addItem(restaurantId, menu.id, {
        name: newItem.name.trim(),
        description: newItem.description.trim() || null,
        price: newItem.price === "" ? null : Number(newItem.price),
        section: newItem.section.trim() || null,
      });
      setSaveMsg("Item added.");
      setSaveMsgOk(true);
      setNewItemSection(null);
      onReload?.();
    } catch (err) {
      setAddItemErr(err?.payload?.error || err?.message || "Could not add item.");
    } finally {
      setAddingItem(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function handleAddSection(e) {
    e.preventDefault();
    const sectionName = newSectionName.trim();
    if (!sectionName) return;
    setAddingSection(true);
    ensureSection(sectionName);
    setNewItemSection(sectionName);
    setNewItem({ name: "", description: "", price: "", section: sectionName });
    setNewSectionName("");
    setAddingSection(false);
  }

  function ensureSection(rawName) {
    const canonical = resolveSectionCanonical(rawName, sections.map((s) => s.name));
    if (!canonical) return null;
    setSections((prev) => {
      if (prev.some((s) => String(s.name || "").toLowerCase() === canonical.toLowerCase())) {
        return prev;
      }
      return [...prev, { name: canonical, items: [] }];
    });
    return canonical;
  }

  const sectionOptions = useMemo(
    () => deriveSectionList(sections.map((s) => s.name)),
    [sections]
  );

  async function handlePublish() {
    setSaving(true);
    setSaveMsg("");
    try {
      const data =
        menu.status === "published"
          ? await api.unpublishMenu(restaurantId, menu.id)
          : await api.publishMenu(restaurantId, menu.id);
      setSaveMsg(menu.status === "published" ? "Menu set to draft." : "Menu published.");
      setSaveMsgOk(true);
      onMenuUpdated?.(data.menu);
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Action failed.");
      setSaveMsgOk(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  }

  async function handleDeleteMenu() {
    if (!api.deleteMenu) return;
    if (!window.confirm("Delete this menu and its items? This cannot be undone.")) return;
    setSaving(true);
    try {
      await api.deleteMenu(restaurantId, menu.id);
      onMenuDeleted?.(menu.id);
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
      const data = await api.updateMenu(restaurantId, menu.id, {
        display_name: menuNameDraft.trim(),
      });
      setEditingMenuName(false);
      onMenuUpdated?.(data.menu);
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          {editingMenuName ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={menuNameDraft}
                onChange={(e) => setMenuNameDraft(e.target.value)}
                style={{ ...fieldStyle, fontSize: 18, fontWeight: 700, padding: "6px 10px" }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveMenuName();
                  if (e.key === "Escape") setEditingMenuName(false);
                }}
              />
              <button
                onClick={saveMenuName}
                disabled={menuNameSaving}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  background: colors.accent,
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {menuNameSaving ? "…" : "Save"}
              </button>
              <button
                onClick={() => setEditingMenuName(false)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  background: "#fff",
                  border: `1px solid ${colors.line}`,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: colors.ink }}>
                {menu.display_name || menu.name}
              </h2>
              <button
                onClick={() => setEditingMenuName(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.muted,
                  fontSize: 12,
                  padding: "2px 6px",
                }}
              >
                Rename
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
            <StatusChip status={menu.status} />
            <span style={{ fontSize: 12, color: colors.muted }}>{item_count} items</span>
            {menu.menu_type && (
              <span style={{ fontSize: 12, color: colors.muted }}>{menu.menu_type}</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={handlePublish}
            disabled={saving}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              background: isPublished ? "#fff" : "#15803d",
              color: isPublished ? colors.ink : "#fff",
              border: isPublished ? `1px solid ${colors.line}` : "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {isPublished ? "Set to Draft" : "Publish Menu"}
          </button>
          {allowDeleteMenu && !menu.is_primary && api.deleteMenu && (
            <button
              onClick={handleDeleteMenu}
              disabled={saving}
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                background: "#fff",
                color: "#991b1b",
                border: "1px solid #fca5a5",
                fontWeight: 700,
                fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              Delete Menu
            </button>
          )}
        </div>
      </div>

      {saveMsg && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 10,
            background: saveMsgOk ? "#f0fdf4" : "#fff1ef",
            color: saveMsgOk ? "#15803d" : "#8b2e1a",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {saveMsg}
        </div>
      )}

      {unsaved && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 10,
            background: "#fffbeb",
            color: "#92400e",
            fontWeight: 600,
            fontSize: 13,
            border: "1px solid #fde68a",
          }}
        >
          You have unsaved changes — save each edited item individually using the Save button next to
          it.
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <form onSubmit={handleAddSection} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="New section name (e.g. Appetizers)"
            style={{ ...fieldStyle, flex: 1 }}
          />
          <button
            type="submit"
            disabled={!newSectionName.trim() || addingSection}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              background: "#fff",
              border: `1px solid ${colors.line}`,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Add Section
          </button>
        </form>
      </div>

      {sections.length === 0 ? (
        <EmptyState colors={colors}>No items yet. Add a section above or add an item below.</EmptyState>
      ) : (
        sections.map((section) => (
          <SectionEditor
            key={section.name}
            section={section}
            sectionOptions={sectionOptions}
            onEnsureSection={ensureSection}
            editingItemId={editingItemId}
            pendingEdits={pendingEdits}
            saving={saving}
            colors={colors}
            fieldStyle={fieldStyle}
            labelStyle={labelStyle}
            onStartEdit={startEditItem}
            onCancelEdit={cancelEditItem}
            onUpdateEdit={updatePendingEdit}
            onSaveEdit={saveEditItem}
            onDeleteItem={handleDeleteItem}
            itemPhotos={itemPhotos}
            photoBusyId={photoBusyId}
            canManagePhotos={canManagePhotos}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
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

      {newItemSection === "" && (
        <AddItemForm
          sectionName=""
          sectionOptions={sectionOptions}
          onEnsureSection={ensureSection}
          newItem={newItem}
          onSetNewItem={setNewItem}
          addItemErr={addItemErr}
          addingItem={addingItem}
          onSubmit={handleAddItem}
          onCancel={() => setNewItemSection(null)}
          colors={colors}
          fieldStyle={fieldStyle}
          labelStyle={labelStyle}
        />
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${colors.line}`, paddingTop: 14 }}>
        <button
          type="button"
          onClick={() => openAddItem("")}
          style={{
            padding: "9px 16px",
            borderRadius: 10,
            background: "#fff",
            border: `1px solid ${colors.line}`,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          + Add Item (No Section)
        </button>
      </div>
    </PageCard>
  );
}

function SectionEditor({
  section,
  sectionOptions = [],
  onEnsureSection,
  editingItemId,
  pendingEdits,
  saving,
  colors,
  fieldStyle,
  labelStyle,
  onStartEdit,
  onCancelEdit,
  onUpdateEdit,
  onSaveEdit,
  onDeleteItem,
  itemPhotos = {},
  photoBusyId = null,
  canManagePhotos = false,
  onPhotoUpload,
  onPhotoRemove,
  newItemSection,
  newItem,
  onSetNewItem,
  addItemErr,
  addingItem,
  onOpenAddItem,
  onAddItem,
  onCancelAdd,
}) {
  const isAddingHere = newItemSection === section.name;

  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: colors.ink,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {section.name}
        </h3>
        <button
          type="button"
          onClick={() => onOpenAddItem(section.name)}
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            background: "#fff",
            border: `1px solid ${colors.line}`,
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          + Add Item
        </button>
      </div>

      {section.items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          sectionOptions={sectionOptions}
          onEnsureSection={onEnsureSection}
          isEditing={editingItemId === item.id}
          pendingEdit={pendingEdits[item.id]}
          saving={saving}
          colors={colors}
          fieldStyle={fieldStyle}
          labelStyle={labelStyle}
          onStartEdit={() => onStartEdit(item.id)}
          onCancelEdit={() => onCancelEdit(item.id)}
          onUpdateEdit={(field, value) => onUpdateEdit(item.id, field, value)}
          onSaveEdit={() => onSaveEdit(item.id)}
          onDelete={() => onDeleteItem(item.id)}
          photoUrl={itemPhotos[item.id]?.url || null}
          photoBusy={photoBusyId === item.id}
          canManagePhotos={canManagePhotos}
          onPhotoUpload={(file) => onPhotoUpload?.(item.id, file)}
          onPhotoRemove={() => onPhotoRemove?.(item.id)}
        />
      ))}

      {isAddingHere && (
        <AddItemForm
          sectionName={section.name}
          sectionOptions={sectionOptions}
          onEnsureSection={onEnsureSection}
          newItem={newItem}
          onSetNewItem={onSetNewItem}
          addItemErr={addItemErr}
          addingItem={addingItem}
          onSubmit={onAddItem}
          onCancel={onCancelAdd}
          colors={colors}
          fieldStyle={fieldStyle}
          labelStyle={labelStyle}
        />
      )}
    </div>
  );
}

function ItemRow({
  item,
  sectionOptions = [],
  onEnsureSection,
  isEditing,
  pendingEdit,
  saving,
  colors,
  fieldStyle,
  labelStyle,
  onStartEdit,
  onCancelEdit,
  onUpdateEdit,
  onSaveEdit,
  onDelete,
  photoUrl = null,
  photoBusy = false,
  canManagePhotos = false,
  onPhotoUpload,
  onPhotoRemove,
}) {
  const fileRef = useRef(null);

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onPhotoUpload?.(file);
    e.target.value = "";
  }

  const photoControls = canManagePhotos ? (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>Item photo</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            style={{
              width: 72,
              height: 54,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              border: `1px solid ${colors.line}`,
              background: "#0f1720",
            }}
          />
        ) : (
          <div
            style={{
              width: 72,
              height: 54,
              borderRadius: 8,
              background: "#f1f5f9",
              border: `1px dashed ${colors.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: colors.muted,
              flexShrink: 0,
            }}
          >
            No photo
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          <button
            type="button"
            disabled={photoBusy || saving}
            onClick={() => fileRef.current?.click()}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              background: "#fff",
              border: `1px solid ${colors.line}`,
              fontWeight: 600,
              fontSize: 12,
              cursor: photoBusy ? "not-allowed" : "pointer",
              opacity: photoBusy ? 0.6 : 1,
              width: "fit-content",
            }}
          >
            {photoBusy ? "Uploading…" : photoUrl ? "Replace photo" : "Add photo"}
          </button>
          {photoUrl ? (
            <button
              type="button"
              disabled={photoBusy || saving}
              onClick={onPhotoRemove}
              style={{
                padding: 0,
                border: "none",
                background: "none",
                color: colors.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: photoBusy ? "not-allowed" : "pointer",
                textAlign: "left",
                width: "fit-content",
              }}
            >
              Remove photo
            </button>
          ) : null}
          <span style={{ fontSize: 11, color: colors.muted }}>
            JPG, PNG, or WEBP. Cropped to fit the menu thumbnail.
          </span>
        </div>
      </div>
    </div>
  ) : null;

  if (isEditing && pendingEdit) {
    return (
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: "#f8f7f4",
          border: `1px solid ${colors.accent}`,
          marginBottom: 8,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Item Name *</label>
            <input
              value={pendingEdit.name}
              onChange={(e) => onUpdateEdit("name", e.target.value)}
              style={fieldStyle}
              placeholder="Item name"
            />
          </div>
          <div>
            <label style={labelStyle}>Price</label>
            <input
              value={pendingEdit.price}
              onChange={(e) => onUpdateEdit("price", e.target.value)}
              style={fieldStyle}
              placeholder="9.99"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={pendingEdit.description}
            onChange={(e) => onUpdateEdit("description", e.target.value)}
            style={{ ...fieldStyle, resize: "vertical", minHeight: 56, lineHeight: 1.5 }}
            placeholder="Optional description"
            rows={2}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <SectionSelect
            label="Section / Category"
            labelStyle={labelStyle}
            value={pendingEdit.section}
            options={sectionOptions}
            onChange={(v) => onUpdateEdit("section", v)}
            onCreateSection={onEnsureSection}
            fieldStyle={fieldStyle}
          />
        </div>
        {photoControls}
        <MenuItemModifiersEditor
          value={pendingEdit.modifier_groups || []}
          onChange={(next) => onUpdateEdit("modifier_groups", next)}
          compact
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSaveEdit}
            disabled={saving}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: colors.accent,
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save Item"}
          </button>
          <button
            onClick={onCancelEdit}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#fff",
              border: `1px solid ${colors.line}`,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "10px 14px",
        borderRadius: 10,
        border: `1px solid ${colors.line}`,
        marginBottom: 6,
        background: "#fff",
        gap: 12,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            objectFit: "cover",
            flexShrink: 0,
            background: "#0f1720",
          }}
        />
      ) : canManagePhotos ? (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            background: "#f1f5f9",
            flexShrink: 0,
            border: `1px dashed ${colors.line}`,
          }}
        />
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
        {item.description && (
          <div
            style={{
              fontSize: 12,
              color: colors.muted,
              marginTop: 2,
              whiteSpace: "pre-wrap",
            }}
          >
            {item.description}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12, color: colors.muted }}>
          {item.price != null && (
            <span style={{ fontWeight: 600, color: colors.ink }}>
              ${Number(item.price).toFixed(2)}
            </span>
          )}
          {item.section && <span>{item.section}</span>}
          {item.item_number && <span style={{ opacity: 0.6 }}>{item.item_number}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onStartEdit}
          style={{
            padding: "5px 10px",
            borderRadius: 7,
            background: "#fff",
            border: `1px solid ${colors.line}`,
            fontWeight: 600,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "5px 10px",
            borderRadius: 7,
            background: "#fff",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            fontWeight: 600,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function AddItemForm({
  sectionName,
  sectionOptions = [],
  onEnsureSection,
  newItem,
  onSetNewItem,
  addItemErr,
  addingItem,
  onSubmit,
  onCancel,
  colors,
  fieldStyle,
  labelStyle,
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        marginBottom: 8,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 12, color: "#15803d", marginBottom: 10 }}>
        New item{sectionName ? ` in "${sectionName}"` : ""}
      </div>
      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              value={newItem.name}
              onChange={(e) => onSetNewItem((p) => ({ ...p, name: e.target.value }))}
              style={fieldStyle}
              placeholder="Item name"
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Price</label>
            <input
              value={newItem.price}
              onChange={(e) => onSetNewItem((p) => ({ ...p, price: e.target.value }))}
              style={fieldStyle}
              placeholder="9.99"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Description</label>
          <input
            value={newItem.description}
            onChange={(e) => onSetNewItem((p) => ({ ...p, description: e.target.value }))}
            style={fieldStyle}
            placeholder="Optional"
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <SectionSelect
            label="Section"
            labelStyle={labelStyle}
            value={newItem.section}
            options={sectionOptions}
            onChange={(v) => onSetNewItem((p) => ({ ...p, section: v }))}
            onCreateSection={onEnsureSection}
            fieldStyle={fieldStyle}
          />
        </div>
        {addItemErr && <div style={{ marginBottom: 8, fontSize: 12, color: "#991b1b" }}>{addItemErr}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={addingItem}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "#15803d",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: addingItem ? "not-allowed" : "pointer",
            }}
          >
            {addingItem ? "Adding…" : "Add Item"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#fff",
              border: `1px solid ${colors.line}`,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default MenuEditor;
