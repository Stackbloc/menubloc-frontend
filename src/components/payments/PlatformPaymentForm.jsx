import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export default function PlatformPaymentForm({
  submitLabel = "Pay now",
  returnUrl,
  onConfirmed,
}) {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: returnUrl ? { return_url: returnUrl } : undefined,
      redirect: "if_required",
    });

    setSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error.message || "Payment confirmation failed.");
      return;
    }

    if (result.paymentIntent && onConfirmed) {
      onConfirmed(result.paymentIntent);
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
        {submitting ? "Confirming payment..." : submitLabel}
      </button>
    </form>
  );
}
