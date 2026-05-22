/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantSignupEntry.jsx
 * File: RestaurantSignupEntry.jsx
 * Date: 2026-05-06
 * Purpose:
 *   Restaurant onboarding entry screen for selecting a Menuply
 *   restaurant plan before account creation.
 * ============================================================
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";

const ACCOUNT_ROUTE = "/restaurant/signup/account";

const PLAN_OPTIONS = [
  {
    code: "verified",
    name: "Verified",
    price: "$0",
    description: "A simple verified restaurant presence with public menu access on Menuply.",
    cta: "Continue with Verified",
    featured: false,
    features: [
      "Basic restaurant profile",
      "1 editable menu listing",
      "QR menu access for customers",
      "Menu visibility on Menuply",
    ],
  },
  {
    code: "pro_partner",
    name: "Pro Partner",
    price: "$49/month or $399/year",
    description:
      "For restaurants that want stronger customer pricing, direct ordering tools, and deeper customer engagement on a lower-cost platform.",
    cta: "Continue with Pro Partner",
    featured: true,
    features: [
      "Unlimited menus for time of day, events, seasonal menus, happy hour, and specials",
      "Advanced restaurant profile with logo, featured meal, and restaurant bio",
      "Billboard placement and functionality",
      "Shareable menus and dishes",
      "Follow functionality",
      "Deals and promotions",
      "Online ordering",
      "Built for lower-cost direct ordering operations",
    ],
  },
  {
    code: "performance_partner",
    name: "Performance Partner",
    price: "$0 upfront platform fee",
    description:
      "For restaurants that want full ordering, promotional capabilities, and launch support with no upfront platform fee.",
    cta: "Continue with Performance Partner",
    featured: false,
    features: [
      "Tablet included",
      "Full online ordering capabilities",
      "Deals and promotions",
      "Follow functionality",
      "Shareable menus and dishes",
      "Billboard functionality",
      "Cancel anytime",
    ],
  },
];

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
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6f6f3 0%, #eef5f2 100%)",
    padding: "28px 18px 72px",
    color: "#101828",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  shell: {
    maxWidth: 1120,
    margin: "0 auto",
  },
  hero: {
    border: "1px solid #d9e0ea",
    borderRadius: 32,
    background: "#ffffff",
    boxShadow: "0 18px 40px rgba(15, 23, 32, 0.06)",
    padding: "28px 24px 24px",
    marginBottom: 22,
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    padding: "8px 12px",
    borderRadius: 999,
    background: "#eef6f1",
    border: "1px solid #cfe0d8",
    color: "#1F4E3D",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: "clamp(2.2rem, 5vw, 4.25rem)",
    lineHeight: 0.95,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    marginBottom: 12,
    maxWidth: 720,
  },
  subheading: {
    fontSize: 17,
    lineHeight: 1.6,
    color: "#667085",
    maxWidth: 720,
    marginBottom: 22,
  },
  messageCard: {
    marginTop: 18,
    borderRadius: 18,
    border: "1px solid #d9e0ea",
    background: "#f8faf9",
    padding: "18px 18px 16px",
    maxWidth: 760,
    color: "#475467",
  },
  messageKicker: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#1F4E3D",
    marginBottom: 8,
  },
  messageSectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#101828",
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 1.65,
    marginBottom: 12,
  },
  messageCallout: {
    borderRadius: 14,
    border: "1px solid #cfe0d8",
    background: "#eef6f1",
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.65,
    color: "#1F4E3D",
  },
  faqSection: {
    marginBottom: 22,
    borderRadius: 28,
    border: "1px solid #d9e0ea",
    background: "#ffffff",
    boxShadow: "0 16px 36px rgba(15, 23, 32, 0.05)",
    padding: "24px 22px",
  },
  faqEyebrow: {
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
  faqTitle: {
    fontSize: "clamp(1.65rem, 3vw, 2.35rem)",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#101828",
    marginBottom: 10,
    maxWidth: 760,
  },
  faqIntro: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "#667085",
    maxWidth: 760,
    marginBottom: 18,
  },
  faqList: {
    display: "grid",
    gap: 12,
  },
  faqSectionToggle: (expanded) => ({
    width: "100%",
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    color: "#101828",
  }),
  faqSectionToggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  faqSectionToggleCopy: {
    flex: 1,
    minWidth: 0,
  },
  faqSectionToggleLabel: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#1F4E3D",
    fontWeight: 800,
  },
  faqSectionToggleIcon: (expanded) => ({
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
  faqItem: (expanded) => ({
    borderRadius: 18,
    border: expanded ? "1px solid #cfe0d8" : "1px solid #eaecf0",
    background: expanded ? "#f8fbf9" : "#ffffff",
    overflow: "hidden",
  }),
  faqButton: {
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
  faqQuestionWrap: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: 16,
    lineHeight: 1.5,
    fontWeight: 800,
    margin: 0,
  },
  faqToggle: (expanded) => ({
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
  faqAnswer: {
    padding: "0 18px 18px",
    display: "grid",
    gap: 12,
  },
  faqAnswerParagraph: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#475467",
  },
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  step: (active) => ({
    padding: "8px 14px",
    borderRadius: 999,
    background: active ? "#eef6f1" : "rgba(255,255,255,0.72)",
    color: active ? "#1F4E3D" : "#98a2b3",
    border: active ? "1px solid #cfe0d8" : "1px solid #d9e0ea",
    whiteSpace: "nowrap",
    fontSize: 12,
    fontWeight: 800,
  }),
  stepDivider: {
    flex: "0 0 10px",
    height: 1,
    background: "#d9e0ea",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },
  card: (featured) => ({
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    padding: "24px 22px 22px",
    border: featured ? "2px solid #1F4E3D" : "1px solid #eaecf0",
    background: featured
      ? "linear-gradient(135deg, #0f1720 0%, #1f4e3d 48%, #eef6f1 100%)"
      : "#ffffff",
    color: featured ? "#ffffff" : "#101828",
    boxShadow: featured
      ? "0 24px 60px rgba(15, 23, 32, 0.16)"
      : "0 12px 30px rgba(15, 23, 32, 0.04)",
    display: "flex",
    flexDirection: "column",
    minHeight: 360,
  }),
  badge: {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
    padding: "7px 12px",
    borderRadius: 999,
    background: "#eef6f1",
    color: "#1F4E3D",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  planName: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 18,
    opacity: 0.92,
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 18px",
    display: "grid",
    gap: 10,
  },
  featureItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 14,
    lineHeight: 1.5,
  },
  featureMark: (featured) => ({
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    background: featured ? "#ffffff" : "#1F4E3D",
    color: featured ? "#1F4E3D" : "#ffffff",
    marginTop: 1,
  }),
  button: (featured) => ({
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    border: featured ? "1px solid #1F4E3D" : "1px solid #d0d5dd",
    background: featured ? "#1F4E3D" : "#ffffff",
    color: featured ? "#ffffff" : "#101828",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "auto",
    boxShadow: featured ? "0 12px 24px rgba(31, 78, 61, 0.18)" : "none",
  }),
};

export default function RestaurantSignupEntry() {
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(-1);

  function handlePlanSelect(selectedPlan) {
    navigate(ACCOUNT_ROUTE, {
      state: {
        selected_plan: selectedPlan,
      },
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <BrandLockup
            subtitle="for Restaurants"
            wrapperStyle={{ alignItems: "flex-start", marginBottom: 18 }}
            subtitleStyle={{ textAlign: "left", width: "100%", paddingLeft: 6 }}
            logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
          />

          <div style={styles.eyebrow}>Restaurant Signup</div>
          <div style={styles.heading}>Built for Better Value</div>
          <div style={styles.subheading}>
            Lower platform costs can create better outcomes for restaurants and diners when those savings show up in pricing, deals, and direct engagement.
          </div>
          <div style={styles.messageCard}>
            <div style={styles.messageKicker}>Choose your plan first</div>
            <div style={styles.messageSectionTitle}>Why Menuply Exists</div>
            <div style={styles.messageText}>
              Many restaurants on higher-cost third-party platforms have had to raise menu prices just to absorb platform fees. That cycle strains restaurants and costs diners more than they should pay. Menuply was built to help break that cycle with a lean, self-service model.
            </div>
            <div style={styles.messageSectionTitle}>Our Partner Expectation</div>
            <div style={styles.messageText}>
              Restaurants always control their own pricing. Menuply is built for restaurants that use lower platform costs to create real diner value through better everyday pricing, meaningful deals, and more direct engagement.
            </div>
            <div style={styles.messageCallout}>
              <strong>Multipliers</strong> are restaurants aligned with that approach. They are the heart of the Menuply ecosystem, and restaurants that more closely reflect those principles may receive increased visibility opportunities within the platform.
            </div>
          </div>

          <div style={styles.steps}>
            <div style={styles.step(true)}>1. Choose plan</div>
            <div style={styles.stepDivider} />
            <div style={styles.step(false)}>2. Create account</div>
            <div style={styles.stepDivider} />
            <div style={styles.step(false)}>3. Finish onboarding</div>
          </div>
        </section>

        <section style={styles.faqSection}>
          <button
            type="button"
            onClick={() => setFaqOpen((current) => !current)}
            aria-expanded={faqOpen}
            aria-controls="restaurant-signup-faq-section"
            style={styles.faqSectionToggle(faqOpen)}
          >
            <div style={styles.faqSectionToggleRow}>
              <div style={styles.faqSectionToggleCopy}>
                <div style={styles.faqEyebrow}>Restaurant FAQ</div>
                <div style={styles.faqTitle}>Questions about Menuply?</div>
                <div style={styles.faqIntro}>
                  Practical answers about cost, growth expectations, and fit before moving deeper into onboarding.
                </div>
                <div style={styles.faqSectionToggleLabel}>
                  {faqOpen ? "Hide FAQ" : "View FAQ"}
                </div>
              </div>
              <span aria-hidden="true" style={styles.faqSectionToggleIcon(faqOpen)}>
                {faqOpen ? "\u2212" : "+"}
              </span>
            </div>
          </button>

          {faqOpen ? (
            <div id="restaurant-signup-faq-section" style={styles.faqList}>
              {FAQ_ITEMS.map((item, index) => {
                const expanded = expandedFaqIndex === index;
                const panelId = `restaurant-signup-faq-panel-${index}`;
                return (
                  <article key={item.question} style={styles.faqItem(expanded)}>
                    <button
                      type="button"
                      onClick={() => setExpandedFaqIndex(expanded ? -1 : index)}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      style={styles.faqButton}
                    >
                      <div style={styles.faqQuestionWrap}>
                        <p style={styles.faqQuestion}>{item.question}</p>
                      </div>
                      <span aria-hidden="true" style={styles.faqToggle(expanded)}>
                        {expanded ? "\u2212" : "+"}
                      </span>
                    </button>

                    {expanded ? (
                      <div id={panelId} style={styles.faqAnswer}>
                        {item.answer.map((paragraph) => (
                          <p key={paragraph} style={styles.faqAnswerParagraph}>
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

        <section style={{
          marginBottom: 22,
          borderRadius: 20,
          border: "1px solid #d9e0ea",
          background: "#f8faf9",
          padding: "20px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#101828", marginBottom: 4 }}>
              Do you have a food truck?
            </div>
            <div style={{ fontSize: 14, color: "#667085", lineHeight: 1.5 }}>
              Food trucks have their own sign-up path with scheduling and location tools.
            </div>
          </div>
          <Link
            to="/foodtruck/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 44,
              padding: "0 20px",
              borderRadius: 12,
              border: "1.5px solid #1F4E3D",
              background: "#ffffff",
              color: "#1F4E3D",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            🚚 Sign up as a Food Truck
          </Link>
        </section>

        <section style={styles.cardsGrid}>
          {PLAN_OPTIONS.map((plan) => (
            <article key={plan.code} style={styles.card(plan.featured)}>
              {plan.featured ? <div style={styles.badge}>Most Popular</div> : null}
              <div style={styles.planName}>{plan.name}</div>
              <div style={styles.price}>{plan.price}</div>
              <div style={styles.description}>{plan.description}</div>

              <ul style={styles.featureList}>
                {plan.features.map((feature) => (
                  <li key={feature} style={styles.featureItem}>
                    <span style={styles.featureMark(plan.featured)}>&#10003;</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                style={styles.button(plan.featured)}
                onClick={() => handlePlanSelect(plan.code)}
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
