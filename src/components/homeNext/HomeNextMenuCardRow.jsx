import DiscoveryCard from "../discovery/DiscoveryCard.jsx";

/** 2-column menu grid — preview sections show 4 cards (2×2), no horizontal scroll. */
export default function HomeNextMenuCardRow({ menus, sectionId }) {
  if (!Array.isArray(menus) || menus.length === 0) return null;

  const paneVariant = sectionId === "popular" ? "featured" : "compact";

  return (
    <div
      className="home-next-menu-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
        padding: "0 16px 4px",
      }}
    >
      {menus.map((menu) => (
        <div key={menu.menu_id || menu.restaurant_id} className="home-next-menu-grid-cell">
          <div className="home-next-menu-pane-shell">
            <DiscoveryCard menu={menu} paneVariant={paneVariant} />
          </div>
        </div>
      ))}
    </div>
  );
}
