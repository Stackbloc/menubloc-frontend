/**
 * Self-serve distributor registration — /distributors/join
 * Company profile + required Primary Menuply Contact (+ optional additional).
 * Menuply contacts are for Menuply relationship only (not restaurant-facing).
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import { registerPublicDistributor } from "../lib/api.js";

const CLAIM_STORAGE_KEY = "menuply_distributor_claim_id";

const CONTACT_FUNCTIONS = [
  { value: "sales_business_development", label: "Sales / Business Development" },
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "technology_integration", label: "Technology / Integration" },
  { value: "regional", label: "Regional Contact" },
  { value: "other", label: "Other" },
];

const emptyContact = (isPrimary = false) => ({
  first_name: "",
  last_name: "",
  job_title: "",
  email: "",
  phone: "",
  department_function: "",
  region: "",
  contact_function: isPrimary ? "primary_menuply" : "other",
  is_primary_menuply_contact: isPrimary,
});

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "0.55rem 0.65rem",
  fontSize: 15,
};

const labelStyle = { display: "grid", gap: 4, fontWeight: 700, fontSize: 13 };

function ContactFields({ contact, onChange, title, subtitle, allowFunctionSelect }) {
  function set(key, value) {
    onChange({ ...contact, [key]: value });
  }
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        padding: "14px 14px",
        borderRadius: 14,
        border: "1px solid #d1d5db",
        background: "#f8fafc",
      }}
    >
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>{title}</div>
        {subtitle ? (
          <p style={{ margin: "4px 0 0", color: "#4b5563", fontSize: 13, lineHeight: 1.45 }}>{subtitle}</p>
        ) : null}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
        <label style={labelStyle}>
          First name *
          <input style={inputStyle} value={contact.first_name} onChange={(e) => set("first_name", e.target.value)} required />
        </label>
        <label style={labelStyle}>
          Last name *
          <input style={inputStyle} value={contact.last_name} onChange={(e) => set("last_name", e.target.value)} required />
        </label>
      </div>
      <label style={labelStyle}>
        Job title
        <input style={inputStyle} value={contact.job_title} onChange={(e) => set("job_title", e.target.value)} />
      </label>
      <label style={labelStyle}>
        Email *
        <input
          type="email"
          style={inputStyle}
          value={contact.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </label>
      <label style={labelStyle}>
        Direct phone number
        <input style={inputStyle} value={contact.phone} onChange={(e) => set("phone", e.target.value)} />
      </label>
      <label style={labelStyle}>
        Department / function
        <input
          style={inputStyle}
          value={contact.department_function}
          onChange={(e) => set("department_function", e.target.value)}
        />
      </label>
      <label style={labelStyle}>
        Region (if applicable)
        <input style={inputStyle} value={contact.region} onChange={(e) => set("region", e.target.value)} />
      </label>
      {allowFunctionSelect ? (
        <label style={labelStyle}>
          Contact function
          <select
            style={inputStyle}
            value={contact.contact_function}
            onChange={(e) => set("contact_function", e.target.value)}
          >
            {CONTACT_FUNCTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

export default function DistributorJoinPage() {
  const [company, setCompany] = useState({
    display_name: "",
    website_url: "",
    logo_url: "",
    phone: "",
    email: "",
    description: "",
    founded_year: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    product_categories: "",
    geographic_markets: "",
  });
  const [registrant, setRegistrant] = useState({
    full_name: "",
    business_email: "",
    title: "",
    phone: "",
  });
  const [primaryContact, setPrimaryContact] = useState(emptyContact(true));
  const [extraContacts, setExtraContacts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  function setCompanyField(key, value) {
    setCompany((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const menuplyContacts = [
        { ...primaryContact, is_primary_menuply_contact: true, contact_function: "primary_menuply" },
        ...extraContacts.map((c) => ({ ...c, is_primary_menuply_contact: false })),
      ];
      const result = await registerPublicDistributor({
        company: {
          ...company,
          product_categories: company.product_categories,
          geographic_markets: company.geographic_markets,
        },
        menuply_contacts: menuplyContacts,
        registrant_full_name: registrant.full_name,
        registrant_email: registrant.business_email,
        registrant_title: registrant.title,
        registrant_phone: registrant.phone,
      });
      if (result?.claim?.id) {
        sessionStorage.setItem(CLAIM_STORAGE_KEY, result.claim.id);
      }
      setSuccess(result);
    } catch (err) {
      setError(err.message || "Unable to create distributor profile");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    const slug = success.distributor?.slug;
    return (
      <div style={pageStyle}>
        <StickyPageHeader />
        <main style={mainStyle}>
          <h1 style={h1Style}>Profile created</h1>
          <p style={{ color: "#374151", lineHeight: 1.55 }}>
            Your free Menuply distributor profile for{" "}
            <strong>{success.distributor?.display_name}</strong> is ready for account linking and
            Menuply review.
          </p>
          {slug ? (
            <p>
              <Link to={`/distributors/${slug}`} style={{ color: "#0f766e", fontWeight: 700 }}>
                View public profile →
              </Link>
            </p>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Link to="/distributor/account/signup" style={ctaStyle}>
              Create distributor account
            </Link>
            <Link to="/distributor/account/login" style={secondaryCtaStyle}>
              Sign in
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <StickyPageHeader />
      <main style={mainStyle}>
        <p style={{ margin: 0 }}>
          <Link to="/distributors" style={{ color: "#374151", fontWeight: 600, textDecoration: "none" }}>
            ← Distributors
          </Link>
        </p>
        <h1 style={h1Style}>Create your free distributor profile</h1>
        <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.5 }}>
          Tell restaurants who you are on Menuply — and designate who Menuply should contact at your
          company. Menuply contacts are private to Menuply and are not shown as restaurant sales contacts.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18, marginTop: 8 }}>
          <section style={sectionStyle}>
            <h2 style={h2Style}>Company information</h2>
            <label style={labelStyle}>
              Company name *
              <input
                style={inputStyle}
                required
                value={company.display_name}
                onChange={(e) => setCompanyField("display_name", e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              Website
              <input
                style={inputStyle}
                value={company.website_url}
                onChange={(e) => setCompanyField("website_url", e.target.value)}
                placeholder="https://"
              />
            </label>
            <label style={labelStyle}>
              Logo URL
              <input
                style={inputStyle}
                value={company.logo_url}
                onChange={(e) => setCompanyField("logo_url", e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              Main company phone
              <input
                style={inputStyle}
                value={company.phone}
                onChange={(e) => setCompanyField("phone", e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              Company email
              <input
                type="email"
                style={inputStyle}
                value={company.email}
                onChange={(e) => setCompanyField("email", e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              Founded (year)
              <input
                style={inputStyle}
                inputMode="numeric"
                value={company.founded_year}
                onChange={(e) => setCompanyField("founded_year", e.target.value)}
                placeholder="e.g. 1969"
              />
            </label>
            <label style={labelStyle}>
              Headquarters address
              <input
                style={inputStyle}
                value={company.address_line1}
                onChange={(e) => setCompanyField("address_line1", e.target.value)}
              />
            </label>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1.4fr 0.6fr 0.8fr" }}>
              <label style={labelStyle}>
                City
                <input style={inputStyle} value={company.city} onChange={(e) => setCompanyField("city", e.target.value)} />
              </label>
              <label style={labelStyle}>
                State
                <input style={inputStyle} value={company.state} onChange={(e) => setCompanyField("state", e.target.value)} />
              </label>
              <label style={labelStyle}>
                Postal code
                <input
                  style={inputStyle}
                  value={company.postal_code}
                  onChange={(e) => setCompanyField("postal_code", e.target.value)}
                />
              </label>
            </div>
            <label style={labelStyle}>
              Company description
              <textarea
                rows={4}
                style={inputStyle}
                value={company.description}
                onChange={(e) => setCompanyField("description", e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              Distributor / product categories
              <input
                style={inputStyle}
                value={company.product_categories}
                onChange={(e) => setCompanyField("product_categories", e.target.value)}
                placeholder="Comma-separated (e.g. Produce, Dairy, Specialty)"
              />
            </label>
            <label style={labelStyle}>
              Geographic markets served
              <input
                style={inputStyle}
                value={company.geographic_markets}
                onChange={(e) => setCompanyField("geographic_markets", e.target.value)}
                placeholder="Comma-separated (e.g. Nationwide, California, Southeast)"
              />
            </label>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Profile administrator</h2>
            <p style={{ margin: 0, color: "#4b5563", fontSize: 13, lineHeight: 1.45 }}>
              The person creating this profile (you). This is not automatically the Primary Menuply Contact.
            </p>
            <label style={labelStyle}>
              Your full name *
              <input
                style={inputStyle}
                required
                value={registrant.full_name}
                onChange={(e) => setRegistrant((p) => ({ ...p, full_name: e.target.value }))}
              />
            </label>
            <label style={labelStyle}>
              Your business email *
              <input
                type="email"
                style={inputStyle}
                required
                value={registrant.business_email}
                onChange={(e) => setRegistrant((p) => ({ ...p, business_email: e.target.value }))}
              />
            </label>
            <label style={labelStyle}>
              Your job title
              <input
                style={inputStyle}
                value={registrant.title}
                onChange={(e) => setRegistrant((p) => ({ ...p, title: e.target.value }))}
              />
            </label>
            <label style={labelStyle}>
              Your phone
              <input
                style={inputStyle}
                value={registrant.phone}
                onChange={(e) => setRegistrant((p) => ({ ...p, phone: e.target.value }))}
              />
            </label>
          </section>

          <section style={sectionStyle} data-testid="menuply-contact-section">
            <h2 style={h2Style}>Your Menuply Contact</h2>
            <p style={{ margin: 0, color: "#4b5563", fontSize: 14, lineHeight: 1.5 }}>
              <strong>Who should be the primary contact person for Menuply?</strong> Menuply uses this
              person for platform communications and relationship management — not as a public restaurant
              contact.
            </p>
            <ContactFields
              contact={primaryContact}
              onChange={setPrimaryContact}
              title="Primary Menuply Contact *"
              subtitle="Required. May be different from the person creating this profile."
            />
            {extraContacts.map((c, idx) => (
              <div key={idx} style={{ display: "grid", gap: 8 }}>
                <ContactFields
                  contact={c}
                  onChange={(next) =>
                    setExtraContacts((prev) => prev.map((row, i) => (i === idx ? next : row)))
                  }
                  title={`Additional Menuply Contact ${idx + 1}`}
                  allowFunctionSelect
                />
                <button
                  type="button"
                  onClick={() => setExtraContacts((prev) => prev.filter((_, i) => i !== idx))}
                  style={{ justifySelf: "start", ...secondaryCtaStyle, padding: "0.45rem 0.8rem" }}
                >
                  Remove contact
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExtraContacts((prev) => [...prev, emptyContact(false)])}
              style={{
                justifySelf: "start",
                border: "1px dashed #0f766e",
                background: "#ecfdf5",
                color: "#0f766e",
                fontWeight: 800,
                borderRadius: 10,
                padding: "0.65rem 0.9rem",
                cursor: "pointer",
              }}
            >
              + Add Another Menuply Contact
            </button>
          </section>

          {error ? <div style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</div> : null}

          <button type="submit" disabled={submitting} style={ctaStyle}>
            {submitting ? "Creating profile…" : "Create free distributor profile"}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  padding: "0 1rem 5rem",
  boxSizing: "border-box",
};

const mainStyle = {
  maxWidth: 720,
  margin: "0 auto",
  paddingTop: "1rem",
  display: "grid",
  gap: "0.85rem",
};

const sectionStyle = {
  display: "grid",
  gap: 12,
  padding: "1rem 1.05rem",
  borderRadius: 16,
  border: "1px solid #dbe7df",
  background: "#fff",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const h1Style = {
  margin: 0,
  fontSize: "1.55rem",
  fontWeight: 800,
  color: "#111827",
  letterSpacing: "-0.02em",
};

const h2Style = { margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" };

const ctaStyle = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "0.85rem 1.2rem",
  borderRadius: 12,
  background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: "1rem",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
};

const secondaryCtaStyle = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "0.75rem 1rem",
  borderRadius: 12,
  background: "#fff",
  color: "#0f766e",
  fontWeight: 800,
  textDecoration: "none",
  border: "1px solid #99f6e4",
  cursor: "pointer",
};
