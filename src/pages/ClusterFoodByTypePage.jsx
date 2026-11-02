import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import ClusterBackButton from "../components/cluster/ClusterBackButton.jsx";
import { MKS_ACCENTS } from "../components/cluster/ClusterMksCategoryBlock.jsx";
import { buildDishHref } from "../components/cluster/ClusterMenuExplorer.jsx";
import { ClusterFoodSearchForm } from "./ClusterPage.jsx";
import {
  fetchClusterFoodByTypeCounts,
  fetchClusterFoodByTypeDishes,
  fetchClusterMetadata,
} from "../lib/clusterApi.js";
import {
  FOOD_BY_TYPE_EMOJI,
  FOOD_BY_TYPE_PAGE_SIZE,
  chipsKey,
  createLatestRequestRunner,
  dishNutritionParts,
  formatDishCount,
  keepKnownChips,
  readSessionChips,
  toggleChip,
  writeSessionChips,
} from "../lib/clusterFoodByType.js";
import { isClusterFoodByTypeEnabled } from "../lib/featureFlags.js";
import { formatMoney, getConsumerDisplayPrice } from "../lib/pricingDisplay.js";
import "../styles/clusterFoodByType.css";

const CATEGORY_QUERY_KEY = "category";
const SKELETON_TILE_COUNT = 12;

/**
 * Cluster "Food by type" (2026-10-28, behind VITE_ENABLE_FOOD_BY_TYPE).
 * Grid of category tiles with live counts; quick-filter chips (nutrition + diet, AND) are the
 * only filters. The grid fetches counts only; tapping a tile opens that category's dishes with
 * the active chips carried over. Chip definitions live on the backend.
 */
