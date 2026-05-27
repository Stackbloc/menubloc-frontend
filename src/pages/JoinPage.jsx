import { Link } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";

const RESTAURANT_FEATURES = [
  "A hosted restaurant profile and searchable menu page",
  "Online ordering capabilities",
  "Dynamic QR ordering access for doors, tables, printed menus, and social media",
  "Beautifully presented, customizable digital menus with unique menu item insights",
  "Integrated deals and promotions",
  "Direct customer engagement and customer relationship tools",
  "Lower-cost ordering infrastructure designed to allow restaurants to reduce prices without reducing margins",
  "The ability to promote your restaurant directly to existing customers while establishing your restaurant’s presence in your local Menuply network",
];

const GROWTH_STEPS = [
  "Restaurants upload menus and launch their Menuply profiles",
  "Restaurants share Menuply QR ordering access with customers",
  "Local menu discovery networks strengthen as more restaurants and diners join the platform",
];

export default function JoinPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <BrandLockup
          subtitle="for Restaurants"
          wrapperStyle={{ alignItems: "flex-start", marginBottom: 4 }}
          subtitleStyle={{ textAlign: "left", width: "100%", paddingLeft: 6 }}
          logoProps={{
            width: 160,
            height: 100,
            radius: 22,
            pageColor: "#f9f9f7",
            imageStyle: { filter: "brightness(0)" },
          }}
        />

        <h1 style={styles.heading}>Introducing Menuply</h1>

        <div style={styles.card}>
          <p style={styles.body}>
            Menuply is a restaurant-first ordering and discovery platform built around a simple idea: the
            current high-commission third-party delivery platform model is unsustainable and increasingly
            drives higher prices for both restaurants and diners.
          </p>
          <p style={styles.body}>
            Menuply is a lower-cost, restaurant self-service ecosystem designed to reduce the inflated
            costs of transacting business online. Our goal is simple: reduce the restaurant&rsquo;s costs
            of doing business so those savings can ultimately flow through to diners through better
            pricing, stronger value, and more direct customer relationships.
          </p>
          <p style={{ ...styles.body, marginBottom: 0 }}>
            For diners, Menuply is free to use and represents a different approach to food ordering and
            restaurant discovery &mdash; one centered around better value, direct restaurant
            relationships, beautifully presented digital menus with unique menu item insights, and lower
            platform-driven price inflation.
          </p>
        </div>

        <div style={styles.card}>
          <p style={styles.body}>
            Although Menuply is still expanding nationally, restaurants across the country can sign up and
            immediately begin using the platform&rsquo;s tools to promote their business, connect with
            customers, and accept direct online orders. Every restaurant that joins Menuply &mdash;
            whether on a paid or free subscription &mdash; strengthens the network, expands local menu
            visibility, and becomes part of a growing restaurant-powered ecosystem.
          </p>

          <p style={styles.sectionLabel}>When you join Menuply, your restaurant receives:</p>
          <ul style={styles.featureList}>
            {RESTAURANT_FEATURES.map((f) => (
              <li key={f} style={styles.featureItem}>
                <span style={styles.bullet} />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <p style={{ ...styles.body, marginBottom: 0, marginTop: 16 }}>
            Every paid restaurant receives Menuply QR ordering materials so customers can instantly
            access your menu and order directly from their phones.
          </p>
        </div>

        <div style={styles.card}>
          <p style={styles.sectionLabel}>How Menuply Grows</p>
          <ol style={styles.stepList}>
            {GROWTH_STEPS.map((step, i) => (
              <li key={i} style={styles.stepItem}>
                <span style={styles.stepNumber}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p style={{ ...styles.body, marginTop: 16, marginBottom: 0 }}>
            Every restaurant that uploads its menu strengthens the local network by improving menu
            coverage, cuisine discovery, and restaurant visibility in that area.
          </p>
        </div>

        <div style={styles.card}>
          <p style={styles.body}>
            We believe restaurants must deliver value to diners in order to create a healthier and more
            sustainable long-term ecosystem. Lower transaction costs create opportunities for restaurants
            to offer better pricing, stronger value, and more direct customer relationships without
            sacrificing already-thin margins.
          </p>
          <p style={{ ...styles.body, marginBottom: 0 }}>
            No longer should restaurant owners simply sit by and watch restaurant and diner prices
            continue spiraling upward under the weight of excessive commissions and transaction costs.
            Menuply was built to offer a more sustainable alternative centered around lower costs, direct
            relationships, and better long-term value for both restaurants and diners.
          </p>
        </div>

        <div style={styles.pricingCard}>
          <p style={styles.pricingEyebrow}>Founder&rsquo;s Plan — Limited Time</p>
          <p style={styles.body}>
            As Menuply continues rolling out nationally, we are offering a special Founder&rsquo;s Plan
            for a limited time. Restaurants now have an opportunity to help build a lower-cost,
            restaurant-first ecosystem designed around better pricing, stronger customer relationships,
            and more sustainable long-term economics for both restaurants and diners.
          </p>
          <p style={{ ...styles.body, marginBottom: 20 }}>
            Join Menuply today and begin building a more direct, lower-cost relationship with your
            customers.
          </p>
          <p style={styles.pricingLine}>Plans start at $299 annually or $49 monthly.</p>

          <div style={styles.ctaRow}>
            <Link to="/restaurant/signup" style={styles.ctaPrimary}>
              Restaurant Signup
            </Link>
            <a href="https://menuply.com/account/signup" style={styles.ctaSecondary}>
              Diner Signup
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f9f9f7 0%, #eef5f2 100%)",
    padding: "40px 20px 80px",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
    color: "#101828",
  },
  shell: {
    maxWidth: 660,
    margin: "0 auto",
  },
  heading: {
    fontSize: 32,
    fontWeight: 800,
    color: "#1F4E3D",
    marginTop: 28,
    marginBottom: 24,
    letterSpacing: "-0.01em",
  },
  card: {
    background: "#fff",
    border: "1px solid #e4e7ec",
    borderRadius: 20,
    padding: "24px 28px",
    marginBottom: 18,
  },
  pricingCard: {
    background: "#1F4E3D",
    borderRadius: 20,
    padding: "28px 28px 32px",
    marginBottom: 18,
    color: "#fff",
  },
  pricingEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 14,
    marginTop: 0,
  },
  pricingLine: {
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 24,
    marginTop: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#374151",
    margin: "0 0 14px",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1F4E3D",
    marginBottom: 14,
    marginTop: 0,
  },
  featureList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#374151",
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#1F4E3D",
    flexShrink: 0,
    marginTop: 6,
  },
  stepList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  stepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#374151",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#eef5f2",
    color: "#1F4E3D",
    fontWeight: 700,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ctaRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  ctaPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    padding: "0 28px",
    borderRadius: 16,
    background: "#fff",
    color: "#1F4E3D",
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
  ctaSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    padding: "0 28px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.3)",
    cursor: "pointer",
    flexShrink: 0,
  },
};
