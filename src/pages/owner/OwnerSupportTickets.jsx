import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerSupportTickets } from "../../lib/ownerApi.js";

export default function OwnerSupportTickets() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ status: "", priority: "", category: "" });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
    getOwnerSupportTickets(params)
      .then(setData)
      .catch(() => setError("Support ticket data is temporarily unavailable."))
      .finally(() => setLoading(false));
  }, [filters]);

  const unavailable = !loading && !error && data?.available === false;

  return (
    <OwnerLayout title="Support Tickets" actions={<Filters value={filters} onChange={setFilters} admins={data?.admins || []} />}>
      {error ? <ErrorBanner message={error} /> : null}
      <div style={{ display: "grid", gap: 18 }}>
        <div className="owner-responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(160px, 1fr))", gap: 14 }}>
          <MetricCard label="Total" value={loading ? null : data?.summary?.total_tickets} />
          <MetricCard label="Open" value={loading ? null : data?.summary?.open_tickets} />
          <MetricCard label="Resolved" value={loading ? null : data?.summary?.resolved_tickets} />
          <MetricCard label="Closed" value={loading ? null : data?.summary?.closed_tickets} />
        </div>

        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Ticket Queue" subtitle="Owner/admin management view across all platform support requests." />
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#667085", fontSize: 14 }}>Loading tickets…</div>
          ) : unavailable ? (
            <EmptyState>No support tickets have been created yet.</EmptyState>
          ) : !data?.tickets?.length ? (
            <EmptyState>No tickets match the current filters.</EmptyState>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Ticket", "Source", "Subject", "From", "Restaurant", "Status", "Priority", "Assigned", "Updated"].map((label) => <th key={label} style={thStyle}>{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={tdStyle}><Link to={`/owner/support/${ticket.id}`} style={linkStyle}>{ticket.ticket_number || `#${ticket.id}`}</Link></td>
                      <td style={tdStyle}><SourceBadge source={ticket.ticket_source} /></td>
                      <td style={tdStyle}>{ticket.subject}</td>
                      <td style={tdStyle}><SubmitterCell ticket={ticket} /></td>
                      <td style={tdStyle}>{ticket.restaurant_name || "—"}</td>
                      <td style={tdStyle}>{ticket.status}</td>
                      <td style={tdStyle}>{ticket.priority}</td>
                      <td style={tdStyle}>{ticket.assigned_to_name || ticket.assigned_to_email || "Unassigned"}</td>
                      <td style={tdStyle}>{formatDate(ticket.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>
      </div>
    </OwnerLayout>
  );
}

function SourceBadge({ source }) {
  const isDiner = source === "diner";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: isDiner ? "#eff6ff" : "#f0fdf4",
      color: isDiner ? "#1d4ed8" : "#166534",
      border: `1px solid ${isDiner ? "#bfdbfe" : "#bbf7d0"}`,
    }}>
      {isDiner ? "Diner" : "Operator"}
    </span>
  );
}

function SubmitterCell({ ticket }) {
  if (ticket.ticket_source === "diner") {
    return (
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{ticket.submitter_name || "—"}</div>
        {ticket.submitter_email ? (
          <a href={`mailto:${ticket.submitter_email}`} style={{ color: "#667085", fontSize: 12 }}>{ticket.submitter_email}</a>
        ) : null}
      </div>
    );
  }
  return <span style={{ color: "#667085", fontSize: 13 }}>{ticket.operator_email || ticket.assigned_to_email || "—"}</span>;
}

function Filters({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
      <select value={value.status} onChange={(e) => onChange((cur) => ({ ...cur, status: e.target.value }))} style={inputStyle}>
        <option value="">All statuses</option>
        {["open", "pending", "waiting", "in_progress", "resolved", "closed"].map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select value={value.priority} onChange={(e) => onChange((cur) => ({ ...cur, priority: e.target.value }))} style={inputStyle}>
        <option value="">All priorities</option>
        {["low", "normal", "high", "urgent"].map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <input value={value.category} placeholder="Category" onChange={(e) => onChange((cur) => ({ ...cur, category: e.target.value }))} style={inputStyle} />
    </div>
  );
}

function MetricCard({ label, value }) {
  return <PageCard style={{ padding: 18 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>{value ?? "N/A"}</div></PageCard>;
}

function ErrorBanner({ message }) {
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>{message}</div>;
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff" };
const thStyle = { textAlign: "left", padding: "0 0 12px", fontSize: 12, color: "#667085" };
const tdStyle = { padding: "12px 0", borderTop: "1px solid #ead9ce", fontSize: 14 };
const linkStyle = { color: "#9f3a22", fontWeight: 700, textDecoration: "none" };
