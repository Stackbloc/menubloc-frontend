/**
 * /join/:clusterLaunch/next — after claiming: "your menu is yours too", then the
 * optional sales steps Deals → Billboards → Clips → Ordering (Andre's order).
 * Plan: 21-cluster-owner-claim-and-sales-page-plan.md.
 *
 * Paid steps hand off to the advertising marketplace (Codex) using the agreed
 * /advertise contract. This page never prices, sells or confirms a purchase:
 * a `status=paid` on the return URL is NOT proof of payment (only the ad
 * backend's token check can confirm it), so we never show a paid/booked state.
 */
import React from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  ADVERTISING_MARKETPLACE_LIVE,
  JOIN_STEPS,
  buildAdvertiseUrl,
  joinBasePath,
  resolveJoinCluster,
} from "../../lib/joinLaunch.js";
import "../../styles/joinLaunch.css";

const STEP_LABELS = { deal: "Deals", billboards: "Billboards", clip: "Clips", ordering: "Ordering" };

function EarlyBird({ cluster }) {
  return (
    <div className="jl-earlybird">
      <strong>Early-bird price:</strong> based on our under-1,000-monthly-users tier and guaranteed for 60 days
      from launch day ({cluster.launchLabel}). You pay now; your ad starts on launch day. How long your ad runs
      is what you choose at checkout. The 60-day price guarantee is separate.
    </div>
  );
}

function MarketplaceButton({ label, href }) {
  if (!ADVERTISING_MARKETPLACE_LIVE) {
    return (
      <span className="jl-pill jl-pill-soon" aria-disabled="true">
        {label} · opens soon
      </span>
    );
  }
  return <a className="jl-pill jl-pill-green" href={href}>{label}</a>;
}

function SoonNote() {
  if (ADVERTISING_MARKETPLACE_LIVE) return null;
  return (
    <div className="jl-soon-note">
      Advertising checkout opens soon. Your profile is set either way; we'll let you know by email when you can
      book.
    </div>
  );
}

