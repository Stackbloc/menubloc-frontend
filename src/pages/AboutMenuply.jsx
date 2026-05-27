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

const listStyle = {
  ...paragraphStyle,
  paddingLeft: 22,
  marginBottom: 22,
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

        {/* ── New platform intro ── */}
        <p style={{ ...paragraphStyle, fontSize: "17px", fontWeight: 700, color: "var(--gb-color-ink-strong)", marginBottom: 12 }}>
          {t(
            "about.intro",
            "Menuply — we know, the name is a little different. But we are building a different kind of restaurant platform."
          )}
        </p>

        <p style={paragraphStyle}>
          The name comes from a simple idea: menus become more powerful when they work together for
          the common good. Instead of forcing diners to jump from app to app, menu to menu, or
          website to website, Menuply brings dining options together into one connected experience.
        </p>

        <p style={paragraphStyle}>
          When diners visit Menuply, our goal is to place thousands of dining options at their
          fingertips while providing the best available information to help make dining decisions
          easier, faster, and more informed.
        </p>

        <p style={{ ...paragraphStyle, marginBottom: 6 }}>
          That is why we say:
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
          &ldquo;Menuply — One Menu. Multiplied by Thousands.&rdquo;
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--gb-color-border, #e5e7eb)", margin: "0 0 28px" }} />

        <p style={paragraphStyle}>
          Menuply is a food intelligence platform built to help people better understand what they
          eat without telling them what they should or shouldn&apos;t eat.
        </p>

        <p style={paragraphStyle}>
          At its core, Menuply brings clarity to restaurant menus by translating food into meaningful
          nutritional insight. Calories, protein, sodium, sugar, and more are surfaced in a way
          that helps you see the bigger picture behind your choices. Whether you&apos;re browsing for
          something high-protein, low-sodium, indulgent, or just satisfying, Menuply helps you make
          sense of what&apos;s in front of you.
        </p>

        <p style={{ ...statementStyle, marginTop: 28 }}>But here&apos;s what we are not:</p>
        <p style={statementStyle}>We are not judgmental.</p>
        <p style={statementStyle}>We are not food police.</p>
        <p style={{ ...statementStyle, marginBottom: 22 }}>We are not diet fanatics.</p>

        <p style={paragraphStyle}>
          Menuply does not tell you to avoid chocolate cake. It also doesn&apos;t tell you to only eat
          steamed spinach. Food is personal. Food is cultural. Food is enjoyment.
        </p>

        <p style={paragraphStyle}>
          Instead, we believe something simpler and more powerful:
        </p>

        <p style={{ ...statementStyle, fontSize: "17px", marginBottom: 22 }}>
          When people have better information, they make better decisions over time.
        </p>

        <p style={paragraphStyle}>That&apos;s the role Menuply plays.</p>

        <p style={paragraphStyle}>
          If you want to indulge, you should enjoy it. If you want to optimize your nutrition, you
          should be able to do that too. Most people live somewhere in between and that&apos;s exactly
          where Menuply is most useful.
        </p>

        <p style={paragraphStyle}>
          We give you the intelligence to understand how different meals may impact your body:
        </p>

        <ul style={listStyle}>
          <li>How filling something might be</li>
          <li>How it may affect energy levels</li>
          <li>Whether it&apos;s high in sodium or sugar</li>
          <li>How it compares to similar options</li>
        </ul>

        <p style={paragraphStyle}>From there, the decision is yours.</p>

        <p style={statementStyle}>No guilt.</p>
        <p style={statementStyle}>No pressure.</p>
        <p style={{ ...statementStyle, marginBottom: 22 }}>No extremes.</p>

        <p style={paragraphStyle}>
          Just better information so you can make smarter choices across days, weeks, and years,
          not just a single meal.
        </p>

        <p style={paragraphStyle}>
          Menuply exists to make food choices more transparent, more informed, and ultimately more
          aligned with how you want to live.
        </p>

        <p style={{ ...statementStyle, marginTop: 28 }}>Enjoy your food.</p>
        <p style={statementStyle}>Understand your food.</p>
        <p style={statementStyle}>That&apos;s Menuply.</p>
      </div>
    </PageShell>
    <BottomNav />
    </>
  );
}
