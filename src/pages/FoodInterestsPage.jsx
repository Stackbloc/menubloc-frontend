import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import WaiterPublicActivity from "../components/WaiterPublicActivity.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { fetchWaiterBriefing } from "../lib/waiterApi.js";
import { WAITER_MEAL_PERIODS, getDefaultMealPeriod, normalizeMealPeriodId } from "../lib/waiterMealPeriod.js";
import { getTimezoneForUsState } from "../lib/timeZoneUtils.js";
import { readMenuBrowserVenueSession } from "../lib/menuBrowserVenueContext.js";
import { readDetectedLocation } from "../lib/discoveryLocationPersistence.js";

// ⚠️ WAITER PROTECTION GUARDRAIL
// 2026-09-07 (user-authorized): briefing rebuilt to fixed sections —
// greeting → connect → joinMe → privateOffer → mealOptions (skip-if-null).
// Do not add MarketFallback, CommunityGrowthCard, or time-of-day greetings.
// WaiterPublicActivity remains additive. BottomNav required.

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_AUTO_LABEL_KEY = "grubbid.discovery.auto_label";
const CONNECTIONS_PATH = "/account/connections";
const PLANNING_PATH = "/my-menuply/connections-planning";

function parseSessionLocation(raw) {
  const str = String(raw || "").trim();
  if (!str) return { city: "", state: "" };
  const comma = str.lastIndexOf(",");
  if (comma === -1) return { city: str, state: "" };
  return { city: str.slice(0, comma).trim(), state: str.slice(comma + 1).trim() };
}

function resolveWaiterMarketLabel() {
  if (typeof window === "undefined") return "";
  const sessionLabel =
    String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim() ||
    String(window.sessionStorage.getItem(SESSION_AUTO_LABEL_KEY) || "").trim();
  if (sessionLabel) return sessionLabel;
  const detected = readDetectedLocation(window.localStorage);
  if (detected?.city && detected?.state) {
    return String(detected.label || `${detected.city}, ${detected.state}`).trim();
  }
  return "";
}

function formatBriefingDatetime(iso, timeZone) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  try {
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone }).format(d);
    const monthDay = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      timeZone,
    }).format(d);
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(d);
    return `${weekday}, ${monthDay} · ${time}`;
  } catch {
    return d.toLocaleString();
  }
}

