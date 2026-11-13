/**
 * Today on menuply.com (Andre 2026-11-13: "the website should have a today page when user is
 * signed in, same as app"). A port of the app's Today tab (menuply-mobile app/(tabs)/today.tsx +
 * components/today/TodaySocial.tsx, plan 41): header → day strip → meal buttons → Your Connects →
 * "Ideas for <meal>" → type chips → ranked cards (Going here / Skip) → status line.
 * Shown only when signed in and the server's today_home flag is on for this diner, like the app.
 * Look rules: no green pills, no outlined oval pills, no full-width buttons (Andre 2026-10-29 / 11-06 / 11-12).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BrandLogo } from "../../../components/BrandLogo.jsx";
import AppIcon from "../../../components/icons/AppIcon.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import useConsumerFeatureFlags from "../../../hooks/useConsumerFeatureFlags.js";
import {
  askToJoinSocialPlan,
  deleteSocialPlan,
  getSocialPlanDetail,
  leaveSocialPlan,
} from "../../../lib/consumerApi.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import { restaurantMenuPath } from "../../../lib/canonicalUrlCore.js";
import { feedHeaderLocationLabel } from "../../../components/consumer/feed/FeedMobileHeader.jsx";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";
import {
  MEAL_INVITE,
  MEAL_WINDOWS,
  currentWindowKey,
  dayDate,
  dayLong,
  dayNumber,
  dayShort,
  fetchToday,
  lateCarry,
  logTodayEvent,
  mealTabs,
  namesText,
  notToday,
  reasonTone,
  sayYes,
  timeLabel,
  todayErrorMessage,
  trackTodaySponsorship,
  windowState,
} from "../../../lib/todayHome.js";

const C = {
  ink: "#111613",
  muted: "#5c665f",
  border: "#e1e6e1",
  surface: "#f5f7f4",
  white: "#ffffff",
  accent: "#0f7a24",
  hungry: "#b4441c",
  danger: "#b42318",
};

const SOCIAL_PLANS_PATH = "/account/social-plans";
const personPath = (id, isConnect = true) => (isConnect ? `/account/connections/${id}` : `/account/diners/${id}`);

function quickInvitePath({ code, to = null }) {
  const q = new URLSearchParams({ seed_code: code, quick_invite: "1" });
  if (to?.userId) {
    q.set("to_user_id", String(to.userId));
    if (to.name) q.set("to_name", to.name);
  }
  return `/account/invite-to-eat?${q.toString()}`;
}

function menuPathFor(id) {
  return restaurantMenuPath({ id }) || `/restaurants/${id}`;
}

function Avatar({ url, name, size = 36 }) {
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  return url ? (
    <img src={url} alt="" width={size} height={size} style={{ ...s.avatar, width: size, height: size }} />
  ) : (
    <span aria-hidden="true" style={{ ...s.avatar, ...s.avatarEmpty, width: size, height: size }}>{initial}</span>
  );
}

/** "Your Connects" (plan 41): Hungry now, Up for, Going — never plain Available. */
function OpenPanel({ open, meal, asked, onAsk, onPlanStatus, onInvite, onPerson, onQuickInvite }) {
  const mealWord = meal.key === "late" ? "late night" : meal.label.toLowerCase();
  const empty = !open.plans.length && !open.people.length && !open.upFor.length;
  const row = (p, line, testId, extra = null) => (
    <div key={testId} style={s.row} data-testid={testId}>
      <button type="button" style={s.rowPerson} onClick={() => onPerson(p)} aria-label={`${p.name}. View profile`}>
        <Avatar url={p.avatarUrl} name={p.name} />
        <span style={s.rowText}>
          <span style={s.rowName}>{p.name}</span>
          {line}
          {extra}
        </span>
      </button>
      <button type="button" style={{ ...s.textBtn, color: meal.color }} onClick={() => onInvite(p)}>
        Invite
      </button>
    </div>
  );
  return (
    <section style={{ ...s.panel, background: meal.soft }} data-testid="today-open" aria-label="Your Connects">
      <h2 style={{ ...s.panelTitle, color: meal.color }}>Your Connects</h2>
      {open.people.map((p) =>
        row(p, <span style={{ ...s.rowLine, ...(p.vibe === "hungry" ? s.rowHungry : null) }}>{p.label}</span>, `today-open-person-${p.userId}`)
      )}
      {open.upFor.map((p) =>
        row(
          p,
          <span style={s.rowLine}>{p.both ? `You’re both open for ${mealWord}` : p.label}</span>,
          `today-open-upfor-${p.userId}`,
          p.both && p.bothLike ? <span style={s.rowLine}>You both like {p.bothLike.name}</span> : null
        )
      )}
      {open.plans.map((p) => {
        const waiting = p.action === "asked" || asked.has(p.ref);
        return (
          <div key={p.ref} style={s.row} data-testid={`today-open-plan-${p.ref}`}>
            <button type="button" style={s.rowPerson} onClick={() => onPlanStatus(p)}>
              <Avatar url={p.avatarUrl} name={p.people[0] || "A Connect"} />
              <span style={s.rowText}>
                <span style={s.rowName}>{namesText(p.people)}</span>
                <span style={s.rowLine}>
                  Going to {p.placeName}
                  {p.time ? ` · ${timeLabel(p.time)}` : ""}
                </span>
              </span>
            </button>
            {waiting ? (
              <span style={s.waiting}>Asked</span>
            ) : (
              <button type="button" style={{ ...s.textBtn, color: meal.color }} onClick={() => onAsk(p)}>
                {p.action === "join" ? "Join" : "Ask to join"}
              </button>
            )}
          </div>
        );
      })}
      {empty ? <p style={{ ...s.rowLine, margin: 0 }} data-testid="today-open-empty">No pending activities</p> : null}
      <button type="button" style={{ ...s.textBtn, ...s.leftBtn, color: meal.color }} onClick={onQuickInvite} data-testid="today-quick-invite">
        Quick Invite ›
      </button>
    </section>
  );
}

