/** Shared visual tokens for owner + operator Stripe-style admin shells. */

export const ADMIN_CONSOLE = {
  accent: "#22C55E",
  accentDark: "#16A34A",
  accentSoft: "rgba(34, 197, 94, 0.12)",
  ink: "#0B0F0C",
  muted: "#667085",
  line: "#E5E7EB",
  softLine: "#F0F1F3",
  page: "#F6F7F9",
  panel: "#ffffff",
  sidebar: "#F6F7F9",
  sidebarW: 232,
  knowledgeW: 360,
};

export const KB_SESSION_KEYS = {
  operator: "menuply.operator.kbPanelOpen",
  owner: "menuply.owner.kbPanelOpen",
};

export function readKbPanelOpen(storageKey) {
  try {
    return sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

export function writeKbPanelOpen(storageKey, open) {
  try {
    sessionStorage.setItem(storageKey, open ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}
