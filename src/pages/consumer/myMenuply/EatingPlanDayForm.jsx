/**
 * Day editor for My Eating Plans: optional restaurant/dish or homemade, optional join seats.
 */

import { useState } from "react";
import { dishLabel, restaurantLabel } from "../../../lib/foodActivityApi.js";
import EatingPlaceFields from "./EatingPlaceFields.jsx";
import { joinHomemadeComment } from "./eatingPlaceLink.js";
import JoinMeAudiencePicker from "./JoinMeAudiencePicker.jsx";
import * as s from "./myMenuplyStyles.js";

export default function EatingPlanDayForm({
  planDate,
  busy = false,
  onSubmit,
  followed = [],
  joinCandidates = [],
  initialHomemade = false,
  initialRestaurant = null,
  initialDish = null,
  initialNote = "",
  locationCity = null,
  locationState = null,
}) {
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [dish, setDish] = useState(initialDish);
  const [homemade, setHomemade] = useState(initialHomemade);
  const [note, setNote] = useState(initialNote);
  const [joinable, setJoinable] = useState(false);
  const [joinAudience, setJoinAudience] = useState("connections");
  const [selectedIds, setSelectedIds] = useState([]);
  const [joinCapacity, setJoinCapacity] = useState("4");

  async function handleSubmit(e) {
    e.preventDefault();
    const placeLabel = homemade
      ? joinHomemadeComment(true, [dishLabel(dish), note].filter(Boolean).join(" · "))
      : [restaurantLabel(restaurant), dishLabel(dish), note].filter(Boolean).join(" · ") || "Plan";
    await onSubmit({
      planDate,
      restaurantId: homemade ? null : restaurant?.restaurant_id || null,
      placeLabel,
      restaurantSlug: homemade ? null : restaurant?.restaurant_slug,
      homemade,
      dish,
      joinable,
      joinAudience: joinable ? joinAudience : "none",
      joinAllowedUserIds: joinable && joinAudience === "selected" ? selectedIds : [],
      joinCapacity: joinable ? Number(joinCapacity) : null,
    });
    setRestaurant(null);
    setDish(null);
    setHomemade(false);
    setNote("");
    setJoinable(false);
    setJoinAudience("connections");
    setSelectedIds([]);
    setJoinCapacity("4");
  }

  const label = new Date(`${planDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <form onSubmit={handleSubmit} data-testid="eating-plan-day-form" style={styles.form}>
      <div style={styles.dateLabel}>{label}</div>
      <EatingPlaceFields
        homemade={homemade}
        onHomemadeChange={setHomemade}
        restaurant={restaurant}
        onRestaurantChange={setRestaurant}
        dish={dish}
        onDishChange={setDish}
        followed={followed}
        disabled={busy}
        locationCity={locationCity}
        locationState={locationState}
      />
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 160))}
        placeholder="Note (optional)"
        disabled={busy}
        style={styles.note}
        aria-label="Plan note"
      />
      <JoinMeAudiencePicker
        joinable={joinable}
        onJoinableChange={setJoinable}
        audience={joinAudience}
        onAudienceChange={setJoinAudience}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        candidates={joinCandidates}
        joinCapacity={joinCapacity}
        onJoinCapacityChange={setJoinCapacity}
        disabled={busy}
      />
      <button
        type="submit"
        disabled={busy || (joinable && joinAudience === "selected" && selectedIds.length === 0)}
        style={s.primaryBtn}
      >
        {busy ? "…" : "Post"}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    margin: "10px 0 0",
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0B0F0C",
  },
  note: {
    width: "100%",
    minHeight: 44,
    border: "1.5px solid #d1d5db",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 15,
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
};
