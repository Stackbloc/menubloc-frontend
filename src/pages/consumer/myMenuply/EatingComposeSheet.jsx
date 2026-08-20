/**
 * Input surface for Eating compose — kept off the presentation feed.
 */

import EatingCompose from "./EatingCompose.jsx";

export default function EatingComposeSheet({
  open,
  onClose,
  defaultCategory = "ate",
  busy = false,
  onSubmit,
  onPlanSchedule,
  followed = [],
}) {
  if (!open) return null;

  async function handleSubmit(payload) {
    await onSubmit?.(payload);
    onClose?.();
  }

  function handlePlanSchedule(payload) {
    onPlanSchedule?.(payload);
    onClose?.();
  }

  return (
    <div
      role="presentation"
      style={styles.backdrop}
      data-testid="eating-compose-sheet"
      onClick={() => onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log food"
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <p style={styles.title}>Log food</p>
          <button type="button" style={styles.close} onClick={() => onClose?.()} aria-label="Close">
            ✕
          </button>
        </div>
        <p style={styles.lead}>
          Add as much or as little as you want — photo, restaurant, homemade, or just a note.
        </p>
        <EatingCompose
          busy={busy}
          defaultCategory={defaultCategory}
          onSubmit={handleSubmit}
          onPlanSchedule={handlePlanSchedule}
          followed={followed}
          inSheet
        />
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    zIndex: 1100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "20px 20px 14px 14px",
    padding: "16px 16px 20px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
    maxHeight: "min(88vh, 640px)",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0f172a",
  },
  lead: {
    margin: "0 0 14px",
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.45,
  },
  close: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    lineHeight: 1,
    color: "#3C3C43",
    cursor: "pointer",
    flexShrink: 0,
  },
};
