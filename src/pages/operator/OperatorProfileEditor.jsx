/**
 * src/pages/operator/OperatorProfileEditor.jsx
 *
 * Route: /operator/profile
 *
 * Sections (visibility controlled by plan benefits):
 *   • Core fields — always visible (profile_edit)
 *   • About Us    — benefit: about_us
 *   • Logo        — benefit: logo_upload  (URL input for MVP; file input ready)
 *   • Featured dish — benefit: featured_dish
 *
 * Pattern: edits go to draft → Publish makes them live.
 * Locked fields show an upgrade notice instead of the input.
 */

// TAXONOMY GUARDRAIL: This file must NOT define local cuisine or category arrays.
// Load from /api/meta/cuisines and /api/meta/categories only.
// The backend src/lib/restaurantTaxonomy.js is the single source of truth.
// Hardcoding options here silently diverges from backend validation rules.

import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { API_BASE } from "../../lib/operatorApi.js";
import RestaurantStatusSettingsPanel from "../../components/restaurant/RestaurantStatusSettingsPanel.jsx";

const INPUT = {
  width: "100%",
  padding: "10px 13px",
  fontSize: 13,
  border: "1.5px solid #e4e9f0",
  borderRadius: 9,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const INPUT_LOCKED = {
  ...INPUT,
  background: "#f4f3ef",
  color: "#5b6675",
  cursor: "not-allowed",
};

const TEXTAREA = { ...INPUT, resize: "vertical", minHeight: 90 };

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 700, color: "#5b6675", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}{required && <span style={{ color: "#b91c1c", marginLeft: 3 }}>*</span>}
    </label>
  );
}

