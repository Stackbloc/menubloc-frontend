/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorQrKitOrder.jsx
 * File: OperatorQrKitOrder.jsx
 * Date: 2026-03-23
 * Purpose:
 *   Operator QR code kit ordering flow with package selection,
 *   branded preview, shipping confirmation, and mock payment.
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const PACKAGES = {
  starter: {
    key: "starter",
    name: "Starter Kit",
    price: "$9.99",
    amountCents: 999,
    description: "Great for getting started fast",
    details: "Covers your door and front counter",
    placements: ["Door", "Counter / Pickup"],
  },
  full: {
    key: "full",
    name: "Full Setup Kit",
    price: "$29.99",
    amountCents: 2999,
    description: "Fully equip your restaurant",
    details: "Covers your door, front counter, and tables",
    placements: ["Door", "Counter / Pickup", "Table Set"],
  },
};

function inputStyle() {
  return {
    width: "100%",
    border: "1px solid #d0d5dd",
    borderRadius: 12,
    padding: "12px 13px",
    fontSize: 14,
    color: "#101828",
    background: "#fff",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
}

function labelStyle() {
  return {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "#344054",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
}

export default function OperatorQrKitOrder() {
  const { selectedRestaurant } = useOperator();
  const [packageType, setPackageType] = useState("starter");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_address_1: "",
    shipping_address_2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "US",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (!selectedRestaurant?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.getProfile(selectedRestaurant.id)
      .then((result) => {
        const nextProfile = result?.profile || null;
        setProfile(nextProfile);
        setForm((current) => ({
          ...current,
          shipping_name: current.shipping_name || nextProfile?.restaurant_name || "",
          shipping_address_1: current.shipping_address_1 || nextProfile?.address_line1 || "",
          shipping_address_2: current.shipping_address_2 || nextProfile?.address_line2 || "",
          shipping_city: current.shipping_city || nextProfile?.city || "",
          shipping_state: current.shipping_state || nextProfile?.state || "",
          shipping_postal_code: current.shipping_postal_code || nextProfile?.postal_code || "",
          shipping_country: current.shipping_country || "US",
        }));
      })
      .catch((err) => setError(err.message || "Unable to load restaurant details."))
      .finally(() => setLoading(false));
  }, [selectedRestaurant]);

  const selectedPackage = PACKAGES[packageType];
  const rid = selectedRestaurant?.id;

  const previewPlacements = useMemo(
    () => selectedPackage.placements.map((placement) => ({
      label: placement,
      previewUrl: rid
        ? api.getQrKitPreviewUrl(rid, {
            package_type: packageType,
            placement:
              placement === "Counter / Pickup"
                ? "counter"
                : placement === "Table Set"
                  ? "table"
                  : "door",
          })
        : "",
    })),
    [packageType, rid, selectedPackage.placements]
  );

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!rid) return;

    setSubmitting(true);
    setError("");
    try {
      const result = await api.createQrKitOrder(rid, {
        package_type: packageType,
        ...form,
      });
      setConfirmation(result);
    } catch (err) {
      setError(err.message || "Unable to place QR kit order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectedRestaurant) {
    return (
      <OperatorLayout title="Order QR Code Kit">
        <div style={{ maxWidth: 560, background: "#fff", border: "1px solid #eaecf0", borderRadius: 20, padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: "#101828" }}>No restaurant selected</h2>
          <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.7, color: "#475467" }}>
            Link a restaurant to your operator account before ordering a QR code kit.
          </p>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Order QR Code Kit">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <section
          style={{
            background: "linear-gradient(135deg, #102b22 0%, #1f4e3d 52%, #dff2e7 100%)",
            borderRadius: 28,
            padding: "28px 24px",
            color: "#fff",
            boxShadow: "0 24px 64px rgba(16, 43, 34, 0.18)",
          }}
        >
          <div style={{ display: "inline-flex", padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,0.12)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            Physical Setup
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.96, letterSpacing: "-0.06em", maxWidth: 720 }}>
            Get your restaurant physically set up in minutes
          </h1>
          <p style={{ margin: "14px 0 0", maxWidth: 760, fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>
            Make your menu instantly scannable. Put your menu at the door, counter, and tables, and send customers straight to your Grubbid menu.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {[
              "Door QR",
              "Counter / Pickup QR",
              "Table Set for dine-in",
              "No printing setup required",
            ].map((line) => (
              <div key={line} style={{ padding: "9px 12px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)", fontSize: 12, fontWeight: 700 }}>
                {line}
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <div style={{ marginTop: 20, background: "#fef3f2", border: "1px solid #fecdca", color: "#b42318", borderRadius: 16, padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        ) : null}

        {confirmation ? (
          <section style={{ marginTop: 22, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 22, padding: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Order Confirmed
            </div>
            <h2 style={{ margin: 0, fontSize: 28, color: "#101828", letterSpacing: "-0.04em" }}>
              Your QR kit has been submitted for fulfillment
            </h2>
            <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.7, color: "#344054", maxWidth: 760 }}>
              Your QR codes link customers directly to your Grubbid menu. Print assets were generated and the order was submitted through the printer provider wrapper.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
              <InfoTile label="Package" value={confirmation.order?.package_type === "full" ? "Full Setup Kit" : "Starter Kit"} />
              <InfoTile label="Status" value={confirmation.order?.status || "submitted"} />
              <InfoTile label="Payment" value={confirmation.order?.payment_reference || "mock"} />
              <InfoTile label="Printer Ref" value={confirmation.order?.printer_order_reference || "pending"} mono />
            </div>
            {confirmation.assets?.length ? (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#166534", marginBottom: 10 }}>
                  Generated Assets
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
                  {confirmation.assets.map((asset) => (
                    <div key={asset.key} style={{ background: "#fff", border: "1px solid #d1fadf", borderRadius: 18, overflow: "hidden" }}>
                      <img src={asset.file_url} alt={asset.label} style={{ display: "block", width: "100%", aspectRatio: "4 / 5", objectFit: "cover", background: "#f8fafc" }} />
                      <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#101828" }}>{asset.label}</div>
                        <div style={{ marginTop: 4, fontSize: 13, color: "#475467" }}>Qty {asset.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 20, marginTop: 24 }}>
          <section style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Step 1
              </div>
              <h2 style={{ margin: 0, fontSize: 26, color: "#101828", letterSpacing: "-0.04em" }}>Choose your QR code kit</h2>
              <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.7, color: "#475467", maxWidth: 650 }}>
                Keep the decision simple. Pick the package that matches how much of the restaurant you want to cover right now.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 18 }}>
                {Object.values(PACKAGES).map((pkg) => {
                  const active = packageType === pkg.key;
                  return (
                    <button
                      key={pkg.key}
                      onClick={() => setPackageType(pkg.key)}
                      style={{
                        textAlign: "left",
                        background: active ? "#fff6f5" : "#fff",
                        border: active ? "2px solid #b42318" : "1px solid #d0d5dd",
                        borderRadius: 20,
                        padding: 18,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        boxShadow: active ? "0 16px 36px rgba(180, 35, 24, 0.08)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 19, fontWeight: 800, color: "#101828" }}>{pkg.name}</div>
                          <div style={{ marginTop: 5, fontSize: 14, color: "#475467", fontWeight: 600 }}>{pkg.description}</div>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#b42318", letterSpacing: "-0.04em" }}>{pkg.price}</div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#475467" }}>{pkg.details}</div>
                      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                        {pkg.placements.map((placement) => (
                          <div key={placement} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#101828", fontWeight: 700 }}>
                            <span style={{ color: "#b42318" }}>✓</span>
                            <span>{placement}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Step 2
              </div>
              <h2 style={{ margin: 0, fontSize: 26, color: "#101828", letterSpacing: "-0.04em" }}>Preview your kit</h2>
              <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.7, color: "#475467" }}>
                Your QR codes link customers directly to your Grubbid menu. Make your menu instantly scannable and accessible with a simple physical setup.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginTop: 18 }}>
                {previewPlacements.map((preview) => (
                  <div key={preview.label} style={{ border: "1px solid #eaecf0", borderRadius: 18, overflow: "hidden", background: "#f8fafc" }}>
                    <div style={{ padding: "12px 14px", background: "#fff" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#101828" }}>{preview.label}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "#667085" }}>
                        {profile?.restaurant_name || selectedRestaurant.restaurant_name}
                      </div>
                    </div>
                    <img src={preview.previewUrl} alt={`${preview.label} QR preview`} style={{ display: "block", width: "100%", aspectRatio: "4 / 5", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ display: "grid", gap: 18 }}>
            <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Step 3
              </div>
              <h2 style={{ margin: 0, fontSize: 26, color: "#101828", letterSpacing: "-0.04em" }}>Confirm shipping and payment</h2>
              <p style={{ margin: "10px 0 18px", fontSize: 15, lineHeight: 1.7, color: "#475467" }}>
                Fast activation flow. Confirm where to ship and place the order. Payment is mocked for now, but the flow is structured for Stripe later.
              </p>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={labelStyle()}>Shipping Name</label>
                  <input style={inputStyle()} value={form.shipping_name} onChange={(e) => setField("shipping_name", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle()}>Address Line 1</label>
                  <input style={inputStyle()} value={form.shipping_address_1} onChange={(e) => setField("shipping_address_1", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle()}>Address Line 2</label>
                  <input style={inputStyle()} value={form.shipping_address_2} onChange={(e) => setField("shipping_address_2", e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle()}>City</label>
                    <input style={inputStyle()} value={form.shipping_city} onChange={(e) => setField("shipping_city", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle()}>State</label>
                    <input style={inputStyle()} value={form.shipping_state} onChange={(e) => setField("shipping_state", e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle()}>Postal Code</label>
                    <input style={inputStyle()} value={form.shipping_postal_code} onChange={(e) => setField("shipping_postal_code", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle()}>Country</label>
                    <input style={inputStyle()} value={form.shipping_country} onChange={(e) => setField("shipping_country", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Payment Step
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#101828", letterSpacing: "-0.04em" }}>
                  {selectedPackage.price}
                </div>
                <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, color: "#7c2d12", fontWeight: 600 }}>
                  Mock payment placeholder. This is structured so Stripe can be inserted later without rewriting the order flow.
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                style={{
                  width: "100%",
                  marginTop: 18,
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 16px",
                  background: submitting ? "#98a2b3" : "#b42318",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 18px 34px rgba(180, 35, 24, 0.18)",
                }}
              >
                {submitting ? "Submitting QR Kit Order…" : `Pay ${selectedPackage.price} and Submit Order`}
              </button>
            </form>

            <div style={{ background: "#ffffff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Why this works
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  "Your QR codes link customers directly to your Grubbid menu",
                  "Make your menu instantly scannable and accessible",
                  "Put your menu at the door, counter, and tables",
                  "No printing setup required",
                ].map((line) => (
                  <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ color: "#b42318", fontSize: 16 }}>✓</span>
                    <span style={{ fontSize: 14, lineHeight: 1.55, color: "#101828", fontWeight: 600 }}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </OperatorLayout>
  );
}

function InfoTile({ label, value, mono = false }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #d1fadf", borderRadius: 16, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#166534", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#101828", fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit", wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}
