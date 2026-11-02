import { useState } from "react";
import { Link } from "react-router-dom";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { deleteConsumerAccount } from "../../../lib/consumerApi.js";
import { C, s } from "./safetyStyles.js";

const SETTINGS_PATH = "/feed/profile?view=settings";

/**
 * Delete account (Play Store requirement; Andre approved 2026-11-02, plan 18). This URL is the one Google
 * Play lists. Signed out it explains how; signed in it deletes right away: password, or DELETE for
 * Google/Apple-only accounts.
 */
export default function AccountDeletePage() {
  const { isAuthenticated, loading, refreshSession } = useConsumer();
  const [noPassword, setNoPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onDelete(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await deleteConsumerAccount(noPassword ? { confirm } : { password });
      setDone(true);
      refreshSession?.().catch?.(() => {});
    } catch (err) {
      setError(err?.message || "Couldn't delete your account. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const ready = noPassword ? confirm.trim().toUpperCase() === "DELETE" : password.length > 0;

  return (
    <main style={s.page} data-testid="account-delete-page">
      <div style={s.stack}>
        {!done && isAuthenticated ? (
          <Link to={SETTINGS_PATH} style={s.back}>‹ Settings</Link>
        ) : null}
        <h1 style={s.h1}>Delete your Menuply account</h1>

        {done ? (
          <div style={s.card} data-testid="account-delete-done">
            <p style={s.p}>Your account is deleted.</p>
            <p style={s.muted}>Thanks for trying Menuply. You can sign up again any time.</p>
            <Link to="/" style={s.link}>Go to Menuply</Link>
          </div>
        ) : loading ? null : !isAuthenticated ? (
          <div style={s.card} data-testid="account-delete-signed-out">
            <p style={s.p}>
              Sign in, then come back to this page to delete your account. In the Menuply app it&apos;s under
              Profile → Settings → Delete account.
            </p>
            <p style={s.muted}>
              Can&apos;t sign in? Email <a href="mailto:inquiries@menuply.com">inquiries@menuply.com</a> from the
              address on your account and we&apos;ll delete it for you.
            </p>
            <Link to="/account/login?next=%2Faccount%2Fdelete" style={{ ...s.pill, textDecoration: "none" }}>Sign in</Link>
          </div>
        ) : (
          <form style={s.card} onSubmit={onDelete} data-testid="account-delete-form">
            <p style={s.p}>
              This deletes your profile, clips, Favs, Wish List, Connects and plans. Orders stay on record for the
              restaurant, without your name.
            </p>
            <p style={{ ...s.p, fontWeight: 600 }}>This can&apos;t be undone.</p>
            {noPassword ? (
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={s.muted}>Type DELETE to confirm</span>
                <input style={s.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" data-testid="account-delete-confirm" />
              </label>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={s.muted}>Your password</span>
                <input style={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="account-delete-password" />
              </label>
            )}
            <button type="button" style={{ ...s.link, alignSelf: "flex-start", fontSize: 14 }} onClick={() => { setNoPassword((v) => !v); setError(""); }}>
              {noPassword ? "I have a password" : "I sign in with Google or Apple"}
            </button>
            {error ? <p style={s.error} role="alert">{error}</p> : null}
            <button type="submit" style={{ ...s.dangerPill, opacity: ready && !busy ? 1 : 0.5 }} disabled={!ready || busy} data-testid="account-delete-submit">
              {busy ? "Deleting…" : "Delete my account"}
            </button>
          </form>
        )}
        <p style={{ ...s.muted, color: C.muted }}>
          <Link to="/privacy" style={s.link}>Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}
