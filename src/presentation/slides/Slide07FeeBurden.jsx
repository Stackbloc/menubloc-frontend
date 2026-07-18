import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-09b-pay-more.png";

export default function Slide07FeeBurden() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Diners pay more and leave frustrated when menus are hard to find."
      background={PRESENTATION_THEME.white}
    />
  );
}