function directions(plan) {
  if (plan.lat != null && plan.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${plan.lat},${plan.lng}&travelmode=walking`;
  return plan.placeName ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(plan.placeName)}&travelmode=walking` : null;
}

/** After Going here: one plan card until the meal ends. */
function PlanCard({ plan, meal, busy, onCantMakeIt }) {
  const url = directions(plan);
  const meta = [timeLabel(plan.time), plan.walkMinutes ? `${plan.walkMinutes} min walk` : null].filter(Boolean).join(" · ");
  return (
    <div style={{ ...s.card, borderColor: meal.color, borderWidth: 2 }} data-testid="today-plan-card">
      <div style={s.cardTop}>
        <span style={{ ...s.badge, background: meal.color }}>
          <AppIcon name="check" size={14} color="#fff" strokeWidth={3} />
        </span>
        <span style={{ ...s.small, color: meal.color }}>You&apos;re in</span>
      </div>
      <Link to={SOCIAL_PLANS_PATH} style={s.place}>
        {plan.placeName ? `${meal.label} at ${plan.placeName}` : plan.title}
      </Link>
      {meta ? <span style={s.meta}>{meta}</span> : null}
      <span style={s.body} data-testid="today-plan-people">
        {plan.going.length ? `${namesText(plan.going)} ${plan.going.length > 1 ? "are" : "is"} in` : "Just you so far"}
        {plan.asked.length ? ` · asked: ${namesText(plan.asked)}` : ""}
      </span>
      <div style={s.actionsLeft}>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" style={{ ...s.iconLink, color: meal.color }} data-testid="today-plan-directions">
            <AppIcon name="pin" size={16} color={meal.color} /> Directions
          </a>
        ) : null}
        {plan.restaurantId ? (
          <Link to={menuPathFor(plan.restaurantId)} style={{ ...s.iconLink, color: meal.color }} data-testid="today-plan-order">
            <AppIcon name="menu" size={16} color={meal.color} /> Order ahead
          </Link>
        ) : null}
      </div>
      <button type="button" style={{ ...s.textBtn, ...s.leftBtn, ...s.quiet }} onClick={onCantMakeIt} disabled={busy} data-testid="today-plan-cant">
        {busy ? "One moment…" : "Can't make it anymore"}
      </button>
    </div>
  );
}

