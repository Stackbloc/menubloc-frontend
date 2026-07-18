import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-12-someone-else-decides.png";

export default function Slide12SomeoneElseDecides() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Someone else decides how much of every sale they keep."
      background={PRESENTATION_THEME.white}
    />
  );
}
