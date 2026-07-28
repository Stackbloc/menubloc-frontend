/**
 * Owner Profile Manager — pick a restaurant and edit public profile fields,
 * including Restaurant Style (background atmosphere).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import OwnerRestaurantContextBar from "./OwnerRestaurantContextBar.jsx";
import RestaurantStyleSelector from "../../components/operator/RestaurantStyleSelector.jsx";
import { inputStyle } from "./ownerMenuEditorComponents.jsx";
import {
  OWNER_API_BASE,
  getMenuConsoleRestaurant,
  getOwnerRestaurantProfileStyle,
  searchMenuConsoleRestaurants,
  updateMenuConsoleRestaurant,
  updateOwnerRestaurantProfileStyle,
} from "../../lib/ownerApi.js";
import { restaurantPathFromRow } from "../../lib/canonicalUrl.js";

const SEARCH_LIMIT = 12;
const FIELD_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

function emptyForm() {
  return {
    restaurant_name: "",
    cuisine: "",
    category: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    phone: "",
    website_url: "",
    profile_style_key: null,
  };
}

export default function OwnerProfileManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const restaurantParam = searchParams.get("restaurant");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [baseline, setBaseline] = useState(emptyForm);
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const searchTimeout = useRef(null);
  const searchSeq = useRef(0);

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  useEffect(() => {
    Promise.all([
      fetch(`${OWNER_API_BASE}/api/meta/cuisines`).then((r) => r.json()).catch(() => ({ ok: false })),
      fetch(`${OWNER_API_BASE}/api/meta/categories`).then((r) => r.json()).catch(() => ({ ok: false })),
    ]).then(([cuisineData, categoryData]) => {
      if (cuisineData.ok && Array.isArray(cuisineData.cuisines)) {
        setCuisineOptions(cuisineData.cuisines);
      }
      if (categoryData.ok && Array.isArray(categoryData.categories)) {
        setCategoryOptions(categoryData.categories);
      }
    });
  }, []);

  useEffect(() => {
    const id = Number(restaurantParam);
    if (!Number.isFinite(id) || id <= 0) return;
    if (selected?.id === id) return;
    loadRestaurant(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantParam]);

  function runSearch(q) {
    const trimmed = String(q || "").trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchErr("");
      setSearching(false);
      return;
    }
    const seq = ++searchSeq.current;
    setSearching(true);
    setSearchErr("");
    searchMenuConsoleRestaurants({ q: trimmed, limit: SEARCH_LIMIT })
      .then((res) => {
        if (seq !== searchSeq.current) return;
        setResults(Array.isArray(res?.restaurants) ? res.restaurants : []);
      })
      .catch((err) => {
        if (seq !== searchSeq.current) return;
        setResults([]);
        setSearchErr(err?.message || "Search failed.");
      })
      .finally(() => {
        if (seq === searchSeq.current) setSearching(false);
      });
  }

  function onQueryChange(value) {
    setQuery(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => runSearch(value), 280);
  }

  async function loadRestaurant(restaurantId) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const [profileRes, styleRes] = await Promise.all([
        getMenuConsoleRestaurant(restaurantId),
        getOwnerRestaurantProfileStyle(restaurantId).catch(() => null),
      ]);
      const r = profileRes.restaurant || {};
      const style = styleRes?.restaurant || {};
      const next = {
        restaurant_name: r.restaurant_name || "",
        cuisine: r.cuisine || "",
        category: r.category || "",
        address_line1: r.address_line1 || "",
        city: r.city || "",
        state: r.state || "",
        postal_code: r.postal_code || "",
        phone: r.phone || "",
        website_url: r.website_url || "",
        profile_style_key:
          style.profile_style_key === undefined || style.profile_style_key === ""
            ? null
            : style.profile_style_key,
      };
      setSelected({
        id: r.id,
        name: r.restaurant_name || `Restaurant #${r.id}`,
        city: r.city || "",
        state: r.state || "",
        slug: r.slug || "",
        public_profile_path: r.public_profile_path || null,
      });
      setForm(next);
      setBaseline(next);
      setResults([]);
      setQuery("");
      setSearchParams({ restaurant: String(r.id) }, { replace: true });
    } catch (err) {
      setSelected(null);
      setForm(emptyForm());
      setBaseline(emptyForm());
      setError(err?.message || "Could not load restaurant profile.");
    } finally {
      setLoading(false);
    }
  }

  function selectRestaurant(restaurant) {
    const id = restaurant?.id || restaurant?.restaurant_id;
    if (!id) return;
    loadRestaurant(id);
  }

  function clearSelection() {
    setSelected(null);
    setForm(emptyForm());
    setBaseline(emptyForm());
    setMessage("");
    setError("");
    setSearchParams({}, { replace: true });
  }

  const dirty = useMemo(() => {
    return Object.keys(form).some((key) => (form[key] ?? null) !== (baseline[key] ?? null));
  }, [form, baseline]);

  async function handleSave() {
    if (!selected?.id || !dirty) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const profileBody = {
        restaurant_name: form.restaurant_name,
        cuisine: form.cuisine,
        category: form.category,
        address_line1: form.address_line1,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        phone: form.phone,
        website_url: form.website_url,
      };
      const styleChanged =
        (form.profile_style_key ?? null) !== (baseline.profile_style_key ?? null);

      await updateMenuConsoleRestaurant(selected.id, profileBody);
      if (styleChanged) {
        await updateOwnerRestaurantProfileStyle(selected.id, form.profile_style_key);
      }

      await loadRestaurant(selected.id);
      setMessage("Profile saved. Public profile updates are live.");
    } catch (err) {
      setError(err?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const publicHref =
    selected?.public_profile_path ||
    restaurantPathFromRow({
      id: selected?.id,
      slug: selected?.slug,
      city: form.city || selected?.city,
      state: form.state || selected?.state,
    }) ||
    (selected?.id ? `/restaurants/${selected.id}` : null);

  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <OwnerLayout title="Profile Manager">
      <SectionTitle
        title="Profile Manager"
        subtitle="Find a restaurant, edit public profile fields, and choose the Restaurant Style background."
      />

      {!selected ? (
        <PageCard style={{ padding: 22 }} data-testid="owner-profile-manager-search">
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: OWNER_COLORS.muted,
              marginBottom: 6,
            }}
          >
            Find a restaurant
          </label>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name, city, or id…"
            data-testid="owner-profile-manager-search-input"
            style={{ ...inputStyle, maxWidth: 480 }}
          />
          {searching ? (
            <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>Searching…</div>
          ) : null}
          {searchErr ? (
            <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c" }}>{searchErr}</div>
          ) : null}
          {results.length ? (
            <div style={{ marginTop: 12, display: "grid", gap: 8, maxWidth: 560 }}>
              {results.map((r) => {
                const id = r.id || r.restaurant_id;
                const name = r.name || r.restaurant_name || `Restaurant #${id}`;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectRestaurant(r)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${OWNER_COLORS.line}`,
                      background: "#fff",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: OWNER_COLORS.ink }}>{name}</div>
                    <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2 }}>
                      #{id}
                      {r.city || r.state ? ` · ${[r.city, r.state].filter(Boolean).join(", ")}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
          {error ? (
            <div style={{ marginTop: 12, fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>{error}</div>
          ) : null}
        </PageCard>
      ) : (
        <>
          <OwnerRestaurantContextBar
            name={form.restaurant_name || selected.name}
            id={selected.id}
            city={form.city || selected.city}
            state={form.state || selected.state}
            style={{ marginBottom: 16 }}
          >
            <button
              type="button"
              onClick={clearSelection}
              disabled={loading}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
                fontWeight: 600,
                fontSize: 12,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Change restaurant
            </button>
          </OwnerRestaurantContextBar>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            {publicHref ? (
              <Link
                to={publicHref}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${OWNER_COLORS.line}`,
                  background: "#fff",
                  color: OWNER_COLORS.ink,
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                View public profile
              </Link>
            ) : null}
            <Link
              to={`/owner/menu-manager?tab=workspace&restaurant=${selected.id}`}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
                color: OWNER_COLORS.ink,
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Open Menu Manager
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty || loading}
              data-testid="owner-profile-manager-save"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: dirty ? OWNER_COLORS.accent : "#d6d3d1",
                color: "#fff",
                cursor: dirty && !saving ? "pointer" : "default",
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "inherit",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>

          {loading ? (
            <PageCard style={{ padding: 22 }}>
              <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading profile…</div>
            </PageCard>
          ) : (
            <>
              <PageCard style={{ padding: 22, marginBottom: 18 }} data-testid="owner-profile-manager-fields">
                <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 14 }}>
                  Restaurant info
                </div>
                <div style={FIELD_GRID}>
                  <div>
                    <Label>Restaurant name</Label>
                    <input style={inputStyle} value={form.restaurant_name} onChange={f("restaurant_name")} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select style={{ ...inputStyle, cursor: "pointer" }} value={form.category} onChange={f("category")}>
                      <option value="">Select category</option>
                      {categoryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label || opt.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Cuisine</Label>
                    <select style={{ ...inputStyle, cursor: "pointer" }} value={form.cuisine} onChange={f("cuisine")}>
                      <option value="">Select cuisine</option>
                      {cuisineOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label || opt.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <input style={inputStyle} value={form.phone} onChange={f("phone")} />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <input style={inputStyle} value={form.website_url} onChange={f("website_url")} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Label>Address</Label>
                    <input style={inputStyle} value={form.address_line1} onChange={f("address_line1")} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <input style={inputStyle} value={form.city} onChange={f("city")} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <input style={inputStyle} value={form.state} onChange={f("state")} />
                  </div>
                  <div>
                    <Label>Postal code</Label>
                    <input style={inputStyle} value={form.postal_code} onChange={f("postal_code")} />
                  </div>
                </div>
              </PageCard>

              <PageCard style={{ padding: 22 }} data-testid="owner-profile-manager-style">
                <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>
                  Restaurant Style
                </div>
                <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 12, lineHeight: 1.45 }}>
                  Public profile background atmosphere. Changes apply live when you save.
                </div>
                <RestaurantStyleSelector
                  profileStyleKey={form.profile_style_key}
                  category={form.category}
                  cuisine={form.cuisine}
                  restaurantName={form.restaurant_name || selected.name}
                  onChange={(key) => setForm((prev) => ({ ...prev, profile_style_key: key }))}
                />
              </PageCard>
            </>
          )}

          {message ? (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          ) : null}
          {error ? (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : null}
        </>
      )}
    </OwnerLayout>
  );
}

function Label({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: OWNER_COLORS.muted,
        marginBottom: 6,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}
