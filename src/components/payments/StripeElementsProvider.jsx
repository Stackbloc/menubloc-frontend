import { useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getStripePublishableKey } from "./paymentHelpers.js";

const stripePublishableKey = getStripePublishableKey();
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function StripeElementsProvider({ clientSecret, children }) {
  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
      },
    }),
    [clientSecret]
  );

  if (!stripePromise || !clientSecret) {
    return null;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
