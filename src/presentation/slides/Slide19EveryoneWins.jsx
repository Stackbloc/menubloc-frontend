import React from "react";
import { PRESENTATION_THEME } from "../theme.js";
import { CheckIcon } from "../assets/icons.jsx";
import SlideMedia from "../components/SlideMedia.jsx";

const wins = ["Restaurants win", "Diners win", "Menuply wins"];

export default function Slide19EveryoneWins() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: PRESENTATION_THEME.white,
      }}
      className="mp-win-slide"
    >
      <div
        style={{
          flex: "1 1 46%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 22,
          padding: "clamp(28px, 6vw, 72px)",
          boxSizing: "border-box",
        }}
      >
        {wins.map((label) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: PRESENTATION_THEME.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckIcon color={PRESENTATION_THEME.black} size={22} />
            </div>
            <span
              style={{
                fontSize: "clamp(22px, 3.2vw, 36px)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: PRESENTATION_THEME.ink,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <div style={{ flex: "1 1 54%", position: "relative", minHeight: 220 }}>
        <SlideMedia placeholderLabel="Family sharing pizza" style={{ position: "absolute", inset: 0 }} />
      </div>
      <style>{`
        @media (max-width: 820px) {
          .mp-win-slide { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
