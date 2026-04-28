import React from "react";
import { PageNav } from "../NavButton.jsx";
import Breadcrumbs from "../ui/Breadcrumbs.jsx";
import { PageHero, PageShell } from "../grubbid/GrubbidPrimitives.jsx";
import { LEGAL_CONTACT, LEGAL_EFFECTIVE_DATE } from "../../content/legal.js";
import StickyPageHeader from "../StickyPageHeader.jsx";
import BottomNav from "../BottomNav.jsx";

const headingStyle = {
  margin: "32px 0 10px",
  color: "var(--gb-color-ink-strong)",
  fontSize: "18px",
  fontWeight: 800,
};

const paragraphStyle = {
  margin: "0 0 14px",
  color: "var(--gb-color-ink-soft)",
  fontSize: "15px",
  lineHeight: 1.75,
};

export default function LegalDocumentPage({ document, eyebrow }) {
  return (
    <>
    <StickyPageHeader />
    <PageShell width="reading">
      <PageNav back />
      <Breadcrumbs
        items={[
          { label: "Discovery", to: "/" },
          { label: document.title },
        ]}
      />

      <PageHero
        eyebrow={eyebrow}
        title={document.title}
        description={`${document.description} Effective Date: ${LEGAL_EFFECTIVE_DATE}.`}
      />

      <div style={{ maxWidth: 760 }}>
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 style={headingStyle}>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.heading}-${index}`} style={paragraphStyle}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2 style={headingStyle}>Legal entity</h2>
          <p style={paragraphStyle}>Menuply is operated by {LEGAL_CONTACT.company}.</p>
        </section>
      </div>
    </PageShell>
    <BottomNav />
    </>
  );
}
