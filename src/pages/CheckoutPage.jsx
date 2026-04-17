/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/CheckoutPage.jsx
 * File: CheckoutPage.jsx
 * Date: 2026-04-06
 * Purpose:
 *   Consumer checkout screen for server-priced orders, including
 *   Bid-Free Bidding™ savings display when applied.
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import SmsAuthModal from "../components/auth/SmsAuthModal.jsx";
import { PageNav } from "../components/NavButton.jsx";
import BuyMeThisShareModal from "../components/bmt/BuyMeThisShareModal.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { buildCheckoutItems } from "../context/orderCartModel.js";
import { apiPost, createBmtSession, toConsumerErrorMessage } from "../lib/api.js";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
const DEFAULT_BMT_SHARE_MESSAGE =
  "Dear friend or family member, I would greatly appreciate it if you would buy me this on Grubbid!";

function useIsMobile(breakpoint = 900) {
  const getMatches = () => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  };

  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
}

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M14.167 6.667a2.5 2.5 0 1 0-2.357-3.333L7.49 5.494a2.5 2.5 0 0 0 0 2.012l4.32 2.16a2.5 2.5 0 1 0 .745-1.49l-4.32-2.16a2.53 2.53 0 0 0 0-.032l4.32-2.16a2.49 2.49 0 0 0 1.612.593Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.833 15.833a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          lineHeight: 1.6,
          color: "#667085",
        }}
      >
        By placing your order, you agree to the{" "}
        <Link to="/terms" style={{ color: "#14532d", fontWeight: 800, textDecoration: "none" }}>
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link to="/privacy" style={{ color: "#14532d", fontWeight: 800, textDecoration: "none" }}>
          Privacy Policy
        </Link>
        .
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { consumer, isAuthenticated, authToast, clearAuthToast } = useConsumer();
  const { restaurant, items, clearCart, updateQuantity, removeItem } = useOrderCart();
  const bmtSectionRef = useRef(null);
  const isMobile = useIsMobile();
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
  const [creatingBmt, setCreatingBmt] = useState(false);
  const [showBmtConfirm, setShowBmtConfirm] = useState(false);
  const [showSmsAuthModal, setShowSmsAuthModal] = useState(false);
  const [applyCoins, setApplyCoins] = useState(false);
  const [userBidAttempted, setUserBidAttempted] = useState(false);
  const [userBidAttemptedAt, setUserBidAttemptedAt] = useState(null);
  const [userBidLoading, setUserBidLoading] = useState(false);
  const [userBidError, setUserBidError] = useState("");
  const [bmtShareState, setBmtShareState] = useState({
    open: false,
    shareUrl: "",
    expiresAt: "",
  });

  const menuPath = restaurant?.restaurantId
    ? `/public/restaurants/${encodeURIComponent(String(restaurant.restaurantId))}/menu`
    : "/";

  const apiItems = useMemo(() => buildCheckoutItems(items), [items]);
  const normalizedDeliveryAddress = useMemo(
    () => normalizeDeliveryAddress(deliveryAddress),
    [deliveryAddress]
  );
  const inputStyle = useMemo(
    () => ({
      width: "100%",
      boxSizing: "border-box",
      borderRadius: 14,
      border: "1px solid #d0d5dd",
      padding: "12px 14px",
      fontSize: 16,
      background: "#fff",
    }),
    []
  );
  const sectionCardStyle = useMemo(
    () => ({
      borderRadius: 24,
      background: "#fff",
      border: "1px solid rgba(17,33,26,0.08)",
      padding: isMobile ? "20px 16px" : "24px 22px",
      boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    }),
    [isMobile]
  );

  const currentPreviewData = previewState.data;
  const canUseBmt = consumer?.is_phone_verified === true;
  const bmtGateTitle = isAuthenticated ? "Verify your phone to send this order" : "Sign in by text to use Buy Me This";
  const bmtGateButton = isAuthenticated ? "Verify by text" : "Sign in by text";
  const eligibleHybridItemCount = currentPreviewData?.hybrid_eligibility?.eligible_item_count || 0;
  const hybridNegotiationEnabled =
    currentPreviewData?.hybrid_eligibility?.negotiation_enabled ??
    currentPreviewData?.restaurant?.negotiation_enabled;
  const canShowUserBidButton =
    previewState.status === "ready" &&
    currentPreviewData &&
    hybridNegotiationEnabled &&
    eligibleHybridItemCount > 0 &&
    (currentPreviewData?.subtotal_cents || 0) >= 3500 &&
    currentPreviewData?.user_bid?.attempted !== true &&
    currentPreviewData?.cart_negotiation?.applied !== true &&
    currentPreviewData?.auto_optimization?.applied !== true;
  const userBidMessageText = currentPreviewData?.user_bid?.message || "";

  useEffect(() => {
    if (!availableFulfillmentTypes.includes(fulfillmentType)) {
      setFulfillmentType(availableFulfillmentTypes[0] || "pickup");
    }
  }, [availableFulfillmentTypes, fulfillmentType]);

  useEffect(() => {
    setPaymentSession(null);
    setShowBmtConfirm(false);
  }, [apiItems, fulfillmentType, normalizedDeliveryAddress, applyCoins]);

  useEffect(() => {
    if (!authToast) return undefined;
    const timeoutId = window.setTimeout(() => clearAuthToast(), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [authToast, clearAuthToast]);

  function scrollToBmtSection() {
    bmtSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  useEffect(() => {
    const bid = previewState.data?.user_bid;
    setUserBidAttempted(bid?.attempted === true);
    setUserBidAttemptedAt(bid?.attempted_at || null);
  }, [previewState.data?.user_bid?.attempted, previewState.data?.user_bid?.attempted_at]);

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
          applyCoins,
          userBidAttempted,
          userBidAttemptedAt,
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
  }, [
      restaurant?.restaurantId,
      items.length,
      apiItems,
      fulfillmentType,
      normalizedDeliveryAddress,
      applyCoins,
      userBidAttempted,
      userBidAttemptedAt,
    ]);

  async function handleUserBid() {
    if (userBidLoading || userBidAttempted) return;
    if (!restaurant?.restaurantId || items.length === 0) return;

    setUserBidLoading(true);
    setUserBidError("");

    try {
      const response = await apiPost("/api/orders/preview", {
        restaurantId: restaurant.restaurantId,
        items: apiItems,
        fulfillmentType,
        userBidAttempted: false,
        userBidAttemptedAt: null,
        triggerUserBid: true,
        applyCoins,
        deliveryAddress: fulfillmentType === "delivery" ? normalizedDeliveryAddress : undefined,
      });

      setPreviewState({ status: "ready", data: response, error: "" });
    } catch (error) {
      setUserBidError(
        toConsumerErrorMessage(error, "Unable to check for a better price right now.")
      );
    } finally {
      setUserBidLoading(false);
    }
  }

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
    setShowBmtConfirm(false);

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
        applyCoins,
        userBidAttempted,
        userBidAttemptedAt,
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

  async function handleCreateBmt(event) {
    event?.preventDefault?.();
    setSubmitError("");

    if (!canUseBmt) {
      setShowSmsAuthModal(true);
      return;
    }

    if (!restaurant?.restaurantId || apiItems.length === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }

    setCreatingBmt(true);

    try {
      const response = await createBmtSession({
        restaurantId: restaurant.restaurantId,
        restaurantSlug: restaurant.slug || restaurant.restaurantSlug || null,
        items: apiItems,
        fulfillmentType,
        deliveryAddress: fulfillmentType === "delivery" ? normalizedDeliveryAddress : undefined,
        requesterName: customerName.trim() || null,
        requesterPhone: customerPhone,
        requesterMessage: notes.trim() || DEFAULT_BMT_SHARE_MESSAGE,
        customerNotes: notes.trim() || null,
      });

      setBmtShareState({
        open: true,
        shareUrl: response.share_url || "",
        expiresAt: response.expires_at || "",
      });
      setShowBmtConfirm(false);
    } catch (error) {
      setSubmitError(
        toConsumerErrorMessage(
          error,
          "We couldn't create a Buy Me This link. This demo only needs the share link step, not Stripe payment."
        )
      );
    } finally {
      setCreatingBmt(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#11211a" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 18px 60px" }}>
        <PageNav back />

        <div
          style={{
            marginTop: 24,
            display: "grid",
            gap: 22,
            gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
          }}
        >
          <section style={sectionCardStyle}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#667085" }}>
              Checkout
            </div>
            <h1 style={{ fontSize: isMobile ? 28 : 32, margin: "8px 0 6px" }}>{restaurant.restaurantName}</h1>
            <p style={{ margin: 0, color: "#667085", lineHeight: 1.6 }}>
              Prices and totals are recalculated on the server before payment. The restaurant receives the direct charge on its connected Stripe account.
            </p>

            <form onSubmit={handleCreatePaymentIntent} style={{ marginTop: 24, display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Customer name</label>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Phone</label>
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Email (optional)</label>
                  <input
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    style={inputStyle}
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
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Delivery name</label>
                    <input
                      value={deliveryAddress.name}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, name: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Address line 1</label>
                    <input
                      value={deliveryAddress.line1}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, line1: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Address line 2</label>
                    <input
                      value={deliveryAddress.line2}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, line2: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>City</label>
                    <input
                      value={deliveryAddress.city}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, city: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>State</label>
                    <input
                      value={deliveryAddress.state}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, state: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Postal code</label>
                    <input
                      value={deliveryAddress.postalCode}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Delivery notes</label>
                    <input
                      value={deliveryAddress.instructions}
                      onChange={(event) => setDeliveryAddress((prev) => ({ ...prev, instructions: event.target.value }))}
                      style={inputStyle}
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
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {previewState.data?.coins?.enabled ? (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(17,33,26,0.10)",
                    background: "#fffef8",
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#11211a" }}>
                    G-Coins balance: {formatMoney(previewState.data.coins.available_balance_cents)}
                  </div>
                  <label
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: "#11211a",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={applyCoins}
                      onChange={(event) => setApplyCoins(event.target.checked)}
                      disabled={
                        previewState.status !== "ready" ||
                        previewState.data?.coins?.enabled !== true ||
                        (
                          previewState.data?.coins?.can_redeem !== true &&
                          previewState.data?.coins?.applied !== true
                        )
                      }
                    />
                    <span>Apply G-Coins</span>
                  </label>
                  {!previewState.data?.coins?.can_redeem && !previewState.data?.coins?.applied && previewState.data?.coins?.user_message ? (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#667085" }}>
                      {previewState.data.coins.user_message}
                    </div>
                  ) : null}
                </div>
              ) : null}

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
                <div style={{ display: "grid", gap: 10 }}>
                  <button
                    type="submit"
                    disabled={creatingIntent || creatingBmt || previewState.status === "loading"}
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
                </div>
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
                <div
                  ref={bmtSectionRef}
                  style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: "1px solid rgba(17,33,26,0.08)",
                  }}
                >
                  {canUseBmt ? (
                    <>
                      <div style={{ fontSize: 13, color: "#667085", lineHeight: 1.5 }}>
                        Need someone else to pay?
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBmtConfirm((prev) => !prev)}
                        disabled={creatingBmt}
                        style={{
                          marginTop: 6,
                          border: "none",
                          background: "transparent",
                          color: "#0f766e",
                          padding: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: creatingBmt ? "wait" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <ShareIcon />
                        Buy Me This instead
                      </button>

                      {showBmtConfirm ? (
                        <div
                          style={{
                            marginTop: 14,
                            borderRadius: 18,
                            border: "1px solid rgba(17,33,26,0.10)",
                            background: "#fffef8",
                            padding: "14px 16px",
                          }}
                        >
                          <div style={{ fontSize: 15, fontWeight: 900, color: "#11211a" }}>
                            Send this order to someone else to pay?
                          </div>
                          <div style={{ marginTop: 6, fontSize: 13, color: "#667085", lineHeight: 1.5 }}>
                            This request expires in 30 minutes.
                          </div>
                          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
                            <button
                              type="button"
                              onClick={handleCreateBmt}
                              disabled={creatingBmt}
                              style={{
                                borderRadius: 14,
                                border: "none",
                                background: "#11211a",
                                color: "#fff",
                                padding: "12px 14px",
                                fontSize: 14,
                                fontWeight: 900,
                                cursor: creatingBmt ? "wait" : "pointer",
                              }}
                            >
                              {creatingBmt ? "Creating share link..." : "Create Buy Me This link"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowBmtConfirm(false)}
                              disabled={creatingBmt}
                              style={{
                                borderRadius: 14,
                                border: "1px solid rgba(17,33,26,0.12)",
                                background: "#fff",
                                color: "#11211a",
                                padding: "12px 14px",
                                fontSize: 14,
                                fontWeight: 800,
                                cursor: creatingBmt ? "wait" : "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div
                      style={{
                        paddingTop: 2,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#11211a" }}>
                        {bmtGateTitle}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSmsAuthModal(true)}
                        style={{
                          marginTop: 6,
                          border: "none",
                          background: "transparent",
                          color: "#0f766e",
                          padding: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {bmtGateButton}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          <aside
            style={{
              ...sectionCardStyle,
              alignSelf: "start",
              position: isMobile ? "static" : "sticky",
              top: isMobile ? "auto" : 24,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#667085" }}>
              Order summary
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.lineId}
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
                      {item.pricingType === "deal" ? (
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "#166534" }}>
                          {item.pricingLabel || "Deal applied"}
                          {item.originalBasePriceCents > item.basePriceCents
                            ? ` · Was ${formatMoney(item.originalBasePriceCents)}`
                            : ""}
                        </div>
                      ) : null}
                      {item.modifiers?.length ? (
                        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                          {item.modifiers.map((modifier) => (
                            <div
                              key={`${item.lineId}-${modifier.groupId}-${modifier.optionId}`}
                              style={{ fontSize: 12, color: "#475467" }}
                            >
                              {modifier.name}
                              {modifier.priceDeltaCents > 0 ? ` (+${formatMoney(modifier.priceDeltaCents)})` : ""}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>
                      {formatMoney(item.lineTotalCents)}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        border: "1px solid rgba(17,33,26,0.10)",
                        borderRadius: 999,
                        padding: "4px 6px",
                        background: "#f8fafc",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                        style={{
                          border: "none",
                          background: "#fff",
                          width: 30,
                          height: 30,
                          borderRadius: 999,
                          cursor: "pointer",
                          fontSize: 16,
                          fontWeight: 900,
                        }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 18, textAlign: "center", fontSize: 14, fontWeight: 800 }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                        style={{
                          border: "none",
                          background: "#fff",
                          width: 30,
                          height: 30,
                          borderRadius: 999,
                          cursor: "pointer",
                          fontSize: 16,
                          fontWeight: 900,
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.lineId)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#991b1b",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <Link
                to={menuPath}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "11px 16px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(17,33,26,0.18)",
                  background: "#fff",
                  color: "#11211a",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                ← Continue ordering
              </Link>
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
                  {previewState.data.unlock_savings?.user_message ? (
                    <div
                      style={{
                        marginTop: 10,
                        borderRadius: 12,
                        background: "#f3f2ff",
                        border: "1px solid #c7d2fe",
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#312e81",
                      }}
                    >
                      {previewState.data.unlock_savings.user_message}
                    </div>
                  ) : null}
                  {previewState.data.unlock_savings?.applied ? (
                    <div
                      style={{
                        marginTop: 10,
                        borderRadius: 14,
                        background: "#ecfdf3",
                        border: "1px solid #bbf7d0",
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: "#0f7048" }}>
                        <span>Unlock savings applied</span>
                        <strong>
                          -{formatMoney(Math.round((previewState.data.unlock_savings?.discount_amount || 0) * 100))}
                        </strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#46703d", marginTop: 4 }}>Unlocked by GrubBid</div>
                    </div>
                  ) : null}
                  {previewState.data.cart_negotiation?.applied ? (
                    <div
                      style={{
                        borderRadius: 14,
                        background: "#eef8f2",
                        border: "1px solid #cce7d7",
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, gap: 12 }}>
                        <span style={{ color: "#124734", fontWeight: 800 }}>Private savings applied</span>
                        <strong style={{ color: "#124734" }}>
                          -{formatMoney(Math.round(Number(previewState.data.cart_negotiation.discount_amount || 0) * 100))}
                        </strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>Unlocked by GrubBid</div>
                    </div>
                  ) : null}
                  {currentPreviewData?.auto_optimization?.applied && currentPreviewData?.auto_optimization?.message ? (
                    <div
                      style={{
                        marginTop: 12,
                        borderRadius: 12,
                        background: "#f0f5ff",
                        border: "1px solid #c3d5fa",
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#1e2a50",
                      }}
                    >
                      {currentPreviewData.auto_optimization.message}
                    </div>
                  ) : null}
                  {canShowUserBidButton ? (
                    <button
                      type="button"
                      onClick={handleUserBid}
                      disabled={userBidLoading || previewState.status !== "ready"}
                      style={{
                        marginTop: 14,
                        width: "100%",
                        borderRadius: 16,
                        border: "1px solid #0f172a",
                        background: userBidLoading ? "#94a3b8" : "#0f172a",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        padding: "12px 16px",
                        cursor: userBidLoading ? "wait" : "pointer",
                      }}
                    >
                      {userBidLoading ? "Checking for a better price…" : "Try for a better price"}
                    </button>
                  ) : userBidMessageText ? (
                    <div
                      style={{
                        marginTop: 14,
                        borderRadius: 14,
                        border: "1px solid rgba(15,23,42,0.12)",
                        padding: "12px 14px",
                        background: "#fff",
                        fontSize: 13,
                        color: "#0f172a",
                      }}
                    >
                      {userBidMessageText}
                    </div>
                  ) : null}
                  {userBidError ? (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: "#fee2e2",
                        color: "#991b1b",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {userBidError}
                    </div>
                  ) : null}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#667085" }}>Tax</span>
                    <strong>{formatMoney(previewState.data.tax_cents)}</strong>
                  </div>
                  {previewState.data.coins?.applied ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 14,
                        color: "#124734",
                        fontWeight: 800,
                      }}
                    >
                      <span>G-Coins</span>
                      <strong>-{formatMoney(previewState.data.coins.redeemed_cents)}</strong>
                    </div>
                  ) : null}
                  {previewState.data.coins?.enabled && !previewState.data.coins?.applied && previewState.data.coins?.can_redeem ? (
                    <div style={{ fontSize: 12, color: "#667085" }}>
                      Up to {formatMoney(previewState.data.coins.max_redeemable_cents)} available this order.
                    </div>
                  ) : null}
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

      <BuyMeThisShareModal
        open={bmtShareState.open}
        onClose={() => setBmtShareState({ open: false, shareUrl: "", expiresAt: "" })}
        shareUrl={bmtShareState.shareUrl}
        requesterName={customerName}
        restaurantName={restaurant?.restaurantName}
        expiresAt={bmtShareState.expiresAt}
        shareMessage={notes.trim() || DEFAULT_BMT_SHARE_MESSAGE}
      />
      <SmsAuthModal
        open={showSmsAuthModal}
        onClose={() => setShowSmsAuthModal(false)}
        onSuccess={() => {
          setShowSmsAuthModal(false);
          setShowBmtConfirm(true);
          setSubmitError("");
          setTimeout(() => {
            scrollToBmtSection();
          }, 0);
        }}
      />
      {authToast ? (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 1500,
            borderRadius: 14,
            background: "#11211a",
            color: "#fff",
            padding: "12px 14px",
            fontSize: 13,
            fontWeight: 800,
            boxShadow: "0 18px 40px rgba(15,23,42,0.24)",
          }}
        >
          {authToast}
        </div>
      ) : null}
    </div>
  );
}
