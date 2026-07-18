import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-18-pricing-decisions.png";

export default function Slide18WithoutReducingProfits() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Make pricing decisions on your terms."
      background={PRESENTATION_THEME.black}
    />
  );
}
