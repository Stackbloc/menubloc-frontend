import React from "react";
import InfographicLayout from "../layouts/InfographicLayout.jsx";
import { PRESENTATION_THEME } from "../theme.js";
import { MagnifierIcon, RedXIcon } from "../assets/icons.jsx";

function HungryIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={PRESENTATION_THEME.accent} strokeWidth="2" />
      <path
        d="M8 14c1.2 1.4 2.6 2 4 2s2.8-.6 4-2"
        stroke={PRESENTATION_THEME.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="10" r="1.1" fill={PRESENTATION_THEME.accent} />
      <circle cx="15" cy="10" r="1.1" fill={PRESENTATION_THEME.accent} />
    </svg>
  );
}

function ElsewhereIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11h16v9H4v-9Z" stroke={PRESENTATION_THEME.accent} strokeWidth="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={PRESENTATION_THEME.accent} strokeWidth="2" />
    </svg>
  );
}

const steps = [
  { label: "Hungry", node: <HungryIcon /> },
  { label: "Searches", node: <MagnifierIcon size={40} /> },
  { label: "Can't find menu", node: <RedXIcon size={40} /> },
  { label: "Eats somewhere else", node: <ElsewhereIcon /> },
];

export default function Slide04HungryFlow() {
  return (
    <InfographicLayout headline="The search for your menu">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div
              style={{
                minWidth: 120,
                padding: "18px 16px",
                borderRadius: 16,
                border: "1.5px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  lineHeight: 1,
                  minHeight: 40,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {step.node}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: PRESENTATION_THEME.ink,
                }}
              >
                {step.label}
              </div>
            </div>
            {i < steps.length - 1 ? (
              <div style={{ color: PRESENTATION_THEME.accent, fontWeight: 900, fontSize: 22 }}>→</div>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </InfographicLayout>
  );
}
