import React from "react";
import FullBleedGraphic from "../components/FullBleedGraphic.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import graphic from "../assets/slide-08-customer-comment.png";

export default function Slide08UserQuote() {
  return (
    <FullBleedGraphic
      src={graphic}
      alt="Customers expect value. They deserve better."
      background={PRESENTATION_THEME.white}
    />
  );
}
