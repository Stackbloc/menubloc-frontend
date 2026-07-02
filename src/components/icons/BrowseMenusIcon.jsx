import React from "react";

/** Three vertical lines — nod to Yellow Browser menu marks. */
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

  const ink = "#1a1a1a";
  const strokeW = active ? 2.2 : 2;

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
      <line x1="8" y1="6.5" x2="8" y2="17.5" stroke={ink} strokeWidth={strokeW} strokeLinecap="round" />
      <line x1="12" y1="5.5" x2="12" y2="18.5" stroke={ink} strokeWidth={strokeW} strokeLinecap="round" />
      <line x1="16" y1="7" x2="16" y2="17" stroke={ink} strokeWidth={strokeW} strokeLinecap="round" />
    </svg>
  );
}
