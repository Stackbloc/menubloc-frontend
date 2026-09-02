const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

export const OWNER_API_BASE = API;

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
const patch = (path, body) => req(path, { method: "PATCH", body: JSON.stringify(body) });
const del = (path) => req(path, { method: "DELETE" });

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
export const getOwnerGrowthDetails = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.metric) qs.set("metric", params.metric);
  if (params.interval) qs.set("interval", params.interval);
  if (params.plan_code) qs.set("plan_code", params.plan_code);
  if (params.limit != null) qs.set("limit", String(params.limit));
  const serialized = qs.toString();
  return get(`/api/owner/dashboard/growth/details${serialized ? `?${serialized}` : ""}`);
};
export const getOwnerDinerAccounts = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  const serialized = qs.toString();
  return get(`/api/owner/dashboard/diners${serialized ? `?${serialized}` : ""}`);
};
export const getOwnerDinerCapabilityStats = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.interval) qs.set("interval", params.interval);
  const serialized = qs.toString();
  return get(`/api/owner/dashboard/diners/stats${serialized ? `?${serialized}` : ""}`);
};
export const getOwnerDinerDetail = (id, params = {}) => {
  const qs = new URLSearchParams();
  if (params.interval) qs.set("interval", params.interval);
  const serialized = qs.toString();
  return get(
    `/api/owner/dashboard/diners/${encodeURIComponent(String(id))}${serialized ? `?${serialized}` : ""}`
  );
};
export const getOwnerTrafficAnalytics = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/analytics/traffic${qs ? `?${qs}` : ""}`);
};
export const getOwnerSearchAnalytics = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/analytics/searches${qs ? `?${qs}` : ""}`);
};

function intelligenceQueryString(params = {}) {
  const qs = new URLSearchParams();
  if (params.start_date) qs.set("start_date", params.start_date);
  if (params.end_date) qs.set("end_date", params.end_date);
  if (params.timezone) qs.set("timezone", params.timezone);
  const serialized = qs.toString();
  return serialized ? `?${serialized}` : "";
}

export const getOwnerIntelligenceOverview = (params = {}) =>
  get(`/api/owner/intelligence/overview${intelligenceQueryString(params)}`);
export const getOwnerIntelligenceSearchDemand = (params = {}) =>
  get(`/api/owner/intelligence/search-demand${intelligenceQueryString(params)}`);
export const getOwnerIntelligenceSiteActivity = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.start_date) qs.set("start_date", params.start_date);
  if (params.end_date) qs.set("end_date", params.end_date);
  if (params.timezone) qs.set("timezone", params.timezone);
  if (params.location_label) qs.set("location_label", params.location_label);
  const serialized = qs.toString();
  return get(`/api/owner/intelligence/site-activity${serialized ? `?${serialized}` : ""}`);
};
export const getOwnerIntelligenceSiteActivityCity = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.start_date) qs.set("start_date", params.start_date);
  if (params.end_date) qs.set("end_date", params.end_date);
  if (params.timezone) qs.set("timezone", params.timezone);
  if (params.location_label) qs.set("location_label", params.location_label);
  const serialized = qs.toString();
  return get(`/api/owner/intelligence/site-activity/city${serialized ? `?${serialized}` : ""}`);
};
export const getOwnerIntelligenceGeo = (params = {}) =>
  get(`/api/owner/intelligence/geo${intelligenceQueryString(params)}`);
export const getOwnerIntelligenceGeoState = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.start_date) qs.set("start_date", params.start_date);
  if (params.end_date) qs.set("end_date", params.end_date);
  if (params.timezone) qs.set("timezone", params.timezone);
  if (params.state) qs.set("state", params.state);
  const serialized = qs.toString();
  return get(`/api/owner/intelligence/geo/state${serialized ? `?${serialized}` : ""}`);
};
export const getOwnerIntelligenceMenu = (params = {}) =>
  get(`/api/owner/intelligence/menu${intelligenceQueryString(params)}`);
export const getOwnerIntelligenceRestaurant = (params = {}) =>
  get(`/api/owner/intelligence/restaurant${intelligenceQueryString(params)}`);
export const getOwnerIntelligenceMarket = (params = {}) =>
  get(`/api/owner/intelligence/market${intelligenceQueryString(params)}`);
