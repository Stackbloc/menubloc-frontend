import FoundersFaqAccordion from "./FoundersFaqAccordion.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

const S = {
  backBtn: {
    background: "none",
    border: "none",
    color: "#667085",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
    marginBottom: 16,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
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
    margin: "0 0 10px",
  },
  intro: {
    fontSize: 15,
    lineHeight: 1.75,
    color: "#475467",
    margin: "0 0 24px",
  },
  continueBtn: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    border: 0,
    background: "#1F4E3D",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "-0.01em",
  },
};

export default function FoundersFaqStep({ onContinue, onBack }) {
  const { t } = useLanguage();
  return (
    <>
      <button type="button" style={S.backBtn} onClick={onBack}>
        ← Back
      </button>
      <div style={S.stepLabel}>Step 2 of 3 — Questions</div>
      <h2 style={S.heading}>A few things worth knowing.</h2>
      <p style={S.intro}>
        Common questions from restaurants joining the network — before you create an account.
      </p>

      <FoundersFaqAccordion />

      <button type="button" style={S.continueBtn} onClick={onContinue}>
        Continue to account creation
      </button>
    </>
  );
}
