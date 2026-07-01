import React from "react";

/** Open book / catalog icon — Menu Browser entry point (yellow). */
export default function BrowseMenusIcon({
  size = 24,
  title,
  className,
  style,
  active = false,
  ...props
}) {
  const ariaProps = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

  const leftCover = active ? "#CA8A04" : "#EAB308";
  const rightCover = active ? "#A16207" : "#CA8A04";
  const leftFill = active ? "#FDE047" : "#FACC15";
  const rightFill = active ? "#FEF08A" : "#FDE047";
  const lineColor = active ? "#854D0E" : "#A16207";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      {...ariaProps}
      {...props}
    >
      <path
        d="M5 4.5C5 3.67 5.67 3 6.5 3H11v18H6.5A1.5 1.5 0 0 1 5 19.5v-15Z"
        fill={leftFill}
        fillOpacity={0.95}
        stroke={leftCover}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M19 4.5C19 3.67 18.33 3 17.5 3H13v18h4.5A1.5 1.5 0 0 0 19 19.5v-15Z"
        fill={rightFill}
        fillOpacity={0.98}
        stroke={rightCover}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11 3v18"
        stroke={leftCover}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M11 7.5h2M11 10.5h2M11 13.5h2"
        stroke={lineColor}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
