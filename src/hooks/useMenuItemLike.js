import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { getMenuItemLikeStatus, likeMenuItem, unlikeMenuItem } from "../lib/consumerApi.js";

/**
 * Like / unlike a dish (CK menu item id). Likes are for menu items; restaurants get a Fav.
 * onLikedChange(liked) fires on a user toggle (and on revert).
 */
export default function useMenuItemLike(menuItemId, { onLikedChange = null } = {}) {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const id = Number(menuItemId);
  const valid = Number.isInteger(id) && id > 0;

  useEffect(() => {
    let alive = true;
    if (!valid || !isAuthenticated) {
      setLiked(false);
      setLoading(false);
      return () => {
        alive = false;
      };
    }
    setLoading(true);
    getMenuItemLikeStatus(id)
      .then((data) => {
        if (alive) setLiked(data?.liked === true);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, valid, isAuthenticated]);

  const toggle = useCallback(async () => {
    if (!valid || busy) return;

    if (!isAuthenticated) {
      const redirectTo = `${location.pathname}${location.search || ""}${location.hash || ""}`;
      navigate("/account/login", { state: { redirectTo } });
      return;
    }

    setBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    onLikedChange?.(!wasLiked);
    try {
      if (wasLiked) {
        await unlikeMenuItem(id);
      } else {
        await likeMenuItem(id);
      }
    } catch {
      setLiked(wasLiked);
      onLikedChange?.(wasLiked);
    } finally {
      setBusy(false);
    }
  }, [busy, id, isAuthenticated, liked, location, navigate, onLikedChange, valid]);

  return { valid, liked, loading, busy, toggle };
}
