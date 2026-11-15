import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MENU_ROW_ICON_SIZE } from "../menu-templates/menuPresentationUtils.js";
import { apiGet } from "../../lib/api.js";
import {
  CLAIM_RING,
  isClaimedProfile,
  MPI_LINK_TEXT,
  MPI_PATH,
  REPORT_LEAD,
  REPORT_LINK_TEXT,
  menuClaimInfo,
  menuReportMailto,
} from "../../lib/menuTrust.js";

/**
 * Menu header ⓘ = About this menu (Andre 2026-10-31; claim colors + copy 2026-11-15): ring is
 * green when the restaurant claimed its profile, red when not; the box says which, when the owner
 * last updated it, and "Report it", an email to menus@menuply.com that names the menu. Directions and the profile live on the profile (the restaurant name links there).
 * Rendered at the end of the header icon row through MenuHeaderTrailingActionContext.
 */
export default function MenuInfoButton({ restaurantId, restaurantName, city, state, menuUrl, reviewedAt }) {
  const [open, setOpen] = useState(false);
  // Claim status isn't in the menu payload: read the profile with the menu so the ring is colored
  // before the tap. null = unknown (loading or failed): gray ring, report line only.
  const [claim, setClaim] = useState(null);
  useEffect(() => {
    if (!restaurantId || claim?.restaurantId === restaurantId) return undefined;
    let cancelled = false;
    apiGet(`/public/restaurants/${encodeURIComponent(restaurantId)}`)
      .then((body) => {
        if (!cancelled && body?.restaurant) setClaim({ restaurantId, claimed: isClaimedProfile(body.restaurant) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [restaurantId, claim?.restaurantId]);
  const claimed = claim?.restaurantId === restaurantId ? claim.claimed : null;
  const ring = claimed == null ? CLAIM_RING.unknown : claimed ? CLAIM_RING.claimed : CLAIM_RING.unclaimed;
  const info = menuClaimInfo({ claimed, reviewedAt });
  const label = claimed == null ? "About this menu" : claimed ? "About this menu: claimed" : "About this menu: not claimed";
  const reportHref = menuReportMailto({ restaurantId, name: restaurantName, city, state, menuUrl, reviewedAt });

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        data-testid="menu-info-button"
        data-claim={claimed == null ? "unknown" : claimed ? "claimed" : "unclaimed"}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={{ ...styles.icon, borderColor: ring }}
      >
        <span aria-hidden="true" style={styles.glyph}>i</span>
      </button>
      {open
        ? createPortal(
            <div role="dialog" aria-modal="true" aria-label="About this menu" style={styles.backdrop} onClick={() => setOpen(false)}>
              <div style={styles.sheet} onClick={(e) => e.stopPropagation()} data-testid="menu-info-sheet">
                <div style={styles.grip} />
                <div style={styles.title}>About this menu</div>
                {info.headline ? (
                  <div style={styles.status} data-testid="menu-info-status">
                    <span aria-hidden="true" style={{ ...styles.dot, background: ring }} />
                    {info.headline}
                  </div>
                ) : null}
                {info.detail ? (
                  <p style={styles.body} data-testid="menu-info-trust">
                    {info.detail}
                  </p>
                ) : null}
                {info.prices ? (
                  <p style={styles.body} data-testid="menu-info-prices">
                    {info.prices}{" "}
                    <a href={MPI_PATH} style={styles.link} data-testid="menu-info-mpi">
                      {MPI_LINK_TEXT}
                    </a>
                    .
                  </p>
                ) : null}
                <p style={{ ...styles.body, color: "var(--mp-muted, #5b6560)" }} data-testid="menu-info-report-line">
                  {REPORT_LEAD}{" "}
                  <a href={reportHref} style={styles.link} data-testid="menu-info-report">
                    {REPORT_LINK_TEXT}
                  </a>
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
    // Ring stands out on every menu look (Andre 2026-10-30); color = claim status (2026-11-15).
    border: "2px solid",
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
  status: { display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
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
