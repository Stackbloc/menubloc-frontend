import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { PageNav } from "../components/NavButton.jsx";
import Breadcrumbs from "../components/ui/Breadcrumbs.jsx";
import { PageHero, PageShell } from "../components/grubbid/GrubbidPrimitives.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";

const paragraphStyle = {
  margin: "0 0 18px",
  color: "var(--gb-color-ink-soft)",
  fontSize: "15px",
  lineHeight: 1.8,
};

const statementStyle = {
  ...paragraphStyle,
  margin: "0 0 8px",
  color: "var(--gb-color-ink-strong)",
  fontWeight: 700,
};

export default function AboutMenuply() {
  const { t } = useLanguage();
  const pageTitle = t("about.title", "About Menuply");

  return (
    <>
    <StickyPageHeader title={pageTitle} />
    <PageShell width="reading">
      <PageNav back />
      <Breadcrumbs
        items={[
          { label: t("nav.discovery", "Discovery"), to: "/" },
          { label: t("about.breadcrumb", "About") },
        ]}
      />

      <PageHero
        title={pageTitle}
        description={t(
          "about.hero",
          "Food intelligence built to make restaurant choices clearer, not more judgmental."
        )}
      />

      <div style={{ maxWidth: 720 }}>

        <p style={{ ...paragraphStyle, fontSize: "17px", fontWeight: 700, color: "var(--gb-color-ink-strong)", marginBottom: 12 }}>
          {t("about.intro", "Menuply — we know, the name is a little different. But we are building a different kind of restaurant platform.")}
        </p>

        <p style={paragraphStyle}>
          {t("about.body1", "The name comes from a simple idea: menus become more powerful when they work together for the common good. Menuply brings dining options together into one connected experience.")}
        </p>

        <p style={paragraphStyle}>
          {t("about.body2", "When diners visit Menuply, our goal is to place thousands of dining options at their fingertips while providing better information so decisions are easier, faster, and more informed.")}
        </p>

        <p style={{
          ...statementStyle,
          fontSize: "18px",
          fontStyle: "italic",
          color: "var(--gb-color-ink-strong)",
          marginBottom: 32,
          paddingLeft: 16,
          borderLeft: "3px solid var(--gb-color-ink-soft, #9ca3af)",
        }}>
          {t("about.tagline", "Menuply — One Menu. Multiplied by Thousands.")}
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--gb-color-border, #e5e7eb)", margin: "0 0 28px" }} />

        <p style={paragraphStyle}>
          {t("about.body3", "Menuply is a food intelligence platform built to help people better understand what they eat without telling them what they should or shouldn't eat.")}
        </p>

        <p style={paragraphStyle}>
          {t("about.body4", "At its core, Menuply brings clarity to restaurant menus by translating food into practical nutrition insight so you can compare options with confidence.")}
        </p>

        <p style={{ ...statementStyle, fontSize: "17px", marginBottom: 22 }}>
          {t("about.body5", "When people have better information, they make better decisions over time.")}
        </p>

        <p style={paragraphStyle}>
          {t("about.body6", "If you want to indulge, enjoy it. If you want to optimize your nutrition, do that too. Menuply exists to make food choices more transparent, more informed, and more aligned with how you want to live.")}
        </p>

        <p style={{ ...statementStyle, marginTop: 28 }}>{t("about.closer1", "Enjoy your food.")}</p>
        <p style={statementStyle}>{t("about.closer2", "Understand your food.")}</p>
        <p style={statementStyle}>{t("about.closer3", "That's Menuply.")}</p>
      </div>
    </PageShell>
    <BottomNav />
    </>
  );
}
