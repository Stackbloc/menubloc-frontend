/**
 * ============================================================
 * File: FoodTruckSignup.jsx
 * Path: menubloc-frontend/src/pages/FoodTruckSignup.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Food truck owner signup — Step 1 of food truck onboarding.
 *   Collects account info and truck info.
 *
 *   On submit: calls POST /owner/profile with category='food_truck'
 *   Returns { restaurant, owner_token }.
 *   Then adds Grubbid Food Truck Verified ($59/yr) to cart
 *   and opens the PayPal checkout drawer.
 *
 * Route: /foodtruck/signup
 *
 * PayPal Plan ID placeholder:
 *   PLAN_ID_FOODTRUCK_VERIFIED — swap in from developer.paypal.com
 * ============================================================
 */

import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

// ── Replace with real sandbox Plan ID from developer.paypal.com ──
const PLAN_ID_FOODTRUCK_VERIFIED = "YOUR_PLAN_ID_FOODTRUCK_VERIFIED";

const CUISINE_OPTIONS = [
  "American", "BBQ", "Caribbean", "Chinese", "Filipino", "French",
  "Greek", "Indian", "Italian", "Japanese", "Korean", "Latin",
  "Mediterranean", "Mexican", "Middle Eastern", "Soul Food",
  "Southeast Asian", "Thai", "Vegan / Plant-Based", "Other",
];

const st = {
  page: {
    maxWidth: 600,
    margin: "40px auto",
    padding: "0 20px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  brand:    { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#666", marginBottom: 28 },
  pageTitle:    { fontSize: 22, fontWeight: 700, marginTop: 20, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: "#666", marginBottom: 28 },

  section: {
    background: "#f7f7fb",
    border: "1px solid #efeff6",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: 800, color: "#444",
    marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em",
  },

  fieldGroup: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#333" },
  required: { color: "#c00", marginLeft: 2 },

  input: {
    width: "100%", height: 40, borderRadius: 10,
    border: "1px solid #e5e5e5", padding: "0 12px",
    fontSize: 14, background: "#fff", boxSizing: "border-box",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  },
  inputError: {
    width: "100%", height: 40, borderRadius: 10,
    border: "1px solid #c00", padding: "0 12px",
    fontSize: 14, background: "#fff", boxSizing: "border-box",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  },
  select: {
    width: "100%", height: 40, borderRadius: 10,
    border: "1px solid #e5e5e5", padding: "0 12px",
    fontSize: 14, background: "#fff", boxSizing: "border-box",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    appearance: "none",
  },
  textarea: {
    width: "100%", borderRadius: 10,
    border: "1px solid #e5e5e5", padding: "10px 12px",
    fontSize: 14, background: "#fff", boxSizing: "border-box",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    resize: "vertical", minHeight: 72,
  },
  row2: { display: "flex", gap: 12 },
  halfField: { flex: 1, marginBottom: 14 },
  fieldError: { fontSize: 12, color: "#c00", marginTop: 4 },

  errorBanner: {
    background: "#fff0f0", border: "1px solid #f5c6c6",
    borderRadius: 10, padding: "12px 16px",
    marginBottom: 16, fontSize: 13, color: "#c00",
  },

  // Plan card
  planCard: {
    border: "2px solid #111", borderRadius: 16,
    padding: "20px 20px 16px", background: "#fafafa",
    marginBottom: 0,
  },
  planBadge: {
    display: "inline-block", fontSize: 10, fontWeight: 800,
    background: "#d97706", color: "#fff",
    borderRadius: 999, padding: "3px 10px", marginBottom: 10,
  },
  planName:  { fontSize: 18, fontWeight: 900, marginBottom: 4 },
  planPrice: { fontSize: 28, fontWeight: 900, color: "#111" },
  planPer:   { fontSize: 13, color: "#666", marginLeft: 4 },
  planSavings: { fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 2, marginBottom: 12 },
  planFeatures: { listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: 13, color: "#333", lineHeight: 1.7 },
  planFeatureItem: { display: "flex", gap: 8, alignItems: "flex-start" },
  checkmark: { color: "#111", fontWeight: 900, marginTop: 1, flexShrink: 0 },
};

