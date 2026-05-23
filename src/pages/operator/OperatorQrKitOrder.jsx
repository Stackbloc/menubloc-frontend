import { useEffect, useMemo, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import StripeElementsProvider from "../../components/payments/StripeElementsProvider.jsx";
import PlatformPaymentForm from "../../components/payments/PlatformPaymentForm.jsx";
import {
  formatMoney,
  getQrProductCode,
  hasStripePublishableKey,
} from "../../components/payments/paymentHelpers.js";

const PACKAGES = {
  starter: {
    key: "starter",
    name: "Starter Kit",
    amountCents: 999,
    description: "Door and front-counter QR coverage for a fast launch.",
    placements: ["Door", "Counter / Pickup"],
  },
  full: {
    key: "full",
    name: "Full Setup Kit",
    amountCents: 2999,
    description: "Door, counter, and table placements for full-service coverage.",
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

function InfoTile({ label, value }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #d1fadf", borderRadius: 18, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: "#101828" }}>{value}</div>
    </div>
  );
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
    receipt_email: "",
  });
  const [loading, setLoading] = useState(true);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [error, setError] = useState("");
  const [paymentSession, setPaymentSession] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const selectedPackage = PACKAGES[packageType];

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
          receipt_email: current.receipt_email || nextProfile?.email || "",
        }));
      })
      .catch((err) => setError(err.message || "Unable to load restaurant details."))
      .finally(() => setLoading(false));
  }, [selectedRestaurant?.id]);

  const previewPlacements = useMemo(
    () => selectedPackage.placements.map((placement) => ({
      label: placement,
      previewUrl: selectedRestaurant?.id
        ? api.getQrKitPreviewUrl(selectedRestaurant.id, {
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
    [packageType, selectedPackage.placements, selectedRestaurant?.id]
  );

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateForm() {
    if (!selectedRestaurant?.id) return "Select a restaurant before ordering a QR kit.";
    if (!hasStripePublishableKey()) return "VITE_STRIPE_PUBLISHABLE_KEY is not configured.";

    for (const field of [
      "shipping_name",
      "shipping_address_1",
      "shipping_city",
      "shipping_state",
      "shipping_postal_code",
      "shipping_country",
    ]) {
      if (!String(form[field] || "").trim()) {
        return `${field} is required.`;
      }
    }

    return null;
  }

  async function handleCreatePaymentIntent(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreatingIntent(true);
    setError("");
    setConfirmation(null);

    try {
      const response = await api.createPlatformPaymentIntent({
        restaurantId: selectedRestaurant.id,
        productCode: getQrProductCode(packageType),
        receiptEmail: form.receipt_email || undefined,
        metadata: {
          source: "operator_qr_kit_order",
        },
      });

      setPaymentSession(response);
    } catch (err) {
      setError(err.message || "Unable to prepare QR kit payment.");
    } finally {
      setCreatingIntent(false);
    }
  }

  async function handlePaymentConfirmed(paymentIntent) {
    if (!selectedRestaurant?.id) return;

    setError("");

    try {
      const result = await api.createQrKitOrder(selectedRestaurant.id, {
        package_type: packageType,
        shipping_name: form.shipping_name,
        shipping_address_1: form.shipping_address_1,
        shipping_address_2: form.shipping_address_2,
        shipping_city: form.shipping_city,
        shipping_state: form.shipping_state,
        shipping_postal_code: form.shipping_postal_code,
        shipping_country: form.shipping_country,
        stripe_payment_intent_id: paymentIntent.id,
      });

      setConfirmation(result);
      setPaymentSession(null);
    } catch (err) {
      setError(err.message || "Payment succeeded, but QR kit fulfillment could not be created.");
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
            Add-On
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.96, letterSpacing: "-0.06em", maxWidth: 720 }}>
            Turn every table into a direct connection to your menu
          </h1>
          <p style={{ margin: "14px 0 0", maxWidth: 760, fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>
            Your Menuply profile and ordering page are live — now make sure your guests can find them. QR kits put a scannable link right in front of every customer, driving follows, orders, and repeat visits from the moment they sit down.
          </p>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
              <InfoTile label="Package" value={confirmation.order?.package_type === "full" ? "Full Setup Kit" : "Starter Kit"} />
              <InfoTile label="Status" value={confirmation.order?.status || "submitted"} />
              <InfoTile label="Payment Intent" value={confirmation.order?.stripe_payment_intent_id || "—"} />
              <InfoTile label="Printer Ref" value={confirmation.order?.printer_order_reference || "pending"} />
            </div>
          </section>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 20, marginTop: 24 }}>
          <section style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Step 1
              </div>
              <h2 style={{ margin: 0, fontSize: 26, color: "#101828", letterSpacing: "-0.04em" }}>Choose your QR code kit</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 18 }}>
                {Object.values(PACKAGES).map((pkg) => {
                  const active = packageType === pkg.key;
                  return (
                    <button
                      key={pkg.key}
                      type="button"
                      onClick={() => setPackageType(pkg.key)}
                      style={{
                        textAlign: "left",
                        borderRadius: 20,
                        border: active ? "2px solid #1f4e3d" : "1px solid #d0d5dd",
                        background: active ? "#f0fdf4" : "#fff",
                        padding: 18,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {pkg.key === "full" ? "Full Coverage" : "Starter"}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, color: "#101828", letterSpacing: "-0.04em" }}>
                        {pkg.name}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#1f4e3d" }}>
                        {formatMoney(pkg.amountCents)}
                      </div>
                      <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6, color: "#475467" }}>
                        {pkg.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCreatePaymentIntent} style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22, display: "grid", gap: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Step 2
              </div>
              <h2 style={{ margin: 0, fontSize: 26, color: "#101828", letterSpacing: "-0.04em" }}>Shipping and receipt details</h2>

              <div>
                <label style={labelStyle()}>Shipping name</label>
                <input value={form.shipping_name} onChange={(event) => setField("shipping_name", event.target.value)} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Address line 1</label>
                <input value={form.shipping_address_1} onChange={(event) => setField("shipping_address_1", event.target.value)} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Address line 2</label>
                <input value={form.shipping_address_2} onChange={(event) => setField("shipping_address_2", event.target.value)} style={inputStyle()} />
              </div>
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label style={labelStyle()}>City</label>
                  <input value={form.shipping_city} onChange={(event) => setField("shipping_city", event.target.value)} style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>State</label>
                  <input value={form.shipping_state} onChange={(event) => setField("shipping_state", event.target.value)} style={inputStyle()} />
                </div>
              </div>
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label style={labelStyle()}>Postal code</label>
                  <input value={form.shipping_postal_code} onChange={(event) => setField("shipping_postal_code", event.target.value)} style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle()}>Country</label>
                  <input value={form.shipping_country} onChange={(event) => setField("shipping_country", event.target.value)} style={inputStyle()} />
                </div>
              </div>
              <div>
                <label style={labelStyle()}>Receipt email</label>
                <input value={form.receipt_email} onChange={(event) => setField("receipt_email", event.target.value)} style={inputStyle()} />
              </div>

              {!paymentSession ? (
                <button
                  type="submit"
                  disabled={creatingIntent || loading || !hasStripePublishableKey()}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    border: "none",
                    borderRadius: 16,
                    background: creatingIntent ? "#94a3b8" : "#11211a",
                    color: "#fff",
                    padding: "14px 16px",
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: creatingIntent ? "wait" : "pointer",
                  }}
                >
                  {creatingIntent ? "Preparing payment..." : "Continue to payment"}
                </button>
              ) : null}
            </form>

            {paymentSession?.client_secret ? (
              <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Step 3
                </div>
                <h2 style={{ margin: 0, fontSize: 26, color: "#101828", letterSpacing: "-0.04em" }}>Confirm payment</h2>
                <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6, color: "#475467" }}>
                  After Stripe confirms the PaymentIntent, the backend verifies the successful ledger record before creating the QR kit fulfillment order.
                </p>
                <div style={{ marginTop: 16 }}>
                  <StripeElementsProvider clientSecret={paymentSession.client_secret}>
                    <PlatformPaymentForm
                      submitLabel={`Pay ${formatMoney(selectedPackage.amountCents)}`}
                      returnUrl={`${window.location.origin}/operator/qr-kit-order`}
                      onConfirmed={handlePaymentConfirmed}
                    />
                  </StripeElementsProvider>
                </div>
              </div>
            ) : null}
          </section>

          <aside style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Selected package
              </div>
              <h3 style={{ margin: "8px 0 0", fontSize: 28, color: "#101828", letterSpacing: "-0.05em" }}>{selectedPackage.name}</h3>
              <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800, color: "#1f4e3d", letterSpacing: "-0.05em" }}>
                {formatMoney(selectedPackage.amountCents)}
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.65, color: "#475467" }}>
                {selectedPackage.description}
              </p>
            </div>

            <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Preview placements
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {previewPlacements.map((placement) => (
                  <div key={placement.label} style={{ border: "1px solid #eaecf0", borderRadius: 18, overflow: "hidden", background: "#f8fafc" }}>
                    <img src={placement.previewUrl} alt={placement.label} style={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} />
                    <div style={{ padding: 14, fontSize: 14, fontWeight: 800, color: "#101828" }}>{placement.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </OperatorLayout>
  );
}
