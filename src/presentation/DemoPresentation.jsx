import React from "react";
import PresentationEngine from "./PresentationEngine.jsx";
import { DEMO_SLIDES } from "./slides/index.js";

/**
 * Menuply product demo deck at /demo.
 * Future decks (Investor, Restaurant, Food Truck, …) should mount
 * PresentationEngine with their own slide registry the same way.
 */
export default function DemoPresentation() {
  return <PresentationEngine slides={DEMO_SLIDES} />;
}
