import React from "react";

export default function ShareIcon({ size = 16, stroke = "currentColor", strokeWidth = 2 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="18" cy="5" r="2.5" stroke={stroke} strokeWidth={strokeWidth} />
      <circle cx="6" cy="12" r="2.5" stroke={stroke} strokeWidth={strokeWidth} />
      <circle cx="18" cy="19" r="2.5" stroke={stroke} strokeWidth={strokeWidth} />
      <path
        d="M8.2 10.9L15.8 6.1M8.2 13.1L15.8 17.9"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
