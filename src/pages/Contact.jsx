import React, { useEffect, useState } from "react";
import { PageHero, PageShell } from "../components/grubbid/GrubbidPrimitives.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const introStyle = {
  margin: "0 0 24px",
  color: "#374151",
  fontSize: "15px",
  lineHeight: 1.8,
};

const rowStyle = {
  display: "grid",
  gap: 4,
  padding: "16px 0",
  borderTop: "1px solid #E5E7EB",
};

const labelStyle = {
  color: "#0B0F0C",
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

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");

const defaultContactRows = [
  { key: "menus", label: "contact.menuSubmissions", email: "menus@menuply.com" },
  { key: "support", label: "contact.supportIssues", email: "support@menuply.com" },
  { key: "inquiries", label: "contact.otherInquiries", email: "inquiries@menuply.com" },
];

export default function Contact() {
  const { t } = useLanguage();
  const [contactRows, setContactRows] = useState(defaultContactRows);

  useEffect(() => {
    let cancelled = false;
    async function loadContactOptions() {
      try {
        const response = await fetch(`${API}/api/contact`);
        const data = await response.json();
        if (!response.ok || !data?.ok || cancelled) return;
        setContactRows([
          { key: "menus", label: "contact.menuSubmissions", email: data.contact?.menus_email || "menus@menuply.com" },
          { key: "support", label: "contact.supportIssues", email: data.contact?.support_email || "support@menuply.com" },
          { key: "inquiries", label: "contact.otherInquiries", email: data.contact?.inquiries_email || "inquiries@menuply.com" },
        ]);
      } catch {
        // Keep fallback addresses when the API is unavailable.
      }
    }
    loadContactOptions();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
    <PageShell width="reading">
      <div style={{ marginBottom: 16 }}>
        <BrandLogo height={36} radius={8} matchPageBackground={false} />
      </div>

      <PageHero
        title={t("contact.heroTitle", "Contact")}
        description={t("contact.heroSubtitle", "Reach the Menuply team for menu, support, and partnership questions.")}
      />

      <div style={{ maxWidth: 720 }}>
        <p style={introStyle}>
          {t("contact.intro", "Use the contact options below so your message goes to the right place.")}
        </p>

        <div>
          {contactRows.map((row, index) => (
            <div
              key={row.email}
              style={{
                ...rowStyle,
                borderBottom: index === contactRows.length - 1 ? "1px solid #E5E7EB" : "none",
              }}
            >
              <div style={labelStyle}>{t(row.label, row.label)}</div>
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
