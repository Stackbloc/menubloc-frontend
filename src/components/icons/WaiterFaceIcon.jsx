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

  return (
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
  );
}
