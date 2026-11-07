import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClusterWall, fetchWallBricks } from "../lib/clusterWallApi.js";
import { isClusterWallSlug } from "../lib/clusterWallStyles.js";
import { markGuestOwn } from "../lib/clusterWallGuest.js";

const POLL_MS = 45000;

/** Continuous wall (mig 0397) as a flat list for the cluster page previews: pinned, then newest rows. */
const flatBricks = (data) => [...(data.pinned || []), ...(data.rows || []).flatMap((r) => r.bricks)];

/** Newest bricks (continuous wall) when the backend has it; else this week's posts (before mig 0397). */
async function fetchLatest(clusterSlug, { week, cursor, signal } = {}) {
  // Row cursors are numbers; the weekly list's cursors are "<time>|<id>".
  if (!week && !String(cursor || "").includes("|")) {
    const data = await fetchWallBricks(clusterSlug, { cursor, signal });
    if (data?.layout_ready) {
      return { blocks: flatBricks(data), next_cursor: data.next_cursor, cluster: data.cluster, is_current_week: true, continuous: true };
    }
    if (cursor) return { blocks: [], next_cursor: null };
  }
  return fetchClusterWall(clusterSlug, { week, cursor, signal });
}

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
    houseBlock: null,
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
    fetchLatest(clusterSlug, { week, signal: ctrl.signal })
      .then((data) => {
        seen.current = new Set((data.blocks || []).map((b) => b.public_id));
        setState({
          status: "ok",
          blocks: markGuestOwn(data.blocks || []),
          cursor: data.next_cursor || null,
          weekStart: data.week_start || null,
          isCurrentWeek: Boolean(data.is_current_week),
          cluster: data.cluster || null,
          // The official Menuply brick (first page only; null when off or before the backend has it).
          houseBlock: data.house_block && data.house_block.house ? data.house_block : null,
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
      fetchLatest(clusterSlug)
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
      const data = await fetchLatest(clusterSlug, { week, cursor: state.cursor });
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