export default function JoinClusterNextPage() {
  const { clusterLaunch } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const cluster = resolveJoinCluster(clusterLaunch);
  const { loading, isAuthenticated, isEmailVerified, restaurants } = useOperator();

  if (!cluster) return <Navigate to="/clusters" replace />;
  const base = joinBasePath(cluster.clusterSlug);

  const restaurantId = Number(sp.get("restaurant") || 0);
  const step = JOIN_STEPS.includes(sp.get("step")) || sp.get("step") === "done" ? sp.get("step") : "";
  const src = sp.get("src") || "";
  const returnedStatus = sp.get("status"); // from the marketplace; informational only
  const handoffToken = sp.get("handoff_token");

  // The marketplace's return doesn't carry restaurant; fall back to the owner's only/first restaurant.
  const restaurant =
    (restaurants || []).find((r) => Number(r.id) === restaurantId) ||
    (!restaurantId && restaurants?.length === 1 ? restaurants[0] : null);

  function go(nextStep) {
    const p = new URLSearchParams();
    if (restaurant) p.set("restaurant", String(restaurant.id));
    if (nextStep) p.set("step", nextStep);
    if (src) p.set("src", src);
    navigate(`${base}/next?${p.toString()}`);
    window.scrollTo(0, 0);
  }
  const after = (s) => JOIN_STEPS[JOIN_STEPS.indexOf(s) + 1] || "done";

  const shell = (children) => (
    <div className="jl-page">
      <header className="jl-top">
        <div className="jl-wrap">
          <BrandLogo height={30} pageColor="#ffffff" />
          <span className="jl-spacer" />
          {restaurant ? <span className="jl-toplink">{restaurant.restaurant_name || restaurant.name}</span> : null}
        </div>
      </header>
      <main className="jl-wrap">{children}</main>
    </div>
  );

  if (loading) return shell(<div className="jl-state">Loading…</div>);

  if (!isAuthenticated || !isEmailVerified) {
    return shell(
      <div className="jl-center">
        <h1 className="jl-h1">Sign in to continue</h1>
        <p className="jl-sub">Sign in with the account you used to claim your restaurant.</p>
        <div className="jl-btns jl-btns-center">
          <Link className="jl-pill jl-pill-green" to="/operator/login">Sign in</Link>
          <Link className="jl-pill jl-pill-ghost" to={base}>Back to the list</Link>
        </div>
      </div>,
    );
  }

  if (!restaurant) {
    return shell(
      <div className="jl-center">
        <h1 className="jl-h1">Pick your restaurant</h1>
        <p className="jl-sub">This restaurant isn't linked to your account yet. Find it in the list and claim it.</p>
        <div className="jl-btns jl-btns-center">
          <Link className="jl-pill jl-pill-green" to={base}>Find my restaurant</Link>
        </div>
      </div>,
    );
  }

  const name = restaurant.restaurant_name || restaurant.name || "Your restaurant";

  // Step 0: just claimed.
  if (!step) {
    return shell(
      <div className="jl-center">
        <div className="jl-check" aria-hidden="true">✓</div>
        <h1 className="jl-h1" style={{ marginTop: 16 }}>{name} is claimed.</h1>
        <p className="jl-sub">
          <strong>Your menu is claimed too.</strong> You can update items, prices, photos, and hours any time from
          your dashboard.
        </p>
        <div className="jl-card">
          <div className="jl-card-kicker">Your menu</div>
          <p>We built it from public sources, so take a quick look when you have time.</p>
        </div>
        <div className="jl-btns jl-btns-center">
          <a className="jl-pill jl-pill-ghost" href="/operator/menulab" target="_blank" rel="noreferrer">
            Edit my menu
          </a>
          <button type="button" className="jl-pill jl-pill-green" onClick={() => go("deal")}>Continue</button>
        </div>
        <p className="jl-sub" style={{ fontSize: 13, color: "#6b625b", marginTop: 18 }}>
          Next: a few ways to stand out when Menuply launches {cluster.areaLabel}. Each step is optional.
        </p>
      </div>,
    );
  }

  if (step === "done") {
    return shell(
      <div className="jl-center">
        <div className="jl-check" aria-hidden="true">✓</div>
        <h1 className="jl-h1" style={{ marginTop: 16 }}>You're all set.</h1>
        <p className="jl-sub">
          {name} is ready for launch {cluster.areaLabel}. You can change your menu, deals, and settings any time.
        </p>
        <div className="jl-btns jl-btns-center">
          <Link className="jl-pill jl-pill-green" to="/operator">Go to my dashboard</Link>
          <Link className="jl-pill jl-pill-ghost" to={base}>Back to the list</Link>
        </div>
      </div>,
    );
  }

  const idx = JOIN_STEPS.indexOf(step);
  const advertiseHref = (s, extra = {}) =>
    buildAdvertiseUrl({ restaurantId: restaurant.id, clusterSlug: cluster.clusterSlug, step: s, src, ...extra });

  // Coming back from the marketplace. Only the ad backend's token check can confirm
  // a payment; until that check exists we never say "paid" or "booked".
  const returnNotice =
    handoffToken && returnedStatus === "paid" ? (
      <div className="jl-notice" role="status">
        Thanks. We're confirming your payment and will email your receipt once it clears.
      </div>
    ) : null;

  let body = null;
  if (step === "deal") {
    body = (
      <div className="jl-card">
        <h2 className="jl-card-title">Bring diners in with a deal</h2>
        <p>Deals show on your menu and in the Deals tab. Promote one to put it in front of more diners at launch.</p>
        <ul className="jl-checks">
          <li>Create or edit deals any time, free</li>
          <li>Promoting a deal is optional and starts on launch day</li>
        </ul>
        <div className="jl-btns">
          <MarketplaceButton label="Promote a deal" href={advertiseHref("deal")} />
          <Link className="jl-pill jl-pill-ghost" to="/operator/deals">Create a deal</Link>
          <button type="button" className="jl-link-btn" onClick={() => go(after("deal"))}>Not now</button>
        </div>
        <SoonNote />
      </div>
    );
  } else if (step === "billboards") {
    body = (
      <div className="jl-card">
        <h2 className="jl-card-title">Put your restaurant in front of hungry diners</h2>
        <p>Billboards sit right where diners choose what to eat, like inside the Pasta list or at the top of the cluster page.</p>
        <div className="jl-sample" aria-hidden="true">
          <div className="jl-sample-k">YOUR RESTAURANT</div>
          <div className="jl-sample-h">Your ad or deal here</div>
          <div className="jl-sample-s">Seen by diners browsing Pasta {cluster.areaLabel}</div>
        </div>
        <ul className="jl-checks">
          <li>See every spot, where it shows, and its price</li>
          <li>Own a category, or share a top spot</li>
          <li>Pay now; it starts on launch day</li>
        </ul>
        <div className="jl-btns">
          <MarketplaceButton label="Pick a billboard" href={advertiseHref("billboards")} />
          <button type="button" className="jl-link-btn" onClick={() => go(after("billboards"))}>Not now</button>
        </div>
        <SoonNote />
      </div>
    );
  } else if (step === "clip") {
    body = (
      <div className="jl-card">
        <h2 className="jl-card-title">Show your food in a clip</h2>
        <p>Short clips play right on the cluster page. Diners tap a dish clip and order.</p>
        <ul className="jl-checks">
          <li>Upload your own clip, or ask Menuply to make one</li>
          <li>Sponsored clips start on launch day</li>
        </ul>
        <div className="jl-btns">
          <MarketplaceButton label="Feature a clip" href={advertiseHref("clip")} />
          <button type="button" className="jl-link-btn" onClick={() => go(after("clip"))}>Not now</button>
        </div>
        <SoonNote />
      </div>
    );
  } else if (step === "ordering") {
    body = (
      <div className="jl-card">
        <h2 className="jl-card-title">Take real orders from Menuply diners</h2>
        <p>Turn your menu on so diners can order from you. No monthly fee; Menuply keeps 6% per order. Payments go straight to your account through Stripe.</p>
        <div className="jl-btns">
          <Link className="jl-pill jl-pill-green" to="/operator/merchant">Turn on ordering</Link>
          <button type="button" className="jl-link-btn" onClick={() => go("done")}>Not now</button>
        </div>
      </div>
    );
  }

  return shell(
    <>
      <ol className="jl-steps" aria-label="Steps">
        {JOIN_STEPS.map((s, i) => (
          <li key={s} data-state={i < idx ? "done" : i === idx ? "now" : "todo"} aria-current={i === idx ? "step" : undefined}>
            {i < idx ? "✓ " : ""}{STEP_LABELS[s]}
          </li>
        ))}
      </ol>
      {returnNotice}
      {step !== "ordering" ? <EarlyBird cluster={cluster} /> : null}
      {body}
      <p className="jl-footnote">{cluster.disclaimer}</p>
    </>,
  );
}
