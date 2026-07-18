import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-14-marketing-costs.png";

export default function Slide14MarketingCosts() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="We're reducing restaurant marketing costs."
      background={PRESENTATION_THEME.black}
    />
  );
}