export const getOwnerIntelligenceRevenue = (params = {}) =>
  get(`/api/owner/intelligence/revenue${intelligenceQueryString(params)}`);
export const getOwnerRestaurantSignups = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/restaurants/signups${qs ? `?${qs}` : ""}`);
};
export const searchOwnerRestaurants = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/restaurants/search${qs ? `?${qs}` : ""}`);
};
export const getOwnerRestaurantsSummary = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/restaurants/summary${qs ? `?${qs}` : ""}`);
};
export const getOwnerRestaurantMarkets = () => get("/api/owner/restaurants/markets");
export const getOwnerRestaurantCuisines = () => get("/api/owner/restaurants/cuisines");
export const getOwnerRestaurantDetail = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}`);
export const getOwnerRestaurantProfileStyle = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/profile-style`);
export const updateOwnerRestaurantProfileStyle = (restaurantId, profileStyleKey) =>
  patch(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/profile-style`, {
    profile_style_key: profileStyleKey,
  });

export const getOwnerRestaurantMenuAppearance = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/menu-appearance`);
export const updateOwnerRestaurantMenuAppearance = (restaurantId, menuAppearanceKey) =>
  patch(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/menu-appearance`, {
    menu_appearance_key: menuAppearanceKey,
  });

export const getOwnerRestaurantMenuWallpaper = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/menu-wallpaper`);
export const updateOwnerRestaurantMenuWallpaper = (restaurantId, menuWallpaperKey) =>
  patch(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/menu-wallpaper`, {
    menu_wallpaper_key: menuWallpaperKey,
  });
export const randomizeOwnerRestaurantMenuWallpaper = (restaurantId, body = {}) =>
  post(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/menu-wallpaper/randomize`, body);
export const keepOwnerRestaurantMenuWallpaper = (restaurantId, body = {}) =>
  post(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/menu-wallpaper/keep`, body);

export const getOwnerRestaurantFeaturedDish = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/featured-dish`);
export const getOwnerRestaurantFeaturedDishCandidates = (restaurantId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(
    `/api/owner/restaurants/${encodeURIComponent(restaurantId)}/featured-dish/candidates${qs ? `?${qs}` : ""}`
  );
};
export const updateOwnerRestaurantFeaturedDish = (restaurantId, menuItemId) =>
  patch(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/featured-dish`, {
    menu_item_id: menuItemId,
  });
export const getOwnerRestaurantFavoriteMenuItems = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/favorite-menu-items`);
export const updateOwnerRestaurantFavoriteMenuItems = (restaurantId, menuItemIds) =>
  patch(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/favorite-menu-items`, {
    menu_item_ids: menuItemIds,
  });
export const getOwnerRestaurantProfileUpdates = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/profile-updates`);
export const createOwnerRestaurantProfileUpdate = (restaurantId, body) =>
  post(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/profile-updates`, body);
export const updateOwnerRestaurantProfileUpdate = (restaurantId, updateId, body) =>
  patch(
    `/api/owner/restaurants/${encodeURIComponent(restaurantId)}/profile-updates/${encodeURIComponent(updateId)}`,
    body
  );
export const deleteOwnerRestaurantProfileUpdate = (restaurantId, updateId) =>
  del(
    `/api/owner/restaurants/${encodeURIComponent(restaurantId)}/profile-updates/${encodeURIComponent(updateId)}`
  );
export const getOwnerRestaurantComments = (restaurantId, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  ).toString();
  return get(
    `/api/owner/restaurants/${encodeURIComponent(restaurantId)}/comments${qs ? `?${qs}` : ""}`
  );
};
export const replyOwnerRestaurantComment = (restaurantId, commentId, content) =>
  post(
    `/api/owner/restaurants/${encodeURIComponent(restaurantId)}/comments/${encodeURIComponent(commentId)}/replies`,
    { content }
  );
export const featureOwnerRestaurantComment = (restaurantId, commentId) =>
  post(
    `/api/owner/restaurants/${encodeURIComponent(restaurantId)}/comments/${encodeURIComponent(commentId)}/feature`,
    {}
  );
