/**
 * OperatorBrandSettings.jsx
 * Path: menubloc-frontend/src/pages/operator/OperatorBrandSettings.jsx
 * Date: 2026-03-24
 *
 * Pro-only brand profile editor.
 * Controls: colors, typography, footer options, QR style, social handles, tagline, logo.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e4e9f0",
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const label = { fontSize: 12, fontWeight: 600, color: "#4a5568", marginBottom: 4, display: "block" };

const card = {
  background: "#fff",
  border: "1px solid #e4e9f0",
  borderRadius: 12,
  padding: "20px 24px",
  marginBottom: 20,
};

const btn = (variant = "primary") => ({
  padding: "9px 20px",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  border: variant === "primary" ? "none" : "1px solid #e4e9f0",
  background: variant === "primary" ? "#1F4E3D" : "#fff",
  color: variant === "primary" ? "#fff" : "#4a5568",
  cursor: "pointer",
});

const FONT_PRESETS = ["default", "modern", "classic", "bold", "serif", "script"];
const QR_STYLES    = ["standard", "rounded", "dots"];

// ── Color picker row ───────────────────────────────────────────────────────

function ColorField({ label: fieldLabel, name, value, onChange }) {
  return (
    <div>
      <span style={label}>{fieldLabel}</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={e => onChange(name, e.target.value)}
          style={{ width: 40, height: 36, border: "1px solid #e4e9f0", borderRadius: 6, cursor: "pointer", padding: 2 }}
        />
        <input
          value={value || ""}
          onChange={e => onChange(name, e.target.value)}
          placeholder="#1F4E3D"
          style={{ ...inputStyle, flex: 1 }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(name, null)}
            style={{ background: "none", border: "none", color: "#8a9ab0", cursor: "pointer", fontSize: 16 }}
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ── Toggle row ─────────────────────────────────────────────────────────────

function ToggleField({ label: fieldLabel, name, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0ec" }}>
      <span style={{ fontSize: 13, color: "#0f1720" }}>{fieldLabel}</span>
      <button
        type="button"
        onClick={() => onChange(name, !value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none",
          background: value ? "#1F4E3D" : "#d1d5db",
          cursor: "pointer", position: "relative", transition: "background 0.2s",
        }}
      >
        <div style={{
          position: "absolute",
          top: 3, left: value ? 23 : 3,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function OperatorBrandSettings() {
  const { t } = useLanguage();
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);
  const [logoUrl, setLogoUrl]   = useState("");

  const load = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    try {
      const r = await api.getBrandProfile(rid);
      setProfile(r.profile);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => { load(); }, [load]);

  function set(name, value) {
    setProfile(p => ({ ...p, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const r = await api.updateBrandProfile(rid, {
        primary_color:       profile.primary_color,
        secondary_color:     profile.secondary_color,
        accent_color:        profile.accent_color,
        background_color:    profile.background_color,
        text_color:          profile.text_color,
        font_family:         profile.font_family,
        font_preset:         profile.font_preset,
        footer_text:         profile.footer_text,
        footer_show_phone:   profile.footer_show_phone,
        footer_show_address: profile.footer_show_address,
        footer_show_website: profile.footer_show_website,
        footer_show_hours:   profile.footer_show_hours,
        footer_show_social:  profile.footer_show_social,
        qr_style:            profile.qr_style,
        instagram_handle:    profile.instagram_handle,
        facebook_url:        profile.facebook_url,
        website_url:         profile.website_url,
        tagline:             profile.tagline,
      });
      setProfile(r.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e) {
    e.preventDefault();
    if (!logoUrl) return;
    try {
      const r = await api.uploadBrandLogo(rid, { logo_url: logoUrl });
      setProfile(r.profile);
      setLogoUrl("");
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleLogoRemove() {
    if (!confirm("Remove logo?")) return;
    try {
      const r = await api.removeBrandLogo(rid);
      setProfile(r.profile);
    } catch (e) {
      alert(e.message);
    }
  }

  if (!rid) return <OperatorLayout title="Brand Settings"><p style={{ color: "#8a9ab0" }}>Select a restaurant first.</p></OperatorLayout>;
  if (loading) return <OperatorLayout title="Brand Settings"><p style={{ color: "#8a9ab0" }}>Loading…</p></OperatorLayout>;
  if (!profile) return <OperatorLayout title="Brand Settings"><p style={{ color: "#c0392b" }}>{error}</p></OperatorLayout>;

  return (
    <OperatorLayout title="Brand Settings">
      <form onSubmit={handleSave}>

        {/* Logo */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 16 }}>Logo</div>
          {profile.logo_url && (
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
              <img src={profile.logo_url} alt="Logo" style={{ height: 60, borderRadius: 8, border: "1px solid #e4e9f0", objectFit: "contain", background: "#f9fafb", padding: 4 }} />
              <button type="button" onClick={handleLogoRemove} style={{ ...btn("secondary"), color: "#ef4444" }}>
                Remove Logo
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <span style={label}>Logo URL</span>
              <input
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>
            <button type="button" onClick={handleLogoUpload} disabled={!logoUrl} style={btn("secondary")}>
              Set Logo
            </button>
          </div>
        </div>

        {/* Colors */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 16 }}>Brand Colors</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ColorField label="Primary Color"    name="primary_color"    value={profile.primary_color}    onChange={set} />
            <ColorField label="Secondary Color"  name="secondary_color"  value={profile.secondary_color}  onChange={set} />
            <ColorField label="Accent Color"     name="accent_color"     value={profile.accent_color}     onChange={set} />
            <ColorField label="Background Color" name="background_color" value={profile.background_color} onChange={set} />
            <ColorField label="Text Color"       name="text_color"       value={profile.text_color}       onChange={set} />
          </div>
        </div>

        {/* Typography */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 16 }}>Typography</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <span style={label}>Font Family</span>
              <input value={profile.font_family || ""} onChange={e => set("font_family", e.target.value)} placeholder="Inter" style={inputStyle} />
            </div>
            <div>
              <span style={label}>Font Preset</span>
              <select value={profile.font_preset || "default"} onChange={e => set("font_preset", e.target.value)} style={inputStyle}>
                {FONT_PRESETS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer & QR */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 8 }}>Footer &amp; QR</div>
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Footer Text</span>
            <input value={profile.footer_text || ""} onChange={e => set("footer_text", e.target.value)} placeholder="Visit us at…" style={inputStyle} />
          </div>
          <ToggleField label="Show Phone"   name="footer_show_phone"   value={profile.footer_show_phone}   onChange={set} />
          <ToggleField label="Show Address" name="footer_show_address" value={profile.footer_show_address} onChange={set} />
          <ToggleField label="Show Website" name="footer_show_website" value={profile.footer_show_website} onChange={set} />
          <ToggleField label="Show Hours"   name="footer_show_hours"   value={profile.footer_show_hours}   onChange={set} />
          <ToggleField label="Show Social"  name="footer_show_social"  value={profile.footer_show_social}  onChange={set} />
          <div style={{ marginTop: 16 }}>
            <span style={label}>QR Code Style</span>
            <div style={{ display: "flex", gap: 10 }}>
              {QR_STYLES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("qr_style", s)}
                  style={{
                    padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: "1px solid #e4e9f0",
                    background: profile.qr_style === s ? "#1F4E3D" : "#fff",
                    color: profile.qr_style === s ? "#fff" : "#4a5568",
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Social & Tagline */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 16 }}>Social &amp; Tagline</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <span style={label}>Instagram Handle</span>
              <input value={profile.instagram_handle || ""} onChange={e => set("instagram_handle", e.target.value)} placeholder="@yourhandle" style={inputStyle} />
            </div>
            <div>
              <span style={label}>Facebook URL</span>
              <input value={profile.facebook_url || ""} onChange={e => set("facebook_url", e.target.value)} placeholder="https://facebook.com/…" style={inputStyle} />
            </div>
            <div>
              <span style={label}>Website URL</span>
              <input value={profile.website_url || ""} onChange={e => set("website_url", e.target.value)} placeholder="https://yourrestaurant.com" style={inputStyle} />
            </div>
            <div>
              <span style={label}>Tagline</span>
              <input value={profile.tagline || ""} onChange={e => set("tagline", e.target.value)} placeholder="The best tacos in town" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Actions */}
        {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="submit" disabled={saving} style={btn("primary")}>
            {saving ? "Saving…" : "Save Brand Settings"}
          </button>
          {saved && <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Saved!</span>}
          {profile.is_complete && (
            <span style={{ fontSize: 12, color: "#6b7280" }}>✓ Profile complete</span>
          )}
        </div>
      </form>
    </OperatorLayout>
  );
}
