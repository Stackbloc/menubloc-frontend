import React from "react";

/** Open book outline — white spine gap in the middle, no solid fill. */
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

  const strokeW = active ? 1.65 : 1.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", flexShrink: 0, color: "currentColor", ...style }}
      {...ariaProps}
      {...props}
    >
      {/* Pages fan open at top */}
      <path
        d="M6.6 5.6L12 4.5L17.4 5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left page — open toward center spine */}
      <path
        d="M5.6 18V6.8L6.6 5.6L11 5.6V18"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right page */}
      <path
        d="M18.4 18V6.8L17.4 5.6L13 5.6V18"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
