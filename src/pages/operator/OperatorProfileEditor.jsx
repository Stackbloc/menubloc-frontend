/**
 * src/pages/operator/OperatorProfileEditor.jsx
 *
 * Restaurant public-profile editor form.
 * Primary home: /operator/my-account (My Account).
 * /operator/profile redirects to My Account.
 *
 * Sections (visibility controlled by plan benefits):
 *   • Core fields — always visible (profile_edit): cuisine, type, contact, address
 *   • About Us    — benefit: about_us
 *   • Logo        — benefit: logo_upload
 *   • Featured dish — benefit: featured_dish
 *
 * Pattern: edits go to draft → Publish makes them live.
 */

// TAXONOMY GUARDRAIL: This file must NOT define local cuisine or category arrays.
// Load from /api/meta/cuisines and /api/meta/categories only.
// The backend src/lib/restaurantTaxonomy.js is the single source of truth.
// Hardcoding options here silently diverges from backend validation rules.

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { API_BASE } from "../../lib/operatorApi.js";
import RestaurantStatusSettingsPanel from "../../components/restaurant/RestaurantStatusSettingsPanel.jsx";
import RestaurantStyleSelector from "../../components/operator/RestaurantStyleSelector.jsx";
import {
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../../lib/restaurantOnboardingState.js";

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

export function OperatorRestaurantProfileForm({ embedded = false } = {}) {
  const { t } = useLanguage();
  const { selectedRestaurant } = useOperator();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rid = selectedRestaurant?.id;
  const setup = location.search.includes("setup=");
  const isOnboardingProfile = searchParams.get("onboarding") === "1";

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
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const logoFileRef = useRef(null);
  const bannerFileRef = useRef(null);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const publicProfileHref = useMemo(() => {
    const slugOrId = profile?.slug || rid;
    return slugOrId ? `/restaurants/${encodeURIComponent(String(slugOrId))}` : null;
  }, [profile?.slug, rid]);

  function mediaUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
    return `${API_BASE}${s.startsWith("/") ? "" : "/"}${s}`;
  }

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
        setBannerUrl(p.hero_image_url || "");
        // Initialise form from live values (not draft)
        setForm({
          restaurant_name: p.restaurant_name || "",
          cuisine:         p.cuisine || "",
          category:        p.category || "",
          address_line1:   p.address_line1 || "",
          address_line2:   p.address_line2 || "",
          city:            p.city || "",
          state:           p.state || "",
          postal_code:     p.postal_code || "",
          phone:           p.phone || "",
          website_url:     p.website_url || "",
          about_us:        p.about_us || "",
          logo_url:        p.logo_url || "",
          featured_menu_item_id: p.featured_menu_item_id || "",
          // null = Use Recommended Style (auto from category/cuisine)
          profile_style_key:
            p.profile_style_key === undefined || p.profile_style_key === ""
              ? null
              : p.profile_style_key,
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [rid]);

  const hasBenefit = (key) => benefits[key]?.is_enabled === true;

  async function handleLogoFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !rid) return;
    setLogoUploading(true);
    setError("");
    try {
      const result = await api.uploadProfileLogo(rid, file);
      const nextUrl = result.logo_url || "";
      setForm((p) => ({ ...p, logo_url: nextUrl }));
      setProfile((p) => (p ? { ...p, logo_url: nextUrl } : p));
    } catch (err) {
      setError(err.message || "Logo upload failed.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleBannerFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !rid) return;
    setBannerUploading(true);
    setError("");
    try {
      const result = await api.uploadProfileBanner(rid, file);
      setBannerUrl(result.hero_image_url || "");
    } catch (err) {
      setError(err.message || "Banner upload failed.");
    } finally {
      setBannerUploading(false);
    }
  }

  async function handleRemoveBanner() {
    if (!rid || !bannerUrl) return;
    setBannerUploading(true);
    setError("");
    try {
      await api.removeProfileBanner(rid);
      setBannerUrl("");
    } catch (err) {
      setError(err.message || "Could not remove banner.");
    } finally {
      setBannerUploading(false);
    }
  }

  async function saveProfileDraft() {
    try {
      // restaurant_name is identity-locked — never include in draft/publish payload.
      const payload = {
        cuisine:         form.cuisine,
        category:        form.category,
        address_line1:   form.address_line1,
        address_line2:   form.address_line2,
        city:            form.city,
        state:           form.state,
        postal_code:     form.postal_code,
        phone:           form.phone,
        website_url:     form.website_url,
        // Explicit null clears manual override (Use Recommended Style)
        profile_style_key: form.profile_style_key == null ? null : form.profile_style_key,
      };
      if (hasBenefit("about_us")) payload.about_us = form.about_us;
      await api.updateProfile(rid, payload);

      // Logo URL change (direct update, not draft)
      if (hasBenefit("logo_upload") && form.logo_url !== profile.logo_url) {
        await fetch(`${API_BASE}/operator/restaurants/${rid}/profile/logo`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo_url: form.logo_url }),
        }).then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok || data.ok === false) throw new Error(data.error || "Logo URL update failed");
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

      if (isOnboardingProfile && rid) {
        const onboarding = resolveRestaurantOnboardingState({
          search: location.search,
        }).state;
        try {
          await syncRestaurantOnboardingProgress(
            { restaurant_id: rid, ...(onboarding || {}) },
            {
              current_step_key: "profile_complete_gate",
              completed_step_keys: Array.from(
                new Set([
                  ...((onboarding && onboarding.completed_step_keys) || []),
                  "default_menu_ready",
                  "public_profile_edit",
                ])
              ),
              draft_payload: {
                ...(onboarding?.draft_payload || {}),
                stage_records: {
                  ...(onboarding?.draft_payload?.stage_records || {}),
                  public_profile_edit: {
                    status: "completed",
                    confirmed: true,
                    slug: refreshedProfile?.slug || null,
                  },
                },
              },
            }
          );
        } catch {
          /* best-effort */
        }
        const slug = refreshedProfile?.slug || rid;
        navigate(
          `/restaurant/onboarding/profile-complete?restaurant_id=${encodeURIComponent(String(rid))}&slug=${encodeURIComponent(String(slug))}`,
          { replace: true }
        );
      }
    } catch (e) {
      console.error("[operator-profile] publish failed", e);
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  }

  function wrap(content) {
    if (embedded) return content;
    return <OperatorLayout title="Profile">{content}</OperatorLayout>;
  }

  if (!rid) {
    return wrap(
      <p style={{ color: "#8a9ab0" }}>{t("operator.selectRestaurantProfile", "Select a restaurant to edit its profile.")}</p>
    );
  }

  if (loading) {
    return wrap(
      <p style={{ color: "#8a9ab0" }}>{t("operator.loading", "Loading…")}</p>
    );
  }

  return wrap(
      <div id="restaurant-profile" style={{ maxWidth: embedded ? "100%" : 680 }}>
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
        <Section title="Restaurant info" sub="These fields publish to your public restaurant profile. Save draft, then Publish.">
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
                value={form.website_url || ""}
                onChange={f("website_url")}
                placeholder="https://your-restaurant.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <input style={INPUT} value={form.phone || ""} onChange={f("phone")} placeholder="(555) 555-5555" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Street address</Label>
              <input
                style={INPUT}
                value={form.address_line1 || ""}
                onChange={f("address_line1")}
                placeholder="123 Main Street"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Address line 2</Label>
              <input
                style={INPUT}
                value={form.address_line2 || ""}
                onChange={f("address_line2")}
                placeholder="Suite, floor, unit (optional)"
              />
            </div>
            <div>
              <Label>City</Label>
              <input style={INPUT} value={form.city || ""} onChange={f("city")} placeholder="Los Angeles" />
            </div>
            <div>
              <Label>State</Label>
              <input style={INPUT} value={form.state || ""} onChange={f("state")} placeholder="CA" />
            </div>
            <div>
              <Label>Postal code</Label>
              <input style={INPUT} value={form.postal_code || ""} onChange={f("postal_code")} placeholder="90012" />
            </div>
          </div>
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
        <Section title="Logo" sub="Square image recommended. 512×512px minimum. Upload a file or paste a URL.">
          {hasBenefit("logo_upload") ? (
            <div className="operator-responsive-row" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {form.logo_url ? (
                <img
                  src={mediaUrl(form.logo_url)}
                  alt="logo preview"
                  style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: "1px solid #e4e9f0", flexShrink: 0, background: "#fafaf9" }}
                  onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    border: "1px dashed #d6d3d1",
                    background: "#fafaf9",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "#a8a29e",
                    textAlign: "center",
                    padding: 6,
                  }}
                >
                  No logo
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: "none" }}
                  onChange={handleLogoFileChange}
                />
                <button
                  type="button"
                  onClick={() => logoFileRef.current?.click()}
                  disabled={logoUploading}
                  style={{
                    background: "#1c1917",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: logoUploading ? "wait" : "pointer",
                    opacity: logoUploading ? 0.7 : 1,
                    fontFamily: "inherit",
                    marginBottom: 10,
                  }}
                >
                  {logoUploading ? "Uploading…" : "Upload logo from file"}
                </button>
                <Label>Or logo URL</Label>
                <input
                  style={INPUT}
                  value={form.logo_url || ""}
                  onChange={f("logo_url")}
                  placeholder="https://your-cdn.com/logo.png"
                />
              </div>
            </div>
          ) : (
            <LockedField benefitName="Logo upload" />
          )}
        </Section>

        {/* ── Banner photo ────────────────────────────────────────────── */}
        <Section
          title="Banner photo"
          sub="Wide photo at the top of your public profile. Landscape images work best."
        >
          <div>
            {bannerUrl ? (
              <img
                src={mediaUrl(bannerUrl)}
                alt="Banner preview"
                style={{
                  width: "100%",
                  maxHeight: 160,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #e4e9f0",
                  marginBottom: 12,
                  background: "#fafaf9",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 100,
                  borderRadius: 10,
                  border: "1px dashed #d6d3d1",
                  background: "#fafaf9",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "#a8a29e",
                }}
              >
                No banner photo yet
              </div>
            )}
            <input
              ref={bannerFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={handleBannerFileChange}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button
                type="button"
                onClick={() => bannerFileRef.current?.click()}
                disabled={bannerUploading}
                style={{
                  background: "#1c1917",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: bannerUploading ? "wait" : "pointer",
                  opacity: bannerUploading ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {bannerUploading ? "Uploading…" : "Upload banner photo"}
              </button>
              {bannerUrl ? (
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  disabled={bannerUploading}
                  style={{
                    background: "#fff",
                    color: "#57534e",
                    border: "1px solid #d6d3d1",
                    borderRadius: 8,
                    padding: "9px 14px",
                    fontSize: 13,
                    fontWeight: 650,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Remove banner
                </button>
              ) : null}
            </div>
          </div>
        </Section>

        {/* ── Restaurant Style ────────────────────────────────────────── */}
        <Section
          title="Restaurant Style"
          sub="Save draft, then Publish to show the selected atmosphere on your public profile."
        >
          <RestaurantStyleSelector
            profileStyleKey={form.profile_style_key ?? null}
            category={form.category || ""}
            cuisine={form.cuisine || ""}
            restaurantName={form.restaurant_name || profile?.restaurant_name || ""}
            onChange={(key) => setForm((p) => ({ ...p, profile_style_key: key }))}
          />
        </Section>

        {/* ── Featured Dish ───────────────────────────────────────────── */}
        <Section
          title="Featured dish"
          sub="Optional. Choose one item from your menu to spotlight on the public profile (shown in the Featured dish section)."
        >
          {hasBenefit("featured_dish") ? (
            allItems.length === 0 ? (
              <div style={{ fontSize: 13, color: "#8a9ab0", lineHeight: 1.5 }}>
                You need at least one menu item first. Open Menu Lab, add dishes, then return here to pick a featured dish.
              </div>
            ) : (
              <>
                <select
                  style={{ ...INPUT, cursor: "pointer" }}
                  value={form.featured_menu_item_id || ""}
                  onChange={f("featured_menu_item_id")}
                >
                  <option value="">— No featured dish —</option>
                  {allItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                      {i.price != null && i.price !== "" ? ` · $${Number(i.price).toFixed(2)}` : ""}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 12, color: "#a8a29e", marginTop: 8, lineHeight: 1.45 }}>
                  This is not your full menu — just one highlight. Diners still browse the complete menu separately.
                </div>
              </>
            )
          ) : (
            <LockedField benefitName="Featured dish" />
          )}
        </Section>

        {/* ── Restaurant Status (last) ─────────────────────────────────── */}
        <Section
          title="Restaurant Status"
          sub="Optional banners on your public profile (Now Hiring, Happy Hour, Live Music, and more). Tap a row to toggle — a check mark means it is on. Changes go live immediately."
        >
          <RestaurantStatusSettingsPanel restaurantId={rid} />
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
  );
}

/** Profile Editor route — public listing fields (also linked from Operations nav). */
export default function OperatorProfileEditor() {
  return (
    <OperatorLayout title="Profile Editor">
      <div style={{ maxWidth: 960, paddingBottom: 48 }}>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
          These fields appear on your public Menuply listing. Save a draft, then publish to go live.
        </p>
        <OperatorRestaurantProfileForm embedded />
      </div>
    </OperatorLayout>
  );
}