export const unfeatureOwnerRestaurantComment = (restaurantId, commentId) =>
  del(
    `/api/owner/restaurants/${encodeURIComponent(restaurantId)}/comments/${encodeURIComponent(commentId)}/feature`
  );
export const getOwnerRestaurantStatusBanners = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/status-banners`);
export const updateOwnerRestaurantStatusBanners = (restaurantId, statusBanners) =>
  put(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/status-banners`, {
    status_banners: statusBanners,
  });
export const getOwnerRestaurantHours = (restaurantId) =>
  get(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/hours`);
export const updateOwnerRestaurantHours = (restaurantId, schedule) =>
  put(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/hours`, { schedule });
export const addOwnerRestaurantToCrm = (restaurantId) =>
  post(`/api/owner/restaurants/${encodeURIComponent(restaurantId)}/add-to-crm`, {});
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
export const submitOwnerMenuFilePdf = (restaurantId, file, opts = {}) => {
  const form = new FormData();
  form.append("file", file);
  form.append("restaurant_id", String(restaurantId));
  const menuId = Number(opts.menuId);
  if (Number.isFinite(menuId) && menuId > 0) {
    form.append("menu_id", String(menuId));
  }
  return postFormData("/menu-upload/pdf", form);
};
export const markOwnerMenuUploadReview = (uploadId) =>
  post(`/api/owner/menu-uploads/${uploadId}/mark-review`, {});
export const markOwnerMenuUploadReviewed = (uploadId) =>
  post(`/api/owner/menu-uploads/${uploadId}/mark-reviewed`, {});
export const retryOwnerMenuUpload = (uploadId, identity = {}) =>
  post(`/api/owner/menu-uploads/${uploadId}/retry`, identity);
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
export const getUploadItems = (uploadId) =>
  get(`/api/owner/menu-uploads/${uploadId}/items`);
export const updateUploadItem = (uploadId, itemId, body) =>
  req(`/api/owner/menu-uploads/${uploadId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(body) });
export const publishUpload = (uploadId) =>
  post(`/api/owner/menu-uploads/${uploadId}/publish`, {});

// ─── Menu Console ─────────────────────────────────────────────────────────────

export const searchMenuConsoleRestaurants = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/menu-console/restaurant-search${qs ? `?${qs}` : ""}`);
};
export const createMenuConsoleRestaurant = (body) =>
  post("/api/owner/menu-console/restaurants", body);
export const getMenuConsoleRestaurant = (restaurantId) =>
  get(`/api/owner/menu-console/restaurants/${encodeURIComponent(restaurantId)}`);
export const updateMenuConsoleRestaurant = (restaurantId, body) =>
  req(`/api/owner/menu-console/restaurants/${encodeURIComponent(restaurantId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const getMenuConsoleRestaurantActivity = (restaurantId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/menu-console/restaurants/${encodeURIComponent(restaurantId)}/activity${qs ? `?${qs}` : ""}`);
};
export const getMenuConsoleRestaurantDeleteImpact = (restaurantId) =>
  get(`/api/owner/menu-console/restaurants/${encodeURIComponent(restaurantId)}/delete-impact`);
export const deleteMenuConsoleRestaurant = (restaurantId, body) =>
  req(`/api/owner/menu-console/restaurants/${encodeURIComponent(restaurantId)}`, {
    method: "DELETE",
    body: JSON.stringify(body),
  });
export const getMenuConsoleProfileSchema = () =>
  get("/api/owner/menu-console/profile-schema");
export const getMenuConsoleRestaurantMenus = (restaurantId) =>
  get(`/api/owner/menu-console/restaurants/${restaurantId}/menus`);
export const getMenuConsoleMenu = (restaurantId, menuId) =>
  get(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}`);
export const createMenuConsoleMenu = (restaurantId, body) =>
  post(`/api/owner/menu-console/restaurants/${restaurantId}/menus`, body);
export const updateMenuConsoleMenu = (restaurantId, menuId, body) =>
  req(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const publishMenuConsoleMenu = (restaurantId, menuId) =>
  post(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/publish`, {});
export const unpublishMenuConsoleMenu = (restaurantId, menuId) =>
  post(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/unpublish`, {});
export const deleteMenuConsoleMenu = (restaurantId, menuId) =>
  req(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}`, { method: "DELETE" });
