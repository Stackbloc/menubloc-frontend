/**
 * src/lib/operatorApi.js
 *
 * All operator backend API calls.
 * Every request uses credentials:'include' to send the session cookie.
 */

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

const get  = (path)         => req(path);
const post = (path, body)   => req(path, { method: "POST",  body: JSON.stringify(body) });
const patch = (path, body)  => req(path, { method: "PATCH", body: JSON.stringify(body) });
const del  = (path)         => req(path, { method: "DELETE" });
const put  = (path, body)   => req(path, { method: "PUT",   body: JSON.stringify(body) });

// ── Subscription ──────────────────────────────────────────────────────────
export const getSubscription    = ()                   => get("/operator/subscription");
export const getPlans           = ()                   => get("/operator/subscription/plans");

// ── Restaurant: Profile ───────────────────────────────────────────────────
export const getProfile     = (rid)         => get(`/operator/restaurants/${rid}/profile`);
export const updateProfile  = (rid, body)   => patch(`/operator/restaurants/${rid}/profile`, body);
export const publishProfile = (rid)         => post(`/operator/restaurants/${rid}/profile/publish`, {});
export const setFeaturedDish = (rid, menu_item_id) =>
  patch(`/operator/restaurants/${rid}/profile/featured-dish`, { menu_item_id });

// ── Restaurant: Menus ─────────────────────────────────────────────────────
export const getMenus     = (rid)           => get(`/operator/restaurants/${rid}/menus`);
export const createMenu   = (rid, body)     => post(`/operator/restaurants/${rid}/menus`, body);
export const getMenu      = (rid, mid)      => get(`/operator/restaurants/${rid}/menus/${mid}`);
export const updateMenu   = (rid, mid, b)   => patch(`/operator/restaurants/${rid}/menus/${mid}`, b);
export const publishMenu  = (rid, mid)      => post(`/operator/restaurants/${rid}/menus/${mid}/publish`, {});
export const archiveMenu  = (rid, mid)      => post(`/operator/restaurants/${rid}/menus/${mid}/archive`, {});
export const deleteMenu   = (rid, mid)      => del(`/operator/restaurants/${rid}/menus/${mid}`);

// ── Restaurant: Menu Items ────────────────────────────────────────────────
export const getMenuItems     = (rid, mid)       => get(`/operator/restaurants/${rid}/menus/${mid}/items`);
export const createMenuItem   = (rid, mid, body) => post(`/operator/restaurants/${rid}/menus/${mid}/items`, body);
export const getMenuItem      = (rid, iid)       => get(`/operator/restaurants/${rid}/menu-items/${iid}`);
export const updateMenuItem   = (rid, iid, body) => patch(`/operator/restaurants/${rid}/menu-items/${iid}`, body);
export const publishMenuItem  = (rid, iid)       => post(`/operator/restaurants/${rid}/menu-items/${iid}/publish`, {});
export const deleteMenuItem   = (rid, iid)       => del(`/operator/restaurants/${rid}/menu-items/${iid}`);
export const getPriceHistory  = (rid, iid)       => get(`/operator/restaurants/${rid}/menu-items/${iid}/price-history`);

// ── Restaurant: Deals ─────────────────────────────────────────────────────
export const getDeals     = (rid, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/operator/restaurants/${rid}/deals${qs ? `?${qs}` : ""}`);
};
export const createDeal   = (rid, body)     => post(`/operator/restaurants/${rid}/deals`, body);
export const getDeal      = (rid, did)      => get(`/operator/restaurants/${rid}/deals/${did}`);
export const updateDeal   = (rid, did, b)   => patch(`/operator/restaurants/${rid}/deals/${did}`, b);
export const publishDeal  = (rid, did)      => post(`/operator/restaurants/${rid}/deals/${did}/publish`, {});
export const pauseDeal    = (rid, did)      => post(`/operator/restaurants/${rid}/deals/${did}/pause`, {});
export const deleteDeal   = (rid, did)      => del(`/operator/restaurants/${rid}/deals/${did}`);

// ── Restaurant: Hours ─────────────────────────────────────────────────────
export const getHours          = (rid)            => get(`/operator/restaurants/${rid}/hours`);
export const updateHours       = (rid, schedule)  => put(`/operator/restaurants/${rid}/hours`, { schedule });
export const getExceptions     = (rid)            => get(`/operator/restaurants/${rid}/hours/exceptions`);
export const upsertException   = (rid, body)      => post(`/operator/restaurants/${rid}/hours/exceptions`, body);
export const deleteException   = (rid, eid)       => del(`/operator/restaurants/${rid}/hours/exceptions/${eid}`);

// ── Support ───────────────────────────────────────────────────────────────
export const getTickets        = ()               => get("/operator/support/tickets");
export const createTicket      = (body)           => post("/operator/support/tickets", body);
export const replyTicket       = (tid, message)   => post(`/operator/support/tickets/${tid}/messages`, { message });
