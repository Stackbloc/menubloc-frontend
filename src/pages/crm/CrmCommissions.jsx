import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import CrmLayout from "./CrmLayout.jsx";
import { getCrmCommissionRates, updateCrmCommissionRate, getCrmDiscountCodes, createCrmDiscountCode, updateCrmDiscountCode } from "../../lib/crmApi.js";

function fmt(isoString) {
  if (!isoString) return "Never";
  return new Date(isoString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDays(days) {
  if (!days) return "Forever";
  if (days % 365 === 0) return `${days / 365} year${days / 365 !== 1 ? "s" : ""}`;
  if (days % 30 === 0) return `${days / 30} month${days / 30 !== 1 ? "s" : ""}`;
  return `${days} days`;
}

// ── Commission Rates panel ────────────────────────────────────────────────────
function CommissionRates() {
  const [rates, setRates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newRate, setNewRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCrmCommissionRates().then((d) => setRates(d.rates || [])).catch((e) => setError(e.message));
  }, []);

  async function handleSave(plan_type) {
    const rate = Number(newRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError("Enter a rate between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      const data = await updateCrmCommissionRate(plan_type, rate);
      setRates((prev) => {
        const filtered = prev.filter((r) => r.plan_type !== plan_type);
        return [data.rate, ...filtered];
      });
      setEditing(null);
      setNewRate("");
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const LABELS = { partner: "Partner (paid subscribers)", marketplace: "Marketplace (free/public listings)" };

  return (
    <div style={{ background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 16 }}>Commission Rates</div>
      {error && <div style={{ color: "#991b1b", fontSize: 13, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: "grid", gap: 12 }}>
        {["partner", "marketplace"].map((pt) => {
          const r = rates.find((x) => x.plan_type === pt);
          return (
            <div key={pt} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f1720" }}>{LABELS[pt]}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Effective {fmt(r?.effective_from)}</div>
              </div>
              {editing === pt ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number" min="0" max="100" step="0.5"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    style={{ width: 70, padding: "6px 10px", borderRadius: 8, border: "1px solid #d9e0ea", fontSize: 14, fontWeight: 700 }}
                    autoFocus
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>%</span>
                  <button onClick={() => handleSave(pt)} disabled={saving} style={btnStyle("#173f35", "#fff")}>Save</button>
                  <button onClick={() => { setEditing(null); setNewRate(""); }} style={btnStyle("#f1f5f9", "#0f1720")}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#173f35", letterSpacing: "-0.04em" }}>{r ? `${r.rate_percent}%` : "—"}</span>
                  <button onClick={() => { setEditing(pt); setNewRate(r?.rate_percent || ""); }} style={btnStyle("#e8f3ef", "#173f35")}>Edit</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── New discount code form ────────────────────────────────────────────────────
const BLANK_FORM = {
  code: "", description: "",
  subscription_discount_percent: "", subscription_discount_days: "",
  commission_discount_percent: "",   commission_discount_days: "",
  max_uses: "",
};

function NewCodeForm({ onCreated }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(key, value) { setForm((p) => ({ ...p, [key]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code.trim()) { setError("Code is required"); return; }
    if (!form.subscription_discount_percent && !form.commission_discount_percent) {
      setError("At least one discount (subscription or commission) is required");
      return;
    }
    setSaving(true);
    try {
      const data = await createCrmDiscountCode({
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        subscription_discount_percent: form.subscription_discount_percent ? Number(form.subscription_discount_percent) : undefined,
        subscription_discount_days:    form.subscription_discount_days    ? Number(form.subscription_discount_days)    : undefined,
        commission_discount_percent:   form.commission_discount_percent   ? Number(form.commission_discount_percent)   : undefined,
        commission_discount_days:      form.commission_discount_days      ? Number(form.commission_discount_days)      : undefined,
        max_uses:                      form.max_uses                      ? Number(form.max_uses)                      : undefined,
      });
      setForm(BLANK_FORM);
      setError(null);
      onCreated(data.discount_code);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "#f8fafc", border: "1px solid #d9e0ea", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 16 }}>New Discount Code</div>
      {error && <div style={{ color: "#991b1b", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 16 }}>
        <Field label="Code *" hint="e.g. LAUNCH50">
          <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} style={inputStyle} placeholder="LAUNCH50" />
        </Field>
        <Field label="Description">
          <input value={form.description} onChange={(e) => set("description", e.target.value)} style={inputStyle} placeholder="Optional internal note" />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#173f35", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Subscription Fee Discount</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Discount %" hint="e.g. 25 = 25% off">
              <input type="number" min="0" max="100" step="1" value={form.subscription_discount_percent} onChange={(e) => set("subscription_discount_percent", e.target.value)} style={inputStyle} placeholder="25" />
            </Field>
            <Field label="Duration (days)" hint="blank = forever">
              <input type="number" min="1" value={form.subscription_discount_days} onChange={(e) => set("subscription_discount_days", e.target.value)} style={inputStyle} placeholder="90" />
            </Field>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#173f35", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Commission Rate Discount</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Discount %" hint="e.g. 50 = 50% off commission">
              <input type="number" min="0" max="100" step="1" value={form.commission_discount_percent} onChange={(e) => set("commission_discount_percent", e.target.value)} style={inputStyle} placeholder="50" />
            </Field>
            <Field label="Duration (days)" hint="blank = forever">
              <input type="number" min="1" value={form.commission_discount_days} onChange={(e) => set("commission_discount_days", e.target.value)} style={inputStyle} placeholder="180" />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <Field label="Max uses" hint="blank = unlimited" style={{ width: 140 }}>
          <input type="number" min="1" value={form.max_uses} onChange={(e) => set("max_uses", e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="Unlimited" />
        </Field>
        <button type="submit" disabled={saving} style={{ ...btnStyle("#173f35", "#fff"), padding: "10px 24px", fontSize: 14, marginBottom: 0 }}>
          {saving ? "Creating…" : "Create Code"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", marginBottom: 4 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

// ── Discount codes table ──────────────────────────────────────────────────────
function DiscountCodesTable({ codes, onToggle }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Code", "Sub Discount", "Sub Duration", "Comm Discount", "Comm Duration", "Uses", "Status", ""].map((h) => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", color: "#64748b", borderBottom: "1px solid #d9e0ea" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {codes.map((dc) => (
            <tr key={dc.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: dc.is_active ? 1 : 0.5 }}>
              <td style={{ padding: "12px 14px" }}>
                <div style={{ fontWeight: 800, color: "#0f1720", fontFamily: "monospace", fontSize: 14 }}>{dc.code}</div>
                {dc.description && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{dc.description}</div>}
              </td>
              <td style={{ padding: "12px 14px", fontWeight: 700, color: dc.subscription_discount_percent ? "#173f35" : "#94a3b8" }}>
                {dc.subscription_discount_percent ? `${dc.subscription_discount_percent}% off` : "—"}
              </td>
              <td style={{ padding: "12px 14px", color: "#64748b" }}>
                {fmtDays(dc.subscription_discount_days)}
              </td>
              <td style={{ padding: "12px 14px", fontWeight: 700, color: dc.commission_discount_percent ? "#173f35" : "#94a3b8" }}>
                {dc.commission_discount_percent ? `${dc.commission_discount_percent}% off` : "—"}
              </td>
              <td style={{ padding: "12px 14px", color: "#64748b" }}>
                {fmtDays(dc.commission_discount_days)}
              </td>
              <td style={{ padding: "12px 14px", color: "#0f1720" }}>
                {dc.uses_count}{dc.max_uses ? ` / ${dc.max_uses}` : ""}
              </td>
              <td style={{ padding: "12px 14px" }}>
                <span style={{ background: dc.is_active ? "#e8f3ef" : "#f1f5f9", color: dc.is_active ? "#173f35" : "#64748b", borderRadius: 8, padding: "3px 10px", fontWeight: 700, fontSize: 11 }}>
                  {dc.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td style={{ padding: "12px 14px" }}>
                <button onClick={() => onToggle(dc)} style={btnStyle(dc.is_active ? "#fef2f2" : "#e8f3ef", dc.is_active ? "#991b1b" : "#173f35")}>
                  {dc.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CrmCommissions() {
  const { t } = useLanguage();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getCrmDiscountCodes()
      .then((d) => setCodes(d.discount_codes || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(dc) {
    setCodes((prev) => [dc, ...prev]);
    setShowForm(false);
  }

  async function handleToggle(dc) {
    try {
      const data = await updateCrmDiscountCode(dc.id, { is_active: !dc.is_active });
      setCodes((prev) => prev.map((c) => (c.id === dc.id ? data.discount_code : c)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <CrmLayout title="Commissions & Discounts">
      <CommissionRates />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>
          Discount Codes
        </div>
        <button onClick={() => setShowForm((v) => !v)} style={btnStyle("#173f35", "#fff")}>
          {showForm ? "Cancel" : "+ New Code"}
        </button>
      </div>

      {error && <div style={{ color: "#991b1b", fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {showForm && <NewCodeForm onCreated={handleCreated} />}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading…</div>
      ) : codes.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16 }}>
          No discount codes yet. Create one above.
        </div>
      ) : (
        <DiscountCodesTable codes={codes} onToggle={handleToggle} />
      )}
    </CrmLayout>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 10,
  border: "1px solid #d9e0ea", fontSize: 13, background: "#fff",
  boxSizing: "border-box",
};

function btnStyle(bg, color) {
  return {
    background: bg, color, border: "none", borderRadius: 10,
    padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
  };
}
