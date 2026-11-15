/**
 * The Post sheet's look (Andre 2026-11-14 mockups, same as the app's PostArt.tsx): a soft green card
 * with faint food doodles, the Menuply logo, round ‹ and ✕ buttons, yellow "pop" rays and line icons.
 */

import { POST_COLORS } from "../../../lib/postArtTheme.js";

/** Yellow rays fanning up from a point. */
export function Burst({ width = 120, side = "both", style }) {
  const rays = [];
  if (side !== "right") rays.push("M18 50 L6 42", "M34 30 L22 14");
  if (side === "both") rays.push("M60 22 L60 2");
  if (side !== "left") rays.push("M86 30 L98 14", "M102 50 L114 42");
  return (
    <svg width={width} height={width / 2} viewBox="0 0 120 60" aria-hidden style={style}>
      {rays.map((d) => (
        <path key={d} d={d} stroke={POST_COLORS.burst} strokeWidth="8" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/** A solid video camera. */
export function VideoCam({ size = 56, color = POST_COLORS.camGreen }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 64 40" aria-hidden>
      <rect x="0" y="0" width="42" height="40" rx="8" fill={color} />
      <path d="M46 14 L62 4 V36 L46 26 Z" fill={color} />
    </svg>
  );
}

export function StoreIcon({ size = 30, color = POST_COLORS.camGreen }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M3 11 L6 4 H26 L29 11 Z" fill={color} />
      <path d="M3 11 a3.25 3.25 0 0 0 6.5 0 a3.25 3.25 0 0 0 6.5 0 a3.25 3.25 0 0 0 6.5 0 a3.25 3.25 0 0 0 6.5 0" fill="#fff" stroke={color} strokeWidth="1.5" />
      <path d="M5 16 V28 H27 V16" stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <rect x="13" y="19" width="6" height="9" fill={color} />
    </svg>
  );
}

export function PencilIcon({ size = 18, color = POST_COLORS.accent }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M4 20 L5 15 L16 4 L20 8 L9 19 Z" fill={color} />
      <path d="M14 6 L18 10" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function PriceTicket({ size = 34 }) {
  const c = POST_COLORS.camGreen;
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden>
      <path d="M5 4 H29 V12 a5 5 0 0 0 0 10 V30 H5 V22 a5 5 0 0 0 0 -10 Z" fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="M20.5 11.5 c-1-1.4-2.4-1.9-3.9-1.9 c-2 0-3.4 1-3.4 2.6 c0 3.6 7.6 2 7.6 5.9 c0 1.7-1.6 2.8-3.9 2.8 c-1.7 0-3.3-0.7-4.2-2 M16.8 7.5 V9.6 M16.8 21 V23.5"
        fill="none"
        stroke={c}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 18, color = "#fff", strokeWidth = 2.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Red map pin (Restaurant row on Tag Your Clip, Andre 2026-11-14 mockup). */
export function PinIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 1.5c-4.4 0-8 3.5-8 7.9C4 15 12 22.5 12 22.5S20 15 20 9.4c0-4.4-3.6-7.9-8-7.9Z" fill="#e3262e" />
      <path d="M12 6.2a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Z" fill="#8f0f15" />
    </svg>
  );
}

/** Green outlined taco (Dish row on Tag Your Clip). */
export function TacoIcon({ size = 30 }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 34 24" aria-hidden>
      <path d="M3 21 C3 11 9.5 4 17 4 C24.5 4 31 11 31 21 Z" fill="#dff3c9" stroke={POST_COLORS.camGreen} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M7 13 C10 10.5 12 12 14 10 C16 8 19 9.5 21 8.5 C23.5 7.5 26 10 27.5 12.5" fill="none" stroke={POST_COLORS.camGreen} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Magnifier at the end of a tag row. */
export function SearchIcon({ size = 22, color = POST_COLORS.logoInk }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flex: "0 0 auto" }}>
      <path d="M10.5 3.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z" fill="none" stroke={color} strokeWidth="2.2" />
      <path d="M15.8 15.8 21 21" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** Three short green dashes fanning out beside "Tag it so friends can find it!". */
export function TagSparks({ side, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flex: "0 0 auto", transform: side === "right" ? "scaleX(-1)" : undefined }}>
      <path d="M14 4 L19 8 M5 12 H17 M14 20 L19 16" stroke={POST_COLORS.camGreen} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
