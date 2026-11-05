import { createContext, useContext } from "react";

export const WallContext = createContext(null);

/** Cluster Wall data + actions from ClusterWallProvider (null outside it). */
export function useClusterWallContext() {
  return useContext(WallContext);
}
