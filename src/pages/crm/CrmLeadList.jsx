import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createCrmLead, getCrmLeads } from "../../lib/crmApi.js";
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
  status: "",
  pipeline_stage: "",
  source: "",
  priority: "",
  city: "",
  state: "",
  overdue_only: "",
  sort: "updated_at_desc",
  page: 1,
  page_size: 25,
};

export default function CrmLeadList() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState({ leads: [], pagination: { page: 1, total: 0, page_size: 25 } });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newLead, setNewLead] = useState({ lead_name: "", source: "manual", priority: "normal" });

  useEffect(() => {
    loadLeads(filters);
  }, [filters]);

  async function loadLeads(nextFilters) {
    try {
      setError("");
      const json = await getCrmLeads(nextFilters);
      setData(json);
    } catch (err) {
      setError(err.message || "Unable to load leads");
    }
  }

  async function handleCreateLead(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createCrmLead(newLead);
      setNewLead({ lead_name: "", source: "manual", priority: "normal" });
      setSuccess("Lead created.");
      loadLeads(filters);
    } catch (err) {
      setError(err.message || "Unable to create lead");
    }
  }

  return (
    <CrmPage title="CRM Leads">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 18 }}>
        <CrmCard title="Lead Filters">
          <div style={filterGridStyle}>
            <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} placeholder="Search leads, restaurants, email, phone" style={inputStyle} />
            <select value={filters.pipeline_stage} onChange={(e) => setFilters({ ...filters, pipeline_stage: e.target.value, page: 1 })} style={inputStyle}>
              <option value="">All stages</option>
              {["new", "qualified", "outreach", "engaged", "demo", "trial", "negotiation", "won", "lost"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} style={inputStyle}>
              <option value="">All statuses</option>
              {["new", "contacted", "interested", "demo_scheduled", "trial", "won", "lost", "inactive"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })} style={inputStyle}>
              <option value="">All priorities</option>
              {["low", "normal", "high", "urgent"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <input value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value, page: 1 })} placeholder="City" style={inputStyle} />
            <input value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value, page: 1 })} placeholder="State" style={inputStyle} />
            <select value={filters.overdue_only} onChange={(e) => setFilters({ ...filters, overdue_only: e.target.value, page: 1 })} style={inputStyle}>
              <option value="">Any follow-up status</option>
              <option value="true">Overdue only</option>
            </select>
            <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })} style={inputStyle}>
              <option value="updated_at_desc">Recently updated</option>
              <option value="created_at_desc">Newest created</option>
              <option value="next_follow_up_at_asc">Next follow-up first</option>
              <option value="priority_desc">Highest priority first</option>
            </select>
          </div>
        </CrmCard>

        <CrmCard title="Quick Create Lead" subtitle="Manual internal lead entry">
          <form onSubmit={handleCreateLead} style={{ display: "grid", gap: 10 }}>
            <input value={newLead.lead_name} onChange={(e) => setNewLead({ ...newLead, lead_name: e.target.value })} placeholder="Lead name" style={inputStyle} />
            <input value={newLead.contact_name || ""} onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })} placeholder="Contact name" style={inputStyle} />
            <input value={newLead.email || ""} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} placeholder="Email" style={inputStyle} />
            <input value={newLead.phone || ""} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
            <button type="submit" style={primaryButtonStyle}>Create lead</button>
          </form>
        </CrmCard>
      </div>

      <CrmCard title="Lead List" subtitle={`${data.pagination.total || 0} total leads`}>
        <DataTable
          rows={data.leads || []}
          columns={[
            {
              key: "lead_name",
              label: "Lead",
              render: (row) => (
                <div>
                  <Link to={`/admin/crm/leads/${row.id}`} style={{ color: "#194b3a", fontWeight: 700, textDecoration: "none" }}>{row.lead_name}</Link>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{row.restaurant_name || "Unlinked restaurant"}</div>
                </div>
              ),
            },
            { key: "pipeline_stage", label: "Stage", render: (row) => <Badge type="stage" value={row.pipeline_stage} /> },
            { key: "status", label: "Status", render: (row) => <Badge type="status" value={row.status} /> },
            { key: "priority", label: "Priority", render: (row) => <Badge type="priority" value={row.priority} /> },
            { key: "source", label: "Source" },
            { key: "subscription_status", label: "Subscription", render: (row) => <Badge type="account" value={row.subscription_status} /> },
            { key: "next_follow_up_at", label: "Next follow-up", render: (row) => formatDateTime(row.next_follow_up_at) },
            { key: "updated_at", label: "Updated", render: (row) => formatDateTime(row.updated_at) },
          ]}
          emptyLabel="No CRM leads found for the current filters."
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
