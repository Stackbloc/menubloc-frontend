import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
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

const TABLE_QTY_OPTIONS = [
  { qty: 10,    amountCents:   3750, label: "10 signs    — $37.50     ($3.75/sign)" },
  { qty: 25,    amountCents:   8750, label: "25 signs    — $87.50     ($3.50/sign)" },
  { qty: 50,    amountCents:  13750, label: "50 signs    — $137.50    ($2.75/sign)" },
  { qty: 100,   amountCents:  25000, label: "100 signs   — $250.00    ($2.50/sign)" },
  { qty: 250,   amountCents:  50000, label: "250 signs   — $500.00    ($2.00/sign)" },
  { qty: 500,   amountCents:  75000, label: "500 signs   — $750.00    ($1.50/sign)" },
  { qty: 1000,  amountCents: 100000, label: "1,000 signs — $1,000.00  ($1.00/sign)" },
  { qty: 1500,  amountCents: 112500, label: "1,500 signs — $1,125.00  ($0.75/sign)" },
  { qty: 2000,  amountCents: 150000, label: "2,000 signs — $1,500.00  ($0.75/sign)" },
  { qty: 2500,  amountCents: 187500, label: "2,500 signs — $1,875.00  ($0.75/sign)" },
  { qty: 5000,  amountCents: 250000, label: "5,000 signs — $2,500.00  ($0.50/sign)" },
  { qty: 10000, amountCents: 500000, label: "10,000 signs — $5,000.00 ($0.50/sign)" },
];

