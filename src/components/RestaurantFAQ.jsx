import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

export const FAQ_DEFS = [
  {
    questionKey: "onboarding.faq.q1",
    answerBlocks: [
      { type: "paragraph", key: "onboarding.faq.q1.a1" },
      { type: "paragraph", key: "onboarding.faq.q1.a2" },
      { type: "paragraph", key: "onboarding.faq.q1.a3" },
      { type: "paragraph", key: "onboarding.faq.q1.a4" },
    ],
  },
  {
    questionKey: "onboarding.faq.q2",
    answerBlocks: [
      { type: "paragraph", key: "onboarding.faq.q2.a1" },
      { type: "paragraph", key: "onboarding.faq.q2.a2" },
      { type: "paragraph", key: "onboarding.faq.q2.a3" },
    ],
  },
  {
    questionKey: "onboarding.faq.q3",
    answerBlocks: [
      { type: "paragraph", key: "onboarding.faq.q3.a1" },
      { type: "paragraph", key: "onboarding.faq.q3.a2" },
      { type: "paragraph", key: "onboarding.faq.q3.a3" },
      { type: "paragraph", key: "onboarding.faq.q3.a4" },
      { type: "paragraph", key: "onboarding.faq.q3.a5" },
    ],
  },
  {
    questionKey: "onboarding.faq.q4",
    answerBlocks: [
      { type: "paragraph", key: "onboarding.faq.q4.a1" },
      { type: "paragraph", key: "onboarding.faq.q4.a2" },
    ],
  },
  {
    questionKey: "onboarding.faq.q5",
    answerBlocks: [
      { type: "paragraph", key: "onboarding.faq.q5.a1" },
      {
        type: "list",
        labelKey: "onboarding.faq.q5.l1",
        itemKeys: ["onboarding.faq.q5.l1.i1", "onboarding.faq.q5.l1.i2", "onboarding.faq.q5.l1.i3"],
      },
      { type: "paragraph", key: "onboarding.faq.q5.a2" },
      {
        type: "list",
        labelKey: "onboarding.faq.q5.l2",
        itemKeys: ["onboarding.faq.q5.l2.i1", "onboarding.faq.q5.l2.i2", "onboarding.faq.q5.l2.i3"],
      },
      { type: "paragraph", key: "onboarding.faq.q5.a3" },
    ],
  },
  {
    questionKey: "onboarding.faq.q6",
    answerBlocks: [
      { type: "paragraph", key: "onboarding.faq.q6.a1" },
      { type: "paragraph", key: "onboarding.faq.q6.a2" },
      { type: "paragraph", key: "onboarding.faq.q6.a3" },
    ],
  },
  {
    questionKey: "onboarding.faq.q7",
    answerBlocks: [
      { type: "paragraph", key: "onboarding.faq.q7.a1" },
      { type: "paragraph", key: "onboarding.faq.q7.a2" },
    ],
  },
];

