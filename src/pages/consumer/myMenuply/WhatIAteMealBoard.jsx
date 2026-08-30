/**
 * What I'm Eating day board — hero card for lead media + horizontal rail for the rest.
 * Owner: long-press (hard press) / right-click to reveal Delete — not hover.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VideoStillPreview from "../../../components/consumer/VideoStillPreview.jsx";
import {
  groupEntriesByMealPeriod,
  mealPeriodLabel,
  normalizeWhatIAteMealPeriod,
  visibleWhatIAteMealPeriods,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { formatEatingCaption } from "./dinerHubFormat.js";
import { resolveEatingDishVisual } from "./eatingDishVisual.js";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import { foodHref, restaurantHref } from "./myMenuplyBits.jsx";
import * as s from "./myMenuplyStyles.js";

function MealMediaCard({ item, readOnly, onSelect, onDelete, deleteBusy }) {
  const label = item.food_name || item.item_name || item.itemName || "Food";
  const place = item.restaurant_name || item.place_label || "";
  const media = resolveEatingDishVisual(item);
  const restHref = restaurantHref(item);
  const dishHref = foodHref(item);
  const useLogoFit = media?.source === "logo";
  const mealId = normalizeWhatIAteMealPeriod(item.meal_period) || "other";
  const mealBadge = mealPeriodLabel(mealId);
  const canDelete =
    !readOnly &&
    typeof onDelete === "function" &&
    ((item?.kind === "what_i_ate" && item?.entry_id != null) ||
      ((item?.kind === "im_eating" || item?.kind === "what_i_ate") &&
        (item?.source_id != null ||
          item?.activity_id != null ||
          /^fa[-:]?\d+$/i.test(String(item?.id || "")))));
  const { open, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);
  const isVideo = media?.kind === "video";
  const [playing, setPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);

  useEffect(() => {
    setPlaying(false);
  }, [item?.id, item?.entry_id, item?.video_url]);

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (deleteBusy) return;
    dismiss();
    onDelete?.(item);
  }

  function handleSelect() {
    if (consumeArmedClick()) return;
    if (open) {
      dismiss();
      return;
    }
    if (isVideo && !playing) {
      setPlaying(true);
      return;
    }
    onSelect?.(item);
  }

  const deleteBtn = open ? (
    <button
      type="button"
      style={s.mealHolderDelete}
      data-testid="what-i-ate-meal-delete"
      aria-label={`Delete ${label}`}
      disabled={deleteBusy}
      onClick={handleDelete}
    >
      Delete
    </button>
  ) : null;

  if (media) {
    return (
      <article
        style={s.mealHolder}
        data-testid="what-i-ate-meal-holder"
        data-meal={mealId}
        data-media={isVideo ? "video" : media.source}
        {...bind}
      >
        <button
          type="button"
          style={s.mealHolderMediaBtn}
          data-testid="what-i-ate-meal-media"
          onClick={handleSelect}
          disabled={!onSelect && !isVideo}
          aria-label={
            isVideo && !playing
              ? `${mealBadge}. ${label}. Video preview — tap to play.`
              : `${mealBadge}. ${label}. Tap for details. Long-press to delete.`
          }
        >
          {isVideo ? (
            <VideoStillPreview
              src={media.url}
              style={s.mealHolderMedia}
              playing={playing}
              muted={videoMuted}
              fallbackPoster={media.posterFallbackUrl || ""}
              fallbackPosterFit={media.posterFallbackFit || "cover"}
              testId="what-i-ate-meal-video"
            />
          ) : (
            <img
              src={media.url}
              alt=""
              style={useLogoFit ? s.mealHolderLogo : s.mealHolderMedia}
            />
          )}
          <div style={s.mealHolderOverlayTop}>
            <span style={s.mealHolderBadge}>{mealBadge}</span>
          </div>
          {isVideo && playing ? (
            <span
              style={{ ...s.socialVideoMuteBadge, bottom: 48, fontSize: 9 }}
              onClick={(e) => {
                e.stopPropagation();
                setVideoMuted((prev) => !prev);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setVideoMuted((prev) => !prev);
                }
              }}
              role="button"
              tabIndex={0}
            >
              {videoMuted ? "Tap sound" : "On"}
            </span>
          ) : null}
          <div style={s.mealHolderScrim}>
            <div style={s.mealHolderTitle}>{label}</div>
            {place ? (
              restHref ? (
                <Link
                  to={restHref}
                  style={s.mealHolderMeta}
                  onClick={(e) => e.stopPropagation()}
                >
                  {place}
                </Link>
              ) : (
                <div style={s.mealHolderMeta}>{place}</div>
              )
            ) : null}
          </div>
        </button>
        {deleteBtn}
      </article>
    );
  }

  return (
    <article
      style={s.mealHolder}
      data-testid="what-i-ate-meal-holder"
      data-meal={mealId}
      data-media="none"
      {...bind}
    >
      <button
        type="button"
        style={s.mealHolderText}
        data-testid="what-i-ate-meal-text"
        onClick={handleSelect}
        disabled={!onSelect && readOnly}
        aria-label={`${mealBadge}. ${label}. Long-press to delete.`}
      >
        <span style={s.mealHolderBadgeDark}>{mealBadge}</span>
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
      {deleteBtn}
    </article>
  );
}

function MealHeroCard({ item, readOnly, onSelect, onDelete, deleteBusy }) {
  const label = item.food_name || item.item_name || item.itemName || "Food";
  const place = item.restaurant_name || item.place_label || "";
  const media = resolveEatingDishVisual(item);
  const restHref = restaurantHref(item);
  const mealId = normalizeWhatIAteMealPeriod(item.meal_period) || "other";
  const mealBadge = mealPeriodLabel(mealId);
  const canDelete =
    !readOnly &&
    typeof onDelete === "function" &&
    ((item?.kind === "what_i_ate" && item?.entry_id != null) ||
      ((item?.kind === "im_eating" || item?.kind === "what_i_ate") &&
        (item?.source_id != null ||
          item?.activity_id != null ||
          /^fa[-:]?\d+$/i.test(String(item?.id || "")))));
  const { open, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);
  const isVideo = media?.kind === "video";
  const useLogoFit = media?.source === "logo";
  const [playing, setPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);

  useEffect(() => {
    setPlaying(false);
  }, [item?.id, item?.entry_id, item?.video_url]);

  if (!media) return null;

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (deleteBusy) return;
    dismiss();
    onDelete?.(item);
  }

  function handleSelect() {
    if (consumeArmedClick()) return;
    if (open) {
      dismiss();
      return;
    }
    if (isVideo && !playing) {
      setPlaying(true);
      return;
    }
    onSelect?.(item);
  }

  return (
    <article
      style={s.mealHeroCard}
      data-testid="what-i-ate-meal-hero"
      data-meal={mealId}
      data-media={isVideo ? "video" : media.source}
      {...bind}
    >
      <button
        type="button"
        style={s.mealHeroMediaBtn}
        data-testid="what-i-ate-meal-media"
        onClick={handleSelect}
        disabled={!onSelect && !isVideo}
        aria-label={
          isVideo && !playing
            ? `${mealBadge}. ${label}. Video preview — tap to play.`
            : `${mealBadge}. ${label}. Tap for details. Long-press to delete.`
        }
      >
        {isVideo ? (
          <VideoStillPreview
            src={media.url}
            style={s.mealHeroMedia}
            playing={playing}
            muted={videoMuted}
            fallbackPoster={media.posterFallbackUrl || ""}
            fallbackPosterFit={media.posterFallbackFit || "cover"}
            testId="what-i-ate-meal-video"
          />
        ) : (
          <img
            src={media.url}
            alt=""
            style={useLogoFit ? s.mealHeroLogo : s.mealHeroMedia}
          />
        )}
        <div style={s.mealHeroOverlayTop}>
          {isVideo && playing ? (
            <span style={s.heroBadge}>
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ef4444",
                  marginRight: 6,
                }}
              />
              Playing
            </span>
          ) : (
            <span style={s.heroBadge}>{mealBadge}</span>
          )}
        </div>
        {isVideo && playing ? (
          <span
            style={s.socialVideoMuteBadge}
            onClick={(e) => {
              e.stopPropagation();
              setVideoMuted((prev) => !prev);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                setVideoMuted((prev) => !prev);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {videoMuted ? "Tap sound" : "On"}
          </span>
        ) : null}
        <div style={s.mealHeroScrim}>
          <div style={s.mealHeroTitle}>{label}</div>
          {place ? (
            restHref ? (
              <Link to={restHref} style={s.mealHeroMeta} onClick={(e) => e.stopPropagation()}>
                {place}
              </Link>
            ) : (
              <div style={s.mealHeroMeta}>{place}</div>
            )
          ) : null}
        </div>
      </button>
      {open ? (
        <button
          type="button"
          style={s.mealHolderDelete}
          data-testid="what-i-ate-meal-delete"
          aria-label={`Delete ${label}`}
          disabled={deleteBusy}
          onClick={handleDelete}
        >
          Delete
        </button>
      ) : null}
    </article>
  );
}


/** Flatten meal buckets into one sequence: breakfast… then dinner… etc. */
function orderedMealEntries(items) {
  const { buckets, other } = groupEntriesByMealPeriod(items);
  const filledPeriodIds = Object.keys(buckets).filter((id) => (buckets[id] || []).length > 0);
  const visibleMeals = visibleWhatIAteMealPeriods({ filledPeriodIds });
  const ordered = [];
  for (const meal of visibleMeals) {
    for (const item of buckets[meal.id] || []) ordered.push(item);
  }
  for (const item of other) ordered.push(item);
  return ordered;
}

