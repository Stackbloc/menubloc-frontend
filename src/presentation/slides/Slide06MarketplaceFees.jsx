import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-07-commissions.png";

export default function Slide06MarketplaceFees() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="30% restaurant commission plus 15% customer marketplace fees equals 45% total burden."
      background={PRESENTATION_THEME.white}
    />
  );
}
