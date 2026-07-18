import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-21-all-menus.png";

export default function Slide21MultiDevice() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="All menus. All places. One search. One menu."
      background={PRESENTATION_THEME.white}
    />
  );
}