function buildStyles(variant) {
  const dark = variant === "dark";
  const surface = dark ? "#121A14" : "#ffffff";
  const surfaceAlt = dark ? "#0F1712" : "#f8fbf9";
  const border = dark ? "rgba(61,217,52,0.16)" : "#d9e0ea";
  const borderAlt = dark ? "rgba(61,217,52,0.12)" : "#eaecf0";
  const text = dark ? "#F8F4EA" : "#101828";
  const subtext = dark ? "rgba(248,244,234,0.76)" : "#667085";
  const accent = "#1F4E3D";
  const chipBg = dark ? "rgba(61,217,52,0.10)" : "#f3f7f5";
  const chipBorder = dark ? "rgba(61,217,52,0.18)" : "#d9e8df";
  const toggleSurface = dark ? "#0B0F0C" : "#ffffff";

  return {
    section: {
      marginBottom: 22,
      borderRadius: 28,
      border: `1px solid ${border}`,
      background: surface,
      boxShadow: dark ? "0 18px 40px rgba(0, 0, 0, 0.24)" : "0 16px 36px rgba(15, 23, 32, 0.05)",
      padding: "24px 22px",
    },
    eyebrow: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      padding: "8px 12px",
      borderRadius: 999,
      background: chipBg,
      border: `1px solid ${chipBorder}`,
      color: dark ? "#3DD934" : accent,
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    title: {
      fontSize: "clamp(1.65rem, 3vw, 2.35rem)",
      lineHeight: 1.05,
      fontWeight: 900,
      letterSpacing: "-0.03em",
      color: text,
      marginBottom: 10,
      maxWidth: 760,
    },
    intro: {
      fontSize: 15,
      lineHeight: 1.65,
      color: subtext,
      maxWidth: 760,
      marginBottom: 18,
    },
    toggleLabel: {
      fontSize: 14,
      lineHeight: 1.6,
      color: dark ? "#A7F3D0" : accent,
      fontWeight: 800,
    },
    toggleRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    toggleCopy: {
      flex: 1,
      minWidth: 0,
    },
    toggleIcon: (expanded) => ({
      flexShrink: 0,
      width: 36,
      height: 36,
      borderRadius: "50%",
      border: expanded ? `1px solid ${chipBorder}` : `1px solid ${dark ? "rgba(248,244,234,0.18)" : "#d0d5dd"}`,
      background: expanded ? chipBg : toggleSurface,
      color: dark ? "#3DD934" : accent,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      fontWeight: 700,
      lineHeight: 1,
    }),
    list: {
      display: "grid",
      gap: 12,
    },
    item: (expanded) => ({
      borderRadius: 18,
      border: `1px solid ${expanded ? chipBorder : borderAlt}`,
      background: expanded ? surfaceAlt : surface,
      overflow: "hidden",
    }),
    itemButton: {
      width: "100%",
      border: "none",
      background: "transparent",
      padding: "18px 18px 16px",
      textAlign: "left",
      cursor: "pointer",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 14,
      color: text,
      fontFamily: "inherit",
    },
    questionWrap: {
      flex: 1,
    },
    question: {
      fontSize: 16,
      lineHeight: 1.5,
      fontWeight: 800,
      margin: 0,
    },
    itemToggle: (expanded) => ({
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: "50%",
      border: expanded ? `1px solid ${chipBorder}` : `1px solid ${dark ? "rgba(248,244,234,0.18)" : "#d0d5dd"}`,
      background: expanded ? chipBg : toggleSurface,
      color: dark ? "#3DD934" : accent,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      fontWeight: 700,
      lineHeight: 1,
    }),
    answer: {
      padding: "0 18px 18px",
      display: "grid",
      gap: 12,
    },
    answerParagraph: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.7,
      color: subtext,
    },
    answerListLabel: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.7,
      color: subtext,
      fontWeight: 700,
    },
    answerList: {
      margin: "0 0 0 18px",
      padding: 0,
      display: "grid",
      gap: 4,
    },
    answerListItem: {
      fontSize: 14,
      lineHeight: 1.7,
      color: subtext,
    },
  };
}

export function FaqAnswerBlocks({ blocks, t, styles }) {
  return blocks.map((block) => {
    if (block.type === "list") {
      return (
        <div key={block.labelKey}>
          <p style={styles.answerListLabel}>{t(block.labelKey)}</p>
          <ul style={styles.answerList}>
            {block.itemKeys.map((itemKey) => (
              <li key={itemKey} style={styles.answerListItem}>
                {t(itemKey)}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <p key={block.key} style={styles.answerParagraph}>
        {t(block.key)}
      </p>
    );
  });
}

export default function RestaurantFAQ({ instanceId = "restaurant-faq", variant = "light" }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(-1);
  const styles = buildStyles(variant);

  return (
    <section style={styles.section}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${instanceId}-list`}
        style={{ width: "100%", border: "none", background: "transparent", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: styles.title.color }}
      >
        <div style={styles.toggleRow}>
          <div style={styles.toggleCopy}>
            <div style={styles.eyebrow}>{t("onboarding.faq.eyebrow", "Restaurant FAQ")}</div>
            <div style={styles.title}>{t("onboarding.faq.title", "Questions about Menuply?")}</div>
            <div style={styles.intro}>
              {t(
                "onboarding.faq.intro",
                "Practical answers about cost, growth expectations, and fit before moving deeper into onboarding."
              )}
            </div>
            <div style={styles.toggleLabel}>
              {open ? t("onboarding.faq.hide", "Hide FAQ") : t("onboarding.faq.view", "View FAQ")}
            </div>
          </div>
          <span aria-hidden="true" style={styles.toggleIcon(open)}>
            {open ? "−" : "+"}
          </span>
        </div>
      </button>

      {open ? (
        <div id={`${instanceId}-list`} style={styles.list}>
          {FAQ_DEFS.map((item, index) => {
            const expanded = expandedIndex === index;
            const panelId = `${instanceId}-panel-${index}`;
            const question = t(item.questionKey);
            return (
              <article key={item.questionKey} style={styles.item(expanded)}>
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expanded ? -1 : index)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  style={styles.itemButton}
                >
                  <div style={styles.questionWrap}>
                    <p style={styles.question}>{question}</p>
                  </div>
                  <span aria-hidden="true" style={styles.itemToggle(expanded)}>
                    {expanded ? "−" : "+"}
                  </span>
                </button>

                {expanded ? (
                  <div id={panelId} style={styles.answer}>
                    <FaqAnswerBlocks blocks={item.answerBlocks} t={t} styles={styles} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
