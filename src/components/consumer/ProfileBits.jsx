/**
 * Profile pieces that follow the app (Andre 2026-11-06): actions are an icon + a green word (no green
 * pills), the Verified student badge with its date, and "You both want".
 */
import React from "react";
import { Link } from "react-router-dom";
import AppIcon from "../icons/AppIcon.jsx";

const GREEN = "#0f7a24";
const actionStyle = { display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: "4px 2px", font: "inherit", fontWeight: 600, fontSize: 15, color: GREEN, cursor: "pointer", textDecoration: "none" };

/** Icon + green word. `to` → a link; otherwise a button. */
export function ActionLabel({ icon, label, to = null, onClick, disabled = false, testId }) {
  const inner = (
    <>
      <AppIcon name={icon} size={18} color={GREEN} />
      <span>{label}</span>
    </>
  );
  return to ? (
    <Link to={to} style={actionStyle} data-testid={testId}>
      {inner}
    </Link>
  ) : (
    <button type="button" style={{ ...actionStyle, opacity: disabled ? 0.5 : 1 }} onClick={onClick} disabled={disabled} data-testid={testId}>
      {inner}
    </button>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function verifiedMonth(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : null;
}

/** "✓ Verified USC student · since Nov 2026": any school, only when verified. */
export function StudentBadge({ school, verifiedAt }) {
  if (!school) return null;
  const since = verifiedMonth(verifiedAt);
  return (
    <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#111613" }} data-testid="student-badge">
      <span style={{ color: GREEN, fontWeight: 700 }}>✓ </span>
      {`Verified ${school} student${since ? ` · since ${since}` : ""}`}
    </p>
  );
}

/** "You both want": up to 3 rows, each → Invite. */
export function BothWant({ items, inviteTo }) {
  if (!items?.length) return null;
  return (
    <section style={{ alignSelf: "stretch", background: "#f5f7f4", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 6, marginTop: 8, textAlign: "left" }} data-testid="both-want">
      <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>You both want</span>
      {items.map((w) => (
        <Link key={w.key} to={inviteTo} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#111613" }} data-testid={`both-want-${w.key}`}>
          <strong style={{ flex: 1, fontSize: 15 }}>{w.restaurantName ? `${w.food} · ${w.restaurantName}` : w.food}</strong>
          <span style={{ fontSize: 13, fontWeight: 600, color: GREEN }}>Invite</span>
        </Link>
      ))}
    </section>
  );
}
