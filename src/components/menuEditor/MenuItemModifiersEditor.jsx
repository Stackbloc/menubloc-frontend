/**
 * Shared authoring UI for menu-item modifier groups (Size, Add-ons, etc.).
 * Used by Menu Lab ItemForm, SharedMenuEditor, and Menu Worksheet row drawer.
 */
import React, { useState } from "react";

const INPUT = {
  border: "1.5px solid #dbe3eb",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
  color: "#0f1720",
  boxSizing: "border-box",
};

const BTN = (variant = "muted") => {
  const base = {
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    border: "1.5px solid #dbe3eb",
  };
  if (variant === "primary") {
    return { ...base, background: "#1F4E3D", color: "#fff", borderColor: "#1F4E3D" };
  }
  if (variant === "danger") {
    return { ...base, background: "#fff", color: "#b91c1c", borderColor: "#fecaca" };
  }
  return { ...base, background: "#fff", color: "#475467" };
};

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function dollarsFromCents(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "0.00";
  return (n / 100).toFixed(2);
}

function centsFromDollarsInput(value) {
  const raw = String(value ?? "").trim().replace(/[^0-9.-]/g, "");
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Normalize API/editor groups into editable local shape. */
export function toEditorGroups(groups) {
  const source = Array.isArray(groups) ? groups : [];
  return source.map((group, gi) => {
    const options = Array.isArray(group.options)
      ? group.options
      : Array.isArray(group.choices)
        ? group.choices
        : Array.isArray(group.modifiers)
          ? group.modifiers
          : [];
    const min = Number(
      group.min_selections ?? group.minSelections ?? group.min ?? (group.required ? 1 : 0)
    );
    const max = Number(
      group.max_selections ?? group.maxSelections ?? group.max ?? (options.length > 1 ? 1 : Math.max(options.length, 1))
    );
    return {
      id: String(group.id || group.group_id || group.groupId || newId("group")),
      name: String(group.name || group.label || `Group ${gi + 1}`),
      required: Boolean(group.required || group.is_required || min > 0),
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 1,
      options: options.map((opt, oi) => ({
        id: String(opt.id || opt.option_id || opt.optionId || newId("opt")),
        name: String(opt.name || opt.label || `Option ${oi + 1}`),
        price_delta_cents: Number(
          opt.price_delta_cents ??
            opt.priceDeltaCents ??
            opt.price_cents ??
            (opt.price_delta != null ? Math.round(Number(opt.price_delta) * 100) : 0) ??
            0
        ) || 0,
        disabled: opt.disabled === true || opt.is_active === false,
      })),
    };
  });
}

/** Serialize editor state for API. */
export function fromEditorGroups(groups) {
  return (Array.isArray(groups) ? groups : [])
    .filter((g) => g && String(g.name || "").trim())
    .map((g) => {
      const options = (Array.isArray(g.options) ? g.options : [])
        .filter((o) => o && String(o.name || "").trim() && !o.disabled)
        .map((o) => ({
          id: o.id || newId("opt"),
          name: String(o.name).trim(),
          price_delta_cents: Number.isFinite(Number(o.price_delta_cents))
            ? Math.round(Number(o.price_delta_cents))
            : 0,
        }));
      if (!options.length) return null;
      const required = Boolean(g.required);
      let min = Number(g.min);
      let max = Number(g.max);
      if (!Number.isFinite(min)) min = required ? 1 : 0;
      if (!Number.isFinite(max)) max = required ? 1 : options.length;
      min = Math.max(0, Math.min(Math.floor(min), options.length));
      max = Math.max(min, Math.min(Math.floor(max), options.length));
      return {
        id: g.id || newId("group"),
        name: String(g.name).trim(),
        required: required || min > 0,
        min,
        max,
        min_selections: min,
        max_selections: max,
        options,
      };
    })
    .filter(Boolean);
}

/**
 * @param {object} props
 * @param {object[]} props.value — editor groups (use toEditorGroups on load)
 * @param {(next: object[]) => void} props.onChange
 * @param {boolean} [props.compact]
 */
export default function MenuItemModifiersEditor({ value = [], onChange, compact = false }) {
  const groups = Array.isArray(value) ? value : [];

  function setGroups(next) {
    onChange?.(next);
  }

  function updateGroup(groupId, patch) {
    setGroups(groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  }

  function updateOption(groupId, optionId, patch) {
    setGroups(
      groups.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              options: g.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
            }
      )
    );
  }

  function addGroup() {
    setGroups([
      ...groups,
      {
        id: newId("group"),
        name: "",
        required: false,
        min: 0,
        max: 1,
        options: [{ id: newId("opt"), name: "", price_delta_cents: 0, disabled: false }],
      },
    ]);
  }

  function addOption(groupId) {
    setGroups(
      groups.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              options: [
                ...g.options,
                { id: newId("opt"), name: "", price_delta_cents: 0, disabled: false },
              ],
              max: Math.max(Number(g.max) || 1, g.options.length + 1),
            }
      )
    );
  }

  function moveGroup(index, dir) {
    const next = [...groups];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setGroups(next);
  }

  function moveOption(groupId, index, dir) {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const opts = [...g.options];
        const j = index + dir;
        if (j < 0 || j >= opts.length) return g;
        [opts[index], opts[j]] = [opts[j], opts[index]];
        return { ...g, options: opts };
      })
    );
  }

  return (
    <div
      data-testid="menu-item-modifiers-editor"
      style={{
        marginTop: compact ? 8 : 12,
        padding: compact ? 10 : 14,
        borderRadius: 10,
        border: "1px solid #e4e9f0",
        background: "#f8faf9",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f1720" }}>Modifiers</div>
          <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 2 }}>
            Add-ons (Extra cheese) or required Size (Small / Medium / Large) with extra prices.
          </div>
        </div>
        <button type="button" style={BTN("primary")} onClick={addGroup} data-testid="add-modifier-group">
          + Add group
        </button>
      </div>

      {groups.length === 0 ? (
        <div style={{ fontSize: 12, color: "#8a9ab0" }}>
          No modifiers yet. Customers add this item at the base price only.
        </div>
      ) : null}

      {groups.map((group, gi) => (
        <div
          key={group.id}
          data-testid="modifier-group-card"
          style={{
            background: "#fff",
            border: "1px solid #dbe3eb",
            borderRadius: 10,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>
                Group name
              </label>
              <input
                style={{ ...INPUT, width: "100%" }}
                value={group.name}
                placeholder="e.g. Size or Add-ons"
                onChange={(e) => updateGroup(group.id, { name: e.target.value })}
              />
            </div>
            <label style={{ fontSize: 12, color: "#0f1720", display: "flex", alignItems: "center", gap: 6, paddingBottom: 8 }}>
              <input
                type="checkbox"
                checked={Boolean(group.required)}
                onChange={(e) => {
                  const required = e.target.checked;
                  updateGroup(group.id, {
                    required,
                    min: required ? Math.max(1, Number(group.min) || 1) : 0,
                    max: required ? Math.max(1, Number(group.max) || 1) : Math.max(1, Number(group.max) || group.options.length),
                  });
                }}
              />
              Required
            </label>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Min</label>
              <input
                type="number"
                min={0}
                style={{ ...INPUT, width: 64 }}
                value={group.min}
                onChange={(e) => updateGroup(group.id, { min: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Max</label>
              <input
                type="number"
                min={0}
                style={{ ...INPUT, width: 64 }}
                value={group.max}
                onChange={(e) => updateGroup(group.id, { max: Number(e.target.value) })}
              />
            </div>
            <button type="button" style={BTN("muted")} onClick={() => moveGroup(gi, -1)} disabled={gi === 0}>
              ↑
            </button>
            <button type="button" style={BTN("muted")} onClick={() => moveGroup(gi, 1)} disabled={gi === groups.length - 1}>
              ↓
            </button>
            <button
              type="button"
              style={BTN("danger")}
              onClick={() => setGroups(groups.filter((g) => g.id !== group.id))}
            >
              Delete group
            </button>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "#5b6675" }}>Options</div>
          {(group.options || []).map((opt, oi) => (
            <div
              key={opt.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px auto auto auto auto",
                gap: 8,
                alignItems: "center",
                opacity: opt.disabled ? 0.5 : 1,
              }}
            >
              <input
                style={INPUT}
                value={opt.name}
                placeholder="e.g. Extra cheese or Large"
                onChange={(e) => updateOption(group.id, opt.id, { name: e.target.value })}
              />
              <input
                style={INPUT}
                type="number"
                step="0.01"
                min="0"
                value={dollarsFromCents(opt.price_delta_cents)}
                aria-label="Additional price"
                onChange={(e) =>
                  updateOption(group.id, opt.id, {
                    price_delta_cents: centsFromDollarsInput(e.target.value),
                  })
                }
              />
              <label style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                <input
                  type="checkbox"
                  checked={Boolean(opt.disabled)}
                  onChange={(e) => updateOption(group.id, opt.id, { disabled: e.target.checked })}
                />{" "}
                Off
              </label>
              <button type="button" style={BTN("muted")} onClick={() => moveOption(group.id, oi, -1)} disabled={oi === 0}>
                ↑
              </button>
              <button
                type="button"
                style={BTN("muted")}
                onClick={() => moveOption(group.id, oi, 1)}
                disabled={oi === group.options.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                style={BTN("danger")}
                onClick={() =>
                  updateGroup(group.id, {
                    options: group.options.filter((o) => o.id !== opt.id),
                  })
                }
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" style={{ ...BTN("muted"), alignSelf: "flex-start" }} onClick={() => addOption(group.id)}>
            + Add option
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Simple modal/drawer wrapper for worksheet row editing.
 */
export function ModifierGroupsDrawer({
  open,
  title,
  groups,
  onChange,
  onSave,
  onClose,
  busy = false,
}) {
  if (!open) return null;
  return (
    <div
      data-testid="modifier-groups-drawer"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,32,0.45)",
        zIndex: 80,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(480px, 100%)",
          height: "100%",
          background: "#fff",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
          padding: 20,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1720" }}>{title || "Modifiers"}</div>
          <button type="button" style={BTN("muted")} onClick={onClose}>
            Close
          </button>
        </div>
        <MenuItemModifiersEditor value={groups} onChange={onChange} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" style={BTN("muted")} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" style={BTN("primary")} onClick={onSave} disabled={busy} data-testid="save-modifier-groups">
            {busy ? "Saving…" : "Save modifiers"}
          </button>
        </div>
      </div>
    </div>
  );
}
