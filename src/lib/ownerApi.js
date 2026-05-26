const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.payload = json;
    throw error;
  }

  return json;
}

const get = (path) => req(path);
const post = (path, body) => req(path, { method: "POST", body: JSON.stringify(body) });
const put = (path, body) => req(path, { method: "PUT", body: JSON.stringify(body) });

export const getOwnerSession = () => get("/api/owner/auth/me");
export const loginOwner = (email, password) => post("/api/owner/auth/login", { email, password });
export const verifyOwner2FA = (code) => post("/api/owner/auth/verify-2fa", { code });
export const logoutOwner = () => post("/api/owner/auth/logout", {});

export const getOwnerDashboardSummary = () => get("/api/owner/dashboard/summary");
export const getOwnerTrafficAnalytics = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/analytics/traffic${qs ? `?${qs}` : ""}`);
};
export const getOwnerSearchAnalytics = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/analytics/searches${qs ? `?${qs}` : ""}`);
};
export const getOwnerRestaurantSignups = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/restaurants/signups${qs ? `?${qs}` : ""}`);
};
export const getOwnerRevenueSummary = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/revenue/summary${qs ? `?${qs}` : ""}`);
};
export const getOwnerRevenueBySource = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/revenue/by-source${qs ? `?${qs}` : ""}`);
};
export const getOwnerAdmins = () => get("/api/owner/support/admins");
export const getOwnerSupportTickets = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/support/tickets${qs ? `?${qs}` : ""}`);
};
export const getOwnerSupportTicket = (ticketId) => get(`/api/owner/support/tickets/${ticketId}`);
export const replyOwnerSupportTicket = (ticketId, message) =>
  post(`/api/owner/support/tickets/${ticketId}/reply`, { message });
export const addOwnerSupportInternalNote = (ticketId, message) =>
  post(`/api/owner/support/tickets/${ticketId}/internal-note`, { message });
export const updateOwnerSupportTicketStatus = (ticketId, status) =>
  put(`/api/owner/support/tickets/${ticketId}/status`, { status });
export const updateOwnerSupportTicketAssignment = (ticketId, assigned_to_user_id) =>
  put(`/api/owner/support/tickets/${ticketId}/assign`, { assigned_to_user_id });
export const updateOwnerSupportTicketPriority = (ticketId, priority) =>
  put(`/api/owner/support/tickets/${ticketId}/priority`, { priority });

export const getOwnerMenuUploads = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/menu-uploads${qs ? `?${qs}` : ""}`);
};
export const getOwnerMenuUpload = (id) => get(`/api/owner/menu-uploads/${id}`);
export const markOwnerMenuUploadReview = (id) => post(`/api/owner/menu-uploads/${id}/mark-review`, {});
export const markOwnerMenuUploadReviewed = (id) => post(`/api/owner/menu-uploads/${id}/mark-reviewed`, {});
export const retryOwnerMenuUpload = (id) => post(`/api/owner/menu-uploads/${id}/retry`, {});
export const archiveOwnerMenuUpload = (id) => post(`/api/owner/menu-uploads/${id}/archive`, {});
