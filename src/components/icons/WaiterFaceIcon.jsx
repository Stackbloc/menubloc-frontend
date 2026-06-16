import React from "react";
import waiterFaceSrc from "../../assets/waiter-icons/waiter-face.png";

// Zoom factor: renders the PNG larger than the container and clips,
// so the face features (eyes, smile, bow tie) fill the available space
// instead of sitting in a sea of whitespace.
const ZOOM = 1.85;

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

  const renderSize = Math.round(size * ZOOM);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <img
        src={waiterFaceSrc}
        alt={title || ""}
        width={renderSize}
        height={renderSize}
        className={className}
        style={{ display: "block", objectFit: "contain", flexShrink: 0, ...style }}
        {...ariaProps}
        {...props}
      />
    </span>
  );
}