export default function ClusterFoodByTypePage() {
  const { stateSlug, citySlug, clusterSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const enabled = isClusterFoodByTypeEnabled();
  const clusterBase = `/clusters/${stateSlug}/${citySlug}/${clusterSlug}`;
  const category = String(searchParams.get(CATEGORY_QUERY_KEY) || "").trim().toUpperCase() || null;

  const [cluster, setCluster] = useState(null);
  const [chips, setChips] = useState(() => readSessionChips(clusterSlug));
  const [availableChips, setAvailableChips] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const activeKey = chipsKey(chips);

  useEffect(() => {
    writeSessionChips(clusterSlug, chips);
  }, [clusterSlug, chips]);

  useEffect(() => {
    if (!enabled || !clusterSlug) return undefined;
    const controller = new AbortController();
    fetchClusterMetadata(clusterSlug, { stateSlug, citySlug, signal: controller.signal })
      .then((data) => {
        if (data?.ok && data.cluster) setCluster(data.cluster);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [enabled, clusterSlug, stateSlug, citySlug]);

  const clusterName = cluster?.name || String(clusterSlug || "").toUpperCase();

  const onAvailableChips = useCallback((list) => {
    if (!Array.isArray(list) || list.length === 0) return;
    setAvailableChips(list);
    setChips((current) => {
      const kept = keepKnownChips(current, list);
      return kept.length === current.length ? current : kept;
    });
  }, []);

  function onToggleChip(id) {
    setChips((current) => toggleChip(current, id));
  }

  function openCategory(code) {
    const params = new URLSearchParams(searchParams);
    params.set(CATEGORY_QUERY_KEY, code);
    setSearchParams(params);
    window.scrollTo?.({ top: 0 });
  }

  function closeCategory() {
    const params = new URLSearchParams(searchParams);
    params.delete(CATEGORY_QUERY_KEY);
    setSearchParams(params);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    // Same search as the cluster Food tab: hand the query to it unchanged.
    const params = new URLSearchParams({ view: "menu", q });
    navigate(`${clusterBase}?${params.toString()}`);
  }

  if (!enabled) return <Navigate to={clusterBase} replace />;

  return (
    <div className="fbt-page">
      <main className="fbt-wrap">
        <header className="fbt-header">
          <ClusterBackButton fallbackTo={clusterBase} label={`${clusterName} Cluster`} />
          <h1 className="fbt-title">Food by type</h1>
        </header>

        <ClusterFoodSearchForm
          searchInput={searchInput}
          onSearchInputChange={(event) => setSearchInput(event.target.value)}
          searchPlaceholder={`Search food around ${clusterName}`}
          searchActive={false}
          onSubmit={handleSearchSubmit}
          onClear={() => setSearchInput("")}
        />

        <FoodByTypeChipRow chips={chips} availableChips={availableChips} onToggle={onToggleChip} />

        {category ? (
          <FoodByTypeDishList
            clusterSlug={clusterSlug}
            category={category}
            chips={chips}
            activeKey={activeKey}
            onBack={closeCategory}
            onAvailableChips={onAvailableChips}
            needsChips={availableChips.length === 0}
            returnTo={`${clusterBase}/food-by-type?${CATEGORY_QUERY_KEY}=${encodeURIComponent(category)}`}
          />
        ) : (
          <FoodByTypeGrid
            clusterSlug={clusterSlug}
            chips={chips}
            activeKey={activeKey}
            onSelect={openCategory}
            onAvailableChips={onAvailableChips}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function FoodByTypeChipRow({ chips, availableChips, onToggle }) {
  if (!availableChips.length) {
    return <div className="fbt-chips fbt-chips--placeholder" aria-hidden="true" />;
  }
  const active = new Set(chips);
  return (
    <div className="fbt-chips" role="group" aria-label="Quick filters" data-testid="food-by-type-chips">
      {availableChips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="fbt-chip"
          aria-pressed={active.has(chip.id)}
          onClick={() => onToggle(chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

function FoodByTypeGrid({ clusterSlug, chips, activeKey, onSelect, onAvailableChips }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const runnerRef = useRef(null);
  if (!runnerRef.current) runnerRef.current = createLatestRequestRunner();
  const hasData = Boolean(data);
  const hasDataRef = useRef(false);
  hasDataRef.current = hasData;

  useEffect(() => {
    const runner = runnerRef.current;
    setStatus("loading");
    // First paint is immediate; chip taps are debounced so quick taps send one request.
    runner.run(
      (signal) => {
        fetchClusterFoodByTypeCounts(clusterSlug, { chips, signal })
          .then((payload) => {
            if (signal.aborted) return;
            if (!payload?.ok) throw new Error(payload?.error || "Could not load food types");
            setData(payload);
            onAvailableChips(payload.available_chips);
            setStatus("ok");
          })
          .catch((err) => {
            if (signal.aborted || err?.name === "AbortError") return;
            setStatus("error");
          });
      },
      { immediate: !hasDataRef.current }
    );
    return () => runner.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeKey stands in for chips
  }, [clusterSlug, activeKey, reloadToken, onAvailableChips]);

  const retry = () => setReloadToken((n) => n + 1);

  if (!hasData && status === "error") {
    return (
      <div className="fbt-error" role="alert">
        <p>Couldn’t load food types.</p>
        <button type="button" className="fbt-retry" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="fbt-grid" aria-busy="true" data-testid="food-by-type-skeleton">
        {Array.from({ length: SKELETON_TILE_COUNT }, (_, i) => (
          <div key={i} className="fbt-tile fbt-tile--skeleton" />
        ))}
      </div>
    );
  }

  const refreshing = status === "loading";
  return (
    <>
      {status === "error" ? (
        <div className="fbt-inline-error" role="alert">
          Couldn’t update counts.{" "}
          <button type="button" className="fbt-link-button" onClick={retry}>
            Retry
          </button>
        </div>
      ) : null}
      {data.tiles.length === 0 ? <p className="fbt-muted">No food is listed here yet.</p> : null}
      <div
        className={`fbt-grid${refreshing ? " fbt-grid--refreshing" : ""}`}
        aria-busy={refreshing}
        data-testid="food-by-type-grid"
      >
        {data.tiles.map((tile) => (
          <FoodByTypeTile key={tile.code} tile={tile} onSelect={onSelect} />
        ))}
      </div>
    </>
  );
}

function FoodByTypeTile({ tile, onSelect }) {
  const empty = !(tile.count > 0);
  const tint = MKS_ACCENTS[tile.code]?.bg || "#f8fafc";
  return (
    <button
      type="button"
      className={`fbt-tile${empty ? " fbt-tile--empty" : ""}`}
      style={{ background: tint }}
      disabled={empty}
      onClick={() => onSelect(tile.code)}
      data-testid={`food-by-type-tile-${tile.code}`}
      aria-label={`${tile.label}, ${formatDishCount(tile.count)}`}
    >
      <span className="fbt-tile-emoji" aria-hidden="true">
        {FOOD_BY_TYPE_EMOJI[tile.code] || "🍽️"}
      </span>
      <span className="fbt-tile-name">{tile.label}</span>
      <span className="fbt-tile-count">{formatDishCount(tile.count)}</span>
    </button>
  );
}

function FoodByTypeDishList({ clusterSlug, category, chips, activeKey, onBack, onAvailableChips, needsChips, returnTo }) {
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState("");
  const [total, setTotal] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const runnerRef = useRef(null);
  if (!runnerRef.current) runnerRef.current = createLatestRequestRunner();
  const moreControllerRef = useRef(null);
  const sentinelRef = useRef(null);
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
            setLabel(payload.category_label || "");
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

  // Chips render from the counts response; a cold open straight into a category still needs them.
  useEffect(() => {
    if (!needsChips) return undefined;
    const controller = new AbortController();
    fetchClusterFoodByTypeCounts(clusterSlug, { signal: controller.signal })
      .then((payload) => onAvailableChips(payload?.available_chips))
      .catch(() => {});
    return () => controller.abort();
  }, [clusterSlug, needsChips, onAvailableChips]);

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

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    }, { rootMargin: "400px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  const refreshing = status === "loading" && items.length > 0;

  return (
    <section className="fbt-list" data-testid="food-by-type-dish-list">
      <div className="fbt-list-head">
        <button type="button" className="fbt-back-pill" onClick={onBack}>
          ← All food
        </button>
        <h2 className="fbt-list-title">{label || category}</h2>
        {total != null ? <span className="fbt-muted">{formatDishCount(total)}</span> : null}
      </div>

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

      {status === "ok" && items.length === 0 ? (
        <p className="fbt-muted">No dishes match these filters.</p>
      ) : null}

      {items.length > 0 ? (
        <div className={`fbt-rows${refreshing ? " fbt-grid--refreshing" : ""}`}>
          {items.map((item) => (
            <FoodByTypeDishRow key={item.dish_id} item={item} returnTo={returnTo} />
          ))}
        </div>
      ) : null}

      {cursor ? (
        <div ref={sentinelRef} className="fbt-more">
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
  return (
    <Link
      to={href}
      className="fbt-row"
      data-mp-event="menu_item_click"
      data-mp-menu-item-id={item.menu_item_id ?? undefined}
      data-mp-restaurant-id={item.restaurant_id ?? undefined}
      data-mp-placement="cluster_food_by_type"
    >
      <span className="fbt-row-top">
        <span className="fbt-row-name">{item.name}</span>
        {priceCents != null ? <span className="fbt-row-price">{formatMoney(priceCents)}</span> : null}
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
