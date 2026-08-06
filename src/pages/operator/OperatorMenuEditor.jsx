/**
 * src/pages/operator/OperatorMenuEditor.jsx
 *
 * Menu Lab — select a menu, manage its items.
 *
 * GUARDRAIL: Upload paths (PDF, MKS Spreadsheet, paste) are the primary
 * onboarding workflow. Manual single-item entry is the secondary correction
 * workflow. Do NOT promote manual entry above upload actions in the empty state.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import {
  CURATED_MENU_DESIGN_LAB_THEMES,
  getMenuDesignLabTheme,
} from "../../data/menuDesignLabThemes.js";
import {
  buildMenuThemeSettingsFromPreset,
  normalizeMenuThemeSettings,
} from "../../components/menu-templates/menuThemeSettings.js";
import MenuAppearanceSelector from "../../components/operator/MenuAppearanceSelector.jsx";
import MenuWallpaperSelector from "../../components/operator/MenuWallpaperSelector.jsx";
import { buildMenuLabPreviewPath } from "../../lib/menuLabPreviewUrl.js";
import {
  resolveRestaurantOnboardingState,
  navigateWithRestaurantOnboardingState,
} from "../../lib/restaurantOnboardingState.js";
import MenuItemModifiersEditor, {
  toEditorGroups,
  fromEditorGroups,
} from "../../components/menuEditor/MenuItemModifiersEditor.jsx";

const CANONICAL_MENU_CATEGORIES = [
  "Appetizers",
  "Drinks",
  "Desserts",
  "Entrees",
  "Salads",
  "Soups",
];

// ── Tiny shared styles ─────────────────────────────────────────────────────
const INPUT = {
  padding: "9px 12px",
  fontSize: 13,
  border: "1.5px solid #e4e9f0",
  borderRadius: 8,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const BTN = (variant = "primary") => ({
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "inherit",
  ...(variant === "primary"  && { background: "#1F4E3D", color: "#fff" }),
  ...(variant === "ghost"    && { background: "transparent", color: "#1F4E3D", border: "1.5px solid #1F4E3D" }),
  ...(variant === "danger"   && { background: "transparent", color: "#b91c1c", border: "1.5px solid #fecaca" }),
  ...(variant === "muted"    && { background: "#f4f3ef", color: "#5b6675" }),
  ...(variant === "publish"  && { background: "#1F4E3D", color: "#fff", fontSize: 12, padding: "5px 12px" }),
});

function StatusBadge({ status }) {
  const map = {
    active:   { bg: "#d1fae5", color: "#065f46" },
    draft:    { bg: "#fef9c3", color: "#854d0e" },
    removed:  { bg: "#fee2e2", color: "#991b1b" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
      {status || "draft"}
    </span>
  );
}

// ── New/Edit item form ─────────────────────────────────────────────────────
function ItemForm({ initial = {}, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    description: initial.description || "",
    price: initial.price ?? "",
    canonical_category: initial.canonical_category || "",
    display_category_label: initial.display_category_label || "",
  });
  const [modifierGroups, setModifierGroups] = useState(() =>
    toEditorGroups(initial.modifier_groups)
  );
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{
      background: "#f8faf9",
      border: "1.5px solid #1F4E3D",
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div className="operator-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Item name *</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.name} onChange={f("name")} placeholder="e.g. House Burger" required />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Price</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.price} onChange={f("price")} placeholder="12.99" type="number" step="0.01" min="0" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Canonical category *</label>
          <select style={{ ...INPUT, width: "100%", cursor: "pointer" }} value={form.canonical_category} onChange={f("canonical_category")}>
            <option value="">Select a canonical category</option>
            {CANONICAL_MENU_CATEGORIES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 4 }}>
            Canonical categories are controlled by Common Knowledge. Display labels are presentation-only.
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Description</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.description} onChange={f("description")} placeholder="Short description" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Display label</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.display_category_label} onChange={f("display_category_label")} placeholder="e.g. Mains or Starters" />
        </div>
      </div>
      <MenuItemModifiersEditor value={modifierGroups} onChange={setModifierGroups} />
      <div className="operator-responsive-card-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={BTN("muted")} onClick={onCancel} type="button">Cancel</button>
        <button
          style={{ ...BTN("primary"), opacity: busy ? 0.6 : 1 }}
          disabled={busy || !form.name.trim() || !form.canonical_category}
          onClick={() => onSave({ ...form, modifier_groups: fromEditorGroups(modifierGroups) })}
          type="button"
        >
          {busy ? "Saving…" : initial.id ? "Save changes" : "Add item"}
        </button>
      </div>
    </div>
  );
}

// ── Item row ───────────────────────────────────────────────────────────────
function ItemRow({ item, photoUrl, onEdit, onPublish, onDelete, onPhotoUpload, actionBusy }) {
  const fileRef = useRef(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadBusy(true);
    onPhotoUpload(item, file).finally(() => {
      setUploadBusy(false);
      e.target.value = "";
    });
  }

  return (
    <div className="operator-responsive-row" style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 14px",
      background: "#fff",
      border: "1px solid #e4e9f0",
      borderRadius: 10,
    }}>
      {/* Photo thumbnail */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: 6, background: "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0, color: "#b0bbc8",
        }}>
          🍽
        </div>
      )}

      <div style={{ fontSize: 11, color: "#b0bbc8", fontWeight: 600, minWidth: 52 }}>
        {item.item_number || "—"}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f1720" }}>{item.name}</span>
        {item.description && (
          <span style={{ fontSize: 12, color: "#8a9ab0", marginLeft: 8 }}>{item.description}</span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1720", minWidth: 52, textAlign: "right" }}>
        {item.price != null ? `$${Number(item.price).toFixed(2)}` : ""}
      </div>
      <StatusBadge status={item.status} />

      <div className="operator-responsive-card-actions" style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {/* Photo upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          style={{ ...BTN("muted"), fontSize: 12, padding: "5px 10px", opacity: uploadBusy ? 0.6 : 1 }}
          disabled={uploadBusy || actionBusy}
          onClick={() => fileRef.current?.click()}
          title="Add photo"
        >
          {uploadBusy ? "…" : "📷"}
        </button>

        {/* Publish — always available */}
        <button style={BTN("publish")} disabled={actionBusy} onClick={() => onPublish(item)}>
          Publish
        </button>
        <button style={{ ...BTN("ghost"), fontSize: 12, padding: "5px 10px" }} onClick={() => onEdit(item)}>
          Edit
        </button>
        <button style={{ ...BTN("danger"), fontSize: 12, padding: "5px 10px" }} disabled={actionBusy} onClick={() => onDelete(item)}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Upload action card ─────────────────────────────────────────────────────
function UploadCard({ icon, label, sub, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "18px 12px",
        background: hovered ? "#f0f7f4" : "#f8faf9",
        border: `1.5px solid ${hovered ? "#1F4E3D" : "#d1e7dd"}`,
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "inherit",
        minWidth: 120,
        flex: 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1F4E3D" }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: "#8a9ab0", textAlign: "center" }}>{sub}</span>}
    </button>
  );
}

function MenuLabPresetCard({ theme, selected, locked, onPreview, onEdit }) {
  const accent = theme?.preset?.colorDefaults?.accent || theme?.preset?.colorDefaults?.primary || "#1F4E3D";
  const isSystemDefault = theme?.style === "v1";
  return (
    <div
      style={{
        padding: "14px 14px 13px",
        borderRadius: 14,
        border: `1.5px solid ${selected ? accent : locked ? "#e5e7eb" : "#dbe3eb"}`,
        background: selected ? `${accent}12` : locked ? "#f9fafb" : "#fff",
        boxShadow: selected ? `0 0 0 1px ${accent}22 inset` : "none",
        textAlign: "left",
        fontFamily: "inherit",
        minHeight: 130,
        display: "flex",
        flexDirection: "column",
        gap: 7,
        opacity: locked ? 0.72 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1720" }}>{theme.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {isSystemDefault && (
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1F4E3D", padding: "3px 8px", borderRadius: 999, background: "#edf7f2", border: "1px solid #c6e9d9" }}>
              Default
            </div>
          )}
          {selected && (
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, padding: "3px 8px", borderRadius: 999, background: `${accent}14` }}>
              Active
            </div>
          )}
          {locked && !selected && (
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", padding: "3px 8px", borderRadius: 999, background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
              Verified only
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#4b5563" }}>{theme.bestFit}</div>
      <div style={{ fontSize: 12, lineHeight: 1.45, color: "#6b7280", flex: 1 }}>{theme.description}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button
          type="button"
          onClick={() => onPreview(theme.style)}
          style={{ flex: 1, padding: "7px 6px", borderRadius: 8, border: `1px solid ${accent}44`, background: "transparent", color: accent, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.25 }}
        >
          Preview my menu
        </button>
        <button
          type="button"
          onClick={locked ? undefined : () => onEdit(theme.style)}
          disabled={locked}
          style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: locked ? "#e5e7eb" : accent, color: locked ? "#9ca3af" : "#fff", fontSize: 12, fontWeight: 800, cursor: locked ? "not-allowed" : "pointer", fontFamily: "inherit" }}
        >
          {locked ? "Locked" : "Use"}
        </button>
      </div>
    </div>
  );
}

