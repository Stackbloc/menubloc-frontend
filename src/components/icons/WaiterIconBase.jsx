import React from "react";

const VARIANT_PATHS = {
  insight: null,
  question: (
    <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.4 11.9c1.05-1.15 1.38-2.42 1-3.82" />
      <path d="M17.42 8.08l.68-2.9" />
      <path d="M18.1 5.18c.18-.7.82-1.02 1.36-.7.43.26.57.82.32 1.28l-1.02 2.12" />
    </g>
  ),
  presenting: (
    <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.1 12.2c1.48-.1 2.85-.72 4.1-1.88" />
      <path d="M20.2 10.32l1.12.42" />
      <path d="M19.65 11.38l1.02.6" />
      <path d="M18.9 12.15l.82.72" />
    </g>
  ),
  recommendation: (
    <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.2 12.2h2.92c.62 0 1.05-.58.9-1.18l-.45-1.82h1.45c.56 0 .96-.54.8-1.08-.16-.52-.58-.82-1.12-.82h-1.94l.14-1.42c.05-.5-.33-.94-.84-.94-.33 0-.62.2-.76.5l-.98 2.18c-.28.62-.68 1.16-1.18 1.62" />
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
        d="M7.15 8.72c.2-2.72 2.52-4.92 5.28-4.92 2.04 0 3.66 1.02 4.52 2.42-2.66-.5-4.76.26-6.28 2.26-1.06 1.4-2.24 1.48-3.52.24Z"
        fill="currentColor"
      />
      <path
        d="M13.72 10.92c1.1-.8 2.1-1.04 3-.72"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <path d="M11.76 15.86 8.6 13.9v3.92l3.16-1.96Z" fill="currentColor" />
      <path d="M12.24 15.86l3.16-1.96v3.92l-3.16-1.96Z" fill="currentColor" />
      <circle cx="12" cy="15.86" r=".72" fill="currentColor" />
      {VARIANT_PATHS[variant]}
    </svg>
  );
}
