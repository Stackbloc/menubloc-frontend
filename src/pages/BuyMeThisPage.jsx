import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatMenuItemName } from "../utils/formatMenuItemName.js";
import { Link, useParams, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  applyDocumentSocialMetadata,
  resolveShareImageUrl,
} from "../components/share/shareUtils.js";
import {
  createBmtCheckoutSession,
  getBmtSession,
  toConsumerErrorMessage,
} from "../lib/api.js";
import { formatMoney } from "../lib/pricingDisplay.js";

const MENUPLY_PRICE_DISCLOSURE =
  "Prices shown on Menuply may differ from in-store prices and may include Menuply’s service component. Taxes and optional tips are shown separately before you place your order.";

export default function BuyMeThisPage() {
  const { t } = useLanguage();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const [startingCheckout, setStartingCheckout] = useState(false);

  async function load() {
    try {
      const data = await getBmtSession(token);
      setState({ status: "ready", data, error: "" });
    } catch (error) {
      setState({
        status: "error",
        data: null,
        error: toConsumerErrorMessage(error, "This Buy Me This request is unavailable."),
      });
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    const session = state.data?.session;
    if (!session) return undefined;

    return applyDocumentSocialMetadata({
      title: session.preview?.title,
      description: session.preview?.description,
      url: session.share_url,
      image: resolveShareImageUrl({ imageUrl: session.preview?.image }),
    });
  }, [state.data]);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return undefined;

    const intervalId = window.setInterval(load, 3000);
    return () => window.clearInterval(intervalId);
  }, [searchParams, token]);

  const session = state.data?.session;
  const currentTotals = session?.current_totals || session?.totals_snapshot;
  const isActive = session?.status === "active";

  async function handlePay() {
    setStartingCheckout(true);

    try {
      const result = await createBmtCheckoutSession(token, {});
      if (!result.checkout_url) {
        throw new Error("No checkout URL was returned.");
      }
      window.location.href = result.checkout_url;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: toConsumerErrorMessage(error, "Unable to start payment for this request."),
      }));
    } finally {
      setStartingCheckout(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)" }}>
      <StickyPageHeader title="Buy Me This" />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "14px 18px 80px" }}>

        {state.status === "loading" ? (
          <div style={{ marginTop: 24 }}>Loading request…</div>
        ) : null}

        {state.status === "error" ? (
          <div
            style={{
              marginTop: 24,
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(239,68,68,0.08)",
              color: "#F87171",
              fontWeight: 700,
            }}
          >
            {state.error}
          </div>
        ) : null}

        {session ? (
          <div style={{ marginTop: 24, display: "grid", gap: 18 }}>
            <div
              style={{
                borderRadius: 24,
                background: "var(--gb-color-surface-strong)",
                border: "1px solid var(--gb-color-border)",
                padding: "24px 22px",
                boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.7 }}>
                Buy Me This
              </div>
              <h1 style={{ margin: "8px 0 6px", fontSize: 32 }}>
                {session.restaurant?.name || "Restaurant"}
              </h1>
              {session.requester_name ? (
                <div style={{ color: "#9CA3AF", fontWeight: 700 }}>
                  {session.requester_name} wants this order paid
                </div>
              ) : null}
              {session.requester_message ? (
                <div style={{ marginTop: 8, color: "#9CA3AF", lineHeight: 1.6 }}>
                  {session.requester_message}
                </div>
              ) : null}
              <div style={{ marginTop: 12, fontSize: 13, color: "#9CA3AF" }}>
                {session.status === "expired"
                  ? "This request has expired."
                  : `Expires ${new Date(session.expires_at).toLocaleString()}`}
              </div>

              {session.pricing_changed ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "rgba(234,179,8,0.08)",
                    color: "#FBBF24",
                    fontWeight: 700,
                  }}
                >
                  Pricing was updated before payment. You will pay the latest validated total.
                </div>
              ) : null}

              {session.validation_error ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "rgba(239,68,68,0.08)",
                    color: "#F87171",
                    fontWeight: 700,
                  }}
                >
                  {session.validation_error}
                </div>
              ) : null}
            </div>

            <div
              style={{
                borderRadius: 24,
                background: "var(--gb-color-surface-strong)",
                border: "1px solid var(--gb-color-border)",
                padding: "24px 22px",
                boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
              }}
            >
              <div style={{ display: "grid", gap: 12 }}>
                {(session.cart_items || []).map((item, index) => (
                  <div
                    key={`${item.line_id || index}`}
                    style={{
                      border: "1px solid var(--gb-color-border)",
                      borderRadius: 18,
                      background: "var(--gb-color-surface-strong)",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{formatMenuItemName(item.name)}</div>
                        <div style={{ fontSize: 13, color: "#9CA3AF" }}>Qty {item.quantity}</div>
                        {(item.modifiers || []).map((modifier) => (
                          <div
                            key={`${modifier.group_id}-${modifier.option_id}`}
                            style={{ marginTop: 4, fontSize: 12, color: "#9CA3AF" }}
                          >
                            {modifier.name}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontWeight: 900 }}>{formatMoney(item.line_total_cents)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Items subtotal</span>
                  <span>{formatMoney(currentTotals?.subtotal_cents)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tax</span>
                  <span>{formatMoney(currentTotals?.tax_cents)}</span>
                </div>
                {Number(currentTotals?.delivery_cents || 0) > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Delivery</span>
                    <span>{formatMoney(currentTotals?.delivery_cents)}</span>
                  </div>
                ) : null}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 18 }}>
                  <span>Total</span>
                  <span>{formatMoney(currentTotals?.total_cents)}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: "#9CA3AF" }}>
                  {MENUPLY_PRICE_DISCLOSURE}
                </div>
              </div>

              {isActive && !session.validation_error ? (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={startingCheckout}
                  style={{
                    marginTop: 18,
                    width: "100%",
                    border: "none",
                    borderRadius: 16,
                    background: startingCheckout ? "#4B5563" : "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
                    color: "#0B0F0C",
                    padding: "14px 16px",
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: startingCheckout ? "wait" : "pointer",
                  }}
                >
                  {startingCheckout ? "Redirecting…" : "Pay for this order"}
                </button>
              ) : (
                <Link
                  to={session.restaurant?.slug ? `/restaurants/${session.restaurant.slug}/menu` : "/"}
                  style={{ display: "inline-block", marginTop: 18, color: "#14532d", fontWeight: 800 }}
                >
                  Build a new order
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}
