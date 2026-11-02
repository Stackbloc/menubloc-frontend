/**
 * Cluster hero (page_region cluster_landing_hero) — video first.
 *
 * Who gets the slot:
 *   1. Sold ad for a restaurant that has cluster videos → that restaurant's clips, marked
 *      Sponsored, with the ad's CTA (ad impression/click attrs ride on the CTA).
 *   2. Sold ad without restaurant video → the paid image ad exactly as before, with a thin
 *      "Videos in <cluster>" row under it.
 *   3. Unsold slot (house / default / built-in banner) and the cluster has videos → the
 *      featured reel: every cluster clip, dish-linked first, auto-advancing.
 *   4. No videos → the delivered ad exactly as before.
 *
 * Clip hero (cases 1 and 3): a strip of clip thumbnails. Tapping one plays it right there —
 * the player takes the strip's space and sticks under the search bar, so diners keep watching
 * while they scroll and search the food below. Clips are portrait; the inline player shows them
 * in a landscape frame (cropped to fill) and ⤢ opens the full portrait clip in the floating player.
 * If nobody picks a clip within 15 s, the strip starts playing clips in order (see
 * orderClipsForAutoplay — the hook for diner ad preferences, not built yet).
 *
 * Playback: muted by default, plays only while at least half on screen, pauses while the
 * floating player or menu sheet is open, never autoplays under prefers-reduced-motion.
 */

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAdvertisementByRegion } from "../../../lib/advertisementApi.js";
import { clusterVideoDealTitle, clusterVideoDishName } from "../../../lib/clusterVideoIndex.js";
import { clusterVideoSrc } from "../../../lib/clusterVideoMedia.js";
import { createWatchReporter, trackClusterVideoEvent } from "../../../lib/clusterVideoAnalytics.js";
import useMatchMedia from "../../../hooks/useMatchMedia.js";
import { ClusterAdCreative, adEngagementAttrs } from "../ClusterAdSlot.jsx";
import { ClusterSearchActiveContext, useClusterVideos } from "./ClusterVideoContext.jsx";
import { PlayGlyph } from "./ClusterVideoPlayButton.jsx";

const PAGE_REGION = "cluster_landing_hero";
const SURFACE = "cluster_hero";
const IDLE_AUTOPLAY_MS = 15000;
/** Below this width the inline player stacks: frame on top, one compact info row under it. */
const NARROW_PX = 560;
/** Phones skip the image billboard so the cluster info, clips and food search fit the first screen. */
const PHONE_QUERY = "(max-width: 640px)";

/** Spacing around the slot: the clip hero is compact; a paid image ad keeps its old breathing room. */
const CLIP_SPACE_STYLE = { padding: "0.75rem 0 1rem" };
const AD_SPACE_STYLE = { padding: "2.75rem 0 3.25rem" };

/**
 * Order the strip plays in when nobody picks a clip. Today: the order the clips arrive in
 * (dish-linked first; sponsored heroes are one advertiser's clips already). Diner ad
 * preference settings will rank here once they exist.
 */
function orderClipsForAutoplay(clips) {
  return Array.isArray(clips) ? clips.filter(Boolean) : [];
}

function prefersReducedMotion() {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  } catch {
    return false;
  }
}

function useHeroAd(clusterSlug) {
  const [state, setState] = useState(() => ({
    status: clusterSlug ? "loading" : "ok",
    ad: null,
    delivery: null,
    inventoryType: null,
  }));
  useEffect(() => {
    if (!clusterSlug) return undefined;
    const controller = new AbortController();
    getAdvertisementByRegion(PAGE_REGION, { clusterSlug })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({
          status: "ok",
          ad: data?.advertisement || data?.advertisements?.[0] || null,
          delivery: { inventoryId: data?.inventory?.id ?? null, adSource: data?.ad_source ?? null },
          inventoryType: data?.inventory?.inventory_type || data?.advertisement?.inventory_type || null,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "ok", ad: null, delivery: null, inventoryType: null });
      });
    return () => controller.abort();
  }, [clusterSlug]);
  return state;
}

