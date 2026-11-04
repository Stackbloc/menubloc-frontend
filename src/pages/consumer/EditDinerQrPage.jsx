/**
 * Edit My QR (Andre 2026-11-04): the diner's own Share My Profile message (up to 150 characters;
 * empty = the built-in one) and which photo goes with the QR: profile photo (default), another
 * photo just for the QR, or none. Route: /account/diner-qr/edit, from the Profile pills.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  getMyDinerQr,
  updateDinerQrSettings,
  uploadDinerQrPhoto,
  resolveConsumerMediaUrl,
} from "../../lib/consumerApi.js";

const PATH = "/account/diner-qr/edit";
const FALLBACK_MAX = 150;

const PHOTO_CHOICES = [
  { id: "avatar", label: "My profile photo" },
  { id: "custom", label: "Another photo" },
  { id: "none", label: "No photo" },
];

export default function EditDinerQrPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const fileRef = useRef(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [photoMode, setPhotoMode] = useState("avatar");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const apply = useCallback((data) => {
    setPayload(data);
    setMessage(data?.qr_settings?.custom_message || "");
    setPhotoMode(data?.qr_settings?.photo_mode || "avatar");
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(PATH)}`, { replace: true });
      return;
    }
    getMyDinerQr()
      .then(apply)
      .catch((err) => setError(err.message || "Unable to load your QR"))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, navigate, apply]);

  const settings = payload?.qr_settings || null;
  const max = settings?.max_message_length || FALLBACK_MAX;
  const count = Array.from(message).length;
  const customPhoto = settings?.custom_photo_url || "";
  const avatar = payload?.card?.avatar_url || "";
  const previewUrl = photoMode === "none" ? "" : photoMode === "custom" ? customPhoto : avatar;
  const previewSrc = useMemo(() => (previewUrl ? resolveConsumerMediaUrl(previewUrl) : ""), [previewUrl]);

  async function save() {
    if (photoMode === "custom" && !customPhoto) {
      setError("Add a photo for your QR first.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      apply(await updateDinerQrSettings({ message: message.trim(), photo_mode: photoMode }));
      setNotice("Saved. Your QR now uses this message and photo.");
    } catch (err) {
      setError(err.message || "Unable to save");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await uploadDinerQrPhoto(file);
      // Keep any unsaved message text; the upload already switched the QR to this photo.
      setPayload(data);
      setPhotoMode("custom");
      setNotice("Photo added to your QR.");
    } catch (err) {
      setError(err.message || "Unable to upload photo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="Edit My QR" />
      <div style={styles.page}>
        {loading || authLoading ? (
          <p style={styles.muted}>Loading…</p>
        ) : !settings ? (
          <p style={styles.error}>{error || "Your QR is unavailable right now."}</p>
        ) : (
          <>
            <section style={styles.card}>
              <h2 style={styles.h2}>Your message</h2>
              <p style={styles.muted}>People see this with your QR and when you share your link.</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(Array.from(e.target.value.replace(/\s*\n\s*/g, " ")).slice(0, max).join(""))}
                placeholder={settings.default_message}
                rows={3}
                maxLength={max}
                style={styles.textarea}
                aria-label="QR message"
                data-testid="edit-qr-message"
              />
              <div style={styles.row}>
                <span style={count >= max ? styles.countFull : styles.count} data-testid="edit-qr-count">
                  {count}/{max}
                </span>
                {message ? (
                  <button type="button" style={styles.linkBtn} onClick={() => setMessage("")}>
                    Use the built-in message
                  </button>
                ) : null}
              </div>
            </section>

            <section style={styles.card}>
              <h2 style={styles.h2}>Photo</h2>
              <div style={styles.photoRow}>
                {previewSrc ? (
                  <img src={previewSrc} alt="" style={styles.preview} />
                ) : (
                  <div style={styles.previewEmpty} aria-hidden>
                    {photoMode === "none" ? "—" : "?"}
                  </div>
                )}
                <div style={styles.choices} role="radiogroup" aria-label="QR photo">
                  {PHOTO_CHOICES.map((c) => (
                    <label key={c.id} style={styles.choice}>
                      <input
                        type="radio"
                        name="qr-photo"
                        value={c.id}
                        checked={photoMode === c.id}
                        disabled={busy}
                        onChange={() => {
                          setPhotoMode(c.id);
                          if (c.id === "custom" && !customPhoto) fileRef.current?.click();
                        }}
                        data-testid={`edit-qr-photo-${c.id}`}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>
              {photoMode === "avatar" && !avatar ? (
                <p style={styles.muted}>You don&apos;t have a profile photo yet, so your QR shows your initials.</p>
              ) : null}
              {photoMode === "custom" ? (
                <button type="button" style={styles.pill} disabled={busy} onClick={() => fileRef.current?.click()}>
                  {customPhoto ? "Change photo" : "Choose photo"}
                </button>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={onPhoto}
              />
            </section>

            {error ? <p style={styles.error}>{error}</p> : null}
            {notice ? <p style={styles.notice}>{notice}</p> : null}

            <div style={styles.actions}>
              <button type="button" style={styles.primary} disabled={busy} onClick={save} data-testid="edit-qr-save">
                {busy ? "Saving…" : "Save"}
              </button>
              <Link to="/account/diner-qr" style={styles.pill}>
                See my QR
              </Link>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}

const GREEN = "#2db825";
const GREEN_DEEP = "#1a7a1e";

const pillBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "9px 18px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
};

const styles = {
  page: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "16px 16px 96px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
    display: "grid",
    gap: 14,
  },
  card: { border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 16, display: "grid", gap: 10 },
  h2: { margin: 0, fontSize: 16, color: "#0f172a" },
  muted: { margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.4 },
  error: { margin: 0, color: "#b91c1c", fontSize: 14, fontWeight: 600 },
  notice: { margin: 0, color: "#166534", fontSize: 14, fontWeight: 600 },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    fontFamily: "inherit",
    resize: "vertical",
  },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  count: { fontSize: 12, color: "#64748b" },
  countFull: { fontSize: 12, color: "#b91c1c", fontWeight: 700 },
  linkBtn: { border: "none", background: "none", color: GREEN_DEEP, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 },
  photoRow: { display: "flex", alignItems: "center", gap: 14 },
  preview: { width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${GREEN}`, flexShrink: 0 },
  previewEmpty: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "2px dashed #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontWeight: 800,
    flexShrink: 0,
  },
  choices: { display: "grid", gap: 8 },
  choice: { display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: "#0f172a", fontWeight: 600 },
  actions: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" },
  primary: { ...pillBase, border: "none", background: `linear-gradient(90deg, ${GREEN_DEEP}, ${GREEN})`, color: "#fff" },
  pill: { ...pillBase, justifySelf: "start", border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a" },
};
