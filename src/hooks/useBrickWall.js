import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWallBricks } from "../lib/clusterWallApi.js";
import { markGuestOwn } from "../lib/clusterWallGuest.js";

const POLL_MS = 45000;

const brickIds = (data) => [
  ...(data?.pinned || []).map((b) => b.public_id),
  ...(data?.rows || []).flatMap((r) => r.bricks.map((b) => b.public_id)),
];

const ownRows = (rows) => rows.map((r) => ({ ...r, bricks: markGuestOwn(r.bricks) }));

/** Rows by row number, newest on top; a newer copy of a row replaces the old one. */
function mergeRows(current, incoming) {
  const map = new Map(current.map((r) => [r.row, r]));
  for (const r of incoming) map.set(r.row, r);
  return [...map.values()].sort((a, b) => b.row - a.row);
}

/**
 * The continuous Wall (2026-11-06): rows with stored widths, newest on top, ~30 bricks a page.
 * - New bricks from others are fetched every ~45 s but NOT put on screen: `fresh` counts them for the
 *   "New bricks" pill, and showFresh() puts them in (the caller scrolls to the top first).
 * - My own post goes in at once (refreshTop), or, while it waits for review, into `waiting`.
 * - status "legacy" = backend without the layout (before mig 0398): the caller shows the old Wall.
 */
export default function useBrickWall(clusterSlug, { enabled = true } = {}) {
  const [state, setState] = useState({ status: enabled ? "loading" : "off", rows: [], pinned: [], cursor: null, cluster: null });
  const [fresh, setFresh] = useState(null);
  const [waiting, setWaiting] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const seen = useRef(new Set());
  const busyMore = useRef(false);

  const apply = useCallback((data, { replaceTop = true } = {}) => {
    brickIds(data).forEach((id) => seen.current.add(id));
    setState((s) => ({
      ...s,
      status: "ok",
      cluster: data.cluster || s.cluster,
      pinned: markGuestOwn(data.pinned || []),
      rows: replaceTop ? mergeRows(s.rows, ownRows(data.rows || [])) : s.rows,
      cursor: s.rows.length ? s.cursor : data.next_cursor || null,
    }));
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const ctrl = new AbortController();
    seen.current = new Set();
    setState({ status: "loading", rows: [], pinned: [], cursor: null, cluster: null });
    fetchWallBricks(clusterSlug, { signal: ctrl.signal })
      .then((data) => {
        if (!data?.layout_ready) {
          setState((s) => ({ ...s, status: "legacy", cluster: data?.cluster || null }));
          return;
        }
        brickIds(data).forEach((id) => seen.current.add(id));
        setState({
          status: "ok",
          cluster: data.cluster || null,
          pinned: markGuestOwn(data.pinned || []),
          rows: ownRows(data.rows || []),
          cursor: data.next_cursor || null,
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setState((s) => ({ ...s, status: "unavailable" }));
      });
    return () => ctrl.abort();
  }, [clusterSlug, enabled]);

  // Live: look for new bricks; count them for the pill instead of moving the wall.
  useEffect(() => {
    if (state.status !== "ok") return undefined;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchWallBricks(clusterSlug)
        .then((data) => {
          if (!data?.layout_ready) return;
          const n = brickIds(data).filter((id) => !seen.current.has(id)).length;
          setFresh(n > 0 ? { count: n, data } : null);
        })
        .catch(() => {});
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [clusterSlug, state.status]);

  /** Put the waiting new bricks on the wall (call after scrolling to the top). */
  const showFresh = useCallback(() => {
    if (!fresh) return;
    apply(fresh.data);
    setFresh(null);
  }, [fresh, apply]);

  /** Re-read the top of the wall now (after my own post). */
  const refreshTop = useCallback(async () => {
    try {
      const data = await fetchWallBricks(clusterSlug);
      if (data?.layout_ready) {
        apply(data);
        setFresh(null);
      }
    } catch {
      /* keep what we have */
    }
  }, [clusterSlug, apply]);

  const loadMore = useCallback(async () => {
    if (!state.cursor || busyMore.current) return;
    busyMore.current = true;
    setLoadingMore(true);
    try {
      const data = await fetchWallBricks(clusterSlug, { cursor: state.cursor });
      brickIds(data).forEach((id) => seen.current.add(id));
      setState((s) => ({ ...s, rows: mergeRows(s.rows, ownRows(data.rows || [])), cursor: data.next_cursor || null }));
    } catch {
      /* try again on the next scroll */
    } finally {
      busyMore.current = false;
      setLoadingMore(false);
    }
  }, [clusterSlug, state.cursor]);

  /** My new post: published → re-read the top (it has its place); in review → shown only to me. */
  const addMine = useCallback(
    (block) => {
      if (!block?.public_id) return;
      if (block.status && block.status !== "published") {
        setWaiting((w) => [block, ...w.filter((b) => b.public_id !== block.public_id)]);
        return;
      }
      refreshTop();
    },
    [refreshTop]
  );

  /** Removed (my delete): the slot becomes a plain brick right away. */
  const removeLocal = useCallback((publicId) => {
    setState((s) => ({
      ...s,
      pinned: s.pinned.filter((b) => b.public_id !== publicId),
      rows: s.rows.map((r) => ({ ...r, bricks: r.bricks.filter((b) => b.public_id !== publicId) })),
    }));
    setWaiting((w) => w.filter((b) => b.public_id !== publicId));
  }, []);

  return {
    ...state,
    hasMore: Boolean(state.cursor),
    loadingMore,
    loadMore,
    fresh: fresh?.count || 0,
    showFresh,
    waiting,
    addMine,
    removeLocal,
    refreshTop,
  };
}
