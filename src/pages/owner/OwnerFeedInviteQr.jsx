/**
 * Owner Growth — Feed invite QR with editable poster copy.
 * Route: /owner/feed-invite-qr
 * Scan destination locked to https://menuply.com/feed
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerFeedInviteQr,
  ownerFeedInviteQrCodeUrl,
  ownerFeedInviteQrImageUrl,
  resetOwnerFeedInviteQrCopy,
  saveOwnerFeedInviteQrCopy,
} from "../../lib/ownerApi.js";

const MENUPLY_X_SRC = "/menuply-qr-logo-x.svg";
const LOCKED_DESTINATION = "https://menuply.com/feed";

const EMPTY_COPY = {
  headline: "",
  body: "",
  tip: "",
  cta: "",
};

function Field({ label, value, onChange, maxLength, multiline = false, rows = 3 }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>
        {label}
        {maxLength ? (
          <span style={styles.charCount}>
            {String(value || "").length}/{maxLength}
          </span>
        ) : null}
      </span>
      <Tag
        value={value}
        maxLength={maxLength || undefined}
        rows={multiline ? rows : undefined}
        onChange={(e) => onChange(e.target.value)}
        style={multiline ? styles.textarea : styles.input}
      />
    </label>
  );
}

export default function OwnerFeedInviteQr() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [destinationUrl, setDestinationUrl] = useState(LOCKED_DESTINATION);
  const [limits, setLimits] = useState({ headline: 80, body: 320, tip: 200, cta: 60 });
  const [defaults, setDefaults] = useState(EMPTY_COPY);
  const [draft, setDraft] = useState(EMPTY_COPY);
  const [saved, setSaved] = useState(EMPTY_COPY);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [imageBust, setImageBust] = useState("");
  const [qrBlobUrl, setQrBlobUrl] = useState("");
  const [posterBlobUrl, setPosterBlobUrl] = useState("");
  const [qrImageError, setQrImageError] = useState("");
  const [posterImageError, setPosterImageError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getOwnerFeedInviteQr();
      const copy = data?.copy || EMPTY_COPY;
      setDestinationUrl(data?.destination_url || LOCKED_DESTINATION);
      setLimits(data?.limits || { headline: 80, body: 320, tip: 200, cta: 60 });
      setDefaults(data?.defaults || copy);
      setDraft({ ...copy });
      setSaved({ ...copy });
      setUpdatedAt(data?.updated_at || null);
      setImageBust(data?.updated_at || String(Date.now()));
    } catch (err) {
      setError(err.message || "Unable to load Feed invite QR");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading) return undefined;
    let objectUrl = null;
    let cancelled = false;
    setQrImageError("");
    fetch(ownerFeedInviteQrCodeUrl(), { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`QR preview failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setQrBlobUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          setQrBlobUrl("");
          setQrImageError(err?.message || "Could not load QR code image");
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loading]);

  useEffect(() => {
    if (loading) return undefined;
    let objectUrl = null;
    let cancelled = false;
    setPosterImageError("");
    const url = ownerFeedInviteQrImageUrl(imageBust || "preview");
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Poster preview failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPosterBlobUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          setPosterBlobUrl("");
          setPosterImageError(err?.message || "Could not load poster image");
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loading, imageBust]);

  const dirty = useMemo(
    () =>
      draft.headline !== saved.headline ||
      draft.body !== saved.body ||
      draft.tip !== saved.tip ||
      draft.cta !== saved.cta,
    [draft, saved]
  );

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setNotice("");
  }

  async function handleSave() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await saveOwnerFeedInviteQrCopy(draft);
      const copy = data?.copy || draft;
      setDraft({ ...copy });
      setSaved({ ...copy });
      setUpdatedAt(data?.updated_at || null);
      setImageBust(data?.updated_at || String(Date.now()));
      setNotice("Saved. Download uses the saved copy.");
    } catch (err) {
      setError(err.message || "Unable to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!window.confirm("Reset poster copy to Menuply defaults?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await resetOwnerFeedInviteQrCopy();
      const copy = data?.copy || defaults;
      setDraft({ ...copy });
      setSaved({ ...copy });
      setDefaults(data?.defaults || copy);
      setUpdatedAt(data?.updated_at || null);
      setImageBust(data?.updated_at || String(Date.now()));
      setNotice("Restored defaults and saved.");
    } catch (err) {
      setError(err.message || "Unable to reset");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    setError("");
    try {
      const url = ownerFeedInviteQrImageUrl(imageBust || Date.now());
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "menuply-feed-invite-qr.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err.message || "Unable to download PNG");
    } finally {
      setBusy(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <OwnerLayout
      title="Feed Invite QR"
      actions={
        <div style={styles.actionsRow}>
          <button type="button" style={styles.secondaryBtn} disabled={busy || loading} onClick={handleReset}>
            Reset defaults
          </button>
          <button type="button" style={styles.secondaryBtn} disabled={busy || loading} onClick={handleDownload}>
            Download PNG
          </button>
          <button type="button" style={styles.secondaryBtn} disabled={busy || loading} onClick={handlePrint}>
            Print
          </button>
          <button
            type="button"
            style={styles.primaryBtn}
            disabled={busy || loading || !dirty}
            onClick={handleSave}
          >
            {busy ? "Saving…" : "Save copy"}
          </button>
        </div>
      }
    >
      <div style={styles.lead}>
        Printable growth QR for strangers. Scan opens{" "}
        <code style={styles.code}>{destinationUrl}</code> so they can create food videos on Feed.
        Edit the poster text below — destination stays locked to menuply.com.
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}
      {notice ? <div style={styles.notice}>{notice}</div> : null}

      {loading ? (
        <PageCard style={{ padding: 24 }}>
          <div style={{ color: OWNER_COLORS.muted }}>Loading Feed invite QR…</div>
        </PageCard>
      ) : (
        <div style={styles.grid} className="owner-feed-invite-grid">
          <PageCard style={{ padding: 24 }} className="owner-feed-invite-preview">
            <SectionTitle
              title="Live preview"
              subtitle={
                dirty
                  ? "Preview shows draft text. Save before downloading the poster PNG."
                  : updatedAt
                    ? `Last saved ${new Date(updatedAt).toLocaleString()}`
                    : "Using default copy"
              }
            />
            <div style={styles.stage}>
              <article style={styles.card} aria-label="Feed invite QR card preview">
                <div style={styles.brandBlock}>
                  <img src={MENUPLY_X_SRC} alt="" width={52} height={52} style={styles.brandX} />
                  <div style={styles.brandWord}>MENUPLY</div>
                </div>
                <h2 style={styles.headline}>{draft.headline || "Headline"}</h2>
                <p style={styles.body}>{draft.body || "Body"}</p>
                <p style={styles.tip}>{draft.tip || "Tip"}</p>
                <div style={styles.qrFrame}>
                  {qrBlobUrl ? (
                    <img
                      src={qrBlobUrl}
                      alt="QR code for menuply.com/feed"
                      style={styles.qrImage}
                      width={220}
                      height={220}
                    />
                  ) : (
                    <div style={styles.qrPlaceholder}>
                      {qrImageError || "Loading QR code…"}
                    </div>
                  )}
                </div>
                <div style={styles.ctaPill}>
                  <span>{draft.cta || "CTA"}</span>
                </div>
                <div style={styles.destHint}>{destinationUrl}</div>
              </article>
            </div>
            <div style={styles.posterBlock}>
              <div style={styles.posterLabel}>Saved downloadable poster</div>
              {posterBlobUrl ? (
                <img
                  src={posterBlobUrl}
                  alt="Saved Feed invite QR poster"
                  style={styles.posterThumb}
                />
              ) : (
                <div style={styles.posterPlaceholder}>
                  {posterImageError || "Loading poster…"}
                </div>
              )}
            </div>
            <p style={styles.previewNote}>
              Card chrome above follows your draft. Download PNG uses the last{" "}
              <strong>saved</strong> copy.
            </p>
          </PageCard>

          <PageCard style={{ padding: 24 }} className="owner-feed-invite-editor">
            <SectionTitle
              title="Editable copy"
              subtitle="These fields print on the poster around the QR. They are not encoded inside the QR."
            />
            <Field
              label="Headline"
              value={draft.headline}
              maxLength={limits.headline}
              onChange={(v) => updateField("headline", v)}
            />
            <Field
              label="Body (what Menuply is)"
              value={draft.body}
              maxLength={limits.body}
              multiline
              rows={4}
              onChange={(v) => updateField("body", v)}
            />
            <Field
              label="Tip (text invites / connect friends)"
              value={draft.tip}
              maxLength={limits.tip}
              multiline
              rows={3}
              onChange={(v) => updateField("tip", v)}
            />
            <Field
              label="CTA pill"
              value={draft.cta}
              maxLength={limits.cta}
              onChange={(v) => updateField("cta", v)}
            />
            <div style={styles.lockedBox}>
              <div style={styles.lockedLabel}>Scan opens (locked)</div>
              <code style={styles.code}>{destinationUrl}</code>
            </div>
          </PageCard>
        </div>
      )}

      <style>{`
        @media print {
          .admin-console-shell nav,
          .admin-console-shell aside,
          .owner-feed-invite-editor,
          .owner-feed-invite-grid > *:last-child {
            display: none !important;
          }
          .owner-feed-invite-preview {
            box-shadow: none !important;
            border: none !important;
          }
        }
        @media (max-width: 960px) {
          .owner-feed-invite-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </OwnerLayout>
  );
}

const styles = {
  lead: {
    marginBottom: 16,
    color: OWNER_COLORS.muted,
    fontSize: 14,
    lineHeight: 1.5,
  },
  code: {
    fontSize: 12,
    background: "#eef1f0",
    padding: "2px 6px",
    borderRadius: 6,
  },
  actionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
  },
  primaryBtn: {
    border: "none",
    background: OWNER_COLORS.accent,
    color: "#fff",
    fontWeight: 700,
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
  },
  secondaryBtn: {
    border: `1px solid ${OWNER_COLORS.line}`,
    background: "#fff",
    color: OWNER_COLORS.ink,
    fontWeight: 600,
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
  },
  error: {
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: 13,
  },
  notice: {
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#ecfdf5",
    color: "#065f46",
    fontSize: 13,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1fr)",
    gap: 16,
    alignItems: "start",
  },
  stage: {
    display: "flex",
    justifyContent: "center",
    padding: "8px 0 4px",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#f9fafb",
    borderRadius: 18,
    border: `1px solid ${OWNER_COLORS.line}`,
    padding: "28px 22px 22px",
    textAlign: "center",
  },
  brandBlock: {
    marginBottom: 14,
  },
  brandX: {
    display: "block",
    margin: "0 auto 8px",
  },
  brandWord: {
    fontWeight: 800,
    letterSpacing: 4,
    fontSize: 18,
    color: OWNER_COLORS.ink,
  },
  headline: {
    margin: "0 0 10px",
    fontSize: 20,
    lineHeight: 1.25,
    color: OWNER_COLORS.ink,
  },
  body: {
    margin: "0 0 10px",
    fontSize: 14,
    lineHeight: 1.45,
    color: OWNER_COLORS.muted,
  },
  tip: {
    margin: "0 0 16px",
    fontSize: 13,
    lineHeight: 1.4,
    fontStyle: "italic",
    color: OWNER_COLORS.muted,
  },
  qrFrame: {
    borderRadius: 16,
    overflow: "hidden",
    border: `3px solid ${OWNER_COLORS.accent}`,
    background: "#fff",
    marginBottom: 14,
    display: "inline-block",
    padding: 10,
  },
  qrImage: {
    display: "block",
    width: 220,
    height: 220,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    boxSizing: "border-box",
    fontSize: 12,
    color: OWNER_COLORS.muted,
    textAlign: "center",
  },
  posterBlock: {
    marginTop: 16,
    borderTop: `1px solid ${OWNER_COLORS.line}`,
    paddingTop: 14,
  },
  posterLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: OWNER_COLORS.muted,
    marginBottom: 8,
  },
  posterThumb: {
    display: "block",
    width: "100%",
    maxWidth: 280,
    height: "auto",
    borderRadius: 12,
    border: `1px solid ${OWNER_COLORS.line}`,
  },
  posterPlaceholder: {
    width: "100%",
    maxWidth: 280,
    minHeight: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    boxSizing: "border-box",
    borderRadius: 12,
    border: `1px dashed ${OWNER_COLORS.line}`,
    fontSize: 12,
    color: OWNER_COLORS.muted,
    textAlign: "center",
  },
  ctaPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "10px 18px",
    borderRadius: 999,
    background: OWNER_COLORS.accent,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 10,
  },
  destHint: {
    fontSize: 11,
    color: "#9ca3af",
  },
  previewNote: {
    margin: "12px 0 0",
    fontSize: 12,
    color: OWNER_COLORS.muted,
    lineHeight: 1.4,
  },
  field: {
    display: "block",
    marginBottom: 14,
  },
  fieldLabel: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 700,
    color: OWNER_COLORS.ink,
  },
  charCount: {
    fontWeight: 500,
    color: OWNER_COLORS.muted,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${OWNER_COLORS.line}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${OWNER_COLORS.line}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    resize: "vertical",
    fontFamily: "inherit",
  },
  lockedBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    background: "#eef1f0",
    border: `1px dashed ${OWNER_COLORS.line}`,
  },
  lockedLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: OWNER_COLORS.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
};
