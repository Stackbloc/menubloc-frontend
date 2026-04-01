/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/consumer/ConsumerProfile.jsx
 * Purpose:
 *   Consumer account settings page.
 *   Sections: Account info, Food Preferences, Allergen Exclusions, Location.
 *   Supports manual location entry and browser geolocation auto-detect.
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  getConsumerProfile,
  updateConsumerProfile,
  updatePreferences,
  addLocation,
  updateLocation,
  deleteLocation,
} from "../../lib/consumerApi.js";

// ── Dietary preference options ────────────────────────────────────────────
const DIETARY_OPTIONS = [
  { key: "vegetarian",       label: "Vegetarian" },
  { key: "vegan",            label: "Vegan" },
  { key: "gluten_free",      label: "Gluten-free" },
  { key: "dairy_free",       label: "Dairy-free" },
  { key: "low_carb",         label: "Low-carb" },
  { key: "high_protein",     label: "High protein" },
  { key: "low_sodium",       label: "Low sodium" },
  { key: "diabetic_friendly",label: "Diabetic-friendly" },
  { key: "nut_free",         label: "Nut-free" },
  { key: "halal",            label: "Halal" },
  { key: "kosher",           label: "Kosher" },
  { key: "paleo",            label: "Paleo" },
  { key: "keto",             label: "Keto" },
];

// ── Allergen options ──────────────────────────────────────────────────────
const ALLERGEN_OPTIONS = [
  { key: "peanuts",    label: "Peanuts" },
  { key: "tree_nuts",  label: "Tree nuts" },
  { key: "dairy",      label: "Dairy" },
  { key: "gluten",     label: "Gluten" },
  { key: "shellfish",  label: "Shellfish" },
  { key: "soy",        label: "Soy" },
  { key: "eggs",       label: "Eggs" },
  { key: "fish",       label: "Fish" },
  { key: "sesame",     label: "Sesame" },
  { key: "wheat",      label: "Wheat" },
];

// ── Checkbox toggle component ─────────────────────────────────────────────
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

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

// ── Save status indicator ─────────────────────────────────────────────────
function SaveStatus({ status }) {
  if (!status) return null;
  const isError = status.startsWith("Error");
  return (
    <span style={{ ...styles.saveStatus, color: isError ? "#c0392b" : "#1F4E3D" }}>
      {status}
    </span>
  );
}

