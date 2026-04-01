import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PageNav } from "../components/NavButton.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { apiGet, apiPost, toConsumerErrorMessage } from "../lib/api.js";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function buildApiItems(items) {
  return items.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
  }));
}

function normalizeDeliveryAddress(address) {
  return {
    name: String(address.name || "").trim(),
    line1: String(address.line1 || "").trim(),
    line2: String(address.line2 || "").trim(),
    city: String(address.city || "").trim(),
    state: String(address.state || "").trim(),
    postalCode: String(address.postalCode || "").trim(),
    instructions: String(address.instructions || "").trim(),
  };
}

function PaymentStep({ orderId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}/confirmation`,
      },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error.message || "Payment confirmation failed.");
      return;
    }

    if (result.paymentIntent) {
      onSuccess(result.paymentIntent.status);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage ? (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {errorMessage}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        style={{
          marginTop: 18,
          width: "100%",
          border: "none",
          borderRadius: 16,
          background: submitting ? "#94a3b8" : "#11211a",
          color: "#fff",
          padding: "14px 16px",
          fontSize: 15,
          fontWeight: 900,
          cursor: submitting ? "wait" : "pointer",
        }}
      >
        {submitting ? "Confirming payment..." : "Pay now"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { restaurant, items, clearCart } = useOrderCart();
  const availableFulfillmentTypes = useMemo(() => {
    if (Array.isArray(restaurant?.availableFulfillmentTypes) && restaurant.availableFulfillmentTypes.length > 0) {
      return restaurant.availableFulfillmentTypes;
    }
    if (restaurant?.deliveryEnabled === true) {
      return ["pickup", "delivery"];
    }
    return ["pickup"];
  }, [restaurant]);
  const [fulfillmentType, setFulfillmentType] = useState(
    availableFulfillmentTypes.includes("pickup") ? "pickup" : availableFulfillmentTypes[0] || "pickup"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    instructions: "",
  });
  const [previewState, setPreviewState] = useState({
    status: "idle",
    data: null,
    error: "",
  });
  const [paymentSession, setPaymentSession] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [creatingIntent, setCreatingIntent] = useState(false);

  const apiItems = useMemo(() => buildApiItems(items), [items]);
  const normalizedDeliveryAddress = useMemo(
    () => normalizeDeliveryAddress(deliveryAddress),
    [deliveryAddress]
  );

  useEffect(() => {
    if (!availableFulfillmentTypes.includes(fulfillmentType)) {
      setFulfillmentType(availableFulfillmentTypes[0] || "pickup");
    }
  }, [availableFulfillmentTypes, fulfillmentType]);

  useEffect(() => {
    setPaymentSession(null);
  }, [apiItems, fulfillmentType, normalizedDeliveryAddress]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!restaurant?.restaurantId || items.length === 0) {
        setPreviewState({ status: "idle", data: null, error: "" });
        return;
      }

      setPreviewState({ status: "loading", data: null, error: "" });

      try {
        const response = await apiPost("/api/orders/preview", {
          restaurantId: restaurant.restaurantId,
          items: apiItems,
          fulfillmentType,
          deliveryAddress: fulfillmentType === "delivery" ? normalizedDeliveryAddress : undefined,
        });

        if (cancelled) return;
        setPreviewState({ status: "ready", data: response, error: "" });
      } catch (error) {
        if (cancelled) return;
        setPreviewState({
          status: "error",
          data: null,
          error: toConsumerErrorMessage(
            error,
            "We couldn't price this order right now. Please try again."
          ),
        });
      }
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [restaurant?.restaurantId, items.length, apiItems, fulfillmentType, normalizedDeliveryAddress]);

  if (!restaurant || items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#11211a" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 18px 60px" }}>
          <PageNav back />
          <div
            style={{
              marginTop: 28,
              borderRadius: 24,
              background: "#fff",
              border: "1px solid rgba(17,33,26,0.08)",
              padding: "28px 24px",
              boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
            }}
          >
            <h1 style={{ fontSize: 28, margin: 0 }}>Your order cart is empty</h1>
            <p style={{ marginTop: 10, color: "#667085", fontSize: 15, lineHeight: 1.6 }}>
              Add items from a restaurant menu before starting checkout.
            </p>
            <Link to="/" style={{ color: "#14532d", fontWeight: 800 }}>
              Back to discovery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleCreatePaymentIntent(event) {
    event.preventDefault();
    setSubmitError("");

    if (!stripePublishableKey || !stripePromise) {
      setSubmitError("VITE_STRIPE_PUBLISHABLE_KEY is not configured.");
      return;
    }

    if (!customerName.trim()) {
      setSubmitError("Customer name is required.");
      return;
    }

    if (!customerPhone.trim()) {
      setSubmitError("Customer phone is required.");
      return;
    }

    if (fulfillmentType === "delivery") {
      if (
        !normalizedDeliveryAddress.line1 ||
        !normalizedDeliveryAddress.city ||
        !normalizedDeliveryAddress.state ||
        !normalizedDeliveryAddress.postalCode
      ) {
        setSubmitError("Delivery address line 1, city, state, and postal code are required.");
        return;
      }
    }

    setCreatingIntent(true);

    try {
      const response = await apiPost("/api/orders/create-payment-intent", {
        restaurantId: restaurant.restaurantId,
        items: apiItems,
        customerName,
        customerPhone,
        customerEmail,
        fulfillmentType,
        deliveryAddress: fulfillmentType === "delivery" ? normalizedDeliveryAddress : undefined,
        notes,
      });

      setPaymentSession({
        orderId: response.orderId,
        clientSecret: response.clientSecret,
      });
    } catch (error) {
      setSubmitError(
        toConsumerErrorMessage(error, "We couldn't start payment for this order.")
      );
    } finally {
      setCreatingIntent(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#11211a" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 18px 60px" }}>
        <PageNav back />

        <div style={{ marginTop: 24, display: "grid", gap: 22, gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)" }}>
          <section
            style={{
              borderRadius: 24,
              background: "#fff",
              border: "1px solid rgba(17,33,26,0.08)",
              padding: "24px 22px",
              boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#667085" }}>
              Checkout
            </div>
            <h1 style={{ fontSize: 32, margin: "8px 0 6px" }}>{restaurant.restaurantName}</h1>
            <p style={{ margin: 0, color: "#667085", lineHeight: 1.6 }}>
              Prices and totals are recalculated on the server before payment. The restaurant receives the direct charge on its connected Stripe account.
            </p>

            <form onSubmit={handleCreatePaymentIntent} style={{ marginTop: 24, display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Customer name</label>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                />
              </div>

              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Phone</label>
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Email (optional)</label>
                  <input
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Fulfillment</label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {availableFulfillmentTypes.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFulfillmentType(value)}
                      style={{
                        borderRadius: 999,
                        border: fulfillmentType === value ? "1px solid #11211a" : "1px solid #d0d5dd",
                        background: fulfillmentType === value ? "#11211a" : "#fff",
                        color: fulfillmentType === value ? "#fff" : "#11211a",
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {value === "pickup" ? "Pickup" : "Delivery"}
                    </button>
                  ))}
                </div>
                {!availableFulfillmentTypes.includes("delivery") ? (
                  <div style={{ marginTop: 10, fontSize: 13, color: "#667085" }}>
                    This restaurant is currently pickup only.
                  </div>
                ) : null}
              </div>

              {fulfillmentType === "delivery" ? (
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Delivery name</label>
                    <input
                      value={deliveryAddress.name}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, name: event.target.value }))}
                      style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Address line 1</label>
                    <input
                      value={deliveryAddress.line1}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, line1: event.target.value }))}
                      style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Address line 2</label>
                    <input
                      value={deliveryAddress.line2}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, line2: event.target.value }))}
                      style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>City</label>
                    <input
                      value={deliveryAddress.city}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, city: event.target.value }))}
                      style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>State</label>
                    <input
                      value={deliveryAddress.state}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, state: event.target.value }))}
                      style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Postal code</label>
                    <input
                      value={deliveryAddress.postalCode}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
                      style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Delivery notes</label>
                    <input
                      value={deliveryAddress.instructions}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, instructions: event.target.value }))}
                      style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14 }}
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Order notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  style={{ width: "100%", borderRadius: 14, border: "1px solid #d0d5dd", padding: "12px 14px", fontSize: 14, resize: "vertical" }}
                />
              </div>

              {submitError ? (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "#fee2e2",
                    color: "#991b1b",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {submitError}
                </div>
              ) : null}

              {!paymentSession ? (
                <button
                  type="submit"
                  disabled={creatingIntent || previewState.status === "loading"}
                  style={{
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

            {paymentSession ? (
              <div style={{ marginTop: 26 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#667085", marginBottom: 10 }}>
                  Payment
                </div>
                <Elements stripe={stripePromise} options={{ clientSecret: paymentSession.clientSecret }}>
                  <PaymentStep
                    orderId={paymentSession.orderId}
                    onSuccess={(status) => {
                      if (status === "succeeded" || status === "processing") {
                        clearCart();
                        navigate(`/orders/${paymentSession.orderId}/confirmation`);
                      }
                    }}
                  />
                </Elements>
              </div>
            ) : null}
          </section>

          <aside
            style={{
              borderRadius: 24,
              background: "#fff",
              border: "1px solid rgba(17,33,26,0.08)",
              padding: "24px 22px",
              boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
              alignSelf: "start",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#667085" }}>
              Order summary
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.menuItemId}
                  style={{
                    border: "1px solid rgba(17,33,26,0.08)",
                    borderRadius: 18,
                    background: "#fffef8",
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
                        Qty {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>
                      {formatMoney(item.priceCents * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, borderTop: "1px solid rgba(17,33,26,0.08)", paddingTop: 16, display: "grid", gap: 10 }}>
              {previewState.status === "loading" ? (
                <div style={{ fontSize: 14, color: "#667085" }}>Calculating server-side totals…</div>
              ) : previewState.status === "error" ? (
                <div style={{ fontSize: 14, color: "#991b1b", lineHeight: 1.6 }}>{previewState.error}</div>
              ) : previewState.data ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#667085" }}>Subtotal</span>
                    <strong>{formatMoney(previewState.data.subtotal_cents)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#667085" }}>Tax</span>
                    <strong>{formatMoney(previewState.data.tax_cents)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
                    <span style={{ color: "#11211a", fontWeight: 900 }}>Total</span>
                    <strong>{formatMoney(previewState.data.total_cents)}</strong>
                  </div>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