function MenuLabPanel({
  rid,
  isEmailVerified,
  selectedMenuId = null,
  restaurantName = "",
  restaurantCategory = "",
}) {
  const [settings, setSettings] = useState(() => ({
    menu_style: "v1",
    primary_color: null,
    accent_color: null,
    background_style: "light",
    hero_enabled: true,
    image_density: "all",
    logo_placement: "top-left",
    font_preset: "default",
    section_heading_style: "default",
    item_image_style: "auto",
    price_placement: "right",
    intelligence_display_style: "subtle",
    intelligence_density: "subtle",
    nutrition_display: "compact",
    allergen_display: "icon",
    insight_display: "compact",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "compact",
  }));
  const [menuAppearanceKey, setMenuAppearanceKey] = useState(null);
  const [menuWallpaperKey, setMenuWallpaperKey] = useState(null);
  const [wallpaperCatalog, setWallpaperCatalog] = useState([]);
  const [appearanceCategory, setAppearanceCategory] = useState(restaurantCategory || "");
  const [appearanceCuisine, setAppearanceCuisine] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState("");
  const [heroUrl, setHeroUrl] = useState(null);
  const [heroBusy, setHeroBusy] = useState(false);
  const heroInputRef = useRef(null);

  const selectedTheme = getMenuDesignLabTheme(settings.menu_style || "v1");
  const defaultLayoutActive =
    String(settings.menu_style || "v1").toLowerCase() === "v1" ||
    String(settings.menu_style || "").toLowerCase() === "classic";

  const loadSettings = useCallback(async () => {
    if (!rid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [data, brand, appearance, wallpaper] = await Promise.all([
        api.getDisplaySettings(rid),
        api.getBrandProfile(rid).catch(() => null),
        api.getMenuAppearance(rid).catch(() => null),
        api.getMenuWallpaper(rid).catch(() => null),
      ]);
      if (data?.ok && data?.settings) {
        const normalized = normalizeMenuThemeSettings(data.settings);
        setSettings((current) => ({
          ...current,
          ...normalized,
          menu_style: normalized.menu_style || current.menu_style || "v1",
          logo_placement: data.settings.logo_placement || "top-left",
          font_preset: data.settings.font_preset || "default",
        }));
      }
      const nextHero =
        brand?.profile?.hero_image_url ||
        brand?.hero_image_url ||
        null;
      setHeroUrl(nextHero || null);
      if (appearance?.ok && appearance?.appearance) {
        setMenuAppearanceKey(
          appearance.appearance.menu_appearance_key === undefined ||
            appearance.appearance.menu_appearance_key === ""
            ? null
            : appearance.appearance.menu_appearance_key
        );
        setAppearanceCategory(appearance.appearance.category || restaurantCategory || "");
        setAppearanceCuisine(appearance.appearance.cuisine || "");
      } else {
        setAppearanceCategory(restaurantCategory || "");
      }
      if (wallpaper?.ok) {
        setMenuWallpaperKey(
          wallpaper?.wallpaper?.menu_wallpaper_key === undefined ||
            wallpaper?.wallpaper?.menu_wallpaper_key === ""
            ? null
            : wallpaper.wallpaper.menu_wallpaper_key
        );
        setWallpaperCatalog(
          Array.isArray(wallpaper.menu_wallpaper_catalog) ? wallpaper.menu_wallpaper_catalog : []
        );
      }
    } catch {
      // Keep defaults if loading fails.
    } finally {
      setLoading(false);
    }
  }, [rid, restaurantCategory]);

  async function handleHeroFile(file) {
    if (!rid || !file) return;
    setHeroBusy(true);
    setStatus("");
    try {
      const result = await api.uploadBrandHero(rid, file);
      const url = result?.hero_image_url || null;
      if (url) setHeroUrl(url);
      setStatus("Hero image updated.");
    } catch (err) {
      setStatus(err.message || "Failed to upload hero image.");
    } finally {
      setHeroBusy(false);
    }
  }

  async function handleHeroClear() {
    if (!rid) return;
    setHeroBusy(true);
    setStatus("");
    try {
      await api.removeBrandHero(rid);
      setHeroUrl(null);
      setStatus("Hero image removed.");
    } catch (err) {
      setStatus(err.message || "Failed to remove hero image.");
    } finally {
      setHeroBusy(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function applyPreset(theme) {
    if (!theme) return;
    setStatus("");
    setSaved(false);
    setSettings((current) => ({
      ...current,
      ...buildMenuThemeSettingsFromPreset(theme),
    }));
  }

  async function saveDesign() {
    if (!rid) return;
    setSaving(true);
    setStatus("");
    setSaved(false);
    try {
      const payload = {
        ...normalizeMenuThemeSettings({
          ...settings,
          menu_style: settings.menu_style || "v1",
          primary_color: settings.primary_color || null,
          accent_color: settings.accent_color || settings.primary_color || null,
          background_style: settings.background_style || "light",
          hero_enabled: settings.hero_enabled !== false,
          image_density: settings.image_density || "all",
          section_heading_style: settings.section_heading_style || "default",
          item_image_style: settings.item_image_style || settings.image_density || "auto",
          price_placement: settings.price_placement || "right",
          intelligence_display_style: settings.intelligence_display_style || "subtle",
          intelligence_density: settings.intelligence_density || "subtle",
          nutrition_display: settings.nutrition_display || "compact",
          allergen_display: settings.allergen_display || "icon",
          insight_display: settings.insight_display || "compact",
          compare_enabled: settings.compare_enabled !== false,
          similar_enabled: settings.similar_enabled !== false,
          indulgence_display: settings.indulgence_display || "compact",
        }),
        logo_placement: settings.logo_placement || "top-left",
        font_preset: settings.font_preset || "default",
      };
      const data = await api.updateDisplaySettings(rid, payload);
      if (data?.ok && data?.settings) {
        const normalized = normalizeMenuThemeSettings(data.settings);
        setSettings((current) => ({
          ...current,
          ...normalized,
          item_image_style: data.settings.item_image_style || normalized.item_image_style,
          logo_placement: data.settings.logo_placement || "top-left",
          font_preset: data.settings.font_preset || "default",
        }));
      }
      const appearanceRes = await api.updateMenuAppearance(rid, menuAppearanceKey);
      if (appearanceRes?.ok && appearanceRes?.appearance) {
        setMenuAppearanceKey(
          appearanceRes.appearance.menu_appearance_key === undefined ||
            appearanceRes.appearance.menu_appearance_key === ""
            ? null
            : appearanceRes.appearance.menu_appearance_key
        );
        setAppearanceCategory(appearanceRes.appearance.category || appearanceCategory);
        setAppearanceCuisine(appearanceRes.appearance.cuisine || appearanceCuisine);
      }
      const wallpaperRes = await api.updateMenuWallpaper(rid, menuWallpaperKey);
      if (wallpaperRes?.ok && wallpaperRes?.wallpaper) {
        setMenuWallpaperKey(
          wallpaperRes.wallpaper.menu_wallpaper_key === undefined ||
            wallpaperRes.wallpaper.menu_wallpaper_key === ""
            ? null
            : wallpaperRes.wallpaper.menu_wallpaper_key
        );
      }
      setSaved(true);
      setStatus("Menu design saved.");
      window.setTimeout(() => setSaved(false), 2600);
    } catch (err) {
      setStatus(err.message || "Failed to save menu design.");
    } finally {
      setSaving(false);
    }
  }

  function openStylePreview(style) {
    if (!rid) return;
    const resolved = style || settings.menu_style || "v1";
    const path = buildMenuLabPreviewPath(rid, {
      menuStyle: resolved,
      menuAppearanceKey,
      menuWallpaperKey,
      category: appearanceCategory,
      cuisine: appearanceCuisine,
      designEdit: true,
      primaryColor: settings.primary_color || settings.accent_color || null,
      accentColor: settings.accent_color || settings.primary_color || null,
      backgroundStyle: settings.background_style || null,
    });
    window.open(path, "_blank", "noopener,noreferrer");
  }

  function openPreview() {
    openStylePreview(settings.menu_style || "v1");
  }

  function selectPreset(style) {
    applyPreset(getMenuDesignLabTheme(style));
  }

  function openPublicMenu() {
    window.open(`/restaurants/${rid}/menu`, "_blank", "noopener,noreferrer");
  }

  const controlStyle = {
    padding: "9px 10px",
    fontSize: 13,
    border: "1.5px solid #dbe3eb",
    borderRadius: 10,
    background: "#fff",
    color: "#0f1720",
    fontFamily: "inherit",
    boxSizing: "border-box",
    width: "100%",
  };

  return (
    <section style={{
      background: "#fff",
      border: "1px solid #e4e9f0",
      borderRadius: 16,
      padding: "18px 18px 16px",
      marginBottom: 22,
      boxShadow: "0 12px 32px rgba(15, 23, 42, 0.04)",
      maxWidth: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16, maxWidth: "100%", minWidth: 0 }}>
        <div style={{ minWidth: 0, flex: "1 1 240px" }}>
          <Link
            to="/operator"
            style={{
              display: "inline-block",
              fontSize: 13,
              fontWeight: 650,
              color: "#1F4E3D",
              textDecoration: "none",
              marginBottom: 8,
            }}
          >
            ← Operator Home
          </Link>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.03em" }}>Menu Lab</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, lineHeight: 1.5, maxWidth: 760 }}>
            Default (Yellow Browser Apple look) is auto-selected for every menu. Preview any layout with your real restaurant and items, then Use + Save Design. This panel is for layout, photos, and colors — edit menu data in the tools below.
          </div>
        </div>
        <div
          data-testid="menu-lab-header-actions"
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignItems: "center",
            maxWidth: "100%",
            minWidth: 0,
            flex: "1 1 220px",
          }}
        >
          <button type="button" style={BTN("ghost")} onClick={openPreview} disabled={!rid}>
            Preview
          </button>
          <button type="button" style={BTN("primary")} onClick={saveDesign} disabled={saving || !rid}>
            {saving ? "Saving…" : "Save Design"}
          </button>
          <button type="button" style={BTN("muted")} onClick={openPublicMenu} disabled={!rid}>
            View Public Menu
          </button>
          <Link
            data-testid="menu-lab-redesign-my-menu"
            to={`/operator/marketplace?service_category=menuply_menu_design${
              selectedMenuId ? `&menu_id=${encodeURIComponent(selectedMenuId)}` : ""
            }`}
            style={{
              ...BTN("ghost"),
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Redesign My Menu
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1F4E3D", background: "#edf7f2", borderRadius: 999, padding: "4px 10px" }}>
          {selectedTheme.name}
        </div>
        {saved ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46", background: "#d1fae5", borderRadius: 999, padding: "4px 10px" }}>
            Saved
          </div>
        ) : null}
        {status ? (
          <div style={{ fontSize: 12, color: "#0f1720", padding: "4px 0" }}>{status}</div>
        ) : null}
      </div>

      {loading ? (
        <div style={{ color: "#8a9ab0", fontSize: 13 }}>Loading design settings…</div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}>
            {CURATED_MENU_DESIGN_LAB_THEMES.map((theme) => (
              <MenuLabPresetCard
                key={theme.style}
                theme={theme}
                selected={(settings.menu_style || "v1") === theme.style}
                locked={!!(theme.subscriberOnly && !isEmailVerified)}
                onPreview={openStylePreview}
                onEdit={selectPreset}
              />
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, lineHeight: 1.45 }}>
            Preview my menu opens your restaurant’s items in that layout — not sample data.
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Primary color
              <input
                type="color"
                value={settings.primary_color || settings.accent_color || "#1F4E3D"}
                onChange={(e) => setSettings((current) => ({
                  ...current,
                  primary_color: e.target.value,
                  accent_color: e.target.value,
                }))}
                style={{ ...controlStyle, height: 44, padding: 6 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Accent color
              <input
                type="color"
                value={settings.accent_color || settings.primary_color || "#1F4E3D"}
                onChange={(e) => setSettings((current) => ({
                  ...current,
                  accent_color: e.target.value,
                }))}
                style={{ ...controlStyle, height: 44, padding: 6 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Background style
              <select
                value={settings.background_style || "light"}
                onChange={(e) => setSettings((current) => ({ ...current, background_style: e.target.value }))}
                style={controlStyle}
                disabled={defaultLayoutActive}
                data-testid="menu-lab-background-style"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="paper">Paper</option>
                <option value="chalkboard">Chalkboard</option>
                <option value="charcoal">Charcoal</option>
              </select>
              {defaultLayoutActive ? (
                <span style={{ fontWeight: 500, color: "#9a3412", lineHeight: 1.35 }}>
                  Default layout uses Menu Appearance below for page chrome — this control applies to custom Menu Lab layouts.
                </span>
              ) : null}
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Image density
              <select
                value={settings.image_density || "all"}
                onChange={(e) => setSettings((current) => ({
                  ...current,
                  image_density: e.target.value,
                  item_image_style: e.target.value === "section" ? "section" : e.target.value,
                }))}
                style={controlStyle}
              >
                <option value="all">All images</option>
                <option value="section">Section images</option>
                <option value="thumbnail">Item thumbnails</option>
                <option value="none">No images</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Item image style
              <select
                value={settings.item_image_style || "auto"}
                onChange={(e) => setSettings((current) => ({ ...current, item_image_style: e.target.value }))}
                style={controlStyle}
              >
                <option value="auto">Auto</option>
                <option value="all">All images</option>
                <option value="section">Section images only</option>
                <option value="thumbnail">Item thumbnails</option>
                <option value="none">No item images</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Section headings
              <select
                value={settings.section_heading_style || "default"}
                onChange={(e) => setSettings((current) => ({ ...current, section_heading_style: e.target.value }))}
                style={controlStyle}
              >
                <option value="default">Default</option>
                <option value="lines">Lines</option>
                <option value="decorative">Decorative</option>
                <option value="block">Block</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Price placement
              <select
                value={settings.price_placement || "right"}
                onChange={(e) => setSettings((current) => ({ ...current, price_placement: e.target.value }))}
                style={controlStyle}
              >
                <option value="right">Right</option>
                <option value="below">Below</option>
                <option value="inline">Inline</option>
                <option value="aligned">Aligned</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Hero image
              <button
                type="button"
                onClick={() => setSettings((current) => ({ ...current, hero_enabled: !current.hero_enabled }))}
                style={{
                  ...controlStyle,
                  minHeight: 44,
                  background: settings.hero_enabled ? "#edf7f2" : "#f4f7fa",
                  borderColor: settings.hero_enabled ? "#1F4E3D" : "#dbe3eb",
                  fontWeight: 700,
                  textAlign: "left",
                }}
              >
                {settings.hero_enabled ? "Enabled" : "Disabled"}
              </button>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) handleHeroFile(file);
                }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  disabled={heroBusy}
                  onClick={() => heroInputRef.current?.click()}
                  style={{
                    ...controlStyle,
                    width: "auto",
                    minHeight: 36,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: heroBusy ? "wait" : "pointer",
                  }}
                >
                  {heroBusy ? "Uploading…" : heroUrl ? "Replace hero" : "Upload hero"}
                </button>
                {heroUrl ? (
                  <button
                    type="button"
                    disabled={heroBusy}
                    onClick={handleHeroClear}
                    style={{
                      ...controlStyle,
                      width: "auto",
                      minHeight: 36,
                      padding: "8px 12px",
                      fontWeight: 700,
                      color: "#9f1239",
                      cursor: heroBusy ? "wait" : "pointer",
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {heroUrl ? (
                <img
                  src={heroUrl}
                  alt=""
                  style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 10, border: "1px solid #e4e9f0" }}
                />
              ) : null}
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Font style
              <select
                value={settings.font_preset || "default"}
                onChange={(e) => setSettings((current) => ({ ...current, font_preset: e.target.value }))}
                style={controlStyle}
              >
                <option value="default">Default</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="bold">Bold</option>
                <option value="serif">Serif</option>
                <option value="script">Script</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#475467" }}>
              Logo placement
              <select
                value={settings.logo_placement || "top-left"}
                onChange={(e) => setSettings((current) => ({ ...current, logo_placement: e.target.value }))}
                style={controlStyle}
              >
                <option value="top-left">Top left</option>
                <option value="center">Centered</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
          </div>

          <div
            data-testid="menu-lab-menu-appearance-section"
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: "1px solid #e4e9f0",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.02em" }}>
              Menu Appearance
            </div>
            <MenuAppearanceSelector
              menuAppearanceKey={menuAppearanceKey}
              category={appearanceCategory}
              cuisine={appearanceCuisine}
              restaurantName={restaurantName}
              defaultLayoutActive={defaultLayoutActive}
              onChange={(next) => {
                setMenuAppearanceKey(next);
                setSaved(false);
                setStatus("");
              }}
            />
            <div style={{ marginTop: 18, fontSize: 16, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.02em" }}>
              Menu Wallpaper
            </div>
            <MenuWallpaperSelector
              menuWallpaperKey={menuWallpaperKey}
              appearanceKey={menuAppearanceKey || "modern_minimal"}
              catalog={wallpaperCatalog}
              defaultLayoutActive={defaultLayoutActive}
              applyMode="draft"
              onChange={(next) => {
                setMenuWallpaperKey(next);
                setSaved(false);
                setStatus("");
              }}
              onRandomize={async () => {
                const res = await api.randomizeMenuWallpaper(rid, { source: "requested" });
                return res?.candidate || null;
              }}
              onKeep={async (candidate) => {
                const res = await api.keepMenuWallpaper(rid, {
                  candidate,
                  apply: true,
                  source: "requested",
                });
                if (res?.design?.key) {
                  setMenuWallpaperKey(res.design.key);
                  setWallpaperCatalog((prev) => {
                    const next = Array.isArray(prev) ? prev.slice() : [];
                    if (!next.some((e) => e.key === res.design.key)) next.push(res.design);
                    return next;
                  });
                }
                return res?.design || null;
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function OperatorMenuEditor() {
  const { selectedRestaurant, isEmailVerified } = useOperator();
  const rid = selectedRestaurant?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = resolveRestaurantOnboardingState({ routeState: location.state, search: location.search }).state;

  const [menus, setMenus]             = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [items, setItems]             = useState([]);
  const [itemPhotos, setItemPhotos]   = useState({});
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError]             = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [upgradePrompt, setUpgradePrompt] = useState(false);
  const [menuEditMode, setMenuEditMode] = useState(false);

  const [showNewMenuForm, setShowNewMenuForm] = useState(false);
  const [newMenuName, setNewMenuName]         = useState("");
  const [newMenuPresetType, setNewMenuPresetType] = useState("");
  const [newMenuBusy, setNewMenuBusy]         = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [actionBusy, setActionBusy]   = useState(false);
  const [editLoadingItemId, setEditLoadingItemId] = useState(null);

  const [showPasteForm, setShowPasteForm] = useState(false);
  const [pasteText, setPasteText]         = useState("");
  const [pasteBusy, setPasteBusy]         = useState(false);
  const [pasteSuccess, setPasteSuccess]   = useState(false);

  const [renamingMenuId, setRenamingMenuId] = useState(null);
  const [renameValue, setRenameValue]       = useState("");
  const [renameBusy, setRenameBusy]         = useState(false);
  const [deletingMenuId, setDeletingMenuId] = useState(null);

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  function clearStatus() {
    setStatusMessage(null);
  }

  function showSuccess(text) {
    setStatusMessage({ type: "success", text });
    setError("");
  }

  function showFailure(text) {
    setStatusMessage({ type: "error", text });
  }

  function exitMenuEditMode({ reload = false } = {}) {
    setMenuEditMode(false);
    setEditingItem(null);
    setShowAddItem(false);
    setEditLoadingItemId(null);
    if (reload && selectedMenuId) {
      loadItems(selectedMenuId);
    }
  }

  // Load menus
  useEffect(() => {
    if (!rid) return;
    setLoadingMenus(true);
    setError("");
    api.getMenus(rid)
      .then(d => {
        const list = d.menus || [];
        setMenus(list);
        if (list.length) {
          setSelectedMenuId((prev) => {
            if (prev && list.some((m) => m.id === prev)) return prev;
            return list[0].id;
          });
        } else {
          setSelectedMenuId(null);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingMenus(false));
  }, [rid]);

  // Load items when menu changes
  const loadItems = useCallback(async (menuId) => {
    if (!rid || !menuId) return;
    setLoadingItems(true);
    try {
      const d = await api.getMenuItems(rid, menuId);
      const nextItems = d.items || [];
      setItems(nextItems);
      const photoEntries = await Promise.all(
        nextItems.map(async (item) => {
          try {
            const photos = await api.listMenuItemPhotos(item.id);
            const primary =
              (photos?.photos || []).find((p) => p.status === "active" && p.is_primary) ||
              (photos?.photos || []).find((p) => p.status === "active");
            return primary?.photo_url ? [item.id, primary.photo_url] : null;
          } catch {
            return null;
          }
        })
      );
      const nextPhotos = {};
      for (const entry of photoEntries) {
        if (entry) nextPhotos[entry[0]] = entry[1];
      }
      setItemPhotos(nextPhotos);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingItems(false);
    }
  }, [rid]);

  // Upload photo for an item
  async function handlePhotoUpload(item, file) {
    try {
      const json = await api.uploadMenuItemPhoto(item.id, file, { isPrimary: true });
      const url = json.photo?.photo_url;
      if (url) setItemPhotos((prev) => ({ ...prev, [item.id]: url }));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (selectedMenuId) loadItems(selectedMenuId);
  }, [selectedMenuId, loadItems]);

  // Create menu
  async function handleCreateMenu() {
    if (!newMenuName.trim()) return;
    setNewMenuBusy(true);
    setUpgradePrompt(false);
    try {
      const body = { name: newMenuName.trim(), is_primary: menus.length === 0 };
      if (newMenuPresetType) body.preset_type = newMenuPresetType;
      const d = await api.createMenu(rid, body);
      const updated = [...menus, d.menu];
      setMenus(updated);
      setSelectedMenuId(d.menu.id);
      setNewMenuName("");
      setNewMenuPresetType("");
      setShowNewMenuForm(false);
    } catch (e) {
      if (e.status === 403 && e.payload?.upgrade_required) {
        setUpgradePrompt(true);
        setShowNewMenuForm(false);
      } else {
        setError(e.message);
      }
    } finally {
      setNewMenuBusy(false);
    }
  }

  // Publish menu
  async function handlePublishMenu() {
    if (!selectedMenuId) return;
    setActionBusy(true);
    clearStatus();
    try {
      const d = await api.publishMenu(rid, selectedMenuId);
      setMenus(menus.map(m => m.id === selectedMenuId ? { ...m, status: d.menu?.status } : m));
      if (onboarding?.restaurant_id) {
        navigateWithRestaurantOnboardingState(navigate, "/restaurant/onboarding/success", onboarding);
        return;
      }
      showSuccess(`"${selectedMenu?.name || "Menu"}" published successfully.`);
    } catch (e) {
      const msg = e.message || "Could not publish menu.";
      setError(msg);
      showFailure(msg);
    } finally {
      setActionBusy(false);
    }
  }

  // Add item
  function handleAddItemClick() {
    setShowAddItem((v) => !v);
    setEditingItem(null);
    setError("");
  }

  async function handleStartEdit(item) {
    if (!rid || !item?.id) return;
    setEditLoadingItemId(item.id);
    setShowAddItem(false);
    setError("");
    try {
      const data = await api.getMenuItem(rid, item.id);
      if (!data?.item) {
        throw new Error("Item data could not be loaded for editing.");
      }
      const raw = data.item;
      setEditingItem({
        ...raw,
        canonical_category: raw.canonical_category || raw.category || "",
        display_category_label: raw.display_category_label || raw.display_category || "",
      });
    } catch (e) {
      setError(e.message || "Item data could not be loaded for editing.");
    } finally {
      setEditLoadingItemId(null);
    }
  }

  async function handleAddItem(form) {
    setActionBusy(true);
    try {
      const d = await api.createMenuItem(rid, selectedMenuId, {
        name: form.name,
        description: form.description || null,
        price: form.price !== "" ? form.price : null,
        canonical_category: form.canonical_category,
        display_category_label: form.display_category_label || null,
      });
      if (Array.isArray(form.modifier_groups) && form.modifier_groups.length > 0 && d.item?.id) {
        await api.putMenuItemModifierGroups(rid, selectedMenuId, d.item.id, form.modifier_groups);
        d.item = { ...d.item, modifier_groups: form.modifier_groups };
      }
      setItems(prev => [...prev, d.item]);
      setShowAddItem(false);
      showSuccess(`Added "${form.name.trim()}".`);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  // Update item (save draft then publish immediately)
  async function handleEditSave(form) {
    setActionBusy(true);
    try {
      await api.updateMenuItem(rid, editingItem.id, {
        name: form.name,
        description: form.description || null,
        price: form.price !== "" ? form.price : null,
        canonical_category: form.canonical_category,
        display_category_label: form.display_category_label || null,
        modifier_groups: Array.isArray(form.modifier_groups) ? form.modifier_groups : [],
      });
      const published = await api.publishMenuItem(rid, editingItem.id);
      const withMods = {
        ...(published.item || {}),
        modifier_groups: Array.isArray(form.modifier_groups) ? form.modifier_groups : [],
      };
      setItems(prev => prev.map(i => i.id === editingItem.id ? withMods : i));
      setEditingItem(null);
      showSuccess(`Saved changes to "${form.name.trim()}".`);
    } catch (e) {
      setError(e.message || "Could not save item changes.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleSetPrimaryMenu(menuId) {
    try {
      const d = await api.updateMenu(rid, menuId, { is_primary: true });
      setMenus((prev) =>
        prev.map((m) => ({
          ...m,
          is_primary: m.id === menuId,
          ...(m.id === menuId ? { ...(d.menu || {}) } : {}),
        }))
      );
      showSuccess("Default menu updated.");
    } catch (e) {
      setError(e.message || "Could not set default menu.");
    }
  }

  async function handleToggleMenuActive(menuId, currentlyActive) {
    try {
      const nextActive = !currentlyActive;
      const d = await api.updateMenu(rid, menuId, {
        is_active: nextActive,
        is_public: nextActive,
      });
      setMenus((prev) =>
        prev.map((m) => (m.id === menuId ? { ...m, ...(d.menu || {}), is_active: nextActive, is_public: nextActive } : m))
      );
      showSuccess(nextActive ? "Menu activated." : "Menu deactivated (hidden from public tabs).");
    } catch (e) {
      setError(e.message || "Could not update menu visibility.");
    }
  }

  async function handleReorderMenu(menuId, direction) {
    const ordered = [...menus].sort(
      (a, b) =>
        Number(a.display_priority ?? a.sort_order ?? 9999) -
        Number(b.display_priority ?? b.sort_order ?? 9999)
    );
    const index = ordered.findIndex((m) => m.id === menuId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return;
    const a = ordered[index];
    const b = ordered[swapWith];
    const aPri = Number(a.display_priority ?? index);
    const bPri = Number(b.display_priority ?? swapWith);
    try {
      await Promise.all([
        api.updateMenu(rid, a.id, { display_priority: bPri }),
        api.updateMenu(rid, b.id, { display_priority: aPri }),
      ]);
      const refreshed = await api.getMenus(rid);
      setMenus(Array.isArray(refreshed?.menus) ? refreshed.menus : ordered);
      showSuccess("Menu order updated.");
    } catch (e) {
      setError(e.message || "Could not reorder menus.");
    }
  }

  // Publish item
  async function handlePublish(item) {
    setActionBusy(true);
    try {
      const d = await api.publishMenuItem(rid, item.id);
      setItems(prev => prev.map(i => i.id === item.id ? d.item : i));
      showSuccess(`Published "${item.name}".`);
    } catch (e) {
      const msg = e.message || "Could not publish item.";
      setError(msg);
      showFailure(msg);
    } finally {
      setActionBusy(false);
    }
  }

  // Delete item
  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.name}"?`)) return;
    setActionBusy(true);
    try {
      await api.deleteMenuItem(rid, item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      showSuccess(`Removed "${item.name}".`);
    } catch (e) {
      const msg = e.message || "Could not remove item.";
      setError(msg);
      showFailure(msg);
    } finally {
      setActionBusy(false);
    }
  }

  // Paste text submit
  async function handlePasteSubmit() {
    if (!pasteText.trim() || !rid) return;
    setPasteBusy(true);
    clearStatus();
    try {
      await api.submitMenuIntake(rid, pasteText.trim());
      setPasteText("");
      setShowPasteForm(false);
      setPasteSuccess(true);
      showSuccess("Menu text received. Menuply will structure it for review shortly.");
      setTimeout(() => setPasteSuccess(false), 6000);
    } catch (e) {
      const msg = e.message || "Could not submit menu text.";
      setError(msg);
      showFailure(msg);
    } finally {
      setPasteBusy(false);
    }
  }

  // Rename menu
  async function handleRenameMenu() {
    if (!renameValue.trim() || !renamingMenuId) return;
    setRenameBusy(true);
    try {
      const d = await api.updateMenu(rid, renamingMenuId, { name: renameValue.trim() });
      setMenus(prev => prev.map(m => m.id === renamingMenuId ? { ...m, name: d.menu?.name ?? renameValue.trim() } : m));
      setRenamingMenuId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setRenameBusy(false);
    }
  }

  // Delete menu
  async function handleDeleteMenu(menuId) {
    const menu = menus.find(m => m.id === menuId);
    if (!window.confirm(`Delete "${menu?.name}"? This cannot be undone.`)) return;
    setDeletingMenuId(menuId);
    try {
      await api.deleteMenu(rid, menuId);
      const remaining = menus.filter(m => m.id !== menuId);
      setMenus(remaining);
      if (selectedMenuId === menuId) {
        setSelectedMenuId(remaining.length ? remaining[0].id : null);
        setItems([]);
        setMenuEditMode(false);
      }
      showSuccess(`Deleted "${menu?.name || "menu"}".`);
    } catch (e) {
      const msg = e.message || "Could not delete menu.";
      setError(msg);
      showFailure(msg);
    } finally {
      setDeletingMenuId(null);
    }
  }

  const grouped = items.reduce((acc, item) => {
    const key = item.display_category_label || item.canonical_category || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (!rid) {
    return (
      <OperatorLayout title="Menu Lab">
        <p style={{ color: "#8a9ab0" }}>Select a restaurant from the sidebar to manage its menu.</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Menu Lab">
      <MenuLabPanel
        rid={rid}
        isEmailVerified={isEmailVerified}
        selectedMenuId={selectedMenuId}
        restaurantName={selectedRestaurant?.restaurant_name || selectedRestaurant?.name || ""}
        restaurantCategory={selectedRestaurant?.category || ""}
      />

      <div className="operator-responsive-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.03em" }}>Menu items</div>
          <div style={{ fontSize: 13, color: "#8a9ab0", marginTop: 4 }}>
            Upload your menu, add items, and edit what appears on your public profile.
          </div>
        </div>
      </div>

      {/* ── Top bar: New → Edit → Publish → Delete ───────────────── */}
      <div className="operator-responsive-actions" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>

        {/* Menu selector — tab chips */}
        {loadingMenus ? (
          <span style={{ color: "#8a9ab0", fontSize: 13 }}>Loading menus…</span>
        ) : menus.length === 0 ? (
          <span style={{ color: "#8a9ab0", fontSize: 13 }}>No menus yet</span>
        ) : (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {menus.map(m => {
              const active = m.id === selectedMenuId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setSelectedMenuId(m.id); setMenuEditMode(false); setShowAddItem(false); setEditingItem(null); }}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 999,
                    border: active ? "2px solid #1F4E3D" : "1.5px solid #dbe3eb",
                    background: active ? "#1F4E3D" : "#fff",
                    color: active ? "#fff" : "#0f1720",
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.name}
                  {m.is_primary ? <span style={{ marginLeft: 6, opacity: 0.85, fontSize: 11 }}>default</span> : null}
                  {m.is_active === false ? <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}>off</span> : null}
                  {m.status === "draft" ? <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}>draft</span> : null}
                </button>
              );
            })}
          </div>
        )}

        {/* New — always first */}
        <button style={BTN("muted")} onClick={() => { setShowNewMenuForm(v => !v); setUpgradePrompt(false); }}>
          + New
        </button>

        {/* Edit / Publish / Delete — for selected menu */}
        {selectedMenu && (
          renamingMenuId === selectedMenuId ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                style={{ ...INPUT, minWidth: 180 }}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") handleRenameMenu();
                  if (e.key === "Escape") setRenamingMenuId(null);
                }}
              />
              <button
                style={{ ...BTN("primary"), padding: "8px 12px" }}
                onClick={handleRenameMenu}
                disabled={renameBusy || !renameValue.trim()}
              >
                {renameBusy ? "…" : "Save"}
              </button>
              <button style={{ ...BTN("muted"), padding: "8px 10px" }} onClick={() => setRenamingMenuId(null)}>
                Cancel
              </button>
            </div>
          ) : menuEditMode ? (
            <>
              <button
                style={BTN("primary")}
                onClick={() => exitMenuEditMode({ reload: true })}
                type="button"
              >
                Save
              </button>
              <button
                style={BTN("muted")}
                onClick={() => exitMenuEditMode({ reload: true })}
                type="button"
              >
                Cancel
              </button>
              <button
                style={BTN("ghost")}
                onClick={() => { setRenamingMenuId(selectedMenuId); setRenameValue(selectedMenu.name); }}
                type="button"
              >
                Rename
              </button>
              <button
                style={BTN("ghost")}
                onClick={() => handleSetPrimaryMenu(selectedMenuId)}
                disabled={selectedMenu.is_primary === true}
                type="button"
                title="Show this menu first on the public page when entitled"
              >
                {selectedMenu.is_primary ? "Default" : "Set default"}
              </button>
              <button
                style={BTN("ghost")}
                onClick={() => handleToggleMenuActive(selectedMenuId, selectedMenu.is_active !== false)}
                type="button"
              >
                {selectedMenu.is_active === false ? "Activate" : "Deactivate"}
              </button>
              <button
                style={BTN("ghost")}
                onClick={() => handleReorderMenu(selectedMenuId, -1)}
                type="button"
                title="Move tab earlier"
              >
                ← Order
              </button>
              <button
                style={BTN("ghost")}
                onClick={() => handleReorderMenu(selectedMenuId, 1)}
                type="button"
                title="Move tab later"
              >
                Order →
              </button>
              <button
                style={BTN("ghost")}
                onClick={handlePublishMenu}
                disabled={actionBusy}
                type="button"
              >
                Publish
              </button>
              <button
                style={BTN("danger")}
                disabled={deletingMenuId === selectedMenuId}
                onClick={() => handleDeleteMenu(selectedMenuId)}
                type="button"
              >
                {deletingMenuId === selectedMenuId ? "…" : "Delete"}
              </button>
            </>
          ) : (
            <>
              <button
                style={BTN("ghost")}
                onClick={() => {
                  clearStatus();
                  setMenuEditMode(true);
                }}
                type="button"
              >
                Edit
              </button>
              <button
                style={BTN("ghost")}
                onClick={handlePublishMenu}
                disabled={actionBusy}
                type="button"
              >
                Publish
              </button>
              <button
                style={BTN("danger")}
                disabled={deletingMenuId === selectedMenuId}
                onClick={() => handleDeleteMenu(selectedMenuId)}
                type="button"
              >
                {deletingMenuId === selectedMenuId ? "…" : "Delete"}
              </button>
            </>
          )
        )}

        {/* Right side: add item — only when menu has existing items (empty state has its own button) */}
        {items.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button style={BTN("primary")} onClick={handleAddItemClick}>
              + Add Item
            </button>
          </div>
        )}
      </div>

      {/* New menu inline form */}
      {showNewMenuForm && (
        <div className="operator-responsive-inline-form" style={{
          background: "#fff",
          border: "1.5px solid #1F4E3D",
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475467", marginBottom: 8 }}>Quick start — pick a menu type</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {[
              { label: "Lunch", preset: "lunch" },
              { label: "Dinner", preset: "dinner" },
              { label: "Breakfast", preset: "breakfast" },
              { label: "Specials", preset: "custom", name: "Specials" },
              { label: "Happy Hour", preset: "custom", name: "Happy Hour" },
              { label: "Catering", preset: "custom", name: "Catering Menu" },
              { label: "Kids Menu", preset: "custom", name: "Kids Menu" },
              { label: "Special Event", preset: "custom", name: "Special Event" },
            ].map(({ label, preset, name }) => {
              const active = newMenuName === (name || label.charAt(0).toUpperCase() + label.slice(1) + " Menu") ||
                (newMenuPresetType === preset && !name && newMenuName === label.charAt(0).toUpperCase() + label.slice(1) + " Menu");
              const resolvedName = name || (label.charAt(0).toUpperCase() + label.slice(1) + " Menu");
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setNewMenuPresetType(preset);
                    setNewMenuName(resolvedName);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: newMenuName === resolvedName ? "2px solid #1F4E3D" : "1.5px solid #dbe3eb",
                    background: newMenuName === resolvedName ? "#edf7f2" : "#f4f7fa",
                    color: newMenuName === resolvedName ? "#1F4E3D" : "#475467",
                    fontWeight: newMenuName === resolvedName ? 700 : 500,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 }}>Menu name</label>
              <input
                style={{ ...INPUT, width: "100%" }}
                value={newMenuName}
                onChange={e => { setNewMenuName(e.target.value); if (!e.target.value) setNewMenuPresetType(""); }}
                placeholder="e.g. Lunch Menu, Seasonal Specials"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleCreateMenu()}
              />
            </div>
            <button style={BTN("primary")} onClick={handleCreateMenu} disabled={newMenuBusy || !newMenuName.trim()}>
              {newMenuBusy ? "Creating…" : "Create"}
            </button>
            <button style={BTN("muted")} onClick={() => { setShowNewMenuForm(false); setNewMenuName(""); setNewMenuPresetType(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Upgrade prompt */}
      {upgradePrompt && (
        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10,
          padding: "12px 16px", fontSize: 13, marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <span style={{ color: "#92400e" }}>
            Multiple menus require a paid plan.{" "}
            <button
              onClick={() => navigate("/operator/subscription")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#1F4E3D", fontWeight: 700, fontSize: 13, padding: 0, textDecoration: "underline" }}
            >
              Upgrade to Pro →
            </button>
          </span>
          <button onClick={() => setUpgradePrompt(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#92400e", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
          padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 16,
          display: "flex", justifyContent: "space-between",
        }}>
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {statusMessage && (
        <div style={{
          background: statusMessage.type === "success" ? "#d1fae5" : "#fef2f2",
          border: `1px solid ${statusMessage.type === "success" ? "#6ee7b7" : "#fecaca"}`,
          borderRadius: 10,
          padding: "10px 14px",
          color: statusMessage.type === "success" ? "#065f46" : "#b91c1c",
          fontSize: 13,
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}>
          {statusMessage.text}
          <button
            onClick={clearStatus}
            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "inherit" }}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* Paste success banner */}
      {pasteSuccess && (
        <div style={{
          background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 10,
          padding: "10px 14px", color: "#065f46", fontSize: 13, marginBottom: 16,
        }}>
          Menu text received. Menuply will structure it for review shortly.
        </div>
      )}

      {showPasteForm && (
        <div style={{
          background: "#f8faf9", border: "1.5px solid #1F4E3D", borderRadius: 12,
          padding: "16px 18px", marginBottom: 20,
        }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 6 }}>
            Paste your menu text below
          </label>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste menu items, sections, prices — any format is fine."
            rows={6}
            style={{ ...INPUT, width: "100%", resize: "vertical", lineHeight: 1.5 }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button style={BTN("muted")} onClick={() => setShowPasteForm(false)} type="button">Cancel</button>
            <button
              style={{ ...BTN("primary"), opacity: (pasteBusy || !pasteText.trim()) ? 0.6 : 1 }}
              disabled={pasteBusy || !pasteText.trim()}
              onClick={handlePasteSubmit}
              type="button"
            >
              {pasteBusy ? "Sending…" : "Send to Menuply"}
            </button>
          </div>
        </div>
      )}

      {/* Add item form */}
      {showAddItem && (
        <div style={{ marginBottom: 20 }}>
          <ItemForm
            onSave={handleAddItem}
            onCancel={() => setShowAddItem(false)}
            busy={actionBusy}
          />
        </div>
      )}

      {/* ── Items area ───────────────────────────────────────────────── */}
      {loadingItems ? (
        <p style={{ color: "#8a9ab0", fontSize: 13 }}>Loading items…</p>
      ) : !selectedMenuId ? (

        /* No menu selected */
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "40px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>☰</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 8 }}>No menu selected</div>
          <div style={{ fontSize: 13, color: "#8a9ab0", marginBottom: 20 }}>
            Create a menu above, then paste text, upload a PDF, or add items one at a time.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <UploadCard icon="📋" label="Paste menu text" sub="Copy & paste your menu" onClick={() => setShowPasteForm(true)} />
            <UploadCard icon="📄" label="Upload PDF" sub="PDF menu file" onClick={() => navigate("/operator/menu/upload/pdf")} />
            <UploadCard icon="📷" label="Photo / image" sub="JPG, PNG, WEBP" onClick={() => navigate("/operator/menu/upload/photo")} />
            <UploadCard icon="📸" label="Camera upload" sub="Page-by-page review" onClick={() => navigate("/operator/menu/camera-upload")} />
          </div>
          <div style={{ textAlign: "center" }}>
            <button style={BTN("muted")} onClick={() => setShowNewMenuForm(true)} type="button">
              + New menu
            </button>
          </div>
        </div>

      ) : items.length === 0 ? (

        /* Empty menu — show upload cards inline */
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "28px 24px",
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 6 }}>
              Add your menu
            </div>
            <div style={{ fontSize: 13, color: "#8a9ab0" }}>
              Upload your existing menu or add items one at a time.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <UploadCard icon="📋" label="Paste menu text" sub="Copy & paste your menu" onClick={() => setShowPasteForm(true)} />
            <UploadCard icon="📄" label="Upload PDF" sub="PDF menu file" onClick={() => navigate("/operator/menu/upload/pdf")} />
            <UploadCard icon="📷" label="Photo / image" sub="JPG, PNG, WEBP" onClick={() => navigate("/operator/menu/upload/photo")} />
            <UploadCard icon="📸" label="Camera upload" sub="Page-by-page review" onClick={() => navigate("/operator/menu/camera-upload")} />
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            color: "#c4cdd6", fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: "#e4e9f0" }} />
            <span>or add a single item</span>
            <div style={{ flex: 1, height: 1, background: "#e4e9f0" }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <button type="button" style={BTN("muted")} onClick={handleAddItemClick}>
              + Add Item
            </button>
          </div>
        </div>

      ) : menuEditMode && items.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "28px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 8 }}>No items in this menu yet</div>
          <div style={{ fontSize: 13, color: "#8a9ab0", marginBottom: 16 }}>
            Paste menu text, upload a PDF or photo, or add a single item below.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
            <UploadCard icon="📋" label="Paste menu text" sub="Copy & paste" onClick={() => setShowPasteForm(true)} />
            <UploadCard icon="📄" label="Upload PDF" sub="PDF file" onClick={() => navigate("/operator/menu/upload/pdf")} />
            <UploadCard icon="📷" label="Photo / image" sub="Menu photo" onClick={() => navigate("/operator/menu/upload/photo")} />
            <UploadCard icon="📸" label="Camera upload" sub="Page-by-page review" onClick={() => navigate("/operator/menu/camera-upload")} />
          </div>
          <button type="button" style={BTN("primary")} onClick={handleAddItemClick}>
            + Add Item
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([section, sectionItems]) => (
          <div key={section} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", color: "#8a9ab0", marginBottom: 8 }}>
              {section}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sectionItems.map(item =>
                editingItem?.id === item.id ? (
                  <ItemForm
                    key={item.id}
                    initial={item}
                    onSave={handleEditSave}
                    onCancel={() => setEditingItem(null)}
                    busy={actionBusy}
                  />
                ) : (
                  <ItemRow
                    key={item.id}
                    item={item}
                    photoUrl={itemPhotos[item.id] || null}
                    onEdit={handleStartEdit}
                    onPublish={handlePublish}
                    onDelete={handleDelete}
                    onPhotoUpload={handlePhotoUpload}
                    actionBusy={actionBusy || editLoadingItemId === item.id}
                  />
                )
              )}
            </div>
          </div>
        ))
      )}
    </OperatorLayout>
  );
}
