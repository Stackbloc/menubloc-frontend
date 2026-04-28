/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/consumer/ConsumerProfile.jsx
 * Purpose:
 *   Consumer account settings page.
 *   Single-save profile/preferences workflow.
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import {
  getConsumerProfile,
  updateConsumerProfile,
  updatePreferences,
} from "../../lib/consumerApi.js";

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten_free", label: "Gluten-free" },
  { key: "dairy_free", label: "Dairy-free" },
  { key: "low_carb", label: "Low-carb" },
  { key: "high_protein", label: "High protein" },
  { key: "low_sodium", label: "Low sodium" },
  { key: "diabetic_friendly", label: "Diabetic-friendly" },
  { key: "nut_free", label: "Nut-free" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Kosher" },
  { key: "paleo", label: "Paleo" },
  { key: "keto", label: "Keto" },
];

const ALLERGEN_OPTIONS = [
  { key: "peanuts", label: "Peanuts" },
  { key: "tree_nuts", label: "Tree nuts" },
  { key: "dairy", label: "Dairy" },
  { key: "gluten", label: "Gluten" },
  { key: "shellfish", label: "Shellfish" },
  { key: "soy", label: "Soy" },
  { key: "eggs", label: "Eggs" },
  { key: "fish", label: "Fish" },
  { key: "sesame", label: "Sesame" },
  { key: "wheat", label: "Wheat" },
];

