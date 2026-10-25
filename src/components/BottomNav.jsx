import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import WaiterFaceIcon from "./icons/WaiterFaceIcon.jsx";
import MenuplyXMark from "./MenuplyXMark.jsx";
import MenuplyActionSheet from "./MenuplyActionSheet.jsx";
import { MY_MENUPLY_PROFILE_PATH } from "../lib/myMenuplyRoutes.js";

const POST_LABEL = "Post";

/** Menu Browser now lives in Search & Shop (Menu Browser mode); the old route redirects there. */

export default function BottomNav() {
  const { t } = useLanguage();
  const navRef = useRef(null);
  const { pathname } = useLocation();
  const { itemCount } = useOrderCart();
  const { isAuthenticated } = useConsumer();
  const [postOpen, setPostOpen] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "home", label: t("nav.home", "Home"), icon: "🏠", to: "/" },
      {
        id: "waiter",
        label: t("nav.waiter", "Waiter"),
        iconComponent: WaiterFaceIcon,
        iconSize: 28,
        to: "/waiter",
        // Introduced after sign-up — new visitors only see self-explanatory features.
        authOnly: true,
      },
      { id: "post", kind: "post", title: POST_LABEL },
      { id: "basket", label: t("nav.basket", "Basket"), icon: "🛒", to: "/checkout" },
      {
        id: "my-menuply",
        label: t("nav.myProfile", "My Profile"),
        icon: "👤",
        to: MY_MENUPLY_PROFILE_PATH,
      },
    ].filter((tab) => isAuthenticated || !tab.authOnly),
    [t, isAuthenticated]
  );

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
  const itemStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 2,
    textDecoration: "none",
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
    fontSize: 10,
    lineHeight: 1,
    padding: "2px 4px",
    transition: "color 150ms ease",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
  };
  const iconWrapStyle = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    fontSize: 22,
    lineHeight: 1,
  };

  return (
    <nav
      ref={navRef}
      aria-label={t("nav.mainAria", "Main navigation")}
      data-testid="diner-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "#fff",
        borderTop: "1px solid #e4e7ec",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-start",
        padding: "6px 0 env(safe-area-inset-bottom, 8px)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        overflow: "visible",
      }}
    >
      {tabs.map((tab) => {
        if (tab.kind === "post") {
          return (
            <button
              key={tab.id}
              type="button"
              title={POST_LABEL}
              aria-label={POST_LABEL}
              aria-haspopup="dialog"
              aria-expanded={postOpen}
              onClick={() => setPostOpen(true)}
              style={{ ...itemStyle, color: postOpen ? "#1d4ed8" : "#9ca3af", fontWeight: 500 }}
            >
              <span
                style={{
                  ...iconWrapStyle,
                  /* Logo X fills the box to the corners; nudge down to the emoji/icon optical row. */
                  transform: "translateY(6px)",
                }}
              >
                <MenuplyXMark size={24} active={postOpen} />
              </span>
              <span aria-hidden="true" style={{ visibility: "hidden", lineHeight: 1.05 }}>
                {POST_LABEL}
              </span>
            </button>
          );
        }

        const isCheckout = tab.to === "/checkout";
        const isHome = tab.to === "/";
        const active = isCheckout
          ? pathname.startsWith("/checkout")
          : isHome
            ? pathname === "/"
            : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
        const showBadge = tab.to === "/checkout" && itemCount > 0;
        const iconSize = tab.iconSize || 22;
        const linkColor = active ? "#1d4ed8" : "#9ca3af";

        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-label={
              tab.to === "/checkout" && itemCount > 0
                ? t("nav.basketWithCount", "Basket with {count} items").replace(
                    "{count}",
                    String(itemCount)
                  )
                : tab.label
            }
            style={{
              ...itemStyle,
              color: linkColor,
              fontWeight: active ? 800 : 500,
            }}
          >
            <span style={iconWrapStyle}>
              {tab.iconComponent ? (
                <tab.iconComponent size={iconSize} aria-hidden />
              ) : (
                <span aria-hidden="true">{tab.icon}</span>
              )}
              {showBadge ? (
                <span
                  aria-label={t("nav.basketItems", "{count} items in basket").replace(
                    "{count}",
                    String(itemCount)
                  )}
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
      <MenuplyActionSheet open={postOpen} onClose={() => setPostOpen(false)} />
    </nav>
  );
}
