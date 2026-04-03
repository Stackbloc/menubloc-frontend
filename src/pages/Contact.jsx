import React from "react";
import { PageNav } from "../components/NavButton.jsx";
import { PageHero, PageShell } from "../components/grubbid/GrubbidPrimitives.jsx";

const paragraphStyle = {
  margin: "0 0 18px",
  color: "var(--gb-color-ink-soft)",
  fontSize: "15px",
  lineHeight: 1.8,
};

export default function Contact() {
  return (
    <PageShell width="reading">
      <PageNav back />

      <PageHero
        title="Contact Us"
        description="Reach Grubbid directly with feedback or questions."
      />

      <div style={{ maxWidth: 720 }}>
        <p style={paragraphStyle}>
          You may contact us at{" "}
          <a href="mailto:grubbidplatform@gmail.com" style={{ color: "var(--gb-color-accent)" }}>
            grubbidplatform@gmail.com
          </a>{" "}
          with any suggestions, comments or concerns. Thank you.
        </p>
      </div>
    </PageShell>
  );
}
