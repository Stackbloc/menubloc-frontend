import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-03-how-many-customers.png";

export default function Slide03LostCustomers() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="How many customers gave up looking for your menu today?"
      background={PRESENTATION_THEME.white}
    />
  );
}
