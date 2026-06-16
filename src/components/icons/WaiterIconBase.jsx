import React from "react";

const VARIANT_PATHS = {
  insight: null,
  question: (
    <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 12.1c1.42-.76 2.22-1.8 2.42-3.12" />
      <path d="M20.12 8.98V4.5" />
      <path d="M20.12 4.5c0-.58.44-1.02 1-1.02.54 0 .98.44.98 1.02v2.82" />
    </g>
  ),
  presenting: (
    <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.3 12.34c1.46-.06 2.86-.62 4.2-1.7" />
      <path d="M20.5 10.64l1.04.36" />
      <path d="M19.82 11.76l.94.54" />
      <path d="M18.98 12.58l.72.64" />
    </g>
  ),
  recommendation: (
    <g stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.26 12.08h2.86c.66 0 1.08-.58.92-1.2l-.42-1.62h1.26c.58 0 .98-.52.84-1.08-.14-.5-.56-.82-1.12-.82h-1.76l.12-1.28c.04-.52-.34-.94-.86-.94-.34 0-.64.2-.78.52l-.9 1.94c-.3.66-.72 1.22-1.26 1.7" />
    </g>
  ),
};

export default function WaiterIconBase({
  variant = "insight",
  size = 20,
  title,
  className,
  style,
  ...props
}) {
  const ariaProps = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", flexShrink: 0, ...style }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...ariaProps}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M6.45 8.28c.32-3.54 3-5.98 6.48-5.98 2.98 0 5.18 1.72 5.78 4.4.18.84.04 1.52-.4 2.04-1.9-.7-3.34-.72-4.34-.08-.64.4-1.18 1.1-2.14 1.34-1.88.46-3.68-.12-5.38-1.72Z"
        fill="currentColor"
      />
      <path
        d="M13.28 11.68c1.26-.9 2.5-1.08 3.72-.54"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path d="M11.58 16.34 7.4 13.68v5.32l4.18-2.66Z" fill="currentColor" />
      <path d="M12.42 16.34 16.6 13.68v5.32l-4.18-2.66Z" fill="currentColor" />
      <circle cx="12" cy="16.34" r="1" fill="currentColor" />
      <path d="M8.6 21.4h6.8l-1.5-2.02L12 20.58l-1.9-1.2L8.6 21.4Z" fill="currentColor" />
      {VARIANT_PATHS[variant]}
    </svg>
  );
}
