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
const LINK_PATTERN = /\[([^\]]+)\]\((\/[^)]+)\)/g;

function renderParagraphWithMailto(paragraph) {
  const str = String(paragraph || "");
  const segments = [];
  let last = 0;
  let m;
  LINK_PATTERN.lastIndex = 0;
  while ((m = LINK_PATTERN.exec(str)) !== null) {
    if (m.index > last) segments.push({ type: "text", content: str.slice(last, m.index) });
    segments.push({ type: "link", text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < str.length) segments.push({ type: "text", content: str.slice(last) });

  return segments.flatMap((seg, i) => {
    if (seg.type === "link") {
      return [
        <a key={`link-${i}`} href={seg.href} style={{ color: "var(--gb-color-accent)", fontWeight: 700 }}>
          {seg.text}
        </a>,
      ];
    }
    return seg.content.split(EMAIL_PATTERN).map((part, j) => {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
        return (
          <a key={`email-${i}-${j}`} href={`mailto:${part}`} style={{ color: "var(--gb-color-accent)", fontWeight: 700 }}>
            {part}
          </a>
        );
      }
      return <React.Fragment key={`text-${i}-${j}`}>{part}</React.Fragment>;
    });
  });
}

export default function LegalDocumentPage({ document, eyebrow, titleKey }) {
  const { t } = useLanguage();
  const localizedTitle = titleKey ? t(titleKey, document.title) : document.title;
  return (
    <>
    <StickyPageHeader />
    <PageShell width="reading">
      <PageNav back />
      <Breadcrumbs
        items={[
          { label: t("legal.discovery", "Discovery"), to: "/" },
          { label: localizedTitle },
        ]}
      />

      <PageHero
        eyebrow={eyebrow}
        title={localizedTitle}
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
            {section.items && (
              <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
                {section.items.map((item, index) => (
                  <li key={`${section.heading}-item-${index}`} style={{ ...paragraphStyle, margin: "0 0 6px" }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
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