function LockedField({ benefitName }) {
  return (
    <div style={{
      padding: "12px 14px",
      background: "#f8f7f4",
      border: "1.5px dashed #d7deea",
      borderRadius: 9,
      fontSize: 12,
      color: "#8a9ab0",
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    }}>
      <span style={{ fontSize: 14 }}>🔒</span>
      <span>
        <strong>{benefitName}</strong> is not included in your current plan.{" "}
        <a href="/operator/subscription" style={{ color: "#1F4E3D", fontWeight: 700 }}>Upgrade →</a>
      </span>
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f1720" }}>{title}</h2>
        {sub && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8a9ab0" }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export default function OperatorProfileEditor() {
  const { t } = useLanguage();
  const { selectedRestaurant } = useOperator();
  const location = useLocation();
  const rid = selectedRestaurant?.id;
  const setup = location.search.includes("setup=");

  const [profile, setProfile]   = useState(null);
  const [benefits, setBenefits] = useState({});
  const [allItems, setAllItems] = useState([]); // for featured dish picker
  const [form, setForm]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError]       = useState("");
  const [cuisineOptions, setCuisineOptions] = useState([]); // [{value, label}] from API
  const [categoryOptions, setCategoryOptions] = useState([]); // [{value, label}] from API

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const publicProfileHref = useMemo(() => {
    const slugOrId = profile?.slug || rid;
    return slugOrId ? `/restaurants/${encodeURIComponent(String(slugOrId))}` : null;
  }, [profile?.slug, rid]);

  // Load taxonomy from backend — single source of truth
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/meta/cuisines`).then(r => r.json()).catch(() => ({ ok: false })),
      fetch(`${API_BASE}/api/meta/categories`).then(r => r.json()).catch(() => ({ ok: false })),
    ]).then(([cuisineData, categoryData]) => {
      if (cuisineData.ok && Array.isArray(cuisineData.cuisines)) {
        setCuisineOptions(cuisineData.cuisines); // pre-sorted alphabetically by backend
      }
      if (categoryData.ok && Array.isArray(categoryData.categories)) {
        setCategoryOptions(categoryData.categories); // pre-sorted alphabetically by backend
      }
    });
  }, []);

  useEffect(() => {
    if (!rid) return;
    setLoading(true);
    Promise.all([
      api.getProfile(rid),
      api.getMenus(rid).then(async d => {
        const menus = d.menus || [];
        const allItemArrays = await Promise.all(
          menus.map(m => api.getMenuItems(rid, m.id).then(r => r.items || []).catch(() => []))
        );
        return allItemArrays.flat();
      }).catch(() => []),
    ])
      .then(([profileData, items]) => {
        const p = profileData.profile || {};
        setProfile(p);
        setBenefits(profileData.benefits || {});
        setAllItems(items);
        // Initialise form from live values (not draft)
        setForm({
          restaurant_name: p.restaurant_name || "",
          cuisine:         p.cuisine || "",
          category:        p.category || "",
          phone:           p.phone || "",
          website_url:     p.website_url || "",
          instagram:       p.instagram || "",
          bio:             p.bio || "",
          about_us:        p.about_us || "",
          logo_url:        p.logo_url || "",
          featured_menu_item_id: p.featured_menu_item_id || "",
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [rid]);

  const hasBenefit = (key) => benefits[key]?.is_enabled === true;

  async function saveProfileDraft() {
    try {
      // restaurant_name is identity-locked — never include in draft/publish payload.
      const payload = {
        cuisine:         form.cuisine,
        category:        form.category,
        phone:           form.phone,
        website_url:     form.website_url,
        instagram:       form.instagram,
        bio:             form.bio,
      };
      if (hasBenefit("about_us")) payload.about_us = form.about_us;
      await api.updateProfile(rid, payload);

      // Logo URL change (direct update, not draft)
      if (hasBenefit("logo_upload") && form.logo_url !== profile.logo_url) {
        const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
        await fetch(`${API}/operator/restaurants/${rid}/profile/logo`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo_url: form.logo_url }),
        });
      }

      // Featured dish (direct update)
      if (hasBenefit("featured_dish")) {
        const itemId = form.featured_menu_item_id || null;
        await api.setFeaturedDish(rid, itemId);
      }
    } catch (e) {
      throw e;
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setPublished(false);
    setError("");
    try {
      await saveProfileDraft();
      setSaved(true);
    } catch (e) {
      console.error("[operator-profile] save failed", e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublished(false);
    setSaved(false);
    setError("");
    try {
      await saveProfileDraft();
      const publishResult = await api.publishProfile(rid);
      const refreshed = await api.getProfile(rid);
      const refreshedProfile = refreshed.profile || publishResult.profile || null;
      const slugOrId = refreshedProfile?.slug || rid;
      const publicRes = await fetch(`${API_BASE}/public/restaurants/${encodeURIComponent(String(slugOrId))}`);
      const publicData = await publicRes.json().catch(() => ({}));
      if (!publicRes.ok || publicData?.ok === false) {
        throw new Error(publicData.error || "Public profile could not be reloaded after publish.");
      }

      // Public API nests fields under `restaurant` and uses `name` (not restaurant_name).
      const publicRestaurant = publicData.restaurant || publicData;
      const publicName = String(publicRestaurant.name || publicRestaurant.restaurant_name || "").trim();
      const publicCategory = String(publicRestaurant.category || "").trim();
      const publicPhone = String(publicRestaurant.phone || "").trim();
      const publicWebsite = String(publicRestaurant.website || publicRestaurant.website_url || "").trim();

      const mismatches = [];
      if (String(refreshedProfile?.restaurant_name || "").trim() !== publicName) mismatches.push("name");
      if (String(refreshedProfile?.category || "").trim() !== publicCategory) mismatches.push("type");
      if (String(refreshedProfile?.phone || "").trim() !== publicPhone) mismatches.push("phone");
      if (String(refreshedProfile?.website_url || "").trim() !== publicWebsite) mismatches.push("website");
      // bio/instagram are not returned by operator GET profile (stubbed NULL) — skip verify
      if (mismatches.length) {
        console.error("[operator-profile] publish verification mismatch", {
          mismatches,
          draft: refreshedProfile,
          public: publicRestaurant,
        });
        throw new Error(`Publish completed, but the public profile did not update for: ${mismatches.join(", ")}.`);
      }

      setProfile(refreshedProfile);
      setPublished(true);
    } catch (e) {
      console.error("[operator-profile] publish failed", e);
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  }

  if (!rid) {
    return (
      <OperatorLayout title="Profile">
        <p style={{ color: "#8a9ab0" }}>{t("operator.selectRestaurantProfile", "Select a restaurant to edit its profile.")}</p>
      </OperatorLayout>
    );
  }

  if (loading) {
    return (
      <OperatorLayout title="Profile">
        <p style={{ color: "#8a9ab0" }}>{t("operator.loading", "Loading…")}</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Profile">
      <div style={{ maxWidth: 680 }}>
        {setup && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1d4ed8", marginBottom: 20 }}>
            Complete your profile, then publish it to make your public page live.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "10px 14px",
            color: "#b91c1c", fontSize: 13, marginBottom: 20,
            display: "flex", justifyContent: "space-between",
          }}>
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Status banners */}
        {saved && !published && (
          <div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#854d0e", marginBottom: 20 }}>
            Draft saved. Click <strong>Publish</strong> to make changes live.
          </div>
        )}
        {published && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#16a34a", marginBottom: 20 }}>
            Profile published — changes are now live.{" "}
            {publicProfileHref && (
              <a href={publicProfileHref} target="_blank" rel="noreferrer" style={{ color: "#166534", fontWeight: 700 }}>
                View Public Profile ↗
              </a>
            )}
          </div>
        )}

        {/* ── Core Info ──────────────────────────────────────────────── */}
        <Section title="Restaurant info" sub="Basic details shown on your public listing.">
          <div className="operator-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Restaurant name</Label>
              <input
                style={INPUT_LOCKED}
                value={form.restaurant_name || ""}
                readOnly
                aria-readonly="true"
              />
              <div style={{ marginTop: 5, fontSize: 11, color: "#b0bbc8" }}>
                Protected listing identity — must match the Menuply / Common Knowledge restaurant name and cannot be edited here.
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Cuisine</Label>
              <select
                value={form.cuisine || ""}
                onChange={(e) => setForm(p => ({ ...p, cuisine: e.target.value }))}
                style={{ ...INPUT, cursor: "pointer", appearance: "auto" }}
              >
                <option value="">Select cuisine…</option>
                {form.cuisine && !cuisineOptions.some(o => o.value === form.cuisine) && (
                  <option value={form.cuisine}>{form.cuisine} (legacy — please update)</option>
                )}
                {cuisineOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Restaurant type</Label>
              <select
                value={form.category || ""}
                onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ ...INPUT, cursor: "pointer", appearance: "auto" }}
              >
                <option value="">Select type…</option>
                {form.category && !categoryOptions.some(o => o.value === form.category) && (
                  <option value={form.category}>{form.category} (legacy — please update)</option>
                )}
                {categoryOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Website</Label>
              <input
                style={INPUT}
                value={form.website_url}
                onChange={f("website_url")}
                placeholder="https://your-restaurant.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <input style={INPUT} value={form.phone} onChange={f("phone")} placeholder="(555) 555-5555" />
            </div>
            <div>
              <Label>Instagram</Label>
              <input style={INPUT} value={form.instagram} onChange={f("instagram")} placeholder="@handle" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Short bio</Label>
              <textarea style={TEXTAREA} value={form.bio} onChange={f("bio")} placeholder="One or two sentences about your restaurant." />
            </div>
          </div>
        </Section>

        {/* ── Restaurant Status ───────────────────────────────────────── */}
        <Section
          title="Restaurant Status"
          sub="Optional banners on your public profile (Now Hiring, Happy Hour, Live Music, and more). Changes go live immediately."
        >
          <RestaurantStatusSettingsPanel restaurantId={rid} />
        </Section>

        {/* ── About Us ────────────────────────────────────────────────── */}
        <Section title="About Us" sub="Add a fuller restaurant description for your public profile. Available on paid plans.">
          {hasBenefit("about_us") ? (
            <textarea
              style={{ ...TEXTAREA, minHeight: 130 }}
              value={form.about_us}
              onChange={f("about_us")}
              placeholder="Tell your story — where you started, what makes you different, what guests love most."
            />
          ) : (
            <LockedField benefitName="About Us section" />
          )}
        </Section>

        {/* ── Logo ───────────────────────────────────────────────────── */}
        <Section title="Logo" sub="Square image recommended. 512×512px minimum.">
          {hasBenefit("logo_upload") ? (
            <div className="operator-responsive-row" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {form.logo_url && (
                <img
                  src={form.logo_url}
                  alt="logo preview"
                  style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: "1px solid #e4e9f0", flexShrink: 0 }}
                  onError={e => { e.target.style.display = "none"; }}
                />
              )}
              <div style={{ flex: 1 }}>
                <Label>Logo URL</Label>
                <input
                  style={INPUT}
                  value={form.logo_url}
                  onChange={f("logo_url")}
                  placeholder="https://your-cdn.com/logo.png"
                />
                <div style={{ fontSize: 11, color: "#b0bbc8", marginTop: 5 }}>
                  Paste a public image URL. File upload coming soon.
                </div>
              </div>
            </div>
          ) : (
            <LockedField benefitName="Logo upload" />
          )}
        </Section>

        {/* ── Featured Dish ───────────────────────────────────────────── */}
        <Section title="Featured dish" sub="One item pinned at the top of your listing. Pick your best seller.">
          {hasBenefit("featured_dish") ? (
            allItems.length === 0 ? (
              <div style={{ fontSize: 13, color: "#8a9ab0" }}>
                Add menu items first, then come back to pin a featured dish.
              </div>
            ) : (
              <select
                style={{ ...INPUT, cursor: "pointer" }}
                value={form.featured_menu_item_id || ""}
                onChange={f("featured_menu_item_id")}
              >
                <option value="">— None —</option>
                {allItems.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name}{i.price != null ? ` · $${Number(i.price).toFixed(2)}` : ""}
                  </option>
                ))}
              </select>
            )
          ) : (
            <LockedField benefitName="Featured dish" />
          )}
        </Section>

        {/* ── Action bar ─────────────────────────────────────────────── */}
        <div className="operator-responsive-actions" style={{
          display: "flex",
          gap: 12,
          paddingTop: 24,
          borderTop: "1px solid #e4e9f0",
        }}>
          <button
            onClick={handleSave}
            disabled={saving || publishing}
            style={{
              background: "#f4f3ef", color: "#0f1720",
              border: "none", borderRadius: 10,
              padding: "11px 24px", fontSize: 14, fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving || publishing}
            style={{
              background: "#1F4E3D", color: "#fff",
              border: "none", borderRadius: 10,
              padding: "11px 28px", fontSize: 14, fontWeight: 700,
              cursor: publishing ? "not-allowed" : "pointer",
              opacity: publishing ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {publishing ? "Publishing…" : "Publish changes"}
          </button>
          <a
            href={publicProfileHref || "#"}
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center",
              fontSize: 13, color: "#1F4E3D", fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Preview Public Profile ↗
          </a>
        </div>
      </div>
    </OperatorLayout>
  );
}
