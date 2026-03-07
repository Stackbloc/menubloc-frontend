// ============================================================
// Path: menubloc-frontend/src/pages/EasyMenuLanding.jsx
// File: EasyMenuLanding.jsx
// Date: 2026-03-06
// Purpose:
//   Marketing / onboarding landing page for easymenuupload.com.
//   HTML-first copy structure for better clarity, conversion,
//   and SEO-friendly page content rendered directly in JSX.
// ============================================================

import React from "react";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f9fc",
    color: "#0f1720",
    fontFamily: "Arial, Helvetica, sans-serif",
    lineHeight: 1.5,
  },

  wrap: {
    width: "min(1120px, calc(100% - 32px))",
    margin: "0 auto",
  },

  topbar: {
    padding: "16px 0",
    borderBottom: "1px solid #e4e9f0",
    background: "#ffffff",
  },

  topbarInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  logo: {
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: "-0.02em",
  },

  nav: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    fontSize: 14,
    fontWeight: 700,
  },

  navLink: {
    color: "#124ba3",
    textDecoration: "none",
  },

  hero: {
    padding: "56px 0 40px",
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.95fr",
    gap: 28,
    alignItems: "stretch",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e4e9f0",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
  },

  heroCopy: {
    padding: 34,
  },

  eyebrow: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#eef4ff",
    color: "#124ba3",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 14,
  },

  h1: {
    margin: "0 0 14px",
    fontSize: 44,
    lineHeight: 1.06,
    letterSpacing: "-0.03em",
  },

  subhead: {
    fontSize: 18,
    color: "#5b6675",
    maxWidth: 760,
    marginBottom: 20,
  },

  list: {
    margin: "0 0 24px",
    paddingLeft: 18,
  },

  listItem: {
    marginBottom: 8,
  },

  ctaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },

  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 15,
    border: "1px solid transparent",
    background: "#124ba3",
    color: "#ffffff",
    textDecoration: "none",
  },

  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 15,
    border: "1px solid #e4e9f0",
    background: "#ffffff",
    color: "#0f1720",
    textDecoration: "none",
  },

  heroNote: {
    fontSize: 14,
    color: "#5b6675",
  },

  heroSide: {
    padding: 24,
  },

  uploadBox: {
    border: "2px dashed #c9d7ee",
    borderRadius: 16,
    background: "#fbfdff",
    padding: "28px 18px",
    textAlign: "center",
  },

  uploadTitle: {
    margin: "0 0 8px",
    fontSize: 22,
  },

  uploadText: {
    margin: "0 0 18px",
    color: "#5b6675",
  },

  optionList: {
    display: "grid",
    gap: 10,
    marginTop: 18,
    textAlign: "left",
  },

  optionCard: {
    border: "1px solid #e4e9f0",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#ffffff",
  },

  section: {
    padding: "16px 0 12px",
  },

  h2: {
    fontSize: 32,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    margin: "0 0 10px",
  },

  sectionIntro: {
    color: "#5b6675",
    margin: "0 0 22px",
    maxWidth: 760,
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
  },

  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 18,
  },

  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
  },

  sectionCard: {
    background: "#ffffff",
    border: "1px solid #e4e9f0",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
    padding: 22,
  },

  stepNum: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef4ff",
    color: "#124ba3",
    fontWeight: 800,
    marginBottom: 12,
  },

  h3: {
    margin: "0 0 8px",
    fontSize: 20,
  },

  muted: {
    color: "#5b6675",
  },

  pricingFeatured: {
    position: "relative",
    border: "2px solid #124ba3",
  },

  planTag: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "#eef4ff",
    color: "#124ba3",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 800,
  },

  price: {
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    margin: "6px 0 8px",
  },

  priceSmall: {
    fontSize: 14,
    fontWeight: 700,
    color: "#5b6675",
  },

  exampleCard: {
    background: "#ffffff",
    border: "1px solid #e4e9f0",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
    padding: 24,
  },

  exampleHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
    flexWrap: "wrap",
  },

  exampleMeta: {
    color: "#5b6675",
    fontSize: 14,
  },

  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#f6f8fb",
    border: "1px solid #e4e9f0",
    fontSize: 12,
    fontWeight: 700,
    color: "#5b6675",
  },

  menuPreview: {
    display: "grid",
    gap: 10,
  },

  menuRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    border: "1px solid #e4e9f0",
    borderRadius: 12,
    background: "#ffffff",
  },

  ctaCard: {
    background: "#ffffff",
    border: "1px solid #e4e9f0",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
    padding: 30,
    textAlign: "center",
    margin: "28px 0 54px",
  },

  footerNote: {
    color: "#5b6675",
    fontSize: 13,
    textAlign: "center",
    paddingBottom: 30,
  },
};

