import { useEffect, useLayoutEffect, useRef } from "react";
import { WALL_FONTS, WALL_THEMES, wallInk, wallStyle, wallSurfaceStyle, wallTextFontSize } from "../../lib/clusterWallStyles.js";
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

/** Frame the words are fitted into: whole box, a smaller tilted box, or the box turned sideways. */
function frameStyle(angle) {
  if (angle === 90 || angle === -90) return { width: "100cqh", height: "100cqw", transform: `rotate(${angle}deg)` };
  if (angle) return { width: "86%", height: "78%", transform: `rotate(${angle}deg)` };
  return { width: "100%", height: "100%" };
}

export function WallInscription({ block, scale = 1, className = "cw-tile-text", style }) {
  const s = wallStyle(block.style);
  const font = WALL_FONTS[s.font];
  const ink = wallInk(s);
  const text = String(block.body || "");
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const startSize = wallTextFontSize(block.size, text.length, { scale });
  useFitText(boxRef, textRef, startSize, [text, startSize, s.font, s.angle, block.size]);
  return (
    <div
      className={s.angle ? `${className} cw-turned` : className}
      style={{
        color: ink.color,
        textShadow: ink.textShadow,
        fontFamily: font.family,
        fontWeight: font.weight,
        fontStyle: font.italic ? "italic" : "normal",
        textTransform: font.upper ? "uppercase" : "none",
        textAlign: s.align,
        ...style,
      }}
    >
      <div
        ref={boxRef}
        className="cw-tile-frame"
        style={{ ...frameStyle(s.angle), fontSize: startSize, justifyContent: s.align === "left" ? "flex-start" : "center" }}
      >
        <span ref={textRef} style={{ width: "100%" }}>{text}</span>
      </div>
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
  // The official Menuply brick (block.house): same look as a post, a MENUPLY tag, no share/author.
  const isHouse = block.house === true;
  const label = isHouse
    ? `Menuply: ${block.body}`
    : isClip
      ? `Clip${block.body ? `: ${block.body}` : ""}${who ? ` by ${who}` : ""}`
      : `${block.body}${who ? ` — ${who}` : ""}`;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`cw-tile cw-size-${block.size}${isHouse ? " cw-tile-house" : ""}`}
      data-testid={isHouse ? "cluster-wall-house-tile" : "cluster-wall-tile"}
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
      {isHouse ? (
        <span className="cw-house-tag" style={{ color: theme.ink }} aria-hidden="true">
          {block.tag || "MENUPLY"}
        </span>
      ) : null}
      {isHouse ? null : <button
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
      </button>}
    </div>
  );
}
