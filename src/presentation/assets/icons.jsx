import React from "react";
import { PRESENTATION_THEME } from "../theme.js";

const stroke = PRESENTATION_THEME.black;
const green = PRESENTATION_THEME.accent;

export function ShareIcon({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.4" fill={stroke} />
      <circle cx="6" cy="12" r="2.4" fill={stroke} />
      <circle cx="18" cy="19" r="2.4" fill={stroke} />
      <path d="M8.2 13.1 15.7 17.1M15.8 6.9 8.3 10.9" stroke={stroke} strokeWidth="1.8" />
    </svg>
  );
}

export function PizzaSliceIcon({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 21 20H3L12 3Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.2" fill={stroke} />
      <circle cx="10" cy="15.5" r="1" fill={stroke} />
      <circle cx="14.2" cy="14.8" r="1" fill={stroke} />
    </svg>
  );
}

export function StorefrontIcon({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10h16v10H4V10Zm0 0 1.5-5h13L20 10M9 20v-6h6v6"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhoneFeeIcon({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="34" y="12" width="52" height="96" rx="10" stroke={green} strokeWidth="4" />
      <rect x="42" y="28" width="36" height="56" rx="4" fill="rgba(34,197,94,0.12)" stroke={green} strokeWidth="2" />
      <circle cx="60" cy="96" r="4" fill={green} />
      <text x="60" y="64" textAnchor="middle" fill={green} fontSize="28" fontWeight="800" fontFamily="system-ui">
        $
      </text>
    </svg>
  );
}

export function CheckIcon({ size = 28, color = green }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5 10 17.5 19 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MagnifierIcon({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke={green} strokeWidth="2" />
      <path d="m16 16 4 4" stroke={green} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RedXIcon({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#EF4444" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function WorldMapDots({ width = "100%", height = 280 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 800 360" aria-hidden="true">
      {Array.from({ length: 180 }).map((_, i) => {
        const x = (i % 20) * 38 + 30 + ((i * 7) % 11);
        const y = Math.floor(i / 20) * 38 + 28 + ((i * 3) % 9);
        const on = (i + x + y) % 5 !== 0;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={on ? 3.2 : 1.6}
            fill={on ? green : "rgba(34,197,94,0.25)"}
          />
        );
      })}
      {[
        [180, 140],
        [260, 120],
        [420, 100],
        [520, 150],
        [610, 180],
        [300, 200],
      ].map(([x, y], i) => (
        <g key={`pin-${i}`}>
          <circle cx={x} cy={y} r="8" fill={green} />
          <circle cx={x} cy={y} r="3" fill="#000" />
        </g>
      ))}
    </svg>
  );
}
