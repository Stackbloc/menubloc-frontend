import { useEffect, useState } from "react";
import { getConsumerUnreadNotificationCount } from "./consumerApi.js";

/**
 * Unread notifications badge (plan 40, Andre 2026-11-12: replies must reach people).
 * Counts unread notices newer than the last time this browser opened /account/notifications,
 * so the badge clears on open without marking anything read. Polls every minute + on focus.
 */
const SEEN_KEY = "menuply.notificationsSeenAt";
const EVENT = "menuply:notifications-seen";
const POLL_MS = 60_000;

function seenAt() {
  try {
    return window.localStorage.getItem(SEEN_KEY) || "";
  } catch {
    return "";
  }
}

export function markNotificationsSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    // private mode: the badge just counts every unread one
  }
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignore
  }
}

export function useUnreadNotifications(enabled) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = () =>
      getConsumerUnreadNotificationCount(seenAt())
        .then((d) => {
          if (alive) setCount(Math.max(0, Number(d?.unread_count) || 0));
        })
        .catch(() => {});
    load();
    const timer = window.setInterval(load, POLL_MS);
    const onFocus = () => load();
    const onSeen = () => setCount(0);
    window.addEventListener("focus", onFocus);
    window.addEventListener(EVENT, onSeen);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(EVENT, onSeen);
    };
  }, [enabled]);
  return enabled ? count : 0;
}
