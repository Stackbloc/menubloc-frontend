import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { followRestaurant, getFollowedRestaurants, unfollowRestaurant } from "../lib/consumerApi.js";
import { trackRestaurantFollow } from "../lib/analytics.js";

/**
 * My Favs for a whole cluster directory: one followed-restaurants read instead of a follow-status
 * call per card. Same follow record as FollowRestaurantButton (Fav = restaurants → My Favs).
 */
export default function useClusterFavs({ source = "cluster_directory" } = {}) {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [favIds, setFavIds] = useState(() => new Set());
  const [busyIds, setBusyIds] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setFavIds(new Set());
      return undefined;
    }
    let alive = true;
    getFollowedRestaurants()
      .then((data) => {
        if (!alive) return;
        const rows = Array.isArray(data?.restaurants) ? data.restaurants : [];
        setFavIds(new Set(rows.map((row) => Number(row?.restaurant_id)).filter((id) => id > 0)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  const toggleFav = useCallback(
    async (restaurantId, restaurantName = "") => {
      const id = Number(restaurantId);
      if (!Number.isInteger(id) || id <= 0 || busyIds.has(id)) return;
      if (!isAuthenticated) {
        const redirectTo = `${location.pathname}${location.search || ""}${location.hash || ""}`;
        navigate("/account/login", { state: { redirectTo } });
        return;
      }
      const wasFav = favIds.has(id);
      const setMember = (on) =>
        setFavIds((prev) => {
          const next = new Set(prev);
          if (on) next.add(id);
          else next.delete(id);
          return next;
        });
      setMember(!wasFav);
      setBusyIds((prev) => new Set(prev).add(id));
      try {
        const result = wasFav ? await unfollowRestaurant(id) : await followRestaurant(id);
        setMember(result?.followed === true);
        if (!wasFav && result?.followed === true) {
          trackRestaurantFollow({ restaurantId: id, restaurantName, source });
        }
      } catch {
        setMember(wasFav);
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [busyIds, favIds, isAuthenticated, location, navigate, source]
  );

  return { isAuthenticated, favIds, busyIds, toggleFav };
}
