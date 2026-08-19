/**
 * Day editor for My Eating Plans: pick a restaurant, optional join seats.
 */

import { useEffect, useState } from "react";
import { asRestaurantPlace, restaurantLabel, searchReportPlaces } from "../../../lib/foodActivityApi.js";
import JoinMeAudiencePicker from "./JoinMeAudiencePicker.jsx";
import * as s from "./myMenuplyStyles.js";

export default function EatingPlanDayForm({
  planDate,
  busy = false,
  onSubmit,
  followed = [],
  joinCandidates = [],
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [joinable, setJoinable] = useState(false);
  const [joinAudience, setJoinAudience] = useState("connections");
  const [selectedIds, setSelectedIds] = useState([]);
  const [joinCapacity, setJoinCapacity] = useState("4");

  useEffect(() => {
    const q = query.trim();
    if (restaurant || q.length < 2) {
      setHits([]);
      setSearching(false);
      return undefined;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchReportPlaces({ type: "restaurant", q, limit: 8 });
        setHits(data.results || []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query, restaurant]);

  function pickRestaurant(row) {
    const next = asRestaurantPlace(row);
    if (!next) return;
    setRestaurant(next);
    setQuery("");
    setHits([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!restaurant?.restaurant_id) return;
    await onSubmit({
      planDate,
      restaurantId: restaurant.restaurant_id,
      placeLabel: restaurantLabel(restaurant),
      restaurantSlug: restaurant.restaurant_slug,
      joinable,
      joinAudience: joinable ? joinAudience : "none",
      joinAllowedUserIds: joinable && joinAudience === "selected" ? selectedIds : [],
      joinCapacity: joinable ? Number(joinCapacity) : null,
    });
    setRestaurant(null);
    setQuery("");
    setHits([]);
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
  const followedPicks = (followed || [])
    .filter((row) => row?.restaurant_id)
    .slice(0, 8);

  return (
    <form onSubmit={handleSubmit} data-testid="eating-plan-day-form" style={styles.form}>
      <div style={styles.dateLabel}>{label}</div>
      {restaurant ? (
        <div style={styles.selected} data-testid="eating-plan-selected-restaurant">
          <div>
            <div style={styles.selectedName}>{restaurantLabel(restaurant) || "Restaurant"}</div>
            {restaurant.city || restaurant.state ? (
              <div style={s.muted}>
                {[restaurant.city, restaurant.state].filter(Boolean).join(", ")}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            style={styles.change}
            disabled={busy}
            onClick={() => setRestaurant(null)}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 120))}
            placeholder="Search restaurants"
            disabled={busy}
            autoComplete="off"
            style={styles.place}
            aria-label="Search restaurants"
          />
          {searching ? <p style={s.muted}>Searching…</p> : null}
          {hits.length > 0 ? (
            <ul style={styles.hits} data-testid="eating-plan-place-hits">
              {hits.map((hit) => (
                <li key={hit.restaurant_id}>
                  <button
                    type="button"
                    style={styles.hitBtn}
                    onClick={() => pickRestaurant(hit)}
                  >
                    {restaurantLabel(hit) || hit.label}
                    {hit.subtitle ? ` · ${hit.subtitle}` : hit.city ? ` · ${hit.city}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {followedPicks.length > 0 ? (
            <div style={styles.followed} data-testid="eating-plan-followed">
              {followedPicks.map((row) => (
                <button
                  key={row.restaurant_id}
                  type="button"
                  style={s.chipBtn}
                  disabled={busy}
                  onClick={() => pickRestaurant(row)}
                >
                  {restaurantLabel(row)}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
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
        disabled={
          busy ||
          !restaurant?.restaurant_id ||
          (joinable && joinAudience === "selected" && selectedIds.length === 0)
        }
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
  place: {
    width: "100%",
    minHeight: 44,
    border: "1.5px solid #d1d5db",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0B0F0C",
    background: "#fff",
    boxSizing: "border-box",
  },
  selected: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "10px 12px",
    border: "1.5px solid #1F4E3D",
    borderRadius: 12,
    background: "#f4f9f6",
    color: "#14532d",
  },
  selectedName: {
    fontWeight: 800,
    fontSize: 16,
    lineHeight: 1.25,
    color: "#14532d",
  },
  change: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#1F4E3D",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  hits: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    border: "1px solid #e4e7ec",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
  },
  hitBtn: {
    appearance: "none",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid #f2f4f7",
    background: "#fff",
    font: "inherit",
    cursor: "pointer",
  },
  followed: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  check: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#0B0F0C",
  },
  seats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#0B0F0C",
  },
  num: {
    width: 72,
    minHeight: 40,
    borderRadius: 10,
    border: "1.5px solid #d1d5db",
    padding: "0 8px",
    font: "inherit",
  },
};
