import { useLanguage } from "../../context/LanguageContext.jsx";
import WaiterFaceIcon from "../icons/WaiterFaceIcon.jsx";

/**
 * Waiter-style coach on public menu surfaces — tap inside an item row to add to cart.
 */
export default function MenuPurchaseWaiterHint() {
  const { t } = useLanguage();

  return (
    <section
      aria-label={t("publicMenu.purchaseHintLabel", "How to order from this menu")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "0 0 12px",
        padding: 0,
      }}
    >
      <WaiterFaceIcon size={28} title={t("publicMenu.purchaseHintWaiter", "Waiter tip")} />
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.45,
          color: "#6B7280",
        }}
      >
        {t(
          "publicMenu.purchaseHint",
          "To select items for purchase, press inside the item area."
        )}
      </p>
    </section>
  );
}
