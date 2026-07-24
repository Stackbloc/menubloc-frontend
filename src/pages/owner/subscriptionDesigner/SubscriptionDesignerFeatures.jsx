import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { createSdFeature, listSdFeatures, updateSdFeature } from "../../../lib/ownerApi.js";

export default function SubscriptionDesignerFeatures() {
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    internal_key: "",
    public_label: "",
    value_type: "boolean",
    category: "general",
  });

  async function reload() {
    const res = await listSdFeatures();
    setFeatures(res.features || []);
  }

  useEffect(() => {
    reload().catch((err) => setError(err.message));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await createSdFeature(form);
      setForm({ internal_key: "", public_label: "", value_type: "boolean", category: "general" });
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(feature) {
    setError(null);
    try {
      await updateSdFeature(feature.id, { active: !feature.active });
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleChart(feature) {
    setError(null);
    try {
      await updateSdFeature(feature.id, {
        visible_in_comparison_chart: !feature.visible_in_comparison_chart,
      });
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <OwnerLayout
      title="Feature catalog"
      actions={
        <Link to="/owner/subscription-designer" style={{ color: OWNER_COLORS.accent, fontWeight: 600 }}>
          ← Plans
        </Link>
      }
    >
      <PageCard style={{ padding: 20, marginBottom: 16 }}>
        <SectionTitle title="Add feature" />
        {error ? <div style={{ color: "#b91c1c", marginBottom: 10 }}>{error}</div> : null}
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            required
            placeholder="internal_key"
            value={form.internal_key}
            onChange={(e) => setForm({ ...form, internal_key: e.target.value })}
            style={input}
          />
          <input
            required
            placeholder="Public label"
            value={form.public_label}
            onChange={(e) => setForm({ ...form, public_label: e.target.value })}
            style={{ ...input, minWidth: 240 }}
          />
          <select
            value={form.value_type}
            onChange={(e) => setForm({ ...form, value_type: e.target.value })}
            style={input}
          >
            <option value="boolean">boolean</option>
            <option value="numeric_limit">numeric_limit</option>
            <option value="text">text</option>
            <option value="percentage">percentage</option>
            <option value="currency">currency</option>
            <option value="select">select</option>
            <option value="unlimited">unlimited</option>
            <option value="not_applicable">not_applicable</option>
          </select>
          <button type="submit" style={btn}>
            Create
          </button>
        </form>
      </PageCard>

      <PageCard style={{ padding: 20 }}>
        <SectionTitle title="Features" subtitle="Labels feed the public comparison chart automatically." />
        {!features.length ? (
          <EmptyState>No features.</EmptyState>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
                <th style={th}>Key</th>
                <th style={th}>Label</th>
                <th style={th}>Type</th>
                <th style={th}>Active</th>
                <th style={th}>Chart</th>
                <th style={th}>Order</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}` }}>
                  <td style={td}>{f.internal_key}</td>
                  <td style={td}>{f.public_label}</td>
                  <td style={td}>{f.value_type}</td>
                  <td style={td}>
                    <button type="button" style={linkish} onClick={() => toggleActive(f)}>
                      {f.active ? "Yes" : "No"}
                    </button>
                  </td>
                  <td style={td}>
                    <button type="button" style={linkish} onClick={() => toggleChart(f)}>
                      {f.visible_in_comparison_chart ? "Yes" : "No"}
                    </button>
                  </td>
                  <td style={td}>{f.display_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
    </OwnerLayout>
  );
}

const input = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 13,
};
const btn = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "none",
  background: OWNER_COLORS.accent,
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
const th = { padding: "8px 6px", fontWeight: 600 };
const td = { padding: "10px 6px", color: OWNER_COLORS.ink };
const linkish = {
  border: "none",
  background: "transparent",
  color: OWNER_COLORS.accent,
  fontWeight: 700,
  cursor: "pointer",
};
