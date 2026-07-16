/**
 * Menu Worksheet — simple post-parse menu editor (not a spreadsheet).
 * Columns: Menu Item, Section, Description, Price A/B/C, Menuply Price.
 */

import React, { useMemo, useState } from "react";
import {
  applyBulkPriceOp,
  deriveSectionList,
  resolveSectionCanonical,
} from "../../lib/menuWorksheetHelpers.js";

export const WORKSHEET_COLUMNS = [
  "Menu Item",
  "Section",
  "Description",
  "Price A",
  "Price B",
  "Price C",
  "Menuply Price",
];

const COLORS = {
  ink: "#0f1720",
  muted: "#64748b",
  line: "#e2e8f0",
  panel: "#ffffff",
  accent: "#0f766e",
  warn: "#b45309",
  warnBg: "#fffbeb",
};

function moneyInput(value, onChange) {
  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={value == null || value === "" ? "" : value}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? null : Number(v));
      }}
      style={cellInputStyle}
    />
  );
}

const cellInputStyle = {
  width: "100%",
  padding: "6px 8px",
  border: `1px solid ${COLORS.line}`,
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "inherit",
  boxSizing: "border-box",
  background: "#fff",
  color: COLORS.ink,
};

/**
 * @param {object} props
 * @param {object[]} props.rows
 * @param {string[]} props.sections
 * @param {(rows: object[], sections: string[]) => void} props.onChange
 * @param {() => void} props.onSave
 * @param {() => void} props.onPublish
 * @param {boolean} [props.saving]
 * @param {boolean} [props.publishing]
 * @param {boolean} [props.dirty]
 * @param {string|null} [props.sourcePdfUrl]
 * @param {string|null} [props.lastSavedAt]
 * @param {string|null} [props.lastPublishedAt]
 * @param {string} [props.menuName]
 */
