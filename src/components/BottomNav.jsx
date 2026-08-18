import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import MenuplyXMark from "./MenuplyXMark.jsx";
import MenuplyActionSheet from "./MenuplyActionSheet.jsx";

export default function BottomNav() {
  const { t } = useLanguage();
  const navRef = useRef(null);
  const { pathname } = useLocation();
  const [actionOpen, setActionOpen] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "home", label: t("nav.home", "Home"), icon: "🏠", to: "/" },
      { id: "search", label: t("nav.search", "Search"), icon: "🔍", to: "/search" },
      { id: "x", label: t("nav.doSomething", "X"), iconComponent: MenuplyXMark, action: true },
      { id: "activity", label: t("nav.activity", "Activity"), icon: "📡", to: "/activity" },
      { id: "my-menuply", label: t("nav.myMenuply", "My Menuply"), icon: "👤", to: "/my-menuply" },
    ],
    [t]
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

  return (
    <>
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
          padding: "6px 0 env(safe-area-inset-bottom, 8px)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
          overflow: "visible",
        }}
      >
        {tabs.map((tab) => {
          const active = tab.to
            ? tab.to === "/"
              ? pathname === "/"
              : pathname === tab.to || pathname.startsWith(`${tab.to}/`)
            : actionOpen;
          const linkColor = active ? "#1d4ed8" : "#9ca3af";
          const content = (
            <>
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
                  <tab.iconComponent size={tab.action ? 26 : 22} active={active} aria-hidden />
                ) : (
                  <span aria-hidden="true">{tab.icon}</span>
                )}
              </span>
              {tab.action ? null : <span>{tab.label}</span>}
            </>
          );

          if (tab.action) {
            return (
              <button
                key={tab.id}
                type="button"
                data-testid="menuply-x-launcher"
                aria-label={t("nav.doSomethingAria", "Do something on Menuply")}
                aria-expanded={actionOpen}
                onClick={() => setActionOpen(true)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 56,
                  color: linkColor,
                  fontSize: 10,
                  fontWeight: active ? 800 : 500,
                  padding: "2px 8px",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              to={tab.to}
              aria-label={tab.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                textDecoration: "none",
                minWidth: 56,
                color: linkColor,
                fontSize: 10,
                fontWeight: active ? 800 : 500,
                padding: "2px 8px",
                transition: "color 150ms ease",
              }}
            >
              {content}
            </Link>
          );
        })}
      </nav>
      <MenuplyActionSheet open={actionOpen} onClose={() => setActionOpen(false)} />
    </>
  );
}
