import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCrmDashboard } from "../../lib/crmApi.js";
import {
  Badge,
  CrmCard,
  CrmPage,
  DataTable,
  ErrorBanner,
  FilterLink,
  LinkCell,
  StatTile,
  formatDateTime,
} from "./CrmShared.jsx";

export default function CrmDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCrmDashboard().then(setData).catch((err) => setError(err.message || "Unable to load CRM dashboard"));
  }, []);

  const summary = data?.summary;

  return (
    <CrmPage
      title="CRM Dashboard"
      actions={
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/crm/leads" style={actionLinkStyle}>Open lead list</Link>
          <Link to="/crm/tasks" style={actionLinkStyle}>Open tasks</Link>
          <Link to="/crm/reports" style={actionLinkStyle}>Open reports</Link>
        </div>
      }
    >
      <ErrorBanner message={error} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 18 }}>
        <StatTile label="Open leads" value={summary?.total_open_leads} to="/crm/leads?open_only=true" />
        <StatTile label="New leads" value={summary?.new_leads} to="/crm/leads?status=new" />
        <StatTile label="Engaged" value={summary?.engaged_leads} to="/crm/leads?pipeline_stages=engaged,demo,trial,negotiation" />
        <StatTile label="Won this month" value={summary?.won_this_month} to="/crm/leads?won_this_month=true" />
        <StatTile label="Lost this month" value={summary?.lost_this_month} to="/crm/leads?lost_this_month=true" />
        <StatTile label="Overdue tasks" value={summary?.overdue_tasks} to="/crm/tasks?overdue_only=true" />
        <StatTile label="Tasks due today" value={summary?.due_today_tasks} to="/crm/tasks?due_today=true" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, marginBottom: 18 }}>
        <CrmCard title="Top Priority Leads" subtitle="Highest current priority scores">
          <DataTable
            rows={data?.top_priority_leads || []}
            columns={[
              { key: "lead_name", label: "Lead", render: (row) => <LinkCell to={`/crm/leads/${row.id}`}>{row.lead_name}</LinkCell> },
              { key: "pipeline_stage", label: "Stage", render: (row) => <Badge type="stage" value={row.pipeline_stage} /> },
              { key: "priority", label: "Priority", render: (row) => <Badge type="priority" value={row.priority} /> },
              { key: "source", label: "Source" },
            ]}
            emptyLabel="No leads yet."
          />
        </CrmCard>

        <CrmCard title="Follow-Up Queue" subtitle="Due and overdue follow-ups">
          <DataTable
            rows={data?.follow_up_queue || []}
            keyField="lead_id"
            columns={[
              { key: "lead_name", label: "Lead", render: (row) => <LinkCell to={`/crm/leads/${row.lead_id}`}>{row.lead_name}</LinkCell> },
              { key: "next_follow_up_at", label: "Next follow-up", render: (row) => formatDateTime(row.next_follow_up_at) },
              { key: "priority", label: "Priority", render: (row) => <Badge type="priority" value={row.priority} /> },
            ]}
            emptyLabel="No follow-ups scheduled."
          />
        </CrmCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <CrmCard title="Recent Activities" subtitle="Latest lead activity across the CRM">
          <DataTable
            rows={data?.recent_activities || []}
            columns={[
              { key: "lead_name", label: "Lead", render: (row) => <LinkCell to={`/crm/leads/${row.lead_id}`}>{row.lead_name}</LinkCell> },
              { key: "activity_type", label: "Type", render: (row) => <Badge type="status" value={row.activity_type} /> },
              { key: "created_at", label: "When", render: (row) => formatDateTime(row.created_at) },
            ]}
            emptyLabel="No activities logged yet."
          />
        </CrmCard>

        <CrmCard title="Recent Wins" subtitle="Newest converted accounts">
          <DataTable
            rows={data?.recent_wins || []}
            columns={[
              { key: "lead_name", label: "Lead", render: (row) => <LinkCell to={`/crm/leads/${row.id}`}>{row.lead_name}</LinkCell> },
              { key: "source", label: "Source" },
              { key: "converted_at", label: "Converted", render: (row) => formatDateTime(row.converted_at) },
            ]}
            emptyLabel="No wins recorded yet."
          />
        </CrmCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <CrmCard title="Leads By Source">
          <KeyValueGrid data={summary?.leads_by_source || {}} linkForKey={(key) => `/crm/leads?source=${encodeURIComponent(key)}`} />
        </CrmCard>
        <CrmCard title="Leads By Stage">
          <KeyValueGrid data={summary?.leads_by_stage || {}} linkForKey={(key) => `/crm/leads?pipeline_stage=${encodeURIComponent(key)}`} />
        </CrmCard>
      </div>

      <div style={{ marginTop: 18 }}>
        <CrmCard title="High-Demand Unclaimed Restaurants" subtitle="Search demand visible in Common Knowledge but still unclaimed">
          <DataTable
            rows={data?.high_demand_unclaimed_restaurants || []}
            keyField="restaurant_id"
            columns={[
              {
                key: "restaurant_name",
                label: "Restaurant",
                render: (row) => {
                  if (row.slug) {
                    return (
                      <a
                        href={`https://menuply.com/restaurants/${encodeURIComponent(row.slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#194b3a", fontWeight: 700, textDecoration: "none" }}
                      >
                        {row.restaurant_name}
                      </a>
                    );
                  }
                  return (
                    <FilterLink to={`/crm/leads?search=${encodeURIComponent(row.restaurant_name || "")}`}>
                      {row.restaurant_name}
                    </FilterLink>
                  );
                },
              },
              { key: "city", label: "City" },
              { key: "state", label: "State" },
              { key: "search_demand_count", label: "Demand" },
              { key: "menu_item_count", label: "Menu items" },
            ]}
            emptyLabel="No demand-linked unclaimed restaurants available."
          />
        </CrmCard>
      </div>
    </CrmPage>
  );
}

function KeyValueGrid({ data, linkForKey = null }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return <div style={{ color: "#64748b" }}>No data.</div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
      {entries.map(([key, value]) => {
        const to = linkForKey ? linkForKey(key) : null;
        const content = (
          <>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{key.replaceAll("_", " ")}</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: "#0f1720" }}>{value}</div>
          </>
        );
        if (to) {
          return (
            <Link
              key={key}
              to={to}
              style={{
                padding: 12,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #d9e0ea",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                cursor: "pointer",
              }}
            >
              {content}
            </Link>
          );
        }
        return (
          <div key={key} style={{ padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #d9e0ea" }}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

const actionLinkStyle = {
  textDecoration: "none",
  background: "#194b3a",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
};
