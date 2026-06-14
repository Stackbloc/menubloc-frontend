const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

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

async function postFormData(path, formData) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    method: "POST",
    body: formData,
    // No Content-Type header — browser sets multipart/form-data with boundary automatically
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
export const getOwnerAdmins = () => get("/api/owner/admins");
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
export const getOwnerMenuUpload = (uploadId) => get(`/api/owner/menu-uploads/${uploadId}`);
export const searchOwnerRestaurantsForUpload = (q) =>
  get(`/api/owner/menu-uploads/restaurant-search?q=${encodeURIComponent(q)}`);
export const submitOwnerMenuTextIngest = (restaurantId, menuText) =>
  post(`/api/owner/menu-uploads/text-ingest`, { restaurant_id: restaurantId, menu_text: menuText });
export const submitOwnerMenuFilePdf = (restaurantId, file) => {
  const form = new FormData();
  form.append("file", file);
  form.append("restaurant_id", String(restaurantId));
  return postFormData("/menu-upload/pdf", form);
};
export const markOwnerMenuUploadReview = (uploadId) =>
  post(`/api/owner/menu-uploads/${uploadId}/mark-review`, {});
export const markOwnerMenuUploadReviewed = (uploadId) =>
  post(`/api/owner/menu-uploads/${uploadId}/mark-reviewed`, {});
export const retryOwnerMenuUpload = (uploadId) =>
  post(`/api/owner/menu-uploads/${uploadId}/retry`, {});
export const archiveOwnerMenuUpload = (uploadId) =>
  post(`/api/owner/menu-uploads/${uploadId}/archive`, {});

export const getUploadReviewItems = (uploadId) =>
  get(`/api/owner/menu-uploads/${uploadId}/review-items`);
export const approveReviewItem = (uploadId, itemId, edits = {}) =>
  post(`/api/owner/menu-uploads/${uploadId}/review-items/${itemId}/approve`, edits);
export const rejectReviewItem = (uploadId, itemId) =>
  post(`/api/owner/menu-uploads/${uploadId}/review-items/${itemId}/reject`, {});
export const bulkReviewItems = (uploadId, data) =>
  post(`/api/owner/menu-uploads/${uploadId}/review-items/bulk`, data);

export const getOwnerMarketExpansion = () => get("/api/owner/market-expansion/summary");
export const getOwnerMarketExpansionByZip = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/market-expansion/by-zip${qs ? `?${qs}` : ""}`);
};

export const getOwnerQrStickers = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/qr-stickers${qs ? `?${qs}` : ""}`);
};
export const getOwnerQrStickersForRestaurant = (restaurantId) =>
  get(`/api/owner/qr-stickers/${restaurantId}`);
export const validateOwnerQrStickerActivation = (restaurantId, body) =>
  post(`/api/owner/qr-stickers/${restaurantId}/activate/validate`, body);
export const activateOwnerQrSticker = (restaurantId, body) =>
  post(`/api/owner/qr-stickers/${restaurantId}/activate`, body);
export const generateOwnerQrStickerBatch = (body) =>
  post(`/api/owner/qr-stickers/generate-batch`, body);
export const previewOwnerInventoryQrStickerUrl = (qrCode) =>
  `${API}/api/owner/qr-stickers/inventory/${encodeURIComponent(qrCode)}/preview`;
export const previewOwnerQrStickerUrl = (restaurantId, qrCode) =>
  `${API}/api/owner/qr-stickers/${restaurantId}/${encodeURIComponent(qrCode)}/preview`;
export const downloadOwnerQrStickerUrl = (restaurantId, qrCode) =>
  `${API}/api/owner/qr-stickers/${restaurantId}/${encodeURIComponent(qrCode)}/download`;
export const downloadOwnerQrStickerPngUrl = (restaurantId, qrCode) =>
  `${API}/api/owner/qr-stickers/${restaurantId}/${encodeURIComponent(qrCode)}/download-png`;
export const deactivateOwnerQrSticker = (restaurantId, qrCode) =>
  post(`/api/owner/qr-stickers/${restaurantId}/${encodeURIComponent(qrCode)}/deactivate`, {});
export const replaceOwnerQrSticker = (restaurantId, qrCode) =>
  post(`/api/owner/qr-stickers/${restaurantId}/${encodeURIComponent(qrCode)}/replace`, {});

export const searchOwnerRestaurantsForQr = (q) =>
  get(`/api/owner/qr-stickers/restaurant-search?q=${encodeURIComponent(q)}`);

