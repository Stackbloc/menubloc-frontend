import PlatformPaymentForm from "./PlatformPaymentForm.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SubscriptionCheckoutForm(props) {
  const { t } = useLanguage();
  return (
    <PlatformPaymentForm
      submitLabel={props.submitLabel || "Start subscription"}
      returnUrl={props.returnUrl}
      onConfirmed={props.onConfirmed}
    />
  );
}
