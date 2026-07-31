import React from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { NavLink, useNavigate } from "react-router-dom";
import { useCrm } from "../../context/CrmContext.jsx";

const NAV = [
  { to: "/crm", label: "Dashboard" },
  { to: "/crm/subscriptions", label: "Subscriptions" },
  { to: "/crm/commissions", label: "Commissions" },
  { to: "/crm/orders", label: "Orders" },
  { to: "/crm/leads", label: "Leads" },
  { to: "/crm/business-development", label: "Business Development" },
  { to: "/crm/companies", label: "Companies" },
  { to: "/crm/tasks", label: "Tasks" },
  { to: "/crm/seed-explorer", label: "Seed Explorer" },
  { to: "/clusters/admin", label: "Cluster Manager" },
  { to: "/crm/reports", label: "Reports" },
  { to: "/crm/qr-inventory", label: "QR Inventory" },
  { to: "/crm/marketplace", label: "Marketplace" },
];

export default function CrmLayout({ title, actions = null, children }) {
  const { t } = useLanguage();
  const { operator, logout } = useCrm();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/crm/login", { replace: true });
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(200px, 240px) minmax(0, 1fr)", background: "linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%)", fontFamily: '"Instrument Sans", "Avenir Next", sans-serif', overflowX: "hidden" }}>
      <aside style={{ borderRight: "1px solid #d9e0ea", background: "rgba(255,255,255,0.92)", padding: "26px 18px", backdropFilter: "blur(10px)" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#173f35", letterSpacing: "-0.04em" }}>Menuply</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em" }}>
            CRM Workspace
          </div>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/crm"}
              style={({ isActive }) => ({
                padding: "12px 14px",
                borderRadius: 14,
                textDecoration: "none",
                color: isActive ? "#173f35" : "#0f1720",
                background: isActive ? "#e8f3ef" : "transparent",
                border: isActive ? "1px solid #cfe0d9" : "1px solid transparent",
                fontWeight: isActive ? 700 : 600,
                fontSize: 14,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid #d9e0ea" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f1720" }}>{operator?.full_name || operator?.email}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{operator?.email}</div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 12,
              width: "100%",
              border: "1px solid #d9e0ea",
              background: "#fff",
              color: "#0f1720",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ padding: "28px 32px 40px", minWidth: 0, overflowX: "hidden" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 8 }}>
              Internal CRM
            </div>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#0f1720" }}>{title}</h1>
          </div>
          {actions}
        </header>
        {children}
      </main>
    </div>
  );
}
