import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClusterWall } from "../lib/clusterWallApi.js";
import { isClusterWallSlug } from "../lib/clusterWallStyles.js";

const POLL_MS = 45000;

/**
 * One cluster's Wall for one week (default: this week). New posts by others show up every ~45 s
 * while the tab is visible ("new blocks appear continuously"). If the Wall API isn't there
 * (backend not deployed / Wall off), status = "unavailable" and the page keeps its old layout.
 */
export default function useClusterWall(clusterSlug, { week = null } = {}) {
  const enabled = isClusterWallSlug(clusterSlug);
  const [state, setState] = useState(() => ({
    status: enabled ? "loading" : "unavailable",
    blocks: [],
    cursor: null,
    weekStart: null,
    isCurrentWeek: true,
    cluster: null,
  }));
  const [loadingMore, setLoadingMore] = useState(false);
  const seen = useRef(new Set());

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, status: "unavailable" }));
      return undefined;
    }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, status: "loading", blocks: [] }));
    fetchClusterWall(clusterSlug, { week, signal: ctrl.signal })
      .then((data) => {
        seen.current = new Set((data.blocks || []).map((b) => b.public_id));
        setState({
          status: "ok",
          blocks: data.blocks || [],
          cursor: data.next_cursor || null,
          weekStart: data.week_start || null,
          isCurrentWeek: Boolean(data.is_current_week),
          cluster: data.cluster || null,
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setState((s) => ({ ...s, status: "unavailable" }));
      });
    return () => ctrl.abort();
  }, [clusterSlug, enabled, week]);

  // Live: pull the newest page and put unseen posts on top.
  useEffect(() => {
    if (state.status !== "ok" || !state.isCurrentWeek) return undefined;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchClusterWall(clusterSlug, { limit: 40 })
        .then((data) => {
          const fresh = (data.blocks || []).filter((b) => !seen.current.has(b.public_id));
          if (!fresh.length) return;
          fresh.forEach((b) => seen.current.add(b.public_id));
          setState((s) => ({ ...s, blocks: [...fresh, ...s.blocks] }));
        })
        .catch(() => {});
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [clusterSlug, state.status, state.isCurrentWeek]);

  const loadMore = useCallback(async () => {
    if (!state.cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchClusterWall(clusterSlug, { week, cursor: state.cursor });
      const more = (data.blocks || []).filter((b) => !seen.current.has(b.public_id));
      more.forEach((b) => seen.current.add(b.public_id));
      setState((s) => ({ ...s, blocks: [...s.blocks, ...more], cursor: data.next_cursor || null }));
    } catch {
      /* keep what we have */
    } finally {
      setLoadingMore(false);
    }
  }, [clusterSlug, week, state.cursor, loadingMore]);

  /** My new post: on top right away (clips show "In review" only to me). */
  const addMine = useCallback((block) => {
    if (!block?.public_id || seen.current.has(block.public_id)) return;
    seen.current.add(block.public_id);
    setState((s) => (s.isCurrentWeek ? { ...s, blocks: [block, ...s.blocks] } : s));
  }, []);

  const removeLocal = useCallback((publicId) => {
    setState((s) => ({ ...s, blocks: s.blocks.filter((b) => b.public_id !== publicId) }));
  }, []);

  return {
    enabled,
    ...state,
    hasMore: Boolean(state.cursor),
    loadingMore,
    loadMore,
    addMine,
    removeLocal,
  };
}