function submitBtnStyle(disabled) {
  return {
    width: "100%", height: 46, borderRadius: 12, border: 0,
    background: disabled ? "#ccc" : "#111",
    color: "#fff", fontWeight: 700, fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer", marginTop: 4,
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  };
}

const TRUCK_FEATURES = [
  "Verified food truck badge on your public profile",
  "Edit and manage your menu",
  "Update your live location and schedule",
  "Appear in Grubbid food truck discovery",
  "QR code for your menu",
  "Upcoming Locations & Events schedule page",
];

export default function FoodTruckSignup() {
  const { addToCart, openCart } = useCart();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    truck_name: "",
    cuisine: "",
    phone: "",
    website_url: "",
    instagram: "",
    city: "",
    state: "",
    service_area: "",
  });

  const [fieldErrors, setFieldErrors]  = useState({});
  const [serverError, setServerError]  = useState("");
  const [submitting,  setSubmitting]   = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errors = {};
    if (!form.truck_name.trim()) errors.truck_name = "Truck name is required.";
    if (!form.email.trim())      errors.email      = "Email is required.";
    if (!form.city.trim())       errors.city       = "City is required.";
    if (!form.state.trim())      errors.state      = "State is required.";
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setSubmitting(true);

    try {
      const res = await fetch(`${API}/owner/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:           form.email.trim(),
          restaurant_name: form.truck_name.trim(),
          phone:           form.phone.trim()       || null,
          website_url:     form.website_url.trim() || null,
          city:            form.city.trim()         || null,
          state:           form.state.trim()        || null,
          cuisine:         form.cuisine             || null,
          instagram:       form.instagram.trim().replace(/^@/, "") || null,
          service_area:    form.service_area.trim() || null,
          category:        "food_truck",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Signup failed (${res.status})`);
      }

      // Account created — add plan to cart and open PayPal drawer
      addToCart({
        id:           "foodtruck_verified_annual",
        name:         "Grubbid Food Truck — Verified",
        description:  "Annual verified listing · renews each year",
        price:        59,
        type:         "subscription",
        interval:     "year",
        paypalPlanId: PLAN_ID_FOODTRUCK_VERIFIED,
      });
      openCart();

    } catch (err) {
      setServerError(err.message || "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={st.page}>
      {/* Brand */}
      <div style={st.brand}>Grubbid</div>
      <div style={st.subbrand}>for Food Trucks</div>
      <div style={st.pageTitle}>List your food truck</div>
      <div style={st.pageSubtitle}>
        Get discovered by customers looking for food trucks in your area.
      </div>

      {serverError && <div style={st.errorBanner}>{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate>

        {/* Account Information */}
        <div style={st.section}>
          <div style={st.sectionTitle}>Account Information</div>

          <div style={st.fieldGroup}>
            <label htmlFor="email" style={st.label}>
              Email<span style={st.required}>*</span>
            </label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              style={fieldErrors.email ? st.inputError : st.input}
            />
            {fieldErrors.email && <div style={st.fieldError}>{fieldErrors.email}</div>}
          </div>

          <div style={st.fieldGroup}>
            <label htmlFor="password" style={st.label}>Password</label>
            <input
              id="password" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={handleChange} style={st.input}
            />
          </div>

          <div style={st.fieldGroup}>
            <label htmlFor="confirmPassword" style={st.label}>Confirm Password</label>
            <input
              id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
              value={form.confirmPassword} onChange={handleChange}
              style={fieldErrors.confirmPassword ? st.inputError : st.input}
            />
            {fieldErrors.confirmPassword && <div style={st.fieldError}>{fieldErrors.confirmPassword}</div>}
          </div>
        </div>

        {/* Truck Information */}
        <div style={st.section}>
          <div style={st.sectionTitle}>Truck Information</div>

          <div style={st.fieldGroup}>
            <label htmlFor="truck_name" style={st.label}>
              Truck Name<span style={st.required}>*</span>
            </label>
            <input
              id="truck_name" name="truck_name" type="text" autoComplete="organization"
              value={form.truck_name} onChange={handleChange}
              style={fieldErrors.truck_name ? st.inputError : st.input}
            />
            {fieldErrors.truck_name && <div style={st.fieldError}>{fieldErrors.truck_name}</div>}
          </div>

          <div style={st.fieldGroup}>
            <label htmlFor="cuisine" style={st.label}>Cuisine / Food Type</label>
            <select
              id="cuisine" name="cuisine"
              value={form.cuisine} onChange={handleChange}
              style={st.select}
            >
              <option value="">Select cuisine…</option>
              {CUISINE_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={st.fieldGroup}>
            <label htmlFor="phone" style={st.label}>Phone</label>
            <input
              id="phone" name="phone" type="tel" autoComplete="tel"
              value={form.phone} onChange={handleChange} style={st.input}
            />
          </div>

          <div style={st.fieldGroup}>
            <label htmlFor="website_url" style={st.label}>Website</label>
            <input
              id="website_url" name="website_url" type="url" autoComplete="url"
              placeholder="yourtruck.com"
              value={form.website_url} onChange={handleChange}
              onBlur={() => {
                const raw = form.website_url.trim();
                if (raw && !/^https?:\/\//i.test(raw)) {
                  setForm((prev) => ({ ...prev, website_url: "https://" + raw }));
                }
              }}
              style={st.input}
            />
          </div>

          <div style={st.fieldGroup}>
            <label htmlFor="instagram" style={st.label}>Instagram</label>
            <input
              id="instagram" name="instagram" type="text"
              placeholder="@yourtruck"
              value={form.instagram} onChange={handleChange} style={st.input}
            />
          </div>
        </div>

        {/* Location */}
        <div style={st.section}>
          <div style={st.sectionTitle}>Base Location</div>

          <div style={st.row2}>
            <div style={st.halfField}>
              <label htmlFor="city" style={st.label}>
                City<span style={st.required}>*</span>
              </label>
              <input
                id="city" name="city" type="text" autoComplete="address-level2"
                value={form.city} onChange={handleChange}
                style={fieldErrors.city ? st.inputError : st.input}
              />
              {fieldErrors.city && <div style={st.fieldError}>{fieldErrors.city}</div>}
            </div>

            <div style={{ flex: "0 0 90px", marginBottom: 14 }}>
              <label htmlFor="state" style={st.label}>
                State<span style={st.required}>*</span>
              </label>
              <input
                id="state" name="state" type="text" autoComplete="address-level1"
                maxLength={2}
                value={form.state} onChange={handleChange}
                style={fieldErrors.state ? st.inputError : st.input}
              />
              {fieldErrors.state && <div style={st.fieldError}>{fieldErrors.state}</div>}
            </div>
          </div>

          <div style={st.fieldGroup}>
            <label htmlFor="service_area" style={st.label}>
              Service Area <span style={{ fontWeight: 400, color: "#888" }}>(optional)</span>
            </label>
            <textarea
              id="service_area" name="service_area"
              placeholder="e.g. Downtown Miami, Wynwood, Brickell"
              value={form.service_area} onChange={handleChange}
              style={st.textarea}
            />
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              Neighborhoods or areas where you regularly operate.
            </div>
          </div>
        </div>

        {/* Plan */}
        <div style={st.section}>
          <div style={st.sectionTitle}>Your Plan</div>
          <div style={st.planCard}>
            <div style={st.planBadge}>Food Truck Verified</div>
            <div style={st.planName}>Grubbid Verified Listing</div>
            <div>
              <span style={st.planPrice}>$59</span>
              <span style={st.planPer}>/ year</span>
            </div>
            <div style={st.planSavings}>Less than $5/month</div>
            <ul style={st.planFeatures}>
              {TRUCK_FEATURES.map((f) => (
                <li key={f} style={st.planFeatureItem}>
                  <span style={st.checkmark}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button type="submit" style={submitBtnStyle(submitting)} disabled={submitting}>
          {submitting ? "Creating account…" : "Continue to Payment →"}
        </button>

        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
          You will be taken to PayPal to complete your $59/year subscription.
        </div>

      </form>
    </div>
  );
}
