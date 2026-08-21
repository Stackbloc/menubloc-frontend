import React, { useEffect, useState } from "react";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../lib/consumerApi.js";
import { accountStyles as styles } from "./accountDashboardStyles.js";

export default function SecurityAccountTab({
  email,
  phoneNumber,
  onChangePhone,
  phoneChangeNotice,
  currentPassword,
  newPassword,
  confirmNewPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onChangePassword,
  passwordSaving,
  passwordMessage,
  passwordError,
  onLogout,
  onOpenSupport,
  supportTitle = "Support",
  supportDesc = "Need help with your account, search, restaurant information, or the app? Contact Menuply Support.",
  supportButtonLabel = "Contact Support",
  signOutTitle = "Sign out",
}) {
  const [editingPassword, setEditingPassword] = useState(false);
  const [importantEmailOn, setImportantEmailOn] = useState(true);
  const [importantEmailLoading, setImportantEmailLoading] = useState(true);
  const [importantEmailSaving, setImportantEmailSaving] = useState(false);
  const [importantEmailMsg, setImportantEmailMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getNotificationPreferences();
        if (cancelled) return;
        setImportantEmailOn(res?.important_action_email_enabled !== false);
      } catch {
        if (!cancelled) setImportantEmailOn(true);
      } finally {
        if (!cancelled) setImportantEmailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onToggleImportantEmail(next) {
    setImportantEmailSaving(true);
    setImportantEmailMsg("");
    setImportantEmailOn(next);
    try {
      const res = await updateNotificationPreferences({
        important_action_email_enabled: next,
      });
      setImportantEmailOn(res?.important_action_email_enabled !== false);
      setImportantEmailMsg(next ? "Important emails on." : "Important emails off.");
    } catch (err) {
      setImportantEmailOn(!next);
      setImportantEmailMsg(err?.message || "Could not update email preference.");
    } finally {
      setImportantEmailSaving(false);
    }
  }

  return (
    <div>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Account information</h2>
        <div style={{ ...styles.field, marginTop: 12 }}>
          <label style={styles.fieldLabel}>Email</label>
          <p style={styles.readOnly}>{email || "—"}</p>
        </div>
        <div style={styles.field}>
          <label style={styles.fieldLabel}>
            Phone <span style={styles.optText}>(verified)</span>
          </label>
          <div style={styles.phoneRow}>
            <input
              type="tel"
              value={phoneNumber || ""}
              readOnly
              style={{ ...styles.input, ...styles.inputReadonly }}
              placeholder="No verified phone"
              aria-label="Verified phone number"
            />
            <button type="button" onClick={onChangePhone} style={styles.secondaryBtn}>
              Change phone
            </button>
          </div>
          {phoneChangeNotice ? <p style={styles.statusOk}>{phoneChangeNotice}</p> : null}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Important Menuply emails</h2>
        <p style={{ ...styles.readOnly, marginTop: 8, marginBottom: 12 }}>
          Email only when you need to accept, decline, vote, or respond — not for likes or
          routine activity.
        </p>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: importantEmailLoading || importantEmailSaving ? "default" : "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={importantEmailOn}
            disabled={importantEmailLoading || importantEmailSaving}
            onChange={(e) => onToggleImportantEmail(e.target.checked)}
            aria-label="Important Menuply email notifications"
          />
          <span style={styles.fieldLabel}>Important Menuply email notifications</span>
        </label>
        {importantEmailMsg ? (
          <p style={importantEmailMsg.includes("Could not") ? styles.statusErr : styles.statusOk}>
            {importantEmailMsg}
          </p>
        ) : null}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Password</h2>
          <button
            type="button"
            onClick={() => setEditingPassword((v) => !v)}
            style={styles.textBtn}
          >
            {editingPassword ? "Cancel" : "Change Password"}
          </button>
        </div>
        {editingPassword ? (
          <>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => onCurrentPasswordChange(e.target.value)}
                style={styles.input}
                placeholder="Current password"
                autoComplete="current-password"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                style={styles.input}
                placeholder="New password"
                autoComplete="new-password"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Confirm new password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                style={styles.input}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>
            <button
              type="button"
              onClick={onChangePassword}
              style={styles.primaryBtn}
              disabled={passwordSaving}
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
            {passwordError ? <p style={styles.statusErr}>{passwordError}</p> : null}
            {passwordMessage ? <p style={styles.statusOk}>{passwordMessage}</p> : null}
          </>
        ) : (
          <p style={styles.muted}>Use a unique password for your Menuply account.</p>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>{supportTitle}</h2>
        <p style={styles.sectionDesc}>{supportDesc}</p>
        <button type="button" onClick={onOpenSupport} style={styles.secondaryBtn}>
          {supportButtonLabel}
        </button>
      </section>

      <section style={{ ...styles.section, ...styles.sectionLast }}>
        <h2 style={styles.sectionTitle}>{signOutTitle}</h2>
        <p style={styles.sectionDesc}>You can sign back in anytime with this account.</p>
        <button type="button" onClick={onLogout} style={styles.dangerBtn}>
          Log out
        </button>
      </section>
    </div>
  );
}
