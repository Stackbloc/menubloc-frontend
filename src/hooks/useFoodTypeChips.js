import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClusterFoodByTypeCounts } from "../lib/clusterApi.js";
import {
  chipsKey,
  createLatestRequestRunner,
  keepKnownChips,
  readSessionChips,
  toggleChip,
  writeSessionChips,
} from "../lib/clusterFoodByType.js";

/**
 * Nutrition chips on the cluster page, right above the Food boxes, as in the app (Andre 2026-11-05:
 * the website follows the app; this replaces the separate /food-by-type screen).
 * Only clusters with food-by-type data (today USC) get chips: the counts endpoint answers every
 * cluster, but the others come back with no tiles, so they keep plain boxes.
 * Chips combine (AND); with chips on, each box shows its matching count, 0 = dimmed and not tappable.
 */
export default function useFoodTypeChips(clusterSlug, { enabled = true } = {}) {
  const [chips, setChips] = useState(() => readSessionChips(clusterSlug));
  const [availableChips, setAvailableChips] = useState([]);
  const [counts, setCounts] = useState(null);
  const [supported, setSupported] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const activeKey = chipsKey(chips);
  const runnerRef = useRef(null);
  if (!runnerRef.current) runnerRef.current = createLatestRequestRunner();
  const firstRef = useRef(true);

  useEffect(() => {
    writeSessionChips(clusterSlug, chips);
  }, [clusterSlug, chips]);

  useEffect(() => {
    if (!enabled || !clusterSlug) return undefined;
    const runner = runnerRef.current;
    setRefreshing(true);
    // First paint is immediate; chip taps are debounced so quick taps send one request.
    runner.run(
      (signal) => {
        fetchClusterFoodByTypeCounts(clusterSlug, { chips, signal })
          .then((payload) => {
            if (signal.aborted) return;
            if (!payload?.ok) throw new Error(payload?.error || "Could not load food types");
            const tiles = Array.isArray(payload.tiles) ? payload.tiles : [];
            const list = Array.isArray(payload.available_chips) ? payload.available_chips : [];
            const has = tiles.length > 0 && list.length > 0;
            setSupported(has);
            if (has) {
              setAvailableChips(list);
              setChips((current) => {
                const kept = keepKnownChips(current, list);
                return kept.length === current.length ? current : kept;
              });
            }
            setCounts(chips.length && has ? payload.counts || {} : null);
            setRefreshing(false);
          })
          .catch((err) => {
            if (signal.aborted || err?.name === "AbortError") return;
            // Off or failing: no chip row; the boxes work as before.
            setRefreshing(false);
          });
      },
      { immediate: firstRef.current }
    );
    firstRef.current = false;
    return () => runner.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeKey stands in for chips
  }, [clusterSlug, activeKey, enabled]);

  const onToggle = useCallback((id) => setChips((current) => toggleChip(current, id)), []);
  const active = supported ? chips : [];
  return { chips: active, activeKey: chipsKey(active), availableChips: supported ? availableChips : [], counts, refreshing, onToggle };
}

