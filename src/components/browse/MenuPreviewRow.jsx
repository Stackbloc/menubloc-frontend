import React from "react";
import MenuPreviewCard from "./MenuPreviewCard.jsx";

export default function MenuPreviewRow({
  title,
  menus = [],
  emptyLabel = "No menus in this row yet.",
  heroFirstCard = false,
}) {
  return (
    <section style={{ marginTop: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: -0.4,
            color: "#10231b",
          }}
        >
          {title}
        </h2>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "#567164",
          }}
        >
          Swipe
        </div>
      </div>

      {menus.length > 0 ? (
        <div
          style={{
            display: "flex",
            gap: 18,
            overflowX: "auto",
            paddingBottom: 8,
            paddingRight: 88,
            scrollSnapType: "x proximity",
          }}
        >
          {menus.map((menu, index) => (
            <div key={`${title}-${menu.restaurant_id}-${index}`} style={{ scrollSnapAlign: "start" }}>
              <MenuPreviewCard menu={menu} index={index} hero={heroFirstCard && index === 0} />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            minHeight: 132,
            borderRadius: 20,
            border: "1px dashed rgba(16,35,27,0.18)",
            background: "rgba(255,255,255,0.62)",
            display: "grid",
            placeItems: "center",
            color: "#567164",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {emptyLabel}
        </div>
      )}
    </section>
  );
}
