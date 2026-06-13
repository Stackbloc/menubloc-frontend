import React from "react";
import waiterFaceSrc from "../../assets/waiter-icons/waiter-face.png";

export default function WaiterFaceIcon({
  size = 34,
  title,
  className,
  style,
  ...props
}) {
  const ariaProps = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

  // The PNG has ~28% empty whitespace at the bottom below the bowtie.
  // Clip it so the label sits directly under the visible icon content.
  const visibleHeight = Math.round(size * 0.72);

  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: visibleHeight,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <img
        src={waiterFaceSrc}
        alt={title || ""}
        width={size}
        height={size}
        className={className}
        style={{ display: "block", objectFit: "contain", ...style }}
        {...ariaProps}
        {...props}
      />
    </span>
  );
}
