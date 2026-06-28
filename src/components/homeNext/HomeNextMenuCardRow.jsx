import DiscoveryCard from "../discovery/DiscoveryCard.jsx";

/** Shared horizontal menu card row — preview and expanded sections use the same layout. */
export default function HomeNextMenuCardRow({ menus }) {
  if (!Array.isArray(menus) || menus.length === 0) return null;

  return (
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
  );
}
