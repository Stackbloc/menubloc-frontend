import { useLanguage } from "../../context/LanguageContext.jsx";
import WaiterFaceIcon from "../icons/WaiterFaceIcon.jsx";

/**
 * Waiter-style coach on public menu surfaces — tap inside an item row to add to cart.
 */
export default function MenuPurchaseWaiterHint({ sticky = false, stickyBackground = "#ffffff" }) {
  const { t } = useLanguage();

  return (
    <section
      aria-label={t("publicMenu.purchaseHintLabel", "How to order from this menu")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "0 0 12px",
        padding: sticky ? "8px 0" : 0,
        ...(sticky
          ? {
              position: "sticky",
              top: 0,
              zIndex: 25,
              background: stickyBackground,
              boxShadow: "0 1px 0 rgba(15, 23, 42, 0.08)",
            }
          : {}),
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
