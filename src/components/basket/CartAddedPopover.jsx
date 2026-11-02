/**
 * "Your cart (N)" confirmation after a dish is added from the item sheet (Andre, 2026-10-23,
 * after Viztango's Square Online popover). Shows the added line live from OrderCartContext —
 * photo, name, choices, line price, − qty + and trash — plus "Continue to cart $X". Desktop:
 * top-right card; phone: bottom card above the basket bar. Closes itself after a few seconds
 * unless the diner is pointing at or focused inside it.
 */
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { formatMenuItemName } from "../../utils/formatMenuItemName.js";
import { formatCents } from "./itemOrderSheetModel.js";

export const CART_POPOVER_AUTO_CLOSE_MS = 5000;

const POPOVER_CSS = `
.mp-cart-pop{position:fixed;top:84px;right:24px;width:380px;max-width:calc(100vw - 24px);z-index:1170;background:#fff;color:#11181c;border-radius:12px;box-shadow:0 18px 50px rgba(15,23,32,.22);padding:22px 24px;animation:mp-cart-pop-in .18s ease-out}
.mp-cart-pop .mp-cart-step{width:34px;height:34px;border-radius:999px;border:none;background:#f1f3f5;font-size:18px;line-height:1;cursor:pointer;color:#11181c}
@keyframes mp-cart-pop-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@media (max-width:640px){
  .mp-cart-pop{top:auto;right:12px;left:12px;width:auto;bottom:calc(84px + env(safe-area-inset-bottom));padding:16px 16px}
}
`;

export default function CartAddedPopover({
  line,
  photoUrl,
  itemCount,
  subtotalCents,
  brand,
  onUpdateQuantity,
  onRemove,
  onContinue,
  onClose,
}) {
  const accent = brand?.accent || "var(--mp-accent, #0f7a24)";
  const onAccent = brand?.onAccent || "#fff";
  const [hold, setHold] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (hold) return undefined;
    const timer = window.setTimeout(() => onClose?.(), CART_POPOVER_AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [hold, onClose, line?.quantity]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!line) return null;
  const choices = (Array.isArray(line.modifiers) ? line.modifiers : []).map((m) => m?.name).filter(Boolean);
  const detail = [choices.join(", "), line.preparationInstructions].filter(Boolean).join(" · ");

  // Portal: menu templates create their own stacking contexts, so render at <body>.
  return createPortal(
    <div
      ref={rootRef}
      className="mp-cart-pop"
      role="dialog"
      aria-label={`Your cart (${itemCount})`}
      data-testid="cart-added-popover"
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => { if (!rootRef.current?.contains(e.relatedTarget)) setHold(false); }}
    >
      <style>{POPOVER_CSS}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0.3 }}>
          <span aria-hidden="true" style={{ color: accent, marginRight: 6 }}>✓</span>
          Your cart ({itemCount})
        </div>
        <button type="button" aria-label="Close cart preview" onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#4b5560" }}>
          ✕
        </button>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        {photoUrl ? (
          <img src={photoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{formatMenuItemName(line.name)}</span>
            <span style={{ fontSize: 16, whiteSpace: "nowrap" }}>{formatCents(line.lineTotalCents)}</span>
          </div>
          {detail ? <div style={{ marginTop: 6, fontSize: 14, color: "#4b5560" }}>{detail}</div> : null}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              className="mp-cart-step"
              aria-label="Decrease quantity"
              onClick={() => (line.quantity > 1 ? onUpdateQuantity?.(line.lineId, line.quantity - 1) : onRemove?.(line.lineId))}
            >
              −
            </button>
            <span aria-live="polite" data-testid="cart-popover-quantity" style={{ fontSize: 16 }}>{line.quantity}</span>
            <button
              type="button"
              className="mp-cart-step"
              aria-label="Increase quantity"
              onClick={() => onUpdateQuantity?.(line.lineId, line.quantity + 1)}
            >
              +
            </button>
            <button
              type="button"
              aria-label={`Remove ${formatMenuItemName(line.name)}`}
              onClick={() => onRemove?.(line.lineId)}
              style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", padding: 6, color: "#11181c" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        data-testid="cart-popover-continue"
        onClick={onContinue}
        style={{ marginTop: 20, width: "100%", minHeight: 50, border: "none", borderRadius: 999, background: accent, color: onAccent, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
      >
        Continue to cart {formatCents(subtotalCents)}
      </button>
    </div>,
    document.body
  );
}
