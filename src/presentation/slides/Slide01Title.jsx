import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/menuply-logo-lockup.png";

export default function Slide01Title() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Menuply"
      background={PRESENTATION_THEME.black}
    />
  );
}
