/**
 * What I Ate day board — one row per meal period with photo/video holders.
 * Selected journal day only (no cross-day fallback).
 */

import { Link } from "react-router-dom";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  groupEntriesByMealPeriod,
  mealPeriodLabel,
  normalizeWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { formatEatingCaption } from "./dinerHubFormat.js";
import { foodHref, restaurantHref } from "./myMenuplyBits.jsx";
import * as s from "./myMenuplyStyles.js";
import { useState } from "react";

function MealMediaCard({
  item,
  readOnly,
  onSelect,
  onPhotoPick,
}) {
  const [replaceOpen, setReplaceOpen] = useState(false);
  const label = item.food_name || item.item_name || item.itemName || "Food";
  const place = item.restaurant_name || item.place_label || "";
  const hasMedia = Boolean(item.photo_url || item.video_url);
  const canPick = typeof onPhotoPick === "function" && !readOnly;
  const restHref = restaurantHref(item);
  const dishHref = foodHref(item);

  function handleFile(file) {
    if (file) onPhotoPick?.(item, file);
    setReplaceOpen(false);
  }

  return (
    <article
      style={s.mealHolder}
      data-testid="what-i-ate-meal-holder"
      data-meal={normalizeWhatIAteMealPeriod(item.meal_period) || "other"}
    >
      {replaceOpen ? (
        <MenuplyMediaPicker
          onFile={handleFile}
          facingMode="environment"
          allowPhoto
          allowVideo
          showPreview={false}
          openOnMount
          testId="meal-holder-picker"
          ariaLabel="Add or replace photo or video"
        />
      ) : null}
      {hasMedia ? (
        <button
          type="button"
          style={s.mealHolderMediaBtn}
          data-testid="what-i-ate-meal-media"
          onClick={() => {
            if (onSelect) onSelect(item);
            else if (canPick) setReplaceOpen(true);
          }}
          aria-label={`${label}. Tap for details`}
        >
          {item.video_url ? (
            <video
              src={resolveConsumerMediaUrl(item.video_url)}
              style={s.mealHolderMedia}
              playsInline
              muted
              preload="metadata"
            />
          ) : (
            <img src={resolveConsumerMediaUrl(item.photo_url)} alt="" style={s.mealHolderMedia} />
          )}
          <div style={s.mealHolderScrim}>
            <div style={s.mealHolderTitle}>{label}</div>
            {place ? <div style={s.mealHolderMeta}>{place}</div> : null}
          </div>
        </button>
      ) : (
        <button
          type="button"
          style={s.mealHolderText}
          data-testid="what-i-ate-meal-text"
          onClick={() => onSelect?.(item)}
          disabled={!onSelect && !canPick}
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
          {canPick ? (
            <div
              style={{ marginTop: 8 }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <MenuplyMediaPicker
                onFile={handleFile}
                facingMode="environment"
                allowPhoto
                allowVideo
                showPreview={false}
                testId="meal-holder-add-media"
                ariaLabel="Add photo or video"
                iconStyle={{ width: 34, height: 34, borderRadius: 999 }}
              />
            </div>
          ) : null}
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
      )}
    </article>
  );
}

function EmptyMealSlot({ mealId, readOnly, onLog }) {
  return (
    <button
      type="button"
      style={s.mealHolderEmpty}
      data-testid="what-i-ate-meal-empty"
      data-meal={mealId}
      disabled={readOnly || !onLog}
      onClick={() => onLog?.(mealId)}
      aria-label={
        readOnly
          ? `${mealPeriodLabel(mealId)} — nothing logged`
          : `Log ${mealPeriodLabel(mealId)}`
      }
    >
      <span style={s.mealHolderEmptyLabel}>
        {readOnly ? "Nothing here" : "Add"}
      </span>
    </button>
  );
}

export default function WhatIAteMealBoard({
  items = [],
  readOnly = false,
  onSelect,
  onPhotoPick,
  onLogMeal,
}) {
  const { buckets, other } = groupEntriesByMealPeriod(items);
  const hasAny = (items || []).length > 0;

  return (
    <div data-testid="what-i-ate-meal-board" style={s.mealBoard}>
      {WHAT_I_ATE_MEAL_PERIODS.map((meal) => {
        const rows = buckets[meal.id] || [];
        return (
          <div key={meal.id} style={s.mealRow} data-testid={`what-i-ate-meal-row-${meal.id}`}>
            <div style={s.mealRowLabel}>{meal.label}</div>
            <div style={s.mealRowTrack}>
              {rows.map((item) => (
                <MealMediaCard
                  key={item.id || item.entry_id || `${meal.id}-${item.food_name}`}
                  item={item}
                  readOnly={readOnly}
                  onSelect={onSelect}
                  onPhotoPick={onPhotoPick}
                />
              ))}
              {rows.length === 0 ? (
                <EmptyMealSlot mealId={meal.id} readOnly={readOnly} onLog={onLogMeal} />
              ) : null}
            </div>
          </div>
        );
      })}
      {other.length > 0 ? (
        <div style={s.mealRow} data-testid="what-i-ate-meal-row-other">
          <div style={s.mealRowLabel}>Other</div>
          <div style={s.mealRowTrack}>
            {other.map((item) => (
              <MealMediaCard
                key={item.id || item.entry_id || `other-${item.food_name}`}
                item={item}
                readOnly={readOnly}
                onSelect={onSelect}
                onPhotoPick={onPhotoPick}
              />
            ))}
          </div>
        </div>
      ) : null}
      {!hasAny && readOnly ? (
        <p style={s.mealBoardHint} data-testid="what-i-ate-meal-board-empty">
          Nothing logged for this day.
        </p>
      ) : null}
    </div>
  );
}
