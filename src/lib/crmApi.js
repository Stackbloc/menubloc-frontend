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
export const getCrmLeads = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/crm/leads${qs ? `?${qs}` : ""}`);
};
export const getCrmLead = (leadId) => get(`/api/crm/leads/${leadId}`);
export const createCrmLead = (body) => post("/api/crm/leads", body);
export const updateCrmLead = (leadId, body) => put(`/api/crm/leads/${leadId}`, body);
export const updateCrmLeadStage = (leadId, body) => post(`/api/crm/leads/${leadId}/stage`, body);
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

export const forgotCrmPassword = (email) => post("/api/crm/auth/forgot", { email });
export const verifyCrmResetToken = (token) => get(`/api/crm/auth/reset-password?token=${encodeURIComponent(token)}`);
export const resetCrmPassword = (token, password) => post("/api/crm/auth/reset-password", { token, password });
