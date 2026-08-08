import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDistributor } from "../../context/DistributorContext.jsx";
import AdminConsoleShell from "../../components/adminConsole/AdminConsoleShell.jsx";
import { ADMIN_CONSOLE } from "../../components/adminConsole/adminConsoleTokens.js";

export const DIST_COLORS = {
  ink: ADMIN_CONSOLE.ink,
  muted: ADMIN_CONSOLE.muted,
  panel: ADMIN_CONSOLE.panel,
  accent: ADMIN_CONSOLE.accent,
  line: ADMIN_CONSOLE.line,
  page: ADMIN_CONSOLE.page,
};

export function PageCard({ children, style = {} }) {
  return (
    <section
      style={{
        background: DIST_COLORS.panel,
        border: `1px solid ${DIST_COLORS.line}`,
        borderRadius: 18,
        boxShadow: "0 12px 40px rgba(11, 15, 12, 0.06)",
        padding: 20,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ title, subtitle, action = null }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
        marginBottom: 18,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 20, color: DIST_COLORS.ink }}>{title}</h2>
        {subtitle ? (
          <div style={{ marginTop: 6, color: DIST_COLORS.muted, fontSize: 13 }}>{subtitle}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** V1 Restaurant Intelligence: Profile + Restaurants only (no Connect/Messages nav). */
const NAV_SECTIONS = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { to: "/distributor", label: "Home", end: true },
      { to: "/distributor/profile", label: "Profile" },
      { to: "/distributor/restaurants", label: "Restaurants" },
    ],
  },
];

export default function DistributorLayout({ title, children, actions = null }) {
  const { distributor, memberships, operator, logout, selectDistributor } = useDistributor();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sections = useMemo(() => NAV_SECTIONS, []);

  async function handleLogout() {
    await logout();
    navigate("/distributor/login", { replace: true });
  }

  const footer = (
    <>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{operator?.email}</div>
      <div style={{ marginTop: 4, color: DIST_COLORS.muted, fontSize: 12 }}>
        {distributor?.display_name || "Distributor"}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          marginTop: 12,
          width: "100%",
          border: `1px solid ${DIST_COLORS.line}`,
          background: "#fff",
          color: DIST_COLORS.ink,
          borderRadius: 10,
          padding: "9px 12px",
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
        }}
      >
        Sign out
      </button>
    </>
  );

  const sidebarExtra =
    memberships?.length > 1 ? (
      <select
        aria-label="Active distributor"
        value={distributor?.id || ""}
        onChange={(e) => selectDistributor(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 10,
          border: `1px solid ${DIST_COLORS.line}`,
          padding: "8px 10px",
          fontSize: 13,
        }}
      >
        {memberships.map((m) => (
          <option key={m.id} value={m.id}>
            {m.display_name}
          </option>
        ))}
      </select>
    ) : null;

  return (
    <AdminConsoleShell
      homeTo="/distributor"
      brandSubtitle="Distributor"
      brandAriaLabel="Menuply distributor home"
      sections={sections}
      sidebarExtra={sidebarExtra}
      sidebarFooter={footer}
      eyebrow="Distributor"
      title={title}
      headerActions={actions}
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      {children}
    </AdminConsoleShell>
  );
}