export default function MenuWorksheet({
  rows,
  sections,
  onChange,
  onSave,
  onPublish,
  saving = false,
  publishing = false,
  dirty = false,
  sourcePdfUrl = null,
  lastSavedAt = null,
  lastPublishedAt = null,
  menuName = "Menu",
}) {
  const [selected, setSelected] = useState(() => new Set());
  const [bulkAmount, setBulkAmount] = useState("5");
  const [scope, setScope] = useState("all"); // all | selected
  const [showSource, setShowSource] = useState(false);
  const [sectionDrafts, setSectionDrafts] = useState({}); // rowId -> typed value while creating

  const sectionOptions = useMemo(() => {
    const fromRows = deriveSectionList([
      ...sections,
      ...rows.map((r) => r.section_name),
      ...Object.values(sectionDrafts),
    ]);
    return fromRows;
  }, [sections, rows, sectionDrafts]);

  function updateRow(id, patch) {
    const next = rows.map((r) => (Number(r.id) === Number(id) ? { ...r, ...patch } : r));
    const nextSections = deriveSectionList(next.map((r) => r.section_name));
    onChange(next, nextSections);
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => Number(r.id))));
  }

  function runBulk(mode) {
    const amount = Number(bulkAmount);
    const rowIds =
      scope === "selected" && selected.size > 0 ? Array.from(selected) : null;
    const next = applyBulkPriceOp(rows, { mode, amount, rowIds });
    onChange(next, deriveSectionList(next.map((r) => r.section_name)));
  }

  function handlePublishClick() {
    if (dirty) {
      const ok = window.confirm(
        "You have unsaved worksheet edits. Save and update the Menuply menu now?"
      );
      if (!ok) return;
    }
    onPublish();
  }

  const statusLabel = lastPublishedAt
    ? dirty
      ? "Worksheet edited — Menuply not updated yet"
      : "Menuply menu updated"
    : lastSavedAt
      ? dirty
        ? "Unsaved changes"
        : "Worksheet saved — Menuply not updated yet"
      : dirty
        ? "Unsaved changes"
        : "Review parsed menu";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: "-0.02em" }}>
            Menu Worksheet
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>
            {menuName} — edit items, then save. Update Menuply only when ready.
          </div>
          <div
            style={{
              marginTop: 8,
              display: "inline-block",
              fontSize: 12,
              fontWeight: 600,
              color: lastPublishedAt && !dirty ? "#15803d" : COLORS.warn,
              background: lastPublishedAt && !dirty ? "#f0fdf4" : COLORS.warnBg,
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            {statusLabel}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || publishing}
            style={btnSecondary}
            data-testid="worksheet-save"
          >
            {saving ? "Saving…" : "Save Worksheet"}
          </button>
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={saving || publishing}
            style={btnPrimary}
            data-testid="worksheet-publish"
          >
            {publishing ? "Updating…" : "Update Menuply Menu"}
          </button>
        </div>
      </header>

      {sourcePdfUrl ? (
        <div style={{ fontSize: 13 }}>
          <button
            type="button"
            onClick={() => setShowSource((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: COLORS.muted,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              fontSize: 13,
            }}
          >
            {showSource ? "Hide original upload" : "View original upload"}
          </button>
          {showSource ? (
            <div style={{ marginTop: 8 }}>
              <a href={sourcePdfUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.accent }}>
                Open source file
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          padding: 12,
          background: "#f8fafc",
          border: `1px solid ${COLORS.line}`,
          borderRadius: 10,
        }}
        data-testid="worksheet-bulk-toolbar"
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted }}>Prices</span>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          style={{ ...cellInputStyle, width: "auto" }}
          aria-label="Bulk scope"
        >
          <option value="all">All rows</option>
          <option value="selected">Selected rows</option>
        </select>
        <input
          type="number"
          value={bulkAmount}
          onChange={(e) => setBulkAmount(e.target.value)}
          style={{ ...cellInputStyle, width: 72 }}
          aria-label="Bulk amount"
        />
        <button type="button" style={btnTiny} onClick={() => runBulk("increase_pct")}>
          Increase %
        </button>
        <button type="button" style={btnTiny} onClick={() => runBulk("decrease_pct")}>
          Decrease %
        </button>
        <button type="button" style={btnTiny} onClick={() => runBulk("increase_dollar")}>
          Increase $
        </button>
        <button type="button" style={btnTiny} onClick={() => runBulk("decrease_dollar")}>
          Decrease $
        </button>
        <button type="button" style={btnTiny} onClick={() => runBulk("copy_a_to_menuply")}>
          Copy A → Menuply
        </button>
        <button type="button" style={btnTiny} onClick={() => runBulk("copy_b_to_menuply")}>
          Copy B → Menuply
        </button>
        <button type="button" style={btnTiny} onClick={() => runBulk("copy_c_to_menuply")}>
          Copy C → Menuply
        </button>
      </div>

      <div style={{ overflowX: "auto", border: `1px solid ${COLORS.line}`, borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={thStyle}>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
              {WORKSHEET_COLUMNS.map((col) => (
                <th key={col} style={thStyle}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 24, color: COLORS.muted, textAlign: "center" }}>
                  No items yet. Re-upload a menu or add items after publish.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = Number(row.id);
                const warnings = Array.isArray(row.warning_flags) ? row.warning_flags : [];
                return (
                  <tr key={id} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleSelect(id)}
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={row.item_name || ""}
                        onChange={(e) => updateRow(id, { item_name: e.target.value })}
                        style={cellInputStyle}
                        aria-label="Menu item"
                      />
                      {warnings.length > 0 ? (
                        <div style={{ fontSize: 11, color: COLORS.warn, marginTop: 4 }}>
                          {warnings.map((w) => w.replace(/_/g, " ")).join(" · ")}
                        </div>
                      ) : null}
                    </td>
                    <td style={tdStyle}>
                      <SectionCell
                        value={row.section_name || ""}
                        options={sectionOptions}
                        draft={sectionDrafts[id] ?? ""}
                        onDraftChange={(v) =>
                          setSectionDrafts((prev) => ({ ...prev, [id]: v }))
                        }
                        onCommit={(raw) => {
                          const canonical = resolveSectionCanonical(raw, sectionOptions);
                          updateRow(id, { section_name: canonical });
                          setSectionDrafts((prev) => {
                            const n = { ...prev };
                            delete n[id];
                            return n;
                          });
                        }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <textarea
                        value={row.description || ""}
                        onChange={(e) => updateRow(id, { description: e.target.value })}
                        rows={2}
                        style={{ ...cellInputStyle, resize: "vertical" }}
                        aria-label="Description"
                      />
                    </td>
                    <td style={tdStyle}>{moneyInput(row.price_a, (v) => updateRow(id, { price_a: v }))}</td>
                    <td style={tdStyle}>{moneyInput(row.price_b, (v) => updateRow(id, { price_b: v }))}</td>
                    <td style={tdStyle}>{moneyInput(row.price_c, (v) => updateRow(id, { price_c: v }))}</td>
                    <td style={tdStyle}>
                      {moneyInput(row.menuply_price, (v) => updateRow(id, { menuply_price: v }))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionCell({ value, options, draft, onDraftChange, onCommit }) {
  const [mode, setMode] = useState("select"); // select | create

  if (mode === "create") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <input
          autoFocus
          value={draft}
          placeholder="New section name"
          onChange={(e) => onDraftChange(e.target.value)}
          onBlur={() => {
            if (String(draft || "").trim()) onCommit(draft);
            setMode("select");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (String(draft || "").trim()) onCommit(draft);
              setMode("select");
            }
            if (e.key === "Escape") setMode("select");
          }}
          style={cellInputStyle}
          aria-label="New section"
        />
        <button type="button" style={btnLink} onClick={() => setMode("select")}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <select
        value={value || ""}
        onChange={(e) => {
          if (e.target.value === "__new__") {
            setMode("create");
            onDraftChange("");
            return;
          }
          onCommit(e.target.value);
        }}
        style={cellInputStyle}
        aria-label="Section"
      >
        <option value="">—</option>
        {options.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        <option value="__new__">+ New section…</option>
      </select>
    </div>
  );
}

const thStyle = {
  padding: "10px 8px",
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.muted,
  whiteSpace: "nowrap",
};

const tdStyle = { padding: "8px 6px", verticalAlign: "top" };

const btnPrimary = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: COLORS.accent,
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const btnSecondary = {
  padding: "10px 16px",
  borderRadius: 10,
  border: `1px solid ${COLORS.line}`,
  background: "#fff",
  color: COLORS.ink,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const btnTiny = {
  padding: "6px 10px",
  borderRadius: 8,
  border: `1px solid ${COLORS.line}`,
  background: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  color: COLORS.ink,
};

const btnLink = {
  background: "none",
  border: "none",
  color: COLORS.muted,
  fontSize: 11,
  cursor: "pointer",
  padding: 0,
  textAlign: "left",
};
