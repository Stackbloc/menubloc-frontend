/**
 * /advertise — the advertising marketplace (plan 22 Phase 4).
 *
 * Link in (owner launch page): /advertise?restaurant=&cluster=usc&step=deal|billboards|clip&src=flyer[&deal_id=]
 * The backend owns everything that matters: spots, prices, holds, payment and the
 * hand-off token back to /join/…/next. This page only shows and asks. It never
 * says "paid" on its own; only the backend's webhook-confirmed order can.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  STEP_PRODUCT,
  fetchAdCatalog,
  formatUsd,
  priceLabel,
  quoteAds,
  skipAdStep,
  startAdCheckout,
  termLabel,
} from "../../lib/adMarketplaceApi.js";
import { PRODUCT_LABEL, REGION_PLACEMENT } from "../../lib/adPlacements.js";
import "../../styles/advertise.css";

const STEP_TITLE = {
  deal: "Promote a deal",
  billboards: "Pick a billboard",
  clip: "Feature a clip",
};

const MAX_TERM_COUNT = 12;

function formatLaunch(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function unavailableText(reason) {
  if (reason === "sold_out") return "Sold out";
  if (reason === "no_price") return "Price coming soon";
  if (reason === "pricing_after_guarantee_not_ready") return "New prices coming soon";
  return "Not available";
}

/** Spot details: shown on hover and keyboard focus, and toggled by tap. */
function SpotDetails({ spot }) {
  const [open, setOpen] = useState(false);
  // Escape hides the details even while hover/focus would still show them.
  const [dismissed, setDismissed] = useState(false);
  const id = `ad-spot-details-${spot.spot_id}`;
  const reset = () => {
    setOpen(false);
    setDismissed(false);
  };
  return (
    <span
      className={`ad-info${open ? " is-open" : ""}${dismissed ? " is-dismissed" : ""}`}
      onMouseLeave={reset}
    >
      <button
        type="button"
        className="ad-info-btn"
        aria-expanded={open && !dismissed}
        aria-controls={id}
        aria-describedby={id}
        aria-label={`Details for ${spot.name}`}
        onClick={() => {
          setDismissed(false);
          setOpen((v) => !v);
        }}
        onBlur={reset}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setDismissed(true);
          }
        }}
      >
        i
      </button>
      <span className="ad-info-pop" id={id} role="tooltip">
        <strong>{spot.name}</strong>
        <span>Shows: {REGION_PLACEMENT[spot.page_region] || "On the cluster page"}</span>
        {spot.width && spot.height ? <span>Size: {spot.width} × {spot.height} px</span> : null}
        {spot.category ? <span>Category: {spot.category.label || spot.category.key}</span> : null}
        <span>{spot.rotation.terms}</span>
        {!spot.rotation.exclusive ? (
          <span>
            {spot.shares_available} of {spot.rotation.shares} turns open
          </span>
        ) : null}
        <span className="ad-info-id">Spot ID {spot.spot_id}</span>
      </span>
    </span>
  );
}

