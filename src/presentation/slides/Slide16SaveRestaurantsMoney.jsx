import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-16-save-restaurants.png";

export default function Slide16SaveRestaurantsMoney() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Save restaurants money…"
      background={PRESENTATION_THEME.white}
    />
  );
}
