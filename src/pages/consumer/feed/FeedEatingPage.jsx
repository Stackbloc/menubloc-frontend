/**
 * EATING tab — real eating actions in the Feed shell (not a My Menuply link farm).
 * Photos stay here; Feed home stays video-only.
 */

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import {
  createWantToEat,
  createWhatIAteToday,
  createWhatWeDoingSession,
  uploadWantToEatPhoto,
  uploadWhatIAteTodayPhoto,
  whatIAteTodayLocalDate,
} from "../../../lib/consumerApi.js";
import { eatingMediaFromUpload, isVideoFile } from "../../../lib/eatingMediaUtils.js";
import { defaultWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";
import { eatingFoodName, joinHomemadeComment } from "../myMenuply/eatingPlaceLink.js";
import EatingComposeSheet from "../myMenuply/EatingComposeSheet.jsx";
import EatingPlanDayForm from "../myMenuply/EatingPlanDayForm.jsx";

function resolveMarket() {
  if (typeof window === "undefined") return { city: "Los Angeles", state: "CA" };
  const detected = readDetectedLocation(window.localStorage);
  const city = String(detected?.city || "").trim();
  const state = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (city && state) return { city, state };
  return { city: "Los Angeles", state: "CA" };
}

function tomorrowYmd() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ACTIONS = [
  {
    id: "ate",
    title: "I'm Eating",
    blurb: "Photo or video of what you're eating now",
    testId: "feed-eating-ate",
  },
  {
    id: "want",
    title: "Wanna Eat",
    blurb: "Save a craving — restaurant and menu item optional",
    testId: "feed-eating-want",
  },
  {
    id: "plan",
    title: "Eating Plan",
    blurb: "Schedule a future meal and Join Me",
    testId: "feed-eating-plan",
  },
];

const DESTINATIONS = [
  {
    to: "/account/what-i-ate",
    title: "What I Ate diary",
    blurb: "Browse your past meals by day",
    testId: "feed-eating-diary",
  },
  {
    to: "/account/im-eating",
    title: "I'm Eating At",
    blurb: "Report where you're dining right now",
    testId: "feed-eating-at",
  },
  {
    to: "/my-menuply",
    title: "Full My Menuply hub",
    blurb: "Photos, meal board, calendar, and connections",
    testId: "feed-eating-hub",
  },
];

export default function FeedEatingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const [composeCategory, setComposeCategory] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const market = resolveMarket();
  const planDate = useMemo(() => tomorrowYmd(), []);

  function requireAuth(nextPath = "/feed/eating") {
    if (isAuthenticated) return true;
    navigate(`/account/login?next=${encodeURIComponent(nextPath)}`);
    return false;
  }

  function openAction(id) {
    if (!requireAuth()) return;
    setError("");
    if (id === "plan") {
      setComposeCategory("");
      setPlanOpen(true);
      return;
    }
    setPlanOpen(false);
    setComposeCategory(id);
  }

  async function handleComposeSubmit(payload) {
    setBusy(true);
    setError("");
    try {
      const file = payload.file || null;
      let photo_url;
      let video_url;
      if (file) {
        const up =
          payload.category === "want"
            ? await uploadWantToEatPhoto(file)
            : await uploadWhatIAteTodayPhoto(file);
        const media = eatingMediaFromUpload(up);
        photo_url = media.photo_url;
        video_url = media.video_url;
      }

      if (payload.category === "want") {
        const name =
          eatingFoodName({
            text: payload.text,
            dish: payload.dish,
            restaurant: payload.restaurant,
            homemade: payload.homemade,
          }) ||
          String(payload.text || "").trim() ||
          "Wanna eat";
        await createWantToEat({
          food_name: name,
          photo_url,
          video_url,
          market_discoverable: Boolean(video_url),
          restaurant_id: payload.homemade
            ? null
            : payload.restaurant?.restaurant_id || payload.dish?.restaurant_id || undefined,
          menu_item_id: payload.homemade ? null : payload.dish?.menu_item_id || undefined,
          intent_kind:
            payload.restaurant?.restaurant_id || payload.dish?.menu_item_id
              ? undefined
              : "food_item",
          comment: payload.homemade ? joinHomemadeComment(true, payload.text) : undefined,
        });
      } else {
        const note = String(payload.text || "").trim();
        const foodName = payload.homemade
          ? note || "Homemade"
          : String(payload.dish?.item_name || "").trim() ||
            String(payload.restaurant?.restaurant_name || "").trim() ||
            note ||
            "Food";
        await createWhatIAteToday({
          food_name: foodName,
          photo_url,
          video_url,
          eaten_on: whatIAteTodayLocalDate(),
          meal_period: payload.mealPeriod || defaultWhatIAteMealPeriod(),
          restaurant_id: payload.homemade
            ? null
            : payload.restaurant?.restaurant_id || payload.dish?.restaurant_id || undefined,
          menu_item_id: payload.homemade ? null : payload.dish?.menu_item_id || undefined,
          is_recommend: Boolean(
            payload.isRecommend &&
              (payload.restaurant?.restaurant_id || payload.dish?.menu_item_id) &&
              isVideoFile(file)
          ),
          comment: payload.homemade ? joinHomemadeComment(true, note) : note || undefined,
          market_discoverable: Boolean(video_url),
        });
      }
      setComposeCategory("");
    } catch (err) {
      setError(err?.message || "Unable to save");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handlePlanSubmit(payload) {
    setBusy(true);
    setError("");
    try {
      await createWhatWeDoingSession({
        plan_date: payload.planDate || planDate,
        restaurant_id: payload.homemade ? null : payload.restaurantId,
        place_label: payload.placeLabel,
        joinable: payload.joinable,
        join_capacity: payload.joinCapacity,
        join_audience: payload.joinAudience,
        join_allowed_user_ids: payload.joinAllowedUserIds,
        market_discoverable: false,
      });
      setPlanOpen(false);
    } catch (err) {
      setError(err?.message || "Unable to create plan");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page} data-testid="feed-eating">
      <h1 style={styles.h1}>Eating</h1>
      <p style={styles.lead}>
        Log meals, cravings, and plans here. Feed stays video-only — photos live in Eating.
      </p>

      <p style={styles.sectionLabel}>Create</p>
      <ul style={styles.list}>
        {ACTIONS.map((row) => (
          <li key={row.id} style={styles.item}>
            <button
              type="button"
              data-testid={row.testId}
              style={styles.actionBtn}
              onClick={() => openAction(row.id)}
            >
              <span style={styles.title}>{row.title}</span>
              <span style={styles.blurb}>{row.blurb}</span>
            </button>
          </li>
        ))}
      </ul>

      <p style={styles.sectionLabel}>Open</p>
      <ul style={styles.list}>
        {DESTINATIONS.map((row) => (
          <li key={row.to} style={styles.item}>
            <Link to={row.to} style={styles.link} data-testid={row.testId}>
              <span style={styles.title}>{row.title}</span>
              <span style={styles.blurb}>{row.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" style={styles.error} data-testid="feed-eating-error">
          {error}
        </p>
      ) : null}

      <EatingComposeSheet
        open={Boolean(composeCategory)}
        onClose={() => !busy && setComposeCategory("")}
        defaultCategory={composeCategory || "ate"}
        mediaSource="camera"
        busy={busy}
        feedMode={false}
        onSubmit={handleComposeSubmit}
        locationCity={market.city}
        locationState={market.state}
      />

      {planOpen ? (
        <div
          role="presentation"
          style={styles.planBackdrop}
          data-testid="feed-eating-plan-sheet"
          onClick={() => !busy && setPlanOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Eating plan"
            style={styles.planPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.planHead}>
              <p style={styles.planTitle}>Eating Plan</p>
              <button
                type="button"
                style={styles.planClose}
                onClick={() => !busy && setPlanOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <EatingPlanDayForm
              planDate={planDate}
              busy={busy}
              onSubmit={handlePlanSubmit}
              locationCity={market.city}
              locationState={market.state}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    padding: `20px 20px calc(${FEED_PRIMARY_NAV_HEIGHT + 28}px + env(safe-area-inset-bottom))`,
    background: "#0b1210",
    color: "#e8f0ec",
  },
  h1: { margin: "8px 0 6px", fontSize: 28, fontWeight: 800 },
  lead: { margin: "0 0 20px", color: "rgba(232,240,236,0.72)", fontSize: 15, lineHeight: 1.45 },
  sectionLabel: {
    margin: "8px 0 10px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(232,240,236,0.45)",
  },
  list: { listStyle: "none", margin: "0 0 18px", padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  item: { margin: 0 },
  actionBtn: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "14px 16px",
    borderRadius: 12,
    background: "rgba(94, 234, 212, 0.08)",
    border: "1px solid rgba(94, 234, 212, 0.28)",
    textAlign: "left",
    cursor: "pointer",
    color: "inherit",
    font: "inherit",
  },
  link: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "14px 16px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    textDecoration: "none",
    color: "inherit",
  },
  title: { fontSize: 16, fontWeight: 750, color: "#5eead4" },
  blurb: { fontSize: 13, color: "rgba(232,240,236,0.65)", lineHeight: 1.4 },
  error: {
    margin: "0 0 12px",
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(127,29,29,0.85)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
  },
  planBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1100,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "12px 12px calc(var(--feed-primary-nav-h, 72px) + 12px)",
  },
  planPanel: {
    width: "min(480px, 100%)",
    maxHeight: "min(88vh, 640px)",
    overflowY: "auto",
    background: "#fff",
    color: "#0f172a",
    borderRadius: "20px 20px 14px 14px",
    padding: "16px 16px 20px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
  },
  planHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  planTitle: { margin: 0, fontSize: 18, fontWeight: 800 },
  planClose: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    cursor: "pointer",
  },
};
