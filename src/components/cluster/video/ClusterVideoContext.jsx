/**
 * Cluster video state for one cluster page: the video pool (GET /public/clusters/:slug/videos),
 * the floating player, and the restaurant menu sheet ("From the clip", or "Your pick" when a
 * diner taps a dish row — the row opens the ordering menu, not the dish detail page).
 *
 * One player at a time: opening the floating player pauses the hero, and the hero resumes
 * only when the floating player closes.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchClusterVideos } from "../../../lib/clusterApi.js";
import { buildClusterVideoIndex } from "../../../lib/clusterVideoIndex.js";
import { flushClusterVideoEvents } from "../../../lib/clusterVideoAnalytics.js";
import ClusterFloatingVideoPlayer from "./ClusterFloatingVideoPlayer.jsx";
import ClusterVideoMenuSheet from "./ClusterVideoMenuSheet.jsx";

const EMPTY_INDEX = buildClusterVideoIndex(null);

const ClusterVideoContext = createContext({
  cluster: null,
  status: "idle",
  index: EMPTY_INDEX,
  player: null,
  activeVideoKey: null,
  menuOpen: false,
  openVideo: () => {},
  closeVideo: () => {},
  openMenu: () => {},
  /** null outside a provider: dish rows then fall back to their link. */
  openDishMenu: null,
});

export function useClusterVideos() {
  return useContext(ClusterVideoContext);
}

export function ClusterVideoProvider({ cluster, children }) {
  const slug = cluster?.slug || "";
  const [status, setStatus] = useState(slug ? "loading" : "idle");
  const [index, setIndex] = useState(EMPTY_INDEX);
  /** Floating player: { queue, position, trigger, item } */
  const [player, setPlayer] = useState(null);
  /** Menu sheet: { video, item, pinnedLabel } (video null when opened from a dish row) */
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    if (!slug) return undefined;
    const controller = new AbortController();
    fetchClusterVideos(slug, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setIndex(buildClusterVideoIndex(data?.ok ? data : null));
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        // No videos is a normal cluster page — the page renders exactly as before.
        setIndex(EMPTY_INDEX);
        setStatus("error");
      });
    return () => {
      controller.abort();
      flushClusterVideoEvents();
    };
  }, [slug]);

  const openVideo = useCallback((videos, { startIndex = 0, trigger = "dish_icon", item = null } = {}) => {
    const queue = (Array.isArray(videos) ? videos : [videos]).filter(Boolean);
    if (queue.length === 0) return;
    setPlayer({
      queue,
      position: Math.max(0, Math.min(queue.length - 1, startIndex)),
      trigger,
      item,
      openedAt: Date.now(),
    });
  }, []);

  const closeVideo = useCallback(() => {
    setPlayer(null);
    setMenu(null);
  }, []);

  const openMenu = useCallback((video, { item = null } = {}) => {
    if (!video?.restaurant_id) return;
    setMenu({ video, item });
  }, []);

  /** Dish row → that restaurant's ordering menu with the dish pinned + highlighted. */
  const openDishMenu = useCallback((item) => {
    if (!item?.restaurant_id) return false;
    setMenu({ video: null, item, pinnedLabel: "Your pick" });
    return true;
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  const setPlayerPosition = useCallback((position, trigger = "next") => {
    setPlayer((prev) =>
      prev && position >= 0 && position < prev.queue.length
        ? { ...prev, position, trigger, item: position === prev.position ? prev.item : null }
        : prev
    );
  }, []);

  const activeVideoKey = player ? player.queue[player.position]?.video_key || null : null;

  const menuOpen = Boolean(menu);
  const value = useMemo(
    () => ({ cluster, status, index, player, activeVideoKey, menuOpen, openVideo, closeVideo, openMenu, openDishMenu }),
    [cluster, status, index, player, activeVideoKey, menuOpen, openVideo, closeVideo, openMenu, openDishMenu]
  );

  return (
    <ClusterVideoContext.Provider value={value}>
      {children}
      {menu ? (
        <ClusterVideoMenuSheet
          cluster={cluster}
          video={menu.video}
          item={menu.item}
          pinnedLabel={menu.pinnedLabel}
          withPlayer={Boolean(player)}
          onClose={closeMenu}
        />
      ) : null}
      {player ? (
        <ClusterFloatingVideoPlayer
          cluster={cluster}
          player={player}
          compact={Boolean(menu)}
          onSetPosition={setPlayerPosition}
          onClose={closeVideo}
          onOrder={(video, item) => openMenu(video, { item })}
        />
      ) : null}
    </ClusterVideoContext.Provider>
  );
}
