import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVenue } from "../../context/VenueContext.jsx";
import AdminConsoleShell from "../../components/adminConsole/AdminConsoleShell.jsx";
import { ADMIN_CONSOLE } from "../../components/adminConsole/adminConsoleTokens.js";

export const VENUE_COLORS = {
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
        background: VENUE_COLORS.panel,
        border: `1px solid ${VENUE_COLORS.line}`,
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
        <h2 style={{ margin: 0, fontSize: 20, color: VENUE_COLORS.ink }}>{title}</h2>
        {subtitle ? (
          <div style={{ marginTop: 6, color: VENUE_COLORS.muted, fontSize: 13 }}>{subtitle}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
}

const NAV_SECTIONS = [
  {
    id: "advertising",
    label: "Advertising",
    items: [
      { to: "/venue/advertising/inventory", label: "Inventory" },
      { to: "/venue/advertising/advertisements", label: "Advertisements" },
      { to: "/venue/advertising/campaigns", label: "Campaigns (Soon)" },
      { to: "/venue/advertising/analytics", label: "Analytics (Soon)" },
      { to: "/venue/advertising/billing", label: "Billing (Soon)" },
      { to: "/venue/advertising/stripe-setup", label: "Stripe Setup (Soon)" },
    ],
  },
];

export default function VenueLayout({ title, children, actions = null }) {
  const { venue, venues, operator, logout, selectVenue } = useVenue();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sections = useMemo(() => NAV_SECTIONS, []);

  async function handleLogout() {
    await logout();
    navigate("/venue/login", { replace: true });
  }

  const footer = (
    <>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{operator?.email}</div>
      <div style={{ marginTop: 4, color: VENUE_COLORS.muted, fontSize: 12 }}>
        {venue?.venue_name || "Venue"}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          marginTop: 12,
          width: "100%",
          border: `1px solid ${VENUE_COLORS.line}`,
          background: "#fff",
          color: VENUE_COLORS.ink,
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
    venues?.length > 1 ? (
      <select
        aria-label="Active venue"
        value={venue?.id || ""}
        onChange={(e) => selectVenue(Number(e.target.value))}
        style={{
          width: "100%",
          borderRadius: 10,
          border: `1px solid ${VENUE_COLORS.line}`,
          padding: "8px 10px",
          fontSize: 13,
        }}
      >
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.venue_name}
          </option>
        ))}
      </select>
    ) : null;

  return (
    <AdminConsoleShell
      homeTo="/venue/advertising/inventory"
      brandSubtitle="Venue Advertising"
      brandAriaLabel="Menuply venue advertising home"
      sections={sections}
      sidebarExtra={sidebarExtra}
      sidebarFooter={footer}
      eyebrow="Venue"
      title={title}
      headerActions={actions}
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      {children}
    </AdminConsoleShell>
  );
}
