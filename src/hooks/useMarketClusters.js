import { useEffect, useMemo, useState } from "react";
import { fetchClustersDirectory } from "../lib/clusterApi.js";
import { clusterInMarket, marketFromLocationLabel, sortClustersForNav } from "../lib/clusterNavigation.js";

/**
 * Public clusters for the active location label ("City, ST"), in fixed system order.
 * Returns [] for labels without a city + state (e.g. ZIP only) or on fetch failure.
 */
export function useMarketClusters(locationLabel) {
  const market = useMemo(() => marketFromLocationLabel(locationLabel), [locationLabel]);
  const marketKey = market ? `${market.stateSlug}/${market.citySlug}` : "";
  const [result, setResult] = useState({ key: "", clusters: [] });

  useEffect(() => {
    if (!market) return undefined;
    const controller = new AbortController();
    fetchClustersDirectory({
      state: market.stateSlug,
      city: market.citySlug,
      limit: 100,
      signal: controller.signal,
    })
      .then((json) => {
        const list = Array.isArray(json?.clusters) ? json.clusters : [];
        const inCity = list.filter((cluster) => clusterInMarket(cluster, market));
        setResult({ key: marketKey, clusters: sortClustersForNav(inCity) });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResult({ key: marketKey, clusters: [] });
      });
    return () => controller.abort();
    // marketKey captures market identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketKey]);

  const clusters = useMemo(
    () => (market && result.key === marketKey ? result.clusters : []),
    [market, marketKey, result]
  );

  return { market, clusters };
}
