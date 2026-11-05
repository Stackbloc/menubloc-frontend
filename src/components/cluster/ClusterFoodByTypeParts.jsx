import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buildDishHref } from "./ClusterMenuExplorer.jsx";
import { fetchClusterFoodByTypeDishes } from "../../lib/clusterApi.js";
import {
  FOOD_BY_TYPE_PAGE_SIZE,
  createLatestRequestRunner,
  dishNutritionParts,
  formatDishCount,
} from "../../lib/clusterFoodByType.js";
import { formatMoney, getConsumerDisplayPrice } from "../../lib/pricingDisplay.js";
import DealPriceTag from "../menu/DealPriceTag.jsx";
import { DEAL_ROW_HIGHLIGHT, liveItemDeal } from "../../lib/itemDeal.js";
import "../../styles/clusterFoodByType.css";

export function FoodByTypeChipRow({ chips, availableChips, onToggle }) {
  if (!availableChips.length) return null;
  const active = new Set(chips);
  return (
    <div className="fbt-chips" role="group" aria-label="Quick filters" data-testid="food-by-type-chips">
      {availableChips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="fbt-chip"
          aria-pressed={active.has(chip.id)}
          data-testid={`cluster-chip-${chip.id}`}
          onClick={() => onToggle(chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

/** One food type's dishes that match the picked chips, with calories and macros ("est." on estimates). */
export function FoodByTypeDishList({ clusterSlug, category, chips, activeKey, returnTo, listAd = null }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const runnerRef = useRef(null);
  if (!runnerRef.current) runnerRef.current = createLatestRequestRunner();
  const moreControllerRef = useRef(null);
  const lastCategoryRef = useRef(null);

  useEffect(() => {
    const runner = runnerRef.current;
    const categoryChanged = lastCategoryRef.current !== category;
    lastCategoryRef.current = category;
    moreControllerRef.current?.abort();
    setLoadingMore(false);
    setStatus("loading");
    if (categoryChanged) {
      setItems([]);
      setTotal(null);
      setCursor(null);
    }
    runner.run(
      (signal) => {
        fetchClusterFoodByTypeDishes(clusterSlug, category, { chips, limit: FOOD_BY_TYPE_PAGE_SIZE, signal })
          .then((payload) => {
            if (signal.aborted) return;
            if (!payload?.ok) throw new Error(payload?.error || "Could not load dishes");
            setItems(payload.items || []);
            setTotal(payload.total ?? null);
            setCursor(payload.next_cursor || null);
            setStatus("ok");
          })
          .catch((err) => {
            if (signal.aborted || err?.name === "AbortError") return;
            setStatus("error");
          });
      },
      { immediate: categoryChanged }
    );
    return () => runner.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeKey stands in for chips
  }, [clusterSlug, category, activeKey, reloadToken]);

  const loadMore = useCallback(() => {
    if (!cursor || loadingMore || status !== "ok") return;
    const controller = new AbortController();
    moreControllerRef.current = controller;
    setLoadingMore(true);
    fetchClusterFoodByTypeDishes(clusterSlug, category, {
      chips,
      cursor,
      limit: FOOD_BY_TYPE_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((payload) => {
        if (controller.signal.aborted || !payload?.ok) return;
        setItems((current) => [...current, ...(payload.items || [])]);
        setCursor(payload.next_cursor || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMore(false);
      });
  }, [clusterSlug, category, chips, cursor, loadingMore, status]);

  const refreshing = status === "loading" && items.length > 0;
  const adAfter = Math.min(3, items.length) - 1;

  return (
    <section className="fbt-list" data-testid="food-by-type-dish-list">
      {total != null ? <p className="fbt-muted">{formatDishCount(total)}</p> : null}

      {status === "error" ? (
        <div className="fbt-error" role="alert">
          <p>Couldn’t load these dishes.</p>
          <button type="button" className="fbt-retry" onClick={() => setReloadToken((n) => n + 1)}>
            Try again
          </button>
        </div>
      ) : null}

      {status === "loading" && items.length === 0 ? (
        <div className="fbt-rows" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="fbt-row fbt-row--skeleton" />
          ))}
        </div>
      ) : null}

      {status === "ok" && items.length === 0 ? <p className="fbt-muted">No dishes match these filters.</p> : null}

      {items.length > 0 ? (
        <div className={`fbt-rows${refreshing ? " fbt-grid--refreshing" : ""}`}>
          {items.map((item, index) => (
            <React.Fragment key={item.dish_id}>
              <FoodByTypeDishRow item={item} returnTo={returnTo} />
              {listAd && index === adAfter ? listAd : null}
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {cursor ? (
        <div className="fbt-more">
          <button type="button" className="fbt-link-button" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function FoodByTypeDishRow({ item, returnTo }) {
  const href = useMemo(() => buildDishHref(item, returnTo, "Food by type"), [item, returnTo]);
  const priceCents = getConsumerDisplayPrice(item);
  const nutrition = dishNutritionParts(item);
  // Live deal (Andre 2026-11-04): deal icon + deal price, and the whole box is highlighted.
  const itemDeal = liveItemDeal(item);
  return (
    <Link
      to={href}
      className="fbt-row"
      style={itemDeal ? DEAL_ROW_HIGHLIGHT : undefined}
      data-deal={itemDeal ? "live" : undefined}
      data-mp-event="menu_item_click"
      data-mp-menu-item-id={item.menu_item_id ?? undefined}
      data-mp-restaurant-id={item.restaurant_id ?? undefined}
      data-mp-placement="cluster_food_by_type"
    >
      <span className="fbt-row-top">
        <span className="fbt-row-name">{item.name}</span>
        {itemDeal ? (
          <span className="fbt-row-price">
            <DealPriceTag deal={itemDeal} regular={priceCents != null ? formatMoney(priceCents) : null} />
          </span>
        ) : priceCents != null ? (
          <span className="fbt-row-price">{formatMoney(priceCents)}</span>
        ) : null}
      </span>
      {item.restaurant_name ? <span className="fbt-row-restaurant">{item.restaurant_name}</span> : null}
      {nutrition.length ? (
        <span className="fbt-row-nutrition">
          {nutrition.map((part) => part.text).join(" · ")}
          {/* One source per dish, so one label: restaurant estimates say "est."; verified data says nothing. */}
          {nutrition[0].estimated ? <span className="fbt-est"> · est.</span> : null}
        </span>
      ) : null}
    </Link>
  );
}