/** Who's going on a Connect's plan, in a bottom sheet. */
function FriendPlanSheet({ plan, onClose, onPerson }) {
  const [detail, setDetail] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setDetail(null);
    setFailed(false);
    if (!plan) return undefined;
    let live = true;
    getSocialPlanDetail(plan.source, String(plan.ref))
      .then((b) => live && setDetail(b?.plan || null))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [plan?.source, plan?.ref]);
  useEffect(() => {
    if (!plan) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [plan, onClose]);
  if (!plan) return null;
  const attendees = Array.isArray(detail?.attendees) ? detail.attendees : [];
  const joined = attendees.filter((a) => a?.role !== "organizer");
  const guests = Number(detail?.guest_count) || 0;
  const going = joined.length + guests;
  return (
    <div style={s.scrim} onClick={onClose} data-testid="friend-plan-sheet">
      <div style={s.sheet} role="dialog" aria-modal="true" aria-label="Who's going" onClick={(e) => e.stopPropagation()}>
        {detail ? (
          <>
            <div>
              <div style={s.place}>{detail.title || "Plan"}</div>
              <div style={s.meta}>
                {[detail.place?.name, detail.time ? timeLabel(detail.time) : null, going ? `${going} joined` : null].filter(Boolean).join(" · ")}
              </div>
            </div>
            {going === 0 ? <p style={s.meta}>No one has joined this plan yet.</p> : null}
            {joined.map((a, i) => (
              <button
                key={`${a.id ?? "hidden"}-${i}`}
                type="button"
                style={s.rowPerson}
                disabled={a.id == null || a.is_you}
                onClick={() => onPerson(a)}
              >
                <Avatar url={a.avatar_url} name={a.name} />
                <span style={s.rowText}>
                  <span style={s.rowName}>{a.is_you ? "You" : a.name || "A diner"}</span>
                  <span style={s.rowLine}>{a.is_connect ? "Going · your Connect" : "Going"}</span>
                </span>
              </button>
            ))}
            {guests ? <span style={s.meta}>+{guests} more</span> : null}
          </>
        ) : failed ? (
          <p style={s.meta}>Couldn’t load this plan. Try again in a moment.</p>
        ) : (
          <p style={s.meta}>Loading…</p>
        )}
        <button type="button" style={{ ...s.textBtn, ...s.leftBtn, color: C.ink }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default function FeedTodayPage() {
  const { isAuthenticated, loading: consumerLoading } = useConsumer();
  const flags = useConsumerFeatureFlags();
  const navigate = useNavigate();
  const isDesktop = useFeedShellDesktop();

  const [now, setNow] = useState(() => new Date());
  const [chosen, setChosen] = useState(null);
  const [day, setDay] = useState(null);
  const [days, setDays] = useState([]);
  const [chip, setChip] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [declined, setDeclined] = useState(() => new Set());
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState(null);
  const [made, setMade] = useState(null);
  const [reload, setReload] = useState(0);
  const [friendPlan, setFriendPlan] = useState(null);
  const [asked, setAsked] = useState(() => new Set());
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    // Coming back to the tab reloads Today, so Profile and Today always match (as the app on focus).
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
        setReload((n) => n + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const windowKey = chosen ?? (day ? "lunch" : currentWindowKey(now));
  const dayIndex = day ? days.findIndex((d) => d.date === day) : 0;
  const tabs = mealTabs(now, !day);
  const meal = tabs.find((w) => w.key === windowKey) ?? MEAL_WINDOWS[1];
  const where = useMemo(() => {
    const d = typeof window !== "undefined" ? readDetectedLocation(window.localStorage) : null;
    return d && Number.isFinite(d.lat) && Number.isFinite(d.lng) ? { lat: d.lat, lng: d.lng } : null;
    // Re-read on reload (the diner may have changed it in Search).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);
  const place = feedHeaderLocationLabel(typeof window !== "undefined" ? window.localStorage : null);
  const on = Boolean(isAuthenticated && flags.todayHome);

  useEffect(() => {
    if (!on) return undefined;
    let alive = true;
    fetchToday(windowKey, where, chip, day)
      .then((d) => {
        if (!alive) return;
        setData(d);
        if (d.days.length) setDays(d.days);
        setError(null);
      })
      .catch((err) => alive && setError(todayErrorMessage(err)));
    return () => {
      alive = false;
    };
  }, [on, windowKey, day, chip?.key, chip?.kind, where?.lat, where?.lng, reload]);

  const resetPicks = () => {
    setDeclined(new Set());
    setShowMore(false);
  };
  const pickWindow = (k) => {
    setChosen(k);
    setChip(null);
    resetPicks();
    setMade(null);
    setData(null);
  };
  const pickDay = (d, index) => {
    const next = index === 0 ? null : d;
    if (next === day) return;
    setDay(next);
    if (index === 0) setChosen(null);
    setChip(null);
    resetPicks();
    setMade(null);
    setData(null);
  };
  const pickChip = (c) => {
    setChip((cur) => (cur?.key === c.key && cur.kind === c.kind ? null : { key: c.key, kind: c.kind }));
    resetPicks();
  };

  const all = useMemo(() => (data && data.window === windowKey ? [...data.picks, ...data.more] : []), [data, windowKey]);
  const left = all.filter((p) => !declined.has(p.restaurant.id));
  // Up to 8 ideas per meal (Andre 2026-11-13): 3 first, the rest behind Show more.
  const shown = left.slice(0, showMore ? 8 : 3);
  // Sponsored ideas: one view per loaded list, then taps (same as the app, placement "today").
  const sponsorView = useRef({ of: null, id: "", seen: new Set() });
  const viewOf = () => {
    if (sponsorView.current.of !== data) sponsorView.current = { of: data, id: `today-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, seen: new Set() };
    return sponsorView.current;
  };
  useEffect(() => {
    const v = viewOf();
    for (const p of shown) {
      if (!p.sponsorshipId || v.seen.has(p.sponsorshipId)) continue;
      v.seen.add(p.sponsorshipId);
      trackTodaySponsorship(p.sponsorshipId, "impression", v.id);
    }
  });
  const sponsorTap = (p, target) => {
    if (p.sponsorshipId) trackTodaySponsorship(p.sponsorshipId, "click", viewOf().id, target);
  };
  const plan = made ?? (data && data.window === windowKey ? data.myPlan : null);
  const social = data && data.window === windowKey ? data.social : null;
  const refresh = useCallback(() => {
    setMade(null);
    setReload((n) => n + 1);
  }, []);

  async function yes(pick, swapped) {
    sponsorTap(pick, "restaurant");
    setBusy(pick.restaurant.id);
    setError(null);
    try {
      if (social && pick.plan && !swapped) {
        logTodayEvent("join", windowKey, day, { pick });
        const r = await askToJoinSocialPlan(pick.plan.source, pick.plan.ref);
        if (r?.action === "going") refresh();
        else setAsked((x) => new Set(x).add(pick.plan.ref));
        return;
      }
      logTodayEvent("going", windowKey, day, { pick });
      setMade(await sayYes(pick, windowKey, swapped, day));
      if (social) setReload((n) => n + 1);
    } catch (err) {
      setError(todayErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const no = (pick) => {
    setDeclined((x) => new Set(x).add(pick.restaurant.id));
    logTodayEvent("skip", windowKey, day, { pick });
    notToday(pick, windowKey, day).catch(() => undefined);
  };

  async function askOpenPlan(p) {
    setError(null);
    logTodayEvent("join", windowKey, day);
    try {
      const r = await askToJoinSocialPlan(p.source, p.ref);
      if (r?.action === "going") refresh();
      else setAsked((x) => new Set(x).add(p.ref));
    } catch (err) {
      setError(todayErrorMessage(err));
    }
  }

  async function cantMakeIt(p) {
    setLeaving(true);
    setError(null);
    try {
      try {
        await leaveSocialPlan(p.source, p.ref);
      } catch (err) {
        // My own plan: take it off the calendar (everyone on it is told).
        if (err?.payload?.code !== "own_plan") throw err;
        await deleteSocialPlan(p.source, p.ref);
      }
      refresh();
    } catch (err) {
      setError(todayErrorMessage(err));
    } finally {
      setLeaving(false);
    }
  }

  if (!consumerLoading && !isAuthenticated) return <Navigate to="/feed" replace />;
  if (!on) {
    return (
      <div style={s.page} data-testid="today-off">
        <p style={{ ...s.meta, textAlign: "center", marginTop: "30vh" }}>Loading…</p>
      </div>
    );
  }

  const cuisineLabel = chip ? data?.cravings.find((c) => c.key === chip.key && c.kind === chip.kind)?.label ?? null : null;
  const mealWord = meal.key === "late" ? "late night" : meal.label.toLowerCase();
  const carry = !day && meal.key === "late" && lateCarry(now) ? " · until 4 AM" : "";
  const heading = plan
    ? `Your ${cuisineLabel ? `${cuisineLabel} ` : ""}${mealWord} plan${carry}`
    : `${cuisineLabel ? `${cuisineLabel} ideas` : "Ideas"} for ${mealWord}${carry}`;
  const top = shown[0] ?? null;
  const bottomGap = isDesktop ? 0 : FEED_PRIMARY_NAV_HEIGHT;

  return (
    <div style={{ ...s.page, paddingBottom: `calc(${bottomGap + 72}px + env(safe-area-inset-bottom, 0px))` }} data-testid="today-screen">
      <div style={s.column}>
        {/* Logo + location, day strip and meal buttons stay at the top as one block (Andre 2026-11-13, as the app). */}
        <div style={s.stickyTop} data-testid="today-sticky-top">
        <header style={s.header}>
          <BrandLogo to="/feed/today" height={28} radius={7} pageColor="#ffffff" wordmarkColor="#111613" ariaLabel="Menuply" />
          <Link to="/feed/search" style={s.locChip} data-testid="today-location-chip" aria-label={`Location: ${place}. Change location`}>
            <AppIcon name="pin" size={16} color={C.accent} />
            <span style={s.locText}>{place}</span>
            <AppIcon name="chevronDown" size={12} color={C.accent} strokeWidth={2.4} />
          </Link>
        </header>

        {days.length ? (
          <div style={s.days} role="tablist" aria-label="Day" data-testid="today-days">
            {days.map((d, i) => {
              const sel = i === 0 ? day == null : d.date === day;
              return (
                <button
                  key={d.date}
                  type="button"
                  role="tab"
                  aria-selected={sel}
                  aria-label={`${i === 0 ? "Today" : `${dayLong(d.date, i)}, ${dayDate(d.date)}`}${d.hasPlans ? ", has plans" : ""}`}
                  onClick={() => pickDay(d.date, i)}
                  style={s.day}
                  data-testid={`today-day-${i}`}
                >
                  <span style={s.dayName}>{dayShort(d.date, 1)}</span>
                  <span style={{ ...s.dayCircle, ...(sel ? s.dayCircleOn : null), fontWeight: sel || i === 0 ? 700 : 500 }}>{dayNumber(d.date)}</span>
                  <span style={{ ...s.dayDot, ...(d.hasPlans ? s.dayDotOn : null) }} />
                </button>
              );
            })}
          </div>
        ) : null}

        <div style={{ ...s.timeline, padding: "6px 0" }} role="tablist" aria-label="Meal">
          {tabs.map((w) => {
            const sel = w.key === windowKey;
            return (
              <button
                key={w.key}
                type="button"
                role="tab"
                aria-selected={sel}
                onClick={() => pickWindow(w.key)}
                style={{ ...s.window, background: sel ? w.color : w.soft, color: sel ? "#fff" : w.color }}
                data-testid={`today-window-${w.key}`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
        </div>

        {social?.open ? (
          <OpenPanel
            open={social.open}
            meal={meal}
            isNow={!day && windowState(meal, now) === "now"}
            asked={asked}
            onAsk={(p) => void askOpenPlan(p)}
            onPlanStatus={(p) => setFriendPlan({ source: p.source, ref: p.ref })}
            onInvite={(p) => {
              logTodayEvent("invite", windowKey, day, { targetUserId: p.userId });
              navigate(quickInvitePath({ code: meal.key === "dinner" || meal.key === "late" ? "LDD" : "LDL", to: p }));
            }}
            onPerson={(p) => navigate(personPath(p.userId))}
            onQuickInvite={() => {
              logTodayEvent("invite", windowKey, day, {});
              navigate(quickInvitePath({ code: MEAL_INVITE[meal.key] }));
            }}
          />
        ) : null}

        <h1 style={s.heading} data-testid="today-ideas-title">{heading}</h1>

        {data?.cravings.length ? (
          <div style={s.chips}>
            <button type="button" aria-pressed={chip == null} onClick={() => { setChip(null); resetPicks(); }} style={{ ...s.chip, ...(chip == null ? s.chipOn : null) }} data-testid="today-craving-all">
              All
            </button>
            {data.cravings.map((c) => {
              const sel = chip?.key === c.key && chip.kind === c.kind;
              return (
                <button key={`${c.kind}-${c.key}`} type="button" aria-pressed={sel} onClick={() => pickChip(c)} style={{ ...s.chip, ...(sel ? s.chipOn : null) }} data-testid={`today-craving-${c.key}`}>
                  {c.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {!data && !error ? <p style={s.meta}>Loading…</p> : null}
        {data && !shown.length ? (
          <div style={s.empty} data-testid="today-empty">
            <p style={{ ...s.body, margin: 0 }}>
              {data.hasSaves
                ? `Nothing open for ${meal.label.toLowerCase()} from your saves${cuisineLabel ? ` in ${cuisineLabel}` : ""}.`
                : "Tap the heart on places you love and Wishlist on dishes you want to try. Today plans your meals from them."}
            </p>
            {/* No location ask here (Andre 2026-11-13): the list ends in Search. */}
            <SearchLink testID="today-find-food" />
          </div>
        ) : null}

        {social && plan ? <PlanCard plan={plan} meal={meal} busy={leaving} onCantMakeIt={() => void cantMakeIt(plan)} /> : null}

        {(social && plan ? [] : shown).map((p, i) => {
          const isPlan = i === 0 && !plan;
          const chosenHere = plan?.restaurantId === p.restaurant.id;
          const friends = social && isPlan && p.plan ? p.plan : null;
          const waiting = friends != null && (friends.action === "asked" || asked.has(friends.ref));
          const dishLeads = !friends && p.dish != null && p.kind !== "place";
          const known = p.reason.tag === "fave_wish" || p.reason.tag === "fave" || p.reason.tag === "wish";
          const tone = reasonTone(p.reason.tag);
          const meta = [
            friends || dishLeads ? `${dishLeads ? "at " : ""}${p.restaurant.name}` : null,
            known ? null : p.foodTruck ? p.restaurant.cuisine : p.style ?? p.restaurant.cuisine,
            p.miles != null ? `${p.miles} mi` : null,
            friends ? timeLabel(friends.time) : isPlan && data?.planTime ? timeLabel(data.planTime) : null,
            p.hoursKnown ? null : "Hours unverified",
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <div key={p.restaurant.id} style={{ ...s.card, ...(isPlan ? { borderColor: meal.color, borderWidth: 2 } : null) }} data-testid={`today-pick-${p.restaurant.id}`}>
              <div style={{ ...s.cardTop, justifyContent: "space-between" }}>
                {isPlan || chosenHere ? (
                  <span style={{ ...s.badge, background: meal.color }}>
                    <AppIcon name="check" size={14} color="#fff" strokeWidth={3} />
                  </span>
                ) : dishLeads ? (
                  <span />
                ) : (
                  <span style={s.meta}>Or go here instead</span>
                )}
                <span style={{ ...s.tag, color: tone }}>
                  <span style={{ ...s.tagDot, background: tone }} />
                  {p.reason.label}
                </span>
              </div>
              <div style={s.cardBody}>
                <div style={s.cardText}>
                  {dishLeads ? <span style={{ ...s.meta, fontWeight: 600 }} data-testid={`today-try-${p.restaurant.id}`}>Try this</span> : null}
                  <Link to={menuPathFor(p.restaurant.id)} onClick={() => sponsorTap(p, "menu")} style={s.place} data-testid={`today-place-${p.restaurant.id}`}>
                    {friends
                      ? `Join ${namesText(friends.people)}?`
                      : dishLeads
                        ? p.dish.name
                        : isPlan
                          ? `${meal.label} at ${p.restaurant.name}?`
                          : p.restaurant.name}
                  </Link>
                  {p.foodTruck ? <span style={{ ...s.small, color: C.ink }}>Food truck</span> : null}
                  {meta ? <span style={s.meta}>{meta}</span> : null}
                  {p.reason.line ? <span style={s.body}>{p.reason.line}</span> : null}
                </div>
                {p.dish?.photoUrl && !friends ? <img src={p.dish.photoUrl} alt={p.dish.name} style={s.photo} /> : null}
              </div>
              <div style={s.actions}>
                {busy === p.restaurant.id ? <span style={s.meta}>One moment…</span> : null}
                {friends ? (
                  <button type="button" style={{ ...s.textBtn, color: meal.color }} onClick={() => setFriendPlan({ source: friends.source, ref: String(friends.ref) })}>
                    Status
                  </button>
                ) : null}
                {waiting ? (
                  <span style={s.waiting}>Asked · waiting on {friends.people[0] ?? "them"}</span>
                ) : isPlan ? (
                  <>
                    <button type="button" style={s.goingPill} onClick={() => void yes(p, false)} disabled={busy != null} data-testid={`today-yes-${p.restaurant.id}`}>
                      {friends ? (friends.action === "join" ? "Join" : "Ask to join") : "Going here"}
                    </button>
                    {friends ? null : (
                      <button type="button" style={{ ...s.textBtn, color: C.muted }} onClick={() => no(p)} data-testid={`today-no-${p.restaurant.id}`}>
                        Skip
                      </button>
                    )}
                  </>
                ) : !chosenHere ? (
                  <button type="button" style={{ ...s.textBtn, color: meal.color }} onClick={() => void yes(p, i > 0)} disabled={busy != null} data-testid={`today-swap-${p.restaurant.id}`}>
                    {plan ? "Go here instead" : "Going here"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {!showMore && left.length > 3 ? (
          <button type="button" style={{ ...s.textBtn, ...s.leftBtn, color: C.accent }} onClick={() => setShowMore(true)} data-testid="today-show-more">
            Show {Math.min(5, left.length - 3)} more
          </button>
        ) : null}
        {/* The list ran out: Search, with its icon (Andre 2026-11-13). */}
        {shown.length && (showMore || left.length <= 3) ? <SearchLink testID="today-search-more" /> : null}
        {error ? <p role="alert" style={{ ...s.meta, color: C.danger }} data-testid="today-error">{error}</p> : null}
      </div>

      {plan || top ? (
        <div style={{ ...s.status, bottom: `calc(${bottomGap}px + env(safe-area-inset-bottom, 0px))`, ...(plan ? { background: meal.soft } : null) }} data-testid={plan ? "today-status-planned" : "today-status-ask"}>
          <div style={s.statusInner}>
            {plan ? (
              <>
                <span style={{ ...s.statusText, color: meal.color }}>
                  {plan.placeName ? `${meal.label} at ${plan.placeName}` : plan.title}
                  {plan.time ? ` · ${timeLabel(plan.time)}` : ""}
                </span>
                <Link to={SOCIAL_PLANS_PATH} style={{ ...s.statusLink, color: meal.color }} data-testid="today-view-plan">View plan ›</Link>
              </>
            ) : (
              <span style={s.meta}>
                {social && top.plan
                  ? `${namesText(top.plan.people)} ${top.plan.people.length > 1 ? "are" : "is"} heading to ${top.restaurant.name} · Ask to join`
                  : "Going here makes it your plan. Your Connects see it and can ask to join."}
              </span>
            )}
          </div>
        </div>
      ) : null}

      <FriendPlanSheet
        plan={friendPlan}
        onClose={() => setFriendPlan(null)}
        onPerson={(a) => {
          setFriendPlan(null);
          navigate(personPath(a.id, a.is_connect === true));
        }}
      />
    </div>
  );
}


/** Plain text link with the search icon (no pill). */
function SearchLink({ testID }) {
  return (
    <Link to="/feed/search" style={s.searchLink} aria-label="Search" data-testid={testID}>
      <AppIcon name="search" size={16} color={C.accent} />
      Search
    </Link>
  );
}

const s = {
  page: {
    minHeight: "100dvh",
    background: C.white,
    color: C.ink,
    boxSizing: "border-box",
    paddingTop: "max(12px, env(safe-area-inset-top))",
    fontFamily: "inherit",
  },
  column: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left))",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 40 },
  locChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    padding: "0 12px 0 10px",
    borderRadius: 999,
    background: "#e8f5e3",
    color: C.accent,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    minWidth: 0,
  },
  locText: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 },
  days: { display: "flex", justifyContent: "space-between" },
  day: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minHeight: 56, border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: "inherit" },
  dayName: { fontSize: 11, lineHeight: "14px", color: C.muted, fontWeight: 500 },
  dayCircle: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.ink },
  dayCircleOn: { background: C.ink, color: "#fff" },
  dayDot: { width: 5, height: 5, borderRadius: 3, background: "transparent" },
  dayDotOn: { background: C.ink },
  timeline: { display: "flex", gap: 4 },
  stickyTop: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    background: C.white,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingTop: "max(12px, env(safe-area-inset-top))",
    marginTop: "calc(-1 * max(12px, env(safe-area-inset-top)))",
  },
  searchLink: { display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 44, color: C.accent, fontWeight: 700, fontSize: 15, textDecoration: "none" },
  window: { flex: 1, minHeight: 40, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  panel: { borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  panelTitle: { margin: 0, fontSize: 15, fontWeight: 700 },
  row: { display: "flex", alignItems: "center", gap: 12, minHeight: 48 },
  rowPerson: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit", color: C.ink },
  rowText: { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rowLine: { fontSize: 13, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rowHungry: { color: C.hungry, fontWeight: 600 },
  avatar: { borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  avatarEmpty: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: C.border, color: C.muted, fontWeight: 700, fontSize: 14 },
  textBtn: { minHeight: 44, minWidth: 44, border: "none", background: "transparent", padding: "0 8px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  leftBtn: { alignSelf: "flex-start", padding: 0, textAlign: "left" },
  quiet: { fontSize: 13, fontWeight: 500, color: C.muted },
  waiting: { fontSize: 13, color: C.muted, fontWeight: 600 },
  heading: { margin: "4px 0 0", fontSize: 20, lineHeight: "26px", fontWeight: 700, color: C.ink },
  chips: { display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" },
  // Neutral chips; selected = dark (no green pills, Andre 2026-11-06).
  chip: { flexShrink: 0, minHeight: 36, padding: "0 12px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.surface, color: C.ink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  chipOn: { background: C.ink, borderColor: C.ink, color: "#fff" },
  empty: { display: "flex", flexDirection: "column", gap: 8, padding: 16, borderRadius: 12, background: C.surface },
  actionLink: { color: C.accent, fontWeight: 600, fontSize: 15, textDecoration: "none", minHeight: 32, display: "inline-flex", alignItems: "center" },
  card: { borderRadius: 12, border: `1px solid ${C.border}`, background: C.white, padding: 16, display: "flex", flexDirection: "column", gap: 4 },
  cardTop: { display: "flex", alignItems: "center", gap: 8 },
  badge: { width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  tag: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  cardBody: { display: "flex", gap: 12, alignItems: "flex-start" },
  cardText: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 },
  place: { fontSize: 18, lineHeight: "24px", fontWeight: 700, color: C.ink, textDecoration: "none" },
  meta: { fontSize: 13, color: C.muted, margin: 0 },
  small: { fontSize: 13, fontWeight: 600 },
  body: { fontSize: 15, color: C.ink },
  photo: { width: 72, height: 72, borderRadius: 12, objectFit: "cover", background: C.surface, flexShrink: 0 },
  actions: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginTop: 4, flexWrap: "wrap" },
  actionsLeft: { display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" },
  iconLink: { display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44, fontSize: 15, fontWeight: 600, textDecoration: "none" },
  // Black "Going here" pill (Andre 2026-11-11; compact, not full width).
  goingPill: { minHeight: 44, padding: "0 16px", borderRadius: 999, border: "none", background: C.ink, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  status: { position: "fixed", left: 0, right: 0, zIndex: 20, background: C.white, borderTop: `1px solid ${C.border}` },
  statusInner: { maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, minHeight: 52, padding: "6px max(16px, env(safe-area-inset-right)) 6px max(16px, env(safe-area-inset-left))", boxSizing: "border-box" },
  statusText: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  statusLink: { fontSize: 15, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" },
  scrim: { position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { width: "100%", maxWidth: 560, background: C.white, color: C.ink, borderRadius: "16px 16px 0 0", padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", maxHeight: "80dvh", overflowY: "auto" },
};
