/**
 * Compact X action launcher — eat-together actions only.
 * I'm Eating At stays guest-open. Diners RSVP to events; operators create them.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";

const ACTIONS = [
  {
    id: "im-eating",
    title: "I'm Eating At",
    description: "Share where you are eating right now.",
    to: "/account/im-eating",
    guestOk: true,
  },
  {
    id: "share-food",
    title: "Share Food",
    description: "Add what you ate — restaurant or homemade.",
    to: "/account/what-i-ate",
    guestOk: false,
  },
  {
    id: "invite",
    title: "Invite to Eat",
    description: "Find a restaurant, then invite from the profile.",
    to: "/search",
    guestOk: true,
  },
  {
    id: "plan",
    title: "Create Eating Plan",
    description: "Plan a meal with connections or a Dining Crew.",
    to: "/account/what-we-doing",
    guestOk: false,
  },
  {
    id: "want",
    title: "Add to Want to Eat",
    description: "Search a dish or restaurant to save it.",
    to: "/search",
    guestOk: false,
  },
  {
    id: "events",
    title: "Find events",
    description: "See events at restaurants, venues, and clusters.",
    to: "/clusters",
    guestOk: true,
  },
];

export default function MenuplyActionSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  function go(action) {
    onClose();
    if (!action.guestOk && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(action.to)}`);
      return;
    }
    navigate(action.to);
  }

  return createPortal(
    <div
      role="presentation"
      data-testid="menuply-action-sheet"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={styles.backdrop}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="menuply-x-title" style={styles.sheet}>
        <div style={styles.head}>
          <h2 id="menuply-x-title" style={styles.title}>
            Do something
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.close}>
            Close
          </button>
        </div>
        <p style={styles.lead}>I'm Eating At is first. Eat together — not a giant menu.</p>
        <ul style={styles.list}>
          {ACTIONS.map((action) => (
            <li key={action.id}>
              <button type="button" onClick={() => go(action)} style={styles.action}>
                <span style={styles.actionTitle}>{action.title}</span>
                <span style={styles.actionDesc}>{action.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 400,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  sheet: {
    width: "min(420px, 100%)",
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
    padding: "16px 16px 10px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 900, color: "#0B0F0C" },
  close: {
    border: 0,
    background: "transparent",
    color: "#667085",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
  lead: { margin: "6px 0 12px", fontSize: 13, color: "#667085", lineHeight: 1.4 },
  list: { listStyle: "none", margin: 0, padding: 0 },
  action: {
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "transparent",
    padding: "10px 4px",
    borderTop: "1px solid #f2f4f7",
    cursor: "pointer",
  },
  actionTitle: { display: "block", fontSize: 15, fontWeight: 800, color: "#1F4E3D" },
  actionDesc: { display: "block", marginTop: 2, fontSize: 12, color: "#667085" },
};
