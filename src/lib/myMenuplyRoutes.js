/** Canonical My Menuply profile hub (Feed shell Profile tab — no live-feed TV). */
export const MY_MENUPLY_PROFILE_PATH = "/feed/profile";

/** Sub-routes that remain under /my-menuply for deep links and month views. */
export const MY_MENUPLY_MONTH_IN_FOOD_PATH = "/my-menuply/month-in-food";
export const MY_MENUPLY_CONNECTIONS_PLANNING_PATH = "/my-menuply/connections-planning";

export function myMenuplyProfileHref({ compose, media } = {}) {
  const params = new URLSearchParams();
  if (compose) params.set("compose", compose);
  if (media) params.set("media", media);
  const q = params.toString();
  return q ? `${MY_MENUPLY_PROFILE_PATH}?${q}` : MY_MENUPLY_PROFILE_PATH;
}
