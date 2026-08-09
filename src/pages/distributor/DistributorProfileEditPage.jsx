import React, { useEffect, useState } from "react";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import {
  getDistributorPublicProfile,
  updateDistributorPublicProfile,
  listDistributorProfileUpdates,
  createDistributorProfileUpdate,
  deleteDistributorProfileUpdate,
  listDistributorMenuplyContacts,
  createDistributorMenuplyContact,
  updateDistributorMenuplyContact,
  deleteDistributorMenuplyContact,
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
  founded_year: "",
  product_categories: "",
  geographic_markets: "",
};

const EMPTY_CONTACT = {
  first_name: "",
  last_name: "",
  job_title: "",
  email: "",
  phone: "",
  department_function: "",
  region: "",
  contact_function: "other",
  is_primary_menuply_contact: false,
};

/**
 * Edit permitted public profile fields after claim acceptance.
 * Menuply contacts are private (portal only) — never shown on public profiles.
 */
export default function DistributorProfileEditPage() {
  const [form, setForm] = useState(EMPTY);
  const [identity, setIdentity] = useState({ display_name: "", slug: "", id: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactDraft, setContactDraft] = useState(EMPTY_CONTACT);
  const [contactError, setContactError] = useState("");
  const [contactBusy, setContactBusy] = useState(false);

  async function reloadUpdates() {
    const data = await listDistributorProfileUpdates();
    setUpdates(Array.isArray(data.updates) ? data.updates : []);
  }

  async function reloadContacts() {
    const data = await listDistributorMenuplyContacts();
    setContacts(Array.isArray(data.contacts) ? data.contacts : []);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDistributorPublicProfile(),
      listDistributorProfileUpdates().catch(() => ({ updates: [] })),
      listDistributorMenuplyContacts().catch(() => ({ contacts: [] })),
    ])
      .then(([data, updatesData, contactsData]) => {
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
          founded_year: d.founded_year != null ? String(d.founded_year) : "",
          product_categories: Array.isArray(d.product_categories)
            ? d.product_categories.join(", ")
            : "",
          geographic_markets: Array.isArray(d.geographic_markets)
            ? d.geographic_markets.join(", ")
            : "",
        });
        setStatus(d.profile_claim_status || "");
        setUpdates(Array.isArray(updatesData.updates) ? updatesData.updates : []);
        setContacts(Array.isArray(contactsData.contacts) ? contactsData.contacts : []);
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
      const payload = {
        ...form,
        founded_year: form.founded_year === "" ? null : form.founded_year,
        product_categories: form.product_categories,
        geographic_markets: form.geographic_markets,
      };
      const data = await updateDistributorPublicProfile(payload);
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

  async function handleCreatePost(e) {
    e.preventDefault();
    setPosting(true);
    setPostError("");
    try {
      await createDistributorProfileUpdate({
        title: postTitle,
        body: postBody,
      });
      setPostTitle("");
      setPostBody("");
      await reloadUpdates();
    } catch (err) {
      setPostError(err.message || "Could not publish update");
    } finally {
      setPosting(false);
    }
  }

  async function handleDeletePost(updateId) {
    if (!window.confirm("Remove this update from your public profile?")) return;
    try {
      await deleteDistributorProfileUpdate(updateId);
      await reloadUpdates();
    } catch (err) {
      setPostError(err.message || "Could not delete update");
    }
  }

  async function handleAddContact(e) {
    e.preventDefault();
    setContactBusy(true);
    setContactError("");
    try {
      await createDistributorMenuplyContact(contactDraft);
      setContactDraft(EMPTY_CONTACT);
      await reloadContacts();
    } catch (err) {
      setContactError(err.message || "Could not add contact");
    } finally {
      setContactBusy(false);
    }
  }

  async function makePrimary(contactId) {
    setContactBusy(true);
    setContactError("");
    try {
      const current = contacts.find((c) => c.id === contactId);
      if (!current) return;
      await updateDistributorMenuplyContact(contactId, {
        ...current,
        is_primary_menuply_contact: true,
        contact_function: "primary_menuply",
      });
      await reloadContacts();
    } catch (err) {
      setContactError(err.message || "Could not update primary contact");
    } finally {
      setContactBusy(false);
    }
  }

  async function removeContact(contactId) {
    if (!window.confirm("Remove this Menuply contact?")) return;
    setContactBusy(true);
    setContactError("");
    try {
      await deleteDistributorMenuplyContact(contactId);
      await reloadContacts();
    } catch (err) {
      setContactError(err.message || "Could not remove contact");
    } finally {
      setContactBusy(false);
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
              ["description", "About Us", "textarea"],
              ["founded_year", "Founded (year)", "text"],
              ["website_url", "Website URL", "text"],
              ["logo_url", "Logo URL", "text"],
              ["phone", "Main company phone", "text"],
              ["email", "Public email", "text"],
              ["address_line1", "Headquarters address", "text"],
              ["city", "City", "text"],
              ["state", "State", "text"],
              ["postal_code", "Postal code", "text"],
              ["product_categories", "Distributor / product categories (comma-separated)", "text"],
              ["geographic_markets", "Geographic markets served (comma-separated)", "text"],
              ["service_area_note", "Service area note", "textarea"],
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
                    inputMode={key === "founded_year" ? "numeric" : undefined}
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

      {canEdit ? (
        <PageCard>
          <SectionTitle
            title="Your Menuply Contact"
            subtitle="Who should be the primary contact person for Menuply? These contacts are private to Menuply — they are not shown on your public profile or to restaurants."
          />
          {contactError ? (
            <div style={{ color: "#b91c1c", marginBottom: 12 }}>{contactError}</div>
          ) : null}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {contacts.length === 0 ? (
              <li style={{ color: DIST_COLORS.muted, fontSize: 14 }}>No Menuply contacts yet.</li>
            ) : (
              contacts.map((c) => (
                <li
                  key={c.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${DIST_COLORS.line}`,
                    background: c.is_primary_menuply_contact ? "#ecfdf5" : "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>
                    {c.first_name} {c.last_name}
                    {c.is_primary_menuply_contact ? " · Primary Menuply Contact" : ""}
                  </div>
                  <div style={{ fontSize: 13, color: DIST_COLORS.muted, marginTop: 4 }}>
                    {[c.job_title, c.email, c.phone, c.region].filter(Boolean).join(" · ")}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    {!c.is_primary_menuply_contact ? (
                      <button
                        type="button"
                        disabled={contactBusy}
                        onClick={() => makePrimary(c.id)}
                        style={linkBtn}
                      >
                        Make primary
                      </button>
                    ) : null}
                    {!c.is_primary_menuply_contact ? (
                      <button
                        type="button"
                        disabled={contactBusy}
                        onClick={() => removeContact(c.id)}
                        style={{ ...linkBtn, color: "#b91c1c" }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
          <form onSubmit={handleAddContact} style={{ display: "grid", gap: 10, maxWidth: 520, marginTop: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>+ Add Another Menuply Contact</div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <label style={fieldLabel}>
                First name *
                <input
                  required
                  style={inputStyle}
                  value={contactDraft.first_name}
                  onChange={(e) => setContactDraft((p) => ({ ...p, first_name: e.target.value }))}
                />
              </label>
              <label style={fieldLabel}>
                Last name *
                <input
                  required
                  style={inputStyle}
                  value={contactDraft.last_name}
                  onChange={(e) => setContactDraft((p) => ({ ...p, last_name: e.target.value }))}
                />
              </label>
            </div>
            <label style={fieldLabel}>
              Email *
              <input
                type="email"
                required
                style={inputStyle}
                value={contactDraft.email}
                onChange={(e) => setContactDraft((p) => ({ ...p, email: e.target.value }))}
              />
            </label>
            <label style={fieldLabel}>
              Job title
              <input
                style={inputStyle}
                value={contactDraft.job_title}
                onChange={(e) => setContactDraft((p) => ({ ...p, job_title: e.target.value }))}
              />
            </label>
            <label style={fieldLabel}>
              Direct phone
              <input
                style={inputStyle}
                value={contactDraft.phone}
                onChange={(e) => setContactDraft((p) => ({ ...p, phone: e.target.value }))}
              />
            </label>
            <label style={fieldLabel}>
              Department / function
              <input
                style={inputStyle}
                value={contactDraft.department_function}
                onChange={(e) =>
                  setContactDraft((p) => ({ ...p, department_function: e.target.value }))
                }
              />
            </label>
            <label style={fieldLabel}>
              Region
              <input
                style={inputStyle}
                value={contactDraft.region}
                onChange={(e) => setContactDraft((p) => ({ ...p, region: e.target.value }))}
              />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 700, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={contactDraft.is_primary_menuply_contact}
                onChange={(e) =>
                  setContactDraft((p) => ({
                    ...p,
                    is_primary_menuply_contact: e.target.checked,
                    contact_function: e.target.checked ? "primary_menuply" : p.contact_function,
                  }))
                }
              />
              Designate as Primary Menuply Contact
            </label>
            <button
              type="submit"
              disabled={contactBusy}
              style={{
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
              {contactBusy ? "Saving…" : "Add Menuply contact"}
            </button>
          </form>
        </PageCard>
      ) : null}

      {canEdit ? (
        <PageCard>
          <SectionTitle
            title="Updates"
            subtitle="Posts appear on your public distributor profile. Keep them short and useful for restaurants."
          />
          {postError ? (
            <div style={{ color: "#b91c1c", marginBottom: 12 }}>{postError}</div>
          ) : null}
          <form onSubmit={handleCreatePost} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 13 }}>
              Title
              <input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                style={inputStyle}
                required
                maxLength={160}
              />
            </label>
            <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 13 }}>
              Body (optional)
              <textarea
                rows={3}
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                style={inputStyle}
                maxLength={2000}
              />
            </label>
            <button
              type="submit"
              disabled={posting || !postTitle.trim()}
              style={{
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
              {posting ? "Publishing…" : "Publish update"}
            </button>
          </form>

          <ul
            style={{
              listStyle: "none",
              margin: "20px 0 0",
              padding: 0,
              display: "grid",
              gap: 10,
              maxWidth: 560,
            }}
          >
            {updates.length === 0 ? (
              <li style={{ color: DIST_COLORS.muted, fontSize: 14 }}>No updates yet.</li>
            ) : (
              updates.map((u) => (
                <li
                  key={u.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${DIST_COLORS.line}`,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{u.title}</div>
                  {u.body ? (
                    <div style={{ marginTop: 4, fontSize: 13, color: DIST_COLORS.muted }}>
                      {u.body}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDeletePost(u.id)}
                    style={{
                      marginTop: 10,
                      border: "none",
                      background: "transparent",
                      color: "#b91c1c",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
        </PageCard>
      ) : null}
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

const fieldLabel = { display: "grid", gap: 4, fontWeight: 700, fontSize: 13 };

const linkBtn = {
  border: "none",
  background: "transparent",
  color: "#0f766e",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
};
