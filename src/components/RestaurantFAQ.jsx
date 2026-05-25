import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "Why does Menuply charge a subscription fee?",
    answer: [
      "Menuply charges a subscription fee because restaurants need more than just a listing. The platform provides restaurant profile pages, menu presentation, ordering tools, deal promotion, QR code support, customer discovery features, and self-service management tools.",
      "At the same time, Menuply was intentionally designed to remain affordable and accessible for independent restaurants and local businesses. Restaurants that want to establish a presence on the platform at no cost can choose the Verified plan, which is 100% free and includes a public restaurant profile, a single menu with unlimited menu items, and QR code support.",
      "Many restaurants already pay more for website hosting alone. Menuply is designed to give restaurants a practical online commerce presence at a lower overall cost than relying only on traditional delivery marketplaces or expensive custom website solutions.",
      "Restaurants also play an important role in growing Menuply's reach and their own by using door QR codes, sharing their Menuply page on social media, linking to it from printed menus, and encouraging regular customers to order directly through Menuply.",
    ],
  },
  {
    question: "Menuply is not as well known as the major platforms. How will it generate business for my restaurant?",
    answer: [
      "Menuply is new and growing, so restaurants should not expect the same instant traffic volume as the largest delivery marketplaces on day one.",
      "The value is that Menuply helps restaurants build a lower-cost direct ordering and discovery channel over time. Restaurants can drive traffic through QR codes, social media, printed menus, customer referrals, deals, and their own existing customer base.",
      "As more restaurants and diners use the platform, Menuply's discovery value increases. Restaurants that join early can help shape that local network while benefiting from a lower-cost structure.",
    ],
  },
  {
    question: "My restaurant sells indulgent food, comfort food, or items that are not considered healthy. Why would I want to be on Menuply?",
    answer: [
      "Menuply is not designed only for healthy restaurants. It is designed to help diners better understand what they are ordering, whether that is a grilled salmon bowl, a plate of wings, a loaded burger, or a slice of cheesecake.",
      "Many diners actively search for indulgent foods, comfort foods, desserts, wings, barbecue, burgers, and other craveable meals. Menuply helps restaurants showcase those items more effectively through stronger menu presentation, better organization, improved discovery tools, and visually engaging menu experiences.",
      "The goal is not to judge restaurant menus. The goal is to help diners make informed decisions and help restaurants market and sell their food more effectively.",
      "Menuply also recognizes that restaurants have different identities and customer bases. A sports bar, steakhouse, dessert shop, seafood restaurant, and vegan cafe should not all look or feel the same. The platform should support that diversity through menu presentation styles, promotional tools, and restaurant branding options.",
      "Menuply is a restaurant commerce and discovery platform, not a diet app.",
    ],
  },
];

const styles = {
  section: {
    marginBottom: 22,
    borderRadius: 28,
    border: "1px solid #d9e0ea",
    background: "#ffffff",
    boxShadow: "0 16px 36px rgba(15, 23, 32, 0.05)",
    padding: "24px 22px",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    padding: "8px 12px",
    borderRadius: 999,
    background: "#f3f7f5",
    border: "1px solid #d9e8df",
    color: "#1F4E3D",
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
    color: "#101828",
    marginBottom: 10,
    maxWidth: 760,
  },
  intro: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "#667085",
    maxWidth: 760,
    marginBottom: 18,
  },
  toggleLabel: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#1F4E3D",
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
    border: expanded ? "1px solid #cfe0d8" : "1px solid #d0d5dd",
    background: expanded ? "#eef6f1" : "#ffffff",
    color: "#1F4E3D",
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
    border: expanded ? "1px solid #cfe0d8" : "1px solid #eaecf0",
    background: expanded ? "#f8fbf9" : "#ffffff",
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
    color: "#101828",
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
    border: expanded ? "1px solid #cfe0d8" : "1px solid #d0d5dd",
    background: expanded ? "#eef6f1" : "#ffffff",
    color: "#1F4E3D",
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
    color: "#475467",
  },
};

export default function RestaurantFAQ({ instanceId = "restaurant-faq" }) {
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(-1);

  return (
    <section style={styles.section}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${instanceId}-list`}
        style={{ width: "100%", border: "none", background: "transparent", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "#101828" }}
      >
        <div style={styles.toggleRow}>
          <div style={styles.toggleCopy}>
            <div style={styles.eyebrow}>Restaurant FAQ</div>
            <div style={styles.title}>Questions about Menuply?</div>
            <div style={styles.intro}>
              Practical answers about cost, growth expectations, and fit before moving deeper into onboarding.
            </div>
            <div style={styles.toggleLabel}>{open ? "Hide FAQ" : "View FAQ"}</div>
          </div>
          <span aria-hidden="true" style={styles.toggleIcon(open)}>
            {open ? "−" : "+"}
          </span>
        </div>
      </button>

      {open ? (
        <div id={`${instanceId}-list`} style={styles.list}>
          {FAQ_ITEMS.map((item, index) => {
            const expanded = expandedIndex === index;
            const panelId = `${instanceId}-panel-${index}`;
            return (
              <article key={item.question} style={styles.item(expanded)}>
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expanded ? -1 : index)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  style={styles.itemButton}
                >
                  <div style={styles.questionWrap}>
                    <p style={styles.question}>{item.question}</p>
                  </div>
                  <span aria-hidden="true" style={styles.itemToggle(expanded)}>
                    {expanded ? "−" : "+"}
                  </span>
                </button>

                {expanded ? (
                  <div id={panelId} style={styles.answer}>
                    {item.answer.map((paragraph) => (
                      <p key={paragraph} style={styles.answerParagraph}>
                        {paragraph}
                      </p>
                    ))}
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
