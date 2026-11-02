/**
 * "Applies to" block on each modifier group card in the owner item editor (Andre, 2026-10-23):
 * This item only · Every item in <section> · Selected items — plus the list of items the group
 * will be on, so "one salad or all salads?" is answered on screen.
 */
import React, { useState } from "react";
import { describeScope, isSharedScope, normalizeScope, scopeItems } from "./modifierScopeModel.js";

const CHOICE = (active) => ({
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  border: active ? "1.5px solid #1F4E3D" : "1.5px solid #dbe3eb",
  background: active ? "#1F4E3D" : "#fff",
  color: active ? "#fff" : "#475467",
});

export default function ModifierGroupScopeControl({ group, scope, onChange }) {
  const { itemId, itemSection, menuItems = [], sections = [] } = scope;
  const current = normalizeScope(group.applies_to);
  const [pickerOpen, setPickerOpen] = useState(false);
  const onItems = scopeItems(group, { itemId, menuItems });
  const shared = isSharedScope(current);
  const sectionChoices = sections.length ? sections : itemSection ? [itemSection] : [];
  const defaultSection = current.section || itemSection || sectionChoices[0] || "";
  const leavesThisItem =
    current.type === "section" &&
    String(current.section || "").trim().toLowerCase() !== String(itemSection || "").trim().toLowerCase();

  function setType(type) {
    if (type === "section") onChange({ applies_to: { type: "section", section: defaultSection } });
    else if (type === "items") onChange({ applies_to: { type: "items" }, item_ids: group.item_ids?.length ? group.item_ids : [Number(itemId)] });
    else onChange({ applies_to: { type: "item" } });
  }

  function togglePicked(id) {
    const ids = new Set((group.item_ids || []).map(Number));
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    ids.add(Number(itemId));
    onChange({ item_ids: [...ids] });
  }

  const bySection = new Map();
  for (const it of menuItems) {
    const key = it.section || "No section";
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key).push(it);
  }

  return (
    <div
      data-testid="modifier-group-scope"
      style={{ borderRadius: 8, background: shared ? "#eef6f1" : "#f4f6f8", padding: "10px 12px", display: "grid", gap: 8 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#5b6675", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>
          Applies to
        </span>
        <button type="button" style={CHOICE(current.type === "item")} onClick={() => setType("item")} aria-pressed={current.type === "item"}>
          This item only
        </button>
        <button
          type="button"
          style={CHOICE(current.type === "section")}
          onClick={() => setType("section")}
          aria-pressed={current.type === "section"}
          disabled={!sectionChoices.length}
        >
          Every item in {current.type === "section" ? current.section : defaultSection || "a section"}
        </button>
        <button type="button" style={CHOICE(current.type === "items")} onClick={() => setType("items")} aria-pressed={current.type === "items"}>
          Selected items
        </button>
      </div>

      {current.type === "section" && sectionChoices.length > 1 ? (
        <label style={{ fontSize: 12, color: "#475467", display: "flex", alignItems: "center", gap: 6 }}>
          Section
          <select
            value={current.section}
            onChange={(e) => onChange({ applies_to: { type: "section", section: e.target.value } })}
            style={{ border: "1.5px solid #dbe3eb", borderRadius: 8, padding: "4px 8px", fontSize: 12, fontFamily: "inherit" }}
          >
            {sectionChoices.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {current.type === "items" ? (
        <div>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            style={{ ...CHOICE(false), padding: "4px 10px" }}
            aria-expanded={pickerOpen}
          >
            {pickerOpen ? "Done choosing" : "Choose items"}
          </button>
          {pickerOpen ? (
            <div style={{ marginTop: 8, maxHeight: 220, overflowY: "auto", display: "grid", gap: 8, background: "#fff", borderRadius: 8, padding: 10, border: "1px solid #dbe3eb" }}>
              {[...bySection.entries()].map(([section, items]) => (
                <div key={section}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#5b6675", textTransform: "uppercase", marginBottom: 4 }}>{section}</div>
                  {items.map((it) => {
                    const self = Number(it.id) === Number(itemId);
                    return (
                      <label key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0", color: "#0f1720" }}>
                        <input
                          type="checkbox"
                          checked={self || (group.item_ids || []).map(Number).includes(Number(it.id))}
                          disabled={self}
                          onChange={() => togglePicked(Number(it.id))}
                        />
                        {it.name}
                        {self ? <span style={{ fontSize: 11, color: "#8a9ab0" }}>(this item)</span> : null}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div data-testid="modifier-group-scope-items" style={{ fontSize: 12, color: "#344054", lineHeight: 1.5 }}>
        <strong>{describeScope(group, { itemId, menuItems })}</strong>
        {onItems.length ? <>: {onItems.map((it) => it.name).join(" · ")}</> : null}
      </div>
      {shared ? (
        <div style={{ fontSize: 11, color: "#1F4E3D" }}>
          Changing options or prices here changes them on all {onItems.length} items.
          {current.type === "section" ? " Items added to this section later get it too." : ""}
        </div>
      ) : null}
      {leavesThisItem ? (
        <div style={{ fontSize: 11, color: "#b54708", fontWeight: 700 }}>
          This item is not in {current.section}, so saving takes the group off this item.
        </div>
      ) : null}
    </div>
  );
}
