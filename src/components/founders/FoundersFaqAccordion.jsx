import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

// FAQ items tailored to the founders / national-rollout audience.
// Distinct from RestaurantFAQ.jsx which serves the existing onboarding flow.
const FOUNDER_FAQ = [
  {
    question: "Why does Menuply charge a subscription fee?",
    answer: [
      "Menuply provides restaurant profile pages, full menu presentation, ordering tools, deal promotion, QR code support, and customer discovery — all in one self-service platform.",
      "Unlike traditional delivery marketplaces that take 15–30% per order, Menuply charges a flat subscription so your costs are predictable regardless of how many orders you process. Restaurants that want a free presence can start with the Verified plan at $0.",
    ],
  },
  {
    question: "How does Menuply differ from major delivery platforms?",
    answer: [
      "Delivery marketplaces earn more as your order volume grows — their business model depends on a percentage of every transaction. Menuply charges a flat subscription instead, so restaurants keep more of every dollar as they grow.",
      "Menuply is also built as a discovery and direct-ordering platform rather than a third-party logistics layer. Restaurants build their own customer relationships on the platform rather than renting attention from a marketplace.",
    ],
  },
  {
    question: "What does a paid plan include?",
    answer: [
      "Paid plans include unlimited menus, scheduled and timed menu display, menu item photos, ingredient-rich searchable content, customer follow and notifications, deals and promotions, marketplace ordering (pickup and delivery), and billboard placement in search results.",
      "The Founder plan locks in the current price for 24 months — designed for restaurants joining the network early who want price stability as the platform grows.",
    ],
  },
  {
    question: "How do QR ordering materials work?",
    answer: [
      "Menuply generates a dynamic QR code linked to your restaurant's profile and menu. You can print it on table tents, door signs, receipts, or any physical materials.",
      "When diners scan it, they land directly on your Menuply menu page and can browse, follow your restaurant, and place orders. The QR code stays the same even if your menu changes.",
    ],
  },
  {
    question: "Can I use my own delivery drivers?",
    answer: [
      "Yes. Menuply supports direct online ordering with your own fulfillment — you are not required to use any third-party delivery fleet.",
      { label: "Restaurants can use:", items: ["Pickup", "In-house delivery", "Third-party delivery providers"] },
      "Importantly, restaurants can also use traditional third-party delivery platforms strictly for delivery fulfillment while still accepting orders directly through Menuply. This allows restaurants to avoid the high third-party marketplace sales commissions typically associated with traditional delivery apps.",
      { label: "Restaurants may choose to:", items: ["Absorb the delivery cost", "Partially subsidize it", "Pass the delivery fee directly to the diner"] },
      "This gives restaurants substantially more flexibility and control over pricing, margins, customer relationships, and fulfillment strategy.",
    ],
  },
  {
    question: "Does Menuply support direct online ordering?",
    answer: [
      "Yes. Diners can place orders directly through your Menuply page. Orders come to you without a per-order percentage taken out.",
      "You can accept pickup and delivery orders from your existing customers using Menuply as your online ordering channel — no separate website or third-party integration required.",
    ],
  },
  {
    question: "Why is Menuply focused on lower restaurant transaction costs?",
    answer: [
      "High transaction costs on delivery platforms have pushed many restaurants to raise menu prices to offset fees. This creates a structural problem: diners pay more, restaurants earn less per order, and the platform keeps the margin in between.",
      "Menuply is built around the idea that lower structural costs can unlock better long-term value for both restaurants and diners. When restaurants operate more efficiently, they have more room to offer competitive pricing, better deals, and stronger direct relationships with their customers.",
    ],
  },
];

const S = {
  list: { display: "grid", gap: 10, marginBottom: 28 },
  item: (expanded) => ({
    borderRadius: 16,
    border: expanded ? "1px solid #cfe0d8" : "1px solid #e4e7ec",
    background: expanded ? "#f8fbf9" : "#ffffff",
    overflow: "hidden",
  }),
  btn: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "16px 18px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    color: "#101828",
    fontFamily: "inherit",
  },
  question: {
    fontSize: 15,
    lineHeight: 1.5,
    fontWeight: 700,
    margin: 0,
    flex: 1,
  },
  toggle: (expanded) => ({
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: expanded ? "1px solid #cfe0d8" : "1px solid #d0d5dd",
    background: expanded ? "#eef6f1" : "#ffffff",
    color: "#1F4E3D",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
  }),
  answer: { padding: "0 18px 16px", display: "grid", gap: 10 },
  paragraph: { margin: 0, fontSize: 14, lineHeight: 1.75, color: "#475467" },
};

export default function FoundersFaqAccordion({ instanceId = "founders-faq" }) {
  const { t } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState(-1);

  return (
    <div style={S.list}>
      {FOUNDER_FAQ.map((item, index) => {
        const expanded = expandedIndex === index;
        return (
          <article key={item.question} style={S.item(expanded)}>
            <button
              type="button"
              id={`${instanceId}-btn-${index}`}
              aria-expanded={expanded}
              aria-controls={`${instanceId}-panel-${index}`}
              onClick={() => setExpandedIndex(expanded ? -1 : index)}
              style={S.btn}
            >
              <p style={S.question}>{item.question}</p>
              <span aria-hidden="true" style={S.toggle(expanded)}>
                {expanded ? "−" : "+"}
              </span>
            </button>
            {expanded ? (
              <div id={`${instanceId}-panel-${index}`} style={S.answer}>
                {item.answer.map((para, i) =>
                  typeof para === "object" ? (
                    <div key={i}>
                      <p style={{ ...S.paragraph, fontWeight: 600, marginBottom: 4 }}>{para.label}</p>
                      <ul style={{ margin: "0 0 0 18px", padding: 0, display: "grid", gap: 3 }}>
                        {para.items.map((li) => (
                          <li key={li} style={S.paragraph}>{li}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p key={i} style={S.paragraph}>{para}</p>
                  )
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
