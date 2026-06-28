import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createCrmBdContact,
  deleteCrmBdContact,
  getCrmBdContacts,
  importCrmBdContacts,
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

const DEFAULT_FILTERS = {
  search: "",
  role_category: "",
  relationship_status: "",
  market_city: "",
  market_state: "",
  overdue_only: "",
  has_next_follow_up: "",
  sort: "updated_at_desc",
  page: 1,
  page_size: 25,
};

const EMPTY_CONTACT = {
  name: "",
  company: "",
  role_category: "referral_partner",
  market_city: "",
  market_state: "",
  email: "",
  phone: "",
  website_or_social_url: "",
  relationship_status: "new",
  referral_source: "",
  notes: "",
  next_follow_up_at: "",
  expected_referral_value: "",
  tags: "",
};

export default function CrmBusinessDevelopment() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState({ contacts: [], pagination: { page: 1, total: 0, page_size: 25 } });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newContact, setNewContact] = useState(EMPTY_CONTACT);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    loadContacts(filters);
  }, [filters]);

  async function loadContacts(nextFilters) {
    try {
      setError("");
      const json = await getCrmBdContacts(nextFilters);
      setData({
        ...json,
        contacts: json.contacts || json.prospects || [],
      });
    } catch (err) {
      setError(err.message || "Unable to load business development contacts");
    }
  }

  function buildContactPayload(form) {
    return {
      ...form,
      expected_referral_value: form.expected_referral_value === "" ? null : Number(form.expected_referral_value),
      next_follow_up_at: form.next_follow_up_at || null,
      tags: form.tags
        ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    };
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createCrmBdContact(buildContactPayload(newContact));
      setNewContact(EMPTY_CONTACT);
      setSuccess("Contact created.");
      loadContacts(filters);
    } catch (err) {
      setError(err.message || "Unable to create contact");
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete contact "${row.name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteCrmBdContact(row.id);
      setSuccess("Contact deleted.");
      loadContacts(filters);
    } catch (err) {
      setError(err.message || "Unable to delete contact");
    }
  }

  async function handleImport(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const parsed = JSON.parse(importText);
      const contacts = Array.isArray(parsed) ? parsed : (parsed.contacts || parsed.prospects);
      if (!Array.isArray(contacts) || !contacts.length) {
        throw new Error("Import JSON must be an array or { contacts: [...] }");
      }
      const result = await importCrmBdContacts(contacts);
      setImportText("");
      setSuccess(`Imported ${result.created_count || contacts.length} contact(s).`);
      loadContacts(filters);
    } catch (err) {
      setError(err.message || "Unable to import contacts");
    }
  }

  return (
    <CrmPage title="Business Development">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div style={{ marginBottom: 14, fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
        Business development relationships — referral partners, franchise contacts, vendors, media, chambers, investors, and strategic partners. Separate from restaurant CRM; never appears in public search or profiles.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 18 }}>
        <CrmCard title="Filters">
          <div style={filterGridStyle}>
            <input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Search name, company, email, phone"
              style={inputStyle}
            />
            <select
              value={filters.role_category}
              onChange={(e) => setFilters({ ...filters, role_category: e.target.value, page: 1 })}
              style={inputStyle}
            >
              <option value="">All contact types</option>
              {BD_ROLE_CATEGORIES.map((value) => (
                <option key={value} value={value}>{formatBdRoleCategory(value)}</option>
              ))}
            </select>
            <select
              value={filters.relationship_status}
              onChange={(e) => setFilters({ ...filters, relationship_status: e.target.value, page: 1 })}
              style={inputStyle}
            >
              <option value="">All relationship statuses</option>
              {BD_RELATIONSHIP_STATUSES.map((value) => (
                <option key={value} value={value}>{formatBdRoleCategory(value)}</option>
              ))}
            </select>
            <input
              value={filters.market_city}
              onChange={(e) => setFilters({ ...filters, market_city: e.target.value, page: 1 })}
              placeholder="Market city"
              style={inputStyle}
            />
            <input
              value={filters.market_state}
              onChange={(e) => setFilters({ ...filters, market_state: e.target.value, page: 1 })}
              placeholder="Market state"
              style={inputStyle}
            />
            <select
              value={filters.overdue_only}
              onChange={(e) => setFilters({ ...filters, overdue_only: e.target.value, page: 1 })}
              style={inputStyle}
            >
              <option value="">Any follow-up status</option>
              <option value="true">Overdue follow-ups only</option>
            </select>
            <select
              value={filters.has_next_follow_up}
              onChange={(e) => setFilters({ ...filters, has_next_follow_up: e.target.value, page: 1 })}
              style={inputStyle}
            >
              <option value="">Any follow-up date</option>
              <option value="true">Has follow-up scheduled</option>
            </select>
          </div>
        </CrmCard>

        <CrmCard title="Quick Create" subtitle="Add a BD contact">
          <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
            <input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Name *" style={inputStyle} required />
            <input value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} placeholder="Company / organization" style={inputStyle} />
            <select value={newContact.role_category} onChange={(e) => setNewContact({ ...newContact, role_category: e.target.value })} style={inputStyle}>
              {BD_ROLE_CATEGORIES.map((value) => <option key={value} value={value}>{formatBdRoleCategory(value)}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8 }}>
              <input value={newContact.market_city} onChange={(e) => setNewContact({ ...newContact, market_city: e.target.value })} placeholder="Market city *" style={inputStyle} required />
              <input value={newContact.market_state} onChange={(e) => setNewContact({ ...newContact, market_state: e.target.value })} placeholder="ST *" style={inputStyle} required />
            </div>
            <input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="Email" style={inputStyle} />
            <input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
            <button type="submit" style={primaryButtonStyle}>Create contact</button>
          </form>
        </CrmCard>
      </div>

      <CrmCard title="Bulk Import" subtitle="Paste JSON array or { contacts: [...] }">
        <form onSubmit={handleImport} style={{ display: "grid", gap: 10 }}>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='[{"name":"Jane Doe","role_category":"referral_partner","market_city":"Los Angeles","market_state":"CA"}]'
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <button type="submit" style={secondaryButtonStyle}>Import contacts</button>
        </form>
      </CrmCard>

      <CrmCard
        title="Contact List"
        subtitle={`${data.pagination.total || 0} total contacts`}
        style={{ marginTop: 18 }}
      >
        <DataTable
          rows={data.contacts || []}
          columns={[
            {
              key: "name",
              label: "Contact",
              render: (row) => (
                <div>
                  <Link to={`/crm/business-development/${row.id}`} style={{ color: "#194b3a", fontWeight: 700, textDecoration: "none" }}>
                    {row.name}
                  </Link>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{row.company || "—"}</div>
                </div>
              ),
            },
            {
              key: "role_category",
              label: "Type",
              render: (row) => formatBdRoleCategory(row.role_category),
            },
            {
              key: "market",
              label: "Market",
              render: (row) => `${row.market_city || "—"}, ${row.market_state || "—"}`,
            },
            {
              key: "relationship_status",
              label: "Status",
              render: (row) => <Badge type="status" value={row.relationship_status} />,
            },
            {
              key: "referred_restaurant_count",
              label: "Referred leads",
              render: (row) => row.referred_restaurant_count ?? 0,
            },
            {
              key: "next_follow_up_at",
              label: "Next follow-up",
              render: (row) => formatDateTime(row.next_follow_up_at),
            },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <button type="button" onClick={() => handleDelete(row)} style={dangerButtonStyle}>
                  Delete
                </button>
              ),
            },
          ]}
          emptyLabel="No business development contacts found for the current filters."
        />

        <Pagination pagination={data.pagination} onPageChange={(page) => setFilters({ ...filters, page })} />
      </CrmCard>
    </CrmPage>
  );
}

function Pagination({ pagination, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((pagination?.total || 0) / (pagination?.page_size || 25)));
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>
        Page {pagination?.page || 1} of {totalPages}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button disabled={(pagination?.page || 1) <= 1} onClick={() => onPageChange((pagination?.page || 1) - 1)} style={secondaryButtonStyle}>Previous</button>
        <button disabled={(pagination?.page || 1) >= totalPages} onClick={() => onPageChange((pagination?.page || 1) + 1)} style={secondaryButtonStyle}>Next</button>
      </div>
    </div>
  );
}

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
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
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#0f1720",
  border: "1px solid #d9e0ea",
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
};

const dangerButtonStyle = {
  background: "#fff",
  color: "#a12828",
  border: "1px solid #f1c7c7",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
};