function formatInviteDate(ymd) {
  if (!ymd) return null;
  const d = new Date(`${String(ymd).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

function joinMeLine(invite) {
  const host = String(invite?.hostName || "A diner").trim() || "A diner";
  const restaurant = String(invite?.restaurant || "").trim();
  const dateLabel = formatInviteDate(invite?.eventDate);
  if (invite?.type === "open_invite" && restaurant) {
    return `${host} is going to ${restaurant} and has an open invite.`;
  }
  if (restaurant && dateLabel) {
    return `${host} invited you to lunch at ${restaurant} on ${dateLabel}. Respond?`;
  }
  if (restaurant) {
    return `${host} invited you to ${restaurant}. Respond?`;
  }
  return `${host} invited you. Respond?`;
}

function SectionLabel({ children }) {
  return <div style={styles.sectionLabel}>{children}</div>;
}

function GreetingBlock({ greeting, timeZone }) {
  const firstName = String(greeting?.firstName || "there").trim() || "there";
  const when = formatBriefingDatetime(greeting?.localDatetime, timeZone);
  return (
    <header style={styles.greeting} data-testid="waiter-greeting">
      <div style={styles.waiterEyebrow}>
        <span>Waiter</span>
        <svg width="16" height="11" viewBox="6.5 12.5 11 7.5" fill="currentColor" aria-hidden="true">
          <path d="M11.58 16.34 7.4 13.68v5.32l4.18-2.66Z" />
          <path d="M12.42 16.34 16.6 13.68v5.32l-4.18-2.66Z" />
          <circle cx="12" cy="16.34" r="1" />
        </svg>
      </div>
      <p style={styles.hello}>Hello, {firstName}.</p>
      {when ? <p style={styles.when}>{when}</p> : null}
      <p style={styles.heres}>Here&apos;s what&apos;s going on:</p>
    </header>
  );
}

function ConnectSection({ connect }) {
  if (!connect) return null;
  const count = Number(connect.count || 0);
  const previews = Array.isArray(connect.previews) ? connect.previews : [];
  if (count <= 0) return null;
  const overflow = count > 3 ? count - 3 : 0;

  return (
    <section style={styles.section} data-testid="waiter-connect">
      <SectionLabel>Connect</SectionLabel>
      <p style={styles.sectionLead}>
        You have {count} connect invitation{count === 1 ? "" : "s"}
      </p>
      <div style={styles.stack}>
        {previews.slice(0, 3).map((row, idx) => (
          <Link
            key={row.connectionId || row.peerId || idx}
            to={CONNECTIONS_PATH}
            style={styles.listCard}
            data-testid="waiter-connect-preview"
          >
            <div style={styles.avatar}>
              {row.avatarUrl ? (
                <img src={row.avatarUrl} alt="" style={styles.avatarImg} />
              ) : (
                <span aria-hidden>{String(row.name || "?").slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.rowTitle}>{row.name || "Diner"}</div>
              {row.context ? <div style={styles.rowMeta}>{row.context}</div> : null}
            </div>
          </Link>
        ))}
      </div>
      {overflow > 0 ? (
        <Link to={CONNECTIONS_PATH} style={styles.footerLink} data-testid="waiter-connect-more">
          +{overflow} more · see connections
        </Link>
      ) : null}
    </section>
  );
}

function JoinMeSection({ joinMe }) {
  if (!joinMe) return null;
  const count = Number(joinMe.count || 0);
  const invites = Array.isArray(joinMe.topInvites) ? joinMe.topInvites : [];
  if (count <= 0) return null;

  return (
    <section style={styles.section} data-testid="waiter-join-me">
      <SectionLabel>Join Me</SectionLabel>
      <div style={styles.stack}>
        {invites.slice(0, 3).map((invite, idx) => {
          const href = invite.href || PLANNING_PATH;
          const line = joinMeLine(invite);
          return (
            <Link
              key={`${invite.hostName}-${invite.restaurant}-${idx}`}
              to={href}
              style={styles.listCard}
              data-testid="waiter-join-me-invite"
            >
              <div style={styles.rowTitle}>{line}</div>
            </Link>
          );
        })}
      </div>
      <Link to={PLANNING_PATH} style={styles.footerLink} data-testid="waiter-join-me-footer">
        See your connections for full updates
      </Link>
    </section>
  );
}

function PrivateOfferSection({ privateOffer }) {
  if (!privateOffer) return null;
  const tag = String(privateOffer.preferenceTag || "").trim();
  const restaurant = String(privateOffer.restaurant || "").trim();
  const dishName = String(privateOffer.dishName || "").trim();
  if (!tag || !restaurant || !dishName) return null;

  const discount = String(privateOffer.discountLabel || "").trim();
  const redeemBy = privateOffer.redeemByDate
    ? formatInviteDate(privateOffer.redeemByDate)
    : null;
  const body = [
    `${restaurant} sent you an exclusive invite: ${dishName}`,
    discount || null,
    redeemBy ? `anytime before ${redeemBy}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const inner = (
    <>
      <div style={styles.offerKicker}>Because you love {tag}</div>
      <p style={styles.offerBody}>{body}.</p>
      <div style={styles.offerCta}>Redeem when you&apos;re ready →</div>
    </>
  );

  if (privateOffer.link) {
    return (
      <section style={styles.section} data-testid="waiter-private-offer">
        <Link to={privateOffer.link} style={styles.offerCard}>
          {inner}
        </Link>
      </section>
    );
  }

  return (
    <section style={styles.section} data-testid="waiter-private-offer">
      <div style={styles.offerCard}>{inner}</div>
    </section>
  );
}

function MealOptionsSection({ mealOptions, mealPeriod, onSelectMealPeriod }) {
  if (!mealOptions) return null;
  const buckets = mealOptions.buckets || {};
  const active = normalizeMealPeriodId(mealPeriod) || mealOptions.currentBucket || "lunch";
  const cards = Array.isArray(buckets[active]) ? buckets[active] : [];
  if (cards.length === 0) return null;

  const periodLabel =
    WAITER_MEAL_PERIODS.find((p) => p.id === active)?.label || "Meal";

  return (
    <section style={styles.section} data-testid="waiter-meal-options">
      <div style={styles.tabs} role="tablist" aria-label="Meal period">
        {WAITER_MEAL_PERIODS.map((period) => {
          const selected = active === period.id;
          return (
            <button
              key={period.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelectMealPeriod(period.id)}
              style={{
                ...styles.tab,
                ...(selected ? styles.tabSelected : null),
              }}
            >
              {period.label}
            </button>
          );
        })}
      </div>
      <SectionLabel>{periodLabel} options</SectionLabel>
      <div style={styles.stack}>
        {cards.map((card) => {
          const items = (card.items || []).slice(0, 2);
          const href = card.restaurant_slug
            ? `/restaurants/${card.restaurant_slug}`
            : card.restaurant_id
              ? `/restaurants/${card.restaurant_id}`
              : null;
          const detail = items.join(" · ");
          const content = (
            <>
              <div style={styles.rowTitle}>{card.restaurant}</div>
              {detail ? <div style={styles.rowMeta}>{detail}</div> : null}
            </>
          );
          return href ? (
            <Link
              key={`${card.restaurant}-${card.restaurant_id || ""}`}
              to={href}
              style={styles.listCard}
              data-testid="waiter-meal-card"
            >
              {content}
            </Link>
          ) : (
            <div
              key={`${card.restaurant}-${card.restaurant_id || ""}`}
              style={styles.listCard}
              data-testid="waiter-meal-card"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function FoodInterestsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const [searchParams, setSearchParams] = useSearchParams();

  const [locationLabel] = useState(resolveWaiterMarketLabel);
  const location = parseSessionLocation(locationLabel);
  const timeZone = getTimezoneForUsState(location.state);

  const clusterSlug =
    String(searchParams.get("cluster") || searchParams.get("cluster_slug") || "").trim() ||
    readMenuBrowserVenueSession() ||
    "";
  const clusterId = String(searchParams.get("cluster_id") || "").trim();

  const [mealPeriod, setMealPeriod] = useState(() => {
    const fromUrl = normalizeMealPeriodId(searchParams.get("meal_period"));
    if (fromUrl) return fromUrl;
    return getDefaultMealPeriod(new Date(), timeZone);
  });

  const canFetchBriefing = Boolean((location.city && location.state) || isAuthenticated);
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(canFetchBriefing);

  // Fetch once per market/auth/cluster — meal tabs switch client-side from mealOptions.buckets.
  useEffect(() => {
    if (!canFetchBriefing) {
      setBriefing(null);
      setBriefingLoading(false);
      return undefined;
    }
    let cancelled = false;
    setBriefingLoading(true);
    const period = getDefaultMealPeriod(new Date(), timeZone);
    fetchWaiterBriefing(location.city, location.state, period, {
      clusterId: clusterId || undefined,
      clusterSlug: clusterSlug || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        if (!data?.ok) {
          setBriefing(null);
          return;
        }
        setBriefing(data);
        const fromUrl = normalizeMealPeriodId(searchParams.get("meal_period"));
        const bucket =
          fromUrl || normalizeMealPeriodId(data.mealOptions?.currentBucket);
        if (bucket) setMealPeriod(bucket);
      })
      .catch(() => {
        if (!cancelled) setBriefing(null);
      })
      .finally(() => {
        if (!cancelled) setBriefingLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- meal_period is client-only; do not refetch on tab change
  }, [canFetchBriefing, location.city, location.state, clusterId, clusterSlug, timeZone]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.location.hash !== "#activity") return undefined;
    const el = document.getElementById("activity");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    return undefined;
  }, [briefingLoading]);

  function selectMealPeriod(id) {
    const nextId = normalizeMealPeriodId(id) || id;
    setMealPeriod(nextId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("meal_period", nextId);
      return next;
    });
  }

  const greeting = useMemo(() => {
    if (briefing?.greeting) return briefing.greeting;
    const first =
      String(briefing?.account?.first_name || "").trim() || (isAuthenticated ? "there" : "there");
    return { firstName: first, localDatetime: new Date().toISOString() };
  }, [briefing, isAuthenticated]);

  const hasAnySection = Boolean(
    briefing?.connect ||
      briefing?.joinMe ||
      briefing?.privateOffer ||
      briefing?.mealOptions
  );

  // Global --gb-color-ink is near-white (dark-surface default). Waiter briefing is a
  // light page — set ink explicitly or greeting/section copy goes invisible.
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111827",
        paddingBottom: "calc(var(--bottom-nav-h, 72px) + 28px)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 0" }}>
        <GreetingBlock greeting={greeting} timeZone={timeZone} />

        {!isAuthenticated ? (
          <div style={styles.signInStrip}>
            <div style={{ fontSize: 13, color: "#14532D", lineHeight: 1.45 }}>
              Sign in to see connect requests, Join Me invites, and private offers.
            </div>
            <button
              type="button"
              onClick={() => navigate("/account/login?next=%2Fwaiter")}
              style={styles.signInBtn}
            >
              Sign In
            </button>
          </div>
        ) : null}

        <div aria-live="polite" style={{ marginTop: 8 }}>
          {briefingLoading ? (
            <div style={{ fontSize: 14, color: "#4B5563", padding: "12px 0" }}>
              Loading your briefing…
            </div>
          ) : !canFetchBriefing ? (
            <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.55, padding: "12px 0" }}>
              Set your location on the home screen or sign in for personalized updates.
            </div>
          ) : (
            <>
              <ConnectSection connect={briefing?.connect ?? null} />
              <JoinMeSection joinMe={briefing?.joinMe ?? null} />
              <PrivateOfferSection privateOffer={briefing?.privateOffer ?? null} />
              <MealOptionsSection
                mealOptions={briefing?.mealOptions ?? null}
                mealPeriod={mealPeriod}
                onSelectMealPeriod={selectMealPeriod}
              />
              {!hasAnySection ? (
                <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.55, padding: "12px 0" }}>
                  Nothing new in your briefing right now. Check back soon.
                </div>
              ) : null}
            </>
          )}
        </div>

        <WaiterPublicActivity />
      </div>
      <BottomNav />
    </div>
  );
}

