import React from "react";
import { MENUPLY_LOGO_SRC } from "./BrandLogo.jsx";

const X_MARK_RATIO = 230 / 1266;

/**
 * Established Menuply X mark (logo crop) — action launcher, not a plus icon.
 */
export default function MenuplyXMark({
  size = 28,
  active = false,
  title,
  className,
  style,
  ...props
}) {
  const xMarkW = Math.round(size * ((X_MARK_RATIO * 1266) / 236));
  const ariaProps = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        overflow: "hidden",
        opacity: active ? 1 : 0.92,
        ...style,
      }}
      {...ariaProps}
      {...props}
    >
      <img
        src={MENUPLY_LOGO_SRC}
        alt=""
        style={{
          display: "block",
          height: size,
          width: xMarkW,
          objectFit: "cover",
          objectPosition: "left center",
          flexShrink: 0,
        }}
      />
    </span>
  );
}
