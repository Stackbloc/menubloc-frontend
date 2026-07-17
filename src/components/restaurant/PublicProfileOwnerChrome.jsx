/**
 * Owner-only edit chrome for the public restaurant profile page.
 * Save = draft update + publish, then parent reloads public data.
 * Status banners update live via PUT /profile/status-banners.
 */
import { useEffect, useState } from "react";
import * as operatorApi from "../../lib/operatorApi.js";
import { API_BASE } from "../../lib/operatorApi.js";
import {
  RESTAURANT_STATUS_BANNERS,
  normalizeStatusBannerIds,
} from "../../lib/restaurantStatusBanners.js";
import StatusEventScheduleEditor from "./StatusEventScheduleEditor.jsx";

const INPUT = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 13,
  border: "1.5px solid #e4e9f0",
  borderRadius: 9,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const TEXTAREA = { ...INPUT, resize: "vertical", minHeight: 90 };

function Label({ children }) {
  return (
    <label
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#5b6675",
        display: "block",
        marginBottom: 5,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {children}
    </label>
  );
}

export default function PublicProfileOwnerChrome({ restaurant, onPublished }) {
  const rid = restaurant?.id;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [benefits, setBenefits] = useState({});
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [activeBanners, setActiveBanners] = useState(() =>
    normalizeStatusBannerIds(restaurant?.status_banners)
  );
  const [statusEvents, setStatusEvents] = useState([]);
  const [restaurantTimezone, setRestaurantTimezone] = useState(null);
  const [restaurantTimezoneValid, setRestaurantTimezoneValid] = useState(false);
  const [form, setForm] = useState({
    restaurant_name: "",
    cuisine: "",
    category: "",
    phone: "",
    about_us: "",
    logo_url: "",
  });
  const [baselineLogo, setBaselineLogo] = useState("");

  const hasBenefit = (key) => benefits[key]?.is_enabled === true;

  useEffect(() => {
    setActiveBanners(normalizeStatusBannerIds(restaurant?.status_banners));
  }, [restaurant?.id, restaurant?.status_banners]);

  useEffect(() => {
    if (!rid) return;
    let alive = true;
    operatorApi
      .getProfile(rid)
      .then((profileData) => {
        if (!alive) return;
        setBenefits(profileData.benefits || {});
        setActiveBanners(normalizeStatusBannerIds(profileData.profile?.status_banners));
        setStatusEvents(Array.isArray(profileData.status_events) ? profileData.status_events : []);
        setRestaurantTimezone(profileData.restaurant_timezone || null);
        setRestaurantTimezoneValid(profileData.restaurant_timezone_valid === true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [rid]);

  useEffect(() => {
    if (!editing) return;
    Promise.all([
      fetch(`${API_BASE}/api/meta/cuisines`).then((r) => r.json()).catch(() => ({ ok: false })),
      fetch(`${API_BASE}/api/meta/categories`).then((r) => r.json()).catch(() => ({ ok: false })),
    ]).then(([cuisineData, categoryData]) => {
      if (cuisineData.ok && Array.isArray(cuisineData.cuisines)) {
        setCuisineOptions(cuisineData.cuisines);
      }
      if (categoryData.ok && Array.isArray(categoryData.categories)) {
        setCategoryOptions(categoryData.categories);
      }
    });
  }, [editing]);

  async function startEdit() {
    if (!rid) return;
    setError("");
    setNotice("");
    try {
      const profileData = await operatorApi.getProfile(rid);
      const p = profileData.profile || {};
      setBenefits(profileData.benefits || {});
      setActiveBanners(normalizeStatusBannerIds(p.status_banners));
      setStatusEvents(Array.isArray(profileData.status_events) ? profileData.status_events : []);
      setRestaurantTimezone(profileData.restaurant_timezone || null);
      setRestaurantTimezoneValid(profileData.restaurant_timezone_valid === true);
      const next = {
        restaurant_name: p.restaurant_name || restaurant?.restaurant_name || "",
        cuisine: p.cuisine || restaurant?.cuisine || "",
        category:
          p.category === "restaurant"
            ? ""
            : p.category || restaurant?.category || "",
        phone: p.phone || restaurant?.phone || "",
        about_us: p.about_us || restaurant?.about_us || restaurant?.bio || "",
        logo_url: p.logo_url || restaurant?.logo_url || "",
      };
      setForm(next);
      setBaselineLogo(next.logo_url);
      setEditing(true);
    } catch (e) {
      setError(e.message || "Could not load profile for editing.");
    }
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
    setNotice("");
  }

  async function handleBannerToggle(bannerId) {
    if (!rid || bannerSaving) return;
    const next = activeBanners.includes(bannerId)
      ? activeBanners.filter((id) => id !== bannerId)
      : normalizeStatusBannerIds([...activeBanners, bannerId]);
    const prev = activeBanners;
    setActiveBanners(next);
    setBannerSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await operatorApi.updateStatusBanners(rid, next);
      setActiveBanners(normalizeStatusBannerIds(result.status_banners));
      setNotice("Status banners updated.");
      if (typeof onPublished === "function") {
        await onPublished();
      }
    } catch (e) {
      setActiveBanners(prev);
      setError(e.message || "Could not update status banners.");
    } finally {
      setBannerSaving(false);
    }
  }

  async function handleSave() {
    if (!rid) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        restaurant_name: form.restaurant_name,
        cuisine: form.cuisine,
        category: form.category,
        phone: form.phone,
      };
      if (hasBenefit("about_us")) {
        payload.about_us = form.about_us;
      }
      await operatorApi.updateProfile(rid, payload);

      if (hasBenefit("logo_upload") && form.logo_url !== baselineLogo) {
        await fetch(`${API_BASE}/operator/restaurants/${rid}/profile/logo`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo_url: form.logo_url }),
        }).then(async (r) => {
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.error || "Logo update failed");
          return j;
        });
      }

      await operatorApi.publishProfile(rid);
      setEditing(false);
      setNotice("Profile saved — changes are live.");
      if (typeof onPublished === "function") {
        await onPublished();
      }
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto 16px",
        borderRadius: 14,
        border: "1px solid #bbf7d0",
        background: "#f0fdf4",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
          You own this listing — review or edit your public profile.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!editing ? (
            <button
              type="button"
              onClick={startEdit}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                border: "none",
                background: "#1F4E3D",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 9,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f1720",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 9,
                  border: "none",
                  background: "#1F4E3D",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
          {error}
        </div>
      ) : null}
      {notice ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#166534", fontWeight: 600 }}>
          {notice}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid #bbf7d0",
        }}
      >
        <Label>Restaurant Status</Label>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#3f6212", lineHeight: 1.45 }}>
          Toggle banners shown at the top of your public profile. Happy Hour and Live Music use
          schedules (restaurant local time). Changes go live immediately.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {RESTAURANT_STATUS_BANNERS.map((banner) => {
            const on = activeBanners.includes(banner.id);
            return (
              <div key={banner.id}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: on ? "1px solid #86efac" : "1px solid #d1d5db",
                    background: on ? "#fff" : "#f8fafc",
                    cursor: bannerSaving ? "wait" : "pointer",
                    fontSize: 13,
                    color: "#0f172a",
                    fontWeight: banner.prominence === "primary" ? 700 : 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={bannerSaving}
                    onChange={() => handleBannerToggle(banner.id)}
                  />
                  <span aria-hidden="true">{banner.emoji}</span>
                  <span>{banner.label}</span>
                  {banner.prominence === "primary" ? (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#15803d", fontWeight: 800 }}>
                      Featured
                    </span>
                  ) : null}
                  {banner.scheduled ? (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                      Scheduled
                    </span>
                  ) : null}
                </label>
                {on && banner.id === "happy_hour" ? (
                  <StatusEventScheduleEditor
                    restaurantId={rid}
                    statusType="happy_hour"
                    initialEvents={statusEvents.filter((e) => e.status_type === "happy_hour")}
                    timezoneLabel={restaurantTimezone}
                    timezoneValid={restaurantTimezoneValid}
                    onSaved={async (result) => {
                      setStatusEvents((prev) => [
                        ...prev.filter((e) => e.status_type !== "happy_hour"),
                        ...(result.events || []),
                      ]);
                      setActiveBanners(normalizeStatusBannerIds(result.status_banners));
                      setNotice("Happy Hour schedules updated.");
                      if (typeof onPublished === "function") await onPublished();
                    }}
                  />
                ) : null}
                {on && banner.id === "live_music" ? (
                  <StatusEventScheduleEditor
                    restaurantId={rid}
                    statusType="live_music"
                    initialEvents={statusEvents.filter((e) => e.status_type === "live_music")}
                    timezoneLabel={restaurantTimezone}
                    timezoneValid={restaurantTimezoneValid}
                    onSaved={async (result) => {
                      setStatusEvents((prev) => [
                        ...prev.filter((e) => e.status_type !== "live_music"),
                        ...(result.events || []),
                      ]);
                      setActiveBanners(normalizeStatusBannerIds(result.status_banners));
                      setNotice("Live Music events updated.");
                      if (typeof onPublished === "function") await onPublished();
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {editing ? (
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div>
            <Label>Restaurant name</Label>
            <input style={INPUT} value={form.restaurant_name} onChange={f("restaurant_name")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>Cuisine</Label>
              <select
                style={{ ...INPUT, cursor: "pointer", appearance: "auto" }}
                value={form.cuisine || ""}
                onChange={f("cuisine")}
              >
                <option value="">Select cuisine…</option>
                {form.cuisine &&
                  !cuisineOptions.some((o) => o.value === form.cuisine) && (
                    <option value={form.cuisine}>{form.cuisine} (legacy)</option>
                  )}
                {cuisineOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Restaurant type</Label>
              <select
                style={{ ...INPUT, cursor: "pointer", appearance: "auto" }}
                value={form.category || ""}
                onChange={f("category")}
              >
                <option value="">Select type…</option>
                {form.category &&
                  !categoryOptions.some((o) => o.value === form.category) && (
                    <option value={form.category}>{form.category} (legacy)</option>
                  )}
                {categoryOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Phone</Label>
            <input
              style={INPUT}
              value={form.phone}
              onChange={f("phone")}
              placeholder="(555) 555-5555"
            />
          </div>
          {hasBenefit("about_us") ? (
            <div>
              <Label>About</Label>
              <textarea
                style={TEXTAREA}
                value={form.about_us}
                onChange={f("about_us")}
                placeholder="Tell guests about your restaurant."
              />
            </div>
          ) : null}
          {hasBenefit("logo_upload") ? (
            <div>
              <Label>Logo URL</Label>
              <input
                style={INPUT}
                value={form.logo_url}
                onChange={f("logo_url")}
                placeholder="https://…"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
