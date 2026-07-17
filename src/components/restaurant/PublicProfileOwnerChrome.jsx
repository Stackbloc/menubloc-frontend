/**
 * Owner-only edit chrome for the public restaurant profile page.
 * Save = draft update + publish, then parent reloads public data.
 * Status banners update live via RestaurantStatusSettingsPanel.
 */
import { useEffect, useState } from "react";
import * as operatorApi from "../../lib/operatorApi.js";
import { API_BASE } from "../../lib/operatorApi.js";
import RestaurantStatusSettingsPanel from "./RestaurantStatusSettingsPanel.jsx";

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

const INPUT_LOCKED = {
  ...INPUT,
  background: "#f4f3ef",
  color: "#5b6675",
  cursor: "not-allowed",
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
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [benefits, setBenefits] = useState({});
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
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
    if (!rid) return;
    let alive = true;
    operatorApi
      .getProfile(rid)
      .then((profileData) => {
        if (!alive) return;
        setBenefits(profileData.benefits || {});
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
      const next = {
        restaurant_name: p.restaurant_name || restaurant?.restaurant_name || restaurant?.name || "",
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

  async function handleSave() {
    if (!rid) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      // restaurant_name is identity-locked — never sent from owner chrome.
      const payload = {
        cuisine: form.cuisine,
        category: form.category,
        phone: form.phone,
      };
      if (hasBenefit("about_us")) {
        payload.about_us = form.about_us;
      }
      await operatorApi.updateProfile(rid, payload);

      if (hasBenefit("logo_upload") && form.logo_url !== baselineLogo) {
        const res = await fetch(`${API_BASE}/operator/restaurants/${rid}/profile/logo`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo_url: form.logo_url }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "Could not update logo.");
        }
        setBaselineLogo(form.logo_url);
      }

      await operatorApi.publishProfile(rid);
      setEditing(false);
      setNotice("Profile published.");
      if (typeof onPublished === "function") await onPublished();
    } catch (e) {
      setError(e.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid #86efac",
        background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>Owner tools</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {!editing ? (
            <button
              type="button"
              onClick={startEdit}
              style={{
                background: "#1F4E3D",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Edit profile
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                style={{
                  background: "#f4f3ef",
                  color: "#0f1720",
                  border: "none",
                  borderRadius: 9,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
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
                  background: "#1F4E3D",
                  color: "#fff",
                  border: "none",
                  borderRadius: 9,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 700,
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
        <RestaurantStatusSettingsPanel
          restaurantId={rid}
          initialBanners={restaurant?.status_banners}
          compact
          onChanged={async () => {
            if (typeof onPublished === "function") await onPublished();
          }}
        />
      </div>

      {editing ? (
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div>
            <Label>Restaurant name</Label>
            <input
              style={INPUT_LOCKED}
              value={form.restaurant_name}
              readOnly
              aria-readonly="true"
            />
            <div style={{ marginTop: 5, fontSize: 11, color: "#8a9ab0" }}>
              Protected listing identity — name cannot be changed here.
            </div>
          </div>
          <div>
            <Label>Cuisine</Label>
            <select style={{ ...INPUT, cursor: "pointer" }} value={form.cuisine} onChange={f("cuisine")}>
              <option value="">Select cuisine…</option>
              {cuisineOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Category</Label>
            <select style={{ ...INPUT, cursor: "pointer" }} value={form.category} onChange={f("category")}>
              <option value="">Select type…</option>
              {categoryOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Phone</Label>
            <input style={INPUT} value={form.phone} onChange={f("phone")} />
          </div>
          {hasBenefit("about_us") ? (
            <div>
              <Label>About Us</Label>
              <textarea style={TEXTAREA} value={form.about_us} onChange={f("about_us")} />
            </div>
          ) : null}
          {hasBenefit("logo_upload") ? (
            <div>
              <Label>Logo URL</Label>
              <input style={INPUT} value={form.logo_url} onChange={f("logo_url")} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
