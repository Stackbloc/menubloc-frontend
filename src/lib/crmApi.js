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

export const getCrmSession = () => get("/api/crm/auth/me");
export const loginCrm = (email, password) => post("/api/crm/auth/login", { email, password });
export const logoutCrm = () => post("/api/crm/auth/logout", {});

export const getCrmDashboard = () => get("/api/crm/dashboard");
export const getCrmSeedMarkets = () => get("/api/crm/seed-explorer/markets");
export const getCrmSeedRestaurants = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/crm/seed-explorer/restaurants${qs ? `?${qs}` : ""}`);
};
export const addCrmSeedRestaurantLead = (restaurantId) =>
  post(`/api/crm/seed-explorer/restaurants/${encodeURIComponent(restaurantId)}/add-lead`, {});
export const getCrmLeads = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/crm/leads${qs ? `?${qs}` : ""}`);
};
export const searchCrmRestaurants = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/crm/restaurants/search${qs ? `?${qs}` : ""}`);
};
export const getCrmGeoCities = (state) => {
  const qs = new URLSearchParams({ state: String(state || "") }).toString();
  return get(`/api/crm/geo/cities?${qs}`);
};
export const getCrmBdContacts = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/crm/business-development/contacts${qs ? `?${qs}` : ""}`);
};
export const getCrmBdContact = (contactId) => get(`/api/crm/business-development/contacts/${contactId}`);
export const createCrmBdContact = (body) => post("/api/crm/business-development/contacts", body);
export const importCrmBdContacts = (contacts) => post("/api/crm/business-development/contacts/import", { contacts });
export const updateCrmBdContact = (contactId, body) => put(`/api/crm/business-development/contacts/${contactId}`, body);
export const deleteCrmBdContact = (contactId) => req(`/api/crm/business-development/contacts/${contactId}`, { method: "DELETE" });
export const linkCrmBdContactLead = (contactId, body) => post(`/api/crm/business-development/contacts/${contactId}/leads`, body);
export const unlinkCrmBdContactLead = (contactId, leadId) =>
  req(`/api/crm/business-development/contacts/${contactId}/leads/${leadId}`, { method: "DELETE" });

/** @deprecated Use getCrmBdContacts */
export const getCrmReferralProspects = getCrmBdContacts;
/** @deprecated Use getCrmBdContact */
export const getCrmReferralProspect = getCrmBdContact;
/** @deprecated Use createCrmBdContact */
export const createCrmReferralProspect = createCrmBdContact;
/** @deprecated Use importCrmBdContacts */
export const importCrmReferralProspects = importCrmBdContacts;
/** @deprecated Use updateCrmBdContact */
export const updateCrmReferralProspect = updateCrmBdContact;
/** @deprecated Use deleteCrmBdContact */
export const deleteCrmReferralProspect = deleteCrmBdContact;
/** @deprecated Use linkCrmBdContactLead */
export const linkCrmReferralProspectLead = linkCrmBdContactLead;
/** @deprecated Use unlinkCrmBdContactLead */
export const unlinkCrmReferralProspectLead = unlinkCrmBdContactLead;
export const getCrmLead = (leadId) => get(`/api/crm/leads/${leadId}`);
export const createCrmLead = (body) => post("/api/crm/leads", body);
export const updateCrmLead = (leadId, body) => put(`/api/crm/leads/${leadId}`, body);
export const updateCrmLeadStage = (leadId, body) => post(`/api/crm/leads/${leadId}/stage`, body);
export const updateCrmLeadStatus = (leadId, body) => post(`/api/crm/leads/${leadId}/status`, body);
export const linkCrmLeadRestaurant = (leadId, restaurant_id) => post(`/api/crm/leads/${leadId}/link-restaurant`, { restaurant_id });
export const createCrmLeadActivity = (leadId, body) => post(`/api/crm/leads/${leadId}/activities`, body);
export const createCrmLeadTask = (leadId, body) => post(`/api/crm/leads/${leadId}/tasks`, body);
export const getCrmTasks = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/crm/tasks${qs ? `?${qs}` : ""}`);
};
export const updateCrmTask = (taskId, body) => put(`/api/crm/tasks/${taskId}`, body);
export const completeCrmTask = (taskId) => post(`/api/crm/tasks/${taskId}/complete`, {});
export const getCrmPipelineReport = () => get("/api/crm/reports/pipeline");
export const getCrmSourcesReport = () => get("/api/crm/reports/sources");
export const getCrmConversionsReport = () => get("/api/crm/reports/conversions");
export const getCrmFollowupsReport = () => get("/api/crm/reports/followups");
export const getCrmOrders = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/orders/admin${qs ? `?${qs}` : ""}`);
};
export const getCrmOrderDetail = (orderId) => get(`/api/orders/${orderId}/detail`);

