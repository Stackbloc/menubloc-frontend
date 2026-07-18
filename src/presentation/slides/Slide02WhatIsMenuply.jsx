import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-02-what-is-menuply.png";

export default function Slide02WhatIsMenuply() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="What is Menuply? The world’s most complete restaurant menu platform."
      background={PRESENTATION_THEME.black}
    />
  );
}
