/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorCartNegotiationSettings.jsx
 * File: OperatorCartNegotiationSettings.jsx
 * Date: 2026-04-06
 * Purpose:
 *   Restaurant settings page for GrubBid Bid-Free Bidding™.
 * ============================================================
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const CARD = {
  background: "#fff",
  border: "1px solid #e4e9f0",
  borderRadius: 16,
  padding: "22px 24px",
  marginBottom: 20,
};

const INPUT = {
  width: "100%",
  border: "1px solid #d6dde7",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  boxSizing: "border-box",
  background: "#fff",
};

const marginOptions = [
  { label: "Conservative", value: 24 },
  { label: "Balanced", value: 18 },
  { label: "Aggressive", value: 14 },
];

const frequencyOptions = [
  { label: "Rare", value: 5 },
  { label: "Occasional", value: 8 },
  { label: "Frequent", value: 12 },
];

const maxSavingsOptions = [3, 5, 7, 10];
const minimumOrderOptions = [35, 50, 75];
const dailyCapOptions = [10, 25, 50];

function defaultSlowHoursSchedule() {
  return {
    mode: "slow_hours_only",
    windows: [{ days: [1, 2, 3, 4, 5, 6, 7], start: "14:00", end: "17:00" }],
  };
}

function defaultCustomSchedule() {
  return {
    mode: "custom_schedule",
    windows: [{ days: [1, 2, 3, 4, 5, 6, 7], start: "14:00", end: "17:00" }],
  };
}

function scheduleModeForValue(value) {
  if (!value) return "Anytime";
  if (value.mode === "slow_hours_only") return "Slow hours only";
  return "Custom schedule";
}

function getFriendlyMarginLabel(value) {
  return marginOptions.find((option) => Number(option.value) === Number(value))?.label || "Balanced";
}

function getFriendlyFrequencyLabel(value) {
  return frequencyOptions.find((option) => Number(option.value) === Number(value))?.label || "Rare";
}

function Field({ label, helper, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f1720", marginBottom: 6 }}>{label}</div>
      {children}
      {helper ? <div style={{ marginTop: 6, fontSize: 12, color: "#667085", lineHeight: 1.5 }}>{helper}</div> : null}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        border: "none",
        background: checked ? "#124734" : "#cdd5df",
        position: "relative",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 120ms ease",
        }}
      />
    </button>
  );
}

