import React, { useState } from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 14,
};

export const MAX_DEAL_MENU_ITEMS = 3;

/**
 * Pick up to 3 menu items the deal applies to — each item gets the same deal terms
 * (not a bundle). Items come from the restaurant's deal menu (CK canonical, else public).
 */
export default function DealMenuItemsPicker({
  items,
  selected,
  onChange,
  loading,
  disabled,
  max = MAX_DEAL_MENU_ITEMS,
  title = null,
  hint = null,
}) {
  const [search, setSearch] = useState("");
  const selectedIds = new Set(selected.map((i) => String(i.id)));
  const q = search.trim().toLowerCase();
  // Full menu is listed (scroll) without typing; typing narrows it.
  const hits = items.filter(
    (i) => !selectedIds.has(String(i.id)) && (!q || String(i.name || "").toLowerCase().includes(q))
  );
  const full = selected.length >= max;

  return (
    <div style={{ display: "grid", gap: 6 }} data-testid="owner-deal-menu-items">
      <span style={{ fontWeight: 700, fontSize: 13 }}>
        {title || "Applies to menu items"}{" "}
        <span style={{ fontWeight: 400, color: OWNER_COLORS.muted }}>(optional, up to {max})</span>
      </span>
      <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
        {hint || "Each item gets the same deal on its own. For several items at one price, create a combo deal."}
      </span>
      {selected.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {selected.map((item) => (
            <span
              key={item.id}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
                borderRadius: 999, background: OWNER_COLORS.accentSoft, fontSize: 13, fontWeight: 600,
              }}
              data-testid="owner-deal-menu-item-chip"
            >
              {item.name}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(selected.filter((s) => String(s.id) !== String(item.id)))}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: OWNER_COLORS.muted, padding: 0 }}
                aria-label={`Remove ${item.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {loading ? (
        <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Loading menu…</span>
      ) : !items.length ? (
        <span style={{ fontSize: 12, color: OWNER_COLORS.muted }} data-testid="owner-deal-menu-items-empty">
          No menu items for this restaurant yet.
        </span>
      ) : full ? null : (
        <>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value.slice(0, 120))}
            placeholder={`Search or scroll all ${items.length} menu items…`}
            disabled={disabled}
            autoComplete="off"
            style={inputStyle}
            data-testid="owner-deal-menu-item-search"
          />
          {hits.length ? (
            <div
              style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8, maxHeight: 240, overflowY: "auto" }}
              data-testid="owner-deal-menu-item-list"
            >
              {hits.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange([...selected, item]);
                    setSearch("");
                  }}
                  style={{
                    display: "flex", justifyContent: "space-between", width: "100%", textAlign: "left",
                    border: "none", borderBottom: `1px solid ${OWNER_COLORS.line}`, background: "#fff",
                    padding: "8px 10px", fontSize: 13, cursor: "pointer",
                  }}
                  data-testid="owner-deal-menu-item-hit"
                >
                  <span>{item.name}</span>
                  <span style={{ color: OWNER_COLORS.muted, fontSize: 12 }}>
                    {item.price != null ? `$${Number(item.price).toFixed(2)}` : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
