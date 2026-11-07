import { API_BASE } from "./api.js";
import { OWNER_API_BASE } from "./ownerApi.js";
import { apiErrorFromResponse } from "./apiErrorDisplay.js";

/** Send Feedback categories (must match the backend, mig 0404). */
export const FEEDBACK_CATEGORIES = [
  { value: "broken", label: "Something isn't working" },
  { value: "improvement", label: "Suggest an improvement" },
  { value: "menu_info", label: "Menu or restaurant information" },
  { value: "confusing", label: "Something is confusing" },
  { value: "other", label: "Other" },
];
export const FEEDBACK_MESSAGE_MAX = 2000;

/** POST /api/feedback. Resolves { ok, id, duplicate } or throws an Error with a friendly message. */
export async function submitFeedback({ category, message, screen }) {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, message, platform: "web", screen: screen || null }),
  });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}

// ── Owner → Feedback ──
async function ownerCall(path, { method = "GET", body } = {}) {
  const res = await fetch(`${OWNER_API_BASE}/api/owner/feedback${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await apiErrorFromResponse(res);
    throw err;
  }
  return res.json();
}

function qs(params = {}) {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return s ? `?${s}` : "";
}

export const getOwnerFeedbackSummary = (days = 7) => ownerCall(`/summary${qs({ days })}`);
export const listOwnerFeedbackSubmissions = (params) => ownerCall(`/submissions${qs(params)}`);
export const getOwnerFeedbackSuggestions = (id) => ownerCall(`/submissions/${encodeURIComponent(id)}/suggestions`);
export const reviewOwnerFeedbackSubmission = (id, reviewed = true) =>
  ownerCall(`/submissions/${encodeURIComponent(id)}/review`, { method: "POST", body: { reviewed } });
export const createOwnerFeedbackIssue = (id, input) =>
  ownerCall(`/submissions/${encodeURIComponent(id)}/issue`, { method: "POST", body: input });
export const linkOwnerFeedbackSubmission = (id, issueId) =>
  ownerCall(`/submissions/${encodeURIComponent(id)}/link`, { method: "POST", body: { issue_id: issueId } });
export const unlinkOwnerFeedbackSubmission = (id) =>
  ownerCall(`/submissions/${encodeURIComponent(id)}/unlink`, { method: "POST", body: {} });
export const listOwnerFeedbackIssues = (params) => ownerCall(`/issues${qs(params)}`);
export const getOwnerFeedbackIssue = (id) => ownerCall(`/issues/${encodeURIComponent(id)}`);
export const updateOwnerFeedbackIssue = (id, patch) =>
  ownerCall(`/issues/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
