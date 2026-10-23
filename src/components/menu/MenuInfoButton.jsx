import { useState } from "react";
import { createPortal } from "react-dom";
import MenuAddressLines from "../menu-templates/MenuAddressLines.jsx";
import { MENU_ROW_ICON_SIZE } from "../menu-templates/menuPresentationUtils.js";

/**
 * Compact menu header ⓘ (W4, Andre 2026-10-23): the restaurant's address, directions, phone and
 * website live in this sheet instead of under the name. Rendered at the end of the header icon
 * row through MenuHeaderTrailingActionContext.
 */
function formatPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return String(raw || "").trim();
}

function websiteHref(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export default function MenuInfoButton({
  restaurantName,
  addressLine1,
  addressLine2,
  addressLine,
  directionsHref,
  phone,
  website,
}) {
  const [open, setOpen] = useState(false);
  const phoneLabel = formatPhone(phone);
  const site = websiteHref(website);
  const hasAddress = Boolean(String(addressLine1 || addressLine2 || addressLine || "").trim());

  return (
    <>
      <button
        type="button"
        aria-label="Restaurant info"
        title="Restaurant info"
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
            <div role="dialog" aria-modal="true" aria-label="Restaurant info" style={styles.backdrop} onClick={() => setOpen(false)}>
              <div style={styles.sheet} onClick={(e) => e.stopPropagation()} data-testid="menu-info-sheet">
                <div style={styles.grip} />
                <div style={styles.title}>{restaurantName}</div>
                {hasAddress ? (
                  <div style={styles.row}>
                    <MenuAddressLines addressLine1={addressLine1} addressLine2={addressLine2} addressLine={addressLine} />
                    {directionsHref ? (
                      <a href={directionsHref} target="_blank" rel="noreferrer" style={styles.link}>
                        Get directions
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {phoneLabel ? (
                  <div style={styles.row}>
                    <a href={`tel:${String(phone).replace(/[^\d+]/g, "")}`} style={styles.link}>
                      {phoneLabel}
                    </a>
                  </div>
                ) : null}
                {site ? (
                  <div style={styles.row}>
                    <a href={site} target="_blank" rel="noreferrer" style={styles.link}>
                      Website
                    </a>
                  </div>
                ) : null}
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
  row: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "10px 0",
    borderTop: "1px solid var(--mp-border, #e1e6e1)",
    fontSize: 15,
  },
  link: { color: "var(--mp-accent, #0f7a24)", fontWeight: 600, textDecoration: "none" },
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
