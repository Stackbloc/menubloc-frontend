import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

const S = {
  stepLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#667085",
    marginBottom: 10,
  },
  heading: {
    fontSize: "clamp(1.55rem, 3.8vw, 2.1rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    color: "#101828",
    margin: "0 0 20px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: 20,
    padding: "22px 22px 20px",
    marginBottom: 20,
    boxShadow: "0 4px 16px rgba(15,23,32,0.04)",
  },
  body: {
    fontSize: 16,
    lineHeight: 1.85,
    color: "#344054",
    margin: "0 0 16px",
  },
  bodyLast: {
    fontSize: 16,
    lineHeight: 1.85,
    color: "#344054",
    margin: 0,
  },
  // Philosophy agreement — cultural/mission feel, not legal/compliance.
  // Green accent border distinguishes it visually from the legal checkboxes in Step 3.
  agreementCard: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: "18px 20px",
    borderRadius: 16,
    border: "1.5px solid #1F4E3D",
    borderLeft: "4px solid #1F4E3D",
    background: "#f2f8f5",
    cursor: "pointer",
    marginBottom: 28,
    userSelect: "none",
  },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 2,
    accentColor: "#1F4E3D",
    flexShrink: 0,
    cursor: "pointer",
  },
  agreementLabel: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#1a3d2e",
    fontWeight: 700,
    cursor: "pointer",
  },
  agreementSub: {
    fontSize: 13,
    color: "#4a7a5f",
    marginTop: 4,
    lineHeight: 1.5,
  },
};

function continueBtn(enabled) {
  return {
    width: "100%",
    height: 52,
    borderRadius: 16,
    border: 0,
    background: enabled ? "#1F4E3D" : "#d0d5dd",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 16,
    cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "inherit",
    letterSpacing: "-0.01em",
    transition: "background 0.15s",
  };
}

export default function FoundersIntroStep({ onContinue }) {
  const { t } = useLanguage();
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      <div style={S.stepLabel}>Step 1 of 3 — Philosophy</div>
      <h1 style={S.heading}>Join the Menuply network.</h1>

      <div style={S.card}>
        <p style={S.body}>
          Menuply is built around the idea that lower restaurant transaction costs can create
          better long-term value for both restaurants and diners. Where traditional delivery
          platforms take a percentage of every order, Menuply charges a simple flat
          subscription so restaurants keep more of what they earn as they grow.
        </p>
        <p style={S.bodyLast}>
          Restaurants joining Menuply should make reasonable efforts to pass some of those
          savings and efficiencies through to diners — through competitive pricing, stronger
          everyday value, and direct customer relationships. This isn&apos;t a legal
          requirement. It&apos;s a culture: restaurants and diners building something better
          together.
        </p>
      </div>

      <label
        style={S.agreementCard}
        onClick={() => setAgreed((v) => !v)}
      >
        <input
          type="checkbox"
          style={S.checkbox}
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
        <div>
          <div style={S.agreementLabel}>
            I agree with Menuply&apos;s restaurant-first value philosophy.
          </div>
          <div style={S.agreementSub}>
            This is a values alignment, not a legal agreement. Legal terms appear in Step 3.
          </div>
        </div>
      </label>

      <button
        type="button"
        style={continueBtn(agreed)}
        disabled={!agreed}
        onClick={onContinue}
      >
        Continue
      </button>
    </>
  );
}
