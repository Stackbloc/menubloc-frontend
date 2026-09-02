/**
 * Feed home — immediate full-screen video swipe (TikTok/Reels-style).
 * Reuses SeeWhosEatingFullscreen; photos never enter this pool.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listSeeWhosEating } from "../../../lib/consumerApi.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import { FEED_VIDEO_POSTED_EVENT } from "../../../lib/feedVideoCompose.js";
import {
  hasSeenFeedBefore,
  markFeedFirstVisitSeen,
  shouldShowFeedEmptyFirstVisitPrompt,
} from "../../../lib/feedEmptyFirstVisitPrompt.js";
import {
  FEED_HOME_X_COACH_COPY,
  FEED_HOME_X_COACH_DURATION_MS,
} from "../../../lib/feedHomeXCoach.js";
import {
  FEED_HOME_DESKTOP_NAV_COACH_COPY,
  FEED_HOME_DESKTOP_NAV_COACH_DURATION_MS,
} from "../../../lib/feedVerticalReelNavigationCopy.js";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import SeeWhosEatingFullscreen from "../myMenuply/SeeWhosEatingFullscreen.jsx";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { feedClipQueryParam, resolveFeedClipStartIndex } from "../../../lib/feedShare.js";

const DEFAULT_MARKET = { city: "Los Angeles", state: "CA" };

function resolveMarket() {
  if (typeof window === "undefined") return DEFAULT_MARKET;
  const detected = readDetectedLocation(window.localStorage);
  const dCity = String(detected?.city || "").trim();
  const dState = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (dCity && dState) return { city: dCity, state: dState };
  return DEFAULT_MARKET;
}

export default function FeedHomePage() {
  const { isAuthenticated, consumer } = useConsumer();
  const [searchParams] = useSearchParams();
  const sharedClipId = useMemo(
    () => feedClipQueryParam(searchParams.get("clip")),
    [searchParams]
  );
  const isDesktop = useFeedShellDesktop();
  const [items, setItems] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEmptyFirstVisitPrompt, setShowEmptyFirstVisitPrompt] = useState(false);
  const [showXCoach, setShowXCoach] = useState(() => !isDesktop);
  const [showDesktopNavCoach, setShowDesktopNavCoach] = useState(false);
  const market = resolveMarket();

  useEffect(() => {
    if (!isDesktop || items.length === 0) {
      setShowDesktopNavCoach(false);
      return undefined;
    }
    setShowDesktopNavCoach(true);
    const timer = window.setTimeout(
      () => setShowDesktopNavCoach(false),
      FEED_HOME_DESKTOP_NAV_COACH_DURATION_MS
    );
    return () => window.clearTimeout(timer);
  }, [isDesktop, items.length]);

  useEffect(() => {
    if (isDesktop) {
      setShowXCoach(false);
      return undefined;
    }
    setShowXCoach(true);
    const timer = window.setTimeout(() => setShowXCoach(false), FEED_HOME_X_COACH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isDesktop]);

  useEffect(() => {
    let cancelled = false;
    function loadFeed() {
      setLoading(true);
      setError("");
      listSeeWhosEating({
        city: market.city,
        state: market.state,
        limit: 20,
        kind: "all",
      })
        .then((data) => {
          if (cancelled) return;
          const rows = Array.isArray(data?.items) ? data.items : [];
          const publicVideoCount = Number(data?.public_video_count) || 0;
          const storage =
            typeof window !== "undefined" ? window.localStorage : null;
          const showPrompt = shouldShowFeedEmptyFirstVisitPrompt({
            publicVideoCount,
            hasItems: rows.length > 0,
            storage,
          });
          if (storage && !hasSeenFeedBefore(storage)) {
            markFeedFirstVisitSeen(storage);
          }
          setShowEmptyFirstVisitPrompt(showPrompt);
          setItems(rows);
        })
        .catch((err) => {
          if (cancelled) return;
          setItems([]);
          setError(err?.message || "Unable to load Feed");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    loadFeed();
    function onPosted() {
      loadFeed();
    }
    window.addEventListener(FEED_VIDEO_POSTED_EVENT, onPosted);
    return () => {
      cancelled = true;
      window.removeEventListener(FEED_VIDEO_POSTED_EVENT, onPosted);
    };
  }, [market.city, market.state]);

  useEffect(() => {
    setStartIndex(resolveFeedClipStartIndex(items, sharedClipId));
  }, [items, sharedClipId]);

  function onRemovedFromFeed(itemId) {
    const id = String(itemId || "").trim();
    if (!id) return;
    setItems((prev) => (prev || []).filter((row) => String(row?.id) !== id));
  }

  const xCoachBanner =
    showXCoach ? (
      <p style={styles.xCoach} data-testid="feed-home-x-coach" role="status">
        {FEED_HOME_X_COACH_COPY}
      </p>
    ) : null;

  const desktopNavCoachBanner =
    showDesktopNavCoach ? (
      <p style={styles.desktopNavCoach} data-testid="feed-home-desktop-nav-coach" role="status">
        {FEED_HOME_DESKTOP_NAV_COACH_COPY}
      </p>
    ) : null;

  if (loading && items.length === 0) {
    return (
      <div style={styles.loading} data-testid="feed-home-loading">
        {xCoachBanner}
        {desktopNavCoachBanner}
        <p style={styles.loadingText}>Loading Feed…</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div style={styles.loading} data-testid="feed-home-error">
        {xCoachBanner}
        {desktopNavCoachBanner}
        <p style={styles.loadingText}>{error}</p>
      </div>
    );
  }

  return (
    <div data-testid="feed-home">
      {xCoachBanner}
      {desktopNavCoachBanner}
      <SeeWhosEatingFullscreen
        variant="feedHome"
        items={items}
        startIndex={startIndex}
        isAuthenticated={Boolean(isAuthenticated)}
        viewerUserId={consumer?.id || null}
        onRemovedFromFeed={onRemovedFromFeed}
        bottomInset={isDesktop ? 0 : FEED_PRIMARY_NAV_HEIGHT + 8}
        desktopFeedShell={isDesktop}
        showEmptyFirstVisitPrompt={showEmptyFirstVisitPrompt}
        sharedClipId={sharedClipId}
        showSharedAccountInvite={Boolean(sharedClipId && !isAuthenticated)}
      />
    </div>
  );
}

const styles = {
  chrome: {
    position: "absolute",
    top: "max(12px, env(safe-area-inset-top))",
    left: 12,
    right: 12,
    zIndex: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    pointerEvents: "none",
  },
  chromeBtn: {
    pointerEvents: "auto",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  loading: {
    minHeight: "100dvh",
    background: "#050705",
    position: "relative",
    color: "#fff",
  },
  loadingText: {
    position: "absolute",
    top: "42%",
    left: 24,
    right: 24,
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    fontWeight: 600,
  },
  xCoach: {
    position: "fixed",
    left: 16,
    right: 16,
    bottom: `calc(${FEED_PRIMARY_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`,
    zIndex: 45,
    margin: 0,
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(16, 40, 32, 0.94)",
    border: "1px solid rgba(94, 234, 212, 0.35)",
    color: "#e8f0ec",
    fontSize: 14,
    lineHeight: 1.45,
    fontWeight: 650,
    textAlign: "center",
    pointerEvents: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  },
  desktopNavCoach: {
    position: "fixed",
    left: 16,
    right: 16,
    top: "max(12px, env(safe-area-inset-top))",
    zIndex: 45,
    margin: 0,
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(16, 40, 32, 0.94)",
    border: "1px solid rgba(94, 234, 212, 0.35)",
    color: "#e8f0ec",
    fontSize: 14,
    lineHeight: 1.45,
    fontWeight: 650,
    textAlign: "center",
    pointerEvents: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  },
};