const styles = {
  greeting: { marginBottom: 8 },
  waiterEyebrow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 13,
    fontWeight: 800,
    color: "#15803D",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  hello: {
    margin: "12px 0 0",
    fontSize: 28,
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
    fontWeight: 800,
    color: "#111827",
  },
  when: { margin: "6px 0 0", fontSize: 14, color: "#4B5563" },
  heres: { margin: "10px 0 0", fontSize: 15, color: "#374151" },
  section: { marginTop: 22 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#6B7280",
    marginBottom: 8,
  },
  sectionLead: { margin: "0 0 10px", fontSize: 14, color: "#111827", fontWeight: 600 },
  stack: { display: "grid", gap: 8 },
  listCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: "12px 14px",
    border: "1px solid rgba(17,24,39,0.12)",
    background: "linear-gradient(180deg, #111827, #0B0F0C)",
    textDecoration: "none",
    color: "#F9FAFB",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "rgba(34,197,94,0.18)",
    color: "#86EFAC",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  rowTitle: { fontSize: 14, fontWeight: 700, color: "#F9FAFB", lineHeight: 1.35 },
  rowMeta: { fontSize: 12, color: "#D1D5DB", marginTop: 3, lineHeight: 1.4 },
  footerLink: {
    display: "inline-block",
    marginTop: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#15803D",
    textDecoration: "none",
  },
  offerCard: {
    display: "block",
    borderRadius: 16,
    padding: "16px 16px 14px",
    border: "1px solid rgba(251,191,36,0.45)",
    background: "linear-gradient(135deg, rgba(69,42,10,0.95), rgba(30,24,12,0.96))",
    textDecoration: "none",
    color: "#FEF3C7",
  },
  offerKicker: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#FBBF24",
  },
  offerBody: { margin: "10px 0 0", fontSize: 15, lineHeight: 1.45, color: "#FEF3C7" },
  offerCta: { marginTop: 12, fontSize: 13, fontWeight: 800, color: "#FDE68A" },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  tab: {
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid #D1D5DB",
    background: "#ffffff",
    color: "#4B5563",
    cursor: "pointer",
  },
  tabSelected: {
    border: "1px solid #16A34A",
    background: "rgba(22,163,74,0.12)",
    color: "#15803D",
  },
  signInStrip: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(22,163,74,0.28)",
    background: "rgba(22,163,74,0.08)",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  signInBtn: {
    border: "none",
    borderRadius: 999,
    background: "#16A34A",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 800,
    padding: "10px 12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
