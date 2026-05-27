import React from "react";
import { PageNav } from "../NavButton.jsx";
import Breadcrumbs from "../ui/Breadcrumbs.jsx";
import { PageHero, PageShell } from "../grubbid/GrubbidPrimitives.jsx";
import { LEGAL_CONTACT, LEGAL_EFFECTIVE_DATE } from "../../content/legal.js";
import StickyPageHeader from "../StickyPageHeader.jsx";
import BottomNav from "../BottomNav.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

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

const EMAIL_PATTERN = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

function renderParagraphWithMailto(paragraph) {
  const parts = String(paragraph || "").split(EMAIL_PATTERN);
  return parts.map((part, index) => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
      return (
        <a key={`${part}-${index}`} href={`mailto:${part}`} style={{ color: "var(--gb-color-accent)", fontWeight: 700 }}>
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function LegalDocumentPage({ document, eyebrow }) {
  const { t } = useLanguage();
  return (
    <>
    <StickyPageHeader />
    <PageShell width="reading">
      <PageNav back />
      <Breadcrumbs
        items={[
          { label: t("legal.discovery", "Discovery"), to: "/" },
          { label: document.title },
        ]}
      />

      <PageHero
        eyebrow={eyebrow}
        title={document.title}
        description={`${document.description} ${t("legal.effectiveDate", "Effective Date:")} ${LEGAL_EFFECTIVE_DATE}.`}
      />

      <div style={{ maxWidth: 760 }}>
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 style={headingStyle}>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.heading}-${index}`} style={paragraphStyle}>
                {renderParagraphWithMailto(paragraph)}
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2 style={headingStyle}>{t("legal.legalEntity", "Legal entity")}</h2>
          <p style={paragraphStyle}>
            {t("legal.operatedBy", "Menuply is operated by {company}.").replace("{company}", LEGAL_CONTACT.company)}
          </p>
        </section>
      </div>
    </PageShell>
    <BottomNav />
    </>
  );
}
