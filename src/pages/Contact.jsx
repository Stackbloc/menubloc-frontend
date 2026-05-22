/**
 * ============================================================
 * File: Contact.jsx
 * Path: menubloc-frontend/src/pages/Contact.jsx
 * Date: 2026-04-03
 * Purpose:
 *   Dedicated Grubbid contact page with labeled support channels.
 * ============================================================
 */

import React, { useEffect, useState } from "react";
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

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");

const defaultContactRows = [
  { key: "menus", label: "Menu submissions", email: "menus@menuply.com" },
  { key: "support", label: "Support related issues", email: "support@menuply.com" },
  { key: "inquiries", label: "All other inquiries", email: "inquiries@menuply.com" },
];

const fieldStyle = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #1F2937",
  background: "#0F1720",
  color: "#F9FAFB",
  padding: "12px 14px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const bannerStyles = {
  success: {
    margin: "0 0 16px",
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(34,197,94,0.12)",
    color: "#bbf7d0",
    fontSize: 14,
    fontWeight: 700,
  },
  error: {
    margin: "0 0 16px",
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(239,68,68,0.12)",
    color: "#fecaca",
    fontSize: 14,
    fontWeight: 700,
  },
};

export default function Contact() {
  const [contactRows, setContactRows] = useState(defaultContactRows);
  const [formState, setFormState] = useState({
    topic: "inquiries",
    name: "",
    email: "",
    restaurantName: "",
    subject: "",
    message: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadContactOptions() {
      try {
        const response = await fetch(`${API}/api/contact`);
        const data = await response.json();
        if (!response.ok || !data?.ok || cancelled) return;

        setContactRows([
          { key: "menus", label: "Menu submissions", email: data.contact?.menus_email || "menus@menuply.com" },
          { key: "support", label: "Support related issues", email: data.contact?.support_email || "support@menuply.com" },
          { key: "inquiries", label: "All other inquiries", email: data.contact?.inquiries_email || "inquiries@menuply.com" },
        ]);
      } catch {
        // Keep fallback addresses when the API is unavailable.
      }
    }

    loadContactOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  function onChange(key, value) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const response = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formState.topic,
          name: formState.name,
          email: formState.email,
          restaurant_name: formState.restaurantName,
          subject: formState.subject,
          message: formState.message,
          page_url: typeof window !== "undefined" ? window.location.href : "/contact",
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to send your message right now.");
      }

      setSubmitSuccess(data.message || "Your message was sent.");
      setFormState((current) => ({
        ...current,
        name: "",
        email: "",
        restaurantName: "",
        subject: "",
        message: "",
      }));
    } catch (error) {
      setSubmitError(error?.message || "Unable to send your message right now.");
    } finally {
      setSubmitting(false);
    }
  }

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
        description="Use the form or email the right Menuply inbox directly."
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

        <div style={{ marginTop: 28 }}>
          {submitError ? <div style={bannerStyles.error}>{submitError}</div> : null}
          {submitSuccess ? <div style={bannerStyles.success}>{submitSuccess}</div> : null}

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Inquiry type</div>
              <select value={formState.topic} onChange={(event) => onChange("topic", event.target.value)} style={fieldStyle}>
                <option value="inquiries">General inquiry</option>
                <option value="support">Support issue</option>
                <option value="menus">Menu submission</option>
              </select>
            </div>

            <div>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Name</div>
              <input value={formState.name} onChange={(event) => onChange("name", event.target.value)} style={fieldStyle} />
            </div>

            <div>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Email</div>
              <input type="email" value={formState.email} onChange={(event) => onChange("email", event.target.value)} style={fieldStyle} />
            </div>

            <div>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Restaurant name (optional)</div>
              <input value={formState.restaurantName} onChange={(event) => onChange("restaurantName", event.target.value)} style={fieldStyle} />
            </div>

            <div>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Subject (optional)</div>
              <input value={formState.subject} onChange={(event) => onChange("subject", event.target.value)} style={fieldStyle} />
            </div>

            <div>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Message</div>
              <textarea
                value={formState.message}
                onChange={(event) => onChange("message", event.target.value)}
                rows={7}
                style={{ ...fieldStyle, resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                border: "none",
                borderRadius: 12,
                background: "var(--gb-color-accent)",
                color: "#0B0F0C",
                padding: "13px 16px",
                fontSize: 15,
                fontWeight: 800,
                cursor: submitting ? "default" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Sending..." : "Send message"}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
    <BottomNav />
    </>
  );
}
