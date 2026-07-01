/**
 * Menu Browser (Yellow Pages) — category-first menu directory.
 * Not search. Not a filter panel. Opens restaurant menus directly from cards.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import MenuBrowserLanding from "../components/menuBrowser/MenuBrowserLanding.jsx";
import MenuBrowserCategoryFeed from "../components/menuBrowser/MenuBrowserCategoryFeed.jsx";
import MenuBrowserFeaturedStrip from "../components/menuBrowser/MenuBrowserFeaturedStrip.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiGet, getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { buildBrowseLocationParams, reverseGeocode } from "../lib/locationUtils.js";
import { dedupeDiscoveryMenus } from "../lib/discoveryFeedGuardrails.js";

const BROWSE_LIMIT = 24;

const FALLBACK_CATEGORIES = [
  { id: "nearby", label: "Nearby", emoji: "📍", accent: "#2563eb", group: "discovery" },
  { id: "trending", label: "Trending", emoji: "📈", accent: "#f43f5e", group: "discovery" },
  { id: "breakfast", label: "Breakfast", emoji: "🍳", accent: "#ca8a04", group: "meal" },
  { id: "lunch", label: "Lunch", emoji: "🥗", accent: "#16a34a", group: "meal" },
  { id: "dinner", label: "Dinner", emoji: "🍽️", accent: "#7c3aed", group: "meal" },
  { id: "pizza", label: "Pizza", emoji: "🍕", accent: "#ef4444", group: "cuisine" },
  { id: "burgers", label: "Burgers", emoji: "🍔", accent: "#f59e0b", group: "cuisine" },
  { id: "mexican", label: "Mexican", emoji: "🌮", accent: "#f97316", group: "cuisine" },
  { id: "asian", label: "Asian", emoji: "🥡", accent: "#6366f1", group: "cuisine" },
  { id: "italian", label: "Italian", emoji: "🍝", accent: "#dc2626", group: "cuisine" },
  { id: "sandwiches", label: "Sandwiches", emoji: "🥪", accent: "#ea580c", group: "cuisine" },
  { id: "sushi", label: "Sushi", emoji: "🍣", accent: "#0891b2", group: "cuisine" },
  { id: "bbq", label: "BBQ", emoji: "🔥", accent: "#b45309", group: "cuisine" },
  { id: "seafood", label: "Seafood", emoji: "🦞", accent: "#0284c7", group: "cuisine" },
  { id: "coffee", label: "Coffee", emoji: "☕", accent: "#78716c", group: "cuisine" },
  { id: "desserts", label: "Desserts", emoji: "🍰", accent: "#db2777", group: "cuisine" },
  { id: "happy_hour", label: "Happy Hour", emoji: "🍹", accent: "#9333ea", group: "occasion" },
  { id: "vegan", label: "Vegan", emoji: "🌱", accent: "#22c55e", group: "dietary" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥬", accent: "#4ade80", group: "dietary" },
  { id: "newly_added", label: "Newly Added Menus", emoji: "✨", accent: "#0ea5e9", group: "discovery" },
  { id: "local_favorites", label: "Local Favorites", emoji: "⭐", accent: "#eab308", group: "discovery" },
];

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

function readErrorMessage(error) {
  return toConsumerErrorMessage(
    error,
    "We couldn't load menus right now. Please try again in a moment."
  );
}

function extractMenus(response) {
  if (Array.isArray(response?.menus)) return response.menus;
  const firstRow = Array.isArray(response?.rows) ? response.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
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

function toTranslationKey(id) {
  return `menuBrowser.category.${String(id || "").replace(/-/g, "_")}`;
}

export default function BrowseMenus() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = useMemo(() => new URLSearchParams(search), [search]);
  const urlCity = urlParams.get("city") || "";
  const urlState = urlParams.get("state") || "";
  const activeSection = urlParams.get("section") || "";
  const hasCityStateParams = Boolean(urlCity);

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [locationLabel, setLocationLabel] = useState(() => [urlCity, urlState].filter(Boolean).join(", "));
  const [radiusMiles] = useState(() => (hasCityStateParams ? null : 10));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [menus, setMenus] = useState([]);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sponsoredPlacements, setSponsoredPlacements] = useState([]);
  const browseRequestRef = useRef(0);
  const [featuredLocationParams, setFeaturedLocationParams] = useState(null);
  const browseScopeKey = useMemo(
    () => `${hasCityStateParams ? `${urlCity}|${urlState}` : "geo"}::${activeSection}`,
    [hasCityStateParams, urlCity, urlState, activeSection]
  );

  const activeCategory = useMemo(
    () => categories.find((entry) => entry.id === activeSection) || null,
    [categories, activeSection]
  );

  const activeTitle = activeCategory
    ? t(toTranslationKey(activeCategory.id), activeCategory.label)
    : t("menuBrowser.title", "Browse Menus");

  useEffect(() => {
    let cancelled = false;
    apiGet("/api/meta/menu-browser/categories")
      .then((response) => {
        if (cancelled) return;
        if (Array.isArray(response?.categories) && response.categories.length) {
          setCategories(response.categories);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const buildApiParams = useCallback(async (loadMoreOffset = 0) => {
    const coords = await getUserCoords();
    const hasCoords = coords.lat !== null && coords.lng !== null;

    if (!hasCityStateParams && hasCoords) {
      reverseGeocode(coords.lat, coords.lng)
        .then((geo) => {
          if (geo?.label) setLocationLabel(geo.label);
        })
        .catch(() => {});
    } else if (hasCityStateParams) {
      setLocationLabel([urlCity, urlState].filter(Boolean).join(", "));
    }

    return {
      ...buildBrowseLocationParams(
        hasCityStateParams
          ? { urlCity, urlState, coords: hasCoords ? coords : null, radiusMiles }
          : { coords: hasCoords ? coords : null, radiusMiles }
      ),
      limit: BROWSE_LIMIT,
      offset: loadMoreOffset,
      ...(activeSection ? { browse_section: activeSection } : {}),
    };
  }, [activeSection, hasCityStateParams, radiusMiles, urlCity, urlState]);

  useEffect(() => {
    if (activeSection) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const apiParams = await buildApiParams(0);
        if (!cancelled) {
          const { limit: _limit, offset: _offset, browse_section: _section, ...locationOnly } = apiParams;
          setFeaturedLocationParams(locationOnly);
        }
      } catch {
        if (!cancelled) setFeaturedLocationParams(null);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSection, buildApiParams, browseScopeKey]);

  useEffect(() => {
    if (!activeSection) return undefined;

    let cancelled = false;
    const controller = new AbortController();
    const requestId = browseRequestRef.current + 1;
    browseRequestRef.current = requestId;

    async function run() {
      setLoading(true);
      setError("");
      setMenus([]);
      setBrowseOffset(0);
      setHasMore(false);

      try {
        const apiParams = await buildApiParams(0);
        if (cancelled) return;
        const response = await getBrowseMenus(apiParams, { signal: controller.signal });
        if (cancelled || requestId !== browseRequestRef.current) return;

        const extracted = dedupeDiscoveryMenus(extractMenus(response));
        const newOffset = response?.pagination?.next_offset ?? extracted.length;
        const newTotal = response?.total_count ?? extracted.length;

        setMenus(extracted);
        setBrowseOffset(newOffset);
        setHasMore(response?.pagination?.has_more ?? (newOffset < newTotal));
        setSponsoredPlacements(Array.isArray(response?.sponsored_placements) ? response.sponsored_placements : []);
      } catch (fetchError) {
        if (cancelled || fetchError?.name === "AbortError") return;
        setError(readErrorMessage(fetchError));
      } finally {
        if (!cancelled && requestId === browseRequestRef.current) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeSection, browseScopeKey, buildApiParams]);

  const loadMore = useCallback(async () => {
    if (!activeSection || loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError("");
    const requestId = browseRequestRef.current;
    try {
      const apiParams = await buildApiParams(browseOffset);
      const response = await getBrowseMenus(apiParams);
      if (requestId !== browseRequestRef.current) return;
      const more = dedupeDiscoveryMenus(extractMenus(response));
      const newTotal = response?.total_count ?? (browseOffset + more.length);
      const newOffset = response?.pagination?.next_offset ?? (browseOffset + more.length);
      setMenus((prev) => dedupeDiscoveryMenus([...prev, ...more]));
      setBrowseOffset(newOffset);
      setHasMore(response?.pagination?.has_more ?? (newOffset < newTotal));
    } catch (fetchError) {
      setError(readErrorMessage(fetchError));
    } finally {
      setLoadingMore(false);
    }
  }, [activeSection, browseOffset, buildApiParams, hasMore, loading, loadingMore]);

  function selectSection(sectionId) {
    const next = new URLSearchParams(search);
    next.set("section", sectionId);
    navigate({ search: `?${next.toString()}` });
  }

  function clearSection() {
    const next = new URLSearchParams(search);
    next.delete("section");
    navigate({ search: next.toString() ? `?${next.toString()}` : "" }, { replace: true });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)" }}>
      <StickyPageHeader
        title={activeSection ? activeTitle : t("menuBrowser.title", "Browse Menus")}
      />
      {activeSection ? (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 14px" : "0 24px" }}>
          <button
            type="button"
            onClick={clearSection}
            style={{
              marginTop: 4,
              border: "none",
              background: "transparent",
              color: "#1d4ed8",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            ← {t("menuBrowser.allCategories", "All categories")}
          </button>
        </div>
      ) : null}
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: isMobile ? "12px 14px 88px" : "20px 24px 88px",
      }}>
        {activeSection ? (
          <MenuBrowserCategoryFeed
            title={activeTitle}
            menus={menus}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            hasMore={hasMore}
            onLoadMore={loadMore}
            sponsoredPlacements={sponsoredPlacements}
          />
        ) : (
          <>
            {featuredLocationParams ? (
              <MenuBrowserFeaturedStrip locationParams={featuredLocationParams} />
            ) : null}
            <MenuBrowserLanding
              categories={categories}
              locationLabel={locationLabel}
              onSelect={selectSection}
            />
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
