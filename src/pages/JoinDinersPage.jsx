import { BrandLockup } from "../components/BrandLogo.jsx";

const DISCOVER_ITEMS = [
  "Restaurants",
  "Dishes",
  "Deals",
  "Cuisines",
  "Local food experiences",
];

const FEATURES = [
  "Beautiful digital restaurant menus",
  "Unique menu item insights",
  "Restaurant deals and promotions",
  "QR menu and ordering access",
  "Direct restaurant ordering",
  "Easier restaurant and dish discovery",
  "Free diner accounts",
];

const DINER_SIGNUP_URL = "https://menuply.com/account/signup";

export default function JoinDinersPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <BrandLockup
          subtitle="for Diners"
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
            Menuply is a smarter way to discover restaurants, explore menus, and order food.
          </p>
          <p style={{ ...styles.body, marginBottom: 0 }}>
            Browse beautifully presented digital menus, discover unique menu item insights, and connect
            directly with restaurants through a platform designed around better value, better discovery,
            and lower transaction costs.
          </p>
        </div>

        <div style={styles.card}>
          <p style={styles.sectionLabel}>Menuply helps diners discover:</p>
          <ul style={styles.featureList}>
            {DISCOVER_ITEMS.map((item) => (
              <li key={item} style={styles.featureItem}>
                <span style={styles.bullet} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p style={{ ...styles.body, marginTop: 16, marginBottom: 0 }}>
            All in one growing restaurant-powered discovery network.
          </p>
        </div>

        <div style={styles.card}>
          <p style={styles.body}>
            Unlike traditional delivery marketplaces that often drive higher prices through excessive
            commissions and fees, Menuply is built around a lower-cost model designed to support better
            long-term value for both restaurants and diners.
          </p>

          <p style={styles.sectionLabel}>Features include:</p>
          <ul style={styles.featureList}>
            {FEATURES.map((f) => (
              <li key={f} style={styles.featureItem}>
                <span style={styles.bullet} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.card}>
          <p style={styles.body}>
            Menuply is currently expanding market-by-market across the country. Every restaurant and
            diner that joins helps strengthen the network and expand local restaurant discovery.
          </p>
          <p style={styles.body}>
            By creating an account now, you become part of the early growth of a new restaurant-powered
            ecosystem focused on better value, better restaurant relationships, and smarter food
            discovery.
          </p>
          <p style={{ ...styles.body, marginBottom: 0 }}>
            As more restaurants come online in your area, Menuply becomes increasingly useful and
            personalized. We will notify you as restaurant participation grows in your market and new
            features become available.
          </p>
        </div>

        <div style={styles.ctaCard}>
          <p style={styles.ctaTagline}>
            Join the movement early and help shape a smarter future for restaurant discovery and online
            ordering.
          </p>
          <p style={styles.freeLabel}>Menuply is free for diners.</p>
          <p style={styles.ctaSubtext}>Create your free account today.</p>
          <a href={DINER_SIGNUP_URL} style={styles.ctaButton}>
            Diner Signup
          </a>
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
  ctaCard: {
    background: "#1F4E3D",
    borderRadius: 20,
    padding: "28px 28px 32px",
    marginBottom: 18,
    color: "#fff",
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
  ctaTagline: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.85)",
    margin: "0 0 20px",
  },
  freeLabel: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 6px",
  },
  ctaSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    margin: "0 0 22px",
  },
  ctaButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    padding: "0 32px",
    borderRadius: 16,
    background: "#fff",
    color: "#1F4E3D",
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
  },
};
