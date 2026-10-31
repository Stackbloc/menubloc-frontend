/**
 * Diner Profile cards, the same as the app's Profile tab (menuply-mobile app/(tabs)/profile.tsx and
 * src/components/account/*; the app wins where the two differ, Andre 2026-10-29). Signed-in order:
 * photo + who you are, Edit profile / Share / Connect View pills · Your vibe · My Social Calendar ·
 * Connects · Quick Invite · My activity. Settings (gear): discoverability, dietary needs, location,
 * email, links, Sign out. Signed out: what an account unlocks and Sign in.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteWantToEat,
  getConsumerProfile,
  getFollowedRestaurants,
  getLikedMenuItems,
  getMonthInFood,
  listConnections,
  getPreferences,
  listConsumerProfileMedia,
  listWantToEat,
  unfollowRestaurant,
  unlikeMenuItem,
  updateConsumerProfile,
  updatePreferences,
  updateSearchVibeAudience,
} from "../../../lib/consumerApi.js";
import { useOrderCart } from "../../../context/OrderCartContext.jsx";
import { useHomeBrowseFeed } from "../../../hooks/useHomeBrowseFeed.js";
import HomeNextLocationSelector from "../../../components/homeNext/HomeNextLocationSelector.jsx";
import AppIcon from "../../../components/icons/AppIcon.jsx";
import CompactSwitch from "../../../components/CompactSwitch.jsx";
import ShareModal from "../../../components/share/ShareModal.jsx";
import { buildMenuplyFriendInviteShareData } from "../../../lib/menuplyAccountInvite.js";
import { SETUP_MARKS_EVENT, markSetup, readSetupMarks } from "../../../lib/profileSetupMarks.js";
import { FEED_SHELL_PROFILE_LOGIN_PATH, FEED_SHELL_PROFILE_SIGNUP_PATH } from "../../../lib/feedShellLinks.js";
import { MY_MENUPLY_MONTH_IN_FOOD_PATH, MY_MENUPLY_PROFILE_PATH } from "../../../lib/myMenuplyRoutes.js";

// App tokens (menuply-mobile src/theme/tokens.ts).
const C = {
  accent: "#0f7a24",
  accentSoft: "#e8f5e3",
  onAccent: "#ffffff",
  text: "#111613",
  muted: "#5c665f",
  border: "#e1e6e1",
  surface: "#f5f7f4",
  background: "#ffffff",
  danger: "#b42318",
};

const appProfileStyles = {
  page: { background: C.surface, color: C.text, display: "flex", flexDirection: "column", gap: 16 },
  card: {
    background: C.background,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    boxSizing: "border-box",
  },
  heading: { margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 700, color: C.text },
  body: { margin: 0, fontSize: 16, lineHeight: "22px", color: C.text },
  muted: { margin: 0, fontSize: 15, lineHeight: "21px", color: C.muted },
  link: {
    alignSelf: "flex-start",
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: 14,
    fontWeight: 700,
    color: C.accent,
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "inherit",
  },
  error: { margin: 0, fontSize: 15, color: C.danger },
};
const st = appProfileStyles;

/** The Profile column: cards on the app's light surface, 16 px apart. */
export function AppProfileStack({ children, testId = "app-profile" }) {
  return (
    <div style={st.page} data-testid={testId}>
      {children}
    </div>
  );
}

function errText(err, fallback) {
  return (err && err.message) || fallback;
}

