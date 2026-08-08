import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  createDestinationVenueOrderRequest,
  fetchDestinationVenueDeliveryFee,
  fetchDestinationVenueOrderRequest,
  fetchDestinationVenueVendor,
  formatCents,
  formatStadiumPrice,
} from "../lib/destinationVenueApi.js";
import {
  clearStadiumCart,
  loadStadiumCart,
  removeStadiumCartItem,
  setStadiumCartLocation,
  stadiumCartItemCount,
  updateStadiumCartQuantity,
} from "../lib/stadiumOrderCart.js";

const STEPS = ["cart", "location", "seat", "summary", "confirmed"];

const css = {
  page: {
    minHeight: "100dvh",
    background: "linear-gradient(180deg, #0f1a24 0%, #152535 45%, #1a2a38 100%)",
    color: "#f2f5f7",
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    paddingBottom: 96,
  },
  sticky: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(15,26,36,0.96)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "12px 16px 14px",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 800 },
  subtitle: { margin: "6px 0 0", fontSize: 13, color: "rgba(242,245,247,0.65)" },
  banner: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(251,191,36,0.12)",
    border: "1px solid rgba(251,191,36,0.35)",
    fontSize: 13,
    fontWeight: 600,
    color: "#fde68a",
  },
  body: { padding: "14px 16px 24px" },
  card: {
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 14,
    marginBottom: 12,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  name: { margin: 0, fontSize: 16, fontWeight: 800 },
  meta: { margin: "4px 0 0", fontSize: 13, color: "rgba(242,245,247,0.65)" },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 50,
    borderRadius: 14,
    border: "none",
    marginTop: 12,
    fontSize: 16,
    fontWeight: 800,
    background: "#3dd68c",
    color: "#0b1a12",
    cursor: "pointer",
  },
  btnDisabled: {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(242,245,247,0.4)",
    cursor: "not-allowed",
  },
  ghost: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "0 12px",
    background: "transparent",
    color: "rgba(242,245,247,0.9)",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 17,
    padding: "14px 14px",
    marginTop: 8,
  },
  label: {
    display: "block",
    marginTop: 14,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "rgba(242,245,247,0.45)",
  },
  radio: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    minHeight: 48,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    marginBottom: 8,
    cursor: "pointer",
  },
  empty: { textAlign: "center", padding: 36, color: "rgba(242,245,247,0.55)" },
  line: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    fontSize: 15,
  },
  qty: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 700,
    cursor: "pointer",
  },
};

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ord-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function DestinationVenueOrderPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = searchParams.get("step") || "cart";
  const step = STEPS.includes(stepParam) ? stepParam : "cart";
  const confirmedNumber = searchParams.get("order") || "";

  const [cart, setCart] = useState(() => loadStadiumCart(slug));
  const [fee, setFee] = useState(null);
  const [vendorDetail, setVendorDetail] = useState(null);
  const [seatSection, setSeatSection] = useState("");
  const [seatRow, setSeatRow] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [idempotencyKey] = useState(() => newIdempotencyKey());

  useEffect(() => {
    setCart(loadStadiumCart(slug));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    fetchDestinationVenueDeliveryFee(slug)
      .then((data) => {
        if (!cancelled && data?.ok) setFee(data.fee);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!cart.vendor_slug) {
      setVendorDetail(null);
      return;
    }
    let cancelled = false;
    fetchDestinationVenueVendor(slug, cart.vendor_slug)
      .then((data) => {
        if (!cancelled && data?.ok) setVendorDetail(data);
      })
      .catch(() => {
        if (!cancelled) setVendorDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, cart.vendor_slug]);

  useEffect(() => {
    if (step !== "confirmed" || !confirmedNumber) return;
    let cancelled = false;
    fetchDestinationVenueOrderRequest(slug, confirmedNumber)
      .then((data) => {
        if (!cancelled && data?.ok) setConfirmed(data.order);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug, step, confirmedNumber]);

  const locations = vendorDetail?.vendor?.locations || [];
  const selectedLocation = locations.find(
    (l) => String(l.id) === String(cart.vendor_location_id)
  );

  const estimate = useMemo(() => {
    const demoUnit = fee?.demo_sample_unit_price_cents ?? 1499;
    const delivery = fee?.delivery_fee_cents ?? 0;
    let subtotal = 0;
    const lines = (cart.items || []).map((item) => {
      let unitCents;
      let priceSource;
      if (item.price_available && item.price != null) {
        unitCents = Math.round(Number(item.price) * 100);
        priceSource = "verified";
      } else {
        unitCents = demoUnit;
        priceSource = "demo_sample";
      }
      const line = unitCents * item.quantity;
      subtotal += line;
      return { ...item, unitCents, priceSource, line };
    });
    return {
      lines,
      subtotalCents: subtotal,
      deliveryFeeCents: delivery,
      totalCents: subtotal + delivery,
    };
  }, [cart.items, fee]);

  function setStep(next, extra = {}) {
    const p = new URLSearchParams(searchParams);
    p.set("step", next);
    Object.entries(extra).forEach(([k, v]) => {
      if (v == null || v === "") p.delete(k);
      else p.set(k, String(v));
    });
    setSearchParams(p, { replace: next !== "confirmed" });
  }

  function refreshCart() {
    setCart(loadStadiumCart(slug));
  }

  async function submitOrder() {
    if (submitting) return;
    setError("");
    if (!cart.vendor_id || !cart.vendor_location_id) {
      setError("Choose a fulfillment location");
      setStep("location");
      return;
    }
    if (!seatSection.trim() || !seatRow.trim() || !seatNumber.trim()) {
      setError("Section, row, and seat are required");
      setStep("seat");
      return;
    }
    if (!cart.items.length) {
      setError("Your cart is empty");
      setStep("cart");
      return;
    }
    setSubmitting(true);
    try {
      const data = await createDestinationVenueOrderRequest(slug, {
        idempotency_key: idempotencyKey,
        vendor_id: Number(cart.vendor_id),
        vendor_location_id: Number(cart.vendor_location_id),
        seat_section: seatSection.trim(),
        seat_row: seatRow.trim(),
        seat_number: seatNumber.trim(),
        items: cart.items.map((i) => ({
          ck_menu_item_id: Number(i.ck_menu_item_id),
          quantity: Number(i.quantity),
        })),
      });
      if (!data?.ok || !data.order) {
        throw new Error(data?.error || "Order request failed");
      }
      clearStadiumCart(slug);
      setConfirmed(data.order);
      setStep("confirmed", { order: data.order.public_order_number });
    } catch (err) {
      setError(err.message || "Order request failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "confirmed" && confirmed) {
    return (
      <div style={css.page}>
        <header style={css.sticky}>
          <h1 style={css.title}>Order requested</h1>
          <p style={css.subtitle}>{confirmed.public_order_number}</p>
          <div style={css.banner}>
            Demo order request — no payment was collected.
          </div>
        </header>
        <main style={css.body}>
          <div style={css.card}>
            <p style={css.name}>{confirmed.vendor_name}</p>
            <p style={css.meta}>Status: {confirmed.status}</p>
            <p style={css.meta}>
              {confirmed.vendor_location_label || "Fulfillment location on file"}
            </p>
            <p style={css.meta}>
              Deliver to Section {confirmed.seat_section} · Row {confirmed.seat_row} ·
              Seat {confirmed.seat_number}
            </p>
            {(confirmed.items || []).map((it) => (
              <div key={it.id || it.ck_menu_item_id} style={css.line}>
                <span>
                  {it.item_name} × {it.quantity}
                  {it.price_source === "demo_sample" ? " (sample price)" : ""}
                </span>
                <span>{formatCents(it.line_total_cents)}</span>
              </div>
            ))}
            <div style={{ ...css.line, marginTop: 16 }}>
              <span>Seat delivery</span>
              <span>{formatCents(confirmed.delivery_fee_cents)}</span>
            </div>
            <div style={{ ...css.line, fontWeight: 800 }}>
              <span>Total</span>
              <span>{formatCents(confirmed.total_cents)}</span>
            </div>
            <p style={css.meta}>
              {confirmed.created_at
                ? new Date(confirmed.created_at).toLocaleString()
                : ""}
            </p>
          </div>
          <Link to={`/destination-venues/${encodeURIComponent(slug)}/food`} style={css.btn}>
            Back to stadium food
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div style={css.page}>
        <header style={css.sticky}>
          <Link to={`/destination-venues/${encodeURIComponent(slug)}/food`} style={css.ghost}>
            ← Food & Drink
          </Link>
          <h1 style={{ ...css.title, marginTop: 12 }}>Your order</h1>
        </header>
        <div style={css.empty}>Cart is empty.</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={css.page}>
      <header style={css.sticky}>
        <button
          type="button"
          style={css.ghost}
          onClick={() => {
            if (step === "cart") {
              navigate(`/destination-venues/${encodeURIComponent(slug)}/food`);
            } else if (step === "location") setStep("cart");
            else if (step === "seat") setStep("location");
            else if (step === "summary") setStep("seat");
          }}
        >
          ← Back
        </button>
        <h1 style={{ ...css.title, marginTop: 12 }}>
          {step === "cart" && "Your order"}
          {step === "location" && "Fulfillment location"}
          {step === "seat" && "Deliver to your seat"}
          {step === "summary" && "Order summary"}
        </h1>
        <p style={css.subtitle}>
          {cart.vendor_name} · {stadiumCartItemCount(cart)} item
          {stadiumCartItemCount(cart) === 1 ? "" : "s"}
        </p>
        <div style={css.banner}>
          Demo order request — you will not be charged.
        </div>
      </header>

      <main style={css.body}>
        {error ? (
          <div style={{ ...css.banner, borderColor: "rgba(248,113,113,0.5)", color: "#fecaca" }}>
            {error}
          </div>
        ) : null}

        {step === "cart" ? (
          <>
            {cart.items.map((item) => (
              <article key={item.ck_menu_item_id} style={css.card}>
                <div style={css.row}>
                  <div>
                    <h2 style={css.name}>{item.item_name}</h2>
                    <p style={css.meta}>
                      {item.price_available
                        ? formatStadiumPrice(item.price, true)
                        : "Sample price at checkout (price unavailable)"}
                    </p>
                  </div>
                </div>
                <div style={css.qty}>
                  <button
                    type="button"
                    style={css.qtyBtn}
                    onClick={() => {
                      updateStadiumCartQuantity(slug, item.ck_menu_item_id, item.quantity - 1);
                      refreshCart();
                    }}
                  >
                    −
                  </button>
                  <span style={{ fontWeight: 800, minWidth: 24, textAlign: "center" }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    style={css.qtyBtn}
                    onClick={() => {
                      updateStadiumCartQuantity(slug, item.ck_menu_item_id, item.quantity + 1);
                      refreshCart();
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    style={{ ...css.ghost, marginLeft: 8 }}
                    onClick={() => {
                      removeStadiumCartItem(slug, item.ck_menu_item_id);
                      refreshCart();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
            <button type="button" style={css.btn} onClick={() => setStep("location")}>
              Continue
            </button>
          </>
        ) : null}

        {step === "location" ? (
          <>
            <p style={css.meta}>Choose pickup / fulfillment location</p>
            {locations.length === 0 ? (
              <div style={css.empty}>Location unavailable for this vendor.</div>
            ) : (
              locations.map((loc) => {
                const selected = String(cart.vendor_location_id) === String(loc.id);
                return (
                  <label
                    key={loc.id}
                    style={{
                      ...css.radio,
                      borderColor: selected ? "#3dd68c" : "rgba(255,255,255,0.12)",
                    }}
                  >
                    <input
                      type="radio"
                      name="vendor_location"
                      checked={selected}
                      onChange={() => {
                        setStadiumCartLocation(slug, loc.id);
                        refreshCart();
                        if (loc.section && /^\d/.test(String(loc.section))) {
                          setSeatSection(String(loc.section));
                        }
                      }}
                    />
                    <span style={{ fontWeight: 700 }}>
                      {loc.label || loc.location_description || `Location ${loc.id}`}
                    </span>
                  </label>
                );
              })
            )}
            <button
              type="button"
              style={{
                ...css.btn,
                ...(cart.vendor_location_id ? {} : css.btnDisabled),
              }}
              disabled={!cart.vendor_location_id}
              onClick={() => setStep("seat")}
            >
              Continue
            </button>
          </>
        ) : null}

        {step === "seat" ? (
          <>
            {selectedLocation ? (
              <p style={css.meta}>
                Fulfilling from {selectedLocation.label || selectedLocation.location_description}
              </p>
            ) : null}
            <label style={css.label}>Section</label>
            <input
              style={css.input}
              value={seatSection}
              onChange={(e) => setSeatSection(e.target.value)}
              placeholder="e.g. 216"
              inputMode="text"
            />
            <label style={css.label}>Row</label>
            <input
              style={css.input}
              value={seatRow}
              onChange={(e) => setSeatRow(e.target.value)}
              placeholder="e.g. 8"
              inputMode="text"
            />
            <label style={css.label}>Seat</label>
            <input
              style={css.input}
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="e.g. 14"
              inputMode="text"
            />
            <button
              type="button"
              style={{
                ...css.btn,
                ...(seatSection.trim() && seatRow.trim() && seatNumber.trim()
                  ? {}
                  : css.btnDisabled),
              }}
              disabled={!seatSection.trim() || !seatRow.trim() || !seatNumber.trim()}
              onClick={() => setStep("summary")}
            >
              Review order
            </button>
          </>
        ) : null}

        {step === "summary" ? (
          <>
            <div style={css.card}>
              <p style={css.name}>{cart.vendor_name}</p>
              <p style={css.meta}>
                {selectedLocation?.label || "Selected location"}
              </p>
              {estimate.lines.map((line) => (
                <div key={line.ck_menu_item_id} style={css.line}>
                  <span>
                    {line.item_name} × {line.quantity}
                    {line.priceSource === "demo_sample" ? " · sample price" : ""}
                  </span>
                  <span>{formatCents(line.line)}</span>
                </div>
              ))}
              <div style={{ ...css.line, marginTop: 16 }}>
                <span>Subtotal</span>
                <span>{formatCents(estimate.subtotalCents)}</span>
              </div>
              <div style={css.line}>
                <span>Seat delivery</span>
                <span>{formatCents(estimate.deliveryFeeCents)}</span>
              </div>
              <div style={{ ...css.line, fontWeight: 800, fontSize: 17 }}>
                <span>Total</span>
                <span>{formatCents(estimate.totalCents)}</span>
              </div>
              <p style={{ ...css.meta, marginTop: 14 }}>
                Deliver to Section {seatSection} · Row {seatRow} · Seat {seatNumber}
              </p>
            </div>
            <button
              type="button"
              style={{ ...css.btn, ...(submitting ? css.btnDisabled : {}) }}
              disabled={submitting}
              onClick={submitOrder}
            >
              {submitting ? "Submitting…" : "Confirm order request"}
            </button>
            <p style={{ ...css.meta, textAlign: "center", marginTop: 10 }}>
              No payment will be collected.
            </p>
          </>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}
