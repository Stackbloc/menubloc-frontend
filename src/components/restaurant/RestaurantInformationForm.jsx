/**
 * Shared Restaurant Information form (presentational).
 * Save handlers live in the page wrapper — never use legacy /restaurants POST.
 */

import React, { useEffect, useState } from "react";
import { formatPhoneDisplay } from "../../lib/restaurantInformationSchema.js";
import { API_BASE } from "../../lib/operatorApi.js";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

const styles = {
  section: {
    border: "1px solid #e8e4de",
    borderRadius: 16,
    padding: 18,
    background: "#fff",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0B0F0C",
    margin: "0 0 6px",
    fontFamily: FONT,
  },
  sectionHint: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 14px",
    lineHeight: 1.45,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  full: { gridColumn: "1 / -1" },
  label: {
    fontSize: 12,
    fontWeight: 800,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 42,
    padding: "0 12px",
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    outline: "none",
    background: "#fff",
    fontSize: 14,
    fontFamily: FONT,
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: 42,
    padding: "0 12px",
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    outline: "none",
    background: "#fff",
    appearance: "auto",
    color: "#111",
    fontSize: 14,
    fontFamily: FONT,
    boxSizing: "border-box",
  },
  privateBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#7c5e10",
    background: "#fff8e6",
    border: "1px solid #f0e0a8",
    borderRadius: 999,
    padding: "2px 8px",
    marginLeft: 8,
    verticalAlign: "middle",
  },
};

export default function RestaurantInformationForm({
  form,
  onChange,
  disabled = false,
  emailReadOnly = true,
}) {
  const [categories, setCategories] = useState([]);
  const [cuisines, setCuisines] = useState([]);

  useEffect(() => {
    const base = String(API_BASE || "").replace(/\/$/, "");
    fetch(`${base}/api/meta/categories`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Array.isArray(j.categories)) setCategories(j.categories);
      })
      .catch(() => {});
    fetch(`${base}/api/meta/cuisines`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Array.isArray(j.cuisines)) setCuisines(j.cuisines);
      })
      .catch(() => {});
  }, []);

  function setField(key, value) {
    if (disabled) return;
    onChange({ ...form, [key]: value });
  }

  return (
    <div>
      <section style={styles.section} aria-labelledby="ri-basics">
        <h2 id="ri-basics" style={styles.sectionTitle}>
          Basics
        </h2>
        <p style={styles.sectionHint}>
          Public name and classification shown on your Menuply listing.
        </p>
        <div style={styles.grid}>
          <div style={styles.full}>
            <div style={styles.label}>Restaurant name *</div>
            <input
              style={styles.input}
              value={form.restaurant_name}
              disabled={disabled}
              onChange={(e) => setField("restaurant_name", e.target.value)}
              autoComplete="organization"
            />
          </div>
          <div>
            <div style={styles.label}>Category *</div>
            <select
              style={styles.select}
              value={form.category}
              disabled={disabled}
              onChange={(e) => setField("category", e.target.value)}
            >
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={styles.label}>Cuisine</div>
            <select
              style={styles.select}
              value={form.cuisine}
              disabled={disabled}
              onChange={(e) => setField("cuisine", e.target.value)}
            >
              <option value="">— Select cuisine —</option>
              {cuisines.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section style={styles.section} aria-labelledby="ri-contact">
        <h2 id="ri-contact" style={styles.sectionTitle}>
          Contact
        </h2>
        <p style={styles.sectionHint}>
          Phone and website appear publicly. Manager name stays private.
        </p>
        <div style={styles.grid}>
          <div>
            <div style={styles.label}>
              Manager / contact name
              <span style={styles.privateBadge}>Private</span>
            </div>
            <input
              style={styles.input}
              value={form.manager_name}
              disabled={disabled}
              onChange={(e) => setField("manager_name", e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <div style={styles.label}>Public phone *</div>
            <input
              style={styles.input}
              type="tel"
              placeholder="(555) 555-5555"
              value={form.phone}
              disabled={disabled}
              onChange={(e) => setField("phone", formatPhoneDisplay(e.target.value))}
              autoComplete="tel"
            />
          </div>
          <div>
            <div style={styles.label}>Website</div>
            <input
              style={styles.input}
              value={form.website_url}
              disabled={disabled}
              onChange={(e) => setField("website_url", e.target.value)}
              placeholder="https://..."
              autoComplete="url"
            />
          </div>
          <div>
            <div style={styles.label}>
              Account email
              <span style={styles.privateBadge}>Private</span>
            </div>
            <input
              style={{ ...styles.input, background: emailReadOnly ? "#f9fafb" : "#fff" }}
              value={form.email}
              disabled={disabled || emailReadOnly}
              readOnly={emailReadOnly}
              onChange={(e) => setField("email", e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>
      </section>

      <section style={styles.section} aria-labelledby="ri-locations-note">
        <h2 id="ri-locations-note" style={styles.sectionTitle}>
          Address &amp; locations
        </h2>
        <p style={styles.sectionHint}>
          Street address, city, state, postal code, geo, hours, and location-specific details are
          managed in the <strong>Locations</strong> step — including for a single location. Your
          restaurant already has a permanent location identity from account creation.
        </p>
      </section>
    </div>
  );
}