export default function OperatorCartNegotiationSettings() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const [settings, setSettings] = useState({
    negotiation_enabled: false,
    negotiation_min_cart_subtotal: 35,
    negotiation_max_discount_pct: 10,
    negotiation_margin_floor_pct: 18,
    negotiation_rarity_pct: 5,
    negotiation_daily_cap: 25,
    negotiation_allowed_hours: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unlockSettings, setUnlockSettings] = useState({
    unlock_savings_enabled: false,
    unlock_savings_thresholds: [30, 35, 40, 50],
    unlock_savings_max_discount_pct: 10,
    unlock_savings_margin_floor_pct: 18,
    unlock_savings_allowed_hours: null,
  });
  const [unlockThresholdInput, setUnlockThresholdInput] = useState(unlockSettings.unlock_savings_thresholds.join(","));
  const [unlockLoading, setUnlockLoading] = useState(true);
  const [unlockSaving, setUnlockSaving] = useState(false);
  const [unlockSaved, setUnlockSaved] = useState(false);

  const scheduleMode = useMemo(
    () => scheduleModeForValue(settings.negotiation_allowed_hours),
    [settings.negotiation_allowed_hours]
  );

  const load = useCallback(async () => {
    if (!rid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [negotiationResponse, unlockResponse] = await Promise.all([
        api.getCartNegotiationSettings(rid),
        api.getUnlockSavingsSettings(rid),
      ]);
      if (negotiationResponse.ok) {
        setSettings((current) => ({ ...current, ...(negotiationResponse.settings || {}) }));
      }
      if (unlockResponse.ok) {
        const unlock = unlockResponse.settings || {};
        setUnlockSettings(unlock);
        setUnlockThresholdInput((unlock.unlock_savings_thresholds || [30, 35, 40, 50]).join(","));
      }
    } catch (error) {
      window.alert(error.message || "Failed to load Bid-Free Bidding™ settings.");
    } finally {
      setLoading(false);
      setUnlockLoading(false);
    }
  }, [rid]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!rid) return;
    setSaving(true);
    setSaved(false);
    try {
      const response = await api.updateCartNegotiationSettings(rid, settings);
      setSettings((current) => ({ ...current, ...(response.settings || {}) }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      window.alert(error.message || "Failed to save Bid-Free Bidding™ settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlockSave() {
    if (!rid) return;
    setUnlockSaving(true);
    setUnlockSaved(false);
    try {
      const payload = {
        unlock_savings_enabled: unlockSettings.unlock_savings_enabled,
        unlock_savings_thresholds: unlockThresholdInput.split(",").map((entry) => parseFloat(entry.trim())).filter((value) => !Number.isNaN(value)),
        unlock_savings_max_discount_pct: Number(unlockSettings.unlock_savings_max_discount_pct),
        unlock_savings_margin_floor_pct: Number(unlockSettings.unlock_savings_margin_floor_pct),
        unlock_savings_allowed_hours: unlockSettings.unlock_savings_allowed_hours,
      };
      const response = await api.updateUnlockSavingsSettings(rid, payload);
      if (response.ok && response.settings) {
        setUnlockSettings(response.settings);
        setUnlockThresholdInput((response.settings.unlock_savings_thresholds || []).join(","));
      }
      setUnlockSaved(true);
      setTimeout(() => setUnlockSaved(false), 2500);
    } catch (error) {
      window.alert(error.message || "Failed to save unlock savings settings.");
    } finally {
      setUnlockSaving(false);
    }
  }

  if (!rid) {
    return (
      <OperatorLayout title="Bid-Free Bidding™">
        <p style={{ color: "#667085" }}>Select a restaurant first.</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Bid-Free Bidding™">
      <div style={{ maxWidth: 760 }}>
        <div style={CARD}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f1720", marginBottom: 8 }}>Bid-Free Bidding™</div>
          <div style={{ fontSize: 15, color: "#344054", lineHeight: 1.6, marginBottom: 10 }}>
            Bid-Free Bidding™ lets GrubBid apply occasional, controlled savings to qualifying orders—within the limits you set.
          </div>
          <div style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, marginBottom: 16 }}>
            It never applies to items already on deal and always stays within your pricing protections.
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 14, padding: "16px 18px", border: "1px solid #e4e9f0", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: "#0f1720", marginBottom: 6 }}>Bid-Free Bidding™</div>
            <div style={{ fontSize: 14, color: "#344054", lineHeight: 1.6 }}>
              Let GrubBid apply occasional, controlled savings to qualifying orders—within the limits you set.
            </div>
            <div style={{ fontSize: 14, color: "#344054", lineHeight: 1.6 }}>
              Increase order opportunities while protecting your margins.
            </div>
          </div>
          <div style={{ display: "grid", gap: 6, fontSize: 13, color: "#475467" }}>
            <div>You stay in control at all times.</div>
            <div>Only applies to qualifying orders.</div>
            <div>Never applies to items already on deal.</div>
            <div>Always respects your pricing limits.</div>
            <div>Designed to help increase order opportunities while protecting your margins.</div>
          </div>
        </div>

        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>Bid-Free Bidding™</div>
              <div style={{ fontSize: 14, color: "#475467", lineHeight: 1.6 }}>
                Apply occasional, controlled savings to qualifying orders—within the limits you set.
              </div>
              <div style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, marginTop: 6 }}>
                GrubBid can automatically apply small savings to select qualifying orders based on the settings you choose. It never applies to items already on deal and always respects your pricing protections.
              </div>
            </div>
            <Toggle
              checked={settings.negotiation_enabled === true}
              onChange={(value) => setSettings((current) => ({ ...current, negotiation_enabled: value }))}
            />
          </div>
          <div style={{ fontSize: 13, color: "#667085" }}>
            Enable Bid-Free Bidding™
          </div>
          <div style={{ fontSize: 12, color: "#98a2b3", marginTop: 4 }}>
            Allow GrubBid to occasionally apply controlled savings to qualifying orders.
          </div>
        </div>

        <div style={{ ...CARD, opacity: loading ? 0.65 : 1 }}>
          {loading ? (
            <div style={{ color: "#667085" }}>Loading…</div>
          ) : (
            <>
              <Field label="Minimum order for savings">
                <select
                  value={Number(settings.negotiation_min_cart_subtotal || 35)}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    negotiation_min_cart_subtotal: Number(event.target.value),
                  }))}
                  style={INPUT}
                >
                  {minimumOrderOptions.map((value) => (
                    <option key={value} value={value}>${value.toFixed(2)}</option>
                  ))}
                </select>
              </Field>

              <Field label="Maximum savings allowed">
                <select
                  value={Number(settings.negotiation_max_discount_pct || 10)}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    negotiation_max_discount_pct: Number(event.target.value),
                  }))}
                  style={INPUT}
                >
                  {maxSavingsOptions.map((value) => (
                    <option key={value} value={value}>{value}%</option>
                  ))}
                </select>
              </Field>

              <Field label="Margin protection" helper={`Current: ${getFriendlyMarginLabel(settings.negotiation_margin_floor_pct)}`}>
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  {marginOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setSettings((current) => ({ ...current, negotiation_margin_floor_pct: option.value }))}
                      style={{
                        borderRadius: 12,
                        border: Number(settings.negotiation_margin_floor_pct) === option.value ? "2px solid #124734" : "1px solid #d6dde7",
                        background: Number(settings.negotiation_margin_floor_pct) === option.value ? "#eef8f2" : "#fff",
                        padding: "12px 14px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>{option.label}</div>
                      <div style={{ fontSize: 12, color: "#667085" }}>{option.value}% floor</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="How often should savings be applied?" helper={`Current: ${getFriendlyFrequencyLabel(settings.negotiation_rarity_pct)}`}>
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  {frequencyOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setSettings((current) => ({ ...current, negotiation_rarity_pct: option.value }))}
                      style={{
                        borderRadius: 12,
                        border: Number(settings.negotiation_rarity_pct) === option.value ? "2px solid #124734" : "1px solid #d6dde7",
                        background: Number(settings.negotiation_rarity_pct) === option.value ? "#eef8f2" : "#fff",
                        padding: "12px 14px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>{option.label}</div>
                      <div style={{ fontSize: 12, color: "#667085" }}>{option.value}% rarity</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Max discounted orders per day">
                <select
                  value={Number(settings.negotiation_daily_cap || 25)}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    negotiation_daily_cap: Number(event.target.value),
                  }))}
                  style={INPUT}
                >
                  {dailyCapOptions.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </Field>

              <Field label="When can savings be offered?" helper={`Current: ${scheduleMode}`}>
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginBottom: 12 }}>
                  {["Anytime", "Slow hours only", "Custom schedule"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        if (option === "Anytime") {
                          setSettings((current) => ({ ...current, negotiation_allowed_hours: null }));
                          return;
                        }
                        if (option === "Slow hours only") {
                          setSettings((current) => ({ ...current, negotiation_allowed_hours: defaultSlowHoursSchedule() }));
                          return;
                        }
                        setSettings((current) => ({ ...current, negotiation_allowed_hours: defaultCustomSchedule() }));
                      }}
                      style={{
                        borderRadius: 12,
                        border: scheduleMode === option ? "2px solid #124734" : "1px solid #d6dde7",
                        background: scheduleMode === option ? "#eef8f2" : "#fff",
                        padding: "12px 14px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#0f1720" }}>{option}</div>
                    </button>
                  ))}
                </div>

                {scheduleMode !== "Anytime" ? (
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#475467", marginBottom: 6 }}>Start</div>
                      <input
                        type="time"
                        value={settings.negotiation_allowed_hours?.windows?.[0]?.start || "14:00"}
                        onChange={(event) => setSettings((current) => ({
                          ...current,
                          negotiation_allowed_hours: {
                            ...(current.negotiation_allowed_hours || defaultCustomSchedule()),
                            windows: [{
                              ...(current.negotiation_allowed_hours?.windows?.[0] || defaultCustomSchedule().windows[0]),
                              start: event.target.value,
                            }],
                          },
                        }))}
                        style={INPUT}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#475467", marginBottom: 6 }}>End</div>
                      <input
                        type="time"
                        value={settings.negotiation_allowed_hours?.windows?.[0]?.end || "17:00"}
                        onChange={(event) => setSettings((current) => ({
                          ...current,
                          negotiation_allowed_hours: {
                            ...(current.negotiation_allowed_hours || defaultCustomSchedule()),
                            windows: [{
                              ...(current.negotiation_allowed_hours?.windows?.[0] || defaultCustomSchedule().windows[0]),
                              end: event.target.value,
                            }],
                          },
                        }))}
                        style={INPUT}
                      />
                    </div>
                  </div>
                ) : null}
              </Field>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    border: "none",
                    borderRadius: 12,
                    background: saving ? "#98a2b3" : "#124734",
                    color: "#fff",
                    padding: "12px 18px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving…" : "Save settings"}
                </button>
                {saved ? <div style={{ fontSize: 13, color: "#027a48", fontWeight: 700 }}>Saved.</div> : null}
              </div>
            </>
          )}
        </div>

        <div style={{ ...CARD, opacity: unlockLoading ? 0.65 : 1 }}>
          {unlockLoading ? (
            <div style={{ color: "#667085" }}>Loading unlock savings…</div>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f1720", marginBottom: 8 }}>Unlock Savings</div>
              <div style={{ fontSize: 14, color: "#475467", marginBottom: 12 }}>
                Trigger small savings when customers reach a spend tier. A gentle reminder keeps the incentive consistent and margin-safe.
              </div>
              <Field label="Enable unlock savings">
                <Toggle
                  checked={unlockSettings.unlock_savings_enabled === true}
                  onChange={(value) => setUnlockSettings((current) => ({
                    ...current,
                    unlock_savings_enabled: value,
                  }))}
                />
              </Field>
              <Field label="Threshold tiers" helper="Enter comma-separated spend tiers in dollars">
                <input
                  value={unlockThresholdInput}
                  onChange={(event) => setUnlockThresholdInput(event.target.value)}
                  style={INPUT}
                />
              </Field>
              <Field label="Maximum savings percent">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={unlockSettings.unlock_savings_max_discount_pct}
                  onChange={(event) =>
                    setUnlockSettings((current) => ({
                      ...current,
                      unlock_savings_max_discount_pct: Number(event.target.value),
                    }))
                  }
                  style={INPUT}
                />
              </Field>
              <Field label="Margin protection">
                <input
                  type="number"
                  min={10}
                  max={40}
                  value={unlockSettings.unlock_savings_margin_floor_pct}
                  onChange={(event) =>
                    setUnlockSettings((current) => ({
                      ...current,
                      unlock_savings_margin_floor_pct: Number(event.target.value),
                    }))
                  }
                  style={INPUT}
                />
              </Field>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={handleUnlockSave}
                  disabled={unlockSaving}
                  style={{
                    border: "none",
                    borderRadius: 12,
                    background: unlockSaving ? "#98a2b3" : "#0f1720",
                    color: "#fff",
                    padding: "12px 18px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: unlockSaving ? "wait" : "pointer",
                  }}
                >
                  {unlockSaving ? "Saving…" : "Save unlock savings"}
                </button>
                {unlockSaved ? <div style={{ fontSize: 13, color: "#027a48", fontWeight: 700 }}>Saved.</div> : null}
              </div>
            </>
          )}
        </div>

        <div style={CARD}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0f1720", marginBottom: 14 }}>Restaurant FAQ</div>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>What is Bid-Free Bidding™?</div>
              <div style={{ fontSize: 14, color: "#475467", lineHeight: 1.6 }}>
                Bid-Free Bidding™ lets GrubBid apply occasional, controlled savings to qualifying orders—within the limits you set.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>Do savings stack on top of my existing deals?</div>
              <div style={{ fontSize: 14, color: "#475467", lineHeight: 1.6 }}>
                No. Items already on deal are excluded.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>Do I control the limits?</div>
              <div style={{ fontSize: 14, color: "#475467", lineHeight: 1.6 }}>
                Yes. You control minimum order size, maximum savings, margin protection, frequency, and more.
              </div>
            </div>
          </div>
        </div>
      </div>
    </OperatorLayout>
  );
}
