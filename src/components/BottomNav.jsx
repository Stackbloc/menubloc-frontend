import { Link, useLocation } from "react-router-dom";

const TABS = [
  { label: "Home",    icon: "🏠", to: "/" },
  { label: "Explore", icon: "🔍", to: "/browse-menus" },
  { label: "Saved",   icon: "🔖", to: "/saved" },
  { label: "Account", icon: "👤", to: "/account" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
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
        const active =
          pathname === tab.to ||
          (tab.to !== "/" && pathname.startsWith(tab.to));
        return (
          <Link
            key={tab.to}
            to={tab.to}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, textDecoration: "none", minWidth: 56,
              color: active ? "#1F4E3D" : "#9ca3af",
              fontSize: 10, fontWeight: active ? 800 : 500,
              padding: "2px 8px",
              transition: "color 150ms ease",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ letterSpacing: "0.01em" }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