/** A box that opens and closes when its header is tapped (app MyActivity Box / DietaryNeeds). */
function Box({ title, count, testId, children, after = null }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...styles.box, ...(open ? styles.boxOpen : null) }} data-testid={testId}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${title}, ${count}`}
        onClick={() => setOpen((v) => !v)}
        style={styles.boxHead}
        data-testid={`${testId}-toggle`}
      >
        <span style={styles.boxTitle}>{title}</span>
        <span style={styles.count}>{count}</span>
        <AppIcon name="chevronDown" size={16} color={C.muted} strokeWidth={2.4} style={open ? { transform: "rotate(180deg)" } : null} />
      </button>
      {after}
      {open ? <div style={styles.boxBody}>{children}</div> : null}
    </div>
  );
}

/**
 * Top of Profile (app ProfileControls, Andre 2026-10-30): "Edit profile ●— View profile" (View = how
 * your Connects see you), then Connects (its own page, with a count of new requests) and Share My
 * Profile ("Share" alone left people asking what they were sharing).
 */
export function AppProfileControls({ viewing, onViewing }) {
  const [requests, setRequests] = useState(0);
  useEffect(() => {
    let alive = true;
    listConnections()
      .then((l) => alive && setRequests((l?.pending_incoming || []).length))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div style={styles.controls} data-testid="profile-controls">
      <CompactSwitch left="Edit profile" right="View profile" value={viewing} onChange={onViewing} testId="profile-mode" />
      {/* Compact pills, not full-width bars (Andre 2026-10-29). */}
      <div style={{ ...styles.pillRow, justifyContent: "center" }}>
        <Link to="/feed/connects" style={styles.pillQuiet} data-testid="profile-connects-pill">
          Connects
          {requests ? (
            <span style={styles.badge} aria-label={`${requests} new ${requests === 1 ? "request" : "requests"}`}>
              {requests}
            </span>
          ) : null}
        </Link>
        <Link to="/account/diner-qr" style={styles.pillQuiet} data-testid="profile-share">
          Share My Profile
        </Link>
      </div>
    </div>
  );
}

/** Photo, name, what you do, location, About; Edit name, photo and About; the Profile controls; gear. */
export function AppIdentityCard({ displayName, avatarUrl, occupation, about, locationLabel, busy, notice, error, onAvatarFile, onViewing }) {
  const fileRef = useRef(null);
  const initial = String(displayName || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div style={{ ...st.card, position: "relative" }} data-testid="profile-signed-in">
      <Link to={`${MY_MENUPLY_PROFILE_PATH}?view=settings`} aria-label="Settings" style={styles.gear} data-testid="profile-settings">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
        </svg>
      </Link>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        style={styles.avatarBtn}
        data-testid="profile-photo"
      >
        {avatarUrl ? <img src={avatarUrl} alt="" style={styles.avatarImg} /> : <span style={styles.avatarInitial}>{initial}</span>}
        <span style={styles.avatarBadge} aria-hidden="true">
          <AppIcon name="camera" size={14} color="#fff" />
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onAvatarFile?.(file);
        }}
      />
      {notice ? <p style={{ ...st.muted, color: C.accent }}>{notice}</p> : null}
      {error ? <p style={st.error}>{error}</p> : null}
      <h2 style={st.heading}>{displayName}</h2>
      <FoundingFoodieBadge />
      {occupation ? <p style={st.muted}>{occupation}</p> : null}
      {locationLabel ? <p style={st.muted}>{locationLabel}</p> : null}
      {about ? <p style={st.body}>{about}</p> : null}
      <Link to="/account" style={st.link} data-testid="profile-edit">
        Edit name, photo and About ›
      </Link>
      <div style={styles.controlsDivider}>
        <AppProfileControls viewing={false} onViewing={onViewing} />
      </div>
    </div>
  );
}

/** Report on my profile (on unless I turn it off) and meal logging (opt-in), Andre 2026-10-30. */
function AppReportSettings() {
  const [prefs, setPrefs] = useState(null);
  useEffect(() => {
    let alive = true;
    getConsumerProfile()
      .then((r) => alive && setPrefs((r?.profile || r)?.diner_social_defaults || {}))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  if (!prefs) return null;
  const save = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    updateConsumerProfile({ diner_social_defaults: { [key]: value } }).catch(() => setPrefs((p) => ({ ...p, [key]: !value })));
  };
  return (
    <div style={st.card} data-testid="settings-report">
      <label style={styles.check}>
        <input
          type="checkbox"
          checked={prefs.month_report_on_profile !== false}
          onChange={(e) => save("month_report_on_profile", e.target.checked)}
          data-testid="settings-month-report"
        />
        <span>Show my monthly report on my profile</span>
      </label>
      <label style={styles.check}>
        <input
          type="checkbox"
          checked={prefs.meal_logging_enabled === true}
          onChange={(e) => save("meal_logging_enabled", e.target.checked)}
          data-testid="settings-meal-logging"
        />
        <span>Log my meals</span>
      </label>
    </div>
  );
}

/** Settings (Andre 2026-10-30): everything tucked away from Profile, behind the gear. */
export function AppSettings({ onDiscoverChange, onSignOut }) {
  const [signOutFailed, setSignOutFailed] = useState(false);
  return (
    <AppProfileStack testId="app-settings">
      <Link to={MY_MENUPLY_PROFILE_PATH} style={st.link} data-testid="settings-back">
        ‹ Profile
      </Link>
      <h1 style={st.heading}>Settings</h1>
      <AppDiscoverabilityCard onChange={onDiscoverChange} />
      <AppDietaryNeeds />
      <AppReportSettings />
      <AppBasketLocationCard />
      <div style={st.card}>
        <Link to="/account" style={styles.linkRow} data-testid="settings-change-email">
          <span>Change email</span>
          <span style={{ color: C.muted }}>›</span>
        </Link>
        {LINKS.map(([label, to]) => (
          <Link key={to} to={to} style={styles.linkRow}>
            <span>{label}</span>
            <span style={{ color: C.muted }}>›</span>
          </Link>
        ))}
      </div>
      {signOutFailed ? <p style={st.error}>Couldn&apos;t reach Menuply to sign out. Try again.</p> : null}
      <button
        type="button"
        style={{ ...st.link, alignSelf: "center", color: C.danger, fontSize: 16 }}
        onClick={async () => {
          try {
            await onSignOut?.();
          } catch {
            setSignOutFailed(true);
          }
        }}
        data-testid="profile-sign-out"
      >
        Sign out
      </button>
    </AppProfileStack>
  );
}

const LEVELS = [
  { value: "hidden", label: "Hidden", hint: "Nobody can find you, and you won’t see or discover anyone either. Your Connects stay connected." },
  { value: "connects", label: "My Connects", hint: "Your Connects see your vibe in food search. (Default)" },
  { value: "connects_of_connects", label: "Connects of Connects", hint: "Also their Connects (they see your first name only)." },
  { value: "everyone", label: "Everyone", hint: "Anyone on Menuply searching food in your city sees your first name, photo and vibe." },
];

const EVERYONE_WARNING =
  "Everyone on Menuply near you will see your first name, photo and vibe in food search while your vibe is on. Don’t share your home address or plans you wouldn’t want strangers to know. You can switch back anytime.";

function discoverLevelOf(profile) {
  if (profile?.discoverability === "nobody") return "hidden";
  if (profile?.search_vibe_audience === "everyone") return "everyone";
  return profile?.search_vibe_audience === "connects_of_connects" ? "connects_of_connects" : "connects";
}

/**
 * How discoverable are you? Hidden · My Connects (default) · Connects of Connects · Everyone, with a
 * safety warning before Everyone. Closed to start, showing the current level.
 */
export function AppDiscoverabilityCard({ onChange }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmEveryone, setConfirmEveryone] = useState(false);

  useEffect(() => {
    let alive = true;
    getConsumerProfile()
      .then((data) => {
        if (!alive) return;
        const l = discoverLevelOf(data?.profile || {});
        setLevel(l);
        onChange?.(l);
      })
      .catch((err) => alive && setError(errText(err, "Couldn’t load this setting.")));
    return () => {
      alive = false;
    };
    // Load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function choose(next) {
    if (!level || next === level) return;
    setBusy(true);
    setError("");
    try {
      if (next === "hidden") {
        await updateConsumerProfile({ discoverability: "nobody" });
      } else {
        if (level === "hidden") await updateConsumerProfile({ discoverability: "anyone" });
        await updateSearchVibeAudience(next);
      }
      setLevel(next);
      onChange?.(next);
    } catch (err) {
      setError(errText(err, "Couldn’t save. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const current = LEVELS.find((l) => l.value === level);
  return (
    <div style={st.card} data-testid="discoverability-card">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={styles.boxHead} data-testid="discoverability-toggle">
        <span style={{ ...st.heading, flex: 1, textAlign: "left" }}>How discoverable are you?</span>
        {busy ? <span style={st.muted}>…</span> : null}
        {!open && current ? (
          <span style={styles.current} data-testid="discover-current">
            {current.label}
          </span>
        ) : null}
        <AppIcon name="chevronDown" size={16} color={C.muted} strokeWidth={2.4} style={open ? { transform: "rotate(180deg)" } : null} />
      </button>
      {open && level
        ? LEVELS.map((l) => {
            const on = level === l.value;
            return (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={busy}
                onClick={() => (l.value === "everyone" && !on ? setConfirmEveryone(true) : void choose(l.value))}
                style={{ ...styles.option, ...(on ? styles.optionOn : null) }}
                data-testid={`discover-${l.value}`}
              >
                <span style={{ ...styles.radio, ...(on ? styles.radioOn : null) }}>{on ? <span style={styles.radioDot} /> : null}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, textAlign: "left" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{l.label}</span>
                  <span style={{ fontSize: 13, lineHeight: "18px", color: C.muted }}>{l.hint}</span>
                </span>
              </button>
            );
          })
        : null}
      {error ? (
        <p style={st.error} role="alert" data-testid="discover-error">
          {error}
        </p>
      ) : null}
      {confirmEveryone ? (
        <div style={styles.warn} role="alertdialog" aria-label="Be seen by everyone?" data-testid="discover-everyone-warning">
          <h3 style={st.heading}>Be seen by everyone?</h3>
          <p style={st.body}>{EVERYONE_WARNING}</p>
          <div style={styles.pillRow}>
            <button
              type="button"
              style={styles.pill}
              onClick={() => {
                setConfirmEveryone(false);
                void choose("everyone");
              }}
              data-testid="discover-everyone-confirm"
            >
              Yes, show me to everyone
            </button>
            <button type="button" style={styles.pillQuiet} onClick={() => setConfirmEveryone(false)}>
              Keep it smaller
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** "Your vibe": one line with Change, so Profile stays short; Change opens the website's vibe picker. */
export function AppVibeCard({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...st.card, background: C.accentSoft, border: "none" }} data-testid="vibe-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: C.accent }}>Your vibe</h2>
          <p style={{ ...st.body, fontWeight: 600, fontSize: 15 }} data-testid="vibe-current">
            {label}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ ...styles.pillQuiet, borderColor: C.accent, color: C.accent, background: C.background }}
          data-testid="vibe-change"
        >
          {open ? "Done" : "Change"}
        </button>
      </div>
      {open ? children : null}
    </div>
  );
}

const listOf = (body, key) => (Array.isArray(body?.[key]) ? body[key] : []);
const idOf = (v) => (v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const restaurantHref = (id) => (id != null ? `/restaurants/${id}` : null);

function ActivityRow({ title, subtitle, href, icon, removeLabel, onRemove, testId }) {
  const navigate = useNavigate();
  return (
    <div style={styles.row} data-testid={testId}>
      <button type="button" style={styles.rowMain} onClick={() => href && navigate(href)} disabled={!href}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</span>
        {subtitle ? <span style={{ fontSize: 13, color: C.muted }}>{subtitle}</span> : null}
      </button>
      <button type="button" aria-label={removeLabel} onClick={onRemove} style={styles.rowIcon}>
        <AppIcon name={icon} size={20} color={C.accent} filled />
      </button>
    </div>
  );
}

/** My activity: Favs (restaurants and dishes) and the Wish List; each list opens when tapped. */
export function AppMyActivity() {
  const [favRestaurants, setFavRestaurants] = useState([]);
  const [favDishes, setFavDishes] = useState([]);
  const [wishList, setWishList] = useState([]);
  const [clips, setClips] = useState(null);
  const [mealLogging, setMealLogging] = useState(false);
  const [monthHas, setMonthHas] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    // No link to an empty month (Andre 2026-10-30).
    getMonthInFood()
      .then((r) => alive && setMonthHas(Number(r?.items_count || 0) + Number(r?.food_activity_count || 0) > 0))
      .catch(() => undefined);
    listConsumerProfileMedia()
      .then((m) => alive && setClips(listOf(m, "items").length))
      .catch(() => undefined);
    getConsumerProfile()
      .then((r) => alive && setMealLogging((r?.profile || r)?.diner_social_defaults?.meal_logging_enabled === true))
      .catch(() => undefined);
    Promise.allSettled([getFollowedRestaurants(), getLikedMenuItems(), listWantToEat()]).then(([r, d, w]) => {
      if (!alive) return;
      if (r.status === "fulfilled") {
        setFavRestaurants(
          listOf(r.value, "restaurants")
            .map((x) => ({ restaurantId: idOf(x.restaurant_id ?? x.id), name: x.restaurant_name || x.name || "Restaurant" }))
            .filter((x) => x.restaurantId)
        );
      }
      if (d.status === "fulfilled") {
        setFavDishes(
          listOf(d.value, "likes")
            .map((x) => ({ dishId: idOf(x.menu_item_id), name: x.item_name || "Dish", restaurantId: idOf(x.restaurant_id), restaurantName: x.restaurant_name || null }))
            .filter((x) => x.dishId)
        );
      }
      if (w.status === "fulfilled") {
        setWishList(
          listOf(w.value, "items")
            .map((x) => ({ wishId: String(x.id ?? ""), name: x.food_name || x.item_name || "Dish", restaurantId: idOf(x.restaurant_id), restaurantName: x.restaurant_name || null }))
            .filter((x) => x.wishId)
        );
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  async function remove(run, undo) {
    setError("");
    try {
      await run();
    } catch (err) {
      undo();
      setError(errText(err, "Couldn’t update. Try again."));
    }
  }

  return (
    <div style={st.card} data-testid="my-activity">
      <h2 style={st.heading}>My activity</h2>
      {error ? (
        <p style={st.error} role="alert">
          {error}
        </p>
      ) : null}
      <Link to={`${MY_MENUPLY_PROFILE_PATH}?view=clips`} style={styles.linkRow} data-testid="my-clips">
        <span>My clips</span>
        <span style={{ color: C.muted }}>{clips != null ? clips : "›"}</span>
      </Link>
      {mealLogging ? (
        <Link to="/account/what-i-ate" style={styles.linkRow} data-testid="my-what-i-ate">
          <span>What I ate</span>
          <span style={{ color: C.muted }}>›</span>
        </Link>
      ) : null}
      <Box title="Favs · restaurants" count={favRestaurants.length} testId="my-box-fav-restaurants">
        {favRestaurants.length ? (
          favRestaurants.map((r) => (
            <ActivityRow
              key={`r-${r.restaurantId}`}
              title={r.name}
              href={restaurantHref(r.restaurantId)}
              icon="fav"
              removeLabel={`Remove ${r.name} from Favs`}
              onRemove={() => {
                const prev = favRestaurants;
                setFavRestaurants(prev.filter((x) => x.restaurantId !== r.restaurantId));
                void remove(() => unfollowRestaurant(r.restaurantId), () => setFavRestaurants(prev));
              }}
              testId={`my-fav-restaurant-${r.restaurantId}`}
            />
          ))
        ) : (
          <p style={st.muted}>Tap the heart on a restaurant to Fav it.</p>
        )}
      </Box>
      <Box title="Favs · dishes" count={favDishes.length} testId="my-box-fav-dishes">
        {favDishes.length ? (
          favDishes.map((d) => (
            <ActivityRow
              key={`d-${d.dishId}`}
              title={d.name}
              subtitle={d.restaurantName}
              href={restaurantHref(d.restaurantId)}
              icon="fav"
              removeLabel={`Remove ${d.name} from Favs`}
              onRemove={() => {
                const prev = favDishes;
                setFavDishes(prev.filter((x) => x.dishId !== d.dishId));
                void remove(() => unlikeMenuItem(d.dishId), () => setFavDishes(prev));
              }}
              testId={`my-fav-dish-${d.dishId}`}
            />
          ))
        ) : (
          <p style={st.muted}>Tap the heart on a dish or clip to Fav it.</p>
        )}
      </Box>
      <Box title="Wish List" count={wishList.length} testId="my-box-wish-list">
        {wishList.length ? (
          wishList.map((w) => (
            <ActivityRow
              key={`w-${w.wishId}`}
              title={w.name}
              subtitle={w.restaurantName}
              href={restaurantHref(w.restaurantId)}
              icon="wishList"
              removeLabel={`Remove ${w.name} from your Wish List`}
              onRemove={() => {
                const prev = wishList;
                setWishList(prev.filter((x) => x.wishId !== w.wishId));
                void remove(() => deleteWantToEat(w.wishId), () => setWishList(prev));
              }}
              testId={`my-wish-${w.wishId}`}
            />
          ))
        ) : (
          <p style={st.muted}>Tap +Wish List on dishes you want to try.</p>
        )}
      </Box>
      {monthHas ? (
        <Link to={MY_MENUPLY_MONTH_IN_FOOD_PATH} style={styles.linkRow} data-testid="my-month-in-food">
          <span>My month in food</span>
          <span style={{ color: C.muted }}>›</span>
        </Link>
      ) : null}
    </div>
  );
}

const STARTER_KEY = "menuply:profile-starter";
const SNOOZE = 7 * 24 * 3600 * 1000;
const FAVS_GOAL = 3;

function readStarter() {
  try {
    return JSON.parse(window.localStorage.getItem(STARTER_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeStarter(v) {
  try {
    window.localStorage.setItem(STARTER_KEY, JSON.stringify(v));
  } catch {
    // Private mode: remembered for this visit only.
  }
}

/**
 * Set up your profile (app ProfileStarterCard, Andre 2026-10-30): sign-up asks only for name, email and
 * password; this card asks for the rest. Today: a photo, 3 Fav dishes, a first clip (until one is done,
 * Connects see "Still in the kitchen"), 4 invite friends to connect, 5 invite a friend out (or check
 * today's deals). Onboarding is fast and ends with a reward: when all five are done, "You're all set!"
 * and the Founding Foodie badge. It is meant to come back from time to time: add a step to the list and
 * everyone who hasn't done it sees the card again. It hides while every step is done; ✕ hides it for a
 * week.
 */
export function AppProfileStarterCard({ avatarUrl }) {
  const [saved, setSaved] = useState(readStarter);
  const [marks, setMarks] = useState(readSetupMarks);
  const [facts, setFacts] = useState(null);
  const [now, setNow] = useState(0);
  const [sharing, setSharing] = useState(false);
  const friendShare = useMemo(() => buildMenuplyFriendInviteShareData(), []);

  useEffect(() => {
    let alive = true;
    const count = (p, key) => p.then((r) => listOf(r, key).length).catch(() => 0);
    Promise.all([count(getLikedMenuItems(), "likes"), count(listConsumerProfileMedia(), "items")]).then(([favs, clips]) => {
      if (!alive) return;
      setNow(Date.now());
      setFacts({ favs, clips });
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!facts) return null;
  const steps = [
    { key: "photo", icon: "camera", label: "Add a photo", done: Boolean(avatarUrl), hint: "Tap the circle above" },
    { key: "favs", icon: "fav", label: `Fav ${FAVS_GOAL} dishes you love`, done: facts.favs >= FAVS_GOAL, hint: facts.favs ? `${facts.favs} of ${FAVS_GOAL}` : null, to: "/feed/search" },
    { key: "clip", icon: "camera", label: "Post your first clip", done: facts.clips > 0, to: `${MY_MENUPLY_PROFILE_PATH}?view=clips` },
    {
      key: "friends",
      icon: "invite",
      label: "Invite friends to connect",
      done: Boolean(marks.friends),
      onClick: () => {
        setSharing(true);
        setMarks(markSetup("friends"));
      },
    },
    {
      key: "out",
      icon: "invite",
      label: "Invite a friend out",
      done: Boolean(marks.out),
      to: "/account/invite-to-eat",
      alt: { label: "or check today’s deals", to: "/feed/deals" },
    },
  ];
  const done = steps.filter((x) => x.done).length;
  const shareModal = sharing ? (
    <ShareModal open onClose={() => setSharing(false)} modalTitle="Invite friends to Menuply" shareData={friendShare} analyticsContext={{ pageType: "profile_setup_invite_friends" }} />
  ) : null;
  if (done === steps.length) {
    if (marks.rewarded) return shareModal;
    const finish = () => setMarks(markSetup("rewarded"));
    return (
      <>
        {shareModal}
        <div style={styles.rewardBackdrop} role="dialog" aria-modal="true" aria-label="You’re all set" data-testid="profile-setup-reward">
          <div style={styles.rewardCard}>
            <div style={{ fontSize: 44 }}>🎉</div>
            <h2 style={{ ...st.heading, fontSize: 22 }}>You’re all set!</h2>
            <div style={{ ...styles.rewardBadge, justifySelf: "center" }}>🏅 Founding Foodie</div>
            <p style={{ ...st.muted, textAlign: "center" }}>You’re one of Menuply’s first diners. Your badge is on your profile now.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Link to="/feed/deals" onClick={finish} style={styles.rewardPrimary} data-testid="profile-setup-reward-deals">
                See today’s deals
              </Link>
              <button type="button" onClick={finish} style={styles.rewardSecondary} data-testid="profile-setup-reward-done">
                Done
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (saved.snoozedUntil && saved.snoozedUntil > now) return shareModal;
  const close = () => {
    const next = { ...saved, snoozedUntil: now + SNOOZE };
    setSaved(next);
    writeStarter(next);
  };

  return (
    <div style={{ ...st.card, borderColor: C.accent }} data-testid="profile-starter">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, display: "grid", gap: 2 }}>
          <h2 style={st.heading}>Set up your profile</h2>
          <p style={{ ...st.muted, fontSize: 13 }}>{`${done} of ${steps.length} done`}</p>
        </div>
        <button type="button" aria-label="Close" onClick={close} style={styles.starterClose} data-testid="profile-starter-close">
          ✕
        </button>
      </div>
      <div style={styles.starterTrack}>
        <div style={{ ...styles.starterFill, width: `${Math.max(6, Math.round((done / steps.length) * 100))}%` }} />
      </div>
      {steps.map((x) => {
        const body = (
          <>
            <span style={{ ...styles.starterDot, ...(x.done ? styles.starterDotDone : null) }}>
              <AppIcon name={x.done ? "check" : x.icon} size={14} color={x.done ? C.onAccent : C.accent} />
            </span>
            <span style={{ flex: 1, display: "grid", gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: x.done ? C.muted : C.text, textDecoration: x.done ? "line-through" : "none" }}>{x.label}</span>
              {!x.done && x.hint ? <span style={{ fontSize: 13, color: C.muted }}>{x.hint}</span> : null}
            </span>
            {!x.done && (x.to || x.onClick) ? <span style={{ fontWeight: 700, color: C.accent }}>›</span> : null}
          </>
        );
        const alt =
          !x.done && x.alt ? (
            <Link to={x.alt.to} style={styles.starterAlt} data-testid={`profile-starter-${x.key}-alt`}>
              {x.alt.label}
            </Link>
          ) : null;
        if (!x.done && x.onClick) {
          return (
            <button key={x.key} type="button" onClick={x.onClick} style={{ ...styles.starterRow, ...styles.starterButton }} data-testid={`profile-starter-${x.key}`}>
              {body}
            </button>
          );
        }
        return !x.done && x.to ? (
          <div key={x.key}>
            <Link to={x.to} style={styles.starterRow} data-testid={`profile-starter-${x.key}`}>
              {body}
            </Link>
            {alt}
          </div>
        ) : (
          <div key={x.key} style={styles.starterRow} data-testid={`profile-starter-${x.key}`}>
            {body}
          </div>
        );
      })}
      {avatarUrl || facts.favs || facts.clips ? null : <p style={{ ...st.muted, fontSize: 13 }}>Connects see “Still in the kitchen” until you add something.</p>}
      {shareModal}
    </div>
  );
}

/** The Set up your profile reward (app FoundingFoodieBadge): shows under your name once all steps are done. */
export function FoundingFoodieBadge() {
  const [marks, setMarks] = useState(readSetupMarks);
  useEffect(() => {
    const sync = () => setMarks(readSetupMarks());
    window.addEventListener(SETUP_MARKS_EVENT, sync);
    return () => window.removeEventListener(SETUP_MARKS_EVENT, sync);
  }, []);
  if (!marks.rewarded) return null;
  return (
    <span style={styles.rewardBadge} data-testid="profile-founding-foodie">
      🏅 Founding Foodie
    </span>
  );
}

// Same keys and order as the backend (routes/consumer/profile.js VALID_*_KEYS).
const DIETS = [
  ["vegetarian", "Vegetarian"],
  ["vegan", "Vegan"],
  ["gluten_free", "Gluten-free"],
  ["dairy_free", "Dairy-free"],
  ["low_carb", "Low carb"],
  ["high_protein", "High protein"],
  ["low_sodium", "Low sodium"],
  ["diabetic_friendly", "Diabetic-friendly"],
  ["nut_free", "Nut-free"],
  ["halal", "Halal"],
  ["kosher", "Kosher"],
  ["paleo", "Paleo"],
  ["keto", "Keto"],
];
const ALLERGENS = [
  ["peanuts", "Peanuts"],
  ["tree_nuts", "Tree nuts"],
  ["dairy", "Dairy"],
  ["gluten", "Gluten"],
  ["shellfish", "Shellfish"],
  ["soy", "Soy"],
  ["eggs", "Eggs"],
  ["fish", "Fish"],
  ["sesame", "Sesame"],
  ["wheat", "Wheat"],
  ["mustard", "Mustard"],
  ["celery", "Celery"],
  ["lupin", "Lupin"],
  ["molluscs", "Molluscs"],
];

const DIETARY_DISCLAIMER =
  "Menuply can’t guarantee that dish diet and allergen info is accurate or complete. Always confirm with the restaurant before you order.";

function parseNeeds(body) {
  const on = (rows, key) => (Array.isArray(rows) ? rows : []).filter((r) => r.is_enabled === true).map((r) => String(r[key] ?? "")).filter(Boolean);
  return { diets: on(body?.dietary_preferences, "preference_key"), allergens: on(body?.allergen_preferences, "allergen_key") };
}
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/** Dietary needs: "I eat" (diets) and "Keep out" (allergens); one Save sends the whole set. */
export function AppDietaryNeeds() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState({ diets: [], allergens: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let alive = true;
    getPreferences()
      .then((b) => {
        if (!alive) return;
        const n = parseNeeds(b);
        setSaved(n);
        setDraft(n);
      })
      .catch(() => alive && setSaved({ diets: [], allergens: [] }));
    return () => {
      alive = false;
    };
  }, []);

  const count = (saved?.diets.length ?? 0) + (saved?.allergens.length ?? 0);
  const changed = saved != null && (!same(saved.diets, draft.diets) || !same(saved.allergens, draft.allergens));
  const toggle = (group, key) => {
    setMessage(null);
    setDraft((d) => ({ ...d, [group]: d[group].includes(key) ? d[group].filter((k) => k !== key) : [...d[group], key] }));
  };

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const b = await updatePreferences({
        dietary_preferences: DIETS.map(([key]) => ({ key, is_enabled: draft.diets.includes(key) })),
        allergen_preferences: ALLERGENS.map(([key]) => ({ key, is_enabled: draft.allergens.includes(key) })),
      });
      const n = b && Array.isArray(b.dietary_preferences) ? parseNeeds(b) : draft;
      setSaved(n);
      setDraft(n);
      setMessage({ text: "Saved. Search uses these now.", error: false });
    } catch (err) {
      setMessage({ text: errText(err, "Couldn’t save. Try again."), error: true });
    } finally {
      setBusy(false);
    }
  }

  const chips = (group, list) => (
    <div style={styles.chips}>
      {list.map(([key, label]) => {
        const on = draft[group].includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(group, key)}
            style={{ ...styles.chip, ...(on ? (group === "allergens" ? styles.chipAllergen : styles.chipOn) : null) }}
            data-testid={`diet-${group}-${key}`}
          >
            {on ? <AppIcon name="check" size={14} color="#fff" strokeWidth={2.6} /> : null}
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <Box
      title="Dietary needs"
      count={count}
      testId="dietary-needs"
      after={
        <p style={styles.disclaimer} data-testid="dietary-disclaimer">
          {DIETARY_DISCLAIMER}
        </p>
      }
    >
      {!saved ? <p style={st.muted}>Loading…</p> : null}
      <p style={styles.label}>I eat</p>
      {chips("diets", DIETS)}
      <p style={styles.label}>Keep out (allergens)</p>
      {chips("allergens", ALLERGENS)}
      <p style={{ ...st.muted, fontSize: 13 }}>Search hides dishes listed with these allergens. Many dishes have no allergen info yet.</p>
      {message ? (
        <p style={message.error ? st.error : { ...st.muted, color: C.accent }} role={message.error ? "alert" : undefined} data-testid="dietary-message">
          {message.text}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!changed || busy}
        onClick={save}
        style={{ ...styles.pill, alignSelf: "flex-start", opacity: !changed || busy ? 0.5 : 1 }}
        data-testid="dietary-save"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </Box>
  );
}

/** Basket and Location, as on the app's Profile. */
export function AppBasketLocationCard() {
  const { itemCount, subtotalCents, restaurant, openCart } = useOrderCart();
  const { autoLocation, appliedLocation, setAppliedLocation, locating } = useHomeBrowseFeed();
  const restaurantName = restaurant?.restaurantName || restaurant?.restaurant_name || null;
  return (
    <div style={st.card}>
      <h2 style={st.heading}>Basket</h2>
      {itemCount ? (
        <button type="button" style={{ ...st.link, fontSize: 16, fontWeight: 400, color: C.text }} onClick={openCart} data-testid="profile-basket">
          {itemCount} {itemCount === 1 ? "item" : "items"}
          {restaurantName ? ` from ${restaurantName}` : ""}
          {subtotalCents ? ` · $${(subtotalCents / 100).toFixed(2)}` : ""}
        </button>
      ) : (
        <p style={st.muted} data-testid="profile-basket">
          Your basket is empty. Tap a dish on any menu to add it.
        </p>
      )}
      <h2 style={st.heading}>Location</h2>
      <div style={{ paddingLeft: 12 }} data-testid="profile-location">
        <HomeNextLocationSelector
          autoLocation={autoLocation}
          appliedLocation={appliedLocation}
          onApplyLocation={setAppliedLocation}
          locating={locating}
        />
      </div>
    </div>
  );
}

const LINKS = [
  ["About Menuply", "/about"],
  ["Contact us", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

export function AppProfileLinks() {
  return (
    <div style={st.card}>
      {LINKS.map(([label, to]) => (
        <Link key={to} to={to} style={styles.linkRow}>
          <span>{label}</span>
          <span style={{ color: C.muted }}>›</span>
        </Link>
      ))}
    </div>
  );
}

const SIGNED_IN = ["Save dishes to your Wish List", "Fav restaurants and dishes", "Invite friends to eat", "Post video comments on dishes"];

/** Signed out: logo, what an account unlocks, Sign in, then Basket + Location and links. */
export function AppProfileGuest() {
  const navigate = useNavigate();
  return (
    <div style={st.page} data-testid="feed-guest-profile">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0" }}>
        <img src="/menuply-app-icon.png" alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", border: "1px solid #e1e6e1" }} />
        <h1 style={{ ...st.heading, fontSize: 24, lineHeight: "30px" }}>Menuply</h1>
      </div>
      <div style={st.card} data-testid="profile-sign-in">
        <h2 style={st.heading}>Sign in</h2>
        {SIGNED_IN.map((line) => (
          <p key={line} style={st.body}>
            • {line}
          </p>
        ))}
        <button type="button" style={{ ...styles.pill, alignSelf: "flex-start", marginTop: 4 }} onClick={() => navigate(FEED_SHELL_PROFILE_LOGIN_PATH)} data-testid="profile-open-sign-in">
          Sign in
        </button>
        <Link to={FEED_SHELL_PROFILE_SIGNUP_PATH} style={st.link} data-testid="profile-open-sign-up">
          New to Menuply? Create an account
        </Link>
      </div>
      <AppBasketLocationCard />
      <AppProfileLinks />
    </div>
  );
}

const styles = {
  starterClose: { border: "none", background: "transparent", padding: 4, fontSize: 16, color: C.muted, cursor: "pointer", fontFamily: "inherit" },
  starterTrack: { height: 6, borderRadius: 3, background: C.accentSoft, overflow: "hidden" },
  starterFill: { height: 6, borderRadius: 3, background: C.accent },
  starterButton: { width: "100%", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
  starterAlt: { display: "inline-block", marginLeft: 38, fontSize: 13, fontWeight: 700, color: C.accent, textDecoration: "none" },
  rewardBackdrop: { position: "fixed", inset: 0, zIndex: 2000, background: "rgba(17,22,19,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  rewardCard: { background: "#fff", borderRadius: 20, padding: "24px 20px", maxWidth: 340, width: "100%", display: "grid", gap: 10, justifyItems: "center", textAlign: "center" },
  rewardBadge: { display: "inline-block", alignSelf: "start", justifySelf: "start", padding: "4px 12px", borderRadius: 999, background: C.accentSoft, color: C.accent, fontWeight: 800, fontSize: 14 },
  rewardPrimary: { padding: "10px 16px", borderRadius: 999, background: C.accent, color: C.onAccent, fontWeight: 700, textDecoration: "none" },
  rewardSecondary: { padding: "10px 16px", borderRadius: 999, border: `1px solid ${C.accent}`, background: "transparent", color: C.accent, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  starterRow: { display: "flex", alignItems: "center", gap: 12, padding: "4px 0", textDecoration: "none", color: C.text },
  starterDot: { width: 26, height: 26, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", background: C.accentSoft, flexShrink: 0 },
  starterDotDone: { background: C.accent },
  check: { display: "flex", alignItems: "center", gap: 10, minHeight: 44, fontSize: 15, color: C.text, cursor: "pointer" },
  gear: { position: "absolute", top: 8, right: 8, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: C.text },
  pillRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 },
  controls: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  controlsDivider: { borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 },
  badge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    padding: "0 4px",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: C.accent,
    color: C.onAccent,
    fontSize: 11,
    fontWeight: 700,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    border: "none",
    background: C.accent,
    color: C.onAccent,
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pillQuiet: {
    display: "inline-flex",
    alignItems: "center",
    border: `1px solid ${C.border}`,
    background: "transparent",
    color: C.text,
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  avatarBtn: {
    position: "relative",
    width: 88,
    height: 88,
    borderRadius: 999,
    border: `1px solid ${C.border}`,
    background: C.accentSoft,
    padding: 0,
    cursor: "pointer",
    overflow: "visible",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 999, objectFit: "cover", display: "block" },
  avatarInitial: { fontSize: 34, fontWeight: 800, color: C.accent },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 999,
    background: C.accent,
    border: "2px solid #fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  box: { border: `1px solid ${C.border}`, borderRadius: 12, background: C.background, overflow: "hidden" },
  boxOpen: { borderColor: C.accent },
  boxHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "12px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
  },
  boxTitle: { flex: 1, fontSize: 16, fontWeight: 700, color: C.text },
  boxBody: { padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 },
  count: {
    minWidth: 24,
    padding: "2px 8px",
    borderRadius: 999,
    background: C.surface,
    color: C.muted,
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
  },
  current: { fontSize: 14, fontWeight: 700, color: C.accent },
  option: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    background: C.background,
    padding: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  optionOn: { borderColor: C.accent, background: C.accentSoft },
  radio: {
    width: 18,
    height: 18,
    marginTop: 2,
    borderRadius: 999,
    border: `1.5px solid ${C.muted}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioOn: { borderColor: C.accent },
  radioDot: { width: 9, height: 9, borderRadius: 999, background: C.accent },
  warn: { border: `1px solid ${C.border}`, borderRadius: 12, background: "#fffbeb", padding: 14, display: "flex", flexDirection: "column", gap: 8 },
  row: { display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 },
  rowMain: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
  },
  rowIcon: { border: "none", background: "transparent", padding: 6, cursor: "pointer" },
  disclaimer: { margin: 0, padding: "0 14px 12px", fontSize: 12, lineHeight: "17px", color: C.muted },
  label: { margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: C.muted },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: `1.5px solid ${C.border}`,
    background: C.background,
    color: C.text,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  chipOn: { background: C.accent, borderColor: C.accent, color: "#fff" },
  chipAllergen: { background: C.danger, borderColor: C.danger, color: "#fff" },
  linkRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 16,
    color: C.text,
    textDecoration: "none",
  },
};
