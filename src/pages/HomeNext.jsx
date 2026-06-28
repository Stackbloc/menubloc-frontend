/**
 * Experimental home page redesign — food-first, decision-support oriented.
 * Parallel to GrubbidDiscovery; toggled via VITE_ENABLE_NEW_HOMEPAGE or /home-next route.
 */
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useHomeBrowseFeed } from "../hooks/useHomeBrowseFeed.js";
import {
  buildHomeDiscoverySections,
  findHomeSectionMeta,
  getExpandedSectionMenus,
} from "../lib/homeNextSections.js";
import { buildHomeSearchUrl } from "../lib/homeNextNavigation.js";
import HomeNextFoodGrid from "../components/homeNext/HomeNextFoodGrid.jsx";
import HomeNextHealthGoals from "../components/homeNext/HomeNextHealthGoals.jsx";
import HomeNextDiscoverySection from "../components/homeNext/HomeNextDiscoverySection.jsx";
import HomeNextSectionExpanded from "../components/homeNext/HomeNextSectionExpanded.jsx";
import HomeNextLocationSelector from "../components/homeNext/HomeNextLocationSelector.jsx";
import { captureEvent } from "../services/posthog.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export default function HomeNext() {
  const { t, language } = useLanguage();
  const { isAuthenticated: consumerLoggedIn, loading: consumerLoading } = useConsumer();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const helpSectionRef = useRef(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState(null);

  const {
    menus,
    loading: feedLoading,
    autoLocation,
    appliedLocation,
    setAppliedLocation,
    shouldUseGeoBrowse,
    locating,
  } = useHomeBrowseFeed({ language });

  const sections = useMemo(
    () => buildHomeDiscoverySections(menus, { hasGeo: shouldUseGeoBrowse }),
    [menus, shouldUseGeoBrowse]
  );

  const expandedSection = useMemo(() => {
    if (!expandedSectionId) return null;
    const meta = findHomeSectionMeta(sections, expandedSectionId);
    if (!meta) return null;
    return {
      ...meta,
      menus: getExpandedSectionMenus(menus, expandedSectionId, { hasGeo: shouldUseGeoBrowse }),
    };
  }, [expandedSectionId, sections, menus, shouldUseGeoBrowse]);

  function openSection(sectionId) {
    setExpandedSectionId(sectionId);
    helpSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeSection() {
    setExpandedSectionId(null);
  }

  async function runSearch(queryValue = draftQuery) {
    const qTerm = String(queryValue || "").trim();
    const target = buildHomeSearchUrl({
      query: qTerm,
      appliedLocation,
      autoLocation,
      shouldUseGeoBrowse,
    });

    if (!qTerm) {
      navigate(target);
      return;
    }

    captureEvent("search_performed", {
      query: qTerm,
      surface: "home_next",
    });

    setSearching(true);
    try {
      const params = new URLSearchParams(target.split("?")[1] || "");
      params.set("limit", "1");
      const res = await fetch(`${API}/search?${params.toString()}`, { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      const count = Array.isArray(json?.results) ? json.results.length : 0;
      if (count > 0) navigate(target);
      else navigate(target);
    } catch {
      navigate(target);
    } finally {
      setSearching(false);
    }
  }

  const showSkeleton = feedLoading || locating;

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "#111827" }}>
      <style>{`
        .home-next-search::placeholder { color: var(--gb-color-ink-muted); font-weight: 500; }
        .home-next-search:focus { outline: none; box-shadow: 0 0 0 2px rgba(45,106,79,0.35); }
        .home-next-skeleton { animation: homeNextPulse 1.4s ease-in-out infinite; }
        @keyframes homeNextPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .home-next-section-scroll,
        .home-next-food-chip-row,
        .home-next-health-rail {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .home-next-section-scroll::-webkit-scrollbar,
        .home-next-food-chip-row::-webkit-scrollbar,
        .home-next-health-rail::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        .home-next-food-chip-rows {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .home-next-food-chip-row {
          display: flex;
          flex-wrap: nowrap;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0 16px 2px;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .home-next-food-chip-row::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        @media (min-width: 760px) {
          .home-next-shell { max-width: 720px; }
        }
      `}</style>

      <div
        className="home-next-shell"
        style={{
          maxWidth: 576,
          margin: "0 auto",
          paddingBottom: "calc(var(--bottom-nav-h, 72px) + 16px)",
        }}
      >
        {/* Sticky header + search */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "var(--gb-color-page)",
            borderBottom: "1px solid var(--gb-color-border)",
            paddingBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
            }}
          >
            <BrandLogo height={36} radius={8} matchPageBackground={false} />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Link
                to="/deals"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#22C55E",
                  textDecoration: "none",
                }}
              >
                Deals
              </Link>
              {!consumerLoading &&
                (consumerLoggedIn ? (
                  <Link to="/account" style={{ fontSize: 22, textDecoration: "none" }} aria-label="Account">
                    👤
                  </Link>
                ) : (
                  <Link to="/account/login" style={{ fontSize: 13, fontWeight: 700, color: "#22C55E", textDecoration: "none" }}>
                    Sign in
                  </Link>
                ))}
            </div>
          </div>

          <div style={{ padding: "28px 16px 0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
              {t("homeNext.headline", "What sounds good?")}
            </p>
            <HomeNextLocationSelector
              autoLocation={autoLocation}
              appliedLocation={appliedLocation}
              onApplyLocation={setAppliedLocation}
              locating={locating}
            />

            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
            >
              <div style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  className="home-next-search"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  placeholder={t("homeNext.searchPlaceholder", "Search dishes, restaurants, or ingredients")}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 999,
                    border: "1.5px solid var(--gb-color-border)",
                    background: "var(--gb-color-surface-strong)",
                    paddingLeft: 20,
                    paddingRight: 92,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--gb-color-ink)",
                    boxSizing: "border-box",
                    boxShadow: "var(--gb-shadow-soft)",
                  }}
                />
                <button
                  type="submit"
                  aria-label="Search"
                  disabled={searching}
                  style={{
                    position: "absolute",
                    right: 46,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    fontSize: 18,
                    color: "#9CA3AF",
                    cursor: searching ? "wait" : "pointer",
                    padding: 4,
                    lineHeight: 1,
                  }}
                >
                  {searching ? "…" : "🔍"}
                </button>
                <button
                  type="button"
                  aria-label="Add photo of menu text"
                  onClick={() => navigate("/menu-capture")}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    fontSize: 20,
                    color: "#9CA3AF",
                    cursor: "pointer",
                    padding: 4,
                    lineHeight: 1,
                  }}
                >
                  📸
                </button>
              </div>
            </form>
          </div>
        </header>

        <main style={{ paddingTop: 16 }}>
          <HomeNextFoodGrid
            autoLocation={autoLocation}
            appliedLocation={appliedLocation}
            shouldUseGeoBrowse={shouldUseGeoBrowse}
          />

          <HomeNextHealthGoals
            autoLocation={autoLocation}
            appliedLocation={appliedLocation}
            shouldUseGeoBrowse={shouldUseGeoBrowse}
          />

          <section ref={helpSectionRef} style={{ marginBottom: 8 }}>
            <div style={{ padding: "0 16px", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
                Help me decide
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
                {expandedSection
                  ? "Browsing one category — tap Back to see all"
                  : "Curated menus — tap a category to see more"}
              </p>
            </div>

            {showSkeleton ? (
              <div style={{ padding: "0 16px" }}>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="home-next-skeleton"
                    style={{
                      background: "rgba(18,34,28,0.07)",
                      borderRadius: 16,
                      height: 120,
                      marginBottom: 12,
                    }}
                  />
                ))}
              </div>
            ) : expandedSection ? (
              expandedSection.menus.length > 0 ? (
                <HomeNextSectionExpanded
                  title={expandedSection.title}
                  reason={expandedSection.reason}
                  menus={expandedSection.menus}
                  onBack={closeSection}
                />
              ) : (
                <div style={{ padding: "0 16px" }}>
                  <button
                    type="button"
                    onClick={closeSection}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: "0 0 12px",
                      color: "#15803d",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                  <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>
                    No menus in this category right now.
                  </p>
                </div>
              )
            ) : sections.length === 0 ? (
              <div
                style={{
                  margin: "0 16px",
                  padding: "32px 20px",
                  borderRadius: 16,
                  border: "1px solid var(--gb-color-border)",
                  background: "var(--gb-color-surface-strong)",
                  textAlign: "center",
                  color: "var(--gb-color-ink-muted)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {t("homeNext.emptyFeed", "No menus found near you yet. Try searching for a dish above.")}
              </div>
            ) : (
              sections.map((section) => (
                <HomeNextDiscoverySection
                  key={section.id}
                  title={section.title}
                  reason={section.reason}
                  menus={section.menus}
                  onTitleClick={() => openSection(section.id)}
                />
              ))
            )}
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
