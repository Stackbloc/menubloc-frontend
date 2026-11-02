/**
 * Menu Editor overview (Andre, 2026-10-23): every modifier group on this menu, where it applies
 * (this item only / every item in a section / selected items) and the exact items it is on.
 * Tap an item to open it; scope and options are edited inside the item.
 */
import React, { useState } from "react";

function scopeLabel(entry) {
  const scope = entry.applies_to || { type: "item" };
  if (scope.type === "section") return `Every item in ${scope.section}`;
  if (scope.type === "items") return "Selected items";
  return "This item only";
}

export default function MenuModifierGroupsOverview({ index, colors = {}, onEditItem }) {
  const [open, setOpen] = useState(true);
  const groups = Array.isArray(index?.groups) ? index.groups : [];
  if (!groups.length) return null;
  const shared = groups.filter((g) => g.applies_to?.type !== "item");
  const single = groups.filter((g) => g.applies_to?.type === "item");
  const ordered = [...shared, ...single];

  return (
    <section
      data-testid="menu-modifier-groups-overview"
      style={{ marginBottom: 18, border: `1px solid ${colors.line || "#e4e9f0"}`, borderRadius: 12, background: "#fbfcfb" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "12px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
      >
        <span>
          <span style={{ fontSize: 14, fontWeight: 800, color: colors.ink || "#0f1720" }}>Modifier groups on this menu</span>
          <span style={{ display: "block", fontSize: 12, color: colors.muted || "#667085", marginTop: 2 }}>
            {groups.length} {groups.length === 1 ? "group" : "groups"} · {shared.length} shared across items
          </span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 12, color: colors.muted || "#667085" }}>{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div style={{ padding: "0 14px 12px", display: "grid", gap: 8 }}>
          {ordered.map((entry) => {
            const isShared = entry.applies_to?.type !== "item";
            return (
              <div
                key={entry.key}
                data-testid="menu-modifier-group-row"
                style={{ background: "#fff", border: "1px solid #e4e9f0", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 6 }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 14, color: "#0f1720" }}>{entry.group?.name}</strong>
                  <span style={{ fontSize: 11, fontWeight: 700, color: entry.group?.required ? "#b42318" : "#475467" }}>
                    {entry.group?.required ? "Required" : "Optional"} · {(entry.group?.options || []).length} options
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: "3px 9px",
                      background: isShared ? "#1F4E3D" : "#eef1f4",
                      color: isShared ? "#fff" : "#475467",
                    }}
                  >
                    {scopeLabel(entry)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#475467", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span>On {entry.items.length} {entry.items.length === 1 ? "item" : "items"}:</span>
                  {entry.items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => onEditItem?.(it.id)}
                      style={{ border: "1px solid #dbe3eb", background: "#fff", borderRadius: 999, padding: "2px 9px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#0f1720" }}
                    >
                      {it.name}
                    </button>
                  ))}
                </div>
                {entry.missing_items?.length ? (
                  <div style={{ fontSize: 12, color: "#b54708" }}>
                    Not on yet (added to {entry.applies_to.section} later): {entry.missing_items.map((it) => it.name).join(", ")} — open
                    the group in any of its items and save to add it.
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
