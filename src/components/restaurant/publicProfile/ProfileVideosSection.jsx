/**
 * Public restaurant profile Videos — image grid + player sheet + See all.
 * Pool from GET /public/restaurants/:id/videos?exclude_kinds=plan&limit=60.
 * Selection is client-side (selectPreviewVideos). Empty → section hidden.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { listRestaurantProfileVideos } from "../../../lib/restaurantProfileVideosApi.js";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  capturePosterFromVideoElement,
  withVideoPreviewSeek,
} from "../../../lib/consumerCameraCapture.js";
import {
  selectPreviewVideos,
  deriveCategoryChips,
  formatDurationMs,
  dishCaption,
  isPreviewEligible,
  scorePreviewVideo,
} from "../../../lib/selectPreviewVideos.js";
import {
  trackVideoTileImpression,
  trackVideoTileOpen,
  trackVideoSheetClose,
} from "../../../lib/profileVideoAnalytics.js";
import { FilterChip } from "../../grubbid/GrubbidPrimitives.jsx";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileReadableSurfaceStyle,
} from "./profilePrimitives.jsx";

export const PROFILE_VIDEOS_FETCH_LIMIT = 60;
export const PROFILE_VIDEOS_PREVIEW_LIMIT = 6;
export const PROFILE_VIDEOS_SEE_ALL_PAGE = 24;

const LAST_SHOWN_PREFIX = "menuply.profileVideos.lastShown.";
const STILL_IN_FLIGHT_MAX = 6;
let stillInFlight = 0;

function readLastShown(restaurantId) {
  try {
    const raw = localStorage.getItem(`${LAST_SHOWN_PREFIX}${restaurantId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeLastShown(restaurantId, ids) {
  try {
    localStorage.setItem(
      `${LAST_SHOWN_PREFIX}${restaurantId}`,
      JSON.stringify((ids || []).map(String).slice(0, 12))
    );
  } catch {
    /* ignore */
  }
}

function newSeed() {
  return (Math.random() * 0xffffffff) >>> 0;
}

function recentSort(a, b) {
  return String(b.created_at || "").localeCompare(String(a.created_at || ""));
}