export default function ClusterVideoHero({ clusterSlug }) {
  const { cluster, status: videoStatus, index } = useClusterVideos();
  const searchActive = useContext(ClusterSearchActiveContext);
  const heroAd = useHeroAd(clusterSlug);
  const isPhone = useMatchMedia(PHONE_QUERY);

  if (heroAd.status === "loading" || videoStatus === "loading") return null;

  const { ad, delivery, inventoryType } = heroAd;
  const sold = delivery?.adSource === "sold" && ad;
  const sponsoredClips = sold && ad.restaurant_id ? index.forRestaurant(ad.restaurant_id) : [];

  if (sold && sponsoredClips.length > 0) {
    return <VideoHero cluster={cluster} clips={sponsoredClips} sponsoredAd={ad} delivery={delivery} />;
  }
  if (index.videos.length > 0 && !sold) {
    return <VideoHero cluster={cluster} clips={index.videos} />;
  }
  // Paid image ad / no clips: out of the way while search results show, and never on phones
  // (a sold ad's clips row still shows there).
  if (searchActive || !ad) return null;
  if (isPhone) {
    return sold && index.videos.length > 0 ? (
      <div style={CLIP_SPACE_STYLE}>
        <ClusterVideoReelRow cluster={cluster} clips={index.videos} />
      </div>
    ) : null;
  }
  const adCreative = (
    <ClusterAdCreative ad={ad} inventoryType={inventoryType} delivery={delivery} pageRegion={PAGE_REGION} />
  );
  return (
    <div style={AD_SPACE_STYLE}>
      {sold && index.videos.length > 0 ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {adCreative}
          <ClusterVideoReelRow cluster={cluster} clips={index.videos} />
        </div>
      ) : (
        adCreative
      )}
    </div>
  );
}

/** Height of this panel's sticky search chrome, so a playing clip sticks right under it. */
function useStickyChromeOffset(rootRef) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const root = rootRef.current;
    const panel = root?.closest?.('[data-testid="cluster-view-panel-menu"]') || document;
    const chrome = panel.querySelector?.('[data-testid="cluster-sticky-chrome"]');
    if (!chrome) return undefined;
    const update = () => setOffset(Math.round(chrome.getBoundingClientRect().height));
    update();
    if (typeof ResizeObserver !== "function") return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(chrome);
    return () => ro.disconnect();
  }, [rootRef]);
  return offset;
}

function useElementWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver !== "function") return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

