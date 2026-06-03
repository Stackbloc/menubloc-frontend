import { API_BASE } from "./operatorApi.js";

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

export function searchKnowledgeBase(query, limit = 5) {
  return post("/operator/help/search", { query, limit });
}

export function logKnowledgeBaseArticleClick(searchId, articleSlug) {
  return post(`/operator/help/search/${searchId}/click`, { article_slug: articleSlug });
}

export function submitKnowledgeBaseFeedback(searchId, helpful) {
  return post(`/operator/help/search/${searchId}/feedback`, { helpful });
}

export function logKnowledgeBaseEscalation(searchId) {
  return post(`/operator/help/search/${searchId}/escalate`, {});
}
