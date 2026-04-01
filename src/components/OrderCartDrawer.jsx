import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderCart } from "../context/OrderCartContext.jsx";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function OrderCartDrawer() {
  const navigate = useNavigate();
  const {
    restaurant,
    items,
    isOpen,
    notice,
    subtotalCents,
    itemCount,
    openCart,
    closeCart,
    clearCart,
    clearNotice,
    updateQuantity,
    removeItem,
  } = useOrderCart();

  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <>
      {itemCount > 0 ? (
        <button
          type="button"
          onClick={openCart}
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 1100,
            border: "none",
            borderRadius: 999,
            background: "#11211a",
            color: "#f8fafc",
            padding: "14px 18px",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 0.2,
            boxShadow: "0 16px 40px rgba(15,23,42,0.20)",
            cursor: "pointer",
          }}
        >
          Cart ({itemCount}) • {formatMoney(subtotalCents)}
        </button>
      ) : null}

      <div
        onClick={closeCart}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2, 6, 23, 0.42)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 160ms ease",
          zIndex: 1198,
        }}
      />

      <aside
        aria-hidden={!isOpen}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(430px, 100vw)",
          background: "#fffef8",
          borderLeft: "1px solid rgba(17,33,26,0.10)",
          boxShadow: "-18px 0 50px rgba(15,23,42,0.16)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 180ms ease",
          zIndex: 1199,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(17,33,26,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: 0.6 }}>
                Order Cart
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#11211a", marginTop: 4 }}>
                {restaurant?.restaurantName || "Your order"}
              </div>
            </div>
            <button
              type="button"
              onClick={closeCart}
              style={{
                border: "1px solid rgba(17,33,26,0.12)",
                background: "#fff",
                borderRadius: 999,
                width: 36,
                height: 36,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
          {notice ? (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 12,
                background: "#fef3c7",
                color: "#92400e",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span>{notice}</span>
              <button
                type="button"
                onClick={clearNotice}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "inherit",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
          {items.length === 0 ? (
            <div style={{ color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
              Add menu items from one restaurant to start checkout.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.menuItemId}
                  style={{
                    border: "1px solid rgba(17,33,26,0.08)",
                    borderRadius: 18,
                    background: "#fff",
                    padding: "14px 14px 12px",
                    boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#11211a" }}>
                        {item.name}
                      </div>
                      {item.description ? (
                        <div style={{ fontSize: 12, color: "#667085", marginTop: 4, lineHeight: 1.5 }}>
                          {item.description}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#11211a", whiteSpace: "nowrap" }}>
                      {formatMoney(item.priceCents * item.quantity)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 14,
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
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
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
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
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
                      onClick={() => removeItem(item.menuItemId)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#991b1b",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "18px 22px 22px",
            borderTop: "1px solid rgba(17,33,26,0.08)",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 14, color: "#667085", fontWeight: 700 }}>Estimated subtotal</span>
            <strong style={{ fontSize: 18, color: "#11211a" }}>{formatMoney(subtotalCents)}</strong>
          </div>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => {
              closeCart();
              navigate("/checkout");
            }}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 16,
              background: items.length === 0 ? "#cbd5e1" : "#11211a",
              color: "#f8fafc",
              padding: "14px 16px",
              fontSize: 15,
              fontWeight: 900,
              cursor: items.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Continue to checkout
          </button>
          <button
            type="button"
            onClick={clearCart}
            disabled={items.length === 0}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#667085",
              padding: "12px 16px 0",
              fontSize: 13,
              fontWeight: 800,
              cursor: items.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Clear cart
          </button>
        </div>
      </aside>
    </>
  );
}