function VideoHero({ cluster, clips, sponsoredAd = null, delivery = null }) {
  const { player, menuOpen, openMenu, openVideo } = useClusterVideos();
  const searchActive = useContext(ClusterSearchActiveContext);
  const bandRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const queue = useMemo(() => orderClipsForAutoplay(clips), [clips]);
  /** null = strip (nothing chosen yet, or the diner closed the player); number = playing that clip. */
  const [position, setPosition] = useState(null);
  /** Diner picked or closed a clip: the 15 s idle autoplay never fires after that. */
  const [touched, setTouched] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);
  const [inView, setInView] = useState(() => typeof IntersectionObserver !== "function");
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion] = useState(() => prefersReducedMotion());
  const triggerRef = useRef("hero_autoplay");
  const impressedRef = useRef(new Set());
  const reporter = useMemo(() => createWatchReporter({ surface: SURFACE, clusterId: cluster?.id }), [cluster?.id]);
  const stickyTop = useStickyChromeOffset(bandRef);
  const width = useElementWidth(bandRef);
  const narrow = width > 0 && width < NARROW_PX;

  const playing = position !== null;
  const clip = playing ? queue[Math.min(position, queue.length - 1)] || null : null;
  const src = clusterVideoSrc(clip);
  const forcedMute = clip?.play_muted === true;
  const effectiveMuted = forcedMute || muted;
  const dishName = clusterVideoDishName(clip);
  const dealTitle = dishName ? null : clusterVideoDealTitle(clip);
  const blocked = Boolean(player) || menuOpen;
  const shouldPlay = playing && inView && !blocked && !userPaused;

  useEffect(() => () => reporter.stop(), [reporter]);

  // Nobody picked a clip in 15 s → start the strip in order. Waits while another player is open.
  useEffect(() => {
    if (playing || touched || reducedMotion || blocked || queue.length === 0) return undefined;
    const t = setTimeout(() => {
      triggerRef.current = "hero_idle_autoplay";
      setPosition(0);
    }, IDLE_AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [playing, touched, reducedMotion, blocked, queue.length]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver !== "function") return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= 0.5), {
      threshold: [0, 0.5, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, [playing]);

  // One impression per clip per page, the first time it plays on screen.
  useEffect(() => {
    if (!inView || !clip || impressedRef.current.has(clip.video_key)) return;
    impressedRef.current.add(clip.video_key);
    trackClusterVideoEvent(clip, "impression", { surface: SURFACE, clusterId: cluster?.id });
  }, [inView, clip, cluster?.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return;
    if (shouldPlay) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => setPaused(true));
    } else if (!el.paused) {
      el.pause();
    }
  }, [shouldPlay, src]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = effectiveMuted;
  }, [effectiveMuted]);

  if (queue.length === 0) return null;
  // Search results showing and nothing playing: the strip steps aside.
  if (!playing && searchActive) return null;

  function play(next, trigger) {
    if (next < 0 || next >= queue.length) return;
    if (playing && next === position) return;
    reporter.report();
    triggerRef.current = trigger;
    setUserPaused(false);
    setPosition(next);
  }

  function pick(next) {
    setTouched(true);
    play(next, "reel_thumb");
  }

  function closePlayer() {
    reporter.report();
    setTouched(true);
    setPosition(null);
    setPaused(true);
  }

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      triggerRef.current = "hero_tap";
      setUserPaused(false);
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      setUserPaused(true);
      el.pause();
    }
  }

  function expand() {
    reporter.report();
    openVideo(queue, { startIndex: position, trigger: "hero_expand" });
  }

  function order() {
    trackClusterVideoEvent(clip, dishName ? "click_menu_item" : "click_restaurant", {
      surface: SURFACE,
      clusterId: cluster?.id,
    });
    openMenu(clip);
  }

  const ctaHref = sponsoredAd?.destination_url || null;
  const ctaLabel = sponsoredAd ? sponsoredAd.cta_text || sponsoredAd.headline || "Learn more" : null;
  const ctaAttrs = sponsoredAd ? adEngagementAttrs(sponsoredAd, delivery) : {};
  const eyebrow = sponsoredAd
    ? sponsoredAd.advertiser_name || queue[0]?.restaurant_name || "Sponsored"
    : "Sponsored Clips";

  const cta = ctaHref ? (
    ctaHref.startsWith("/") && !ctaHref.startsWith("//") ? (
      <Link to={ctaHref} style={styles.secondary} data-testid="cluster-video-hero-cta" {...ctaAttrs}>
        {ctaLabel}
      </Link>
    ) : (
      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.secondary}
        data-testid="cluster-video-hero-cta"
        {...ctaAttrs}
      >
        {ctaLabel}
      </a>
    )
  ) : null;

  const stepper =
    queue.length > 1 ? (
      <div style={styles.stepper}>
        <button
          type="button"
          style={styles.stepBtn}
          aria-label="Previous clip"
          disabled={position === 0}
          onClick={() => play(position - 1, "next")}
        >
          ‹
        </button>
        <span style={styles.stepCount} aria-live="polite">
          {position + 1} of {queue.length}
        </span>
        <button
          type="button"
          style={styles.stepBtn}
          aria-label="Next clip"
          disabled={position >= queue.length - 1}
          onClick={() => play(position + 1, "next")}
        >
          ›
        </button>
      </div>
    ) : null;

  return (
    <div
      ref={bandRef}
      className="cluster-video-hero-band"
      data-testid="cluster-video-hero-band"
      data-sticky={playing ? "1" : "0"}
      style={{
        ...CLIP_SPACE_STYLE,
        ...(playing ? { ...styles.stickyBand, top: stickyTop } : null),
      }}
    >
      <section
        className="cluster-video-hero"
        data-testid="cluster-video-hero"
        data-mode={sponsoredAd ? "sponsored" : "featured"}
        data-state={playing ? "playing" : "strip"}
        aria-label={sponsoredAd ? "Sponsored clip" : "Sponsored Clips"}
        style={styles.root}
      >
        {!playing ? (
          <>
            <div style={styles.stripHead}>
              <span style={styles.eyebrow}>
                <PlayGlyph size={10} color="#93c5fd" /> {eyebrow}
              </span>
              {sponsoredAd ? (
                <span style={styles.sponsoredInline} data-testid="cluster-video-hero-sponsored">
                  Sponsored
                </span>
              ) : null}
              <span style={styles.stripHint}>Tap a clip to watch here</span>
            </div>
            <div style={styles.reel} role="list" aria-label="Clips" data-testid="cluster-video-reel">
              {queue.map((c, i) => (
                <ReelThumb key={c.video_key} clip={c} index={i} active={false} large onSelect={() => pick(i)} />
              ))}
            </div>
          </>
        ) : clip && src ? (
          <div style={narrow ? styles.playStack : styles.playRow}>
            <div ref={stageRef} style={narrow ? styles.stageNarrow : styles.stage}>
              <video
                key={clip.video_key}
                ref={videoRef}
                src={src}
                poster={clip.thumbnail_url || undefined}
                style={styles.video}
                playsInline
                muted={effectiveMuted}
                loop={queue.length === 1}
                preload="metadata"
                controls={false}
                data-testid="cluster-video-hero-el"
                data-video-key={clip.video_key}
                aria-label={paused ? "Play clip" : "Pause clip"}
                onClick={togglePlay}
                onPlay={() => {
                  setPaused(false);
                  reporter.start(clip);
                  trackClusterVideoEvent(clip, "play", {
                    surface: SURFACE,
                    trigger: triggerRef.current,
                    clusterId: cluster?.id,
                  });
                  triggerRef.current = "hero_autoplay";
                }}
                onPause={() => {
                  setPaused(true);
                  reporter.report();
                }}
                onTimeUpdate={(e) => reporter.sample(e.currentTarget)}
                onEnded={() => {
                  reporter.report();
                  if (queue.length > 1) play((position + 1) % queue.length, "next");
                }}
              />
              {paused ? (
                <button
                  type="button"
                  style={styles.bigPlay}
                  data-testid="cluster-video-hero-play"
                  aria-label="Play clip"
                  onClick={togglePlay}
                >
                  <PlayGlyph size={18} color="#fff" />
                </button>
              ) : null}
              {sponsoredAd ? (
                <span style={styles.sponsored} data-testid="cluster-video-hero-sponsored">
                  Sponsored
                </span>
              ) : null}
              <button
                type="button"
                style={styles.close}
                data-testid="cluster-video-hero-close"
                aria-label="Close clip, show all clips"
                onClick={closePlayer}
              >
                ×
              </button>
              <button
                type="button"
                style={styles.mute}
                data-testid="cluster-video-hero-mute"
                aria-label={forcedMute ? "This clip plays without sound" : effectiveMuted ? "Turn sound on" : "Mute"}
                disabled={forcedMute}
                onClick={() => !forcedMute && setMuted((m) => !m)}
              >
                {effectiveMuted ? "🔇" : "🔊"}
              </button>
              <button
                type="button"
                style={styles.expand}
                data-testid="cluster-video-hero-expand"
                aria-label="Watch the full clip"
                title="Watch the full clip"
                onClick={expand}
              >
                ⤢
              </button>
            </div>

            {narrow ? (
              <div style={styles.infoRow}>
                <div style={styles.infoText}>
                  <span style={styles.dishLine} data-testid="cluster-video-hero-dish">
                    {dishName || dealTitle || clip.restaurant_name || "Watch"}
                  </span>
                  <span style={styles.restaurantLine}>
                    {(dishName || dealTitle) && clip.restaurant_name ? clip.restaurant_name : eyebrow}
                    {queue.length > 1 ? ` · ${position + 1} of ${queue.length}` : ""}
                  </span>
                </div>
                {queue.length > 1 ? (
                  <button
                    type="button"
                    style={styles.stepBtn}
                    aria-label="Next clip"
                    onClick={() => play((position + 1) % queue.length, "next")}
                  >
                    ›
                  </button>
                ) : null}
                <button type="button" style={styles.primarySmall} data-testid="cluster-video-hero-order" onClick={order}>
                  {dishName ? "Order" : "Menu"}
                </button>
                {cta}
              </div>
            ) : (
              <div style={styles.info}>
                <span style={styles.eyebrow}>{eyebrow}</span>
                {dishName || dealTitle ? <span style={styles.fromVideo}>{dishName ? "From the clip" : "Deal"}</span> : null}
                <h2 style={styles.dish} data-testid="cluster-video-hero-dish">
                  {dishName || dealTitle || clip.restaurant_name || "Watch"}
                </h2>
                {(dishName || dealTitle) && clip.restaurant_name ? (
                  <span style={styles.restaurant}>{clip.restaurant_name}</span>
                ) : null}
                <div style={styles.actions}>
                  <button type="button" style={styles.primary} data-testid="cluster-video-hero-order" onClick={order}>
                    {dishName ? "Order this" : "See menu"}
                  </button>
                  {cta}
                </div>
                {stepper}
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ReelThumb({ clip, index, active, large = false, onSelect }) {
  const label = clusterVideoDishName(clip) || clusterVideoDealTitle(clip) || clip.restaurant_name || "Clip";
  return (
    <button
      type="button"
      role="listitem"
      data-reel-index={index}
      data-testid="cluster-video-reel-thumb"
      aria-current={active ? "true" : undefined}
      aria-label={`${label}${clip.restaurant_name && label !== clip.restaurant_name ? `, ${clip.restaurant_name}` : ""}`}
      onClick={onSelect}
      style={{ ...styles.thumb, ...(large ? styles.thumbLarge : null), ...(active ? styles.thumbActive : null) }}
    >
      {clip.thumbnail_url ? (
        <img
          src={clip.thumbnail_url}
          alt=""
          loading="lazy"
          style={{
            ...styles.thumbImg,
            ...(large ? styles.thumbImgLarge : null),
            ...(active ? styles.thumbImgActive : null),
          }}
        />
      ) : (
        <span style={{ ...styles.thumbBlank, ...(large ? styles.thumbImgLarge : null) }} aria-hidden="true">
          <PlayGlyph size={12} color="#94a3b8" />
        </span>
      )}
      <span style={styles.thumbLabel}>{label}</span>
    </button>
  );
}

/** Secondary surface under a paid image ad: thumbnails that open the floating player. */
function ClusterVideoReelRow({ clips }) {
  const { openVideo } = useClusterVideos();
  return (
    <section aria-label="Sponsored Clips" data-testid="cluster-video-reel-row" style={styles.rowRoot}>
      <span style={styles.rowTitle}>
        <PlayGlyph size={10} /> Sponsored Clips
      </span>
      <div style={styles.reel} role="list">
        {clips.map((c, i) => (
          <ReelThumb
            key={c.video_key}
            clip={c}
            index={i}
            active={false}
            onSelect={() => openVideo(clips, { startIndex: i, trigger: "reel_thumb" })}
          />
        ))}
      </div>
    </section>
  );
}

const styles = {
  /** Sticky while a clip plays: sits right under the search chrome, over the food list. */
  stickyBand: {
    position: "sticky",
    zIndex: 15,
    background: "#fff",
    padding: "0.5rem 0",
  },
  root: {
    display: "grid",
    gap: 8,
    padding: 10,
    borderRadius: 14,
    background: "#0b1220",
    color: "#f8fafc",
    boxShadow: "0 6px 22px rgba(15, 23, 42, 0.18)",
    minWidth: 0,
    overflow: "hidden",
  },
  stripHead: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "4px 10px",
    minWidth: 0,
  },
  stripHint: { fontSize: 12, color: "#cbd5e1", marginLeft: "auto" },
  sponsoredInline: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#0b1220",
    background: "#e2e8f0",
    padding: "2px 6px",
    borderRadius: 4,
  },
  playRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 360px) minmax(0, 1fr)",
    gap: 14,
    alignItems: "center",
    minWidth: 0,
  },
  playStack: { display: "grid", gap: 8, minWidth: 0 },
  /** Landscape frame: portrait clips are cropped to fill (⤢ shows the whole clip). */
  stage: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 10,
    overflow: "hidden",
    background: "#000",
  },
  stageNarrow: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    maxHeight: "28vh",
    borderRadius: 10,
    overflow: "hidden",
    background: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center 45%",
    display: "block",
    cursor: "pointer",
  },
  bigPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 48,
    height: 48,
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,0.75)",
    background: "rgba(0,0,0,0.5)",
    paddingLeft: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  close: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.45)",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 18,
    lineHeight: 1,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  expand: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.45)",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 15,
    lineHeight: 1,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  infoText: { display: "grid", gap: 1, minWidth: 0, flex: "1 1 auto" },
  dishLine: {
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  restaurantLine: {
    fontSize: 12,
    color: "#cbd5e1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  primarySmall: {
    flex: "0 0 auto",
    height: 34,
    padding: "0 14px",
    borderRadius: 999,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  mute: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.45)",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  sponsored: {
    position: "absolute",
    top: 8,
    left: 8,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#fff",
    background: "rgba(15, 23, 42, 0.7)",
    padding: "3px 7px",
    borderRadius: 4,
  },
  info: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 6,
    minWidth: 0,
    padding: "4px 2px",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#93c5fd",
    overflowWrap: "anywhere",
  },
  fromVideo: {
    alignSelf: "flex-start",
    marginTop: 4,
    fontSize: 9.5,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#0b1220",
    background: "#fbbf24",
    borderRadius: 4,
    padding: "2px 6px",
  },
  dish: {
    margin: 0,
    fontSize: "1.2rem",
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.01em",
    overflowWrap: "anywhere",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  restaurant: {
    fontSize: 13,
    color: "#cbd5e1",
    overflowWrap: "anywhere",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  primary: {
    height: 38,
    padding: "0 16px",
    borderRadius: 999,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    height: 38,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.4)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    lineHeight: 1,
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.3)",
    background: "transparent",
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  stepCount: { fontSize: 12, color: "#cbd5e1", fontVariantNumeric: "tabular-nums" },
  reel: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "none",
    paddingBottom: 2,
    minWidth: 0,
    WebkitOverflowScrolling: "touch",
  },
  thumb: {
    flex: "0 0 auto",
    width: 76,
    display: "grid",
    gap: 4,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    opacity: 0.78,
  },
  thumbActive: { opacity: 1 },
  thumbLarge: { width: 92, opacity: 1 },
  thumbImgLarge: { width: 92, height: 122 },
  thumbImg: {
    width: 76,
    height: 100,
    objectFit: "cover",
    borderRadius: 8,
    display: "block",
    background: "#1f2937",
    boxSizing: "border-box",
    border: "2px solid transparent",
  },
  thumbImgActive: { border: "2px solid #fbbf24" },
  thumbBlank: {
    width: 76,
    height: 100,
    borderRadius: 8,
    background: "#1f2937",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbLabel: {
    fontSize: 10.5,
    fontWeight: 650,
    lineHeight: 1.25,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    overflowWrap: "anywhere",
  },
  rowRoot: {
    display: "grid",
    gap: 8,
    padding: "10px",
    borderRadius: 12,
    background: "#0b1220",
    color: "#f8fafc",
  },
  rowTitle: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#93c5fd",
  },
};
