import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { followRestaurant, unfollowRestaurant, getRestaurantFollowStatus } from "../lib/consumerApi.js";
import { trackRestaurantFollow } from "../lib/analytics.js";

export default function useRestaurantFollow(restaurantId, { source = "menu_page", restaurantName = "" } = {}) {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    setError("");
    setNotice("");

    const id = Number(restaurantId);
    if (!Number.isInteger(id) || id <= 0) {
      setFollowed(false);
      setFollowerCount(0);
      return () => {
        alive = false;
      };
    }

    if (!isAuthenticated) {
      setFollowed(false);
      setFollowerCount(0);
      return () => {
        alive = false;
      };
    }

    setStatusLoading(true);
    getRestaurantFollowStatus(id)
      .then((result) => {
        if (!alive) return;
        setFollowed(result?.followed === true);
        setFollowerCount(Number(result?.follower_count || 0));
      })
      .catch((err) => {
        if (alive) setError(err.message || "Unable to load follow status.");
      })
      .finally(() => {
        if (alive) setStatusLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [restaurantId, isAuthenticated]);

  async function toggleFollow() {
    const id = Number(restaurantId);
    if (!Number.isInteger(id) || id <= 0 || actionLoading) return;
    setError("");
    setNotice("");

    if (!isAuthenticated) {
      const redirectTo = `${location.pathname}${location.search || ""}${location.hash || ""}`;
      setNotice("Log in to follow this restaurant.");
      navigate("/account/login", { state: { redirectTo } });
      return;
    }

    setActionLoading(true);
    const wasFollowed = followed;
    setFollowed(!wasFollowed);
    try {
      const result = wasFollowed ? await unfollowRestaurant(id) : await followRestaurant(id);
      setFollowed(result?.followed === true);
      setFollowerCount(Number(result?.follower_count || 0));
      if (!wasFollowed && result?.followed === true) {
        trackRestaurantFollow({ restaurantId: id, restaurantName, source });
      }
    } catch (err) {
      setFollowed(wasFollowed);
      if (err?.status === 401) {
        setNotice("Log in to follow this restaurant.");
      } else {
        setError(err.message || "Unable to update follow status.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  return { followed, followerCount, statusLoading, actionLoading, error, notice, toggleFollow };
}
