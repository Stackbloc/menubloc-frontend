import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { createWantToEat, deleteWantToEat, listWantToEat } from "../lib/consumerApi.js";

/**
 * Wish List toggle for a dish (or a restaurant when no dish is linked). Entries land in the
 * profile Wish List. One list fetch per session is shared by every row on the page.
 */
const WISH_LIST_CHANGED = "menuply:wish-list-changed";

let listPromise = null;

function loadWishList() {
  if (!listPromise) {
    listPromise = listWantToEat()
      .then((data) => (Array.isArray(data?.items) ? data.items : []))
      .catch(() => {
        listPromise = null;
        return [];
      });
  }
  return listPromise;
}

function findEntry(items, { menuItemId, restaurantId }) {
  if (menuItemId != null) {
    return items.find((row) => Number(row.menu_item_id) === Number(menuItemId)) || null;
  }
  return (
    items.find(
      (row) =>
        row.intent_kind === "restaurant" &&
        row.menu_item_id == null &&
        Number(row.restaurant_id) === Number(restaurantId)
    ) || null
  );
}

function updateCache(mutator) {
  listPromise = loadWishList().then((items) => mutator([...items]));
  listPromise.then(() => window.dispatchEvent(new Event(WISH_LIST_CHANGED)));
}

function positiveId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default function useWishListEntry({ menuItemId = null, menuItemName = "", restaurantId = null, restaurantName = "" }) {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const dishId = positiveId(menuItemId);
  const rid = positiveId(restaurantId);
  const [entryId, setEntryId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (!isAuthenticated) listPromise = null;
    if (!isAuthenticated || (!dishId && !rid)) {
      setEntryId(null);
      return undefined;
    }
    let alive = true;
    const sync = () =>
      loadWishList().then((items) => {
        if (alive) setEntryId(findEntry(items, { menuItemId: dishId, restaurantId: rid })?.id ?? null);
      });
    sync();
    window.addEventListener(WISH_LIST_CHANGED, sync);
    return () => {
      alive = false;
      window.removeEventListener(WISH_LIST_CHANGED, sync);
    };
  }, [isAuthenticated, dishId, rid]);

  const toggle = useCallback(async () => {
    setError("");
    if (!dishId && !rid) return;
    if (!isAuthenticated) {
      const next = `${location.pathname}${location.search || ""}${location.hash || ""}`;
      navigate(`/account/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (entryId) {
        if (entryId > 0) await deleteWantToEat(entryId);
        const removed = entryId;
        setEntryId(null);
        updateCache((items) => items.filter((row) => row.id !== removed));
        return;
      }
      const dishName = String(menuItemName || "").trim();
      const placeName = String(restaurantName || "").trim();
      let data;
      if (dishId) {
        try {
          data = await createWantToEat({
            food_name: dishName || placeName || "Dish",
            restaurant_id: rid,
            menu_item_id: dishId,
            intent_kind: "menu_item",
          });
        } catch (err) {
          // Stale or non-CK dish id: still save the dish by name at this restaurant.
          if (err?.payload?.code !== "menu_item_not_found" || !rid) throw err;
          data = await createWantToEat({
            food_name: dishName || "Dish",
            restaurant_id: rid,
            intent_kind: "food_item",
          });
        }
      } else {
        data = await createWantToEat({
          food_name: placeName || "Restaurant",
          restaurant_id: rid,
          intent_kind: "restaurant",
        });
      }
      const item = data?.item || null;
      setEntryId(item?.id ?? -1);
      if (item) updateCache((items) => [{ ...item, menu_item_id: item.menu_item_id ?? dishId }, ...items]);
    } catch (err) {
      setError(err?.message || "Could not update Wish List");
    } finally {
      setBusy(false);
    }
  }, [busy, dishId, entryId, isAuthenticated, location, menuItemName, navigate, restaurantName, rid]);

  return {
    available: Boolean(dishId || rid),
    added: entryId != null,
    busy,
    error,
    toggle,
  };
}
