import DiscoveryCard from "../discovery/DiscoveryCard.jsx";

export default function HomeNextDiscoverySection({ title, reason, menus, onTitleClick }) {
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
      <div
        className="home-next-section-scroll"
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: "0 16px 4px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {menus.map((menu) => (
          <div
            key={menu.menu_id || menu.restaurant_id}
            className="home-next-section-card"
            style={{ flex: "0 0 min(280px, 78vw)", scrollSnapAlign: "start" }}
          >
            <DiscoveryCard menu={menu} />
          </div>
        ))}
      </div>
    </section>
  );
}
