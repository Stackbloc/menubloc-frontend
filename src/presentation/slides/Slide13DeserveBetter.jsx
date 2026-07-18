import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-13-deserve-better.png";

export default function Slide13DeserveBetter() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="We think restaurants deserve better."
      background={PRESENTATION_THEME.white}
    />
  );
}
