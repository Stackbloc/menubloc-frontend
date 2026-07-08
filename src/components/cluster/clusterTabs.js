export const CLUSTER_TABS = [
  { id: "overview", label: "Overview", enabled: true, lazy: false },
  { id: "menu-explorer", label: "Menu Explorer", enabled: true, lazy: true },
  { id: "restaurants", label: "Restaurants", enabled: true, lazy: true },
  { id: "search", label: "Search Menus", enabled: true, lazy: true },
  { id: "compare", label: "Compare", enabled: false, lazy: true, comingSoon: true },
  { id: "deals", label: "Deals", enabled: false, lazy: true, comingSoon: true },
  { id: "map", label: "Map", enabled: false, lazy: true, comingSoon: true },
];

export const DEFAULT_CLUSTER_TAB = "overview";

export function isClusterTabEnabled(tabId) {
  const tab = CLUSTER_TABS.find((entry) => entry.id === tabId);
  return Boolean(tab?.enabled);
}