function responsiveGrid(baseStyle) {
  if (typeof window === "undefined") return baseStyle;
  if (window.innerWidth <= 980) {
    return { ...baseStyle, gridTemplateColumns: "1fr" };
  }
  return baseStyle;
}

export default function EasyMenuLanding() {
  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <div style={{ ...styles.wrap, ...styles.topbarInner }}>
          <div style={styles.logo}>EasyMenuUpload</div>
          <nav style={styles.nav}>
            <a href="#how-it-works" style={styles.navLink}>How It Works</a>
            <a href="#pricing" style={styles.navLink}>Pricing</a>
            <a href="#example" style={styles.navLink}>Example</a>
          </nav>
        </div>
      </header>

      <main>
        <section style={styles.hero}>
          <div style={{ ...styles.wrap, ...responsiveGrid(styles.heroGrid) }}>
            <div style={{ ...styles.card, ...styles.heroCopy }}>
              <div style={styles.eyebrow}>Built for busy restaurant owners</div>

              <h1 style={styles.h1}>Turn Your Restaurant Menu Into a Digital Menu in Minutes</h1>

              <p style={styles.subhead}>
                Upload a PDF or photo menu and EasyMenuUpload converts it into a searchable,
                structured digital menu for your Grubbid profile.
              </p>

              <ul style={styles.list}>
                <li style={styles.listItem}>Update prices without reprinting your QR code</li>
                <li style={styles.listItem}>Make your dishes searchable on Grubbid</li>
                <li style={styles.listItem}>Get your menu online faster with less manual work</li>
              </ul>

              <div style={styles.ctaRow}>
                <a href="/signup" style={styles.btnPrimary}>Upload Your Menu</a>
                <a href="mailto:menus@grubbid.com" style={styles.btnSecondary}>Email Your Menu</a>
              </div>

              <div style={styles.heroNote}>
                Prefer email? Send your menu to <strong>menus@grubbid.com</strong>.
              </div>
            </div>

            <aside style={{ ...styles.card, ...styles.heroSide }}>
              <div style={styles.uploadBox}>
                <h3 style={styles.uploadTitle}>Upload Your Menu</h3>
                <p style={styles.uploadText}>PDF, photo, spreadsheet, or menu link.</p>
                <div style={{ ...styles.ctaRow, justifyContent: "center", marginBottom: 0 }}>
                  <a href="/signup" style={styles.btnPrimary}>Start Upload</a>
                </div>
              </div>

              <div style={styles.optionList}>
                <div style={styles.optionCard}>
                  <strong>Upload a PDF</strong>
                  <div style={styles.muted}>Great for printed restaurant menus and catering menus.</div>
                </div>

                <div style={styles.optionCard}>
                  <strong>Upload a photo</strong>
                  <div style={styles.muted}>Snap a menu with your phone and send it in.</div>
                </div>

                <div style={styles.optionCard}>
                  <strong>Email your menu</strong>
                  <div style={styles.muted}>
                    Send attachments directly to <strong>menus@grubbid.com</strong>.
                  </div>
                </div>

                <div style={styles.optionCard}>
                  <strong>Paste a menu link</strong>
                  <div style={styles.muted}>Use a public menu URL when available.</div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="how-it-works" style={styles.section}>
          <div style={styles.wrap}>
            <h2 style={styles.h2}>How It Works</h2>
            <p style={styles.sectionIntro}>
              EasyMenuUpload is designed to get your menu online fast, without forcing you
              to rebuild everything by hand.
            </p>

            <div style={responsiveGrid(styles.grid3)}>
              <div style={styles.sectionCard}>
                <div style={styles.stepNum}>1</div>
                <h3 style={styles.h3}>Send Your Menu</h3>
                <p style={styles.muted}>
                  Upload a PDF or photo, email your menu, or paste a menu link.
                </p>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.stepNum}>2</div>
                <h3 style={styles.h3}>We Structure It</h3>
                <p style={styles.muted}>
                  Your menu is converted into a structured digital menu with sections,
                  items, prices, and descriptions.
                </p>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.stepNum}>3</div>
                <h3 style={styles.h3}>Go Live on Grubbid</h3>
                <p style={styles.muted}>
                  Your restaurant profile and menu can be published, updated, and shared
                  by QR code.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.wrap}>
            <h2 style={styles.h2}>Why Restaurants Use Grubbid</h2>
            <p style={styles.sectionIntro}>
              This is about more than getting a menu online. It’s about making your food
              easier to discover.
            </p>

            <div style={responsiveGrid(styles.grid4)}>
              <div style={styles.sectionCard}>
                <h3 style={styles.h3}>Update Prices Faster</h3>
                <p style={styles.muted}>
                  Change menu pricing digitally without replacing your printed QR code.
                </p>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={styles.h3}>Make Dishes Searchable</h3>
                <p style={styles.muted}>
                  Customers can search for real menu items, not just restaurant names.
                </p>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={styles.h3}>Share Menus Anywhere</h3>
                <p style={styles.muted}>
                  Use one link or QR code for windows, tables, flyers, and social posts.
                </p>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={styles.h3}>Improve Visibility</h3>
                <p style={styles.muted}>
                  Give your menu a better chance to be found through search and sharing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" style={styles.section}>
          <div style={styles.wrap}>
            <h2 style={styles.h2}>Restaurant Listings</h2>
            <p style={styles.sectionIntro}>
              Start free. Upgrade when you want more control over presentation, QR menus,
              and premium features.
            </p>

            <div style={responsiveGrid(styles.pricingGrid)}>
              <div style={styles.sectionCard}>
                <h3 style={styles.h3}>Public Listing</h3>
                <div style={styles.price}>
                  $0 <small style={styles.priceSmall}>/ free</small>
                </div>
                <p style={styles.muted}>For restaurants with an unclaimed free Grubbid profile.</p>
                <ul style={styles.list}>
                  <li style={styles.listItem}>Basic public presence</li>
                  <li style={styles.listItem}>Menu visibility on Grubbid</li>
                </ul>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={styles.h3}>Verified Listing</h3>
                <div style={styles.price}>
                  $0 <small style={styles.priceSmall}>/ free</small>
                </div>
                <p style={styles.muted}>
                  For claimed listings with business verification and basic control.
                </p>
                <ul style={styles.list}>
                  <li style={styles.listItem}>Claimed restaurant profile</li>
                  <li style={styles.listItem}>Basic business control</li>
                  <li style={styles.listItem}>Improved trust and credibility</li>
                </ul>
              </div>

              <div style={{ ...styles.sectionCard, ...styles.pricingFeatured }}>
                <div style={styles.planTag}>Recommended</div>
                <h3 style={styles.h3}>Pro Listing</h3>
                <div style={styles.price}>
                  $149 <small style={styles.priceSmall}>/ year</small>
                </div>
                <p style={styles.muted}>
                  Advanced menu presentation, QR menus, and premium restaurant features.
                </p>
                <ul style={styles.list}>
                  <li style={styles.listItem}>Custom menu presentation</li>
                  <li style={styles.listItem}>QR code menus</li>
                  <li style={styles.listItem}>Menu layers and promotions</li>
                  <li style={styles.listItem}>Pro profile presentation</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="example" style={styles.section}>
          <div style={styles.wrap}>
            <h2 style={styles.h2}>Example Digital Menu</h2>
            <p style={styles.sectionIntro}>
              Here’s the kind of clean menu experience your restaurant can have on Grubbid.
            </p>

            <div style={styles.exampleCard}>
              <div style={styles.exampleHeader}>
                <div>
                  <h3 style={{ ...styles.h3, marginBottom: 6 }}>Hunt&apos;s Seafood Shack</h3>
                  <div style={styles.exampleMeta}>Seafood • Dothan, AL</div>
                </div>

                <div style={styles.badgeRow}>
                  <span style={styles.badge}>Pro Listing</span>
                  <span style={styles.badge}>QR Ready</span>
                </div>
              </div>

              <div style={styles.menuPreview}>
                <div style={styles.menuRow}>
                  <div>
                    <strong>Fried Shrimp Basket</strong>
                    <div style={styles.exampleMeta}>