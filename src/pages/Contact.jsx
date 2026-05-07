/**
 * ============================================================
 * File: Contact.jsx
 * Path: menubloc-frontend/src/pages/Contact.jsx
 * Date: 2026-04-03
 * Purpose:
 *   Dedicated Grubbid contact page with labeled support channels.
 * ============================================================
 */

import React from "react";
import { PageNav } from "../components/NavButton.jsx";
import Breadcrumbs from "../components/ui/Breadcrumbs.jsx";
import { PageHero, PageShell } from "../components/grubbid/GrubbidPrimitives.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";

const introStyle = {
  margin: "0 0 24px",
  color: "var(--gb-color-ink-soft)",
  fontSize: "15px",
  lineHeight: 1.8,
};

const rowStyle = {
  display: "grid",
  gap: 4,
  padding: "16px 0",
  borderTop: "1px solid #1F2937",
};

const labelStyle = {
  color: "var(--gb-color-ink)",
  fontSize: "14px",
  fontWeight: 800,
};

const linkStyle = {
  color: "var(--gb-color-accent)",
  fontSize: "15px",
  fontWeight: 700,
  textDecoration: "none",
  wordBreak: "break-word",
};

const contactRows = [
  {
    label: "Menu submissions",
    email: "menus@menuply.com",
  },
  {
    label: "Support related issues",
    email: "support@menuply.com",
  },
  {
    label: "All other inquiries",
    email: "inquiries@menuply.com",
  },
];

export default function Contact() {
  return (
    <>
    <StickyPageHeader />
    <PageShell width="reading">
      <PageNav back />
      <Breadcrumbs
        items={[
          { label: "Discovery", to: "/" },
          { label: "Contact" },
        ]}
      />

      <PageHero
        title="Contact Us"
        description="Reach the right Menuply team directly based on what you need."
      />

      <div style={{ maxWidth: 720 }}>
        <p style={introStyle}>
          Use the contact options below so your message goes to the right place.
        </p>

        <div>
          {contactRows.map((row, index) => (
            <div
              key={row.email}
              style={{
                ...rowStyle,
                borderBottom: index === contactRows.length - 1
                  ? "1px solid #1F2937"
                  : "none",
              }}
            >
              <div style={labelStyle}>{row.label}</div>
              <a href={`mailto:${row.email}`} style={linkStyle}>
                {row.email}
              </a>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
    <BottomNav />
    </>
  );
}
