/**
 * What I Ate day board — one row per meal period with photo/video holders.
 * Selected journal day only (no cross-day fallback).
 */

import { Link } from "react-router-dom";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
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
          source="camera"
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
                source="camera"
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

function EmptyMealSlot({ mealId, readOnly, onCapture }) {
  // Same dashed 168px holder for owner + peer (diner-hub parity). Capture is owner-only.
  if (readOnly || !onCapture) {
    return (
      <div
        style={{ ...s.mealHolderEmpty, cursor: "default" }}
        data-testid="what-i-ate-meal-empty"
        data-meal={mealId}
        aria-label={`${mealPeriodLabel(mealId)} — nothing logged`}
      >
        <span style={s.mealHolderEmptyLabel}>Nothing here</span>
      </div>
    );
  }

  return (
    <div style={s.mealHolderEmpty} data-testid="what-i-ate-meal-empty" data-meal={mealId}>
      <MenuplyMediaPicker
        source="camera"
        facingMode="environment"
        allowPhoto
        allowVideo
        showPreview={false}
        testId={`meal-slot-camera-${mealId}`}
        ariaLabel={`Take photo for ${mealPeriodLabel(mealId)}`}
        onFile={(file) => {
          if (file) onCapture(mealId, file);
        }}
        renderTrigger={({ open, disabled }) => (
          <button
            type="button"
            style={s.mealHolderCameraBtn}
            disabled={disabled}
            onClick={open}
            aria-label={`Take photo for ${mealPeriodLabel(mealId)}`}
            data-testid={`what-i-ate-meal-camera-${mealId}`}
          >
            <MealSlotCameraIcon />
          </button>
        )}
      />
    </div>
  );
}

function MealSlotCameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5L9 4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
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
  const { buckets, other } = groupEntriesByMealPeriod(items);
  const hasAny = (items || []).length > 0;
  const isPastDay = Boolean(hubDate && todayYmd && hubDate < todayYmd);
  const filledPeriodIds = Object.keys(buckets).filter((id) => (buckets[id] || []).length > 0);
  const visibleMeals = visibleWhatIAteMealPeriods({
    now: now || new Date(),
    hubDateYmd: hubDate,
    todayYmd,
    filledPeriodIds,
  });
  // Owner capture only — peer still gets the same empty holder shell ("Nothing here").
  const allowEmptyCapture = Boolean(onSlotCapture) && !readOnly && !isPastDay;
  // Universal layout: same meal rows + empty holders for owner and peer on today.
  // Past look-back: only real entries (or "No entries"), never empty holders.
  const showEmptyHolders = !isPastDay;

  if (isPastDay && !hasAny) {
    return (
      <div data-testid="what-i-ate-meal-board" style={s.mealBoard}>
        <p style={s.mealBoardHint} data-testid="what-i-ate-meal-board-empty">
          No entries
        </p>
      </div>
    );
  }

  return (
    <div data-testid="what-i-ate-meal-board" style={s.mealBoard}>
      {visibleMeals.map((meal) => {
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
              {rows.length === 0 && showEmptyHolders ? (
                <EmptyMealSlot
                  mealId={meal.id}
                  readOnly={readOnly}
                  onCapture={allowEmptyCapture ? onSlotCapture : undefined}
                />
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
    </div>
  );
}
