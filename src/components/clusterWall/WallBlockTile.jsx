import { useEffect, useLayoutEffect, useRef } from "react";
import { WALL_FONTS, WALL_THEMES, wallInkShadow, wallStyle, wallSurfaceStyle, wallTextFontSize } from "../../lib/clusterWallStyles.js";
import "./clusterWall.css";

/** Shrinks the text until it fits its rectangle (and again when the rectangle resizes). */
function useFitText(boxRef, textRef, startSize, deps) {
  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = textRef.current;
    if (!box || !inner) return undefined;
    const fit = () => {
      let size = startSize;
      box.style.fontSize = `${size}px`;
      box.style.overflowWrap = "normal";
      const tooBig = () => inner.offsetHeight > box.clientHeight + 1 || inner.scrollWidth > box.clientWidth + 1;
      while (size > 9 && tooBig()) {
        size -= 1;
        box.style.fontSize = `${size}px`;
      }
      // Still a word too long for the tile at the smallest size: let it break.
      if (tooBig()) box.style.overflowWrap = "anywhere";
    };
    fit();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function WallInscription({ block, scale = 1, className = "cw-tile-text", style }) {
  const s = wallStyle(block.style);
  const font = WALL_FONTS[s.font];
  const theme = WALL_THEMES[s.theme];
  const text = String(block.body || "");
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const startSize = wallTextFontSize(block.size, text.length, { scale });
  useFitText(boxRef, textRef, startSize, [text, startSize, s.font, block.size]);
  return (
    <div
      ref={boxRef}
      className={className}
      style={{
        color: theme.ink,
        textShadow: wallInkShadow(s.theme),
        fontFamily: font.family,
        fontWeight: font.weight,
        fontStyle: font.italic ? "italic" : "normal",
        textTransform: font.upper ? "uppercase" : "none",
        fontSize: startSize,
        justifyContent: s.align === "left" ? "flex-start" : "center",
        textAlign: s.align,
        ...style,
      }}
    >
      <span ref={textRef} style={{ width: "100%" }}>{text}</span>
    </div>
  );
}

/** Muted autoplay only while on screen; one clip loop at a time per tile. */
function useVisibleAutoplay(ref, enabled) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === "undefined") return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) el.play?.().catch(() => {});
        else el.pause?.();
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled]);
}

/**
 * One rectangle on the Wall. Tap → onOpen(block) (viewer with Share / Report).
 */
export default function WallBlockTile({ block, onOpen }) {
  const videoRef = useRef(null);
  const isClip = block.kind === "video";
  const s = wallStyle(block.style);
  const theme = WALL_THEMES[s.theme];
  useVisibleAutoplay(videoRef, isClip && Boolean(block.video_url));
  const who = block.author?.first_name || "";
  const label = isClip
    ? `Clip${block.body ? `: ${block.body}` : ""}${who ? ` by ${who}` : ""}`
    : `${block.body}${who ? ` — ${who}` : ""}`;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`cw-tile cw-size-${block.size}`}
      data-testid="cluster-wall-tile"
      data-wall-id={block.public_id}
      aria-label={label}
      onClick={() => onOpen?.(block)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(block);
        }
      }}
      style={isClip ? { background: "#111827" } : wallSurfaceStyle(s.theme)}
    >
      {isClip ? (
        <>
          {block.video_url ? (
            <video
              ref={videoRef}
              src={block.video_url}
              poster={block.poster_url || undefined}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
            />
          ) : block.poster_url ? (
            <img src={block.poster_url} alt="" loading="lazy" />
          ) : null}
          <span className="cw-tile-badge">Clip</span>
          {block.body || who ? (
            <span className="cw-tile-caption">
              {block.body || ""}
              {block.body && who ? " · " : ""}
              {who}
            </span>
          ) : null}
        </>
      ) : (
        <>
          <WallInscription block={block} />
          {who ? (
            <span className="cw-tile-author" style={{ color: theme.ink }}>
              — {who}
            </span>
          ) : null}
        </>
      )}
      {block.is_mine && block.status && block.status !== "published" ? (
        <span className="cw-tile-badge" style={{ top: "auto", bottom: 5, left: 5, background: "#b45309" }}>
          In review
        </span>
      ) : null}
      <button
        type="button"
        className="cw-tile-share"
        aria-label="Share this post"
        data-testid="cluster-wall-tile-share"
        onClick={(e) => {
          e.stopPropagation();
          onOpen?.(block);
        }}
        style={{ color: isClip ? "#fff" : theme.ink }}
      >
        ↗
      </button>
    </div>
  );
}
