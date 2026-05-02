import { Link, useLocation } from "react-router-dom";
import { useOrderCart } from "../context/OrderCartContext.jsx";

function buildSearchHref() {
  try {
    const raw = sessionStorage.getItem("grubbid.discovery.location") || "";
    const parts = raw.split(",");
    const city = parts.length >= 2 ? parts[0].trim() : raw.trim();
    const state = parts.length >= 2 ? parts[1].trim() : "";
    if (city) {
      const p = new URLSearchParams();
      p.set("city", city);
      if (state) p.set("state", state);
      return `/search?${p.toString()}`;
    }
    const rawGeo = sessionStorage.getItem("grubbid.discovery.geo") || "";
    if (rawGeo) {
      const geo = JSON.parse(rawGeo);
      if (geo?.lat && geo?.lng) {
        const p = new URLSearchParams();
        p.set("lat", String(geo.lat));
        p.set("lng", String(geo.lng));
        return `/search?${p.toString()}`;
      }
    }
  } catch { /* sessionStorage unavailable or parse failed */ }
  return "/search";
}

const TABS = [
  { label: "Home",    icon: "🏠", to: "/" },
  { label: "Explore", icon: "🔍", to: "/search", buildHref: buildSearchHref },
  { label: "Following", icon: "F", to: "/account/following" },
  { label: "Basket", icon: "🛒", to: "/checkout" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { itemCount } = useOrderCart();
  const basketBadge = itemCount > 9 ? "9+" : String(itemCount);
  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "#fff",
        borderTop: "1px solid #e4e7ec",
        display: "flex", justifyContent: "space-around",
        padding: "6px 0 env(safe-area-inset-bottom, 8px)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {TABS.map((tab) => {
        const isCheckout = tab.to === "/checkout";
        const active =
          isCheckout
            ? pathname.startsWith("/checkout")
            : pathname === tab.to ||
              (tab.to !== "/" && pathname.startsWith(tab.to));
        const showBadge = tab.to === "/checkout" && itemCount > 0;
        return (
          <Link
            key={tab.to}
            to={tab.buildHref ? tab.buildHref() : tab.to}
            aria-label={tab.to === "/checkout" && itemCount > 0 ? `Basket with ${itemCount} items` : tab.label}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, textDecoration: "none", minWidth: 56,
              color: active ? "#1d4ed8" : "#9ca3af",
              fontSize: 10, fontWeight: active ? 800 : 500,
              padding: "2px 8px",
              transition: "color 150ms ease",
            }}
          >
            <span
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                lineHeight: 1,
              }}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {showBadge ? (
                <span
                  aria-label={`${itemCount} items in basket`}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    lineHeight: "16px",
                    textAlign: "center",
                    boxSizing: "border-box",
                    pointerEvents: "none",
                  }}
                >
                  {basketBadge}
                </span>
              ) : null}
            </span>
            <span style={{ letterSpacing: "0.01em" }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
