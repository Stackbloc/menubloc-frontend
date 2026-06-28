import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  deleteCrmBdContact,
  getCrmBdContact,
  linkCrmBdContactLead,
  unlinkCrmBdContactLead,
  updateCrmBdContact,
} from "../../lib/crmApi.js";
import {
  BD_RELATIONSHIP_STATUSES,
  BD_ROLE_CATEGORIES,
  formatBdRoleCategory,
} from "../../lib/crmBdRoleCategories.js";
import {
  Badge,
  CrmCard,
  CrmPage,
  DataTable,
  ErrorBanner,
  SuccessBanner,
  formatDateTime,
} from "./CrmShared.jsx";

export default function CrmBusinessDevelopmentDetail() {
  const { id } = useParams();
  const [data, setData] = useState({ contact: null, linked_leads: [] });
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [leadIdInput, setLeadIdInput] = useState("");
  const [linkNotes, setLinkNotes] = useState("");

  useEffect(() => {
    loadContact();
  }, [id]);

  async function loadContact() {
    try {
      setError("");
      const json = await getCrmBdContact(id);
      const contact = json.contact || json.prospect;
      setData({ ...json, contact });
      setForm(mapContactToForm(contact));
    } catch (err) {
      setError(err.message || "Unable to load business development contact");
    }
  }

  function mapContactToForm(contact) {
    if (!contact) return null;
    return {
      name: contact.name || "",
      company: contact.company || "",
      role_category: contact.role_category || "other",
      market_city: contact.market_city || "",
      market_state: contact.market_state || "",
      email: contact.email || "",
      phone: contact.phone || "",
      website_or_social_url: contact.website_or_social_url || "",
      relationship_status: contact.relationship_status || "new",
      referral_source: contact.referral_source || "",
      notes: contact.notes || "",
      last_contacted_at: toInputDateTime(contact.last_contacted_at),
      next_follow_up_at: toInputDateTime(contact.next_follow_up_at),
      expected_referral_value: contact.expected_referral_value ?? "",
      tags: Array.isArray(contact.tags) ? contact.tags.join(", ") : "",
    };
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await updateCrmBdContact(id, {
        ...form,
        expected_referral_value: form.expected_referral_value === "" ? null : Number(form.expected_referral_value),
        last_contacted_at: form.last_contacted_at || null,
        next_follow_up_at: form.next_follow_up_at || null,
        tags: form.tags
          ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
      });
      setSuccess("Contact updated.");
      loadContact();
    } catch (err) {
      setError(err.message || "Unable to update contact");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this contact?")) return;
    setError("");
    try {
      await deleteCrmBdContact(id);
      window.location.href = "/crm/business-development";
    } catch (err) {
      setError(err.message || "Unable to delete contact");
    }
  }

  async function handleLinkLead(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await linkCrmBdContactLead(id, {
        lead_id: Number(leadIdInput),
        link_notes: linkNotes || null,
      });
      setLeadIdInput("");
      setLinkNotes("");
      setSuccess("Restaurant lead linked.");
      loadContact();
    } catch (err) {
      setError(err.message || "Unable to link restaurant lead");
    }
  }

  async function handleUnlinkLead(leadId) {
    setError("");
    setSuccess("");
    try {
      await unlinkCrmBdContactLead(id, leadId);
      setSuccess("Restaurant lead unlinked.");
      loadContact();
    } catch (err) {
      setError(err.message || "Unable to unlink restaurant lead");
    }
  }

  if (!form) {
    return (
      <CrmPage title="Business Development Contact">
        <ErrorBanner message={error} />
      </CrmPage>
    );
  }

  const contact = data.contact;

  return (
    <CrmPage
      title={contact?.name || "Business Development Contact"}
      actions={(
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/crm/business-development" style={secondaryButtonStyle}>Back to list</Link>
          <button type="button" onClick={handleDelete} style={dangerButtonStyle}>Delete</button>
        </div>
      )}
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 18 }}>
        <CrmCard title="Contact Details">
          <form onSubmit={handleSave} style={{ display: "grid", gap: 10 }}>
            <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <Field label="Company / organization" value={form.company} onChange={(value) => setForm({ ...form, company: value })} />
            <label style={labelStyle}>
              Contact type
              <select value={form.role_category} onChange={(e) => setForm({ ...form, role_category: e.target.value })} style={inputStyle}>
                {BD_ROLE_CATEGORIES.map((value) => <option key={value} value={value}>{formatBdRoleCategory(value)}</option>)}
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
              <Field label="Market city" value={form.market_city} onChange={(value) => setForm({ ...form, market_city: value })} required />
              <Field label="State" value={form.market_state} onChange={(value) => setForm({ ...form, market_state: value })} required />
            </div>
            <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label="Website / social URL" value={form.website_or_social_url} onChange={(value) => setForm({ ...form, website_or_social_url: value })} />
            <label style={labelStyle}>
              Relationship status
              <select value={form.relationship_status} onChange={(e) => setForm({ ...form, relationship_status: e.target.value })} style={inputStyle}>
                {BD_RELATIONSHIP_STATUSES.map((value) => <option key={value} value={value}>{formatBdRoleCategory(value)}</option>)}
              </select>
            </label>
            <Field label="Source" value={form.referral_source} onChange={(value) => setForm({ ...form, referral_source: value })} />
            <Field label="Expected value" value={form.expected_referral_value} onChange={(value) => setForm({ ...form, expected_referral_value: value })} />
            <Field label="Tags (comma-separated)" value={form.tags} onChange={(value) => setForm({ ...form, tags: value })} />
            <button type="submit" style={primaryButtonStyle}>Save changes</button>
          </form>
        </CrmCard>

        <div style={{ display: "grid", gap: 18 }}>
          <CrmCard title="Follow-up">
            <form onSubmit={handleSave} style={{ display: "grid", gap: 10 }}>
              <label style={labelStyle}>
                Last contacted
                <input type="datetime-local" value={form.last_contacted_at} onChange={(e) => setForm({ ...form, last_contacted_at: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Next follow-up
                <input type="datetime-local" value={form.next_follow_up_at} onChange={(e) => setForm({ ...form, next_follow_up_at: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Notes
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={8} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
              <button type="submit" style={primaryButtonStyle}>Save follow-up</button>
            </form>
          </CrmCard>

          <CrmCard title="Attribution Impact">
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720" }}>{contact?.referred_restaurant_count ?? 0}</div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>Linked restaurant CRM leads</div>
            <div style={{ marginTop: 12 }}>
              <Badge type="status" value={contact?.relationship_status} />
            </div>
          </CrmCard>
        </div>
      </div>

      <CrmCard title="Linked Restaurant Leads" subtitle="CRM leads attributed to this contact">
        <form onSubmit={handleLinkLead} style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: 10, marginBottom: 16 }}>
          <input value={leadIdInput} onChange={(e) => setLeadIdInput(e.target.value)} placeholder="CRM lead ID" style={inputStyle} required />
          <input value={linkNotes} onChange={(e) => setLinkNotes(e.target.value)} placeholder="Link notes (optional)" style={inputStyle} />
          <button type="submit" style={primaryButtonStyle}>Link lead</button>
        </form>

        <DataTable
          rows={data.linked_leads || []}
          columns={[
            {
              key: "lead_name",
              label: "Lead",
              render: (row) => (
                <Link to={`/crm/leads/${row.lead_id}`} style={{ color: "#194b3a", fontWeight: 700, textDecoration: "none" }}>
                  {row.lead_name}
                </Link>
              ),
            },
            { key: "lead_status", label: "Status", render: (row) => <Badge type="status" value={row.lead_status} /> },
            { key: "pipeline_stage", label: "Stage", render: (row) => <Badge type="stage" value={row.pipeline_stage} /> },
            {
              key: "market",
              label: "Market",
              render: (row) => `${row.lead_city || "—"}, ${row.lead_state || "—"}`,
            },
            { key: "linked_at", label: "Linked", render: (row) => formatDateTime(row.linked_at) },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <button type="button" onClick={() => handleUnlinkLead(row.lead_id)} style={dangerButtonStyle}>
                  Unlink
                </button>
              ),
            },
          ]}
          emptyLabel="No restaurant leads linked yet."
        />
      </CrmCard>
    </CrmPage>
  );
}

function Field({ label, value, onChange, required = false }) {
  return (
    <label style={labelStyle}>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} required={required} />
    </label>
  );
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const labelStyle = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  color: "#0f1720",
};

const inputStyle = {
  width: "100%",
  border: "1px solid #d9e0ea",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  color: "#0f1720",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  background: "#194b3a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#0f1720",
  border: "1px solid #d9e0ea",
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

const dangerButtonStyle = {
  background: "#fff",
  color: "#a12828",
  border: "1px solid #f1c7c7",
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
};
