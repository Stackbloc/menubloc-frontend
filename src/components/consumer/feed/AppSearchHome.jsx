/**
 * Feed Search home, the same screen as the app's Search tab (menuply-mobile app/(tabs)/search.tsx;
 * the app wins where the two differ, Andre 2026-10-29): location chip + Explore clusters,
 * "What sounds good?", Search ●— Menu Browser switch, outlined field with a hard shadow,
 * HEALTH GOALS chips (each its own search), the Right now card (swipe for later meal times)
 * and CRAVINGS pages. Results stay on GrubbidSearchResults.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHomeBrowseFeed } from "../../../hooks/useHomeBrowseFeed.js";
import { useMarketClusters } from "../../../hooks/useMarketClusters.js";
import { buildHomeSearchUrl } from "../../../lib/homeNextNavigation.js";
import { rewriteSearchPathForFeedShell, FEED_MOBILE_HEADER_OFFSET } from "../../../lib/feedShellNavigation.js";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";
import { captureEvent } from "../../../services/posthog.js";
import {
  APP_HEALTH_GOALS,
  CRAVING_PAGES,
  HERO_REFRESH_MS,
  TIME_OF_DAY_THEMES,
  heroPages,
} from "../../../lib/appSearchHome.js";
import HomeNextLocationSelector from "../../homeNext/HomeNextLocationSelector.jsx";
import AppIcon from "../../icons/AppIcon.jsx";

const INK = "#111613";
const INK_MUTED = "#5c665f";
const BORDER = "#e1e6e1";

const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/** Decoration for each Right now theme (same drawings as the app). */
function HeroGraphic({ id }) {
  const common = { width: 120, height: 120, viewBox: "0 0 120 120", "aria-hidden": true, focusable: "false" };
  if (id === "breakfast") {
    return (
      <svg {...common}>
        {SUN_RAYS.map((deg) => (
          <rect key={deg} x={56} y={4} width={8} height={20} rx={4} fill="#FFC72C" transform={`rotate(${deg} 60 60)`} />
        ))}
        <circle cx={60} cy={60} r={26} fill="#FFC72C" />
      </svg>
    );
  }
  if (id === "lunch") {
    return (
      <svg {...common}>
        <circle cx={60} cy={60} r={46} fill="#FFE066" />
      </svg>
    );
  }
  if (id === "dinner") {
    return (
      <svg {...common}>
        <circle cx={60} cy={60} r={40} fill="#E4E8E1" />
        <circle cx={46} cy={50} r={7} fill="#CBD1C8" />
        <circle cx={70} cy={74} r={5} fill="#CBD1C8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx={62} cy={58} r={40} fill="#78C41A" />
      <circle cx={80} cy={44} r={34} fill="#121712" />
      <circle cx={14} cy={52} r={2.5} fill="#FFFFFF" />
      <circle cx={36} cy={96} r={2} fill="#FFFFFF" />
      <circle cx={78} cy={106} r={1.8} fill="#FFFFFF" />
    </svg>
  );
}

/** Horizontal snap pager with page dots under it; `label(page)` describes the page in view. */
function Pager({ count, label, testId, children }) {
  const ref = useRef(null);
  const [page, setPage] = useState(0);
  function onScroll() {
    const el = ref.current;
    if (el?.clientWidth) setPage(Math.round(el.scrollLeft / el.clientWidth));
  }
  return (
    <>
      <div ref={ref} onScroll={onScroll} className="app-search-rail" style={styles.pager} data-testid={testId}>
        {children}
      </div>
      <div style={styles.dots} aria-label={label(page)} role="img">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} style={{ ...styles.dot, ...(i === page ? styles.dotOn : null) }} />
        ))}
      </div>
    </>
  );
}

