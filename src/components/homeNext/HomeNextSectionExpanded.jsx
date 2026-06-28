import DiscoveryCard from "../discovery/DiscoveryCard.jsx";

export default function HomeNextSectionExpanded({ title, reason, menus, onBack }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ padding: "0 16px 12px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            border: "none",
            background: "transparent",
            padding: "0 0 12px",
            color: "#15803d",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>
          {title}
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6B7280", lineHeight: 1.4 }}>
          {reason}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#9CA3AF" }}>
          {menus.length} {menus.length === 1 ? "menu" : "menus"}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px" }}>
        {menus.map((menu) => (
          <DiscoveryCard key={menu.menu_id || menu.restaurant_id} menu={menu} />
        ))}
      </div>
    </section>
  );
}
