/**
 * Restaurant profile comments (Andre 2026-11-12): Feed comments about the place + its dishes, and
 * my_items = the signed-in diner's dishes here they commented on (hero "You Commented on this").
 * One fetch per profile, again after sign-in changes. Never throws: no comments = empty.
 */
import { useEffect, useState } from "react";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { listRestaurantFeedComments } from "../lib/consumerApi.js";

const EMPTY = Object.freeze({ comments: [], my_items: [] });

export default function useRestaurantProfileComments(restaurantId) {
  const { isAuthenticated } = useConsumer();
  const [state, setState] = useState({ key: null, data: EMPTY });
  const key = restaurantId ? `${restaurantId}:${isAuthenticated ? 1 : 0}` : null;
  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    listRestaurantFeedComments(restaurantId)
      .then((res) => {
        if (cancelled) return;
        setState({
          key,
          data: {
            comments: Array.isArray(res?.comments) ? res.comments : [],
            my_items: Array.isArray(res?.my_items) ? res.my_items : [],
          },
        });
      })
      .catch(() => {
        if (!cancelled) setState({ key, data: EMPTY });
      });
    return () => {
      cancelled = true;
    };
  }, [key, restaurantId]);
  return state.key === key ? state.data : EMPTY;
}
