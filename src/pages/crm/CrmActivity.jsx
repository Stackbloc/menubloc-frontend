import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCrmEmailActivity } from "../../lib/crmApi.js";
import {
  Badge,
  CRM_COLORS,
  CrmCard,
  CrmPage,
  EmptyState,
  ErrorBanner,
  formatDateTime,
} from "./CrmShared.jsx";
import CrmEmailView from "./CrmEmailView.jsx";

export default function CrmActivity() {
  const [q, setQ] = useState("");
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState("");
  const [viewId, setViewId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load(nextQ = q) {
    try {
      setError("");
      const json = await getCrmEmailActivity({ q: nextQ || undefined, limit: 150 });
      setEmails(json.emails || []);
    } catch (err) {
      setError(err.message || "Unable to load activity");
    }
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid ${CRM_COLORS.line}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  };

  return (
    <CrmPage title="Activity">
      {error ? <ErrorBanner message={error} /> : null}

      <CrmCard title="Email activity" subtitle="Global send history. Restaurant name opens the CRM profile; contact opens the contact record.">
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search restaurant, contact, subject…"
            style={inputStyle}
          />
          <button type="button" onClick={() => load(q)} style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
            Search
          </button>
        </div>

        {!emails.length ? (
          <EmptyState>No email activity. Sent outreach emails will appear here.</EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {emails.map((email) => {
              const contactName = [email.contact_first_name, email.contact_last_name].filter(Boolean).join(" ") || email.contact_email || "—";
              const leadId = email.lead_id || email.resolved_lead_id;
              return (
                <div key={email.id} style={{ border: `1px solid ${CRM_COLORS.line}`, borderRadius: 14, padding: 14, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 12, color: CRM_COLORS.muted, fontWeight: 700 }}>
                        {formatDateTime(email.sent_at)}
                      </div>
                      <div style={{ marginTop: 6, fontWeight: 800, fontSize: 15 }}>
                        {leadId ? (
                          <Link to={`/crm/leads/${leadId}`} style={{ color: CRM_COLORS.accent, textDecoration: "none" }}>
                            {email.restaurant_name || `Restaurant #${email.restaurant_id}`}
                          </Link>
                        ) : (
                          email.restaurant_name || `Restaurant #${email.restaurant_id}`
                        )}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        To:{" "}
                        {email.contact_id ? (
                          <Link to={`/crm/contacts?highlight=${encodeURIComponent(email.contact_id)}`} style={{ color: CRM_COLORS.accent, fontWeight: 700 }}>
                            {contactName}
                          </Link>
                        ) : (
                          contactName
                        )}
                      </div>
                      <div style={{ marginTop: 6, fontWeight: 700 }}>{email.subject_rendered}</div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Badge type="account" value="email" />
                        {email.template_name ? <Badge type="account" value={email.template_name} /> : <Badge type="account" value="custom" />}
                        <Badge type="account" value={email.provider} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewId(email.id)}
                      style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700, cursor: "pointer", height: "fit-content" }}
                    >
                      View Email
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CrmCard>

      {viewId ? <CrmEmailView emailSendId={viewId} onClose={() => setViewId(null)} /> : null}
    </CrmPage>
  );
}