function pickHeroEntry(items) {
  const ordered = orderedMealEntries(items);
  const heroIndex = ordered.findIndex((item) => resolveEatingDishVisual(item));
  if (heroIndex < 0) return { hero: null, rail: ordered };
  return {
    hero: ordered[heroIndex],
    rail: ordered.filter((_, index) => index !== heroIndex),
  };
}

export default function WhatIAteMealBoard({
  items = [],
  readOnly = false,
  onSelect,
  onDelete,
  deleteBusy = false,
  onPhotoPick,
  onSlotCapture,
  hubDate = null,
  todayYmd = null,
  now = null,
}) {
  void onPhotoPick;
  void onSlotCapture;
  void now;
  const hasAny = (items || []).length > 0;
  const isPastDay = Boolean(hubDate && todayYmd && hubDate < todayYmd);
  const { hero, rail } = hasAny ? pickHeroEntry(items) : { hero: null, rail: [] };
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
    <div data-testid="what-i-ate-meal-board" style={s.mealBoard}>
      {hero ? (
        <MealHeroCard
          item={hero}
          readOnly={readOnly}
          onSelect={onSelect}
          onDelete={onDelete}
          deleteBusy={deleteBusy}
        />
      ) : null}
      {rail.length ? (
        <div style={s.mealBoardTrack} data-testid="what-i-ate-meal-sequence">
          {rail.map((item, index) => (
            <MealMediaCard
              key={item.id || item.entry_id || `${index}-${item.food_name}`}
              item={item}
              readOnly={readOnly}
              onSelect={onSelect}
              onDelete={onDelete}
              deleteBusy={deleteBusy}
            />
          ))}
        </div>
      ) : null}
      {/* Keep contract markers for removed empty-slot path */}
      {showEmptyHolders && allowEmptyCapture ? null : null}
    </div>
  );
}
