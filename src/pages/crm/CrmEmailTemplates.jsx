import React, { useEffect, useState } from "react";
import {
  createCrmEmailTemplate,
  getCrmEmailTemplates,
  updateCrmEmailTemplate,
} from "../../lib/crmApi.js";
import {
  Badge,
  CRM_COLORS,
  CrmCard,
  CrmPage,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
  formatDateTime,
} from "./CrmShared.jsx";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "restaurant_outreach", label: "Restaurant Outreach" },
  { value: "restaurant_follow_up", label: "Restaurant Follow-Up" },
  { value: "cluster_outreach", label: "Cluster Outreach" },
  { value: "distributor_outreach", label: "Distributor Outreach" },
  { value: "general_sales", label: "General Sales" },
  { value: "other", label: "Other" },
];

const MERGE_CHIPS = [
  "[First Name]",
  "[Last Name]",
  "[Business Name]",
  "[Restaurant Name]",
  "[Cluster Name]",
  "[City]",
  "[Your Name]",
];

const EMPTY_FORM = {
  name: "",
  subject: "",
  body: "",
  category: "restaurant_outreach",
  is_active: true,
};

export default function CrmEmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [mergeFields, setMergeFields] = useState(MERGE_CHIPS);
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, [category]);

  async function load() {
    try {
      setError("");
      const json = await getCrmEmailTemplates(category ? { category } : {});
      setTemplates(json.templates || []);
      if (json.merge_fields?.length) setMergeFields(json.merge_fields);
    } catch (err) {
      setError(err.message || "Unable to load templates");
    }
  }

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setSuccess("");
  }

  function startEdit(tpl) {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name || "",
      subject: tpl.subject || "",
      body: tpl.body || "",
      category: tpl.category || "other",
      is_active: tpl.is_active !== false,
    });
    setShowForm(true);
    setSuccess("");
  }

  async function save() {
    try {
      setError("");
      if (editingId) {
        await updateCrmEmailTemplate(editingId, form);
        setSuccess("Template updated.");
      } else {
        await createCrmEmailTemplate(form);
        setSuccess("Template created.");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || "Unable to save template");
    }
  }

  async function toggleActive(tpl) {
    try {
      await updateCrmEmailTemplate(tpl.id, { is_active: !tpl.is_active });
      load();
    } catch (err) {
      setError(err.message || "Unable to update template");
    }
  }

  function insertChip(token) {
    setForm((current) => ({ ...current, body: `${current.body || ""}${token}` }));
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid ${CRM_COLORS.line}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  };

  return (
    <CrmPage
      title="Email Templates"
      actions={
        <button
          type="button"
          onClick={startCreate}
          style={{
            border: "none",
            background: CRM_COLORS.accent,
            color: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          New template
        </button>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <CrmCard title="Reusable outreach messages" subtitle="Templates are not prospect records. Sent emails store rendered copies separately.">
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 220 }}>
            {CATEGORIES.map((c) => (
              <option key={c.value || "all"} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {showForm ? (
          <div style={{ marginBottom: 18, padding: 16, border: `1px solid ${CRM_COLORS.line}`, borderRadius: 14, background: CRM_COLORS.soft }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>{editingId ? "Edit template" : "Create template"}</div>
            <div style={{ display: "grid", gap: 12 }}>
              <input placeholder="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={inputStyle} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {mergeFields.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => insertChip(chip)}
                    style={{
                      border: `1px solid ${CRM_COLORS.line}`,
                      background: "#fff",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Email body"
                rows={10}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
              />
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={save} style={{ border: "none", background: CRM_COLORS.accent, color: "#fff", borderRadius: 12, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
                  Save
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 12, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!templates.length ? (
          <EmptyState>No templates yet. Create a reusable outreach template to get started.</EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  border: `1px solid ${CRM_COLORS.line}`,
                  borderRadius: 14,
                  padding: 14,
                  background: "#fff",
                  opacity: tpl.is_active ? 1 : 0.7,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: CRM_COLORS.ink }}>{tpl.name}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: CRM_COLORS.muted }}>
                      {tpl.subject}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Badge type="account" value={tpl.category} />
                      <Badge type="status" value={tpl.is_active ? "active" : "inactive"} />
                      <span style={{ fontSize: 12, color: CRM_COLORS.muted }}>Updated {formatDateTime(tpl.updated_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => startEdit(tpl)} style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleActive(tpl)} style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>
                      {tpl.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CrmCard>
    </CrmPage>
  );
}
