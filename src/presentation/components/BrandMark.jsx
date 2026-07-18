import React from "react";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import { PRESENTATION_THEME } from "../theme.js";

/** Non-navigating Menuply lockup for title / impact slides. */
export default function BrandMark({
  height = 72,
  pageColor = PRESENTATION_THEME.black,
  wordmarkColor = PRESENTATION_THEME.white,
}) {
  return (
    <BrandLogo
      clickable={false}
      height={height}
      pageColor={pageColor}
      matchPageBackground
      wordmarkColor={wordmarkColor}
      ariaLabel="Menuply"
    />
  );
}
