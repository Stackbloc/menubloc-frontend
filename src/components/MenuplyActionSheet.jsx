/**
 * Compact X action launcher — create content for My Menuply.
 * Profile displays; X creates. Grouped to reduce cognitive load.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";

function inviteToEatPath(pathname) {
  const parts = String(pathname || "").split("/").filter(Boolean);
  const menuIdx = parts.findIndex((part) => part === "menu-items" || part === "menu-item-info");
  if (menuIdx >= 0 && parts[menuIdx + 1]) {
    const item = decodeURIComponent(parts[menuIdx + 1]);
    const restIdx = parts.findIndex((part) => part === "restaurants");
    const rest = restIdx >= 0
      ? parts.slice(restIdx + 1).filter((part) => !["menu", "billboard", "qr-codes", "display"].includes(part))
      : [];
    const slug = rest[rest.length - 1];
    const qs = new URLSearchParams({ menu_item_id: item });
    if (slug) qs.set("restaurant_id", slug);
    return `/account/invite-to-eat?${qs.toString()}`;
  }
  const restIdx = parts.findIndex((part) => part === "restaurants");
  if (restIdx >= 0 && !["operator", "owner", "distributor"].includes(parts[0])) {
    const rest = parts
      .slice(restIdx + 1)
      .filter((part) => !["menu", "billboard", "qr-codes", "display"].includes(part));
    const slug = rest[rest.length - 1];
    if (slug) return `/account/invite-to-eat?restaurant_id=${encodeURIComponent(slug)}`;
  }
  return "/account/invite-to-eat";
}

const ACTION_DEFS = {
  "diner-qr": {
    id: "diner-qr",
    title: "My Diner QR",
    description: "Show your code so someone nearby can connect with you.",
    to: "/account/diner-qr",
    guestOk: false,
  },
  ate: {
    id: "ate",
    title: "What I'm Eating",
    description: "Camera — photo or video of what you're eating now.",
    to: "/my-menuply?compose=ate",
    guestOk: false,
  },
  "upload-media": {
    id: "upload-media",
    title: "Upload media",
    description: "Choose a photo or video from your phone library, then post.",
    to: "/my-menuply?compose=ate&media=library",
    guestOk: false,
  },
  want: {
    id: "want",
    title: "What I Want to Eat",
    description: "Cuisine, restaurant, menu item, or a food craving.",
    to: "/my-menuply?compose=want",
    guestOk: false,
  },
  "profile-gallery": {
    id: "profile-gallery",
    title: "Profile gallery",
    description: "Add a photo or video with your camera.",
    to: "/my-menuply?compose=profile-gallery",
    guestOk: false,
  },
  plan: {
    id: "plan",
    title: "My Eating Plans",
    description: "Schedule a future meal. Join Me stays on the plan.",
    to: "/my-menuply?compose=plan",
    guestOk: false,
  },
  crew: {
    id: "crew",
    title: "My Crews",
    description: "Create a crew — people you eat and hang out with.",
    to: "/my-menuply?compose=crew",
    guestOk: false,
  },
  event: {
    id: "event",
    title: "My Events",
    description: "Create a social event — dinner, concert, game, birthday.",
    to: "/my-menuply?compose=event",
    guestOk: false,
  },
  "invite-crew": {
    id: "invite-crew",
    title: "Invite to crew",
    description: "Pick a crew and share its join link.",
    to: "/my-menuply?compose=invite-crew",
    guestOk: false,
  },
  "invite-event": {
    id: "invite-event",
    title: "Invite to event",
    description: "Pick an event and share Join Me with anyone.",
    to: "/my-menuply?compose=invite-event",
    guestOk: false,
  },
  invite: {
    id: "invite",
    title: "Invite to Eat",
    description: "Pick a restaurant, invite connects, and share the link.",
    to: "/account/invite-to-eat",
    guestOk: true,
    inviteContext: true,
  },
  "events-browse": {
    id: "events-browse",
    title: "Find venue events",
    description: "Browse restaurant and venue events near you, then RSVP.",
    to: "/events",
    guestOk: true,
  },
  "search-profiles": {
    id: "search-profiles",
    title: "Search profiles",
    description: "Find diners by name, phone, or email — then connect.",
    to: "/account/find-diners",
    guestOk: false,
  },
  "my-account": {
    id: "my-account",
    title: "My Account",
    description: "Account settings, security, and preferences.",
    to: "/account",
    guestOk: false,
  },
};

/** Grouped sections for the X sheet — flat list kept for contract tests. */
export const POST_ABOUT_SECTIONS = [
  {
    id: "eating",
    title: "Eating",
    defaultOpen: true,
    actionIds: ["ate", "upload-media", "want", "profile-gallery"],
  },
  {
    id: "plan-invite",
    title: "Plan & Invite",
    defaultOpen: true,
    actionIds: ["plan", "crew", "event", "invite-crew", "invite-event", "invite"],
  },
  {
    id: "discover",
    title: "Discover",
    defaultOpen: false,
    actionIds: ["search-profiles", "events-browse", "diner-qr"],
  },
  {
    id: "account",
    title: "Account",
    defaultOpen: false,
    actionIds: ["my-account"],
  },
];