export default function ConsumerProfile() {
  const { consumer, logout, isAuthenticated, loading: authLoading } = useConsumer();
  const navigate = useNavigate();

  // ── Page data state ────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  // ── Account/profile fields ─────────────────────────────────────────────
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaveStatus, setProfileSaveStatus] = useState(null);

  // ── Dietary preferences ────────────────────────────────────────────────
  const [dietPrefs, setDietPrefs] = useState({});
  const [dietSaveStatus, setDietSaveStatus] = useState(null);

  // ── Allergen preferences ───────────────────────────────────────────────
  const [allergenPrefs, setAllergenPrefs] = useState({});
  const [allergenSaveStatus, setAllergenSaveStatus] = useState(null);

  // ── Location ───────────────────────────────────────────────────────────
  const [savedLocations, setSavedLocations] = useState([]);
  const [locationLabel, setLocationLabel] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationLat, setLocationLat] = useState(null);
  const [locationLng, setLocationLng] = useState(null);
  const [locationSource, setLocationSource] = useState("manual");
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null); // null | loading | denied | error | success
  const [locationSaveStatus, setLocationSaveStatus] = useState(null);

  // ── Load data on mount ─────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const data = await getConsumerProfile();
      const { profile, dietary_preferences, allergen_preferences, saved_locations } = data;

      setDisplayName(profile.display_name || "");
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setAutoDetectEnabled(profile.auto_detect_location_enabled ?? false);

      // Build preference maps for quick toggle lookup
      const dietMap = {};
      for (const p of dietary_preferences) {
        dietMap[p.preference_key] = p.is_enabled;
      }
      setDietPrefs(dietMap);

      const allergenMap = {};
      for (const p of allergen_preferences) {
        allergenMap[p.allergen_key] = p.is_enabled;
      }
      setAllergenPrefs(allergenMap);

      setSavedLocations(saved_locations || []);

      // Pre-fill location form from current default
      const defaultLoc = (saved_locations || []).find((l) => l.is_default);
      if (defaultLoc) {
        setLocationLabel(defaultLoc.label || "");
        setLocationCity(defaultLoc.city || "");
        setLocationState(defaultLoc.state || "");
        setLocationLat(defaultLoc.lat ?? null);
        setLocationLng(defaultLoc.lng ?? null);
        setLocationSource(defaultLoc.source || "manual");
      }
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

  // ── Save profile ───────────────────────────────────────────────────────
  async function saveProfile() {
    setProfileSaveStatus(null);
    try {
      await updateConsumerProfile({
        display_name: displayName.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        auto_detect_location_enabled: autoDetectEnabled,
      });
      setProfileSaveStatus("Saved");
      setTimeout(() => setProfileSaveStatus(null), 2500);
    } catch (err) {
      setProfileSaveStatus(`Error: ${err.message}`);
    }
  }

  // ── Toggle dietary preference ──────────────────────────────────────────
  function toggleDiet(key, value) {
    setDietPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function saveDietPrefs() {
    setDietSaveStatus(null);
    try {
      const dietary_preferences = DIETARY_OPTIONS.map(({ key }) => ({
        key,
        is_enabled: Boolean(dietPrefs[key]),
      }));
      await updatePreferences({ dietary_preferences });
      setDietSaveStatus("Saved");
      setTimeout(() => setDietSaveStatus(null), 2500);
    } catch (err) {
      setDietSaveStatus(`Error: ${err.message}`);
    }
  }

  // ── Toggle allergen preference ─────────────────────────────────────────
  function toggleAllergen(key, value) {
    setAllergenPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function saveAllergenPrefs() {
    setAllergenSaveStatus(null);
    try {
      const allergen_preferences = ALLERGEN_OPTIONS.map(({ key }) => ({
        key,
        is_enabled: Boolean(allergenPrefs[key]),
      }));
      await updatePreferences({ allergen_preferences });
      setAllergenSaveStatus("Saved");
      setTimeout(() => setAllergenSaveStatus(null), 2500);
    } catch (err) {
      setAllergenSaveStatus(`Error: ${err.message}`);
    }
  }

  // ── Auto-detect location ───────────────────────────────────────────────
  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }

    setGeoStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLat(latitude);
        setLocationLng(longitude);
        setLocationSource("autodetect");
        setGeoStatus("success");
        if (!locationLabel) {
          setLocationLabel("Current location");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
        } else {
          setGeoStatus("error");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  // ── Save default location ──────────────────────────────────────────────
  async function saveDefaultLocation() {
    setLocationSaveStatus(null);

    if (!locationLabel.trim()) {
      setLocationSaveStatus("Error: Location label is required");
      return;
    }

    try {
      // Find existing default location to update, or create new
      const existing = savedLocations.find((l) => l.is_default);

      if (existing) {
        const updated = await updateLocation(existing.id, {
          label: locationLabel.trim(),
          lat: locationLat ?? null,
          lng: locationLng ?? null,
          city: locationCity.trim() || null,
          state: locationState.trim() || null,
          source: locationSource,
          is_default: true,
        });
        setSavedLocations((prev) =>
          prev.map((l) => (l.id === existing.id ? updated.location : l))
        );
      } else {
        const created = await addLocation({
          label: locationLabel.trim(),
          lat: locationLat ?? null,
          lng: locationLng ?? null,
          city: locationCity.trim() || null,
          state: locationState.trim() || null,
          source: locationSource,
          is_default: true,
        });
        setSavedLocations((prev) => [...prev, created.location]);
      }

      // Also persist auto_detect_location_enabled preference
      await updateConsumerProfile({ auto_detect_location_enabled: autoDetectEnabled });

      setLocationSaveStatus("Saved");
      setTimeout(() => setLocationSaveStatus(null), 2500);
    } catch (err) {
      setLocationSaveStatus(`Error: ${err.message}`);
    }
  }

  async function handleRemoveLocation(id) {
    try {
      await deleteLocation(id);
      setSavedLocations((prev) => prev.filter((l) => l.id !== id));
      // Clear form if removed was the default
      const removed = savedLocations.find((l) => l.id === id);
      if (removed?.is_default) {
        setLocationLabel("");
        setLocationCity("");
        setLocationState("");
        setLocationLat(null);
        setLocationLng(null);
        setLocationSource("manual");
        setGeoStatus(null);
      }
    } catch (err) {
      setLocationSaveStatus(`Error: ${err.message}`);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  // ── Loading / error guards ─────────────────────────────────────────────
  if (authLoading || pageLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <Link to="/" style={styles.brand}>Grubbid</Link>
          <p style={styles.subheading}>Loading your account…</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <Link to="/" style={styles.brand}>Grubbid</Link>
          <p style={styles.errorBlock}>{pageError}</p>
          <button onClick={loadProfile} style={styles.btn}>Retry</button>
        </div>
      </div>
    );
  }

  const defaultLoc = savedLocations.find((l) => l.is_default);

  return (
    <div style={styles.page}>
      <div style={styles.pageInner}>
        {/* Top nav */}
        <div style={styles.topNav}>
          <Link to="/" style={styles.brand}>Grubbid</Link>
          <button onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
        </div>

        <h1 style={styles.pageTitle}>Account Settings</h1>

        {/* ── Account ── */}
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

          <div style={styles.saveRow}>
            <button onClick={saveProfile} style={styles.saveBtn}>Save account info</button>
            <SaveStatus status={profileSaveStatus} />
          </div>
        </Section>

        {/* ── Food Preferences ── */}
        <Section title="Food Preferences">
          <p style={styles.sectionDesc}>
            Select your dietary preferences. These help personalize your search results.
          </p>
          <div style={styles.prefGrid}>
            {DIETARY_OPTIONS.map(({ key, label }) => (
              <PreferenceToggle
                key={key}
                label={label}
                checked={Boolean(dietPrefs[key])}
                onChange={(v) => toggleDiet(key, v)}
              />
            ))}
          </div>
          <div style={styles.saveRow}>
            <button onClick={saveDietPrefs} style={styles.saveBtn}>Save food preferences</button>
            <SaveStatus status={dietSaveStatus} />
          </div>
        </Section>

        {/* ── Allergen Exclusions ── */}
        <Section title="Allergen Exclusions">
          <p style={styles.sectionDesc}>
            Select allergens you want to avoid. Checked items will be flagged in your experience.
          </p>
          <div style={styles.prefGrid}>
            {ALLERGEN_OPTIONS.map(({ key, label }) => (
              <PreferenceToggle
                key={key}
                label={label}
                checked={Boolean(allergenPrefs[key])}
                onChange={(v) => toggleAllergen(key, v)}
              />
            ))}
          </div>
          <div style={styles.saveRow}>
            <button onClick={saveAllergenPrefs} style={styles.saveBtn}>Save allergen settings</button>
            <SaveStatus status={allergenSaveStatus} />
          </div>
        </Section>

        {/* ── Location ── */}
        <Section title="Default Location">
          <p style={styles.sectionDesc}>
            Your default location is used to improve search results.
          </p>

          {defaultLoc && (
            <div style={styles.currentLocation}>
              <span style={styles.locationIcon}>📍</span>
              <div>
                <strong>{defaultLoc.label}</strong>
                {(defaultLoc.city || defaultLoc.state) && (
                  <span style={styles.locationDetail}>
                    {" — "}{[defaultLoc.city, defaultLoc.state].filter(Boolean).join(", ")}
                  </span>
                )}
                <span style={styles.sourceTag}>
                  {defaultLoc.source === "autodetect" ? "Auto-detected" : "Manual"}
                </span>
              </div>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Location label</label>
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              style={styles.input}
              placeholder="e.g. Home, Work, Los Angeles, CA"
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>City</label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                style={styles.input}
                placeholder="City"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>State</label>
              <input
                type="text"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                style={styles.input}
                placeholder="State"
              />
            </div>
          </div>

          {locationLat && locationLng && (
            <p style={styles.coordsNote}>
              Coordinates: {locationLat.toFixed(5)}, {locationLng.toFixed(5)}
              {" "}<span style={styles.sourceTag}>{locationSource === "autodetect" ? "Auto-detected" : "Manual"}</span>
            </p>
          )}

          {/* Auto-detect button */}
          <button
            type="button"
            onClick={detectLocation}
            disabled={geoStatus === "loading"}
            style={styles.geoBtn}
          >
            {geoStatus === "loading" ? "Detecting…" : "Use My Current Location"}
          </button>

          {/* Geolocation status messages */}
          {geoStatus === "denied" && (
            <p style={styles.geoError}>
              Location permission was denied. Enable it in your browser settings, or enter your location manually above.
            </p>
          )}
          {geoStatus === "error" && (
            <p style={styles.geoError}>
              Could not detect your location. Please enter it manually above.
            </p>
          )}
          {geoStatus === "success" && (
            <p style={styles.geoSuccess}>
              Location detected. Add a label and save to use it as your default.
            </p>
          )}

          {/* Auto-detect toggle */}
          <label style={styles.autoDetectToggle}>
            <input
              type="checkbox"
              checked={autoDetectEnabled}
              onChange={(e) => setAutoDetectEnabled(e.target.checked)}
              style={styles.checkbox}
            />
            <span style={styles.prefLabel}>Auto-detect my location when possible</span>
          </label>

          <div style={styles.saveRow}>
            <button onClick={saveDefaultLocation} style={styles.saveBtn}>Save default location</button>
            <SaveStatus status={locationSaveStatus} />
          </div>

          {/* All saved locations list */}
          {savedLocations.length > 0 && (
            <div style={styles.locationList}>
              <p style={styles.locationListTitle}>Saved locations</p>
              {savedLocations.map((loc) => (
                <div key={loc.id} style={styles.locationRow}>
                  <div style={styles.locationRowInfo}>
                    <strong>{loc.label}</strong>
                    {loc.is_default && <span style={styles.defaultBadge}>Default</span>}
                    <span style={styles.sourceTag}>
                      {loc.source === "autodetect" ? "Auto-detected" : "Manual"}
                    </span>
                    {(loc.city || loc.state) && (
                      <span style={styles.locationDetail}>
                        {[loc.city, loc.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveLocation(loc.id)}
                    style={styles.removeBtn}
                    aria-label={`Remove ${loc.label}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
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
  saveStatus: {
    fontSize: "13px",
    fontWeight: 600,
  },
  prefGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "10px",
    marginBottom: "18px",
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
    cursor: "pointer",
    flexShrink: 0,
  },
  prefLabel: {
    fontSize: "14px",
    color: "#0f1720",
    lineHeight: 1.4,
  },
  currentLocation: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "#f0f7f4",
    border: "1px solid #c3dfd5",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "18px",
    fontSize: "14px",
    color: "#0f1720",
  },
  locationIcon: {
    fontSize: "18px",
    flexShrink: 0,
    marginTop: "1px",
  },
  locationDetail: {
    color: "#666",
    marginLeft: "4px",
  },
  sourceTag: {
    display: "inline-block",
    background: "#e8f5f0",
    color: "#1F4E3D",
    fontSize: "11px",
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: "4px",
    marginLeft: "8px",
    verticalAlign: "middle",
  },
  coordsNote: {
    fontSize: "13px",
    color: "#666",
    margin: "0 0 14px",
  },
  geoBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "9px 16px",
    borderRadius: "8px",
    background: "#fff",
    border: "1.5px solid #1F4E3D",
    color: "#1F4E3D",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: "12px",
  },
  geoError: {
    fontSize: "13px",
    color: "#c0392b",
    background: "#fff3f3",
    border: "1px solid #f5c6c6",
    borderRadius: "8px",
    padding: "10px 14px",
    margin: "0 0 14px",
    lineHeight: 1.5,
  },
  geoSuccess: {
    fontSize: "13px",
    color: "#1F4E3D",
    background: "#f0f7f4",
    border: "1px solid #c3dfd5",
    borderRadius: "8px",
    padding: "10px 14px",
    margin: "0 0 14px",
  },
  autoDetectToggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  locationList: {
    marginTop: "24px",
    borderTop: "1px solid #e8e8e4",
    paddingTop: "16px",
  },
  locationListTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#666",
    margin: "0 0 12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  locationRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f0f0ec",
    gap: "12px",
  },
  locationRowInfo: {
    fontSize: "14px",
    color: "#0f1720",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px",
  },
  defaultBadge: {
    background: "#1F4E3D",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: "4px",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#c0392b",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "4px 8px",
    flexShrink: 0,
  },
  errorBlock: {
    background: "#fff3f3",
    border: "1px solid #f5c6c6",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#c0392b",
    margin: "0 0 20px",
  },
  btn: {
    padding: "10px 20px",
    borderRadius: "10px",
    background: "#1F4E3D",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
    margin: "80px auto",
  },
  subheading: {
    fontSize: "15px",
    color: "#666",
    margin: 0,
  },
};
