import HomeNextMenuCardRow from "./HomeNextMenuCardRow.jsx";

export default function HomeNextDiscoverySection({ sectionId, title, reason, menus, onTitleClick }) {
  if (!Array.isArray(menus) || menus.length === 0) return null;

  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ padding: "0 16px", marginBottom: 10 }}>
        <button
          type="button"
          onClick={onTitleClick}
          style={{
            display: "block",
            width: "100%",
            margin: 0,
            padding: 0,
            border: "none",
            background: "transparent",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
            {title}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280", lineHeight: 1.4 }}>
            {reason}
          </p>
        </button>
      </div>
      <HomeNextMenuCardRow menus={menus} sectionId={sectionId} />
    </section>
  );
}
