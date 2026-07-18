import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-15-path-to-success.png";

export default function Slide15DirectLine() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Building a stronger restaurant network — the path to sustainable success."
      background={PRESENTATION_THEME.white}
    />
  );
}
