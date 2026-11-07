import { useRef } from "react";
import { WALL_FONTS, WALL_THEMES, WALL_UNDERLINES, wallAgo, wallInk, wallStyle, wallSurfaceStyle } from "../../lib/clusterWallStyles.js";
import useFitText from "../../hooks/useWallFitText.js";

/** One brick on the Wall (2026-11-06 redesign): words on a material, a photo, or a clip thumbnail. */

function authorName(block) {
  if (block.official) return "Menuply";
  return block.author?.first_name || "Guest";
}

/** "— Name · 2d", bottom right of every brick. */
function Signature({ block, color }) {
  const ago = wallAgo(block.published_at || block.created_at);
  return (
    <span className="bw-sign" style={{ color }}>
      — {authorName(block)}
      {ago ? <span className="bw-ago"> · {ago}</span> : null}
    </span>
  );
}

function BrickText({ block }) {
  const s = wallStyle(block.style);
  const font = WALL_FONTS[s.font];
  const ink = wallInk(s);
  const under = WALL_UNDERLINES[s.underline]?.color;
  const text = String(block.body || "");
  const boxRef = useRef(null);
  const textRef = useRef(null);
  useFitText(boxRef, textRef, 30, [text, s.font, s.emoji, s.underline]);
  return (
    <div
      className="bw-text"
      style={{
        color: ink.color,
        textShadow: ink.textShadow,
        fontFamily: font.family,
        fontWeight: font.weight,
        textTransform: font.upper ? "uppercase" : "none",
        transform: s.tilt ? `rotate(${s.tilt}deg)` : undefined,
      }}
    >
      <div ref={boxRef} className="bw-text-box" style={{ fontSize: 30 }}>
        <span ref={textRef} style={{ width: "100%" }}>
          <span
            style={
              under
                ? { textDecorationLine: "underline", textDecorationColor: under, textDecorationThickness: "0.14em", textUnderlineOffset: "0.14em", textDecorationSkipInk: "none" }
                : undefined
            }
          >
            {text}
          </span>
          {s.emoji ? <span className="bw-emoji"> {s.emoji}</span> : null}
        </span>
      </div>
    </div>
  );
}

export default function Brick({ block, onOpen, onShare, tall = false }) {
  const s = wallStyle(block.style);
  const theme = WALL_THEMES[s.theme];
  const isPhoto = block.kind === "photo";
  const isClip = block.kind === "video";
  const media = isPhoto || isClip;
  const picture = isPhoto ? block.photo_url : block.poster_url;
  const name = authorName(block);
  const label = `${isClip ? "Clip" : isPhoto ? "Photo" : "Brick"}${block.body ? `: ${block.body}` : ""} — ${name}`;
  return (
    <div
      role="button"
      tabIndex={0}
      className={`bw-brick${media ? " bw-media" : ""}${tall ? " bw-tall" : ""}`}
      data-testid="wall-brick"
      data-wall-id={block.public_id}
      aria-label={label}
      onClick={() => onOpen(block)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(block);
        }
      }}
      style={media ? { background: "#111" } : wallSurfaceStyle(s.theme)}
    >
      {media ? (
        <>
          {picture ? <img src={picture} alt="" loading="lazy" /> : null}
          {isClip ? <span className="bw-play" aria-hidden="true">▶</span> : null}
          {block.body ? <span className="bw-caption">{block.body}</span> : null}
          <Signature block={block} color="#fff" />
        </>
      ) : (
        <>
          <BrickText block={block} />
          <Signature block={block} color={theme.ink} />
        </>
      )}
      {block.pinned ? <span className="bw-pin-tag" style={{ color: media ? "#fff" : theme.ink }}>📌 Pinned</span> : null}
      {block.is_mine && block.status && block.status !== "published" ? <span className="bw-review">In review · only you see this</span> : null}
      {onShare && (!block.status || block.status === "published") ? (
        <button
          type="button"
          className="bw-share"
          aria-label="Share this brick"
          data-testid="wall-brick-share"
          onClick={(e) => {
            e.stopPropagation();
            onShare(block);
          }}
          style={{ color: media ? "#fff" : theme.ink }}
        >
          ↗
        </button>
      ) : null}
    </div>
  );
}

