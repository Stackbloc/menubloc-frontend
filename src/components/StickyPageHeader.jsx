import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import DiscoveryDrawer from "./grubbid/DiscoveryDrawer.jsx";
import { loadDietPrefs, saveDietPrefs } from "../hooks/useDietPreferences.js";

const ALLERGEN_KEY = "grubbid.allergen.exclusions";
const ALLERGEN_NONE_ID = "none";

export default function StickyPageHeader({
  title,
  children,
  /** When set (e.g. public menu), tints bar + accents so the page matches restaurant brand */
  barBackground,
  linkAccent,
  dealsPillBackground,
  dealsPillBorder,
  logoPageColor,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated: consumerLoggedIn, loading: consumerLoading } = useConsumer();

  const [filters, setFilters] = useState(() => loadDietPrefs());
  const [excludedAllergens, setExcludedAllergens] = useState(() => {
    try {
      const stored = localStorage.getItem(ALLERGEN_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => { saveDietPrefs(filters); }, [filters]);
  useEffect(() => {
    try { localStorage.setItem(ALLERGEN_KEY, JSON.stringify([...excludedAllergens])); } catch { /* ignore */ }
  }, [excludedAllergens]);

  function handleAllergenToggle(id) {
    setExcludedAllergens((prev) => {
      if (id === ALLERGEN_NONE_ID) {
        return prev.has(ALLERGEN_NONE_ID) ? new Set() : new Set([ALLERGEN_NONE_ID]);
      }
      const next = new Set(prev);
      if (next.has(ALLERGEN_NONE_ID)) next.delete(ALLERGEN_NONE_ID);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const hasNoneAllergenSelected = excludedAllergens.has(ALLERGEN_NONE_ID);

  const headerBg = barBackground ?? "#0B0F0C";
  const accent = linkAccent ?? "#22C55E";
  const dealsBg = dealsPillBackground ?? "rgba(34,197,94,0.08)";
  const dealsBorder = dealsPillBorder ?? "1.5px solid rgba(34,197,94,0.3)";
  const brandLogoPage = logoPageColor ?? headerBg;

  return (
    <>
      <DiscoveryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        excludedAllergens={excludedAllergens}
        allergenNoneSelected={hasNoneAllergenSelected}
        onAllergenToggle={handleAllergenToggle}
      />

      {/* Full-width opaque bar so wide viewports do not show scrolling page content in the side gutters. */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: headerBg,
        borderBottom: "1px solid #1F2937",
      }}>
        <div style={{
          maxWidth: 576, margin: "0 auto",
          paddingBottom: title || children ? 12 : 0,
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px 10px",
          }}>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                border: "none", background: "transparent",
                fontSize: 22, color: "#9CA3AF", cursor: "pointer",
                padding: 4, lineHeight: 1, flexShrink: 0,
              }}
            >☰</button>
            <Link to="/" style={{ display: "inline-flex", textDecoration: "none" }}>
              <BrandLogo width={113} height={48} radius={14} pageColor={brandLogoPage} />
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
              <Link
                to="/deals"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  minHeight: 32, padding: "0 12px", borderRadius: 999,
                  border: dealsBorder,
                  background: dealsBg,
                  color: accent, fontSize: 13, fontWeight: 800,
                  textDecoration: "none", whiteSpace: "nowrap", letterSpacing: "0.01em",
                }}
              >🔥 Deals</Link>
              {!consumerLoading && (
                consumerLoggedIn
                  ? <Link to="/account" style={{ fontSize: 22, textDecoration: "none" }}>👤</Link>
                  : <Link to="/account/login" style={{ fontSize: 13, fontWeight: 700, color: accent, textDecoration: "none" }}>Sign in</Link>
              )}
            </div>
          </div>
          {title && (
            <div style={{ padding: "0 16px" }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {title}
              </span>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
