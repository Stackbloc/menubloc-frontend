import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import WaiterFaceIcon from "./icons/WaiterFaceIcon.jsx";
import BrowseMenusIcon from "./icons/BrowseMenusIcon.jsx";

export default function BottomNav() {
  const { t } = useLanguage();
  const navRef = useRef(null);
  const { pathname } = useLocation();
  const { itemCount } = useOrderCart();

  const tabs = useMemo(() => [
    { label: t("nav.home", "Home"), icon: "🏠", to: "/" },
    { label: t("nav.waiter", "Waiter"), iconComponent: WaiterFaceIcon, iconSize: 28, to: "/waiter" },
    { label: t("nav.browseMenus", "Browse"), iconComponent: BrowseMenusIcon, iconSize: 24, to: "/browse-menus" },
    { label: t("nav.basket", "Basket"), icon: "🛒", to: "/checkout" },
  ], [t]);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty("--bottom-nav-h", el.offsetHeight + "px");
    const ro = new ResizeObserver(set);
    ro.observe(el);
    set();
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--bottom-nav-h");
    };
  }, []);
  const basketBadge = itemCount > 9 ? "9+" : String(itemCount);
  return (
    <nav
      ref={navRef}
      aria-label={t("nav.mainAria", "Main navigation")}
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "#fff",
        borderTop: "1px solid #e4e7ec",
        display: "flex", justifyContent: "space-around",
        padding: "6px 0 env(safe-area-inset-bottom, 8px)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        overflow: "visible",
      }}
    >
      {tabs.map((tab) => {
        const isCheckout = tab.to === "/checkout";
        const active =
          isCheckout
            ? pathname.startsWith("/checkout")
            : tab.to === "/browse-menus"
              ? pathname === "/browse-menus" || pathname.startsWith("/browse-menus")
              : pathname === tab.to ||
                (tab.to !== "/" && pathname.startsWith(tab.to));
        const showBadge = tab.to === "/checkout" && itemCount > 0;
        const iconSize = tab.iconSize || 22;
        const isBrowseTab = tab.to === "/browse-menus";
        const linkColor = isBrowseTab
          ? (active ? "#CA8A04" : "#EAB308")
          : (active ? "#1d4ed8" : "#9ca3af");
        return (
          <Link
            key={tab.to}
            to={tab.buildHref ? tab.buildHref() : tab.to}
            aria-label={
              tab.to === "/checkout" && itemCount > 0
                ? t("nav.basketWithCount", "Basket with {count} items").replace("{count}", String(itemCount))
                : tab.label
            }
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, textDecoration: "none", minWidth: 56,
              color: linkColor,
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
              {tab.iconComponent ? (
                <tab.iconComponent
                  size={iconSize}
                  active={tab.to === "/browse-menus" ? active : undefined}
                  aria-hidden
                />
              ) : (
                <span aria-hidden="true">{tab.icon}</span>
              )}
              {showBadge ? (
                <span
                  aria-label={t("nav.basketItems", "{count} items in basket").replace("{count}", String(itemCount))}
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
                  }}
                >
                  {basketBadge}
                </span>
              ) : null}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
