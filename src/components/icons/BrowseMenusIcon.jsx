import React from "react";

/** Open book — loose nod to Yellow Browser, sized for bottom nav. */
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

  const page = active ? "#FDE047" : "#FACC15";
  const stroke = active ? "#A16207" : "#CA8A04";

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
        d="M4.5 6.2C4.5 5.4 5.1 4.8 5.9 4.8H11v14.4H6.2c-.9 0-1.7-.7-1.7-1.6V6.2Z"
        fill={page}
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 6.2c0-.8-.6-1.4-1.4-1.4H13v14.4h4.8c.9 0 1.7-.7 1.7-1.6V6.2Z"
        fill={page}
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 4.8v14.4"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
