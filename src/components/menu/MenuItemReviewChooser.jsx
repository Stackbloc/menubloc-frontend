/**
 * Menu-item comment icon chooser — written thread vs existing X review video.
 * Identity is inherited from the menu row; this sheet does not ask the user
 * to search restaurant or dish.
 */
import { createPortal } from "react-dom";
import {
  mobileDialogBackdrop,
  mobileDialogPanel,
} from "../../pages/consumer/myMenuply/mobileDialogLayout.js";

export default function MenuItemReviewChooser({
  open,
  dishName = "this dish",
  allowVideo = true,
  onWritten,
  onVideo,
  onClose,
}) {
  if (!open || typeof document === "undefined") return null;

  const titleName = String(dishName || "").trim() || "this dish";

  return createPortal(
    <div
      role="presentation"
      data-testid="menu-item-review-chooser"
      style={mobileDialogBackdrop()}
      onClick={() => onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-review-chooser-title"
        style={{ ...mobileDialogPanel("auto"), padding: "18px 16px 14px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="menu-item-review-chooser-title"
          data-testid="menu-item-review-chooser-title"
          style={styles.title}
        >
          Review {titleName}
        </h2>
        <p style={styles.lead}>This dish is already selected. Choose how to review it.</p>
        <div style={styles.actions}>
          <button
            type="button"
            data-testid="menu-item-review-written"
            style={styles.action}
            onClick={() => onWritten?.()}
          >
            <span style={styles.emoji} aria-hidden="true">
              ✍️
            </span>
            <span>
              <strong style={styles.actionTitle}>Written review</strong>
              <span style={styles.actionHint}>Comment on this menu item</span>
            </span>
          </button>
          {allowVideo ? (
            <button
              type="button"
              data-testid="menu-item-review-video"
              style={styles.action}
              onClick={() => onVideo?.()}
            >
              <span style={styles.emoji} aria-hidden="true">
                🎥
              </span>
              <span>
                <strong style={styles.actionTitle}>Video review</strong>
                <span style={styles.actionHint}>Record using the existing food-video flow</span>
              </span>
            </button>
          ) : null}
        </div>
        <button type="button" data-testid="menu-item-review-chooser-cancel" style={styles.cancel} onClick={() => onClose?.()}>
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0f172a",
  },
  lead: {
    margin: "8px 0 14px",
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.45,
  },
  actions: {
    display: "grid",
    gap: 8,
  },
  action: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #e7e5e4",
    background: "#fff",
    cursor: "pointer",
    color: "#0f172a",
  },
  emoji: {
    fontSize: 22,
    lineHeight: 1.2,
  },
  actionTitle: {
    display: "block",
    fontSize: 15,
    fontWeight: 800,
  },
  actionHint: {
    display: "block",
    marginTop: 2,
    fontSize: 12,
    fontWeight: 500,
    color: "#64748b",
  },
  cancel: {
    marginTop: 12,
    width: "100%",
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 0 4px",
    cursor: "pointer",
  },
};