/** Hide all visible CK dishes; keep public.menus shell for Update OCR from scratch. */
export const clearMenuConsoleMenuItems = (restaurantId, menuId) =>
  post(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/clear-items`, {});
export const addMenuConsoleItem = (restaurantId, menuId, body) =>
  post(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/items`, body);
export const updateMenuConsoleItem = (restaurantId, menuId, itemId, body) =>
  req(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const putMenuConsoleItemModifierGroups = (restaurantId, menuId, itemId, modifier_groups) =>
  req(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/items/${itemId}/modifier-groups`, {
    method: "PUT",
    body: JSON.stringify({ modifier_groups }),
  });
export const getMenuConsoleItemModifierGroups = (restaurantId, menuId, itemId) =>
  get(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/items/${itemId}/modifier-groups`);
export const deleteMenuConsoleItem = (restaurantId, menuId, itemId) =>
  req(`/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/items/${itemId}`, {
    method: "DELETE",
  });

/** List dish photos for a CK menu item (Menu Manager). */
export const listMenuConsoleItemPhotos = (restaurantId, menuId, itemId) =>
  get(
    `/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/items/${itemId}/photos`
  );

/** Upload dish photo (multipart field `photo`); processed to 4:3 cover WebP. */
export const uploadMenuConsoleItemPhoto = (
  restaurantId,
  menuId,
  itemId,
  file,
  { isPrimary = true } = {}
) => {
  const formData = new FormData();
  formData.append("photo", file);
  if (isPrimary) formData.append("is_primary", "true");
  return postFormData(
    `/api/owner/menu-console/restaurants/${restaurantId}/menus/${menuId}/items/${itemId}/photo`,
    formData
  );
};

/** Soft-delete a dish photo by photo row id. */
export const deleteMenuConsoleItemPhoto = (photoId) =>
  del(`/api/owner/menu-console/menu-item-photos/${photoId}`);

export const searchMenuConsoleItems = (restaurantId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/menu-console/restaurants/${restaurantId}/items/search${qs ? `?${qs}` : ""}`);
};
export const bulkMenuConsoleItems = (restaurantId, body) =>
  post(`/api/owner/menu-console/restaurants/${restaurantId}/items/bulk`, body);

// ─── Profile billboards (entrance splash + Windows panel) ─────────────────────

const menuConsoleRestaurantPath = (restaurantId) =>
  `/api/owner/menu-console/restaurants/${encodeURIComponent(restaurantId)}`;

export const listOwnerRestaurantBillboards = (restaurantId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`${menuConsoleRestaurantPath(restaurantId)}/billboards${qs ? `?${qs}` : ""}`);
};
export const createOwnerRestaurantBillboard = (restaurantId, body) =>
  post(`${menuConsoleRestaurantPath(restaurantId)}/billboards`, body);
export const updateOwnerRestaurantBillboard = (restaurantId, postId, body) =>
  put(`${menuConsoleRestaurantPath(restaurantId)}/billboards/${encodeURIComponent(postId)}`, body);
export const pauseOwnerRestaurantBillboard = (restaurantId, postId) =>
  del(`${menuConsoleRestaurantPath(restaurantId)}/billboards/${encodeURIComponent(postId)}`);
export const uploadOwnerRestaurantBillboardPhoto = (restaurantId, file, { postId = null } = {}) => {
  const formData = new FormData();
  formData.append("photo", file);
  const path = postId
    ? `${menuConsoleRestaurantPath(restaurantId)}/billboards/${encodeURIComponent(postId)}/photo`
    : `${menuConsoleRestaurantPath(restaurantId)}/billboards/photo`;
  return postFormData(path, formData);
};

export const listOwnerRestaurantWindows = (restaurantId) =>
  get(`${menuConsoleRestaurantPath(restaurantId)}/windows`);
export const createOwnerRestaurantWindow = (restaurantId, body) =>
  post(`${menuConsoleRestaurantPath(restaurantId)}/windows`, body);
export const updateOwnerRestaurantWindow = (restaurantId, postId, body) =>
  put(`${menuConsoleRestaurantPath(restaurantId)}/windows/${encodeURIComponent(postId)}`, body);
export const pauseOwnerRestaurantWindow = (restaurantId, postId) =>
  del(`${menuConsoleRestaurantPath(restaurantId)}/windows/${encodeURIComponent(postId)}`);
export const uploadOwnerRestaurantWindowPhoto = (restaurantId, file, { postId = null } = {}) => {
  const formData = new FormData();
  formData.append("photo", file);
  const path = postId
    ? `${menuConsoleRestaurantPath(restaurantId)}/windows/${encodeURIComponent(postId)}/photo`
    : `${menuConsoleRestaurantPath(restaurantId)}/windows/photo`;
  return postFormData(path, formData);
};

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

// Feed invite QR (platform growth poster — editable copy)
export const getOwnerFeedInviteQr = () => get("/api/owner/feed-invite-qr");
export const saveOwnerFeedInviteQrCopy = (copy) =>
  put("/api/owner/feed-invite-qr", { copy });
export const resetOwnerFeedInviteQrCopy = () =>
  put("/api/owner/feed-invite-qr", { reset: true });
export const ownerFeedInviteQrImageUrl = (cacheBust) => {
  const base = `${API}/api/owner/feed-invite-qr/image.png`;
  if (cacheBust == null || cacheBust === "") return base;
  return `${base}?v=${encodeURIComponent(String(cacheBust))}`;
};
export const ownerFeedInviteQrCodeUrl = () =>
  `${API}/api/owner/feed-invite-qr/qr.png`;

// PHMS Dashboard
export const getOwnerPhmsHealth = () => get("/api/owner/phms/health");
export const getOwnerPhmsHomeFeedCache = () => get("/api/owner/phms/home-feed-cache");
export const refreshOwnerPhmsHomeFeedCache = () => post("/api/owner/phms/home-feed-cache/refresh", {});
export const getOwnerPhmsMenuStatus = () => get("/api/owner/phms/menu-status");
export const getOwnerPhmsDisplayAudit = () => get("/api/owner/phms/display-audit");
export const getOwnerPhmsDeploymentHealth = () => get("/api/owner/phms/deployment-health");
export const captureOwnerPhmsDisplaySnapshot = (body) =>
  post("/api/owner/phms/display-audit/capture", body);
export const getOwnerPhmsRepairTickets = () => get("/api/owner/phms/repair-tickets");
export const getOwnerPhmsRepairTicket = (checkId) =>
  get(`/api/owner/phms/repair-tickets/${encodeURIComponent(checkId)}`);
export const acknowledgeOwnerPhmsRepairTicket = (checkId) =>
  post(`/api/owner/phms/repair-tickets/${encodeURIComponent(checkId)}/acknowledge`, {});

export const getOwnerPhmsIncidents = (query = "") =>
  get(`/api/owner/phms/incidents${query ? `?${query}` : ""}`);
export const getOwnerPhmsIncident = (incidentId) =>
  get(`/api/owner/phms/incidents/${encodeURIComponent(incidentId)}`);
export const assignOwnerPhmsIncident = (incidentId, body) =>
  post(`/api/owner/phms/incidents/${encodeURIComponent(incidentId)}/assign`, body);
export const setOwnerPhmsIncidentStatus = (incidentId, status, message) =>
  post(`/api/owner/phms/incidents/${encodeURIComponent(incidentId)}/status`, { status, message });
export const verifyOwnerPhmsIncident = (incidentId, body = {}) =>
  post(`/api/owner/phms/incidents/${encodeURIComponent(incidentId)}/verify`, body);
export const closeOwnerPhmsIncident = (incidentId) =>
  post(`/api/owner/phms/incidents/${encodeURIComponent(incidentId)}/close`, {});
export const setOwnerPhmsDeploymentBlocker = (incidentId, deploymentBlocker) =>
  post(`/api/owner/phms/incidents/${encodeURIComponent(incidentId)}/deployment-blocker`, { deploymentBlocker });

// Homepage membership + section controls (MDS-DI-01B) — platform owner only
export const getOwnerHomepageSections = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/homepage/sections${qs ? `?${qs}` : ""}`);
};
export const patchOwnerHomepageSection = (sectionId, body) =>
  patch(`/api/owner/homepage/sections/${encodeURIComponent(sectionId)}`, body);
