/**
 * Small status indicator for menu items with one or more active deals.
 * Sits adjacent to the displayed price; click opens existing deal/item sheet.
 */

import { useEffect, useState } from "react";

const ICON_SRC = "/menuply-deals-icon.png";

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginLeft: 5,
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  lineHeight: 0,
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

function useDealsIconSize() {
  const [size, setSize] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768 ? 16 : 14
  );
  useEffect(() => {
    function onResize() {
      setSize(window.innerWidth >= 768 ? 16 : 14);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

export default function MenuItemDealsIndicator({
  onClick,
  ariaLabel = "Deals available",
}) {
  const iconSize = useDealsIconSize();

  function handleActivate(e) {
    e.stopPropagation();
    e.preventDefault();
    if (typeof onClick === "function") onClick(e);
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleActivate(e);
        }
      }}
      style={btnStyle}
      data-testid="menu-item-deals-indicator"
    >
      <img
        src={ICON_SRC}
        alt=""
        aria-hidden="true"
        width={iconSize}
        height={iconSize}
        style={{
          display: "block",
          width: iconSize,
          height: iconSize,
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
