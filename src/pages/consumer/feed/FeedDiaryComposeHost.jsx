/**
 * Diary compose (photo ate/want + eating plan) — hosted from Feed shell X menu.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function FeedDiaryComposeHost({
  composeCategory = "",
  planOpen = false,
  onCloseCompose,
  onClosePlan,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const market = useMemo(() => resolveMarket(), []);
  const planDate = useMemo(() => tomorrowYmd(), []);

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
            payload.restaurant?.restaurant_id || payload.dish?.menu_item_id ? undefined : "food_item",
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
      onCloseCompose?.();
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
      onClosePlan?.();
    } catch (err) {
      setError(err?.message || "Unable to create plan");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated && (composeCategory || planOpen)) {
    navigate(`/account/login?next=${encodeURIComponent("/feed")}`);
    return null;
  }

  return (
    <>
      {error ? (
        <div style={styles.error} role="alert" data-testid="feed-diary-error">
          {error}
        </div>
      ) : null}
      <EatingComposeSheet
        open={Boolean(composeCategory)}
        onClose={() => !busy && onCloseCompose?.()}
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
          data-testid="feed-diary-plan-sheet"
          onClick={() => !busy && onClosePlan?.()}
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
                onClick={() => !busy && onClosePlan?.()}
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
    </>
  );
}

const styles = {
  error: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "calc(var(--feed-primary-nav-h, 72px) + env(safe-area-inset-bottom, 0px) + 56px)",
    zIndex: 360,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(127,29,29,0.92)",
    color: "#fecaca",
    fontSize: 13,
    textAlign: "center",
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
