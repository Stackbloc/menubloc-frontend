import { useEffect, useState } from "react";

/** Ease displayed progress toward target for a live loading feel. */
export function useSmoothedProgress(target, enabled = true) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setInterval(() => {
      setDisplay((current) => {
        if (current >= target) return target;
        const delta = target - current;
        const step = Math.max(1, Math.ceil(delta / 6));
        return Math.min(target, current + step);
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [target, enabled]);

  useEffect(() => {
    if (!enabled) setDisplay(0);
  }, [enabled]);

  return display;
}

/**
 * Map browse boot milestones to a 0–100 target.
 * 12% locating · 40% menu list · 72% first menu · 100% ready
 */
export function computeMenuBrowserLoadTarget({
  loading = false,
  currentEntry = null,
  menuStatus = "idle",
  isEmpty = false,
  error = "",
} = {}) {
  if (error) return 100;
  if (isEmpty && !loading) return 100;
  if (menuStatus === "ok") return 100;
  if (menuStatus === "error") return 100;
  if (currentEntry && (menuStatus === "loading" || menuStatus === "idle")) return 72;
  if (currentEntry) return 60;
  if (loading) return 40;
  return 12;
}
