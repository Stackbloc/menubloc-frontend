import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-22-plans.png";

export default function Slide22SocialProof() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Grow your restaurant your way — Standard, Pro, and Founders plans."
      background={PRESENTATION_THEME.white}
    />
  );
}
