import React from "react";
import { PRESENTATION_THEME } from "../theme.js";

/**
 * Full-bleed designed slide graphic (contain so 16:9 art isn’t cropped).
 */
export default function FullBleedGraphic({ src, alt, background = PRESENTATION_THEME.black }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}
