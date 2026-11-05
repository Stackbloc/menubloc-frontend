/**
 * /join/:clusterLaunch — owner landing page + restaurant directory (e.g. /join/usc-launch).
 * Plan: 21-cluster-owner-claim-and-sales-page-plan.md (Andre 2026-11-04).
 *
 * Lists every restaurant in the cluster (existing GET /public/clusters/:slug/restaurants,
 * which already carries claim_status). "Claim it" sends the owner through the EXISTING
 * operator claim flow (/operator/claim); nothing here claims or verifies anything.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import { fetchClusterRestaurants } from "../../lib/clusterApi.js";
import {
  displayCuisine,
  joinBasePath,
  resolveJoinCluster,
  saveClaimIntent,
} from "../../lib/joinLaunch.js";
import "../../styles/joinLaunch.css";

const PAGE_SIZE = 36; // the endpoint returns at most 36 per page
const MAX_PAGES = 10;

async function fetchAllClusterRestaurants(clusterSlug, signal) {
  const all = [];
  const seen = new Set();
  let offset = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const res = await fetchClusterRestaurants(clusterSlug, { limit: PAGE_SIZE, offset, signal });
    const rows = Array.isArray(res?.restaurants) ? res.restaurants : [];
    for (const r of rows) {
      const id = Number(r.restaurant_id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      all.push(r);
    }
    offset += rows.length;
    if (!res?.pagination?.has_more || rows.length === 0) break;
  }
  return all.sort((a, b) =>
    String(a.restaurant_name || "").localeCompare(String(b.restaurant_name || ""), undefined, { sensitivity: "base" }),
  );
}

export default function JoinClusterLaunchPage() {
  const { clusterLaunch } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cluster = resolveJoinCluster(clusterLaunch);
  const { isAuthenticated, isEmailVerified, restaurants: myRestaurants } = useOperator();
  const src = searchParams.get("src") || "";

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("");

  useEffect(() => {
    if (!cluster) return undefined;
    const ctrl = new AbortController();
    setStatus("loading");
    fetchAllClusterRestaurants(cluster.clusterSlug, ctrl.signal)
      .then((list) => {
        setRows(list);
        setStatus("ready");
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setStatus("error");
      });
    return () => ctrl.abort();
  }, [cluster?.clusterSlug]);

  const myIds = useMemo(
    () => new Set((myRestaurants || []).map((r) => Number(r.id)).filter(Boolean)),
    [myRestaurants],
  );

  const cuisines = useMemo(() => {
    const counts = new Map();
    for (const r of rows) {
      const c = displayCuisine(r.cuisine);
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c);
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (cuisine && displayCuisine(r.cuisine) !== cuisine) return false;
      if (q && !String(r.restaurant_name || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, cuisine]);

  if (!cluster) return <Navigate to="/clusters" replace />;

  const base = joinBasePath(cluster.clusterSlug);
  const nextPath = `${base}/next`;

  function nextHref(restaurantId) {
    const p = new URLSearchParams({ restaurant: String(restaurantId) });
    if (src) p.set("src", src);
    return `${nextPath}?${p.toString()}`;
  }

  function startClaim(r) {
    const restaurantId = Number(r.restaurant_id);
    const restaurantName = String(r.restaurant_name || "");
    saveClaimIntent({ restaurantId, restaurantName, returnPath: nextPath, src });
    if (isAuthenticated && isEmailVerified) {
      const p = new URLSearchParams({ restaurant: String(restaurantId), q: restaurantName, return: nextPath });
      if (src) p.set("src", src);
      navigate(`/operator/claim?${p.toString()}`);
    } else {
      // New owners land on /operator/claim after sign-up / sign-in / email
      // verification; the saved intent pre-selects this restaurant there.
      navigate("/operator/signup");
    }
  }

  return (
    <div className="jl-page">
      <header className="jl-top">
        <div className="jl-wrap">
          <BrandLogo height={30} pageColor="#ffffff" />
          <span className="jl-spacer" />
          {!isAuthenticated ? (
            <Link className="jl-toplink" to="/operator/login">Sign in</Link>
          ) : null}
        </div>
      </header>

      <main className="jl-wrap">
        <section className="jl-hero">
          <span className="jl-eyebrow">{cluster.eyebrow}</span>
          <h1 className="jl-h1">Your restaurant is already on Menuply.</h1>
          <p className="jl-sub">
            Find it below and claim it free. Claiming your profile also claims your menu, so you can fix
            prices and items any time.
          </p>
          <div className="jl-launch">
            <div className="jl-cal" aria-hidden="true">
              <div className="jl-cal-m">{cluster.launchMonth}</div>
              <div className="jl-cal-y">{cluster.launchYear}</div>
            </div>
            <div>
              <strong>Launching {cluster.areaLabel} in {cluster.launchLabel}.</strong> Get your profile right
              before diners arrive.
            </div>
          </div>
        </section>

        <section className="jl-find" aria-labelledby="jl-find-title">
          <h2 className="jl-h2" id="jl-find-title">Find your restaurant</h2>
          <input
            className="jl-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Restaurant name"
            aria-label="Search restaurants by name"
          />
          {cuisines.length > 1 ? (
            <div className="jl-chips" role="group" aria-label="Filter by cuisine">
              <button type="button" className="jl-chip" aria-pressed={!cuisine} onClick={() => setCuisine("")}>
                All
              </button>
              {cuisines.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="jl-chip"
                  aria-pressed={cuisine === c}
                  onClick={() => setCuisine(cuisine === c ? "" : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}

          {status === "loading" ? <div className="jl-state">Loading restaurants…</div> : null}
          {status === "error" ? (
            <div className="jl-state">We couldn't load the restaurant list. Please refresh the page.</div>
          ) : null}

          {status === "ready" ? (
            <>
              <p className="jl-count">
                {visible.length === rows.length
                  ? `${rows.length} restaurants in ${cluster.clusterLabel}`
                  : `${visible.length} of ${rows.length} restaurants`}
              </p>
              {visible.length === 0 ? (
                <div className="jl-state">
                  No match. Try another name, or{" "}
                  <Link to="/operator/claim">search all of Menuply</Link>.
                </div>
              ) : (
                <ul className="jl-list">
                  {visible.map((r) => {
                    const id = Number(r.restaurant_id);
                    const mine = myIds.has(id);
                    const claimed = String(r.claim_status || "").toLowerCase() === "claimed";
                    const street = String(r.address_line1 || "").split(",")[0];
                    const meta = [street, displayCuisine(r.cuisine)].filter(Boolean).join(" · ");
                    const dishes = Number(r.menu_item_count || 0);
                    return (
                      <li key={id} className="jl-row">
                        <div className="jl-row-main">
                          <div className="jl-row-name">{r.restaurant_name}</div>
                          {meta ? <div className="jl-row-meta">{meta}</div> : null}
                          {dishes > 0 ? (
                            <div className="jl-row-dish">{dishes} {dishes === 1 ? "dish" : "dishes"} on Menuply</div>
                          ) : null}
                        </div>
                        {mine ? (
                          <Link className="jl-pill jl-pill-green" to={nextHref(id)}>Continue</Link>
                        ) : claimed ? (
                          <span className="jl-tag">Claimed</span>
                        ) : (
                          <button
                            type="button"
                            className="jl-pill jl-pill-green"
                            onClick={() => startClaim(r)}
                            aria-label={`Claim ${r.restaurant_name}`}
                          >
                            Claim
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}
        </section>

        <p className="jl-footnote">
          Your listing and profile are always free. {cluster.disclaimer}
        </p>
      </main>
    </div>
  );
}
