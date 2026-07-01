/**
 * Menu Catalog Reader — one full restaurant menu at a time.
 * Top category tabs pick the sequence; swipe or arrow keys flip through menus.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import CatalogMenuRenderer, { prefetchCatalogMenu } from "../components/menuCatalog/CatalogMenuRenderer.jsx";
import MenuCatalogCategoryTabs from "../components/menuCatalog/MenuCatalogCategoryTabs.jsx";
import MenuCatalogIntroSplash from "../components/menuCatalog/MenuCatalogIntroSplash.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import useMenuCatalogSequence from "../hooks/useMenuCatalogSequence.js";
import { MENU_CATALOG_DEFAULT_SECTION, MENU_BROWSER_INTRO_MIN_MS } from "../lib/menuCatalogCategories.js";
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
  const activeSection = urlParams.get("section") || MENU_CATALOG_DEFAULT_SECTION;
  const urlIndex = asFiniteNumber(urlParams.get("i")) ?? 0;

  const [locationParams, setLocationParams] = useState({ city: urlCity || null, state: urlState || null });
  const [introMinElapsed, setIntroMinElapsed] = useState(false);
  const [menuLoadStatus, setMenuLoadStatus] = useState("idle");
  const [bootComplete, setBootComplete] = useState(false);
  const swipeRef = useRef({ startX: 0, startY: 0 });

  const {
    entries,
    currentEntry,
    activeIndex,
    loading,
    loadingMore,
    error,
    hasNext,
    hasPrev,
    waitingForPage,
    clampToIndex,
    isEmpty,
  } = useMenuCatalogSequence({
    section: activeSection,
    urlCity,
    urlState,
    index: urlIndex,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroMinElapsed(true), MENU_BROWSER_INTRO_MIN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (urlParams.get("section")) return;
    const next = new URLSearchParams(search);
    next.set("section", MENU_CATALOG_DEFAULT_SECTION);
    next.set("i", "0");
    navigate({ search: `?${next.toString()}` }, { replace: true });
  }, [navigate, search, urlParams]);

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

  const updateUrl = useCallback((section, index) => {
    const next = new URLSearchParams(search);
    next.set("section", section);
    next.set("i", String(Math.max(0, index)));
    if (urlCity) next.set("city", urlCity);
    if (urlState) next.set("state", urlState);
    navigate({ search: `?${next.toString()}` }, { replace: true });
  }, [navigate, search, urlCity, urlState]);

  function selectSection(sectionId) {
    updateUrl(sectionId, 0);
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
    if (prev?.restaurant_id) prefetchCatalogMenu(prev.restaurant_id, locationParams, language);
    if (next?.restaurant_id) prefetchCatalogMenu(next.restaurant_id, locationParams, language);
  }, [entries, activeIndex, locationParams, language]);

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

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    swipeRef.current = { startX: touch.clientX, startY: touch.clientY };
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    const dx = touch.clientX - swipeRef.current.startX;
    const dy = touch.clientY - swipeRef.current.startY;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  useEffect(() => {
    setMenuLoadStatus("idle");
  }, [currentEntry?.restaurant_id, activeIndex]);

  const handleMenuLoadStateChange = useCallback((status) => {
    setMenuLoadStatus(status);
  }, []);

  const loadTarget = useMemo(
    () =>
      computeMenuBrowserLoadTarget({
        loading,
        currentEntry,
        menuStatus: menuLoadStatus,
        isEmpty,
        error,
      }),
    [loading, currentEntry, menuLoadStatus, isEmpty, error]
  );

  const introProgress = useSmoothedProgress(loadTarget, !bootComplete);

  const firstMenuReady = useMemo(() => {
    if (error) return introMinElapsed;
    if (isEmpty && !loading) return true;
    if (!currentEntry) return false;
    return menuLoadStatus === "ok" || menuLoadStatus === "error";
  }, [error, isEmpty, loading, currentEntry, menuLoadStatus, introMinElapsed]);

  useEffect(() => {
    if (introMinElapsed && firstMenuReady) {
      setBootComplete(true);
    }
  }, [introMinElapsed, firstMenuReady]);

  const showIntro = !bootComplete;
  const showMenuLoading =
    bootComplete && ((loading && !currentEntry) || waitingForPage || (loadingMore && !currentEntry));

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
        <MenuCatalogCategoryTabs
          activeSection={activeSection}
          onSelect={selectSection}
        />

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
        <MenuCatalogIntroSplash visible={showIntro} progress={introProgress} />

        {showMenuLoading ? (
          <div style={{ padding: 24, fontSize: 14, fontWeight: 600, color: "#667085" }}>
            {t("menuCatalog.loadingMenu", "Loading menu…")}
          </div>
        ) : null}

        {error && !showIntro ? (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
              {t("menuCatalog.loadError", "Couldn't load menus")}
            </div>
            <div style={{ color: "#667085", fontSize: 14 }}>{error}</div>
          </div>
        ) : null}

        {isEmpty && !loading && !showIntro ? (
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
              visibility: showIntro ? "hidden" : "visible",
              pointerEvents: showIntro ? "none" : "auto",
            }}
            aria-hidden={showIntro}
          >
            <CatalogMenuRenderer
              key={`${activeSection}-${currentEntry.restaurant_id}-${activeIndex}`}
              entry={currentEntry}
              locationParams={locationParams}
              isMobile={isMobile}
              onLoadStateChange={handleMenuLoadStateChange}
            />
          </div>
        ) : null}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
