import { useEffect, useMemo, useState } from "react";
import { normalizeModifierGroups } from "./modifierModel.js";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function hasSelectionError(group, selectedIds) {
  return selectedIds.length < group.minSelections || selectedIds.length > group.maxSelections;
}

export default function ModifierSheet({ item, open, onClose, onConfirm }) {
  const groups = useMemo(() => normalizeModifierGroups(item), [item]);
  const [selectedByGroup, setSelectedByGroup] = useState({});

  useEffect(() => {
    if (!open) {
      setSelectedByGroup({});
    }
  }, [open, item]);

  if (!open || !item) return null;

  const hasErrors = groups.some((group) =>
    hasSelectionError(group, selectedByGroup[group.groupId] || [])
  );

  function toggleOption(group, optionId) {
    setSelectedByGroup((prev) => {
      const selected = prev[group.groupId] || [];
      const exists = selected.includes(optionId);

      if (group.maxSelections === 1) {
        return {
          ...prev,
          [group.groupId]: exists ? [] : [optionId],
        };
      }

      if (exists) {
        return {
          ...prev,
          [group.groupId]: selected.filter((id) => id !== optionId),
        };
      }

      if (selected.length >= group.maxSelections) {
        return prev;
      }

      return {
        ...prev,
        [group.groupId]: [...selected, optionId],
      };
    });
  }

  function handleConfirm() {
    if (hasErrors) return;

    const modifiers = groups.flatMap((group) => {
      const selectedIds = selectedByGroup[group.groupId] || [];
      return group.options.filter((option) => selectedIds.includes(option.optionId));
    });

    onConfirm(modifiers);
    setSelectedByGroup({});
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2, 6, 23, 0.42)",
          zIndex: 1180,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Customize ${item.name || "item"}`}
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: 12,
          maxWidth: 560,
          margin: "0 auto",
          background: "#fffef8",
          borderRadius: 24,
          border: "1px solid rgba(17,33,26,0.10)",
          boxShadow: "0 28px 60px rgba(15,23,42,0.22)",
          zIndex: 1181,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(17,33,26,0.08)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#667085" }}>
                Customize item
              </div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "#11211a" }}>
                {item.name}
              </div>
              {item.description ? (
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: "#475467" }}>
                  {item.description}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "1px solid rgba(17,33,26,0.10)",
                background: "#fff",
                borderRadius: 999,
                width: 36,
                height: 36,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 20px", maxHeight: "60vh", overflowY: "auto", display: "grid", gap: 18 }}>
          {groups.map((group) => {
            const selectedIds = selectedByGroup[group.groupId] || [];
            const singleSelect = group.maxSelections === 1;
            const showError = hasSelectionError(group, selectedIds);

            return (
              <section key={group.groupId} style={{ display: "grid", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#11211a" }}>{group.name}</div>
                    {group.required ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: 999,
                          padding: "2px 8px",
                          background: "#fef3c7",
                          color: "#92400e",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        Required
                      </span>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#667085" }}>
                    {group.description || (singleSelect ? "Choose 1 option." : `Choose up to ${group.maxSelections}.`)}
                  </div>
                  {showError ? (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#b42318", fontWeight: 700 }}>
                      {singleSelect ? "Select 1 option to continue." : `Select at least ${group.minSelections}.`}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {group.options.map((option) => {
                    const checked = selectedIds.includes(option.optionId);
                    return (
                      <label
                        key={`${group.groupId}-${option.optionId}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          border: checked ? "1px solid #14532d" : "1px solid rgba(17,33,26,0.10)",
                          borderRadius: 16,
                          padding: "12px 14px",
                          background: checked ? "#f0fdf4" : "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input
                            type={singleSelect ? "radio" : "checkbox"}
                            name={group.groupId}
                            checked={checked}
                            onChange={() => toggleOption(group, option.optionId)}
                          />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#11211a" }}>{option.name}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#475467", whiteSpace: "nowrap" }}>
                          {option.priceDeltaCents > 0 ? `+${formatMoney(option.priceDeltaCents)}` : "Included"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div
          style={{
            padding: "16px 20px 20px",
            borderTop: "1px solid rgba(17,33,26,0.08)",
            display: "grid",
            gap: 10,
            background: "#fff",
          }}
        >
          <button
            type="button"
            onClick={handleConfirm}
            disabled={hasErrors}
            style={{
              border: "none",
              borderRadius: 16,
              background: hasErrors ? "#cbd5e1" : "#11211a",
              color: "#fff",
              padding: "14px 16px",
              fontSize: 15,
              fontWeight: 900,
              cursor: hasErrors ? "not-allowed" : "pointer",
            }}
          >
            Add to basket
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#667085",
              padding: "2px 0 0",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
