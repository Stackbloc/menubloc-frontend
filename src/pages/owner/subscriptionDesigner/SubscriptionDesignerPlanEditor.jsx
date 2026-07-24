import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import {
  createSdPlan,
  getSdPlan,
  listSdFeatures,
  updateSdPlan,
} from "../../../lib/ownerApi.js";

const emptyForm = {
  internal_key: "",
  public_name: "",
  short_description: "",
  full_description: "",
  restaurant_type: "restaurant",
  status_tone: "subscriber",
  active: true,
  archived: false,
  publicly_available: false,
  visible_in_comparison_chart: false,
  online_ordering_enabled: false,
  featured: false,
  badge_text: "",
  cta_text: "",
  chart_column_key: "",
  chart_name_color: "#1F4E3D",
  commission_rate_bps: "",
  commission_lock_months: "",
  commission_display: "",
  chart_footnote: "",
  display_order: 0,
  prices_json: "[]",
  feature_values: [],
};

export default function SubscriptionDesignerPlanEditor() {
  const { planId } = useParams();
  const isNew = !planId || planId === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [features, setFeatures] = useState([]);
  const [pricingMismatches, setPricingMismatches] = useState([]);
  const [ackMismatch, setAckMismatch] = useState(false);
  const [ackCommission, setAckCommission] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const featRes = await listSdFeatures();
        if (!cancelled) setFeatures(featRes.features || []);
        if (!isNew) {
          const res = await getSdPlan(planId);
          const p = res.plan;
          if (!p || cancelled) return;
          const fvMap = new Map((p.feature_values || []).map((v) => [v.feature_id, v]));
          setForm({
            ...emptyForm,
            ...p,
            commission_rate_bps: p.commission_rate_bps ?? "",
            commission_lock_months: p.commission_lock_months ?? "",
            badge_text: p.badge_text || "",
            cta_text: p.cta_text || "",
            chart_column_key: p.chart_column_key || "",
            chart_name_color: p.chart_name_color || "#1F4E3D",
            commission_display: p.commission_display || "",
            chart_footnote: p.chart_footnote || "",
            prices_json: JSON.stringify(p.prices || [], null, 2),
            feature_values: (featRes.features || []).map((f) => {
              const v = fvMap.get(f.id) || {};
              return {
                feature_id: f.id,
                feature_key: f.internal_key,
                label: f.public_label,
                boolean_value: v.boolean_value ?? null,
                text_value: v.text_value || "",
                public_display_value: v.public_display_value || "",
                unlimited: Boolean(v.unlimited),
                not_applicable: Boolean(v.not_applicable),
                numeric_value: v.numeric_value ?? "",
              };
            }),
          });
          setPricingMismatches(p.pricing_mismatches || []);
          setAckMismatch(false);
          setAckCommission(false);
        } else if (!cancelled) {
          setForm((prev) => ({
            ...prev,
            feature_values: (featRes.features || []).map((f) => ({
              feature_id: f.id,
              feature_key: f.internal_key,
              label: f.public_label,
              boolean_value: false,
              text_value: "",
              public_display_value: "",
              unlimited: false,
              not_applicable: false,
              numeric_value: "",
            })),
          }));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, planId]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setFeatureValue(idx, patch) {
    setForm((prev) => {
      const next = [...prev.feature_values];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, feature_values: next };
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let prices;
      try {
        prices = JSON.parse(form.prices_json || "[]");
      } catch {
        throw new Error("Public prices JSON is invalid");
      }
      const body = {
        public_name: form.public_name,
        short_description: form.short_description || null,
        full_description: form.full_description || null,
        restaurant_type: form.restaurant_type,
        status_tone: form.status_tone,
        active: Boolean(form.active),
        archived: Boolean(form.archived),
        publicly_available: Boolean(form.publicly_available),
        visible_in_comparison_chart: Boolean(form.visible_in_comparison_chart),
        online_ordering_enabled: Boolean(form.online_ordering_enabled),
        featured: Boolean(form.featured),
        badge_text: form.badge_text || null,
        cta_text: form.cta_text || null,
        chart_column_key: form.chart_column_key || null,
        chart_name_color: form.chart_name_color || null,
        commission_rate_bps:
          form.commission_rate_bps === "" ? null : Number(form.commission_rate_bps),
        commission_lock_months:
          form.commission_lock_months === "" ? null : Number(form.commission_lock_months),
        commission_display: form.commission_display || null,
        chart_footnote: form.chart_footnote || null,
        display_order: Number(form.display_order) || 0,
        prices,
        acknowledge_display_billing_mismatch: Boolean(ackMismatch),
        acknowledge_commission_rate_change: Boolean(ackCommission),
        feature_values: form.feature_values.map((v) => ({
          feature_id: v.feature_id,
          boolean_value:
            v.public_display_value || v.text_value
              ? null
              : v.boolean_value == null
                ? null
                : Boolean(v.boolean_value),
          text_value: v.text_value || null,
          public_display_value: v.public_display_value || null,
          unlimited: Boolean(v.unlimited),
          not_applicable: Boolean(v.not_applicable),
          numeric_value: v.numeric_value === "" ? null : Number(v.numeric_value),
        })),
      };
      if (isNew) {
        body.internal_key = form.internal_key;
        const res = await createSdPlan(body);
        navigate(`/owner/subscription-designer/plans/${res.plan.id}`, { replace: true });
      } else {
        await updateSdPlan(planId, body);
        navigate("/owner/subscription-designer");
      }
    } catch (err) {
      setError(err.message || "Save failed");
      const mismatches = err.pricing_mismatches || err.payload?.pricing_mismatches;
      if (Array.isArray(mismatches)) {
        setPricingMismatches(mismatches);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <OwnerLayout title="Plan editor">
        <PageCard style={{ padding: 20 }}>Loading…</PageCard>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout
      title={isNew ? "Create plan" : `Edit ${form.public_name || "plan"}`}
      actions={
        <Link to="/owner/subscription-designer" style={{ color: OWNER_COLORS.accent, fontWeight: 600 }}>
          ← Back to plans
        </Link>
      }
    >
      <form onSubmit={handleSave}>
        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <SectionTitle title="Basic information" />
          {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
          <div style={grid}>
            {isNew ? (
              <label style={label}>
                Internal key (immutable)
                <input
                  required
                  value={form.internal_key}
                  onChange={(e) => setField("internal_key", e.target.value)}
                  style={input}
                />
              </label>
            ) : (
              <div style={label}>
                Internal key
                <div style={{ marginTop: 6, fontWeight: 700 }}>{form.internal_key}</div>
              </div>
            )}
            <label style={label}>
              Public name
              <input
                required
                value={form.public_name}
                onChange={(e) => setField("public_name", e.target.value)}
                style={input}
              />
            </label>
            <label style={label}>
              Restaurant type
              <select
                value={form.restaurant_type}
                onChange={(e) => setField("restaurant_type", e.target.value)}
                style={input}
              >
                <option value="restaurant">restaurant</option>
                <option value="food_truck">food_truck</option>
                <option value="any">any</option>
              </select>
            </label>
            <label style={label}>
              Status tone
              <select
                value={form.status_tone}
                onChange={(e) => setField("status_tone", e.target.value)}
                style={input}
              >
                <option value="nonsubscriber">nonsubscriber</option>
                <option value="standard">standard</option>
                <option value="subscriber">subscriber</option>
              </select>
            </label>
            <label style={label}>
              Chart column key
              <input
                value={form.chart_column_key}
                onChange={(e) => setField("chart_column_key", e.target.value)}
                style={input}
                placeholder="published | starter | founders"
              />
            </label>
            <label style={label}>
              Chart name color
              <input
                value={form.chart_name_color}
                onChange={(e) => setField("chart_name_color", e.target.value)}
                style={input}
              />
            </label>
            <label style={label}>
              Commission BPS (machine value)
              <input
                value={form.commission_rate_bps}
                onChange={(e) => setField("commission_rate_bps", e.target.value)}
                style={input}
                placeholder="1100"
              />
            </label>
            <label style={label}>
              Commission lock months
              <input
                value={form.commission_lock_months}
                onChange={(e) => setField("commission_lock_months", e.target.value)}
                style={input}
              />
            </label>
            <label
              style={{
                ...label,
                gridColumn: "1 / -1",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                checked={ackCommission}
                onChange={(e) => setAckCommission(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                I confirm this commission BPS change applies only to future eligible orders for restaurants
                on this plan, and does not change Stripe products, subscription prices, credentials, or
                historical transactions.
              </span>
            </label>
            <label style={{ ...label, gridColumn: "1 / -1" }}>
              Commission display (public chart text only)
              <input
                value={form.commission_display}
                onChange={(e) => setField("commission_display", e.target.value)}
                style={input}
                placeholder="11% commission"
              />
            </label>
            <div
              style={{
                gridColumn: "1 / -1",
                marginTop: 4,
                padding: 12,
                borderRadius: 10,
                background: "#fff8e6",
                border: "1px solid #f0d48a",
                color: "#7a5b00",
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              This commission rate controls the Menuply platform fee applied to future eligible orders.
              Changing it affects real transaction calculations. It does not modify Stripe products,
              subscription prices, credentials, or existing transactions. Payment calculation uses the
              machine BPS value only — not the public display text.
            </div>
            <label style={{ ...label, gridColumn: "1 / -1" }}>
              Short description
              <input
                value={form.short_description}
                onChange={(e) => setField("short_description", e.target.value)}
                style={input}
              />
            </label>
            <label style={{ ...label, gridColumn: "1 / -1" }}>
              Chart footnote
              <textarea
                value={form.chart_footnote}
                onChange={(e) => setField("chart_footnote", e.target.value)}
                style={{ ...input, minHeight: 72 }}
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14 }}>
            {[
              ["active", "Active"],
              ["publicly_available", "Publicly available"],
              ["visible_in_comparison_chart", "Visible in chart"],
              ["online_ordering_enabled", "Online ordering"],
              ["featured", "Featured"],
            ].map(([key, labelText]) => (
              <label key={key} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => setField(key, e.target.checked)}
                />
                {labelText}
              </label>
            ))}
          </div>
        </PageCard>

        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <SectionTitle
            title="Public display prices"
            subtitle="Public Monthly / Annual / One-Time display amounts (integer cents)."
          />
          <p style={{ margin: "0 0 10px", fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.5 }}>
            These prices control Menuply’s public plan display only.
            Stripe billing prices are managed separately through the secure billing system.
            Changing a displayed price does not modify Stripe or existing subscriptions.
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: OWNER_COLORS.muted }}>
            JSON rows use <code>billing_interval</code> (<code>month</code> / <code>year</code> /{" "}
            <code>one_time</code>), <code>amount_cents</code>, and <code>public_price_label</code>. Optional{" "}
            <code>checkout_plan_code</code> links to the billing catalog for mismatch warnings only.
          </p>
          {pricingMismatches.length ? (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 10,
                background: "#fff8e6",
                border: "1px solid #f0d48a",
                color: "#7a5b00",
                fontSize: 13,
                whiteSpace: "pre-wrap",
              }}
            >
              <strong>Pricing configuration mismatch</strong>
              {"\n"}
              {pricingMismatches.map((m) => m.warning_body || `${m.public_display_label} vs ${m.billing_catalog_label}`).join("\n\n")}
            </div>
          ) : null}
          <textarea
            value={form.prices_json}
            onChange={(e) => setField("prices_json", e.target.value)}
            style={{ ...input, minHeight: 160, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
            aria-label="Public display prices JSON"
          />
          {(form.publicly_available || pricingMismatches.length > 0) && (
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={ackMismatch}
                onChange={(e) => setAckMismatch(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                I understand that this changes only the public displayed price and does not change Stripe
                billing.
              </span>
            </label>
          )}
        </PageCard>

        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <SectionTitle title="Feature values" subtitle="Machine value vs public display for the chart." />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {form.feature_values.map((v, idx) => (
              <div
                key={v.feature_id}
                style={{
                  border: `1px solid ${OWNER_COLORS.line}`,
                  borderRadius: 10,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{v.label}</div>
                <label style={{ fontSize: 12 }}>
                  Enabled
                  <input
                    type="checkbox"
                    checked={v.boolean_value === true}
                    onChange={(e) =>
                      setFeatureValue(idx, {
                        boolean_value: e.target.checked,
                        text_value: "",
                        public_display_value: "",
                      })
                    }
                  />
                </label>
                <input
                  placeholder="Public display (e.g. Limited)"
                  value={v.public_display_value}
                  onChange={(e) =>
                    setFeatureValue(idx, {
                      public_display_value: e.target.value,
                      boolean_value: e.target.value ? null : v.boolean_value,
                    })
                  }
                  style={input}
                />
                <input
                  placeholder="Text value"
                  value={v.text_value}
                  onChange={(e) => setFeatureValue(idx, { text_value: e.target.value })}
                  style={input}
                />
              </div>
            ))}
            {!form.feature_values.length ? (
              <div style={{ color: OWNER_COLORS.muted }}>No features in catalog yet.</div>
            ) : null}
          </div>
        </PageCard>

        <button type="submit" disabled={saving} style={saveBtn}>
          {saving ? "Saving…" : "Save plan"}
        </button>
      </form>
    </OwnerLayout>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};
const label = { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: OWNER_COLORS.muted };
const input = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 13,
  color: OWNER_COLORS.ink,
};
const saveBtn = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: OWNER_COLORS.accent,
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
