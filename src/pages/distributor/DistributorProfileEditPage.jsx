import React, { useEffect, useState } from "react";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import {
  getDistributorPublicProfile,
  updateDistributorPublicProfile,
} from "../../lib/distributorApi.js";

const EMPTY = {
  description: "",
  website_url: "",
  logo_url: "",
  phone: "",
  email: "",
  address_line1: "",
  city: "",
  state: "",
  postal_code: "",
  service_area_note: "",
};

/**
 * Edit permitted public profile fields after claim acceptance.
 * Cannot change canonical distributor id / slug / onboarding relationships.
 */
export default function DistributorProfileEditPage() {
  const [form, setForm] = useState(EMPTY);
  const [identity, setIdentity] = useState({ display_name: "", slug: "", id: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDistributorPublicProfile()
      .then((data) => {
        if (cancelled) return;
        const d = data.distributor || {};
        setIdentity({
          display_name: d.display_name || "",
          slug: d.slug || "",
          id: d.id || "",
        });
        setForm({
          description: d.description || "",
          website_url: d.website_url || "",
          logo_url: d.logo_url || "",
          phone: d.phone || "",
          email: d.email || "",
          address_line1: d.address_line1 || "",
          city: d.city || "",
          state: d.state || "",
          postal_code: d.postal_code || "",
          service_area_note: d.service_area_note || "",
        });
        setStatus(d.profile_claim_status || "");
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load profile");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await updateDistributorPublicProfile(form);
      const d = data.distributor || {};
      setStatus(d.profile_claim_status || status);
      setError("");
      alert("Public profile saved.");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const canEdit = status === "CLAIMED" || status === "VERIFIED";

  return (
    <DistributorLayout title="Public profile">
      <PageCard>
        <SectionTitle
          title="Profile"
          subtitle="Update information shown on your Menuply distributor page. Company name and Menuply distributor ID are controlled by Menuply."
        />
        {identity.display_name ? (
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${DIST_COLORS.line}`,
              background: "#f8faf8",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: DIST_COLORS.muted }}>
              Company name (locked)
            </div>
            <div style={{ fontWeight: 800, marginTop: 4 }}>{identity.display_name}</div>
            {identity.slug ? (
              <div style={{ fontSize: 12, color: DIST_COLORS.muted, marginTop: 4 }}>
                /distributors/{identity.slug}
              </div>
            ) : null}
          </div>
        ) : null}
        {status ? (
          <p style={{ color: DIST_COLORS.muted, fontWeight: 700, marginTop: 0 }}>
            Status: {status}
            {status === "VERIFIED" ? " · ✓ Verified Distributor" : ""}
          </p>
        ) : null}
        {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
        {!loaded ? (
          <p>Loading…</p>
        ) : !canEdit ? (
          <p style={{ color: DIST_COLORS.muted }}>
            Profile editing is available after Menuply accepts your claim
            (CLAIMED or VERIFIED). Current status: {status || "unknown"}.
          </p>
        ) : (
          <form onSubmit={handleSave} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            {[
              ["description", "Description", "textarea"],
              ["website_url", "Website URL", "text"],
              ["logo_url", "Logo URL", "text"],
              ["phone", "Public phone", "text"],
              ["email", "Public email", "text"],
              ["address_line1", "Address", "text"],
              ["city", "City", "text"],
              ["state", "State", "text"],
              ["postal_code", "Postal code", "text"],
              ["service_area_note", "Service area", "textarea"],
            ].map(([key, label, kind]) => (
              <label key={key} style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 13 }}>
                {label}
                {kind === "textarea" ? (
                  <textarea
                    rows={3}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    style={inputStyle}
                  />
                ) : (
                  <input
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    style={inputStyle}
                  />
                )}
              </label>
            ))}
            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 8,
                padding: "12px 16px",
                borderRadius: 999,
                border: "none",
                background: DIST_COLORS.accent || "#15803d",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              {saving ? "Saving…" : "Save public profile"}
            </button>
          </form>
        )}
      </PageCard>
    </DistributorLayout>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${DIST_COLORS.line}`,
  fontWeight: 500,
  fontFamily: "inherit",
  fontSize: 14,
};