export const POST_ABOUT_ACTIONS = POST_ABOUT_SECTIONS.flatMap((section) =>
  section.actionIds.map((id) => ACTION_DEFS[id]).filter(Boolean)
);

function SectionBlock({ section, open, onToggle, onGo }) {
  const actions = section.actionIds.map((id) => ACTION_DEFS[id]).filter(Boolean);
  return (
    <section style={styles.section} data-testid={`x-section-${section.id}`}>
      <button
        type="button"
        style={styles.sectionHead}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span style={styles.sectionTitle}>{section.title}</span>
        <span style={styles.sectionChevron} aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <ul style={styles.list}>
          {actions.map((action) => (
            <li key={action.id}>
              <button type="button" onClick={() => onGo(action)} style={styles.action}>
                <span style={styles.actionTitle}>{action.title}</span>
                <span style={styles.actionDesc}>{action.description}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function MenuplyActionSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated } = useConsumer();
  const initialOpen = useMemo(
    () =>
      Object.fromEntries(
        POST_ABOUT_SECTIONS.map((section) => [section.id, section.defaultOpen !== false])
      ),
    []
  );
  const [sectionOpen, setSectionOpen] = useState(initialOpen);

  useEffect(() => {
    if (!open) return undefined;
    setSectionOpen(initialOpen);
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
  }, [open, onClose, initialOpen]);

  if (!open || typeof document === "undefined") return null;

  function go(action) {
    onClose();
    let to = action.to;
    if (action.inviteContext) to = inviteToEatPath(pathname);
    if (!action.guestOk && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(to)}`);
      return;
    }
    navigate(to);
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
            Create
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.close}>
            Close
          </button>
        </div>
        <p style={styles.lead}>
          Grouped by what you&apos;re doing — eating, planning, inviting, or browsing.
        </p>
        {POST_ABOUT_SECTIONS.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            open={sectionOpen[section.id] !== false}
            onToggle={() =>
              setSectionOpen((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
            }
            onGo={go}
          />
        ))}
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
    maxHeight: "min(82vh, 640px)",
    overflowY: "auto",
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
  section: { marginBottom: 4 },
  sectionHead: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    border: 0,
    background: "rgba(31, 78, 61, 0.06)",
    borderRadius: 10,
    padding: "8px 10px",
    marginTop: 8,
    cursor: "pointer",
    textAlign: "left",
  },
  sectionTitle: { fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", color: "#1F4E3D", textTransform: "uppercase" },
  sectionChevron: { fontSize: 16, fontWeight: 700, color: "#667085", lineHeight: 1 },
  list: { listStyle: "none", margin: 0, padding: "0 0 4px" },
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
