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
      <path
        d="M12 4v10M8.5 7.5 12 4l3.5 3.5"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 14.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
