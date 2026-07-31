import React, { useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useNavigate } from "react-router-dom";
import { useOwner } from "../../context/OwnerContext.jsx";
import AdminConsoleShell from "../../components/adminConsole/AdminConsoleShell.jsx";
import {
  ADMIN_CONSOLE,
  KB_SESSION_KEYS,
  readKbPanelOpen,
  writeKbPanelOpen,
} from "../../components/adminConsole/adminConsoleTokens.js";
import KnowledgeBasePanel from "../../components/helpSearch/KnowledgeBasePanel.jsx";
import { ownerKnowledgeBaseApi } from "../../lib/knowledgeBaseApi.js";
import "./ownerResponsive.css";

export const OWNER_COLORS = {
  ink: ADMIN_CONSOLE.ink,
  muted: ADMIN_CONSOLE.muted,
  panel: ADMIN_CONSOLE.panel,
  accent: ADMIN_CONSOLE.accent,
  accentSoft: ADMIN_CONSOLE.accentSoft,
  line: ADMIN_CONSOLE.line,
  page: ADMIN_CONSOLE.page,
};

export function PageCard({ children, style = {}, id }) {
  return (
    <section
      id={id}
      style={{
        background: OWNER_COLORS.panel,
        border: `1px solid ${OWNER_COLORS.line}`,
        borderRadius: 18,
        boxShadow: "0 12px 40px rgba(11, 15, 12, 0.06)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ title, subtitle, action = null }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, color: OWNER_COLORS.ink }}>{title}</h2>
        {subtitle ? <div style={{ marginTop: 6, color: OWNER_COLORS.muted, fontSize: 13 }}>{subtitle}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div style={{ padding: 20, borderRadius: 14, background: "#fff", border: `1px dashed ${OWNER_COLORS.line}`, color: OWNER_COLORS.muted }}>
      {children}
    </div>
  );
}

const NAV_SECTIONS = [
  {
    id: "platform",
    label: "Platform",
    items: [
      { to: "/owner", label: "Dashboard", end: true },
      { to: "/owner/phms", label: "Platform Health" },
      { to: "/owner/homepage", label: "Homepage Controls" },
      { to: "/owner/deployments", label: "Deployment Operations" },
      { to: "/owner/intelligence", label: "Platform Intelligence" },
    ],
  },
  {
    id: "restaurant-manager",
    label: "Restaurant Manager",
    items: [
      { to: "/owner/menu-manager?tab=workspace&create=1", label: "Add Restaurant" },
      { to: "/owner/profile-manager", label: "Profile Manager" },
      { to: "/owner/menu-manager", label: "Menu Manager" },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    items: [
      { to: "/owner/restaurants", label: "Restaurant Intelligence" },
      { to: "/owner/revenue", label: "Revenue" },
      { to: "/owner/subscription-designer", label: "Subscription Designer" },
      { to: "/owner/market-expansion", label: "Market Expansion" },
      { to: "/owner/qr-stickers", label: "QR Stickers" },
    ],
  },
  {
    id: "support",
    label: "Support",
    items: [
      { to: "/owner/support", label: "Support Tickets" },
      { to: "/owner/help", label: "Knowledge Base", icon: "?" },
    ],
  },
];

export default function OwnerLayout({ title, children, actions = null }) {
  const { t } = useLanguage();
  const { owner, logout } = useOwner();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(() =>
    readKbPanelOpen(KB_SESSION_KEYS.owner)
  );

  async function handleLogout() {
    await logout();
    navigate("/owner/login", { replace: true });
  }

  function toggleKnowledge() {
    setKnowledgeOpen((open) => {
      const next = !open;
      writeKbPanelOpen(KB_SESSION_KEYS.owner, next);
      return next;
    });
  }

  const sections = useMemo(() => NAV_SECTIONS, []);

  const footer = (
    <>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{owner?.full_name || owner?.email}</div>
      <div style={{ marginTop: 4, color: OWNER_COLORS.muted, fontSize: 12 }}>{owner?.role || "owner_admin"}</div>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          marginTop: 12,
          width: "100%",
          border: `1px solid ${OWNER_COLORS.line}`,
          background: "#fff",
          color: OWNER_COLORS.ink,
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

  return (
    <AdminConsoleShell
      homeTo="/owner"
      brandSubtitle="Owner Control Center"
      brandAriaLabel="Menuply owner control center home"
      sections={sections}
      sidebarFooter={footer}
      eyebrow={t("owner.platformAdmin", "Platform Admin")}
      title={title}
      headerActions={actions}
      knowledgeOpen={knowledgeOpen}
      onToggleKnowledge={toggleKnowledge}
      knowledgePanel={
        <KnowledgeBasePanel
          onClose={toggleKnowledge}
          api={ownerKnowledgeBaseApi}
          helpPath="/owner/help"
          supportPath="/owner/support"
        />
      }
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      {children}
    </AdminConsoleShell>
  );
}