function SpotCard({ spot, inBasket, onAdd }) {
  const [period, setPeriod] = useState(spot.prices[0]?.term_period || "");
  const [count, setCount] = useState(1);
  const price = spot.prices.find((p) => p.term_period === period);

  return (
    <li className="ad-spot">
      <div className="ad-spot-head">
        <div>
          <div className="ad-spot-name">
            {spot.name} <SpotDetails spot={spot} />
          </div>
          <div className="ad-spot-meta">
            {PRODUCT_LABEL[spot.product] || spot.product} · {spot.rotation.exclusive ? "Exclusive" : `Rotating, ${spot.rotation.shares} turns`}
          </div>
        </div>
        {spot.purchasable ? null : <span className="ad-tag">{unavailableText(spot.unavailable_reason)}</span>}
      </div>

      {spot.purchasable ? (
        <div className="ad-spot-buy">
          <div className="ad-periods" role="radiogroup" aria-label={`How long ${spot.name} runs`}>
            {spot.prices.map((p) => (
              <button
                key={p.term_period}
                type="button"
                role="radio"
                aria-checked={period === p.term_period}
                className="ad-chip"
                onClick={() => setPeriod(p.term_period)}
              >
                {priceLabel(p)}
              </button>
            ))}
          </div>
          <div className="ad-count">
            <button
              type="button"
              className="ad-step"
              aria-label="Fewer"
              disabled={count <= 1}
              onClick={() => setCount((c) => Math.max(1, c - 1))}
            >
              −
            </button>
            <span aria-live="polite">{termLabel(period, count)}</span>
            <button
              type="button"
              className="ad-step"
              aria-label="More"
              disabled={count >= MAX_TERM_COUNT}
              onClick={() => setCount((c) => Math.min(MAX_TERM_COUNT, c + 1))}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="ad-pill ad-pill-green"
            disabled={!price || inBasket}
            onClick={() => onAdd({ spot_id: spot.spot_id, term_period: period, term_count: count })}
          >
            {inBasket ? "Added" : `Add · ${formatUsd((price?.price_cents || 0) * count)}`}
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default function AdvertisePage() {
  const [sp] = useSearchParams();
  const location = useLocation();
  const { loading: authLoading, isAuthenticated, restaurants } = useOperator();

  const clusterSlug = String(sp.get("cluster") || "usc").toLowerCase();
  const step = STEP_PRODUCT[sp.get("step")] ? sp.get("step") : "";
  const src = sp.get("src") || "";
  const dealId = sp.get("deal_id") || "";
  const done = sp.get("done") === "1";
  const canceled = sp.get("canceled") === "1";
  const requestedRestaurant = Number(sp.get("restaurant") || 0);

  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [basket, setBasket] = useState([]);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pickedRestaurant, setPickedRestaurant] = useState(0);

  useEffect(() => {
    let alive = true;
    setCatalog(null);
    setLoadError("");
    fetchAdCatalog(clusterSlug, { product: STEP_PRODUCT[step] })
      .then((data) => alive && setCatalog(data))
      .catch((err) => alive && setLoadError(err.message || "Couldn't load ad spots."));
    return () => {
      alive = false;
    };
  }, [clusterSlug, step]);

  // Prices always come from the server.
  useEffect(() => {
    let alive = true;
    setQuote(null);
    setQuoteError("");
    if (!basket.length) return undefined;
    quoteAds({ cluster: clusterSlug, items: basket })
      .then((data) => alive && setQuote(data))
      .catch((err) => alive && setQuoteError(err.message || "Couldn't price these spots."));
    return () => {
      alive = false;
    };
  }, [basket, clusterSlug]);

  const ownRestaurants = useMemo(() => restaurants || [], [restaurants]);
  const restaurant = useMemo(() => {
    const id = pickedRestaurant || requestedRestaurant;
    return ownRestaurants.find((r) => Number(r.id) === id) || (ownRestaurants.length === 1 ? ownRestaurants[0] : null);
  }, [ownRestaurants, pickedRestaurant, requestedRestaurant]);
  // CRM staff may buy for a restaurant they don't own; the server decides.
  const restaurantId = restaurant ? Number(restaurant.id) : requestedRestaurant || 0;

  const cluster = catalog?.cluster;
  const checkoutOpen = Boolean(catalog?.checkout_open);
  const launch = formatLaunch(cluster?.launch_date);
  const spots = catalog?.spots || [];
  const nextPath = `${location.pathname}${location.search}`;

  async function checkout() {
    setBusy(true);
    setActionError("");
    try {
      const res = await startAdCheckout({ restaurantId, cluster: clusterSlug, items: basket, step, src, dealId });
      if (res?.checkout_url) window.location.assign(res.checkout_url);
      else setActionError("Checkout didn't start. Please try again.");
    } catch (err) {
      setActionError(err.message || "Checkout didn't start.");
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    setBusy(true);
    setActionError("");
    try {
      const res = await skipAdStep({ restaurantId, cluster: clusterSlug, step });
      if (res?.return_url) window.location.assign(res.return_url);
    } catch (err) {
      setActionError(err.message || "Couldn't skip this step.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-page">
      <header className="ad-top">
        <div className="ad-wrap">
          <BrandLogo height={30} pageColor="#ffffff" />
          <span className="ad-spacer" />
          {restaurant ? <span className="ad-toplink">{restaurant.restaurant_name || restaurant.name}</span> : null}
        </div>
      </header>

      <main className="ad-wrap">
        <h1 className="ad-h1">{STEP_TITLE[step] || "Advertise on Menuply"}</h1>
        {cluster ? <p className="ad-sub">{cluster.name}</p> : null}

        {done ? (
          <div className="ad-notice" role="status">
            Thanks. We're confirming your payment with the card company.
          </div>
        ) : null}
        {canceled ? (
          <div className="ad-notice ad-notice-muted" role="status">
            Checkout was canceled. Nothing was charged.
          </div>
        ) : null}

        {cluster ? (
          <div className="ad-terms">
            {cluster.price_tier === "early_bird" ? (
              <p>
                <strong>Early-bird prices.</strong> Locked for 60 days from launch day
                {launch ? ` (${launch})` : ""}. You pay now; your ad starts on launch day. How long it runs is what you
                pick below.
              </p>
            ) : (
              <p>Prices are set by how many people use Menuply here each month.</p>
            )}
            <p>{cluster.ads_start}</p>
          </div>
        ) : null}

        {loadError ? <div className="ad-error" role="alert">{loadError}</div> : null}
        {!catalog && !loadError ? <div className="ad-state">Loading spots…</div> : null}
        {catalog && !spots.length ? (
          <div className="ad-state">No spots are open here yet. We'll email you when they are.</div>
        ) : null}

        {spots.length ? (
          <ul className="ad-spots">
            {spots.map((spot) => (
              <SpotCard
                key={spot.spot_id}
                spot={spot}
                inBasket={basket.some((b) => b.spot_id === spot.spot_id)}
                onAdd={(item) => setBasket((prev) => [...prev, item])}
              />
            ))}
          </ul>
        ) : null}

        {basket.length ? (
          <section className="ad-basket" aria-label="Your order">
            <h2 className="ad-h2">Your order</h2>
            <ul className="ad-lines">
              {(quote?.lines || basket).map((line) => (
                <li key={`${line.spot_id}-${line.term_period}`}>
                  <span>
                    {line.name || line.spot_id} · {termLabel(line.term_period, line.term_count)}
                  </span>
                  <span className="ad-line-right">
                    {line.price_cents != null ? formatUsd(line.price_cents) : "…"}
                    <button
                      type="button"
                      className="ad-link-btn"
                      onClick={() => setBasket((prev) => prev.filter((b) => b.spot_id !== line.spot_id))}
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            {quote ? (
              <div className="ad-total">
                <span>Total</span>
                <strong>{formatUsd(quote.total_cents)}</strong>
              </div>
            ) : null}
            {quoteError ? <div className="ad-error" role="alert">{quoteError}</div> : null}
          </section>
        ) : null}

        {isAuthenticated && ownRestaurants.length > 1 && !restaurant ? (
          <label className="ad-field">
            Which restaurant is this for?
            <select value={pickedRestaurant || ""} onChange={(e) => setPickedRestaurant(Number(e.target.value))}>
              <option value="">Pick one</option>
              {ownRestaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.restaurant_name || r.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {actionError ? <div className="ad-error" role="alert">{actionError}</div> : null}

        <div className="ad-actions">
          {!checkoutOpen && catalog ? (
            <span className="ad-soon">Checkout opens soon. You can look around and plan.</span>
          ) : null}
          {checkoutOpen && basket.length && !authLoading && !isAuthenticated ? (
            <Link className="ad-pill ad-pill-green" to="/operator/login" state={{ nextPath }}>
              Sign in to check out
            </Link>
          ) : null}
          {checkoutOpen && basket.length && isAuthenticated ? (
            <button
              type="button"
              className="ad-pill ad-pill-green"
              disabled={busy || !quote || !restaurantId}
              onClick={checkout}
            >
              {busy ? "Opening checkout…" : `Check out · ${quote ? formatUsd(quote.total_cents) : "…"}`}
            </button>
          ) : null}
          {step && isAuthenticated && restaurantId ? (
            <button type="button" className="ad-link-btn" disabled={busy} onClick={skip}>
              Not now
            </button>
          ) : null}
        </div>
        <p className="ad-fine">Payments are by card through Stripe. Menuply never sees your card number.</p>
      </main>
    </div>
  );
}
