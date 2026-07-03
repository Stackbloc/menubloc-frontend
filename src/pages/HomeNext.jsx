/**
 * AUTHORITATIVE Menuply home page (HomeNext) — product-owner approved 2026-06-28.
 * Live at "/" via HomeRoot (default). Legacy rollback: VITE_USE_LEGACY_HOME=1 or /home-legacy.
 * Protected: docs/architecture/2026-06-28_AUTHORITATIVE-HOME-PAGE-DESIGN.md
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
  const [inlineError, setInlineError] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [homeResetSignal, setHomeResetSignal] = useState(0);

  const {
    menus,
    loading: feedLoading,
    autoLocation,
    appliedLocation,
    setAppliedLocation,
    shouldUseGeoBrowse,
    locating,
  } = useHomeBrowseFeed();

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

  function resetHomeScreen() {
    setExpandedSectionId(null);
    setDraftQuery("");
    setSearching(false);
    setHomeResetSignal((n) => n + 1);
    inputRef.current?.blur();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function runSearch(queryValue = draftQuery) {
    const qTerm = String(queryValue || "").trim();
    const target = buildHomeSearchUrl({
      query: qTerm,
      appliedLocation,
      autoLocation,
      shouldUseGeoBrowse,
    });

    setInlineError("");

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
      if (count === 0) {
        const loc = params.get("location_label") || [params.get("city"), params.get("state")].filter(Boolean).join(", ");
        const nearText = loc ? ` near ${loc}` : "";
        setInlineError(t("discovery.noResultsFoundFor", `No results found for "${qTerm}"${nearText}`, { query: qTerm, nearText }));
      } else {
        navigate(target);
      }
    } catch {
      navigate(target);
    } finally {
      setSearching(false);
    }
  }

  const showSkeleton = feedLoading;

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "#111827" }}>
      <style>{`
        .home-next-search::placeholder { color: var(--gb-color-ink-muted); font-weight: 500; }
        .home-next-search:focus { outline: none; box-shadow: 0 0 0 2px rgba(45,106,79,0.35); }
        @media (max-width: 576px) {
          .home-next-search {
            font-size: 14px !important;
            padding-left: 14px !important;
            padding-right: 84px !important;
          }
          .home-next-search::placeholder {
            font-size: 13px;
          }
        }
        .home-next-skeleton { animation: homeNextPulse 1.4s ease-in-out infinite; }
        @keyframes homeNextPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .home-next-food-chip-row,
        .home-next-health-rail {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
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
        .home-next-menu-grid-cell {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .home-next-menu-pane-shell {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .home-next-menu-pane-shell .discovery-pane {
          flex: 1;
        }
        /* Popular — Waffle House (Dothan) reference height */
        .discovery-pane--featured {
          min-height: 122px;
        }
        .discovery-pane--featured .discovery-pane-body {
          display: flex;
          flex-direction: column;
        }
        .discovery-pane--featured .discovery-pane-meta {
          min-height: 42px;
        }
        .discovery-pane--featured .discovery-pane-preview {
          min-height: 24px;
        }
        /* Other categories — Toasted Yolk (Dothan) reference height */
        .discovery-pane--compact {
          min-height: 98px;
        }
        .discovery-pane--compact .discovery-pane-body {
          display: flex;
          flex-direction: column;
        }
        .discovery-pane--compact .discovery-pane-meta {
          min-height: 22px;
        }
        .discovery-pane--compact .discovery-pane-preview {
          min-height: 24px;
        }
        @media (min-width: 760px) {
          .home-next-shell { max-width: 720px; }
          .home-next-menu-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
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
            <button
              type="button"
              onClick={resetHomeScreen}
              aria-label={t("homeNext.resetHome", "Reset home screen")}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                display: "inline-flex",
              }}
            >
              <BrandLogo height={36} radius={8} matchPageBackground={false} clickable={false} />
            </button>
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
                {t("nav.deals", "Deals")}
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
              collapseSignal={homeResetSignal}
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
                  onChange={(e) => { setDraftQuery(e.target.value); setInlineError(""); }}
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

            {inlineError ? (
              <div
                style={{
                  marginTop: 12,
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.06)",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: "#B91C1C", marginBottom: 4 }}>
                  {inlineError}
                </div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>
                  {t("discovery.tryDifferent", "Try a different search or location.")}
                </div>
              </div>
            ) : null}
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
                  sectionId={expandedSection.id}
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
                  sectionId={section.id}
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
