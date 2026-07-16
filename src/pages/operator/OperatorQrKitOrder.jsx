import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import StripeElementsProvider from "../../components/payments/StripeElementsProvider.jsx";
import PlatformPaymentForm from "../../components/payments/PlatformPaymentForm.jsx";
import { formatMoney, hasStripePublishableKey } from "../../components/payments/paymentHelpers.js";

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

function productPriceLabel(product) {
  if (product.pricing_mode === "volume_tiers") {
    if (product.display_from_total_cents != null && product.display_from_quantity != null) {
      return `From ${formatMoney(product.display_from_total_cents)}, qty ${product.display_from_quantity}`;
    }
    return "Volume pricing — select quantity";
  }
  return `${formatMoney(product.unit_amount_cents)} each`;
}

export default function OperatorQrKitOrder() {
  const { t } = useLanguage();
  const { selectedRestaurant } = useOperator();
  const [catalog, setCatalog] = useState([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [quantity, setQuantity] = useState(1);
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
  const [requestingBulk, setRequestingBulk] = useState(false);
  const [error, setError] = useState("");
  const [paymentSession, setPaymentSession] = useState(null);
  const [serverQuote, setServerQuote] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [bulkRequest, setBulkRequest] = useState(null);

  const selectedProduct = useMemo(
    () => catalog.find((p) => p.sku === selectedSku) || null,
    [catalog, selectedSku]
  );

  const volumeTiers = selectedProduct?.volume_pricing?.tiers || [];
  const isVolume = selectedProduct?.pricing_mode === "volume_tiers";

  const selectedTier = useMemo(() => {
    if (!isVolume) return null;
    return volumeTiers.find((tier) => tier.quantity === quantity) || null;
  }, [isVolume, volumeTiers, quantity]);

  useEffect(() => {
    if (!selectedRestaurant?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      api.getQrMerchandiseCatalog(selectedRestaurant.id),
      api.getProfile(selectedRestaurant.id),
    ])
      .then(([catalogResult, profileResult]) => {
        const products = catalogResult?.products || [];
        setCatalog(products);
        if (products.length && !selectedSku) {
          const first = products[0];
          setSelectedSku(first.sku);
          if (first.pricing_mode === "volume_tiers" && first.qty_options?.length) {
            setQuantity(first.qty_options[0]);
          } else {
            setQuantity(first.qty_min || 1);
          }
        }
        const nextProfile = profileResult?.profile || null;
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
      .catch((err) => setError(err.message || "Unable to load QR merchandise catalog."))
      .finally(() => setLoading(false));
  }, [selectedRestaurant?.id]);

  useEffect(() => {
    if (!selectedProduct) return;
    if (selectedProduct.pricing_mode === "volume_tiers" && selectedProduct.qty_options?.length) {
      setQuantity(selectedProduct.qty_options[0]);
    } else {
      setQuantity(selectedProduct.qty_min || 1);
    }
    setPaymentSession(null);
    setServerQuote(null);
    setPreviewQuote(null);
    setBulkRequest(null);
  }, [selectedProduct?.sku]);

  useEffect(() => {
    if (!selectedRestaurant?.id || !selectedProduct) {
      setPreviewQuote(null);
      return;
    }
    let cancelled = false;
    api
      .getQrMerchandiseQuote(selectedRestaurant.id, {
        sku: selectedProduct.sku,
        quantity,
      })
      .then((result) => {
        if (!cancelled) setPreviewQuote(result.quote || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewQuote({
            error: err.message,
            code: err.payload?.code || err.code,
            bulk_quote_required: true,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRestaurant?.id, selectedProduct?.sku, quantity]);

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
    if (!selectedRestaurant?.id) return "Select a restaurant before ordering.";
    if (!selectedProduct) return "Select a product from the catalog.";
    if (!hasStripePublishableKey()) return "VITE_STRIPE_PUBLISHABLE_KEY is not configured.";
    for (const field of [
      "shipping_name",
      "shipping_address_1",
      "shipping_city",
      "shipping_state",
      "shipping_postal_code",
      "shipping_country",
    ]) {
      if (!String(form[field] || "").trim()) return `${field} is required.`;
    }
    return null;
  }

  const needsBulkQuote =
    Boolean(previewQuote?.bulk_quote_required) ||
    (selectedTier && selectedTier.self_service_eligible === false) ||
    previewQuote?.checkout_allowed === false;

  async function handleCreatePaymentIntent(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (needsBulkQuote) {
      setError("This quantity requires a bulk quote. Use Request Bulk Quote — no payment will be created.");
      return;
    }

    setCreatingIntent(true);
    setError("");
    setConfirmation(null);
    setServerQuote(null);

    try {
      const response = await api.createPlatformPaymentIntent({
        restaurantId: selectedRestaurant.id,
        productCode: selectedProduct.sku,
        quantity,
        receiptEmail: form.receipt_email || undefined,
        metadata: {
          source: "operator_qr_merchandise",
          merchandise_sku: selectedProduct.sku,
        },
      });

      setPaymentSession(response);
      setServerQuote(response.merchandise || null);
    } catch (err) {
      const code = err.payload?.code || err.code || "";
      if (code === "MERCHANDISE_QUOTE_REQUIRED") {
        setError(err.message || "Bulk quote required — PaymentIntent was not created.");
      } else {
        setError(err.message || "Unable to prepare QR merchandise payment.");
      }
    } finally {
      setCreatingIntent(false);
    }
  }

  async function handleBulkQuoteRequest() {
    if (!selectedRestaurant?.id || !selectedProduct) return;
    setRequestingBulk(true);
    setError("");
    try {
      const result = await api.requestQrMerchandiseBulkQuote(selectedRestaurant.id, {
        sku: selectedProduct.sku,
        quantity,
        contact_email: form.receipt_email || undefined,
        note: "Operator requested bulk quote from QR merchandise order page.",
      });
      setBulkRequest(result.request || result);
      setPaymentSession(null);
    } catch (err) {
      setError(err.message || "Unable to submit bulk quote request.");
    } finally {
      setRequestingBulk(false);
    }
  }

  async function handlePaymentConfirmed(paymentIntent) {
    if (!selectedRestaurant?.id || !selectedProduct) return;
    setError("");

    try {
      const result = await api.createQrKitOrder(selectedRestaurant.id, {
        sku: selectedProduct.sku,
        quantity,
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
      setError(err.message || "Payment succeeded, but merchandise order could not be created.");
    }
  }

  if (!selectedRestaurant) {
    return (
      <OperatorLayout title={t("operator.qrKit.title") || "Order QR Code Kit"}>
        <div style={{ maxWidth: 560, background: "#fff", border: "1px solid #eaecf0", borderRadius: 20, padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: "#101828" }}>No restaurant selected</h2>
        </div>
      </OperatorLayout>
    );
  }

  const displayUnit = previewQuote?.unit_amount_cents ?? selectedTier?.retail_unit_price_cents ?? null;
  const displaySubtotal = previewQuote?.subtotal_cents ?? selectedTier?.retail_total_cents ?? null;

  return (
    <OperatorLayout title={t("operator.qrKit.title") || "Order QR Merchandise"}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.03em", color: "#101828" }}>QR merchandise</h1>
        <p style={{ color: "#475467", lineHeight: 1.6 }}>
          Prices come from the Menuply catalog. Table QR Cards use volume tiers. Tax and shipping charges are not included yet.
        </p>

        {error ? (
          <div style={{ marginTop: 16, background: "#fef3f2", border: "1px solid #fecdca", color: "#b42318", borderRadius: 16, padding: 14 }}>
            {error}
          </div>
        ) : null}

        {loading ? <p>Loading catalog…</p> : null}

        {confirmation ? (
          <section style={{ marginTop: 20, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 22, padding: 22 }}>
            <h2 style={{ margin: 0 }}>Order recorded</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 16 }}>
              <InfoTile label="Product" value={confirmation.order?.product_name_snapshot || confirmation.order?.sku || "—"} />
              <InfoTile label="Qty" value={String(confirmation.order?.quantity ?? "—")} />
              <InfoTile label="Charged" value={formatMoney(confirmation.order?.stripe_amount_cents ?? confirmation.order?.amount_cents)} />
              <InfoTile label="Status" value={confirmation.order?.status || "—"} />
            </div>
          </section>
        ) : null}

        {bulkRequest ? (
          <section style={{ marginTop: 20, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 22, padding: 22 }}>
            <h2 style={{ margin: 0 }}>Bulk quote requested</h2>
            <p style={{ color: "#1e3a8a", lineHeight: 1.5 }}>
              Quantity {bulkRequest.quantity} for {bulkRequest.sku} is held for Menuply confirmation. No payment was taken.
            </p>
          </section>
        ) : null}

        <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
          {(catalog || []).map((product) => {
            const active = product.sku === selectedSku;
            return (
              <button
                key={product.sku}
                type="button"
                onClick={() => setSelectedSku(product.sku)}
                style={{
                  textAlign: "left",
                  borderRadius: 18,
                  border: active ? "2px solid #1f4e3d" : "1px solid #d0d5dd",
                  background: active ? "#f3faf6" : "#fff",
                  padding: 16,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 16 }}>{product.public_name}</div>
                <div style={{ color: "#667085", marginTop: 6, fontSize: 14 }}>{product.description}</div>
                <div style={{ marginTop: 10, fontWeight: 800 }}>{productPriceLabel(product)}</div>
              </button>
            );
          })}
        </div>

        {isVolume && volumeTiers.length ? (
          <label style={{ display: "block", marginTop: 18 }}>
            <span style={labelStyle()}>Quantity (volume tier)</span>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={inputStyle()}
            >
              {volumeTiers.map((tier) => (
                <option key={tier.tier_id || tier.quantity} value={tier.quantity}>
                  {tier.label || `${tier.quantity} — ${formatMoney(tier.retail_total_cents)}`}
                  {!tier.self_service_eligible ? " (bulk quote)" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : selectedProduct?.qty_max > 1 ? (
          <label style={{ display: "block", marginTop: 18 }}>
            <span style={labelStyle()}>Quantity</span>
            <input
              type="number"
              min={selectedProduct.qty_min}
              max={selectedProduct.qty_max}
              step={selectedProduct.qty_step}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={inputStyle()}
            />
          </label>
        ) : null}

        {selectedProduct ? (
          <div style={{ marginTop: 16, background: "#fff", border: "1px solid #eaecf0", borderRadius: 16, padding: 16 }}>
            <div><strong>Product:</strong> {selectedProduct.public_name}</div>
            <div><strong>Quantity:</strong> {quantity}</div>
            {previewQuote?.tier_id ? (
              <div><strong>Volume tier:</strong> {previewQuote.tier_id}</div>
            ) : null}
            <div>
              <strong>Unit price:</strong>{" "}
              {displayUnit != null ? formatMoney(displayUnit) : "—"}
            </div>
            <div>
              <strong>Merchandise subtotal:</strong>{" "}
              {displaySubtotal != null ? formatMoney(displaySubtotal) : "—"}
            </div>
            {serverQuote ? (
              <div style={{ marginTop: 8, color: "#166534" }}>
                <strong>Server-confirmed amount due:</strong> {formatMoney(serverQuote.subtotal_cents)}
                {serverQuote.tier_id ? ` · ${serverQuote.tier_id}` : ""}
              </div>
            ) : null}
            <div style={{ marginTop: 8, fontSize: 13, color: "#667085" }}>
              Tax: not included · Shipping charge: not included
              {needsBulkQuote ? " · Self-service checkout unavailable for this quantity" : ""}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleCreatePaymentIntent} style={{ marginTop: 20, display: "grid", gap: 12 }}>
          {[
            ["shipping_name", "Ship to name"],
            ["shipping_address_1", "Address line 1"],
            ["shipping_address_2", "Address line 2"],
            ["shipping_city", "City"],
            ["shipping_state", "State"],
            ["shipping_postal_code", "Postal code"],
            ["shipping_country", "Country"],
            ["receipt_email", "Receipt email"],
          ].map(([key, label]) => (
            <label key={key}>
              <span style={labelStyle()}>{label}</span>
              <input style={inputStyle()} value={form[key]} onChange={(e) => setField(key, e.target.value)} />
            </label>
          ))}

          <label>
            <span style={labelStyle()}>Door photo (optional)</span>
            <input type="file" accept="image/*" onChange={handleDoorPhotoChange} disabled={uploadingPhoto} />
            {doorPhotoPreview ? (
              <img src={doorPhotoPreview} alt="Door" style={{ marginTop: 8, maxWidth: 180, borderRadius: 12 }} />
            ) : null}
          </label>

          {needsBulkQuote ? (
            <button
              type="button"
              onClick={handleBulkQuoteRequest}
              disabled={requestingBulk || !selectedProduct}
              style={{
                minHeight: 48,
                borderRadius: 14,
                border: "none",
                background: "#1d4ed8",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {requestingBulk ? "Submitting…" : "Request Bulk Quote"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={creatingIntent || !selectedProduct}
              style={{
                minHeight: 48,
                borderRadius: 14,
                border: "none",
                background: "#1f4e3d",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {creatingIntent
                ? "Preparing payment…"
                : displaySubtotal != null
                  ? `Continue to payment · ${formatMoney(displaySubtotal)}`
                  : "Continue to payment"}
            </button>
          )}
        </form>

        {paymentSession?.client_secret ? (
          <div style={{ marginTop: 20 }}>
            <StripeElementsProvider options={{ clientSecret: paymentSession.client_secret }}>
              <PlatformPaymentForm onConfirmed={handlePaymentConfirmed} />
            </StripeElementsProvider>
          </div>
        ) : null}
      </div>
    </OperatorLayout>
  );
}
