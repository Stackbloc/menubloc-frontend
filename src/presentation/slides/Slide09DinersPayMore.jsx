import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-09-diners-pay-more.png";

export default function Slide09DinersPayMore() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Diners pay more through third-party apps."
      background={PRESENTATION_THEME.white}
    />
  );
}
