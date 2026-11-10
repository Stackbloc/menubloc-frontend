import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-10-without-getting-anything.webp";

export default function Slide10WithoutGettingMore() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Without getting anything more — third-party app versus order direct."
      background={PRESENTATION_THEME.white}
    />
  );
}
