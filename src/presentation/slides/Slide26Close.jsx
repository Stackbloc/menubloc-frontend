import React from "react";
import TitleLayout from "../layouts/TitleLayout.jsx";
import Em from "../components/Em.jsx";
import { PRESENTATION_THEME } from "../theme.js";

export default function Slide26Close() {
  return (
    <TitleLayout
      brandHeight={96}
      footer={
        <div
          style={{
            fontSize: "clamp(16px, 2.4vw, 24px)",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: PRESENTATION_THEME.white,
          }}
        >
          One world. <Em>One menu.</Em>
        </div>
      }
    />
  );
}
