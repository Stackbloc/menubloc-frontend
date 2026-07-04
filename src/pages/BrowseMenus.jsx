/**
 * Menu Catalog Reader — one full restaurant menu at a time.
 * Top category tabs pick the sequence; touch swipe, arrow keys, or nav buttons flip menus.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import CatalogMenuRenderer, { prefetchCatalogMenu } from "../components/menuCatalog/CatalogMenuRenderer.jsx";
import CatalogDrinksMenuRenderer, { prefetchCatalogDrinksMenu } from "../components/menuCatalog/CatalogDrinksMenuRenderer.jsx";
import MenuCatalogCategoryTabs from "../components/menuCatalog/MenuCatalogCategoryTabs.jsx";
import MenuCatalogDrinkCategoryTabs from "../components/menuCatalog/MenuCatalogDrinkCategoryTabs.jsx";
import MenuCatalogModePage from "../components/menuCatalog/MenuCatalogModePage.jsx";
import MenuCatalogIntroSplash from "../components/menuCatalog/MenuCatalogIntroSplash.jsx";
import MenuCatalogModeToggleFab from "../components/menuCatalog/MenuCatalogModeToggleFab.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import useMenuCatalogSequence from "../hooks/useMenuCatalogSequence.js";
import {
  MENU_CATALOG_DEFAULT_SECTION,
  MENU_BROWSER_COVER_MS,
  MENU_BROWSER_INTRO_MIN_MS,
} from "../lib/menuCatalogCategories.js";
import { MENU_CATALOG_DRINKS_DEFAULT_SECTION, isDrinksCatalogSection } from "../lib/menuCatalogDrinkCategories.js";
import { computeMenuBrowserLoadTarget, useSmoothedProgress } from "../lib/menuCatalogIntroProgress.js";
import { asFiniteNumber } from "../lib/catalogMenuUtils.js";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

function getUserCoords() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);
        resolve(
          Number.isFinite(lat) && Number.isFinite(lng)
            ? { lat, lng }
            : { lat: null, lng: null }
        );
      },
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  });
}

export default function BrowseMenus() {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = useMemo(() => new URLSearchParams(search), [search]);
  const urlCity = urlParams.get("city") || "";
  const urlState = urlParams.get("state") || "";
  const isDrinksMode = urlParams.get("mode") === "drinks";
  const urlSection = urlParams.get("section") || "";
  const isModeChosen = Boolean(urlSection) || isDrinksMode;
  const activeSection = isDrinksMode
    ? (urlSection || MENU_CATALOG_DRINKS_DEFAULT_SECTION)
    : (urlSection || MENU_CATALOG_DEFAULT_SECTION);
  const urlIndex = asFiniteNumber(urlParams.get("i")) ?? 0;

  const [locationParams, setLocationParams] = useState({ city: urlCity || null, state: urlState || null });
  const [bookPhase, setBookPhase] = useState(() => (isModeChosen ? "browse" : "splash"));
  const [introMinElapsed, setIntroMinElapsed] = useState(false);
  const [browseBootComplete, setBrowseBootComplete] = useState(false);
  const [menuLoadStatus, setMenuLoadStatus] = useState("idle");
  const [initialMenuReady, setInitialMenuReady] = useState(false);
  const browseAreaRef = useRef(null);
  const swipeRef = useRef({ startX: 0, startY: 0, active: false, axis: null });

  const {
    entries,
    currentEntry,
    activeIndex,
    totalCount,
    loading,
    loadingMore,
    error,
    hasNext,
    hasPrev,
    waitingForPage,
    clampToIndex,
    isEmpty,
    locationPending,
  } = useMenuCatalogSequence({
    section: isModeChosen ? activeSection : "",
    drinksMode: isDrinksMode,
    urlCity,
    urlState,
    index: urlIndex,
  });

  useEffect(() => {
    if (isModeChosen) return;
    if (bookPhase !== "splash") return;
    const timer = window.setTimeout(() => setBookPhase("chooseMode"), MENU_BROWSER_COVER_MS);
    return () => window.clearTimeout(timer);
  }, [bookPhase, isModeChosen]);

  useEffect(() => {
    if (!isModeChosen) {
      setIntroMinElapsed(false);
      setBrowseBootComplete(false);
      return undefined;
    }
    setIntroMinElapsed(false);
    setBrowseBootComplete(false);
    const timer = window.setTimeout(() => setIntroMinElapsed(true), MENU_BROWSER_INTRO_MIN_MS);
    return () => window.clearTimeout(timer);
  }, [isModeChosen, isDrinksMode]);

  useEffect(() => {
    if (!isDrinksMode) return;
    const next = new URLSearchParams(search);
    let changed = false;
    if (urlParams.get("mode") !== "drinks") {
      next.set("mode", "drinks");
      changed = true;
    }
    const section = urlParams.get("section");
    if (!section || !isDrinksCatalogSection(section)) {
      next.set("section", MENU_CATALOG_DRINKS_DEFAULT_SECTION);
      next.set("i", "0");
      changed = true;
    }
    if (!changed) return;
    navigate({ search: `?${next.toString()}` }, { replace: true });
  }, [isDrinksMode, navigate, search, urlParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (urlCity) {
        if (!cancelled) setLocationParams({ city: urlCity, state: urlState || null });
        return;
      }
      const coords = await getUserCoords();
      if (!cancelled && coords.lat != null && coords.lng != null) {
        setLocationParams((prev) => ({ ...prev, lat: coords.lat, lng: coords.lng }));
      }
    })();
    return () => { cancelled = true; };
  }, [urlCity, urlState]);

  const updateUrl = useCallback((section, index, { drinks = isDrinksMode } = {}) => {
    const next = new URLSearchParams(search);
    if (drinks) {
      next.set("mode", "drinks");
    } else {
      next.delete("mode");
    }
    next.set("section", section);
    next.set("i", String(Math.max(0, index)));
    if (urlCity) next.set("city", urlCity);
    if (urlState) next.set("state", urlState);
    navigate({ search: `?${next.toString()}` }, { replace: true });
  }, [isDrinksMode, navigate, search, urlCity, urlState]);

  function selectSection(sectionId) {
    updateUrl(sectionId, 0);
  }

  function toggleBrowseMode() {
    selectMode(isDrinksMode ? "food" : "drinks");
  }

  function selectMode(modeId) {
    if (modeId === "drinks") {
      if (isDrinksMode) return;
      updateUrl(MENU_CATALOG_DRINKS_DEFAULT_SECTION, 0, { drinks: true });
      return;
    }
    if (isDrinksMode) {
      updateUrl(MENU_CATALOG_DEFAULT_SECTION, 0, { drinks: false });
      return;
    }
    if (isModeChosen) return;
    updateUrl(MENU_CATALOG_DEFAULT_SECTION, 0, { drinks: false });
  }

  const goNext = useCallback(() => {
    if (!hasNext) return;
    updateUrl(activeSection, activeIndex + 1);
  }, [activeIndex, activeSection, hasNext, updateUrl]);

  const goPrev = useCallback(() => {
    if (!hasPrev) return;
    updateUrl(activeSection, activeIndex - 1);
  }, [activeIndex, activeSection, hasPrev, updateUrl]);

  useEffect(() => {
    if (clampToIndex != null && urlIndex !== clampToIndex) {
      updateUrl(activeSection, clampToIndex);
    }
  }, [activeSection, clampToIndex, updateUrl, urlIndex]);

  useEffect(() => {
    const prev = entries[activeIndex - 1];
    const next = entries[activeIndex + 1];
    const prefetch = isDrinksMode ? prefetchCatalogDrinksMenu : prefetchCatalogMenu;
    if (prev?.restaurant_id) {
      if (isDrinksMode) prefetch(prev.restaurant_id, locationParams, activeSection);
      else prefetch(prev.restaurant_id, locationParams, language);
    }
    if (next?.restaurant_id) {
      if (isDrinksMode) prefetch(next.restaurant_id, locationParams, activeSection);
      else prefetch(next.restaurant_id, locationParams, language);
    }
  }, [activeSection, entries, activeIndex, isDrinksMode, locationParams, language]);

  useEffect(() => {
    function handleKeyDown(event) {
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  useEffect(() => {
    setInitialMenuReady(false);
  }, [currentEntry?.restaurant_id, activeIndex, isDrinksMode]);

  useEffect(() => {
    if (menuLoadStatus === "ok") {
      setInitialMenuReady(true);
    }
  }, [menuLoadStatus]);

  useEffect(() => {
    setMenuLoadStatus("idle");
  }, [currentEntry?.restaurant_id, activeIndex, activeSection]);

  const handleMenuLoadStateChange = useCallback((status) => {
    setMenuLoadStatus(status);
  }, []);

  const loadTarget = useMemo(
    () =>
      computeMenuBrowserLoadTarget({
        loading: loading || locationPending,
        currentEntry,
        menuStatus: menuLoadStatus,
        isEmpty,
        error,
      }),
    [loading, locationPending, currentEntry, menuLoadStatus, isEmpty, error]
  );

  useEffect(() => {
    if (!isModeChosen || browseBootComplete) return;
    if (introMinElapsed && menuLoadStatus === "ok" && currentEntry && !loading && !locationPending) {
      setBrowseBootComplete(true);
    }
  }, [
    browseBootComplete,
    currentEntry,
    introMinElapsed,
    isModeChosen,
    loading,
    locationPending,
    menuLoadStatus,
  ]);

  const listPending = isModeChosen && (loading || locationPending || waitingForPage || (loadingMore && !currentEntry));
  const menuPending = isModeChosen && currentEntry && (menuLoadStatus === "idle" || menuLoadStatus === "loading");
  const initialHold = isModeChosen && !browseBootComplete && !introMinElapsed;
  const showSplashIntro = !isModeChosen && bookPhase === "splash";
  const showChooseMode = !isModeChosen && bookPhase === "chooseMode";
  const showLoadingSplash = isModeChosen && !browseBootComplete && (initialHold || listPending || (!initialMenuReady && menuPending));
  const showBookOverlay = showSplashIntro || showChooseMode || showLoadingSplash;
  const showCategoryTabs = isModeChosen && !showBookOverlay;
  const showModeToggleFab = isModeChosen && !showSplashIntro && !showChooseMode;
  const menuRendering = showLoadingSplash;
  const introProgress = useSmoothedProgress(loadTarget, showLoadingSplash);
  const currentMenuNumber = currentEntry ? (activeIndex + 1) : 0;
  const totalMenuCount = Math.max(totalCount || 0, entries.length || 0);

  const trySwipeNavigation = useCallback((dx, dy) => {
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return false;
    if (dx < 0) goNext();
    else goPrev();
    return true;
  }, [goNext, goPrev]);

  useEffect(() => {
    const el = browseAreaRef.current;
    if (!el) return undefined;

    function resetSwipe() {
      swipeRef.current = { startX: 0, startY: 0, active: false, axis: null };
    }

    function handleTouchStart(event) {
      if (showBookOverlay) return;
      const touch = event.touches?.[0];
      if (!touch) return;
      swipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        active: true,
        axis: null,
      };
    }

    function handleTouchMove(event) {
      const touch = event.touches?.[0];
      if (!touch || !swipeRef.current.active) return;

      const dx = touch.clientX - swipeRef.current.startX;
      const dy = touch.clientY - swipeRef.current.startY;

      if (!swipeRef.current.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        swipeRef.current.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }

      if (swipeRef.current.axis === "x") {
        event.preventDefault();
      }
    }

    function handleTouchEnd(event) {
      const touch = event.changedTouches?.[0];
      if (!touch || !swipeRef.current.active) return;

      const dx = touch.clientX - swipeRef.current.startX;
      const dy = touch.clientY - swipeRef.current.startY;
      const wasHorizontal = swipeRef.current.axis === "x";
      resetSwipe();

      if (!wasHorizontal) return;
      trySwipeNavigation(dx, dy);
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true });
    el.addEventListener("touchcancel", resetSwipe, { passive: true, capture: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart, { capture: true });
      el.removeEventListener("touchmove", handleTouchMove, { capture: true });
      el.removeEventListener("touchend", handleTouchEnd, { capture: true });
      el.removeEventListener("touchcancel", resetSwipe, { capture: true });
    };
  }, [showBookOverlay, trySwipeNavigation]);

  const browseShellStyle = {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: 576,
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--gb-color-page)",
        color: "var(--gb-color-ink)",
      }}
    >
      <StickyPageHeader />

      <div style={browseShellStyle}>
        {showCategoryTabs ? (
          isDrinksMode ? (
            <MenuCatalogDrinkCategoryTabs
              activeSection={activeSection}
              onSelect={selectSection}
            />
          ) : (
            <MenuCatalogCategoryTabs
              activeSection={activeSection}
              onSelect={selectSection}
            />
          )
        ) : null}

        <div
          ref={browseAreaRef}
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
        {showSplashIntro ? (
          <MenuCatalogIntroSplash visible variant="splash" />
        ) : null}

        {showChooseMode ? (
          <MenuCatalogModePage onSelect={selectMode} />
        ) : null}

        {showLoadingSplash ? (
          <MenuCatalogIntroSplash visible variant="loading" progress={introProgress} />
        ) : null}

        <MenuCatalogModeToggleFab
          visible={showModeToggleFab}
          isDrinksMode={isDrinksMode}
          menuLoading={menuRendering}
          onToggle={toggleBrowseMode}
        />

        {!showBookOverlay && hasPrev ? (
          <button
            type="button"
            aria-label={t("menuBrowser.prevMenu", "Previous menu")}
            onClick={goPrev}
            style={{
              position: "absolute",
              left: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 56,
              width: 36,
              height: 56,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 22,
              fontWeight: 900,
              cursor: "pointer",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ‹
          </button>
        ) : null}

        {!showBookOverlay && hasNext ? (
          <button
            type="button"
            aria-label={t("menuBrowser.nextMenu", "Next menu")}
            onClick={goNext}
            style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 56,
              width: 36,
              height: 56,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 22,
              fontWeight: 900,
              cursor: "pointer",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ›
          </button>
        ) : null}

        {!showBookOverlay && totalMenuCount > 0 ? (
          <div
            aria-live="polite"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 55,
              padding: "7px 10px",
              borderRadius: 10,
              background: "rgba(0,0,0,0.78)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            Menu {currentMenuNumber} of {totalMenuCount}
          </div>
        ) : null}

        {error && !showBookOverlay ? (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
              {t("menuCatalog.loadError", "Couldn't load menus")}
            </div>
            <div style={{ color: "#667085", fontSize: 14 }}>{error}</div>
          </div>
        ) : null}

        {isEmpty && !loading && !showBookOverlay ? (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
              {t("menuBrowser.emptyTitle", "No menus in this category yet")}
            </div>
            <div style={{ color: "#667085", fontSize: 14 }}>
              {t("menuBrowser.emptyBody", "Try another category or check back as we add more menus.")}
            </div>
          </div>
        ) : null}

        {currentEntry ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              visibility: showBookOverlay ? "hidden" : "visible",
              pointerEvents: showBookOverlay ? "none" : "auto",
            }}
            aria-hidden={showBookOverlay}
          >
            {isDrinksMode ? (
              <CatalogDrinksMenuRenderer
                key={`drinks-${activeSection}-${currentEntry.restaurant_id}-${activeIndex}`}
                entry={currentEntry}
                locationParams={locationParams}
                browseSection={activeSection}
                onLoadStateChange={handleMenuLoadStateChange}
              />
            ) : (
              <CatalogMenuRenderer
                key={`${activeSection}-${currentEntry.restaurant_id}-${activeIndex}`}
                entry={currentEntry}
                locationParams={locationParams}
                isMobile={isMobile}
                browseSection={activeSection}
                onLoadStateChange={handleMenuLoadStateChange}
              />
            )}
          </div>
        ) : null}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
