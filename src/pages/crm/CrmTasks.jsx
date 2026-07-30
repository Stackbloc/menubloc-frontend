import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { completeCrmTask, getCrmTasks } from "../../lib/crmApi.js";
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
  overdue_only: "true",
  status: "",
  due_today: "",
  page: 1,
  page_size: 25,
};

function filtersFromSearchParams(searchParams) {
  const hasAny = ["overdue_only", "due_today", "status", "page", "page_size"].some((key) => searchParams.has(key));
  if (!hasAny) return { ...DEFAULT_FILTERS };

  return {
    overdue_only: searchParams.get("overdue_only") || "",
    status: searchParams.get("status") || "",
    due_today: searchParams.get("due_today") || "",
    page: Number.parseInt(searchParams.get("page") || "1", 10) || 1,
    page_size: Number.parseInt(searchParams.get("page_size") || "25", 10) || 25,
  };
}

function searchParamsFromFilters(filters) {
  const params = new URLSearchParams();
  if (filters.overdue_only) params.set("overdue_only", String(filters.overdue_only));
  if (filters.due_today) params.set("due_today", String(filters.due_today));
  if (filters.status) params.set("status", String(filters.status));
  if (filters.page && Number(filters.page) !== 1) params.set("page", String(filters.page));
  if (filters.page_size && Number(filters.page_size) !== 25) params.set("page_size", String(filters.page_size));
  return params;
}

function filtersEqual(a, b) {
  return ["overdue_only", "status", "due_today", "page", "page_size"].every(
    (key) => String(a[key] ?? "") === String(b[key] ?? "")
  );
}

export default function CrmTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => filtersFromSearchParams(searchParams), []);
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState({ tasks: [], pagination: { page: 1, total: 0, page_size: 25 } });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    setFilters((current) => (filtersEqual(current, fromUrl) ? current : fromUrl));
  }, [searchParams]);

  useEffect(() => {
    const nextParams = searchParamsFromFilters(filters);
    if (searchParams.toString() !== nextParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  useEffect(() => {
    loadTasks(filters);
  }, [filters]);

  async function loadTasks(nextFilters) {
    try {
      setError("");
      const json = await getCrmTasks(nextFilters);
      setData(json);
    } catch (err) {
      setError(err.message || "Unable to load tasks");
    }
  }

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  async function handleComplete(taskId) {
    try {
      setError("");
      await completeCrmTask(taskId);
      setSuccess("Task completed.");
      loadTasks(filters);
    } catch (err) {
      setError(err.message || "Unable to complete task");
    }
  }

  return (
    <CrmPage title="CRM Tasks">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <CrmCard title="Task Filters" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <select value={filters.status} onChange={(e) => updateFilters({ status: e.target.value, page: 1 })} style={inputStyle}>
            <option value="">All statuses</option>
            {["open", "in_progress", "completed", "canceled"].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select
            value={filters.overdue_only}
            onChange={(e) => updateFilters({ overdue_only: e.target.value, due_today: "", page: 1 })}
            style={inputStyle}
          >
            <option value="">All due windows</option>
            <option value="true">Overdue only</option>
          </select>
          <select
            value={filters.due_today}
            onChange={(e) => updateFilters({ due_today: e.target.value, overdue_only: "", page: 1 })}
            style={inputStyle}
          >
            <option value="">All due windows</option>
            <option value="true">Due today</option>
          </select>
        </div>
      </CrmCard>

      <CrmCard title="Task Queue" subtitle={`${data.pagination.total || 0} tasks`}>
        <DataTable
          rows={data.tasks || []}
          columns={[
            { key: "title", label: "Task" },
            { key: "lead_name", label: "Lead", render: (row) => <Link to={`/crm/leads/${row.lead_id}`} style={linkStyle}>{row.lead_name}</Link> },
            { key: "task_type", label: "Type" },
            { key: "priority", label: "Priority", render: (row) => <Badge type="priority" value={row.priority} /> },
            { key: "status", label: "Status", render: (row) => <Badge type="status" value={row.status} /> },
            { key: "due_at", label: "Due", render: (row) => formatDateTime(row.due_at) },
            {
              key: "actions",
              label: "Actions",
              render: (row) => row.status !== "completed" ? <button onClick={() => handleComplete(row.id)} style={buttonStyle}>Complete</button> : "—",
            },
          ]}
          emptyLabel="No tasks match the current filters."
        />
      </CrmCard>
    </CrmPage>
  );
}

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

const buttonStyle = {
  background: "#fff",
  color: "#0f1720",
  border: "1px solid #d9e0ea",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  cursor: "pointer",
};

const linkStyle = {
  color: "#194b3a",
  fontWeight: 700,
  textDecoration: "none",
};
