import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-11-dont-control-price.png";

export default function Slide11DontControlPrice() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Meanwhile… you don't control the price."
      background={PRESENTATION_THEME.white}
    />
  );
}
