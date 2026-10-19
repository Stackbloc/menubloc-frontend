import { useEffect, useMemo, useState } from "react";
import { fetchClustersDirectory } from "../lib/clusterApi.js";
import { clusterInMarket, marketFromLocationLabel, sortClustersForNav } from "../lib/clusterNavigation.js";

// Waits before each retry after a failed fetch. A brief server or database blip
// (2026-10-18: ~20 s pooler timeouts) otherwise hid the Explore clusters pill until reload.
const RETRY_DELAYS_MS = [2000, 5000, 15000];

/**
 * Public clusters for the active location label ("City, ST"), in fixed system order.
 * Returns [] for labels without a city + state (e.g. ZIP only), and while a failed
 * fetch is being retried (or after retries run out).
 */
export function useMarketClusters(locationLabel) {
  const market = useMemo(() => marketFromLocationLabel(locationLabel), [locationLabel]);
  const marketKey = market ? `${market.stateSlug}/${market.citySlug}` : "";
  const [result, setResult] = useState({ key: "", clusters: [] });

  useEffect(() => {
    if (!market) return undefined;
    const controller = new AbortController();
    let retryTimer = null;

    function load(attempt) {
      fetchClustersDirectory({
        state: market.stateSlug,
        city: market.citySlug,
        limit: 100,
        signal: controller.signal,
      })
        .then((json) => {
          if (!Array.isArray(json?.clusters)) throw new Error("clusters directory: unexpected response");
          const inCity = json.clusters.filter((cluster) => clusterInMarket(cluster, market));
          setResult({ key: marketKey, clusters: sortClustersForNav(inCity) });
        })
        .catch((err) => {
          if (err?.name === "AbortError" || controller.signal.aborted) return;
          setResult({ key: marketKey, clusters: [] });
          if (attempt < RETRY_DELAYS_MS.length) {
            retryTimer = setTimeout(() => load(attempt + 1), RETRY_DELAYS_MS[attempt]);
          }
        });
    }

    load(0);
    return () => {
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
    // marketKey captures market identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketKey]);

  const clusters = useMemo(
    () => (market && result.key === marketKey ? result.clusters : []),
    [market, marketKey, result]
  );

  return { market, clusters };
}