export const getCrmSubscriptions = () => get("/api/crm/subscriptions");
export const getCrmBilling = () => get("/api/crm/billing");
export const getCrmCommissionRates = () => get("/api/crm/commission-rates");
export const updateCrmCommissionRate = (plan_type, rate_percent) => post("/api/crm/commission-rates", { plan_type, rate_percent });
export const getCrmDiscountCodes = () => get("/api/crm/discount-codes");
export const createCrmDiscountCode = (body) => post("/api/crm/discount-codes", body);
export const updateCrmDiscountCode = (id, body) => req(`/api/crm/discount-codes/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const getCrmMarketplaceProducts = () => get("/api/crm/marketplace/products");
export const createCrmMarketplaceProduct = (body) => post("/api/crm/marketplace/products", body);
export const updateCrmMarketplaceProduct = (sku, body) =>
  req(`/api/crm/marketplace/products/${encodeURIComponent(sku)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const getCrmMarketplaceOrders = () => get("/api/crm/marketplace/orders");
export const updateCrmMarketplaceOrder = (id, body) =>
  req(`/api/crm/marketplace/orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const getCrmMarketplaceProviders = () => get("/api/crm/marketplace/providers");
export const updateCrmMarketplaceProvider = (id, body) =>
  req(`/api/crm/marketplace/providers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const getCrmMarketplaceServiceListings = () => get("/api/crm/marketplace/service-listings");
export const updateCrmMarketplaceServiceListing = (id, body) =>
  req(`/api/crm/marketplace/service-listings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const getCrmMarketplaceServiceProjects = () => get("/api/crm/marketplace/service-projects");
export const updateCrmMarketplaceServiceProject = (id, body) =>
  req(`/api/crm/marketplace/service-projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const getCrmClusters = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/crm/clusters${qs ? `?${qs}` : ""}`);
};
export const getCrmCluster = (clusterId) => get(`/api/crm/clusters/${encodeURIComponent(clusterId)}`);
export const createCrmCluster = (body) => post("/api/crm/clusters", body);
export const updateCrmCluster = (clusterId, body) => put(`/api/crm/clusters/${encodeURIComponent(clusterId)}`, body);
export const cloneCrmCluster = (clusterId, body = {}) =>
  post(`/api/crm/clusters/${encodeURIComponent(clusterId)}/clone`, body);
export const getCrmClusterStats = (clusterId) => get(`/api/crm/clusters/${encodeURIComponent(clusterId)}/stats`);
export const getCrmClusterPreview = (clusterId) => get(`/api/crm/clusters/${encodeURIComponent(clusterId)}/preview`);
export const getCrmClusterPublishChecklist = (clusterId) =>
  get(`/api/crm/clusters/${encodeURIComponent(clusterId)}/publish-checklist`);
export const getCrmClusterRestaurants = (clusterId) =>
  get(`/api/crm/clusters/${encodeURIComponent(clusterId)}/restaurants`);
export const previewCrmClusterRadius = (clusterId, body = {}) =>
  post(`/api/crm/clusters/${encodeURIComponent(clusterId)}/restaurants/preview-radius`, body);
export const searchCrmClusterRestaurants = (clusterId, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/crm/clusters/${encodeURIComponent(clusterId)}/restaurants/search${qs ? `?${qs}` : ""}`);
};
export const replaceCrmClusterRestaurants = (clusterId, restaurant_ids) =>
  put(`/api/crm/clusters/${encodeURIComponent(clusterId)}/restaurants`, { restaurant_ids });
export const addCrmClusterRestaurant = (clusterId, restaurant_id) =>
  post(`/api/crm/clusters/${encodeURIComponent(clusterId)}/restaurants`, { restaurant_id });
export const removeCrmClusterRestaurant = (clusterId, restaurantId) =>
  req(`/api/crm/clusters/${encodeURIComponent(clusterId)}/restaurants/${encodeURIComponent(restaurantId)}`, {
    method: "DELETE",
  });
export const reorderCrmClusterRestaurants = (clusterId, ordered_restaurant_ids) =>
  put(`/api/crm/clusters/${encodeURIComponent(clusterId)}/restaurants/order`, { ordered_restaurant_ids });
export const checkCrmClusterDuplicates = (clusterId, restaurant_ids) =>
  post(`/api/crm/clusters/${encodeURIComponent(clusterId)}/duplicates/check`, { restaurant_ids });

export const forgotCrmPassword = (email) => post("/api/crm/auth/forgot", { email });
export const verifyCrmResetToken = (token) => get(`/api/crm/auth/reset-password?token=${encodeURIComponent(token)}`);
export const resetCrmPassword = (token, password) => post("/api/crm/auth/reset-password", { token, password });

const QR_API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export const getQrInventory = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return get(`/operator/qr-stickers/inventory${qs ? `?${qs}` : ""}`);
};

export const generateQrInventoryBatch = (body) =>
  post("/operator/qr-stickers/generate-batch", body);

export const validateQrInventoryCode = (qrCode) =>
  get(`/operator/qr-stickers/validate/${encodeURIComponent(qrCode)}`);

export const markQrInventoryReplaced = (qrCode, body = {}) =>
  post(`/operator/qr-stickers/${encodeURIComponent(qrCode)}/mark-replaced`, body);

export const markQrInventoryDamaged = (qrCode, body = {}) =>
  post(`/operator/qr-stickers/${encodeURIComponent(qrCode)}/mark-damaged`, body);

export const downloadQrBatchCsvUrl = (batchId) =>
  `${QR_API}/operator/qr-stickers/batches/${encodeURIComponent(batchId)}/csv`;

export const downloadQrBatchReportUrl = (batchId) =>
  `${QR_API}/operator/qr-stickers/batches/${encodeURIComponent(batchId)}/report`;
