import { useId } from "react";

/**
 * The deal mark (Andre 2026-11-04): green "D" on a black circle. Sits next to a dish price when
 * the dish has a live deal, and replaces the word "Deal" / 🏷️ on deal clips.
 * Same drawing as the app's src/components/icons/DealIcon.tsx.
 */
/** `ring`: thin white edge so the black circle reads on video and dark cards. */
export default function DealIcon({ size = 18, title = "Deal", style, ring = false }) {
  const gid = `mpDealD-${useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      data-testid="deal-icon"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle", ...style }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fd40f" />
          <stop offset="1" stopColor="#0ea33a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={ring ? 47 : 50} fill="#000" stroke={ring ? "#fff" : "none"} strokeWidth={ring ? 6 : 0} />
      <path
        fillRule="evenodd"
        fill={`url(#${gid})`}
        d="M31 21 H52 A29 29 0 0 1 52 79 H31 A3 3 0 0 1 28 76 V24 A3 3 0 0 1 31 21 Z M40 33 V67 H51 A17 17 0 0 0 51 33 Z"
      />
    </svg>
  );
}
