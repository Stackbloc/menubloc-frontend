import React from "react";

/** Mini Yellow Browser splash — yellow square + three horizontal menu lines. */
export default function BrowseMenusIcon({
  size = 22,
  title,
  className,
  style,
  active = false,
  ...props
}) {
  const ariaProps = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

  const yellow = active ? "#EAB308" : "#FACC15";
  const ink = "#1a1a1a";
  const strokeW = active ? 2.1 : 1.9;

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
      <rect x="3" y="3" width="18" height="18" rx="3.5" fill={yellow} />
      <line x1="7.5" y1="9.5" x2="16.5" y2="9.5" stroke={ink} strokeWidth={strokeW} strokeLinecap="round" />
      <line x1="7.5" y1="12" x2="14.5" y2="12" stroke={ink} strokeWidth={strokeW} strokeLinecap="round" />
      <line x1="7.5" y1="14.5" x2="17" y2="14.5" stroke={ink} strokeWidth={strokeW} strokeLinecap="round" />
    </svg>
  );
}
