/**
 * Server feature flags for the signed-in diner (mig 0411), as the app's useFeatureFlags: everything
 * is OFF while signed out, while loading and when the server can't be reached, so the website looks
 * exactly as before unless a flag is really on. One read per diner per page load (shared cache);
 * coming back to the tab re-reads, so turning a flag off on the server needs no release.
 */
import { useEffect, useState } from "react";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { getConsumerFeatureFlags } from "../lib/consumerApi.js";

export const FLAGS_OFF = Object.freeze({ todayHome: false, socialPlans: false, planPush: false, feedComments: false });

export function parseFeatureFlags(body) {
  const f = (body && typeof body === "object" && body.flags) || {};
  return {
    todayHome: f.today_home === true,
    socialPlans: f.social_plans === true,
    planPush: f.plan_push === true,
    feedComments: f.feed_comments === true,
  };
}

let cache = null; // { userId, flags }
const listeners = new Set();

async function load(userId) {
  try {
    const flags = parseFeatureFlags(await getConsumerFeatureFlags());
    cache = { userId, flags };
    for (const l of listeners) l(cache);
  } catch {
    // Keep what we had (or all off): a failed read never turns a feature on.
  }
}

export default function useConsumerFeatureFlags() {
  const { consumer, isAuthenticated } = useConsumer();
  const userId = isAuthenticated && consumer?.id ? Number(consumer.id) : null;
  const [latest, setLatest] = useState(cache);

  useEffect(() => {
    listeners.add(setLatest);
    return () => {
      listeners.delete(setLatest);
    };
  }, []);

  useEffect(() => {
    if (!userId) return undefined;
    if (cache?.userId !== userId) void load(userId);
    function onVisible() {
      if (document.visibilityState === "visible") void load(userId);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [userId]);

  if (!userId) return FLAGS_OFF;
  if (latest?.userId === userId) return latest.flags;
  return cache?.userId === userId ? cache.flags : FLAGS_OFF;
}
