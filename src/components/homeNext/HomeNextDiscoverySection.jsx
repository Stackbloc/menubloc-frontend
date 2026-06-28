import { Link } from "react-router-dom";
import DiscoveryCard from "../discovery/DiscoveryCard.jsx";
import { buildHomeBrowseUrl } from "../../lib/homeNextNavigation.js";

export default function HomeNextDiscoverySection({
  sectionId,
  title,
  reason,
  menus,
  appliedLocation,
  autoLocation,
  shouldUseGeoBrowse,
}) {
  if (!Array.isArray(menus) || menus.length === 0) return null;

  const viewAllHref = buildHomeBrowseUrl({
    sectionId,
    appliedLocation,
    autoLocation,
    shouldUseGeoBrowse,
  });

  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: "0 16px",
          marginBottom: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
            {title}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280", lineHeight: 1.4 }}>
            {reason}
          </p>
        </div>
        <Link
          to={viewAllHref}
          style={{
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "#15803d",
            textDecoration: "none",
            paddingTop: 2,
          }}
        >
          View all
        </Link>
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