function TileThumb({ video, width = 240, height = 373 }) {
  const thumbRaw = video?.thumbnail_url || null;
  const thumb = thumbRaw ? resolveConsumerMediaUrl(thumbRaw) : "";
  const src = video?.video_url ? resolveConsumerMediaUrl(video.video_url) : "";
  const [poster, setPoster] = useState("");
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(false);
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const capturedRef = useRef(false);

  useEffect(() => {
    setPoster("");
    setFailed(false);
    setActive(false);
    capturedRef.current = false;
  }, [thumb, src]);

  useEffect(() => {
    if (thumb || !src || failed) return undefined;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setActive(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "80px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [thumb, src, failed]);

  useEffect(() => {
    if (thumb || !active || !src || poster || failed) return undefined;
    if (stillInFlight >= STILL_IN_FLIGHT_MAX) return undefined;
    stillInFlight += 1;
    const el = videoRef.current;
    let cancelled = false;

    function done() {
      stillInFlight = Math.max(0, stillInFlight - 1);
    }

    function tryCapture() {
      if (cancelled || !el || capturedRef.current) return;
      const dataUrl = capturePosterFromVideoElement(el);
      if (dataUrl) {
        capturedRef.current = true;
        setPoster(dataUrl);
        done();
      }
    }

    function onMeta() {
      try {
        const dur = Number(el.duration);
        const seekTo =
          Number.isFinite(dur) && dur > 0 ? Math.min(0.12, Math.max(0.04, dur * 0.02)) : 0.1;
        if (el.currentTime < seekTo - 0.01) el.currentTime = seekTo;
        else tryCapture();
      } catch {
        tryCapture();
      }
    }

    function onError() {
      if (!cancelled) {
        setFailed(true);
        done();
      }
    }

    el?.addEventListener("loadedmetadata", onMeta);
    el?.addEventListener("loadeddata", tryCapture);
    el?.addEventListener("seeked", tryCapture);
    el?.addEventListener("error", onError);
    if (el && el.readyState >= 2) onMeta();

    return () => {
      cancelled = true;
      if (!capturedRef.current) done();
      el?.removeEventListener("loadedmetadata", onMeta);
      el?.removeEventListener("loadeddata", tryCapture);
      el?.removeEventListener("seeked", tryCapture);
      el?.removeEventListener("error", onError);
    };
  }, [thumb, active, src, poster, failed]);

  const display = thumb || poster;

  return (
    <div ref={wrapRef} style={styles.thumbFrame}>
      {display ? (
        <img
          src={display}
          alt=""
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          style={styles.thumbImg}
          data-testid="profile-video-tile-img"
        />
      ) : (
        <>
          {active && src && !failed && !poster ? (
            <video
              ref={videoRef}
              src={withVideoPreviewSeek(src)}
              crossOrigin="anonymous"
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
              style={styles.hiddenStillVideo}
              data-testid="profile-video-tile-still-capture"
            />
          ) : null}
          <div
            style={styles.neutralPlaceholder}
            data-testid="profile-video-tile-placeholder"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}

function VideoTile({
  video,
  restaurantName,
  position,
  poolSize,
  activeChip,
  onOpen,
  analyticsBase,
}) {
  const tileRef = useRef(null);
  const impressed = useRef(false);
  const durationLabel = formatDurationMs(video.duration_ms);
  const caption = dishCaption(video, restaurantName);

  useEffect(() => {
    const el = tileRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    let timer = null;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5);
        if (hit && !impressed.current) {
          timer = setTimeout(() => {
            if (impressed.current) return;
            impressed.current = true;
            trackVideoTileImpression({
              ...analyticsBase,
              video_id: video.video_key || `${video.kind}:${video.video_id}`,
              position,
              pool_size: poolSize,
              active_chip: activeChip || "all",
              slot: video._preview_slot || "sampled",
            });
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0.5] }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [analyticsBase, video, position, poolSize, activeChip]);

  return (
    <button
      ref={tileRef}
      type="button"
      data-testid="profile-video-tile"
      data-video-kind={video.kind}
      data-preview-slot={video._preview_slot || ""}
      aria-label={`Play video: ${caption}`}
      onClick={() => onOpen(video, position)}
      style={styles.tile}
    >
      <TileThumb video={video} />
      {durationLabel ? (
        <span style={styles.durationChip} data-testid="profile-video-duration">
          {durationLabel}
        </span>
      ) : null}
      <div style={styles.tileBand}>
        <span style={styles.tileCaption}>{caption}</span>
      </div>
    </button>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(Boolean(mq.matches));
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return reduced;
}

function useSheetMotionStyles() {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const id = "profile-video-sheet-motion";
    if (document.getElementById(id)) return undefined;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@keyframes profileVideoSheetIn{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`;
    document.head.appendChild(style);
    return undefined;
  }, []);
}

function clampAspectRatio(w, h) {
  const width = Number(w);
  const height = Number(h);
  if (!(width > 0) || !(height > 0)) return 9 / 16;
  const ratio = width / height;
  const minR = 9 / 16;
  const maxR = 16 / 9;
  return Math.min(maxR, Math.max(minR, ratio));
}

function PlayerSheet({
  open,
  video,
  restaurantName,
  onClose,
  analyticsBase,
  returnFocusRef,
}) {
  const reducedMotion = usePrefersReducedMotion();
  useSheetMotionStyles();
  const titleId = useId();
  const dialogRef = useRef(null);
  const videoElRef = useRef(null);
  const openedAt = useRef(0);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(9 / 16);
  const src = video?.video_url ? resolveConsumerMediaUrl(video.video_url) : "";
  const caption = dishCaption(video, restaurantName);
  const dishHref =
    video?.menu_item_id != null
      ? `/menu-items/${encodeURIComponent(String(video.menu_item_id))}?from=profile`
      : null;
  const durationLabel = formatDurationMs(video?.duration_ms);
  const isLandscape = aspectRatio >= 1;
  const desktopMaxWidth = isLandscape ? 560 : 360;

  useEffect(() => {
    if (!open) return undefined;
    setAspectRatio(9 / 16);
    openedAt.current = Date.now();
    setLoadError(false);
    const prev = document.activeElement;
    const node = dialogRef.current;
    const focusables = () =>
      node
        ? [
            ...node.querySelectorAll(
              'button, [href], video, [tabindex]:not([tabindex="-1"])'
            ),
          ].filter((el) => !el.hasAttribute("disabled"))
        : [];
    requestAnimationFrame(() => {
      const list = focusables();
      (list[0] || node)?.focus?.();
    });

    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const watchMs = Math.max(0, Date.now() - openedAt.current);
      trackVideoSheetClose({
        ...analyticsBase,
        video_id: video?.video_key || `${video?.kind}:${video?.video_id}`,
        watch_time_ms: watchMs,
      });
      try {
        videoElRef.current?.pause?.();
      } catch {
        /* ignore */
      }
      const restore = returnFocusRef?.current || prev;
      if (restore && typeof restore.focus === "function") {
        try {
          restore.focus();
        } catch {
          /* ignore */
        }
      }
    };
  }, [open, onClose, analyticsBase, video, returnFocusRef]);

  useEffect(() => {
    if (!open || !src || loadError) return undefined;
    const el = videoElRef.current;
    if (!el) return undefined;
    el.muted = video?.play_muted === true;
    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => setLoadError(true));
    }
    return () => {
      try {
        el.pause();
      } catch {
        /* ignore */
      }
    };
  }, [open, src, retryKey, loadError, video?.play_muted]);

  if (!open || !video) return null;

  const isDesktop =
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

  return (
    <div
      data-testid="profile-video-player-scrim"
      style={styles.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="profile-video-player-sheet"
        style={{
          ...styles.sheet,
          ...(isDesktop ? styles.sheetDesktop : null),
          ...(reducedMotion ? null : styles.sheetMotion),
        }}
      >
        <div style={styles.handle} aria-hidden="true" />
        <button
          type="button"
          aria-label="Close"
          data-testid="profile-video-player-close"
          onClick={onClose}
          style={styles.closeX}
        >
          ×
        </button>
        <div style={styles.sheetBody}>
          <div
            style={{
              ...styles.playerFrame,
              aspectRatio: String(aspectRatio),
              ...(isDesktop
                ? { maxWidth: desktopMaxWidth, width: "clamp(130px, 38%, 200px)" }
                : null),
            }}
            data-testid="profile-video-player-frame"
            data-aspect={isLandscape ? "landscape" : "portrait"}
          >
            {loadError ? (
              <div style={styles.loadFail} data-testid="profile-video-player-error">
                <p style={{ margin: 0 }}>Couldn’t load this video.</p>
                <button
                  type="button"
                  style={styles.retryBtn}
                  onClick={() => {
                    setLoadError(false);
                    setRetryKey((k) => k + 1);
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <video
                  key={`${video.video_key || video.video_id}-${retryKey}`}
                  ref={videoElRef}
                  src={src}
                  controls
                  playsInline
                  autoPlay
                  muted={video.play_muted === true}
                  poster={
                    video.thumbnail_url
                      ? resolveConsumerMediaUrl(video.thumbnail_url)
                      : undefined
                  }
                  onLoadedMetadata={(e) => {
                    const el = e.currentTarget;
                    setAspectRatio(clampAspectRatio(el.videoWidth, el.videoHeight));
                  }}
                  onError={() => setLoadError(true)}
                  style={styles.playerVideo}
                  data-testid="profile-video-player"
                  data-play-muted={video.play_muted === true ? "1" : "0"}
                />
                {video.play_muted === true ? (
                  <div style={styles.noSound} data-testid="profile-video-no-sound">
                    No sound.
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div style={styles.sheetMeta}>
            <h2 id={titleId} style={styles.sheetTitle}>
              {dishHref ? (
                <Link to={dishHref} style={{ color: "inherit", textDecoration: "none" }}>
                  {caption}
                </Link>
              ) : (
                caption
              )}
            </h2>
            {video.creator_label ? (
              <p style={styles.sheetCreator} data-testid="profile-video-creator-label">
                {video.creator_label}
              </p>
            ) : null}
            {durationLabel ? (
              <p style={styles.sheetMuted}>{durationLabel}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SeeAllSheet({
  open,
  pool,
  restaurantName,
  restaurantId,
  category,
  onClose,
  onOpenVideo,
  analyticsBase,
}) {
  const [sort, setSort] = useState("top");
  const [page, setPage] = useState(0);
  const scrollRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    setPage(0);
  }, [open, category, sort]);

  const filtered = useMemo(() => {
    let rows = (pool || []).filter(isPreviewEligible);
    if (category) {
      const want = String(category).trim().toLowerCase().replace(/\s+/g, " ");
      rows = rows.filter(
        (v) =>
          String(v.section_name || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ") === want
      );
    }
    return rows.map((v) => ({
      ...v,
      _preview_score: scorePreviewVideo(v, { profileRestaurantId: restaurantId }),
    }));
  }, [pool, category, restaurantId]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    if (sort === "recent") rows.sort(recentSort);
    else {
      rows.sort((a, b) => {
        const sa = Number(a._preview_score) || 0;
        const sb = Number(b._preview_score) || 0;
        if (sb !== sa) return sb - sa;
        return String(b.created_at || "").localeCompare(String(a.created_at || ""));
      });
    }
    return rows;
  }, [filtered, sort]);

  const pageItems = sorted.slice(
    page * PROFILE_VIDEOS_SEE_ALL_PAGE,
    (page + 1) * PROFILE_VIDEOS_SEE_ALL_PAGE
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PROFILE_VIDEOS_SEE_ALL_PAGE));

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="profile-videos-see-all-scrim"
      style={styles.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All videos"
        data-testid="profile-videos-see-all-sheet"
        style={{
          ...styles.seeAllSheet,
          ...(reducedMotion ? null : styles.sheetMotion),
        }}
      >
        <div style={styles.seeAllHeader}>
          <button type="button" aria-label="Close" onClick={onClose} style={styles.closeX}>
            ×
          </button>
          <div style={styles.seeAllTitle}>Videos</div>
          <div style={styles.sortRow} role="group" aria-label="Sort">
            <FilterChip
              active={sort === "top"}
              aria-pressed={sort === "top"}
              onClick={() => setSort("top")}
              data-testid="profile-videos-sort-top"
              style={styles.chipHit}
            >
              Top
            </FilterChip>
            <FilterChip
              active={sort === "recent"}
              aria-pressed={sort === "recent"}
              onClick={() => setSort("recent")}
              data-testid="profile-videos-sort-recent"
              style={styles.chipHit}
            >
              Recent
            </FilterChip>
          </div>
        </div>
        <div ref={scrollRef} style={styles.seeAllScroll}>
          <div style={styles.grid} data-testid="profile-videos-see-all-grid">
            {pageItems.map((video, idx) => (
              <VideoTile
                key={video.video_key || `${video.kind}:${video.video_id}`}
                video={video}
                restaurantName={restaurantName}
                position={page * PROFILE_VIDEOS_SEE_ALL_PAGE + idx}
                poolSize={sorted.length}
                activeChip={category || "all"}
                analyticsBase={analyticsBase}
                onOpen={(v, position) => onOpenVideo(v, position, scrollRef)}
              />
            ))}
          </div>
          {pageCount > 1 ? (
            <div style={styles.pager}>
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span>
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ProfileVideosSection({
  restaurantId,
  restaurantName = "",
  isMobile = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [category, setCategory] = useState(null);
  const [playerVideo, setPlayerVideo] = useState(null);
  const [playerPos, setPlayerPos] = useState(0);
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const tileFocusRef = useRef(null);
  const seeAllScrollRestore = useRef(null);

  const historyKey = `profileVideos:${restaurantId || ""}`;
  const cached = location.state?.[historyKey] || null;
  const seed = cached?.seed != null ? cached.seed : null;

  useEffect(() => {
    if (cached?.category !== undefined && cached.category !== category) {
      setCategory(cached.category || null);
    }
    // Only sync from history when the entry changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cached?.seed, cached?.category]);

  const ensureSeed = useCallback(() => {
    if (seed != null) return seed;
    const next = newSeed();
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      {
        replace: true,
        state: {
          ...(location.state || {}),
          [historyKey]: { seed: next, category: null },
        },
      }
    );
    return next;
  }, [seed, navigate, location, historyKey]);

  const load = useCallback(() => {
    let cancelled = false;
    if (!restaurantId) {
      setPool([]);
      setLoading(false);
      setFetchError(false);
      return () => {
        cancelled = true;
      };
    }
    setLoading(true);
    setFetchError(false);
    listRestaurantProfileVideos(restaurantId, {
      limit: PROFILE_VIDEOS_FETCH_LIMIT,
      excludeKinds: ["plan"],
    })
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data.videos) ? data.videos : [];
        setPool(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setPool([]);
          setFetchError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (!restaurantId || loading) return;
    ensureSeed();
  }, [restaurantId, loading, ensureSeed]);

  const lastShown = useMemo(
    () => (restaurantId ? readLastShown(restaurantId) : []),
    // Re-read once per restaurant load only — not on every selection write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [restaurantId, loading]
  );

  const eligiblePool = useMemo(() => pool.filter(isPreviewEligible), [pool]);
  const chips = useMemo(() => deriveCategoryChips(eligiblePool), [eligiblePool]);

  const preview = useMemo(() => {
    if (!eligiblePool.length || seed == null) return { items: [], poolSize: eligiblePool.length };
    return selectPreviewVideos(eligiblePool, {
      seed,
      now: Date.now(),
      lastShownIds: lastShown,
      category,
      limit: PROFILE_VIDEOS_PREVIEW_LIMIT,
      profileRestaurantId: restaurantId,
    });
  }, [eligiblePool, seed, lastShown, category, restaurantId]);

  useEffect(() => {
    if (!restaurantId || !preview.items.length) return;
    writeLastShown(
      restaurantId,
      preview.items.map((v) => v.video_key || `${v.kind}:${v.video_id}`)
    );
  }, [restaurantId, preview.items]);

  const analyticsBase = useMemo(
    () => ({
      restaurant_id: restaurantId != null ? String(restaurantId) : undefined,
    }),
    [restaurantId]
  );

  const poolCountLabel =
    eligiblePool.length >= PROFILE_VIDEOS_FETCH_LIMIT
      ? `${PROFILE_VIDEOS_FETCH_LIMIT}+`
      : String(eligiblePool.length);

  function setCategoryAndState(next) {
    setCategory(next);
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      {
        replace: true,
        state: {
          ...(location.state || {}),
          [historyKey]: {
            seed: seed != null ? seed : newSeed(),
            category: next,
          },
        },
      }
    );
  }

  function openPlayer(video, position, scrollRef) {
    if (scrollRef?.current) {
      seeAllScrollRestore.current = scrollRef.current.scrollTop;
    }
    tileFocusRef.current = document.activeElement;
    setPlayerVideo(video);
    setPlayerPos(position);
    trackVideoTileOpen({
      ...analyticsBase,
      video_id: video.video_key || `${video.kind}:${video.video_id}`,
      position,
      pool_size: preview.poolSize,
      active_chip: category || "all",
      slot: video._preview_slot || "sampled",
    });
  }

  function closePlayer() {
    setPlayerVideo(null);
    if (seeAllOpen && seeAllScrollRestore.current != null) {
      requestAnimationFrame(() => {
        const el = document.querySelector(
          '[data-testid="profile-videos-see-all-sheet"] [data-testid="profile-videos-see-all-grid"]'
        );
        const scroller = el?.parentElement;
        if (scroller) scroller.scrollTop = seeAllScrollRestore.current;
      });
    }
  }

  if (!restaurantId) return null;
  if (!loading && !fetchError && eligiblePool.length === 0) return null;

  return (
    <section
      data-testid="profile-videos-section"
      data-profile-surface="card"
      aria-label="Videos"
      style={profileReadableSurfaceStyle({
        marginBottom: isMobile ? 20 : 28,
      })}
    >
      <div style={styles.headerRow}>
        <div style={styles.heading}>Videos</div>
        {!loading ? (
          <span style={styles.count} data-testid="profile-videos-count">
            {poolCountLabel}
          </span>
        ) : null}
      </div>
      <p style={styles.disclaimer}>
        Tagged to this restaurant or its franchise. Restaurants can remove content from Menuply.
      </p>

      {fetchError ? (
        <div style={styles.errorBox} data-testid="profile-videos-error">
          <span>Couldn’t load videos.</span>
          <button type="button" style={styles.retryBtn} onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div style={styles.grid} data-testid="profile-videos-skeleton">
          {Array.from({ length: PROFILE_VIDEOS_PREVIEW_LIMIT }).map((_, i) => (
            <div key={i} style={styles.skeletonTile} aria-hidden="true" />
          ))}
        </div>
      ) : null}

      {!loading && !fetchError && eligiblePool.length > 0 ? (
        <>
          {chips.length >= 2 ? (
            <div
              style={styles.chipRow}
              role="group"
              aria-label="Filter videos by dish category"
              data-testid="profile-videos-chips"
            >
              <FilterChip
                active={!category}
                aria-pressed={!category}
                onClick={() => setCategoryAndState(null)}
                data-testid="profile-videos-chip-all"
                style={styles.chipHit}
              >
                All
              </FilterChip>
              {chips.map((chip) => (
                <FilterChip
                  key={chip.key}
                  active={category === chip.key}
                  aria-pressed={category === chip.key}
                  onClick={() => setCategoryAndState(chip.key)}
                  data-testid={`profile-videos-chip-${chip.key}`}
                  style={styles.chipHit}
                >
                  {chip.label}
                </FilterChip>
              ))}
            </div>
          ) : null}

          <div style={styles.grid} data-testid="profile-videos-grid">
            {preview.items.map((video, idx) => (
              <VideoTile
                key={video.video_key || `${video.kind}:${video.video_id}`}
                video={video}
                restaurantName={restaurantName}
                position={idx}
                poolSize={preview.poolSize}
                activeChip={category || "all"}
                analyticsBase={analyticsBase}
                onOpen={openPlayer}
              />
            ))}
          </div>

          {preview.poolSize > PROFILE_VIDEOS_PREVIEW_LIMIT ? (
            <button
              type="button"
              style={styles.seeAllBtn}
              data-testid="profile-videos-see-all"
              onClick={() => setSeeAllOpen(true)}
            >
              See all {poolCountLabel} videos
            </button>
          ) : null}
        </>
      ) : null}

      <PlayerSheet
        open={Boolean(playerVideo)}
        video={playerVideo}
        restaurantName={restaurantName}
        onClose={closePlayer}
        analyticsBase={{
          ...analyticsBase,
          position: playerPos,
          pool_size: preview.poolSize,
          active_chip: category || "all",
          slot: playerVideo?._preview_slot || "sampled",
        }}
        returnFocusRef={tileFocusRef}
      />

      {!playerVideo ? (
        <SeeAllSheet
          open={seeAllOpen}
          pool={eligiblePool}
          restaurantName={restaurantName}
          restaurantId={restaurantId}
          category={category}
          onClose={() => setSeeAllOpen(false)}
          onOpenVideo={openPlayer}
          analyticsBase={analyticsBase}
        />
      ) : null}
    </section>
  );
}

const styles = {
  headerRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 6,
  },
  heading: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: PROFILE_INK,
  },
  count: {
    fontSize: 12,
    fontWeight: 600,
    color: PROFILE_MUTED,
  },
  disclaimer: {
    margin: "0 0 10px",
    fontSize: 12,
    color: PROFILE_MUTED,
    lineHeight: 1.4,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  chipHit: {
    minHeight: 44,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    boxSizing: "content-box",
    paddingTop: 6,
    paddingBottom: 6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    width: "100%",
  },
  tile: {
    position: "relative",
    appearance: "none",
    border: "none",
    padding: 0,
    margin: 0,
    borderRadius: 10,
    overflow: "hidden",
    aspectRatio: "9 / 14",
    background: "#e7e5e4",
    cursor: "pointer",
    textAlign: "left",
    minWidth: 0,
  },
  thumbFrame: {
    position: "absolute",
    inset: 0,
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  hiddenStillVideo: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: "none",
    left: -9999,
    top: 0,
  },
  neutralPlaceholder: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(165deg, #d6d3d1 0%, #a8a29e 100%)",
  },
  durationChip: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 2,
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    background: "rgba(0,0,0,.5)",
    borderRadius: 4,
    padding: "2px 5px",
    lineHeight: 1.2,
  },
  tileBand: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    background: "rgba(0,0,0,.5)",
    padding: "6px 7px 7px",
  },
  tileCaption: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    fontSize: 12,
    fontWeight: 500,
    color: "#fff",
    lineHeight: 1.25,
  },
  skeletonTile: {
    aspectRatio: "9 / 14",
    borderRadius: 10,
    background: "linear-gradient(90deg, #e7e5e4 0%, #f5f5f4 50%, #e7e5e4 100%)",
  },
  seeAllBtn: {
    appearance: "none",
    marginTop: 12,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d6d3d1",
    background: "#fff",
    color: PROFILE_INK,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    fontSize: 13,
    color: PROFILE_MUTED,
  },
  retryBtn: {
    appearance: "none",
    border: "1px solid #d6d3d1",
    borderRadius: 8,
    background: "#fff",
    padding: "6px 10px",
    fontWeight: 700,
    cursor: "pointer",
  },
  scrim: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "rgba(15,23,42,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxHeight: "88vh",
    background: "#fff",
    borderRadius: "16px 16px 0 0",
    padding: "10px 16px 24px",
    position: "relative",
    outline: "none",
  },
  sheetDesktop: {
    alignSelf: "center",
    maxWidth: 520,
    borderRadius: 16,
    marginBottom: "auto",
    marginTop: "auto",
  },
  sheetMotion: {
    animation: "profileVideoSheetIn 180ms ease-out",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    background: "#d6d3d1",
    margin: "0 auto 10px",
  },
  closeX: {
    position: "absolute",
    top: 8,
    right: 10,
    appearance: "none",
    border: "none",
    background: "transparent",
    fontSize: 28,
    lineHeight: 1,
    cursor: "pointer",
    color: PROFILE_MUTED,
    padding: 4,
  },
  sheetBody: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  playerFrame: {
    width: "clamp(130px, 38%, 200px)",
    flex: "0 0 auto",
    maxWidth: "100%",
    maxHeight: "min(70svh, 640px)",
    aspectRatio: "9 / 16",
    borderRadius: 10,
    overflow: "hidden",
    background: "#000",
    marginLeft: "auto",
    marginRight: "auto",
  },
  playerVideo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    background: "#000",
  },
  sheetMeta: {
    flex: 1,
    minWidth: 0,
    paddingTop: 4,
  },
  sheetTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: PROFILE_INK,
    lineHeight: 1.3,
  },
  sheetCreator: {
    margin: "8px 0 0",
    fontSize: 13,
    color: PROFILE_MUTED,
  },
  sheetMuted: {
    margin: "6px 0 0",
    fontSize: 12,
    color: PROFILE_MUTED,
  },
  loadFail: {
    height: "100%",
    display: "grid",
    placeContent: "center",
    gap: 8,
    padding: 8,
    textAlign: "center",
    color: "#e7e5e4",
    fontSize: 12,
  },
  noSound: {
    position: "absolute",
    left: 8,
    bottom: 8,
    padding: "4px 8px",
    borderRadius: 8,
    background: "rgba(0,0,0,0.65)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  },
  seeAllSheet: {
    width: "100%",
    height: "100%",
    maxHeight: "100vh",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  seeAllHeader: {
    padding: "16px 16px 8px",
    borderBottom: "1px solid #e7e5e4",
    position: "relative",
  },
  seeAllTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: PROFILE_INK,
    marginBottom: 10,
  },
  sortRow: {
    display: "flex",
    gap: 8,
  },
  seeAllScroll: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
  },
  pager: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
    paddingBottom: 24,
  },
};
