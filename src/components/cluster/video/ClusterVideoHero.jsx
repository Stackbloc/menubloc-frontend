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
 * Playback: muted by default, plays only while at least half on screen, pauses while the
 * floating player or menu sheet is open, never autoplays under prefers-reduced-motion.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAdvertisementByRegion } from "../../../lib/advertisementApi.js";
import { clusterVideoDealTitle, clusterVideoDishName } from "../../../lib/clusterVideoIndex.js";
import { clusterVideoSrc } from "../../../lib/clusterVideoMedia.js";
import { createWatchReporter, trackClusterVideoEvent } from "../../../lib/clusterVideoAnalytics.js";
import { ClusterAdCreative, adEngagementAttrs } from "../ClusterAdSlot.jsx";
import { useClusterVideos } from "./ClusterVideoContext.jsx";
import { PlayGlyph } from "./ClusterVideoPlayButton.jsx";

const PAGE_REGION = "cluster_landing_hero";
const SURFACE = "cluster_hero";

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
  const heroAd = useHeroAd(clusterSlug);

  if (heroAd.status === "loading" || videoStatus === "loading") return null;

  const { ad, delivery, inventoryType } = heroAd;
  const sold = delivery?.adSource === "sold" && ad;
  const sponsoredClips = sold && ad.restaurant_id ? index.forRestaurant(ad.restaurant_id) : [];

  const adCreative = ad ? (
    <ClusterAdCreative ad={ad} inventoryType={inventoryType} delivery={delivery} pageRegion={PAGE_REGION} />
  ) : null;

  if (sold && sponsoredClips.length > 0) {
    return <VideoHero cluster={cluster} clips={sponsoredClips} sponsoredAd={ad} delivery={delivery} />;
  }
  if (sold) {
    return (
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {adCreative}
        {index.videos.length > 0 ? <ClusterVideoReelRow cluster={cluster} clips={index.videos} /> : null}
      </div>
    );
  }
  if (index.videos.length > 0) {
    return <VideoHero cluster={cluster} clips={index.videos} />;
  }
  return adCreative;
}