export const getOwnerHomepageMemberships = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/homepage/memberships${qs ? `?${qs}` : ""}`);
};
export const addOwnerHomepageMembership = (body) =>
  post("/api/owner/homepage/memberships", body);
export const patchOwnerHomepageMembership = (membershipId, body) =>
  patch(`/api/owner/homepage/memberships/${encodeURIComponent(membershipId)}`, body);
export const disableOwnerHomepageMembership = (membershipId) =>
  del(`/api/owner/homepage/memberships/${encodeURIComponent(membershipId)}`);
export const searchOwnerHomepageRestaurants = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/homepage/restaurants/search${qs ? `?${qs}` : ""}`);
};

// Subscription Designer
export const listSdPlans = () => get("/api/owner/subscription-designer/plans");
export const getSdPlan = (id) =>
  get(`/api/owner/subscription-designer/plans/${encodeURIComponent(id)}`);
export const createSdPlan = (body) => post("/api/owner/subscription-designer/plans", body);
export const updateSdPlan = (id, body) =>
  put(`/api/owner/subscription-designer/plans/${encodeURIComponent(id)}`, body);
export const duplicateSdPlan = (id) =>
  post(`/api/owner/subscription-designer/plans/${encodeURIComponent(id)}/duplicate`, {});
export const activateSdPlan = (id) =>
  post(`/api/owner/subscription-designer/plans/${encodeURIComponent(id)}/activate`, {});
