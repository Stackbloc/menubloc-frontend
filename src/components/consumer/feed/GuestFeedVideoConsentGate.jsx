/**
 * Mandatory Terms + Privacy notice before guest Feed video publish.
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  GUEST_PUBLICATION_CONSENT_LABEL,
  GUEST_PUBLICATION_NOTICE,
} from "../../../lib/legalConsent.js";
import { LEGAL_VERSIONS } from "../../../content/legal.js";

export default function GuestFeedVideoConsentGate({
  open,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const [checked, setChecked] = useState(false);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      data-testid="guest-feed-video-consent-gate"
      style={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel?.();
      }}
    >
      <div role="dialog" aria-modal="true" style={styles.sheet}>
        <h2 style={styles.title}>Before you post</h2>
        <p style={styles.notice}>{GUEST_PUBLICATION_NOTICE}</p>
        <p style={styles.links}>
          <Link to="/terms" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Terms of Use
          </Link>
          <span style={styles.sep}> · </span>
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Privacy Policy
          </Link>
        </p>
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={checked}
            disabled={busy}
            onChange={(event) => setChecked(event.target.checked)}
            data-testid="guest-feed-video-consent-checkbox"
          />
          <span>{GUEST_PUBLICATION_CONSENT_LABEL}</span>
        </label>
        <div style={styles.actions}>
          <button type="button" style={styles.cancel} disabled={busy} onClick={() => onCancel?.()}>
            Cancel
          </button>
          <button
            type="button"
            style={{ ...styles.confirm, opacity: checked && !busy ? 1 : 0.45 }}
            disabled={!checked || busy}
            data-testid="guest-feed-video-consent-confirm"
            onClick={() => onConfirm?.()}
          >
            {busy ? "Posting…" : "Publish"}
          </button>
        </div>
        <p style={styles.meta} data-terms-version={LEGAL_VERSIONS.consumerTerms}>
          Posted videos appear as Guest Diner until you create an account.
        </p>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1300,
    background: "rgba(0,0,0,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    width: "min(420px, 100%)",
    background: "#101512",
    color: "#fff",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "18px 18px 14px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  title: { margin: "0 0 8px", fontSize: 18, fontWeight: 900 },
  notice: { margin: "0 0 10px", fontSize: 14, lineHeight: 1.45, color: "rgba(255,255,255,0.82)" },
  links: { margin: "0 0 14px", fontSize: 13 },
  link: { color: "#5eead4", fontWeight: 700, textDecoration: "none" },
  sep: { color: "rgba(255,255,255,0.45)" },
  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 13,
    lineHeight: 1.4,
    cursor: "pointer",
    marginBottom: 16,
  },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end" },
  cancel: {
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  confirm: {
    border: 0,
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 800,
    cursor: "pointer",
  },
  meta: { margin: "12px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 },
};
