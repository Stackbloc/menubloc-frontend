/**
 * What I'm Eating day board — presentation only.
 * Dish / diner photo front and center when present; else restaurant logo;
 * text-only cards when neither exists (no camera — creation stays on X).
 */

import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  groupEntriesByMealPeriod,
  mealPeriodLabel,
  normalizeWhatIAteMealPeriod,
  visibleWhatIAteMealPeriods,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { formatEatingCaption } from "./dinerHubFormat.js";
import { foodHref, restaurantHref } from "./myMenuplyBits.jsx";
import * as s from "./myMenuplyStyles.js";

function resolveDisplayMedia(item) {
  const photo = String(item?.photo_url || "").trim();
  const video = String(item?.video_url || "").trim();
  const logo = String(item?.restaurant_logo_url || item?.logo_url || "").trim();
  if (video) {
    return { kind: "video", url: resolveConsumerMediaUrl(video), isLogo: false };
  }
  if (photo) {
    return { kind: "image", url: resolveConsumerMediaUrl(photo), isLogo: false };
  }
  if (logo) {
    return { kind: "image", url: resolveConsumerMediaUrl(logo), isLogo: true };
  }
  return null;
}

function MealMediaCard({ item, readOnly, onSelect }) {
  const label = item.food_name || item.item_name || item.itemName || "Food";
  const place = item.restaurant_name || item.place_label || "";
  const media = resolveDisplayMedia(item);
  const restHref = restaurantHref(item);
  const dishHref = foodHref(item);
  const mealBadge = item.meal_period
    ? mealPeriodLabel(normalizeWhatIAteMealPeriod(item.meal_period))
    : null;

  if (media) {
    return (
      <article
        style={s.mealHeroCard}
        data-testid="what-i-ate-meal-holder"
        data-meal={normalizeWhatIAteMealPeriod(item.meal_period) || "other"}
        data-media={media.isLogo ? "logo" : media.kind}
      >
        <button
          type="button"
          style={s.mealHeroMediaBtn}
          data-testid="what-i-ate-meal-media"
          onClick={() => onSelect?.(item)}
          disabled={!onSelect}
          aria-label={`${label}. Tap for details`}
        >
          {media.kind === "video" ? (
            <video
              src={media.url}
              style={s.mealHeroMedia}
              playsInline
              muted
              preload="metadata"
            />
          ) : (
            <img
              src={media.url}
              alt=""
              style={media.isLogo ? s.mealHeroLogo : s.mealHeroMedia}
            />
          )}
          <div style={s.mealHeroOverlayTop}>
            {mealBadge ? <span style={s.heroBadge}>{mealBadge}</span> : <span />}
          </div>
          <div style={s.mealHeroScrim}>
            <div style={s.mealHeroTitle}>{label}</div>
            {place ? (
              restHref ? (
                <Link
                  to={restHref}
                  style={s.mealHeroMeta}
                  onClick={(e) => e.stopPropagation()}
                >
                  {place}
                </Link>
              ) : (
                <div style={s.mealHeroMeta}>{place}</div>
              )
            ) : null}
          </div>
        </button>
      </article>
    );
  }

  return (
    <article
      style={s.mealHolder}
      data-testid="what-i-ate-meal-holder"
      data-meal={normalizeWhatIAteMealPeriod(item.meal_period) || "other"}
      data-media="none"
    >
      <button
        type="button"
        style={s.mealHolderText}
        data-testid="what-i-ate-meal-text"
        onClick={() => onSelect?.(item)}
        disabled={!onSelect && readOnly}
      >
        <div style={s.mealHolderTitleDark}>{label}</div>
        {place ? (
          restHref ? (
            <Link
              to={restHref}
              style={s.mealHolderMetaDark}
              onClick={(e) => e.stopPropagation()}
            >
              {place}
            </Link>
          ) : (
            <div style={s.mealHolderMetaDark}>{place}</div>
          )
        ) : null}
        <div style={s.mealHolderCaption}>{formatEatingCaption(item)}</div>
        {dishHref && item.menu_item_id ? (
          <Link
            to={dishHref}
            style={s.mealHolderLink}
            onClick={(e) => e.stopPropagation()}
          >
            View dish
          </Link>
        ) : null}
      </button>
    </article>
  );
}

export default function WhatIAteMealBoard({
  items = [],
  readOnly = false,
  onSelect,
  onPhotoPick,
  onSlotCapture,
  hubDate = null,
  todayYmd = null,
  now = null,
}) {
  void onPhotoPick;
  void onSlotCapture;
  void now;
  const { buckets, other } = groupEntriesByMealPeriod(items);
  const hasAny = (items || []).length > 0;
  const isPastDay = Boolean(hubDate && todayYmd && hubDate < todayYmd);
  const filledPeriodIds = Object.keys(buckets).filter((id) => (buckets[id] || []).length > 0);
  const visibleMeals = visibleWhatIAteMealPeriods({ filledPeriodIds });
  // No empty camera holders — presentation only (owner + peer parity).
  const showEmptyHolders = false;
  const allowEmptyCapture = false;

  if (!hasAny) {
    return (
      <div data-testid="what-i-ate-meal-board" style={s.mealBoard}>
        <p style={s.mealBoardHint} data-testid="what-i-ate-meal-board-empty">
          {isPastDay ? "No entries" : null}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="what-i-ate-meal-board" style={s.mealBoardHero}>
      {visibleMeals.map((meal) => {
        const rows = buckets[meal.id] || [];
        if (!rows.length) return null;
        return (
          <div key={meal.id} style={s.mealRowStack} data-testid={`what-i-ate-meal-row-${meal.id}`}>
            <div style={s.mealRowLabel}>{meal.label}</div>
            <div style={s.mealRowStackTrack}>
              {rows.map((item) => (
                <MealMediaCard
                  key={item.id || item.entry_id || `${meal.id}-${item.food_name}`}
                  item={item}
                  readOnly={readOnly}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        );
      })}
      {other.length > 0 ? (
        <div style={s.mealRowStack} data-testid="what-i-ate-meal-row-other">
          <div style={s.mealRowLabel}>{mealPeriodLabel("other")}</div>
          <div style={s.mealRowStackTrack}>
            {other.map((item) => (
              <MealMediaCard
                key={item.id || item.entry_id || `other-${item.food_name}`}
                item={item}
                readOnly={readOnly}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ) : null}
      {/* Keep contract markers for removed empty-slot path */}
      {showEmptyHolders && allowEmptyCapture ? null : null}
    </div>
  );
}