export const deactivateSdPlan = (id) =>
  post(`/api/owner/subscription-designer/plans/${encodeURIComponent(id)}/deactivate`, {});
export const archiveSdPlan = (id) =>
  post(`/api/owner/subscription-designer/plans/${encodeURIComponent(id)}/archive`, {});
export const reorderSdPlans = (ordered_ids) =>
  post("/api/owner/subscription-designer/plans/reorder", { ordered_ids });
export const listSdFeatures = () => get("/api/owner/subscription-designer/features");
export const createSdFeature = (body) => post("/api/owner/subscription-designer/features", body);
export const updateSdFeature = (id, body) =>
  put(`/api/owner/subscription-designer/features/${encodeURIComponent(id)}`, body);
export const reorderSdFeatures = (ordered_ids) =>
  post("/api/owner/subscription-designer/features/reorder", { ordered_ids });
export const getSdChartPreview = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/subscription-designer/chart-preview${qs ? `?${qs}` : ""}`);
};
export const getSdChangeLog = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/subscription-designer/change-log${qs ? `?${qs}` : ""}`);
};

// Deployment Operations
export const getDeploymentOperationsSummary = () => get("/api/owner/deployment-operations/summary");
export const runDeploymentSmoke = () => post("/api/owner/deployment-operations/smoke", {});
export const runDeploymentWatchdog = () => post("/api/owner/deployment-operations/watchdog", {});
export const freezeDeployments = (reason) => post("/api/owner/deployment-operations/freeze", { reason });
export const resumeDeployments = (reason) => post("/api/owner/deployment-operations/resume", { reason });

// ─── Platform video catalog (all Feed video sources) ─────────────────────────

export const listOwnerVideos = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.kind) qs.set("kind", params.kind);
  if (params.untagged_only) qs.set("untagged_only", "1");
  if (params.q) qs.set("q", params.q);
  if (params.date) qs.set("date", params.date);
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);
  if (params.cursor) qs.set("cursor", params.cursor);
  if (params.limit != null) qs.set("limit", String(params.limit));
  const serialized = qs.toString();
  return get(`/api/owner/videos${serialized ? `?${serialized}` : ""}`);
};

export const getOwnerVideo = (kind, sourceId) =>
  get(`/api/owner/videos/${encodeURIComponent(kind)}/${encodeURIComponent(String(sourceId))}`);

export const lookupOwnerVideo = ({ videoId, assetNumber } = {}) => {
  const qs = new URLSearchParams();
  if (videoId) qs.set("video_id", videoId);
  if (assetNumber != null) qs.set("asset_number", String(assetNumber));
  return get(`/api/owner/videos/lookup?${qs.toString()}`);
};

export const patchOwnerVideoMetadata = (kind, sourceId, body) =>
  patch(`/api/owner/videos/${encodeURIComponent(kind)}/${encodeURIComponent(String(sourceId))}`, body);

