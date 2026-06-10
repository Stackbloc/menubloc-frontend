import React from "react";
import WaiterFaceIcon from "./WaiterFaceIcon.jsx";

export default function WaiterIconBase({
  size = 20,
  title,
  className,
  style,
  ...props
}) {
  return (
    <WaiterFaceIcon
      size={size}
      title={title}
      className={className}
      style={{ display: "inline-block", flexShrink: 0, ...style }}
      {...props}
    />
  );
}
