import React, { useEffect, useMemo, useState } from "react";
import {
  getCrmEmailTemplates,
  getCrmRestaurantContacts,
  previewCrmLeadEmail,
  sendCrmLeadEmail,
} from "../../lib/crmApi.js";
import { CRM_COLORS, ErrorBanner, SuccessBanner } from "./CrmShared.jsx";

const EMPTY = {
  template_id: "",
  contact_id: "",
  subject: "",
  body: "",
  cluster_name: "",
  your_name: "",
  follow_up_at: "",
  to_email: "",
};

export default function CrmEmailComposer({
  leadId,
  restaurantId,
  defaultContactId = "",
  onClose,
  onSent,
}) {
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ ...EMPTY, contact_id: defaultContactId || "" });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [tplJson, contactJson] = await Promise.all([
          getCrmEmailTemplates({ active: "true" }),
          restaurantId ? getCrmRestaurantContacts(restaurantId) : Promise.resolve({ contacts: [] }),
        ]);
        setTemplates(tplJson.templates || []);
        setContacts(contactJson.contacts || []);
      } catch (err) {
        setError(err.message || "Unable to load composer");
      }
    })();
  }, [restaurantId]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => String(t.id) === String(form.template_id)) || null,
    [templates, form.template_id]
  );

  function patch(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setPreview(null);
  }

  function applyTemplate(templateId) {
    const tpl = templates.find((t) => String(t.id) === String(templateId));
    setForm((current) => ({
      ...current,
      template_id: templateId,
      subject: tpl ? tpl.subject : current.subject,
      body: tpl ? tpl.body : current.body,
    }));
    setPreview(null);
  }

  async function handlePreview() {
    try {
      setBusy(true);
      setError("");
      const json = await previewCrmLeadEmail(leadId, {
        template_id: form.template_id || null,
        contact_id: form.contact_id || null,
        subject: form.subject,
        body: form.body,
        cluster_name: form.cluster_name || null,
        your_name: form.your_name || null,
      });
      setPreview(json.preview);
      setSuccess("Preview ready.");
    } catch (err) {
      setError(err.message || "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      const json = await sendCrmLeadEmail(leadId, {
        template_id: form.template_id || null,
        contact_id: form.contact_id || null,
        subject: form.subject,
        body: form.body,
        cluster_name: form.cluster_name || null,
        your_name: form.your_name || null,
        follow_up_at: form.follow_up_at || null,
        to_email: form.to_email || null,
        provider: "manual",
      });
      setSuccess("Email marked as sent and saved to restaurant history.");
      if (onSent) onSent(json);
    } catch (err) {
      setError(err.message || "Send failed");
    } finally {
      setBusy(false);
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
          width: "min(860px, 100%)",
          maxHeight: "92vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${CRM_COLORS.line}`,
          padding: 22,
          boxShadow: "0 24px 60px rgba(15,23,32,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: CRM_COLORS.ink }}>Send Email</h2>
            <div style={{ marginTop: 6, fontSize: 13, color: CRM_COLORS.muted }}>
              Choose a template or write a custom message. V1 records via Manual provider (Mark as sent).
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ ...inputStyle, width: "auto", fontWeight: 700, cursor: "pointer" }}>
            Close
          </button>
        </div>

        {error ? <div style={{ marginTop: 12 }}><ErrorBanner message={error} /></div> : null}
        {success ? <div style={{ marginTop: 12 }}><SuccessBanner message={success} /></div> : null}

        {!restaurantId ? (
          <div style={{ marginTop: 16, padding: 14, background: CRM_COLORS.dangerSoft, color: CRM_COLORS.dangerInk, borderRadius: 12, fontWeight: 600 }}>
            Link this lead to a restaurant before sending. Email history is keyed by restaurant.
          </div>
        ) : (
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Template (optional)</span>
              <select
                value={form.template_id}
                onChange={(e) => applyTemplate(e.target.value)}
                style={inputStyle}
              >
                <option value="">Blank / custom email</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
              {selectedTemplate ? (
                <span style={{ fontSize: 12, color: CRM_COLORS.muted }}>Using: {selectedTemplate.name}</span>
              ) : null}
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Contact</span>
              <select
                value={form.contact_id}
                onChange={(e) => patch("contact_id", e.target.value)}
                style={inputStyle}
              >
                <option value="">Select contact…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.email}
                    {c.is_primary ? " (primary)" : ""} — {c.email}
                  </option>
                ))}
              </select>
            </label>

            {!form.contact_id ? (
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Or recipient email</span>
                <input
                  value={form.to_email}
                  onChange={(e) => patch("to_email", e.target.value)}
                  placeholder="name@example.com"
                  style={inputStyle}
                />
              </label>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Your Name</span>
                <input value={form.your_name} onChange={(e) => patch("your_name", e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Cluster Name (merge)</span>
                <input value={form.cluster_name} onChange={(e) => patch("cluster_name", e.target.value)} style={inputStyle} />
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Subject</span>
              <input value={form.subject} onChange={(e) => patch("subject", e.target.value)} style={inputStyle} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Body</span>
              <textarea
                value={form.body}
                onChange={(e) => patch("body", e.target.value)}
                rows={10}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Schedule next follow-up (optional)</span>
              <input
                type="datetime-local"
                value={form.follow_up_at}
                onChange={(e) => patch("follow_up_at", e.target.value)}
                style={inputStyle}
              />
            </label>

            {preview ? (
              <div style={{ background: CRM_COLORS.soft, border: `1px solid ${CRM_COLORS.line}`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Preview</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{preview.subject_rendered}</div>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                  {preview.body_rendered}
                </pre>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={busy}
                onClick={handlePreview}
                style={{
                  border: `1px solid ${CRM_COLORS.line}`,
                  background: "#fff",
                  borderRadius: 12,
                  padding: "11px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Preview
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleSend}
                style={{
                  border: "none",
                  background: CRM_COLORS.accent,
                  color: "#fff",
                  borderRadius: 12,
                  padding: "11px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Mark as sent
              </button>
              {(preview?.subject_rendered || form.subject) && (form.contact_id || form.to_email) ? (
                <a
                  href={`mailto:${encodeURIComponent(
                    contacts.find((c) => String(c.id) === String(form.contact_id))?.email || form.to_email || ""
                  )}?subject=${encodeURIComponent(preview?.subject_rendered || form.subject)}&body=${encodeURIComponent(
                    preview?.body_rendered || form.body
                  )}`}
                  style={{
                    border: `1px solid ${CRM_COLORS.line}`,
                    background: "#fff",
                    borderRadius: 12,
                    padding: "11px 16px",
                    fontWeight: 700,
                    textDecoration: "none",
                    color: CRM_COLORS.ink,
                  }}
                >
                  Open mailto
                </a>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

