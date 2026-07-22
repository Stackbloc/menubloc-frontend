/**
 * Menu Worksheet — simple post-parse menu editor (not a spreadsheet).
 * Columns: Menu Item, Section, Description, Price A/B/C, Menuply Price.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  applyBulkPriceOp,
  buildWorksheetWarningFlags,
  deriveSectionList,
  readPriceAltLabels,
  resolveBulkPriceField,
  resolveSectionCanonical,
  writePriceAltLabels,
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

function moneyInput(value, onChange, { onBlur } = {}) {
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
      onBlur={onBlur}
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
 * @param {number|null} [props.restaurantId]
 * @param {number|null} [props.menuId]
 * @param {{price_a?:string,price_b?:string,price_c?:string}|null} [props.priceAltLabels]
 * @param {(labels: {price_a:string,price_b:string,price_c:string}) => void} [props.onPriceAltLabelsChange]
 * @param {string[]} [props.priceWarnings] — red save-time price drift messages
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
  restaurantId = null,
  menuId = null,
  priceAltLabels = null,
  onPriceAltLabelsChange = null,
  priceWarnings = [],
}) {
  const [bulkAmount, setBulkAmount] = useState("5");
  /** all | row_a | row_b | row_c */
  const [scope, setScope] = useState("all");
  const [showSource, setShowSource] = useState(false);
  const [sectionDrafts, setSectionDrafts] = useState({});
  const [localPriceAlts, setLocalPriceAlts] = useState(() =>
    readPriceAltLabels(restaurantId, menuId)
  );
  const priceAlts = priceAltLabels != null ? priceAltLabels : localPriceAlts;
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  /** Coalesce per-keystroke edits into one undo step: `${rowId}:${field}` */
  const editingCellRef = useRef(null);

  useEffect(() => {
    if (priceAltLabels == null) {
      setLocalPriceAlts(readPriceAltLabels(restaurantId, menuId));
    }
    undoStackRef.current = [];
    redoStackRef.current = [];
    editingCellRef.current = null;
    setCanUndo(false);
    setCanRedo(false);
  }, [restaurantId, menuId]); // eslint-disable-line react-hooks/exhaustive-deps -- only reset history on worksheet identity change


  const sectionOptions = useMemo(() => {
    const fromRows = deriveSectionList([
      ...sections,
      ...rows.map((r) => r.section_name),
      ...Object.values(sectionDrafts),
    ]);
    return fromRows;
  }, [sections, rows, sectionDrafts]);

  function snapshotState() {
    return {
      rows: JSON.parse(JSON.stringify(rows)),
      sections: [...sections],
    };
  }

  function pushUndoSnapshot(snapshot) {
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 40) undoStackRef.current.shift();
    setCanUndo(true);
  }

  function clearRedo() {
    redoStackRef.current = [];
    setCanRedo(false);
  }

  function endCellEdit() {
    editingCellRef.current = null;
  }

  /**
   * Push history once per focused cell edit session so undo restores the
   * entire previous cell value (not each keystroke/digit).
   */
  function ensureHistoryForCell(rowId, field) {
    const key = `${rowId}:${field}`;
    if (editingCellRef.current === key) return;
    editingCellRef.current = key;
    pushUndoSnapshot(snapshotState());
    clearRedo();
  }

  function applyRows(nextRows, nextSections) {
    onChange(nextRows, nextSections);
  }

  function handleUndo() {
    const prev = undoStackRef.current.pop();
    if (!prev) {
      setCanUndo(false);
      return;
    }
    editingCellRef.current = null;
    redoStackRef.current.push(snapshotState());
    setCanRedo(true);
    setCanUndo(undoStackRef.current.length > 0);
    applyRows(prev.rows, prev.sections);
  }

  function handleRedo() {
    const next = redoStackRef.current.pop();
    if (!next) {
      setCanRedo(false);
      return;
    }
    editingCellRef.current = null;
    pushUndoSnapshot(snapshotState());
    setCanRedo(redoStackRef.current.length > 0);
    applyRows(next.rows, next.sections);
  }

  /** Immediate commit (bulk tools, section picks) — one undo step. */
  function commitChange(nextRows, nextSections) {
    editingCellRef.current = null;
    pushUndoSnapshot(snapshotState());
    clearRedo();
    applyRows(nextRows, nextSections);
  }

  function updateRow(id, patch, fieldKey = null) {
    const field = fieldKey || Object.keys(patch)[0] || "cell";
    ensureHistoryForCell(id, field);
    const next = rows.map((r) => {
      if (Number(r.id) !== Number(id)) return r;
      const merged = { ...r, ...patch };
      return { ...merged, warning_flags: buildWorksheetWarningFlags(merged) };
    });
    const nextSections = deriveSectionList(next.map((r) => r.section_name));
    applyRows(next, nextSections);
  }

  function runBulk(mode) {
    const amount = Number(bulkAmount);
    const priceField = resolveBulkPriceField(scope);
    const next = applyBulkPriceOp(rows, { mode, amount, priceField }).map((r) => ({
      ...r,
      warning_flags: buildWorksheetWarningFlags(r),
    }));
    commitChange(next, deriveSectionList(next.map((r) => r.section_name)));
  }

  function updatePriceAlt(key, value) {
    const next = { ...priceAlts, [key]: value };
    writePriceAltLabels(restaurantId, menuId, next);
    if (typeof onPriceAltLabelsChange === "function") {
      onPriceAltLabelsChange(next);
    } else {
      setLocalPriceAlts(next);
    }
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo || saving || publishing}
            style={btnIcon}
            data-testid="worksheet-undo"
            aria-label="Undo"
            title="Undo"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo || saving || publishing}
            style={btnIcon}
            data-testid="worksheet-redo"
            aria-label="Redo"
            title="Redo"
          >
            ↷
          </button>
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

      {Array.isArray(priceWarnings) && priceWarnings.length > 0 ? (
        <div
          role="alert"
          data-testid="worksheet-price-warnings"
          style={{
            padding: "12px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#b91c1c",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {priceWarnings.map((msg) => (
            <div key={msg}>{msg}</div>
          ))}
        </div>
      ) : null}

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
          data-testid="worksheet-bulk-scope"
        >
          <option value="all">All rows</option>
          <option value="row_a">Row A</option>
          <option value="row_b">Row B</option>
          <option value="row_c">Row C</option>
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
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "9.5%" }} />
            <col style={{ width: "9.5%" }} />
            <col style={{ width: "9.5%" }} />
            <col style={{ width: "9.5%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={thStyle}>Menu Item</th>
              <th style={thStyle}>Section</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>
                <div>Price A</div>
                <label style={altLabelWrap}>
                  <span style={altLabelText}>Alt name</span>
                  <input
                    value={priceAlts.price_a}
                    onChange={(e) => updatePriceAlt("price_a", e.target.value)}
                    placeholder="e.g. DoorDash"
                    style={altInputStyle}
                    aria-label="Price A alt name"
                  />
                </label>
              </th>
              <th style={thStyle}>
                <div>Price B</div>
                <label style={altLabelWrap}>
                  <span style={altLabelText}>Alt name</span>
                  <input
                    value={priceAlts.price_b}
                    onChange={(e) => updatePriceAlt("price_b", e.target.value)}
                    placeholder="e.g. Uber Eats"
                    style={altInputStyle}
                    aria-label="Price B alt name"
                  />
                </label>
              </th>
              <th style={thStyle}>
                <div>Price C</div>
                <label style={altLabelWrap}>
                  <span style={altLabelText}>Alt name</span>
                  <input
                    value={priceAlts.price_c}
                    onChange={(e) => updatePriceAlt("price_c", e.target.value)}
                    placeholder="e.g. In-store"
                    style={altInputStyle}
                    aria-label="Price C alt name"
                  />
                </label>
              </th>
              <th style={thStyle}>Menuply Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, color: COLORS.muted, textAlign: "center" }}>
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
                        value={row.item_name || ""}
                        onChange={(e) => updateRow(id, { item_name: e.target.value }, "item_name")}
                        onBlur={endCellEdit}
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
                          const next = rows.map((r) =>
                            Number(r.id) === Number(id) ? { ...r, section_name: canonical } : r
                          );
                          commitChange(
                            next,
                            deriveSectionList(next.map((r) => r.section_name))
                          );
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
                        onChange={(e) =>
                          updateRow(id, { description: e.target.value }, "description")
                        }
                        onBlur={endCellEdit}
                        rows={3}
                        style={{ ...cellInputStyle, resize: "vertical", minHeight: 64 }}
                        aria-label="Description"
                      />
                    </td>
                    <td style={tdStyle}>
                      {moneyInput(
                        row.price_a,
                        (v) => updateRow(id, { price_a: v }, "price_a"),
                        { onBlur: endCellEdit }
                      )}
                    </td>
                    <td style={tdStyle}>
                      {moneyInput(
                        row.price_b,
                        (v) => updateRow(id, { price_b: v }, "price_b"),
                        { onBlur: endCellEdit }
                      )}
                    </td>
                    <td style={tdStyle}>
                      {moneyInput(
                        row.price_c,
                        (v) => updateRow(id, { price_c: v }, "price_c"),
                        { onBlur: endCellEdit }
                      )}
                    </td>
                    <td style={tdStyle}>
                      {moneyInput(
                        row.menuply_price,
                        (v) => updateRow(id, { menuply_price: v }, "menuply_price"),
                        { onBlur: endCellEdit }
                      )}
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
  verticalAlign: "top",
};

const tdStyle = { padding: "8px 6px", verticalAlign: "top" };

const altLabelWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  marginTop: 6,
  fontWeight: 500,
};

const altLabelText = {
  fontSize: 10,
  color: COLORS.muted,
  fontWeight: 600,
};

const altInputStyle = {
  ...cellInputStyle,
  padding: "4px 6px",
  fontSize: 11,
  fontWeight: 500,
};

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

const btnIcon = {
  ...btnSecondary,
  padding: "8px 12px",
  fontSize: 18,
  lineHeight: 1,
  minWidth: 42,
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
