import { useState } from "react";
import { createPortal } from "react-dom";
import { MENU_ROW_ICON_SIZE } from "../menu-templates/menuPresentationUtils.js";

/**
 * Dish rows show three icons (Wish List · Like · Invite) and put the rest behind "…"
 * (Andre, 2026-10-23: less to take in per row; same on web and app). `items` are the existing
 * action buttons (Share, Comment with a video, …) shown with a label in a small sheet. Picking an
 * action hides the sheet but keeps it mounted, so the action's own window (share, recorder) shows
 * on top and keeps its state.
 */
export default function DishMoreActions({ dishName = "", items = [] }) {
  // "closed" (never opened) → "open" → "hidden" after an action is picked (still mounted).
  const [mode, setMode] = useState("closed");
  const setOpen = (on) => setMode(on ? "open" : "hidden");
  const visible = items.filter((it) => it && it.node);
  if (!visible.length) return null;

  return (
    <>
      <button
        type="button"
        aria-label={`More actions for ${dishName || "this dish"}`}
        title="More"
        data-testid="dish-more-actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={styles.icon}
      >
        <span aria-hidden="true" style={styles.dots}>…</span>
      </button>
      {mode !== "closed"
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`More actions for ${dishName || "this dish"}`}
              style={mode === "open" ? styles.backdrop : { display: "none" }}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            >
              <div style={styles.sheet} onClick={(e) => e.stopPropagation()} data-testid="dish-more-actions-sheet">
                <div style={styles.grip} />
                {dishName ? <div style={styles.title}>{dishName}</div> : null}
                {visible.map((it) => (
                  <div key={it.key || it.label} style={styles.row} onClickCapture={() => setMode("hidden")}>
                    {it.node}
                    <span
                      style={styles.label}
                      onClick={(e) => e.currentTarget.parentElement?.querySelector("button, a")?.click()}
                    >
                      {it.label}
                    </span>
                  </div>
                ))}
                <button type="button" style={styles.close} onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

const styles = {
  icon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: MENU_ROW_ICON_SIZE,
    height: MENU_ROW_ICON_SIZE,
    minWidth: MENU_ROW_ICON_SIZE,
    padding: 0,
    borderRadius: "50%",
    border: "1px solid rgba(55,65,81,0.22)",
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
    cursor: "pointer",
    flexShrink: 0,
  },
  dots: { fontSize: 15, fontWeight: 800, lineHeight: 1, transform: "translateY(-3px)" },
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 2100,
    background: "var(--mp-scrim, rgba(17,22,19,0.45))",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    background: "var(--mp-surface, #fff)",
    color: "var(--mp-ink, #111613)",
    borderRadius: "16px 16px 0 0",
    padding: "10px 20px 24px",
    boxSizing: "border-box",
  },
  grip: { width: 40, height: 4, borderRadius: 2, background: "var(--mp-border, #e1e6e1)", margin: "0 auto 14px" },
  title: { fontSize: 17, fontWeight: 700, marginBottom: 6 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderTop: "1px solid var(--mp-border, #e1e6e1)",
    fontSize: 15,
  },
  label: { fontWeight: 600 },
  close: {
    marginTop: 14,
    width: "100%",
    padding: "12px 0",
    borderRadius: 10,
    border: "1px solid var(--mp-border, #e1e6e1)",
    background: "var(--mp-surface-alt, #f5f7f4)",
    color: "var(--mp-ink, #111613)",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
  },
};
