import PlatformPaymentForm from "./PlatformPaymentForm.jsx";

export default function SubscriptionCheckoutForm(props) {
  return (
    <PlatformPaymentForm
      submitLabel={props.submitLabel || "Start subscription"}
      returnUrl={props.returnUrl}
      onConfirmed={props.onConfirmed}
    />
  );
}
