/**
 * Basket control for Feed Shop tab — opens the global order cart drawer.
 */

import { useOrderCart } from "../../../context/OrderCartContext.jsx";
import { useLanguage } from "../../../context/LanguageContext.jsx";

export default function FeedShopBasketButton() {
  const { t } = useLanguage();
  const { itemCount, openCart } = useOrderCart();
  const badge = itemCount > 9 ? "9+" : String(itemCount);

  return (
    <button
      type="button"
      data-testid="feed-shop-basket"
      aria-label={
        itemCount > 0
          ? t("nav.basketWithCount", "Basket with {count} items").replace("{count}", String(itemCount))
          : t("nav.basket", "Basket")
      }
      onClick={openCart}
      style={styles.btn}
    >
      <span aria-hidden="true" style={styles.icon}>
        🛒
      </span>
      {itemCount > 0 ? (
        <span style={styles.badge} aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

const styles = {
  btn: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "1px solid rgba(17, 33, 26, 0.14)",
    background: "#fff",
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
    fontFamily: "inherit",
  },
  icon: {
    fontSize: 20,
    lineHeight: 1,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    padding: "0 4px",
    borderRadius: 999,
    background: "#dc2626",
    color: "#fff",
    fontSize: 9,
    fontWeight: 800,
    lineHeight: "16px",
    textAlign: "center",
    boxSizing: "border-box",
  },
};
