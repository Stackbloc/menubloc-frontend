import React from "react";

/** Open book — logo book shape only; inherits nav tab color. */
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
      {/* Page stack hints — like the logo */}
      <path
        d="M5.5 7.2v9.8M6.4 6.7v10.8M7.3 6.2v11.8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity={active ? 0.35 : 0.22}
      />
      <path
        d="M18.5 7.2v9.8M17.6 6.7v10.8M16.7 6.2v11.8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity={active ? 0.35 : 0.22}
      />

      {/* Open book spread */}
      <path
        d="M6.2 5.4C5.5 5.4 5 5.9 5 6.6v11.2c0 .7.6 1.2 1.2 1.2H11.8V5.4H6.2Z"
        fill="currentColor"
      />
      <path
        d="M17.8 5.4c.7 0 1.2.5 1.2 1.2v11.2c0 .7-.5 1.2-1.2 1.2H12.2V5.4h5.6Z"
        fill="currentColor"
      />
      <path
        d="M12 5.1v14.3"
        stroke="currentColor"
        strokeWidth={active ? 1.1 : 0.9}
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
