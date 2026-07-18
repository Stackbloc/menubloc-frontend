import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-05-lost-customer.png";

export default function Slide05UnfoundMenu() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Every unfound menu is a lost customer."
      background={PRESENTATION_THEME.black}
    />
  );
}
