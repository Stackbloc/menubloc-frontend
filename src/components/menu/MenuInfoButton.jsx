import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MENU_ROW_ICON_SIZE } from "../menu-templates/menuPresentationUtils.js";
import { apiGet } from "../../lib/api.js";
import { isUnclaimedProfile, menuReportMailto, menuTrustText } from "../../lib/menuTrust.js";

/**
 * Menu header ⓘ = About this menu (Andre 2026-10-31): how fresh the menu is (owner review date,
 * or "not claimed or verified") and "submit a report", an email to menus@menuply.com that names
 * the menu. Directions and the profile live on the profile (the restaurant name links there).
 * Rendered at the end of the header icon row through MenuHeaderTrailingActionContext.
 */
export default function MenuInfoButton({ restaurantId, restaurantName, city, state, menuUrl, reviewedAt, franchiseStore = false }) {
  const [open, setOpen] = useState(false);
  // Claim status isn't in the menu payload: read the profile once the box opens.
  const [claim, setClaim] = useState(null);
  useEffect(() => {
    if (!open || !restaurantId || claim?.restaurantId === restaurantId) return undefined;
    let cancelled = false;
    apiGet(`/public/restaurants/${encodeURIComponent(restaurantId)}`)
      .then((body) => {
        if (!cancelled) setClaim({ restaurantId, unclaimed: isUnclaimedProfile(body?.restaurant) });
      })
      .catch(() => {
        // Unknown claim status: the box shows the disclaimer only.
      });
    return () => {
      cancelled = true;
    };
  }, [open, restaurantId, claim?.restaurantId]);
  const unclaimed = claim?.restaurantId === restaurantId ? claim.unclaimed : false;
  const reportHref = menuReportMailto({ restaurantId, name: restaurantName, city, state, menuUrl, reviewedAt });

  return (
    <>
      <button
        type="button"
        aria-label="About this menu"
        title="About this menu"
        data-testid="menu-info-button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={styles.icon}
      >
        <span aria-hidden="true" style={styles.glyph}>i</span>
      </button>
      {open
        ? createPortal(
            <div role="dialog" aria-modal="true" aria-label="About this menu" style={styles.backdrop} onClick={() => setOpen(false)}>
              <div style={styles.sheet} onClick={(e) => e.stopPropagation()} data-testid="menu-info-sheet">
                <div style={styles.grip} />
                <div style={styles.title}>About this menu</div>
                <p style={styles.body} data-testid="menu-info-trust">
                  {menuTrustText({ reviewedAt, unclaimed, franchiseStore })}
                </p>
                <p style={styles.body}>
                  If you have any concerns about the menu content, please{" "}
                  <a href={reportHref} style={styles.link} data-testid="menu-info-report">
                    submit a report
                  </a>
                  .
                </p>
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
    // Red ring so the ⓘ stands out on every menu look (Andre 2026-10-30).
    border: "2px solid #dc2626",
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
    cursor: "pointer",
    flexShrink: 0,
  },
  glyph: { fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 700, fontSize: 14, lineHeight: 1 },
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 2200,
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
  title: { fontSize: 17, fontWeight: 700, marginBottom: 12 },
  body: { margin: "0 0 10px", fontSize: 15, lineHeight: 1.5 },
  link: { color: "var(--mp-accent, #0f7a24)", fontWeight: 700, textDecoration: "underline" },
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
