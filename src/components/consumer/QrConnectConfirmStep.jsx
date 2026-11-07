/**
 * Onboarding: first screen for a diner who signed up from someone's Diner QR (Andre 2026-11-07).
 * "Confirm <name>'s connection request?" — Confirm sends the connect request (the QR owner still
 * accepts it under Pending connect requests); Not now sends nothing. Either way the invite is
 * forgotten and onboarding continues.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  connectViaDinerQr,
  fetchPublicDinerQr,
  resolveConsumerMediaUrl,
} from "../../lib/consumerApi.js";
import { formatDinerInviteName } from "../../lib/dinerQrShare.js";
import { resolveConsumerConnectErrorMessage } from "../../lib/consumerAuthErrors.js";
import { clearPendingQrConnect } from "../../lib/pendingQrConnect.js";

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function QrConnectConfirmStep({ token, onDone }) {
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPublicDinerQr(token)
      .then((data) => {
        if (!cancelled) setProjection(data);
      })
      .catch(() => {
        // QR turned off or gone — nothing to confirm.
        if (cancelled) return;
        clearPendingQrConnect(token);
        onDone();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, onDone]);

  const rawName = projection?.diner?.display_name || "";
  const name = formatDinerInviteName(rawName) || rawName.trim() || "A diner";
  const avatarSrc = useMemo(() => {
    const url = projection?.diner?.avatar_url;
    return url ? resolveConsumerMediaUrl(url) : "";
  }, [projection]);

  function finish() {
    clearPendingQrConnect(token);
    onDone();
  }

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await connectViaDinerQr(token);
      clearPendingQrConnect(token);
      setResult(`Done. ${name} will see your connect request on their Profile.`);
    } catch (err) {
      const code = err?.payload?.code;
      if (code === "self_scan") {
        finish();
        return;
      }
      if (code === "already_connected" || code === "already_pending") {
        clearPendingQrConnect(token);
        setResult(resolveConsumerConnectErrorMessage(err, name));
        return;
      }
      setError(resolveConsumerConnectErrorMessage(err, name));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !projection) {
    return <p style={styles.muted}>Loading…</p>;
  }

  return (
    <section data-testid="social-onboarding-qr-connect" style={styles.card}>
      <div style={styles.identity}>
        {avatarSrc ? (
          <img src={avatarSrc} alt="" style={styles.avatar} />
        ) : (
          <div style={styles.avatarFallback} aria-hidden>
            {initials(name)}
          </div>
        )}
        <div>
          <h1 style={styles.title}>Connect with {name}?</h1>
          <p style={styles.body}>
            {name} invited you to Menuply. Confirm {name}&apos;s connection request to stay in touch
            and invite each other to eat.
          </p>
          {projection?.custom_message ? (
            <p style={styles.ownMessage}>&ldquo;{projection.custom_message}&rdquo;</p>
          ) : null}
        </div>
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}

      {result ? (
        <>
          <p style={styles.notice} data-testid="qr-connect-result">{result}</p>
          <div style={styles.buttons}>
            <button type="button" style={styles.pill} onClick={onDone}>
              Continue
            </button>
          </div>
        </>
      ) : (
        <div style={styles.buttons}>
          <button type="button" style={styles.pill} disabled={busy} onClick={handleConfirm}>
            {busy ? "Confirming…" : "Confirm"}
          </button>
          <button type="button" style={styles.pillQuiet} disabled={busy} onClick={finish}>
            Not now
          </button>
        </div>
      )}
    </section>
  );
}

const styles = {
  muted: { color: "#6b7280" },
  card: {
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 18,
  },
  identity: { display: "flex", alignItems: "flex-start", gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e5e7eb",
    flexShrink: 0,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#f3f4f6",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 20,
    flexShrink: 0,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.25 },
  body: { margin: "8px 0 0", fontSize: 15, lineHeight: 1.5, color: "#374151" },
  ownMessage: {
    margin: "8px 0 0",
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 1.4,
    color: "#334155",
    overflowWrap: "anywhere",
  },
  error: { color: "#b91c1c", fontSize: 14, fontWeight: 600, margin: "14px 0 0" },
  notice: { color: "#111827", fontSize: 15, fontWeight: 700, margin: "14px 0 0", lineHeight: 1.45 },
  buttons: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 },
  pill: {
    border: "1px solid #111827",
    borderRadius: 999,
    background: "#111827",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    padding: "10px 22px",
    cursor: "pointer",
  },
  pillQuiet: {
    border: "1px solid #cbd5e1",
    borderRadius: 999,
    background: "#fff",
    color: "#111827",
    fontWeight: 700,
    fontSize: 15,
    padding: "10px 22px",
    cursor: "pointer",
  },
};