const PACKAGES = {
  starter: {
    key: "starter",
    name: "Door / Window QR Sticker",
    amountCents: 1500,
    description: "One door QR vinyl sticker (6.25\" × 5.25\"). Scannable link placed right at your entrance.",
    placements: ["Door"],
  },
  table: {
    key: "table",
    name: "Table Tent QR Sign",
    amountCents: TABLE_QTY_OPTIONS[0].amountCents,
    description: "Folded tent card table sign. QR code at every table for direct ordering. Select quantity.",
    placements: ["Table Set"],
    qtyOptions: TABLE_QTY_OPTIONS,
  },
  counter: {
    key: "counter",
    name: "Counter / Pickup Acrylic QR Sign",
    amountCents: 3000,
    description: "Clear acrylic counter sign, 7\" × 5\", white print. QR code at your counter or pickup window.",
    placements: ["Counter / Pickup"],
  },
  full: {
    key: "full",
    name: "Complete QR Signage Bundle",
    amountCents: 9000,
    description: "Door/window sticker + acrylic counter sign + 20 table tent signs. Save vs buying separately.",
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
  const { t } = useLanguage();
  const { selectedRestaurant } = useOperator();
  const [packageType, setPackageType] = useState("starter");
  const [tableQtyIndex, setTableQtyIndex] = useState(0);
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
    door_photo_url: "",
  });
  const [doorPhotoPreview, setDoorPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [error, setError] = useState("");
  const [paymentSession, setPaymentSession] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const selectedPackage = PACKAGES[packageType];
  const tableQtyOption = TABLE_QTY_OPTIONS[tableQtyIndex] || TABLE_QTY_OPTIONS[0];
  const effectiveAmountCents = packageType === "table" ? tableQtyOption.amountCents : selectedPackage.amountCents;

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
      previewUrl: placement === "Door"
        ? "/qr-door-preview.png"
        : selectedRestaurant?.id
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

  async function handleDoorPhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file || !selectedRestaurant?.id) return;
    setDoorPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const result = await api.uploadQrDoorPhoto(selectedRestaurant.id, file);
      setField("door_photo_url", result.door_photo_url);
    } catch (err) {
      setError(err.message || "Photo upload failed.");
      setDoorPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
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
        amountCents: effectiveAmountCents,
        metadata: {
          source: "operator_qr_kit_order",
          qty: packageType === "table" ? tableQtyOption.qty : 1,
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
        door_photo_url: form.door_photo_url || undefined,
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
            QR Code Signage
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.05, letterSpacing: "-0.04em", maxWidth: 720 }}>
            Put your menu in front of every guest
          </h1>
          <p style={{ margin: "14px 0 0", maxWidth: 720, fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>
            Choose the sign that fits your location. Each piece ships with your unique QR code — guests scan to view your menu and order directly. Door vinyl sticker, counter acrylic sign, or table acrylic sign.
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
              <h2 style={{ margin: 0, fontSize: 26, color: "#101828", letterSpacing: "-0.04em" }}>Choose your signage</h2>
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
                      {pkg.key === "table" && (
                        <img
                          src="/qr-table-tent-sign.png"
                          alt="Table tent QR sign"
                          style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 10, marginBottom: 12 }}
                        />
                      )}
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {pkg.key === "full" ? "Best Value" : pkg.key === "table" ? "Tent Card" : pkg.key === "counter" ? "Acrylic" : "Vinyl"}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, color: "#101828", letterSpacing: "-0.04em" }}>
                        {pkg.name}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#1f4e3d" }}>
                        {pkg.key === "table" ? `From ${formatMoney(TABLE_QTY_OPTIONS[0].amountCents)}, qty ${TABLE_QTY_OPTIONS[0].qty}` : formatMoney(pkg.amountCents)}
                      </div>
                      <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6, color: "#475467" }}>
                        {pkg.description}
                      </p>
                      {pkg.key === "table" && active && (
                        <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#344054", display: "block", marginBottom: 6 }}>Quantity</label>
                          <select
                            value={tableQtyIndex}
                            onChange={(e) => setTableQtyIndex(Number(e.target.value))}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d0d5dd", fontSize: 14, fontFamily: "inherit", background: "#fff", color: "#101828" }}
                          >
                            {TABLE_QTY_OPTIONS.map((opt, i) => (
                              <option key={opt.qty} value={i}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
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

              <div>
                <label style={labelStyle()}>Door photo <span style={{ fontWeight: 400, textTransform: "none", color: "#667085" }}>(optional — photo of your door or entrance)</span></label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    border: "1px dashed #d0d5dd",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "#f9fafb",
                    fontSize: 14,
                    color: "#475467",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleDoorPhotoChange}
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <span>Uploading…</span>
                  ) : doorPhotoPreview ? (
                    <>
                      <img src={doorPhotoPreview} alt="Door preview" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                      <span>Change photo</span>
                    </>
                  ) : (
                    <span>📷 Upload door photo</span>
                  )}
                </label>
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
                      submitLabel={`Pay ${formatMoney(effectiveAmountCents)}`}
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
              <h3 style={{ margin: "8px 0 0", fontSize: 28, color: "#101828", letterSpacing: "-0.05em" }}>
                {selectedPackage.name}
                {packageType === "table" && <span style={{ fontSize: 16, fontWeight: 600, color: "#667085", marginLeft: 8 }}>× {tableQtyOption.qty}</span>}
              </h3>
              <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800, color: "#1f4e3d", letterSpacing: "-0.05em" }}>
                {formatMoney(effectiveAmountCents)}
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.65, color: "#475467" }}>
                {selectedPackage.description}
              </p>
            </div>

            <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Product options
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {[
                  { label: "Door / Window QR Sticker",       img: "/qr-door-preview.png" },
                  { label: "Acrylic Counter / Table Sign",    img: "/qr-acrylic-sign.png" },
                  { label: "Table Tent QR Sign",              img: "/qr-table-tent-sign.png" },
                ].map(({ label, img }) => (
                  <div key={label} style={{ border: "1px solid #eaecf0", borderRadius: 18, overflow: "hidden", background: "#f8fafc" }}>
                    <img src={img} alt={label} style={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} />
                    <div style={{ padding: 14, fontSize: 14, fontWeight: 800, color: "#101828" }}>{label}</div>
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
