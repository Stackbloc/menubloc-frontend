import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-20-grow-business.png";

export default function Slide20WorldPlatform() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Powerful tools. More customers. Grow your business."
      background={PRESENTATION_THEME.white}
    />
  );
}
