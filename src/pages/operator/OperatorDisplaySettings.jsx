/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorDisplaySettings.jsx
 * Date: 2026-03-23
 * Purpose:
 *   Operator settings page for the TV Menu Board feature.
 *   Route: /operator/display-settings (Pro plan, benefit: tv_menu_board)
 *
 *   Allows operators to:
 *   - Choose display layout (List / Grid)
 *   - Toggle item descriptions and deal highlighting
 *   - Set an accent/brand color
 *   - Copy or open the TV display link
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { MENU_DESIGN_LAB_THEMES } from "../../data/menuDesignLabThemes.js";

const ACCENT_PRESETS = [
  { label: "Green",   value: "#4ade80" },
  { label: "Amber",   value: "#f59e0b" },
  { label: "Blue",    value: "#60a5fa" },
  { label: "Rose",    value: "#f87171" },
  { label: "Violet",  value: "#a78bfa" },
  { label: "White",   value: "#f0f0f0" },
];

export default function OperatorDisplaySettings() {
  const { selectedRestaurant, hasBenefit } = useOperator();
  const rid = selectedRestaurant?.id;

  const [settings, setSettings] = useState({
    layout_preset:    "list",
    show_descriptions: true,
    highlight_deals:  true,
    accent_color:     null,
    menu_style:       "v1",
    theme_preset:     "v1",
    primary_color:    null,
    secondary_color:  null,
    background_style: "dark",
    image_density:    "all",
    hero_image_enabled: true,
    section_heading_style: "default",
    price_placement: "right",
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [copyText, setCopyText] = useState("Copy Display Link");

  const displayUrl = rid ? `${window.location.origin}/public/restaurants/${rid}/display` : null;
  const isPro = hasBenefit("tv_menu_board");

  const loadSettings = useCallback(async () => {
    if (!rid) { setLoading(false); return; }
    try {
      const data = await api.getDisplaySettings(rid);
      if (data.ok && data.settings) {
        setSettings((s) => ({ ...s, ...data.settings }));
      }
    } catch {
      // Use defaults if load fails
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  async function handleSave() {
    if (!rid) return;
    setSaving(true);
    setSaved(false);
    try {
      const data = await api.updateDisplaySettings(rid, settings);
      if (data.ok && data.settings) setSettings((s) => ({ ...s, ...data.settings }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink() {
    if (!displayUrl) return;
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopyText("Copied!");
      setTimeout(() => setCopyText("Copy Display Link"), 2500);
    } catch {
      setCopyText("Copy failed");
      setTimeout(() => setCopyText("Copy Display Link"), 2500);
    }
  }

  if (!isPro) {
    return (
      <OperatorLayout title="Display Board">
        <div style={{
          maxWidth: 500,
          background: "#fff",
          border: "1px solid #e4e9f0",
          borderRadius: 16,
          padding: "36px 32px",
        }}>
          <div style={{ fontSize: 28, marginBottom: 14 }}>📺</div>
          <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "#0f1720" }}>
            TV Menu Board
          </h2>
          <p style={{ margin: "0 0 8px", fontSize: 14, color: "#5b6675", lineHeight: 1.6 }}>
            Show your live menu on TV screens and in-store monitors.
            Menu updates appear automatically — no reprinting, no extra software.
          </p>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#8a9ab0", lineHeight: 1.6 }}>
            Available on the Pro plan.
          </p>
          <a
            href="/operator/subscription"
            style={{
              display: "inline-block",
              background: "#1F4E3D",
              color: "#fff",
              borderRadius: 10,
              padding: "11px 24px",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Upgrade to Pro →
          </a>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Display Board">
      <div style={{ maxWidth: 560 }}>

        {/* Display URL card */}
        <div style={{
          background: "#fff",
          border: "1px solid #e4e9f0",
          borderRadius: 14,
          padding: "20px 22px",
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5b6675", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
            Your TV Display URL
          </div>
          <div style={{
            fontSize: 13,
            color: "#0f1720",
            fontFamily: "monospace",
            background: "#f4f3ef",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            wordBreak: "break-all",
            lineHeight: 1.5,
          }}>
            {displayUrl || "—"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => displayUrl && window.open(displayUrl, "_blank")}
              disabled={!displayUrl}
              style={btnStyle("#1F4E3D", "#fff")}
            >
              Open Display
            </button>
            <button
              onClick={handleCopyLink}
              disabled={!displayUrl}
              style={btnStyle("#f4f3ef", "#0f1720", "#e4e9f0")}
            >
              {copyText}
            </button>
          </div>
        </div>

        {/* Settings form */}
        <div style={{
          background: "#fff",
          border: "1px solid #e4e9f0",
          borderRadius: 14,
          padding: "22px 24px",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5b6675", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 20 }}>
            Display Settings
          </div>

          {loading ? (
            <div style={{ color: "#8a9ab0", fontSize: 13 }}>Loading…</div>
          ) : (
            <>
              {/* Layout preset */}
              <Field label="Layout">
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { value: "list", label: "List", desc: "Items stacked vertically" },
                    { value: "grid", label: "Grid", desc: "Items in columns by section" },
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setSettings((s) => ({ ...s, layout_preset: value }))}
                      style={{
                        flex: 1,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: `2px solid ${settings.layout_preset === value ? "#1F4E3D" : "#e4e9f0"}`,
                        background: settings.layout_preset === value ? "#edf7f2" : "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1720", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "#8a9ab0" }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </Field>

              {/* Toggles */}
              <Field label="Options">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Toggle
                    label="Show item descriptions"
                    checked={settings.show_descriptions}
                    onChange={(v) => setSettings((s) => ({ ...s, show_descriptions: v }))}
                  />
                  <Toggle
                    label="Highlight active deals"
                    checked={settings.highlight_deals}
                    onChange={(v) => setSettings((s) => ({ ...s, highlight_deals: v }))}
                  />
                </div>
              </Field>

              {/* Accent color */}
              <Field label="Accent Color">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {ACCENT_PRESETS.map(({ label, value }) => (
                    <button
                      key={value}
                      title={label}
                      onClick={() => setSettings((s) => ({ ...s, accent_color: value }))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: value,
                        border: (settings.accent_color || "#4ade80") === value
                          ? "3px solid #0f1720"
                          : "2px solid rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#8a9ab0" }}>Custom hex:</span>
                  <input
                    type="text"
                    placeholder="#4ade80"
                    value={settings.accent_color || ""}
                    onChange={(e) => setSettings((s) => ({ ...s, accent_color: e.target.value || null }))}
                    style={{
                      fontSize: 13,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #e4e9f0",
                      fontFamily: "monospace",
                      width: 110,
                      color: "#0f1720",
                      background: "#fff",
                    }}
                  />
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: settings.accent_color || "#4ade80",
                    border: "1px solid rgba(0,0,0,0.1)",
                    flexShrink: 0,
                  }} />
                </div>
              </Field>

              {/* Menu presentation style */}
              <Field label="Menu Design Lab Presets">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {MENU_DESIGN_LAB_THEMES.map(({ style, name, bestFit, description, preset }) => {
                    const isSelected = (settings.menu_style || "v1") === style;
                    return (
                      <div
                        key={style}
                        onClick={() => setSettings((s) => ({
                          ...s,
                          menu_style: style,
                          theme_preset: style,
                          primary_color: s.primary_color || preset?.colorDefaults?.primary || null,
                          secondary_color: s.secondary_color || preset?.colorDefaults?.accent || null,
                          background_style: s.background_style || "dark",
                          section_heading_style: preset?.sectionHeadingStyle || s.section_heading_style || "default",
                          price_placement: preset?.pricePlacement || s.price_placement || "right",
                        }))}
                        style={{
                          border: `2px solid ${isSelected ? "#1F4E3D" : "#e4e9f0"}`,
                          borderRadius: 10,
                          padding: "10px 14px",
                          background: isSelected ? "#edf7f2" : "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                          border: `2px solid ${isSelected ? "#1F4E3D" : "#d1d5db"}`,
                          background: isSelected ? "#1F4E3D" : "transparent",
                        }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>{name}</div>
                          <div style={{ fontSize: 12, color: "#5b6675", marginTop: 2 }}>{bestFit}</div>
                          <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 2 }}>{description}</div>
                        </div>
                        {isSelected && rid ? (
                            <a
                            href={`/restaurants/${rid}/menu?menuStyle=${style}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginLeft: "auto", fontSize: 12, color: "#1F4E3D", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap", textDecoration: "underline" }}
                          >
                            Preview
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Field>

              <Field label="Design Lab Controls">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <Control label="Primary color">
                    <input
                      type="color"
                      value={settings.primary_color || settings.accent_color || "#1F4E3D"}
                      onChange={(e) => setSettings((s) => ({
                        ...s,
                        primary_color: e.target.value,
                        accent_color: e.target.value,
                      }))}
                      style={colorInputStyle}
                    />
                  </Control>
                  <Control label="Accent color">
                    <input
                      type="color"
                      value={settings.secondary_color || settings.accent_color || "#1F4E3D"}
                      onChange={(e) => setSettings((s) => ({ ...s, secondary_color: e.target.value }))}
                      style={colorInputStyle}
                    />
                  </Control>
                  <Control label="Background style">
                    <select
                      value={settings.background_style || "dark"}
                      onChange={(e) => setSettings((s) => ({ ...s, background_style: e.target.value }))}
                      style={selectStyle}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="paper">Paper</option>
                      <option value="chalkboard">Chalkboard</option>
                    </select>
                  </Control>
                  <Control label="Image density">
                    <select
                      value={settings.image_density || "all"}
                      onChange={(e) => setSettings((s) => ({ ...s, image_density: e.target.value }))}
                      style={selectStyle}
                    >
                      <option value="all">All images</option>
                      <option value="section">Section images</option>
                      <option value="thumbnail">Item thumbnails</option>
                      <option value="none">No images</option>
                    </select>
                  </Control>
                  <Control label="Hero image">
                    <Toggle
                      label={settings.hero_image_enabled ? "Enabled" : "Disabled"}
                      checked={settings.hero_image_enabled}
                      onChange={(v) => setSettings((s) => ({ ...s, hero_image_enabled: v }))}
                    />
                  </Control>
                  <Control label="Section headings">
                    <select
                      value={settings.section_heading_style || "default"}
                      onChange={(e) => setSettings((s) => ({ ...s, section_heading_style: e.target.value }))}
                      style={selectStyle}
                    >
                      <option value="default">Default</option>
                      <option value="lines">Lines</option>
                      <option value="decorative">Decorative</option>
                      <option value="block">Block</option>
                    </select>
                  </Control>
                  <Control label="Price placement">
                    <select
                      value={settings.price_placement || "right"}
                      onChange={(e) => setSettings((s) => ({ ...s, price_placement: e.target.value }))}
                      style={selectStyle}
                    >
                      <option value="right">Right aligned</option>
                      <option value="below">Below item</option>
                      <option value="inline">Inline</option>
                    </select>
                  </Control>
                </div>
              </Field>

              {/* Save button */}
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={btnStyle("#1F4E3D", "#fff")}
                >
                  {saving ? "Saving…" : "Save Settings"}
                </button>
                {saved && (
                  <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>
                    Saved
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* How to use card */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e4e9f0",
          borderRadius: 14,
          padding: "18px 22px",
          marginTop: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5b6675", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
            How to use
          </div>
          <ol style={{ margin: 0, padding: "0 0 0 18px", fontSize: 13, color: "#5b6675", lineHeight: 1.9 }}>
            <li>Configure your layout and color above, then save.</li>
            <li>Copy the display URL and open it on your TV browser.</li>
            <li>Put the browser in full-screen mode (F11 or TV settings).</li>
            <li>Your menu updates on-screen automatically — no manual refresh needed.</li>
          </ol>
        </div>
      </div>
    </OperatorLayout>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f1720", marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? "#1F4E3D" : "#e4e9f0",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.15s",
          cursor: "pointer",
        }}
      >
        <div style={{
          position: "absolute",
          top: 3,
          left: checked ? 20 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
      <span style={{ fontSize: 13, color: "#0f1720" }}>{label}</span>
    </label>
  );
}

function Control({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f1720" }}>{label}</div>
      {children}
    </div>
  );
}

function btnStyle(bg, color, borderColor) {
  return {
    background: bg,
    color,
    border: `1px solid ${borderColor || bg}`,
    borderRadius: 9,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.1s",
  };
}

const selectStyle = {
  width: "100%",
  minHeight: 40,
  borderRadius: 10,
  border: "1px solid #e4e9f0",
  background: "#fff",
  color: "#0f1720",
  fontSize: 13,
  padding: "0 12px",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const colorInputStyle = {
  width: "100%",
  height: 40,
  borderRadius: 10,
  border: "1px solid #e4e9f0",
  padding: 0,
  background: "#fff",
  boxSizing: "border-box",
};
