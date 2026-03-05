import React from "react";
import MenuCard from "./MenuCard";

export default function MenuSection({ section, compact = false }) {
  const title = section?.title || section?.name || "Menu";
  const items = Array.isArray(section?.items) ? section.items : [];

  return (
    <section
      style={{
        border: "1px solid #dce4f2",
        borderRadius: 16,
        background: "#fbfdff",
        padding: compact ? 12 : 16,
        boxShadow: "0 4px 16px rgba(27, 47, 84, 0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: compact ? 17 : 20 }}>{title}</h3>
        <span style={{ color: "#5a6882", fontSize: 12, fontWeight: 700 }}>{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            marginTop: 10,
            border: "1px dashed #cfdae9",
            borderRadius: 12,
            padding: "10px 12px",
            color: "#6d7a93",
            fontSize: 13,
          }}
        >
          No menu items in this section.
        </div>
      ) : (
        <div style={{ marginTop: 10, display: "grid", gap: compact ? 8 : 10 }}>
          {items.map((item, idx) => (
            <MenuCard key={`${item?.id || item?.name || "item"}-${idx}`} item={item} compact={compact} />
          ))}
        </div>
      )}
    </section>
  );
}
