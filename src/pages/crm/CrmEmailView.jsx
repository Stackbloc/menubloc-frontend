import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCrmEmailSend } from "../../lib/crmApi.js";
import { CRM_COLORS, ErrorBanner, formatDateTime } from "./CrmShared.jsx";

export default function CrmEmailView({ emailSendId, email: emailProp = null, onClose }) {
  const [email, setEmail] = useState(emailProp);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!emailProp && Boolean(emailSendId));

  useEffect(() => {
    if (emailProp || !emailSendId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const json = await getCrmEmailSend(emailSendId);
        if (!cancelled) setEmail(json.email);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load email");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [emailSendId, emailProp]);

  const contactName = email
    ? [email.contact_first_name, email.contact_last_name].filter(Boolean).join(" ") || email.contact_email || "—"
    : "—";
  const leadId = email?.lead_id || email?.resolved_lead_id;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,32,0.45)",
        zIndex: 80,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${CRM_COLORS.line}`,
          padding: 22,
          boxShadow: "0 24px 60px rgba(15,23,32,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: CRM_COLORS.ink }}>View Email</h2>
            <div style={{ marginTop: 6, fontSize: 13, color: CRM_COLORS.muted }}>
              Rendered copy as sent — template edits do not change this record.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: `1px solid ${CRM_COLORS.line}`,
              background: "#fff",
              borderRadius: 10,
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {error ? <div style={{ marginTop: 14 }}><ErrorBanner message={error} /></div> : null}
        {loading ? <div style={{ marginTop: 18, color: CRM_COLORS.muted }}>Loading…</div> : null}

        {email && !loading ? (
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <MetaRow label="Sent" value={formatDateTime(email.sent_at)} />
            <MetaRow
              label="Restaurant"
              value={
                leadId ? (
                  <Link to={`/crm/leads/${leadId}`} style={{ color: CRM_COLORS.accent, fontWeight: 700 }}>
                    {email.restaurant_name || `Restaurant #${email.restaurant_id}`}
                  </Link>
                ) : (
                  email.restaurant_name || `Restaurant #${email.restaurant_id}`
                )
              }
            />
            <MetaRow
              label="To"
              value={
                email.contact_id || email.contact_record_id ? (
                  <Link
                    to={`/crm/contacts?highlight=${encodeURIComponent(email.contact_id || email.contact_record_id)}`}
                    style={{ color: CRM_COLORS.accent, fontWeight: 700 }}
                  >
                    {contactName}
                  </Link>
                ) : (
                  contactName
                )
              }
            />
            <MetaRow label="Sender" value={email.sender_email || "—"} />
            <MetaRow label="Provider" value={`${email.provider || "manual"}${email.provider_message_id ? ` · ${email.provider_message_id}` : ""}`} />
            {email.template_name ? <MetaRow label="Template" value={email.template_name} /> : null}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: CRM_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Subject
              </div>
              <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: CRM_COLORS.ink }}>{email.subject_rendered}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: CRM_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Body
              </div>
              <pre
                style={{
                  marginTop: 8,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: CRM_COLORS.ink,
                  background: CRM_COLORS.soft,
                  borderRadius: 12,
                  padding: 14,
                  border: `1px solid ${CRM_COLORS.line}`,
                }}
              >
                {email.body_rendered}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "baseline" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: CRM_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: CRM_COLORS.ink }}>{value}</div>
    </div>
  );
}
