/**
 * Compact X action launcher — create content for My Menuply.
 * Profile displays; X creates.
 */

import { useEffect } from "react";
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

/** Actions shown under bottom-nav Post (X) — creation hub for My Menuply. */
export const POST_ABOUT_ACTIONS = [
  {
    id: "diner-qr",
    title: "My Diner QR",
    description: "Show your code so someone nearby can connect with you.",
    to: "/account/diner-qr",
    guestOk: false,
  },
  {
    id: "ate",
    title: "What I'm Eating",
    description: "Photo or video of what you're eating — restaurant or homemade.",
    to: "/my-menuply?compose=ate",
    guestOk: false,
  },
  {
    id: "want",
    title: "What I Want to Eat",
    description: "Cuisine, restaurant, menu item, or a food craving.",
    to: "/my-menuply?compose=want",
    guestOk: false,
  },
  {
    id: "plan",
    title: "My Eating Plans",
    description: "Schedule a future meal. Join Me and invites stay on the plan.",
    to: "/my-menuply?compose=plan",
    guestOk: false,
  },
  {
    id: "crew",
    title: "My Crews",
    description: "Create or open a crew — groups of people you eat with.",
    to: "/my-menuply?compose=crew",
    guestOk: false,
  },
  {
    id: "event",
    title: "My Events",
    description: "Create any social event — dinner, concert, game, birthday. Food optional.",
    to: "/my-menuply?compose=event",
    guestOk: false,
  },
  {
    id: "events-browse",
    title: "Find venue events",
    description: "Browse restaurant and venue events near you, then RSVP.",
    to: "/events",
    guestOk: true,
  },
  {
    id: "invite",
    title: "Invite to Eat",
    description: "Pick a restaurant, invite connects, and share the link.",
    to: "/account/invite-to-eat",
    guestOk: true,
    inviteContext: true,
  },
  {
    id: "upload-media",
    title: "Upload from library",
    description: "Add a photo or video from your library, then post What I'm Eating.",
    to: "/my-menuply?compose=ate&media=library",
    guestOk: false,
  },
  {
    id: "profile-gallery",
    title: "Profile gallery",
    description: "Add a photo or video with your camera, or upload from your library.",
    to: "/my-menuply?compose=profile-gallery",
    guestOk: false,
  },
  {
    id: "my-account",
    title: "My Account",
    description: "Account settings, security, and preferences.",
    to: "/account",
    guestOk: false,
  },
];

export default function MenuplyActionSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
          Create something for My Menuply — What I&apos;m Eating, wants, plans, crews, or events.
        </p>
        <ul style={styles.list}>
          {POST_ABOUT_ACTIONS.map((action) => (
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