export default function AppSearchHome({ modeToggleSlot = null, initialQuery = "", onDraftQueryChange = null }) {
  const navigate = useNavigate();
  const isFeedDesktop = useFeedShellDesktop();
  const [text, setTextState] = useState(() => String(initialQuery || ""));
  const [photoNote, setPhotoNote] = useState(false);
  const setText = (v) => {
    setTextState(v);
    onDraftQueryChange?.(v);
  };

  const { autoLocation, appliedLocation, setAppliedLocation, shouldUseGeoBrowse, locating } = useHomeBrowseFeed();
  const { market: clusterMarket, clusters } = useMarketClusters(appliedLocation || autoLocation.label);

  // Right now follows the device clock: re-checked every minute and when the tab comes back.
  const [heroes, setHeroes] = useState(() => heroPages());
  useEffect(() => {
    const refresh = () => {
      const next = heroPages();
      setHeroes((prev) => (prev.map((h) => h.label).join("|") === next.map((h) => h.label).join("|") ? prev : next));
    };
    const tick = window.setInterval(refresh, HERO_REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function go({ query = "", filterKey = null, mealPeriod = null, surface }) {
    const target = buildHomeSearchUrl({ query, filterKey, mealPeriod, appliedLocation, autoLocation, shouldUseGeoBrowse });
    if (query) captureEvent("search_performed", { query, surface });
    navigate(rewriteSearchPathForFeedShell(target));
  }

  function submit(e) {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    go({ query: q, surface: "feed_search_home" });
  }

  // Words already typed stay the search; the card adds its meal period. Otherwise its own query.
  function showHero(h) {
    const q = text.trim() || h.query;
    setText(q);
    go({ query: q, mealPeriod: h.mealPeriod, surface: "feed_search_right_now" });
  }

  return (
    <div
      style={{
        ...styles.page,
        marginTop: isFeedDesktop ? 0 : FEED_MOBILE_HEADER_OFFSET,
      }}
      data-testid="feed-shop-hero"
    >
      <style>{`
        .app-search-rail { scrollbar-width: none; -ms-overflow-style: none; }
        .app-search-rail::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .app-search-input::placeholder { color: ${INK_MUTED}; }
        .app-search-input:focus { outline: none; }
        .app-search-field:focus-within { box-shadow: 0 0 0 3px rgba(15,122,36,0.25); }
      `}</style>

      {/* The selector's chip bleeds 12px left by design; pad so it lines up with the page edge. */}
      <div style={{ paddingLeft: 12 }}>
      <HomeNextLocationSelector
        autoLocation={autoLocation}
        appliedLocation={appliedLocation}
        onApplyLocation={setAppliedLocation}
        locating={locating}
        clusters={clusters}
        clusterMarket={clusterMarket}
      />
      </div>

      <h1 style={styles.headline} data-testid="search-headline">
        What sounds good?
      </h1>

      {modeToggleSlot ? <div style={styles.modeRow}>{modeToggleSlot}</div> : null}

      <form role="search" onSubmit={submit} style={styles.fieldWrap}>
        <div aria-hidden="true" style={styles.fieldShadow} />
        <div className="app-search-field" style={styles.field}>
          <AppIcon name="search" size={20} color={INK} />
          <input
            className="app-search-input"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search dishes or places"
            aria-label="Search"
            style={styles.input}
            data-testid="search-input"
          />
          <button
            type="button"
            aria-label="Search with a photo"
            onClick={() => setPhotoNote(true)}
            style={styles.camera}
            data-testid="search-camera"
          >
            <AppIcon name="camera" size={22} color={INK} />
          </button>
        </div>
      </form>
      {photoNote ? <p style={styles.photoNote}>Photo search is coming soon.</p> : null}

      <section style={styles.section}>
        <h2 style={styles.sectionLabel}>HEALTH GOALS</h2>
        <div className="app-search-rail" style={styles.chips}>
          {APP_HEALTH_GOALS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-label={`Search ${g.label}`}
              onClick={() => {
                setText(g.label);
                go({ query: g.query, filterKey: g.filterKey || null, surface: "feed_search_health_goal" });
              }}
              style={styles.goal}
              data-testid={`search-goal-${g.id}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <section style={styles.section} data-testid="search-hero">
        <Pager
          count={heroes.length}
          label={(page) => `${heroes[page]?.label ?? "Right now"}, ${page + 1} of ${heroes.length}. Swipe for later meal times.`}
          testId="search-hero-pager"
        >
          {heroes.map((h, i) => {
            const c = TIME_OF_DAY_THEMES[h.id].colors;
            return (
              <div key={h.id} style={styles.page1}>
                <div
                  style={{
                    ...styles.hero,
                    background: c.background,
                    border: c.border ? `0.5px solid ${c.border}` : "none",
                  }}
                  data-testid={`search-hero-${h.id}`}
                >
                  <div style={styles.heroGraphic} aria-hidden="true">
                    <HeroGraphic id={h.id} />
                  </div>
                  <div style={{ ...styles.heroLabel, color: c.label }}>{h.label.toUpperCase()}</div>
                  <h3 style={{ ...styles.heroTitle, color: c.title }}>{h.title}</h3>
                  <p style={{ ...styles.heroBody, color: c.body }}>{h.body}</p>
                  <button
                    type="button"
                    aria-label={`${h.button}: ${h.title}`}
                    onClick={() => showHero(h)}
                    style={{ ...styles.heroButton, background: c.button, color: c.buttonText }}
                    data-testid={i === 0 ? "search-hero-button" : `search-hero-button-${h.id}`}
                  >
                    {h.button}
                    <AppIcon name="arrowRight" size={16} color={c.buttonText} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            );
          })}
        </Pager>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionLabel}>CRAVINGS</h2>
        <Pager
          count={CRAVING_PAGES.length}
          label={(page) => `${CRAVING_PAGES[page]?.title ?? "Cravings"}, page ${page + 1} of ${CRAVING_PAGES.length}. Swipe for more.`}
          testId="search-cravings-pager"
        >
          {CRAVING_PAGES.map((group, p) => (
            <div key={group.id} style={styles.page1} data-testid={`search-cravings-page-${p}`}>
              <h3 style={styles.groupTitle}>{group.title}</h3>
              {/* 4 tiles sit 2 × 2; 5–6 sit three across. */}
              <div style={{ ...styles.grid, gridTemplateColumns: group.cravings.length === 4 ? "1fr 1fr" : "1fr 1fr 1fr" }}>
                {group.cravings.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    aria-label={`Search ${c.label}`}
                    onClick={() => {
                      setText(c.query);
                      go({ query: c.query, surface: "feed_search_craving" });
                    }}
                    style={{ ...styles.tile, background: c.background, color: c.foreground }}
                    data-testid={`search-craving-${c.query}`}
                  >
                    <AppIcon name={c.icon} size={30} color={c.foreground} strokeWidth={1.8} />
                    <span style={styles.tileText}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Pager>
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 576,
    margin: "0 auto",
    padding: "20px 16px calc(var(--feed-primary-nav-h, 56px) + env(safe-area-inset-bottom, 0px) + 28px)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "#ffffff",
    color: INK,
    boxSizing: "border-box",
  },
  headline: { margin: 0, fontSize: 34, lineHeight: "38px", letterSpacing: -1, fontWeight: 800, color: INK },
  modeRow: { display: "flex", justifyContent: "flex-end", marginBottom: -6 },
  fieldWrap: { position: "relative", margin: "10px 0 3px" },
  // Hard offset shadow (0, 3px, no blur, ink), as in the app.
  fieldShadow: { position: "absolute", top: 3, bottom: -3, left: 0, right: 0, borderRadius: 14, background: INK },
  field: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: 54,
    borderRadius: 14,
    border: `1.5px solid ${INK}`,
    background: "#ffffff",
    paddingLeft: 14,
    paddingRight: 6,
    boxSizing: "border-box",
  },
  input: {
    flex: 1,
    minWidth: 0,
    border: "none",
    background: "transparent",
    fontSize: 16,
    color: INK,
    padding: "12px 0",
    fontFamily: "inherit",
  },
  camera: {
    width: 42,
    height: 42,
    borderRadius: 10,
    border: "none",
    background: "#f5f7f4",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  photoNote: { margin: 0, fontSize: 13, color: INK_MUTED },
  section: { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 },
  sectionLabel: { margin: 0, fontSize: 12, lineHeight: "16px", letterSpacing: 0.7, fontWeight: 700, color: INK_MUTED },
  chips: { display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px", padding: "0 16px" },
  goal: {
    flexShrink: 0,
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 999,
    border: `1.5px solid ${BORDER}`,
    background: "#ffffff",
    color: INK,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pager: { display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", overscrollBehaviorX: "contain" },
  page1: { flex: "0 0 100%", scrollSnapAlign: "start", boxSizing: "border-box", paddingRight: 10 },
  hero: {
    position: "relative",
    borderRadius: 20,
    padding: 20,
    minHeight: 170,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxSizing: "border-box",
  },
  heroGraphic: { position: "absolute", top: -30, right: -30, pointerEvents: "none" },
  heroLabel: { position: "relative", fontSize: 12, lineHeight: "16px", letterSpacing: 0.96, fontWeight: 500, maxWidth: "75%" },
  heroTitle: { position: "relative", margin: 0, fontSize: 24, lineHeight: "29px", fontWeight: 500, maxWidth: 200 },
  heroBody: { position: "relative", margin: 0, fontSize: 14, lineHeight: "20px" },
  heroButton: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    padding: "8px 16px",
    marginTop: 4,
    border: "none",
    borderRadius: 999,
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  groupTitle: { margin: "0 0 10px", fontSize: 15, lineHeight: "20px", fontWeight: 700, color: INK },
  grid: { display: "grid", gap: 10 },
  tile: {
    minHeight: 104,
    borderRadius: 16,
    padding: 14,
    border: "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  tileText: { fontSize: 15, lineHeight: "19px", fontWeight: 700 },
  dots: { display: "flex", justifyContent: "center", gap: 6, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, background: BORDER, transition: "width 150ms" },
  dotOn: { width: 18, background: INK },
};