function PreferenceToggle({ label, checked, onChange }) {
  return (
    <label style={styles.prefToggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={styles.checkbox}
      />
      <span style={styles.prefLabel}>{label}</span>
    </label>
  );
}

function Section({ title, children, id }) {
  return (
    <div id={id} style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function SaveStatus({ status, isError = false }) {
  if (!status) return null;
  return (
    <span style={{ ...styles.saveStatus, color: isError ? "#c0392b" : "#1F4E3D" }}>
      {status}
    </span>
  );
}

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function ConsumerProfile() {
  const { consumer, logout, isAuthenticated, loading: authLoading, refreshSession } = useConsumer();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [dietPrefs, setDietPrefs] = useState({});
  const [allergenPrefs, setAllergenPrefs] = useState({});
  const [savedLocations, setSavedLocations] = useState([]);
  const [coinsWallet, setCoinsWallet] = useState({
    balance_cents: 0,
    lifetime_earned_cents: 0,
    lifetime_redeemed_cents: 0,
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setPageError(null);
      const data = await getConsumerProfile();
      const { profile, dietary_preferences, allergen_preferences, saved_locations, coins_wallet } = data;

      setDisplayName(profile.display_name || "");
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");

      const dietMap = {};
      for (const pref of dietary_preferences || []) {
        dietMap[pref.preference_key] = pref.is_enabled;
      }
      setDietPrefs(dietMap);

      const allergenMap = {};
      for (const pref of allergen_preferences || []) {
        allergenMap[pref.allergen_key] = pref.is_enabled;
      }
      setAllergenPrefs(allergenMap);

      setSavedLocations(saved_locations || []);
      setCoinsWallet({
        balance_cents: Number(coins_wallet?.balance_cents || 0),
        lifetime_earned_cents: Number(coins_wallet?.lifetime_earned_cents || 0),
        lifetime_redeemed_cents: Number(coins_wallet?.lifetime_redeemed_cents || 0),
      });
    } catch (err) {
      setPageError(err.message || "Failed to load profile");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account/login", { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated) {
      loadProfile();
    }
  }, [authLoading, isAuthenticated, navigate, loadProfile]);

  function toggleDiet(key, value) {
    setDietPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAllergen(key, value) {
    setAllergenPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfilePreferences() {
    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const dietary_preferences = DIETARY_OPTIONS.map(({ key }) => ({
        key,
        is_enabled: Boolean(dietPrefs[key]),
      }));
      const allergen_preferences = ALLERGEN_OPTIONS.map(({ key }) => ({
        key,
        is_enabled: Boolean(allergenPrefs[key]),
      }));

      await Promise.all([
        updateConsumerProfile({
          display_name: displayName.trim() || null,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          phone: phone.trim() || null,
        }),
        updatePreferences({
          dietary_preferences,
          allergen_preferences,
        }),
      ]);

      await refreshSession().catch(() => {});
      setSaveMessage("Profile preferences saved.");
    } catch (err) {
      setSaveError(err.message || "Could not save profile preferences.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  if (authLoading || pageLoading) {
    return (
      <>
      <StickyPageHeader title="Account" />
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.subheading}>Loading your account…</p>
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  if (pageError) {
    return (
      <>
      <StickyPageHeader title="Account" />
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.errorBlock}>{pageError}</p>
          <button onClick={loadProfile} style={styles.retryBtn}>Retry</button>
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  const defaultLoc = savedLocations.find((location) => location.is_default);
  const locationSummary = defaultLoc
    ? [
        defaultLoc.label || "",
        [defaultLoc.city, defaultLoc.state].filter(Boolean).join(", "),
      ].filter(Boolean).join(" — ")
    : "";

  return (
    <>
    <StickyPageHeader title="Account" />
    <div style={styles.page}>
      <div style={styles.pageInner}>
        <h1 style={styles.pageTitle}>Account Settings</h1>

        <Section title="Following">
          <p style={styles.sectionDesc}>
            See the restaurants you follow and remove them from one place.
          </p>
          <Link to="/account/following" style={styles.followingLink}>Open Following feed</Link>
        </Section>

        <Section title="Account">
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Email</label>
            <p style={styles.readOnly}>{consumer?.email}</p>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={styles.input}
                placeholder="First name"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={styles.input}
                placeholder="Last name"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Display name <span style={styles.optText}>(optional)</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={styles.input}
              placeholder="How you want to be known"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Phone <span style={styles.optText}>(optional)</span></label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </Section>

        <Section title="Food Preferences">
          <p style={styles.sectionDesc}>
            Select your dietary preferences. These personalize discovery without needing a separate save step.
          </p>
          <div style={styles.prefGrid}>
            {DIETARY_OPTIONS.map(({ key, label }) => (
              <PreferenceToggle
                key={key}
                label={label}
                checked={Boolean(dietPrefs[key])}
                onChange={(value) => toggleDiet(key, value)}
              />
            ))}
          </div>
        </Section>

        <Section title="Allergen Exclusions" id="allergen-preferences">
          <p style={styles.sectionDesc}>
            Select allergens you want to avoid. These settings control the allergen filter status shown across discovery.
          </p>
          <div style={styles.prefGrid}>
            {ALLERGEN_OPTIONS.map(({ key, label }) => (
              <PreferenceToggle
                key={key}
                label={label}
                checked={Boolean(allergenPrefs[key])}
                onChange={(value) => toggleAllergen(key, value)}
              />
            ))}
          </div>
        </Section>

        <Section title="Default Location">
          {locationSummary ? (
            <div style={styles.currentLocation}>
              <span style={styles.locationIcon}>📍</span>
              <div>
                <strong>{locationSummary}</strong>
                <div style={styles.locationHint}>
                  Change your default search location from Discovery.
                </div>
              </div>
            </div>
          ) : (
            <p style={styles.sectionDesc}>
              Default search location can be set or changed from the Discovery screen.
            </p>
          )}
        </Section>

        <Section title="G-Coins">
          <p style={styles.sectionDesc}>
            Platform credit applied automatically toward qualifying Menuply Checkout orders.
          </p>
          <div style={styles.coinsGrid}>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Available balance</span>
              <strong style={styles.coinValue}>{formatMoney(coinsWallet.balance_cents)}</strong>
            </div>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Lifetime earned</span>
              <strong style={styles.coinValue}>{formatMoney(coinsWallet.lifetime_earned_cents)}</strong>
            </div>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Lifetime redeemed</span>
              <strong style={styles.coinValue}>{formatMoney(coinsWallet.lifetime_redeemed_cents)}</strong>
            </div>
          </div>
        </Section>

        <Section title="Save">
          <p style={styles.sectionDesc}>
            Save all profile preferences in one action.
          </p>
          <div style={styles.saveRow}>
            <button
              type="button"
              onClick={saveProfilePreferences}
              style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : null) }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile Preferences"}
            </button>
            <SaveStatus status={saveError || saveMessage} isError={Boolean(saveError)} />
          </div>
          {saveMessage ? (
            <div style={styles.discoveryCtaRow}>
              <button type="button" onClick={() => navigate("/")} style={styles.discoveryBtn}>
                Go to Discovery
              </button>
            </div>
          ) : null}
        </Section>
        <Section title="Sign out">
          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
        </Section>
      </div>
    </div>
    <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f6f3",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "0 0 60px",
  },
  pageInner: {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "0 16px",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 0",
    borderBottom: "1px solid #e8e8e4",
    marginBottom: "32px",
  },
  brand: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#1F4E3D",
    textDecoration: "none",
  },
  logoutBtn: {
    background: "none",
    border: "1.5px solid #ccc",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#555",
    fontFamily: "inherit",
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#0f1720",
    marginBottom: "32px",
  },
  section: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "28px",
    marginBottom: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#0f1720",
    margin: "0 0 16px",
  },
  sectionDesc: {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
    marginBottom: "14px",
  },
  row: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  fieldLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#444",
  },
  optText: {
    fontWeight: 400,
    color: "#999",
    fontSize: "12px",
  },
  readOnly: {
    fontSize: "15px",
    color: "#0f1720",
    margin: 0,
    padding: "10px 14px",
    background: "#f6f6f3",
    borderRadius: "8px",
    border: "1.5px solid #e8e8e4",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  saveRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginTop: "6px",
    flexWrap: "wrap",
  },
  saveBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    background: "#1F4E3D",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  saveBtnDisabled: {
    opacity: 0.72,
    cursor: "default",
  },
  saveStatus: {
    fontSize: "13px",
    fontWeight: 600,
  },
  prefGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "10px",
  },
  prefToggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#1F4E3D",
    flexShrink: 0,
  },
  prefLabel: {
    fontSize: "14px",
    color: "#0f1720",
  },
  coinsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  coinTile: {
    borderRadius: "12px",
    border: "1px solid #e8e8e4",
    background: "#f9faf7",
    padding: "14px 16px",
    display: "grid",
    gap: "6px",
  },
  coinLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  coinValue: {
    fontSize: "22px",
    color: "#11211a",
  },
  currentLocation: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "14px 16px",
    background: "#f6f6f3",
    borderRadius: "10px",
  },
  locationIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },
  locationHint: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#667085",
    fontWeight: 500,
  },
  discoveryCtaRow: {
    marginTop: "14px",
    display: "flex",
    alignItems: "center",
  },
  discoveryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #cfd8d3",
    background: "#fff",
    color: "#11211a",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  followingLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "10px",
    background: "#1F4E3D",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  card: {
    maxWidth: "520px",
    margin: "80px auto 0",
    padding: "28px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  subheading: {
    fontSize: "15px",
    color: "#555",
    marginTop: "14px",
  },
  errorBlock: {
    fontSize: "15px",
    color: "#c0392b",
    marginTop: "14px",
    lineHeight: 1.6,
  },
  retryBtn: {
    marginTop: "16px",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#1F4E3D",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
