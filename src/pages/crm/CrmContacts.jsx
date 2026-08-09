import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  createCrmRestaurantContact,
  getCrmContacts,
  updateCrmContact,
} from "../../lib/crmApi.js";
import {
  Badge,
  CRM_COLORS,
  CrmCard,
  CrmPage,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
} from "./CrmShared.jsx";

const FUNCTIONS = ["owner", "manager", "sales", "marketing", "operations", "management", "region", "other"];

const EMPTY = {
  restaurant_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  job_title: "",
  contact_function: "other",
  region: "",
  notes: "",
  is_primary: false,
};

export default function CrmContacts() {
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    load();
  }, []);

  async function load(nextQ = q) {
    try {
      setError("");
      const json = await getCrmContacts({ q: nextQ || undefined, limit: 200 });
      setContacts(json.contacts || []);
    } catch (err) {
      setError(err.message || "Unable to load contacts");
    }
  }

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function startEdit(contact) {
    setEditingId(contact.id);
    setForm({
      restaurant_id: contact.restaurant_id || "",
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      job_title: contact.job_title || contact.role || "",
      contact_function: contact.contact_function || "other",
      region: contact.region || "",
      notes: contact.notes || "",
      is_primary: Boolean(contact.is_primary),
    });
    setShowForm(true);
  }

  async function save() {
    try {
      setError("");
      if (editingId) {
        await updateCrmContact(editingId, form);
        setSuccess("Contact updated.");
      } else {
        if (!form.restaurant_id) {
          setError("Restaurant ID is required to create a contact.");
          return;
        }
        await createCrmRestaurantContact(form.restaurant_id, form);
        setSuccess("Contact created.");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || "Unable to save contact");
    }
  }

  const highlight = searchParams.get("highlight");
  const inputStyle = {
    width: "100%",
    border: `1px solid ${CRM_COLORS.line}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  };

  return (
    <CrmPage
      title="Contacts"
      actions={
        <button type="button" onClick={startCreate} style={{ border: "none", background: CRM_COLORS.accent, color: "#fff", borderRadius: 12, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
          Add contact
        </button>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <CrmCard title="Restaurant contacts" subtitle="A business may have multiple contacts. Primary is typically the owner or manager.">
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, restaurant…"
            style={inputStyle}
          />
          <button type="button" onClick={() => load(q)} style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
            Search
          </button>
        </div>

        {showForm ? (
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 14, border: `1px solid ${CRM_COLORS.line}`, background: CRM_COLORS.soft, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>{editingId ? "Edit contact" : "New contact"}</div>
            {!editingId ? (
              <input placeholder="Restaurant ID" value={form.restaurant_id} onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })} style={inputStyle} />
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} style={inputStyle} />
              <input placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} style={inputStyle} />
            </div>
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
            <input placeholder="Job title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} style={inputStyle} />
            <select value={form.contact_function} onChange={(e) => setForm({ ...form, contact_function: e.target.value })} style={inputStyle}>
              {FUNCTIONS.map((fn) => <option key={fn} value={fn}>{fn}</option>)}
            </select>
            <input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} style={inputStyle} />
            <textarea placeholder="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, fontFamily: "inherit" }} />
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
              <input type="checkbox" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} />
              Primary contact
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={save} style={{ border: "none", background: CRM_COLORS.accent, color: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>Save</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : null}

        {!contacts.length ? (
          <EmptyState>No contacts. Add contacts from a restaurant CRM profile or here.</EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {contacts.map((c) => {
              const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
              const isHighlight = highlight && String(highlight) === String(c.id);
              return (
                <div
                  key={c.id}
                  id={`contact-${c.id}`}
                  style={{
                    border: `1px solid ${isHighlight ? CRM_COLORS.accent : CRM_COLORS.line}`,
                    borderRadius: 14,
                    padding: 14,
                    background: isHighlight ? CRM_COLORS.accentSoft : "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{name}</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: CRM_COLORS.muted }}>
                        {c.email}{c.phone ? ` · ${c.phone}` : ""}
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {c.is_primary ? <Badge type="status" value="primary" /> : null}
                        {c.contact_function ? <Badge type="account" value={c.contact_function} /> : null}
                        {c.display_job_title || c.job_title ? <Badge type="account" value={c.display_job_title || c.job_title} /> : null}
                        {c.region ? <Badge type="account" value={c.region} /> : null}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        Restaurant:{" "}
                        {c.lead_id ? (
                          <Link to={`/crm/leads/${c.lead_id}`} style={{ color: CRM_COLORS.accent, fontWeight: 700 }}>
                            {c.restaurant_name || `Restaurant #${c.restaurant_id}`}
                          </Link>
                        ) : (
                          c.restaurant_name || `Restaurant #${c.restaurant_id}`
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => startEdit(c)} style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700, cursor: "pointer", height: "fit-content" }}>
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CrmCard>
    </CrmPage>
  );
}
