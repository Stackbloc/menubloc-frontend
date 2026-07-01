import React from "react";

/** Open book / catalog icon — Menu Browser entry point (not a filter). */
export default function BrowseMenusIcon({
  size = 24,
  title,
  className,
  style,
  color = "currentColor",
  ...props
}) {
  const ariaProps = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

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
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M19 4.5C19 3.67 18.33 3 17.5 3H13v18h4.5A1.5 1.5 0 0 0 19 19.5v-15Z"
        fill={color}
        fillOpacity="0.32"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M11 7.5h2M11 10.5h2M11 13.5h2" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
