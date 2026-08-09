import React from "react";
import { Link } from "react-router-dom";
import CrmLayout from "./CrmLayout.jsx";

export const CRM_COLORS = {
  ink: "#0f1720",
  muted: "#64748b",
  line: "#d9e0ea",
  panel: "#ffffff",
  soft: "#f4f7fb",
  accent: "#194b3a",
  accentSoft: "#eaf4f0",
  dangerSoft: "#fbe5e6",
  dangerInk: "#a12828",
};

export function CrmPage({ title, children, actions = null }) {
  return (
    <CrmLayout title={title} actions={actions}>
      {children}
    </CrmLayout>
  );
}

export function CrmCard({ title, subtitle = null, action = null, children, style = {} }) {
  return (
    <section
      style={{
        background: CRM_COLORS.panel,
        border: `1px solid ${CRM_COLORS.line}`,
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 12px 30px rgba(15, 23, 32, 0.04)",
        ...style,
      }}
    >
      {(title || action || subtitle) ? (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            {title ? <h2 style={{ margin: 0, fontSize: 18, color: CRM_COLORS.ink }}>{title}</h2> : null}
            {subtitle ? <div style={{ marginTop: 6, fontSize: 13, color: CRM_COLORS.muted }}>{subtitle}</div> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatTile({ label, value, sub = null, to = null }) {
  const body = (
    <>
      <div style={{ fontSize: 28, fontWeight: 800, color: CRM_COLORS.ink }}>{value ?? "—"}</div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: CRM_COLORS.ink }}>{label}</div>
      {sub ? <div style={{ marginTop: 4, fontSize: 12, color: CRM_COLORS.muted }}>{sub}</div> : null}
    </>
  );
  const baseStyle = {
    background: CRM_COLORS.panel,
    border: `1px solid ${CRM_COLORS.line}`,
    borderRadius: 16,
    padding: 18,
    display: "block",
    textDecoration: "none",
    color: "inherit",
  };
  if (to) {
    return (
      <Link
        to={to}
        style={{ ...baseStyle, cursor: "pointer", transition: "border-color 120ms ease, box-shadow 120ms ease" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = CRM_COLORS.accent;
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(25, 75, 58, 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = CRM_COLORS.line;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {body}
      </Link>
    );
  }
  return <div style={baseStyle}>{body}</div>;
}

export function FilterLink({ to, children, style = {} }) {
  if (!to) return children ?? null;
  return (
    <Link
      to={to}
      style={{
        color: CRM_COLORS.accent,
        fontWeight: 700,
        textDecoration: "none",
        ...style,
      }}
    >
      {children}
    </Link>
  );
}

function badgePalette(type, value) {
  const text = String(value || "").toLowerCase();
  if (type === "priority") {
    if (text === "urgent") return { bg: "#fee2e2", fg: "#991b1b" };
    if (text === "high") return { bg: "#ffedd5", fg: "#9a3412" };
    if (text === "normal") return { bg: "#e0f2fe", fg: "#075985" };
    return { bg: "#f1f5f9", fg: "#475569" };
  }
  if (type === "stage") {
    if (text === "won") return { bg: "#dcfce7", fg: "#166534" };
    if (text === "lost") return { bg: "#fee2e2", fg: "#991b1b" };
    if (text === "demo" || text === "trial") return { bg: "#ede9fe", fg: "#5b21b6" };
    if (text === "engaged" || text === "negotiation") return { bg: "#fef3c7", fg: "#92400e" };
    return { bg: "#e2e8f0", fg: "#334155" };
  }
  if (type === "status") {
    if (text === "won" || text === "active" || text === "upcoming" || text === "primary") return { bg: "#dcfce7", fg: "#166534" };
    if (text === "lost" || text === "overdue" || text === "do_not_contact" || text === "inactive") return { bg: "#fee2e2", fg: "#991b1b" };
    if (text === "demo_scheduled" || text === "trial" || text === "responded") return { bg: "#ede9fe", fg: "#5b21b6" };
    if (text === "interested" || text === "contacted") return { bg: "#fef3c7", fg: "#92400e" };
    return { bg: "#e2e8f0", fg: "#334155" };
  }
  if (type === "account") {
    if (text === "active" || text === "claimed" || text === "live") return { bg: "#dcfce7", fg: "#166534" };
    if (text === "past_due" || text === "stalled") return { bg: "#fef3c7", fg: "#92400e" };
    if (text === "canceled" || text === "rejected") return { bg: "#fee2e2", fg: "#991b1b" };
    return { bg: "#f1f5f9", fg: "#475569" };
  }
  return { bg: "#f1f5f9", fg: "#475569" };
}

export function Badge({ type, value }) {
  if (!value) return <span style={{ color: CRM_COLORS.muted }}>—</span>;
  const palette = badgePalette(type, value);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 700,
        background: palette.bg,
        color: palette.fg,
        textTransform: "capitalize",
      }}
    >
      {String(value).replaceAll("_", " ")}
    </span>
  );
}

export function EmptyState({ children }) {
  return (
    <div style={{ padding: 18, border: `1px dashed ${CRM_COLORS.line}`, borderRadius: 14, background: CRM_COLORS.soft, color: CRM_COLORS.muted }}>
      {children}
    </div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: CRM_COLORS.dangerSoft, color: CRM_COLORS.dangerInk, border: "1px solid #f5c2c7" }}>
      {message}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: CRM_COLORS.accentSoft, color: CRM_COLORS.accent, border: "1px solid #cce2d7" }}>
      {message}
    </div>
  );
}

export function DataTable({ columns, rows, keyField = "id", emptyLabel = "No records found." }) {
  if (!rows.length) return <EmptyState>{emptyLabel}</EmptyState>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: CRM_COLORS.muted, borderBottom: `1px solid ${CRM_COLORS.line}` }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]} style={{ borderBottom: `1px solid ${CRM_COLORS.line}` }}>
              {columns.map((column) => (
                <td key={column.key} style={{ padding: "12px", verticalAlign: "top", fontSize: 14, color: CRM_COLORS.ink }}>
                  {column.render ? column.render(row) : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function fieldValue(value) {
  return value === null || value === undefined || value === "" ? "—" : value;
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function formatDateOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function LinkCell({ to, children }) {
  return (
    <Link to={to} style={{ color: CRM_COLORS.accent, fontWeight: 700, textDecoration: "none" }}>
      {children}
    </Link>
  );
}
