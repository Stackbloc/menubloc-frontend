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
