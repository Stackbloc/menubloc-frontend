// ============================================================
// Path: menubloc-frontend/src/pages/EasyMenuLanding.jsx
// File: EasyMenuLanding.jsx
// Date: 2026-03-06
// Purpose:
//   Simple HTML-first marketing / onboarding landing page for
//   easymenuupload.com. Kept intentionally low-complexity to
//   avoid build issues and improve clarity.
// ============================================================

import React from "react";

export default function EasyMenuLanding() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f9fc",
        color: "#0f1720",
        fontFamily: "Arial, Helvetica, sans-serif",
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "20px 16px 60px",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            padding: "10px 0 22px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 20 }}>EasyMenuUpload</div>

          <nav
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <a href="#how-it-works" style={{ color: "#124ba3", textDecoration: "none" }}>
              How It Works
            </a>
            <a href="#pricing" style={{ color: "#124ba3", textDecoration: "none" }}>
              Pricing
            </a>
            <a href="#example" style={{ color: "#124ba3", textDecoration: "none" }}>
              Example
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.95fr",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e4e9f0",
              borderRadius: 18,
              padding: 32,
              boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 999,
                background: "#eef4ff",
                color: "#124ba3",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              Built for busy restaurant owners
            </div>

            <h1
              style={{
                margin: "0 0 14px",
                fontSize: 42,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              Turn Your Restaurant Menu Into a Digital Menu in Minutes
            </h1>

            <p
              style={{
                fontSize: 18,
                color: "#5b6675",
                margin: "0 0 20px",
                maxWidth: 720,
              }}
            >
              Upload a PDF or photo menu and EasyMenuUpload converts it into a searchable,
              structured digital menu for your Grubbid profile.
            </p>

            <ul style={{ margin: "0 0 24px", paddingLeft: 18 }}>
              <li style={{ marginBottom: 8 }}>Update prices without reprinting your QR code</li>
              <li style={{ marginBottom: 8 }}>Make your dishes searchable on Grubbid</li>
              <li style={{ marginBottom: 8 }}>Get your menu online faster with less manual work</li>
            </ul>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <a
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 46,
                  padding: "0 18px",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  background: "#124ba3",
                  color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                Upload Your Menu
              </a>

              <a
                href="mailto:menus@grubbid.com"
                style={{
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
                }}
              >
                Email Your Menu
              </a>
            </div>

            <div style={{ fontSize: 14, color: "#5b6675" }}>
              Prefer email? Send your menu to <strong>menus@grubbid.com</strong>.
            </div>
          </div>

          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #e4e9f0",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
            }}
          >
            <div
              style={{
                border: "2px dashed #c9d7ee",
                borderRadius: 16,
                background: "#fbfdff",
                padding: "28px 18px",
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Upload Your Menu</h2>
              <p style={{ margin: "0 0 18px", color: "#5b6675" }}>
                PDF, photo, spreadsheet, or menu link.
              </p>

              <a
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 46,
                  padding: "0 18px",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  background: "#124ba3",
                  color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                Start Upload
              </a>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  border: "1px solid #e4e9f0",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#ffffff",
                }}
              >
                <strong>Upload a PDF</strong>
                <div style={{ color: "#5b6675" }}>
                  Great for printed restaurant menus and catering menus.
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e4e9f0",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#ffffff",
                }}
              >
                <strong>Upload a photo</strong>
                <div style={{ color: "#5b6675" }}>
                  Snap a menu with your phone and send it in.
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e4e9f0",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#ffffff",
                }}
              >
                <strong>Email your menu</strong>
                <div style={{ color: "#5b6675" }}>
                  Send attachments directly to <strong>menus@grubbid.com</strong>.
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e4e9f0",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#ffffff",
                }}
              >
                <strong>Paste a menu link</strong>
                <div style={{ color: "#5b6675" }}>Use a public menu URL when available.</div>
              </div>
            </div>
          </aside>
        </section>

        {/* How it works */}
        <section id="how-it-works" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 32, lineHeight: 1.1, margin: "0 0 10px" }}>How It Works</h2>
          <p style={{ color: "#5b6675", margin: "0 0 22px", maxWidth: 760 }}>
            EasyMenuUpload is designed to get your menu online fast, without forcing you
            to rebuild everything by hand.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e4e9f0",
                borderRadius: 18,
                padding: 22,
                boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
              }}
            >
              <div
                style={{
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
                }}
              >
                1
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>Send Your Menu</h3>
              <p style={{ color: "#5b6675", margin: 0 }}>
                Upload a PDF or photo, email your menu, or paste a menu link.
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e4e9f0",
                borderRadius: 18,
                padding: 22,
                boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
              }}
            >
              <div
                style={{
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
                }}
              >
                2
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>We Structure It</h3>
              <p style={{ color: "#5b6675", margin: 0 }}>
                Your menu is converted into a structured digital menu with sections,
                items, prices, and descriptions.
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e4e9f0",
                borderRadius: 18,
                padding: 22,
                boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
              }}
            >
              <div
                style={{
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
                }}
              >
                3
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>Go Live on Grubbid</h3>
              <p style={{ color: "#5b6675", margin: 0 }}>
                Your restaurant profile and menu can be published, updated, and
                discovered on Grubbid.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 32, lineHeight: 1.1, margin: "0 0 10px" }}>Simple Pricing</h2>
          <p style={{ color: "#5b6675", margin: "0 0 22px", maxWidth: 760 }}>
            Choose the menu submission method that works best for your restaurant.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e4e9f0",
                borderRadius: 18,
                padding: 24,
                boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#124ba3", marginBottom: 8 }}>
                DIY Upload
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 24 }}>Free</h3>
              <p style={{ color: "#5b6675", margin: "0 0 18px" }}>
                Good for restaurants that want to send files and handle onboarding steps online.
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li style={{ marginBottom: 8 }}>Upload menu files</li>
                <li style={{ marginBottom: 8 }}>Start your digital menu setup</li>
                <li style={{ marginBottom: 8 }}>Ideal for simple submissions</li>
              </ul>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "2px solid #124ba3",
                borderRadius: 18,
                padding: 24,
                boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  right: 18,
                  background: "#124ba3",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "6px 10px",
                  borderRadius: 999,
                }}
              >
                Popular
              </div>

              <div style={{ fontSize: 14, fontWeight: 800, color: "#124ba3", marginBottom: 8 }}>
                AI OCR Ingestion
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 24 }}>$9.99</h3>
              <p style={{ color: "#5b6675", margin: "0 0 18px" }}>
                Best for restaurants that want a faster path from printed menu to structured menu.
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li style={{ marginBottom: 8 }}>Upload photo or PDF</li>
                <li style={{ marginBottom: 8 }}>AI-assisted extraction and structuring</li>
                <li style={{ marginBottom: 8 }}>Built for speed and convenience</li>
              </ul>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e4e9f0",
                borderRadius: 18,
                padding: 24,
                boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#124ba3", marginBottom: 8 }}>
                Email Submission
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 24 }}>Manual Intake</h3>
              <p style={{ color: "#5b6675", margin: "0 0 18px" }}>
                Send your menu directly by email when that is easiest for your team.
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li style={{ marginBottom: 8 }}>Attach PDF, photo, or spreadsheet</li>
                <li style={{ marginBottom: 8 }}>Good for owners on the go</li>
                <li style={{ marginBottom: 8 }}>Simple fallback option</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Example */}
        <section id="example" style={{ marginBottom: 28 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e4e9f0",
              borderRadius: 18,
              padding: 28,
              boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
            }}
          >
            <h2 style={{ fontSize: 32, lineHeight: 1.1, margin: "0 0 10px" }}>
              Example Workflow
            </h2>
            <p style={{ color: "#5b6675", margin: "0 0 22px", maxWidth: 760 }}>
              A restaurant uploads a printed menu PDF. EasyMenuUpload helps convert it into
              a structured digital menu that can later be updated without changing the QR code.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
              }}
            >
              <div
                style={{
                  border: "1px solid #e4e9f0",
                  borderRadius: 16,
                  padding: 20,
                  background: "#fbfdff",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Before</div>
                <div style={{ color: "#5b6675" }}>
                  Static PDF menu, hard to search, hard to update, and disconnected from
                  restaurant discovery.
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e4e9f0",
                  borderRadius: 16,
                  padding: 20,
                  background: "#fbfdff",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 10 }}>After</div>
                <div style={{ color: "#5b6675" }}>
                  Searchable digital menu, easier updates, better presentation, and ready for
                  Grubbid profile publishing.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            background: "#124ba3",
            color: "#ffffff",
            borderRadius: 22,
            padding: "30px 24px",
            boxShadow: "0 10px 30px rgba(16,24,40,0.12)",
          }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: 32, lineHeight: 1.1 }}>
            Ready to Upload Your Menu?
          </h2>
          <p style={{ margin: "0 0 18px", maxWidth: 700, color: "rgba(255,255,255,0.88)" }}>
            Start with a file, a photo, an email, or a menu link. We built this to make menu
            onboarding easier, not harder.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 46,
                padding: "0 18px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 15,
                background: "#ffffff",
                color: "#124ba3",
                textDecoration: "none",
              }}
            >
              Upload Your Menu
            </a>

            <a
              href="mailto:menus@grubbid.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 46,
                padding: "0 18px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 15,
                border: "1px solid rgba(255,255,255,0.35)",
                background: "transparent",
                color: "#ffffff",
                textDecoration: "none",
              }}
            >
              Email menus@grubbid.com
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}