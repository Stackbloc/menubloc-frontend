/**
 * Owner Profile Manager — pick a restaurant and edit public homepage fields
 * (About, Founded, Instagram, Favorite Menu Items, Updates, hours, style).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import OwnerRestaurantContextBar from "./OwnerRestaurantContextBar.jsx";
import RestaurantStyleSelector from "../../components/operator/RestaurantStyleSelector.jsx";
import MenuAppearanceSelector from "../../components/operator/MenuAppearanceSelector.jsx";
import { inputStyle } from "./ownerMenuEditorComponents.jsx";
import {
  OWNER_API_BASE,
  getMenuConsoleRestaurant,
  getOwnerRestaurantFeaturedDishCandidates,
  getOwnerRestaurantFavoriteMenuItems,
  getOwnerRestaurantHours,
  getOwnerRestaurantMenuAppearance,
  getOwnerRestaurantProfileStyle,
  getOwnerRestaurantProfileUpdates,
  getOwnerRestaurantStatusBanners,
  createOwnerRestaurantProfileUpdate,
  deleteOwnerRestaurantProfileUpdate,
  searchMenuConsoleRestaurants,
  updateMenuConsoleRestaurant,
  updateOwnerRestaurantFavoriteMenuItems,
  updateOwnerRestaurantHours,
  updateOwnerRestaurantMenuAppearance,
  updateOwnerRestaurantProfileStyle,
  updateOwnerRestaurantStatusBanners,
} from "../../lib/ownerApi.js";
import { restaurantMenuPathFromRow, restaurantPathFromRow } from "../../lib/canonicalUrl.js";
import { menuItemDomId } from "../../components/share/shareUtils.js";

const SEARCH_LIMIT = 12;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FIELD_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

function emptyHours() {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    day_name: DAY_NAMES[i],
    opens_at: "09:00",
    closes_at: "21:00",
    is_closed: true,
    label: null,
  }));
}

function emptyForm() {
  return {
    restaurant_name: "",
    cuisine: "",
    category: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    phone: "",
    website_url: "",
    instagram: "",
    about_us: "",
    founded_year: "",
    team_intro: "",
    featured_menu_item_id: "",
    favorite_menu_item_ids: [],
    now_hiring: false,
    profile_style_key: null,
    menu_appearance_key: null,
  };
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
  const [hours, setHours] = useState(emptyHours);
  const [hoursBaseline, setHoursBaseline] = useState(emptyHours);
  const [menuItems, setMenuItems] = useState([]);
  const [profileUpdates, setProfileUpdates] = useState([]);
  const [updateDraft, setUpdateDraft] = useState({ title: "", body: "" });
  const [updateSaving, setUpdateSaving] = useState(false);
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [styleSaving, setStyleSaving] = useState(false);
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
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
      const [profileRes, styleRes, appearanceRes, bannersRes, hoursRes, candidatesRes, favoritesRes, updatesRes] =
        await Promise.all([
          getMenuConsoleRestaurant(restaurantId),
          getOwnerRestaurantProfileStyle(restaurantId).catch(() => null),
          getOwnerRestaurantMenuAppearance(restaurantId).catch(() => null),
          getOwnerRestaurantStatusBanners(restaurantId).catch(() => null),
          getOwnerRestaurantHours(restaurantId).catch(() => null),
          getOwnerRestaurantFeaturedDishCandidates(restaurantId, { limit: 200 }).catch(() => null),
          getOwnerRestaurantFavoriteMenuItems(restaurantId).catch(() => null),
          getOwnerRestaurantProfileUpdates(restaurantId).catch(() => null),
        ]);
      const r = profileRes.restaurant || {};
      const style = styleRes?.restaurant || {};
      const appearance = appearanceRes?.restaurant || {};
      const banners = Array.isArray(bannersRes?.status_banners) ? bannersRes.status_banners : [];
      const scheduleRaw = Array.isArray(hoursRes?.schedule) ? hoursRes.schedule : [];
      const schedule = emptyHours().map((day) => {
        const row = scheduleRaw.find((s) => Number(s.day_of_week) === day.day_of_week);
        if (!row) return day;
        return {
          day_of_week: day.day_of_week,
          day_name: day.day_name,
          opens_at: row.opens_at || "09:00",
          closes_at: row.closes_at || "21:00",
          is_closed: row.is_closed === true || (!row.opens_at && row.is_closed !== false),
          label: row.label || null,
        };
      });
      const items = Array.isArray(candidatesRes?.items) ? candidatesRes.items : [];
      const favoriteIds = (
        Array.isArray(favoritesRes?.favorite_menu_item_ids)
          ? favoritesRes.favorite_menu_item_ids
          : r.featured_menu_item_id != null
            ? [r.featured_menu_item_id]
            : []
      )
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
        .slice(0, 3);

      const next = {
        restaurant_name: r.restaurant_name || "",
        cuisine: r.cuisine || "",
        category: r.category || "",
        address_line1: r.address_line1 || "",
        address_line2: r.address_line2 || "",
        city: r.city || "",
        state: r.state || "",
        postal_code: r.postal_code || "",
        phone: r.phone || "",
        website_url: r.website_url || "",
        instagram: r.instagram || "",
        about_us: r.about_us || "",
        founded_year: r.founded_year != null ? String(r.founded_year) : "",
        team_intro: r.team_intro || "",
        featured_menu_item_id: favoriteIds[0] != null ? String(favoriteIds[0]) : "",
        favorite_menu_item_ids: favoriteIds.map(String),
        now_hiring: banners.includes("now_hiring"),
        profile_style_key:
          style.profile_style_key === undefined || style.profile_style_key === ""
            ? null
            : style.profile_style_key,
        menu_appearance_key:
          appearance.menu_appearance_key === undefined || appearance.menu_appearance_key === ""
            ? null
            : appearance.menu_appearance_key,
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
      setHours(schedule);
      setHoursBaseline(schedule);
      setMenuItems(items);
      setProfileUpdates(Array.isArray(updatesRes?.profile_updates) ? updatesRes.profile_updates : []);
      setUpdateDraft({ title: "", body: "" });
      setResults([]);
      setQuery("");
      setSearchParams({ restaurant: String(r.id) }, { replace: true });
    } catch (err) {
      setSelected(null);
      setForm(emptyForm());
      setBaseline(emptyForm());
      setHours(emptyHours());
      setHoursBaseline(emptyHours());
      setMenuItems([]);
      setProfileUpdates([]);
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
    setHours(emptyHours());
    setHoursBaseline(emptyHours());
    setMenuItems([]);
    setProfileUpdates([]);
    setUpdateDraft({ title: "", body: "" });
    setMessage("");
    setError("");
    setSearchParams({}, { replace: true });
  }

  const dirty = useMemo(() => {
    return Object.keys(form).some((key) => {
      if (key === "favorite_menu_item_ids") {
        return JSON.stringify(form[key] || []) !== JSON.stringify(baseline[key] || []);
      }
      return (form[key] ?? null) !== (baseline[key] ?? null);
    });
  }, [form, baseline]);

  function toggleFavoriteId(rawId) {
    const id = String(rawId);
    setForm((prev) => {
      const current = Array.isArray(prev.favorite_menu_item_ids)
        ? [...prev.favorite_menu_item_ids]
        : [];
      const idx = current.indexOf(id);
      if (idx >= 0) current.splice(idx, 1);
      else if (current.length < 3) current.push(id);
      return {
        ...prev,
        favorite_menu_item_ids: current,
        featured_menu_item_id: current[0] || "",
      };
    });
  }

  async function handleCreateUpdate() {
    if (!selected?.id) return;
    const title = String(updateDraft.title || "").trim();
    if (!title) return;
    setUpdateSaving(true);
    setError("");
    try {
      await createOwnerRestaurantProfileUpdate(selected.id, {
        title,
        body: String(updateDraft.body || "").trim() || null,
      });
      const updatesRes = await getOwnerRestaurantProfileUpdates(selected.id);
      setProfileUpdates(Array.isArray(updatesRes?.profile_updates) ? updatesRes.profile_updates : []);
      setUpdateDraft({ title: "", body: "" });
      setMessage("Update published on the public profile.");
    } catch (err) {
      setError(err?.message || "Could not create update.");
    } finally {
      setUpdateSaving(false);
    }
  }

  async function handleDeleteUpdate(updateId) {
    if (!selected?.id || !updateId) return;
    setUpdateSaving(true);
    setError("");
    try {
      await deleteOwnerRestaurantProfileUpdate(selected.id, updateId);
      setProfileUpdates((prev) => prev.filter((u) => u.id !== updateId));
      setMessage("Update removed.");
    } catch (err) {
      setError(err?.message || "Could not delete update.");
    } finally {
      setUpdateSaving(false);
    }
  }

  const hoursDirty = useMemo(() => {
    return JSON.stringify(hours) !== JSON.stringify(hoursBaseline);
  }, [hours, hoursBaseline]);

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
        address_line2: form.address_line2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        phone: form.phone,
        website_url: form.website_url,
        instagram: form.instagram,
        about_us: form.about_us,
        founded_year: form.founded_year === "" ? null : form.founded_year,
        team_intro: form.team_intro || null,
      };
      const styleChanged =
        (form.profile_style_key ?? null) !== (baseline.profile_style_key ?? null);
      const appearanceChanged =
        (form.menu_appearance_key ?? null) !== (baseline.menu_appearance_key ?? null);
      const featuredChanged =
        JSON.stringify(form.favorite_menu_item_ids || []) !==
        JSON.stringify(baseline.favorite_menu_item_ids || []);
      const hiringChanged = Boolean(form.now_hiring) !== Boolean(baseline.now_hiring);

      await updateMenuConsoleRestaurant(selected.id, profileBody);
      if (styleChanged) {
        await updateOwnerRestaurantProfileStyle(selected.id, form.profile_style_key);
      }
      if (appearanceChanged) {
        await updateOwnerRestaurantMenuAppearance(selected.id, form.menu_appearance_key);
      }
      if (featuredChanged) {
        const ids = (form.favorite_menu_item_ids || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
          .slice(0, 3);
        await updateOwnerRestaurantFavoriteMenuItems(selected.id, ids);
      }
      if (hiringChanged) {
        const bannersRes = await getOwnerRestaurantStatusBanners(selected.id).catch(() => ({
          status_banners: [],
        }));
        const current = new Set(
          Array.isArray(bannersRes?.status_banners) ? bannersRes.status_banners : []
        );
        if (form.now_hiring) current.add("now_hiring");
        else current.delete("now_hiring");
        await updateOwnerRestaurantStatusBanners(selected.id, [...current]);
      }

      await loadRestaurant(selected.id);
      setMessage("Profile saved. Public homepage fields are live.");
    } catch (err) {
      const field = err?.payload?.field ? `${err.payload.field}: ` : "";
      const detail =
        err?.payload?.error ||
        err?.message ||
        "Could not save profile.";
      setError(`${field}${detail}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleStyleChange(key) {
    const next = key == null || key === "" ? null : key;
    setForm((prev) => ({ ...prev, profile_style_key: next }));
    if (!selected?.id) return;
    if ((baseline.profile_style_key ?? null) === next) return;

    setStyleSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await updateOwnerRestaurantProfileStyle(selected.id, next);
      const saved =
        res?.restaurant?.profile_style_key === undefined || res?.restaurant?.profile_style_key === ""
          ? null
          : res.restaurant.profile_style_key;
      const effective = res?.restaurant?.effective_profile_style || saved || "modern_minimal";
      setForm((prev) => ({ ...prev, profile_style_key: saved }));
      setBaseline((prev) => ({ ...prev, profile_style_key: saved }));
      setMessage(
        `Restaurant Style applied live (${String(effective).replace(/_/g, " ")}). Hard-refresh the public profile to see it.`
      );
    } catch (err) {
      setError(err?.message || "Could not update Restaurant Style.");
      setForm((prev) => ({ ...prev, profile_style_key: baseline.profile_style_key }));
    } finally {
      setStyleSaving(false);
    }
  }

  async function handleAppearanceChange(key) {
    const next = key == null || key === "" ? null : key;
    setForm((prev) => ({ ...prev, menu_appearance_key: next }));
    if (!selected?.id) return;
    if ((baseline.menu_appearance_key ?? null) === next) return;

    setAppearanceSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await updateOwnerRestaurantMenuAppearance(selected.id, next);
      const saved =
        res?.restaurant?.menu_appearance_key === undefined ||
        res?.restaurant?.menu_appearance_key === ""
          ? null
          : res.restaurant.menu_appearance_key;
      const effective =
        res?.restaurant?.effective_menu_appearance || saved || "modern_minimal";
      setForm((prev) => ({ ...prev, menu_appearance_key: saved }));
      setBaseline((prev) => ({ ...prev, menu_appearance_key: saved }));
      setMessage(
        `Menu Appearance applied live (${String(effective).replace(/_/g, " ")}). Hard-refresh the public Default menu to see it.`
      );
    } catch (err) {
      setError(err?.message || "Could not update Menu Appearance.");
      setForm((prev) => ({ ...prev, menu_appearance_key: baseline.menu_appearance_key }));
    } finally {
      setAppearanceSaving(false);
    }
  }

  async function handleSaveHours() {
    if (!selected?.id || !hoursDirty) return;
    setHoursSaving(true);
    setError("");
    setMessage("");
    try {
      await updateOwnerRestaurantHours(
        selected.id,
        hours.map((d) => ({
          day_of_week: d.day_of_week,
          opens_at: d.is_closed ? null : d.opens_at,
          closes_at: d.is_closed ? null : d.closes_at,
          is_closed: Boolean(d.is_closed),
          label: d.label || null,
        }))
      );
      setHoursBaseline(hours);
      setMessage("Hours saved. Public At a Glance Hours row is live.");
    } catch (err) {
      setError(err?.message || "Could not save hours.");
    } finally {
      setHoursSaving(false);
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

  const menuHref =
    restaurantMenuPathFromRow({
      id: selected?.id,
      slug: selected?.slug,
      city: form.city || selected?.city,
      state: form.state || selected?.state,
    }) ||
    (selected?.id ? `/public/restaurants/${selected.id}/menu` : null);

  const featuredMenuHref = (() => {
    if (!menuHref || !form.featured_menu_item_id) return null;
    const anchor = menuItemDomId(form.featured_menu_item_id);
    return anchor ? `${menuHref}#${anchor}` : menuHref;
  })();

  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <OwnerLayout title="Profile Manager">
      <SectionTitle
        title="Profile Manager"
        subtitle="Complete the public profile fields diners see — At a Glance story rows, contact, hours, hiring, Restaurant Style, and Menu Appearance."
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
                  <div>
                    <Label>Instagram</Label>
                    <input
                      style={inputStyle}
                      value={form.instagram}
                      onChange={f("instagram")}
                      placeholder="@handle"
                      data-testid="owner-profile-manager-instagram"
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Label>Address</Label>
                    <input style={inputStyle} value={form.address_line1} onChange={f("address_line1")} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Label>Address line 2</Label>
                    <input style={inputStyle} value={form.address_line2} onChange={f("address_line2")} />
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

              <PageCard style={{ padding: 22, marginBottom: 18 }} data-testid="owner-profile-manager-story">
                <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>
                  Public homepage story
                </div>
                <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 14, lineHeight: 1.45 }}>
                  These fields publish to the public profile: About Us, Founded, Favorite Menu Items, and Updates.
                  Photos come from the banner/logo plus operator billboards. Deals and billboards are edited in the
                  operator console (<code>/operator/billboards</code>, <code>/operator/deals</code>).
                </div>
                <div style={{ marginBottom: 14 }}>
                  <Label>About Us</Label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                    value={form.about_us}
                    onChange={f("about_us")}
                    placeholder="Tell diners about the restaurant."
                  />
                </div>
                <div style={FIELD_GRID}>
                  <div>
                    <Label>Founded year</Label>
                    <input
                      style={inputStyle}
                      inputMode="numeric"
                      maxLength={4}
                      value={form.founded_year}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          founded_year: e.target.value.replace(/[^\d]/g, "").slice(0, 4),
                        }))
                      }
                      placeholder="e.g. 2014"
                    />
                  </div>
                  <div>
                    <Label>Favorite Menu Items (up to 3)</Label>
                    <div
                      data-testid="owner-profile-manager-favorite-items"
                      style={{
                        maxHeight: 220,
                        overflowY: "auto",
                        border: `1px solid ${OWNER_COLORS.line}`,
                        borderRadius: 10,
                        padding: 10,
                        background: "#fff",
                      }}
                    >
                      {menuItems.length === 0 ? (
                        <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>No menu items yet.</div>
                      ) : (
                        menuItems.map((item) => {
                          const id = String(item.id || item.menu_item_id);
                          const name = item.name || item.item_name || `Item #${id}`;
                          const checked = (form.favorite_menu_item_ids || []).includes(id);
                          const disabled = !checked && (form.favorite_menu_item_ids || []).length >= 3;
                          return (
                            <label
                              key={id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 0",
                                fontSize: 13,
                                opacity: disabled ? 0.45 : 1,
                                cursor: disabled ? "not-allowed" : "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleFavoriteId(id)}
                              />
                              <span>{name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
                      First selection is also the featured dish on the menu.
                      {(form.favorite_menu_item_ids || []).length
                        ? ` Selected ${(form.favorite_menu_item_ids || []).length}/3.`
                        : ""}
                    </div>
                    {menuItems.length === 0 ? (
                      <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
                        <Link
                          to={`/owner/menu-manager?tab=workspace&restaurant=${selected.id}`}
                          style={{ color: OWNER_COLORS.accent, fontWeight: 700, textDecoration: "none" }}
                        >
                          Open Menu Manager
                        </Link>
                        {menuHref ? (
                          <>
                            {" "}
                            or{" "}
                            <Link
                              to={menuHref}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: OWNER_COLORS.accent, fontWeight: 700, textDecoration: "none" }}
                            >
                              view public menu
                            </Link>
                          </>
                        ) : null}
                        .
                      </div>
                    ) : featuredMenuHref ? (
                      <div style={{ marginTop: 8, fontSize: 12 }}>
                        <Link
                          to={featuredMenuHref}
                          target="_blank"
                          rel="noreferrer"
                          data-testid="owner-profile-manager-view-featured-on-menu"
                          style={{ color: OWNER_COLORS.accent, fontWeight: 700, textDecoration: "none" }}
                        >
                          View featured on menu →
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <Label>Profile Updates</Label>
                  <div
                    data-testid="owner-profile-manager-updates"
                    style={{
                      border: `1px solid ${OWNER_COLORS.line}`,
                      borderRadius: 10,
                      padding: 12,
                      background: "#fff",
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <input
                      style={inputStyle}
                      value={updateDraft.title}
                      onChange={(e) => setUpdateDraft((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Live music Friday"
                      data-testid="owner-profile-update-title"
                    />
                    <textarea
                      style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                      value={updateDraft.body}
                      onChange={(e) => setUpdateDraft((p) => ({ ...p, body: e.target.value }))}
                      placeholder="Optional details"
                    />
                    <button
                      type="button"
                      onClick={handleCreateUpdate}
                      disabled={updateSaving || !String(updateDraft.title || "").trim()}
                      style={{
                        alignSelf: "start",
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: OWNER_COLORS.accent,
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: updateSaving || !String(updateDraft.title || "").trim() ? 0.6 : 1,
                      }}
                    >
                      {updateSaving ? "Saving…" : "Add update"}
                    </button>
                    {profileUpdates.length ? (
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                        {profileUpdates.map((u) => (
                          <li
                            key={u.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              padding: "8px 0",
                              borderTop: `1px solid ${OWNER_COLORS.line}`,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{u.title}</div>
                              {u.body ? (
                                <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{u.body}</div>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteUpdate(u.id)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#b91c1c",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                        No active updates yet.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <Label>Meet the team</Label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                    value={form.team_intro}
                    onChange={f("team_intro")}
                    placeholder="Introduce the people behind the restaurant."
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 16,
                    fontSize: 13,
                    fontWeight: 600,
                    color: OWNER_COLORS.ink,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.now_hiring)}
                    onChange={(e) => setForm((prev) => ({ ...prev, now_hiring: e.target.checked }))}
                  />
                  Now Hiring (shows on public profile)
                </label>
              </PageCard>

              <PageCard style={{ padding: 22, marginBottom: 18 }} data-testid="owner-profile-manager-hours">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink }}>Hours</div>
                    <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginTop: 4 }}>
                      Weekly schedule for the public At a Glance Hours row.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveHours}
                    disabled={!hoursDirty || hoursSaving}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: hoursDirty ? OWNER_COLORS.accent : "#d6d3d1",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: hoursDirty && !hoursSaving ? "pointer" : "default",
                      fontFamily: "inherit",
                    }}
                  >
                    {hoursSaving ? "Saving hours…" : "Save hours"}
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {hours.map((day, idx) => (
                    <div
                      key={day.day_of_week}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "110px 90px 1fr 1fr",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{day.day_name}</div>
                      <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={!day.is_closed}
                          onChange={(e) => {
                            const next = [...hours];
                            next[idx] = { ...day, is_closed: !e.target.checked };
                            setHours(next);
                          }}
                        />
                        Open
                      </label>
                      <input
                        type="time"
                        disabled={day.is_closed}
                        value={day.opens_at || "09:00"}
                        onChange={(e) => {
                          const next = [...hours];
                          next[idx] = { ...day, opens_at: e.target.value };
                          setHours(next);
                        }}
                        style={inputStyle}
                      />
                      <input
                        type="time"
                        disabled={day.is_closed}
                        value={day.closes_at || "21:00"}
                        onChange={(e) => {
                          const next = [...hours];
                          next[idx] = { ...day, closes_at: e.target.value };
                          setHours(next);
                        }}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </PageCard>

              <PageCard style={{ padding: 22 }} data-testid="owner-profile-manager-style">
                <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>
                  Restaurant Style
                </div>
                <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 12, lineHeight: 1.45 }}>
                  Public profile background atmosphere. Selecting a style applies it live — then
                  hard-refresh the public profile page.
                  {styleSaving ? " Saving style…" : ""}
                </div>
                <RestaurantStyleSelector
                  profileStyleKey={form.profile_style_key}
                  category={form.category}
                  cuisine={form.cuisine}
                  restaurantName={form.restaurant_name || selected.name}
                  applyMode="live"
                  onChange={handleStyleChange}
                />
              </PageCard>

              <PageCard style={{ padding: 22 }} data-testid="owner-profile-manager-menu-appearance">
                <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>
                  Menu Appearance
                </div>
                <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 12, lineHeight: 1.45 }}>
                  Default public menu chrome (patterns + readable surface). Custom Menu Lab layouts
                  keep their own styling. Selecting an appearance applies it live — then hard-refresh
                  the public menu.
                  {appearanceSaving ? " Saving appearance…" : ""}
                </div>
                <MenuAppearanceSelector
                  menuAppearanceKey={form.menu_appearance_key}
                  category={form.category}
                  cuisine={form.cuisine}
                  restaurantName={form.restaurant_name || selected.name}
                  defaultLayoutActive={true}
                  applyMode="live"
                  onChange={handleAppearanceChange}
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
