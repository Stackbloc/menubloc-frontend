/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { fetchClustersDirectory } from "../../lib/clusterApi.js";
import { useMarketClusters } from "../useMarketClusters.js";

vi.mock("../../lib/clusterApi.js", () => ({ fetchClustersDirectory: vi.fn() }));

const LA_CLUSTER = { id: 1, name: "L.A. Live", slug: "la-live", city: "Los Angeles", state: "CA" };

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useMarketClusters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchClustersDirectory.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries after a failed fetch so a server blip does not hide clusters", async () => {
    fetchClustersDirectory
      .mockRejectedValueOnce(new Error("Failed to connect to database"))
      .mockResolvedValueOnce({ ok: true, clusters: [LA_CLUSTER] });

    const { result } = renderHook(() => useMarketClusters("Los Angeles, CA"));
    await flush();
    expect(result.current.clusters).toEqual([]);
    expect(fetchClustersDirectory).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    await flush();
    expect(fetchClustersDirectory).toHaveBeenCalledTimes(2);
    expect(result.current.clusters.map((c) => c.slug)).toEqual(["la-live"]);
  });

  it("stops after the last retry", async () => {
    fetchClustersDirectory.mockRejectedValue(new Error("down"));

    const { result } = renderHook(() => useMarketClusters("Los Angeles, CA"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });
    expect(fetchClustersDirectory).toHaveBeenCalledTimes(4);
    expect(result.current.clusters).toEqual([]);
  });

  it("cancels a pending retry on unmount", async () => {
    fetchClustersDirectory.mockRejectedValue(new Error("down"));

    const { unmount } = renderHook(() => useMarketClusters("Los Angeles, CA"));
    await flush();
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });
    expect(fetchClustersDirectory).toHaveBeenCalledTimes(1);
  });
});
