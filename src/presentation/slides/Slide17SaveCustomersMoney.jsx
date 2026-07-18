import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-17-save-customers.png";

export default function Slide17SaveCustomersMoney() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="…so they can save their customers money…"
      background={PRESENTATION_THEME.white}
    />
  );
}