function VideoHero({ cluster, clips, sponsoredAd = null, delivery = null }) {
  const { player, menuOpen, openMenu } = useClusterVideos();
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const reelRef = useRef(null);
  const [position, setPosition] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);
  const [inView, setInView] = useState(() => typeof IntersectionObserver !== "function");
  const [userPaused, setUserPaused] = useState(() => prefersReducedMotion());
  const triggerRef = useRef("hero_autoplay");
  const impressedRef = useRef(new Set());
  const reporter = useMemo(() => createWatchReporter({ surface: SURFACE, clusterId: cluster?.id }), [cluster?.id]);

  const clip = clips[Math.min(position, clips.length - 1)] || null;
  const src = clusterVideoSrc(clip);
  const forcedMute = clip?.play_muted === true;
  const effectiveMuted = forcedMute || muted;
  const dishName = clusterVideoDishName(clip);
  const dealTitle = dishName ? null : clusterVideoDealTitle(clip);
  const blocked = Boolean(player) || menuOpen;
  const shouldPlay = inView && !blocked && !userPaused;

  useEffect(() => () => reporter.stop(), [reporter]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver !== "function") return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= 0.5), {
      threshold: [0, 0.5, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // One impression per clip per page, the first time it is on screen.
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

  // Keep the active thumbnail in view without moving the page.
  useEffect(() => {
    const reel = reelRef.current;
    const thumb = reel?.querySelector(`[data-reel-index="${position}"]`);
    if (!reel || !thumb) return;
    const left = thumb.offsetLeft - reel.clientWidth / 2 + thumb.clientWidth / 2;
    reel.scrollTo?.({ left: Math.max(0, left), behavior: "smooth" });
  }, [position]);

  if (!clip || !src) return null;

  function select(next, trigger) {
    if (next === position || next < 0 || next >= clips.length) return;
    reporter.report();
    triggerRef.current = trigger;
    setPosition(next);
    if (trigger === "reel_thumb") setUserPaused(false);
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
  const clusterLabel = cluster?.name || "this area";

  return (
    <section
      ref={rootRef}
      className="cluster-video-hero"
      data-testid="cluster-video-hero"
      data-mode={sponsoredAd ? "sponsored" : "featured"}
      aria-label={sponsoredAd ? "Sponsored video" : `Videos in ${clusterLabel}`}
      style={styles.root}
    >
      <div style={styles.main}>
        <div style={styles.stage}>
          <video
            key={clip.video_key}
            ref={videoRef}
            src={src}
            poster={clip.thumbnail_url || undefined}
            style={styles.video}
            playsInline
            muted={effectiveMuted}
            loop={clips.length === 1}
            preload="metadata"
            controls={false}
            data-testid="cluster-video-hero-el"
            data-video-key={clip.video_key}
            aria-label={paused ? "Play video" : "Pause video"}
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
              if (clips.length > 1) select((position + 1) % clips.length, "next");
            }}
          />
          {paused ? (
            <button
              type="button"
              style={styles.bigPlay}
              data-testid="cluster-video-hero-play"
              aria-label="Play video"
              onClick={togglePlay}
            >
              <PlayGlyph size={22} color="#fff" />
            </button>
          ) : null}
          <button
            type="button"
            style={styles.mute}
            data-testid="cluster-video-hero-mute"
            aria-label={forcedMute ? "This video plays without sound" : effectiveMuted ? "Turn sound on" : "Mute"}
            disabled={forcedMute}
            onClick={() => !forcedMute && setMuted((m) => !m)}
          >
            {effectiveMuted ? "🔇" : "🔊"}
          </button>
          {sponsoredAd ? (
            <span style={styles.sponsored} data-testid="cluster-video-hero-sponsored">
              Sponsored
            </span>
          ) : null}
        </div>

        <div style={styles.info}>
          <span style={styles.eyebrow}>
            {sponsoredAd ? sponsoredAd.advertiser_name || clip.restaurant_name || "Sponsored" : `Videos in ${clusterLabel}`}
          </span>
          {dishName || dealTitle ? <span style={styles.fromVideo}>{dishName ? "From the video" : "Deal"}</span> : null}
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
            {ctaHref ? (
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
            ) : null}
          </div>
          {clips.length > 1 ? (
            <div style={styles.stepper}>
              <button
                type="button"
                style={styles.stepBtn}
                aria-label="Previous video"
                disabled={position === 0}
                onClick={() => select(position - 1, "next")}
              >
                ‹
              </button>
              <span style={styles.stepCount} aria-live="polite">
                {position + 1} of {clips.length}
              </span>
              <button
                type="button"
                style={styles.stepBtn}
                aria-label="Next video"
                disabled={position >= clips.length - 1}
                onClick={() => select(position + 1, "next")}
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {clips.length > 1 ? (
        <div ref={reelRef} style={styles.reel} role="list" aria-label="More videos" data-testid="cluster-video-reel">
          {clips.map((c, i) => (
            <ReelThumb
              key={c.video_key}
              clip={c}
              index={i}
              active={i === position}
              onSelect={() => select(i, "reel_thumb")}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ReelThumb({ clip, index, active, onSelect }) {
  const label = clusterVideoDishName(clip) || clusterVideoDealTitle(clip) || clip.restaurant_name || "Video";
  return (
    <button
      type="button"
      role="listitem"
      data-reel-index={index}
      data-testid="cluster-video-reel-thumb"
      aria-current={active ? "true" : undefined}
      aria-label={`${label}${clip.restaurant_name && label !== clip.restaurant_name ? `, ${clip.restaurant_name}` : ""}`}
      onClick={onSelect}
      style={{ ...styles.thumb, ...(active ? styles.thumbActive : null) }}
    >
      {clip.thumbnail_url ? (
        <img
          src={clip.thumbnail_url}
          alt=""
          loading="lazy"
          style={{ ...styles.thumbImg, ...(active ? styles.thumbImgActive : null) }}
        />
      ) : (
        <span style={styles.thumbBlank} aria-hidden="true">
          <PlayGlyph size={12} color="#94a3b8" />
        </span>
      )}
      <span style={styles.thumbLabel}>{label}</span>
    </button>
  );
}

/** Secondary surface under a paid image ad: thumbnails that open the floating player. */
function ClusterVideoReelRow({ cluster, clips }) {
  const { openVideo } = useClusterVideos();
  return (
    <section aria-label={`Videos in ${cluster?.name || "this area"}`} data-testid="cluster-video-reel-row" style={styles.rowRoot}>
      <span style={styles.rowTitle}>
        <PlayGlyph size={10} /> Videos in {cluster?.name || "this area"}
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
  root: {
    display: "grid",
    gap: 10,
    padding: 10,
    borderRadius: 16,
    background: "#0b1220",
    color: "#f8fafc",
    boxShadow: "0 6px 22px rgba(15, 23, 42, 0.18)",
    minWidth: 0,
    overflow: "hidden",
  },
  main: {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 46%) minmax(0, 1fr)",
    gap: 12,
    alignItems: "stretch",
    minWidth: 0,
  },
  stage: {
    position: "relative",
    width: "100%",
    maxWidth: 240,
    aspectRatio: "9 / 16",
    maxHeight: 420,
    borderRadius: 12,
    overflow: "hidden",
    background: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    cursor: "pointer",
  },
  bigPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 60,
    height: 60,
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,0.75)",
    background: "rgba(0,0,0,0.5)",
    paddingLeft: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  mute: {
    position: "absolute",
    left: 8,
    bottom: 8,
    width: 34,
    height: 34,
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
