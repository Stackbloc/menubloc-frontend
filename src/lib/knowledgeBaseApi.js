import { API_BASE } from "./operatorApi.js";
import { OWNER_API_BASE } from "./ownerApi.js";

function createKnowledgeBaseClient(apiBase, pathPrefix) {
  async function post(path, body) {
    const res = await fetch(`${apiBase}${pathPrefix}${path}`, {
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

  async function get(path) {
    const res = await fetch(`${apiBase}${pathPrefix}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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

  return {
    searchKnowledgeBase(query, limit = 5) {
      return post("/search", { query, limit });
    },
    answerKnowledgeBase(query, limit = 5) {
      return post("/answer", { query, limit });
    },
    logKnowledgeBaseArticleClick(searchId, articleSlug) {
      return post(`/search/${searchId}/click`, { article_slug: articleSlug });
    },
    submitKnowledgeBaseFeedback(searchId, helpful) {
      return post(`/search/${searchId}/feedback`, { helpful });
    },
    logKnowledgeBaseEscalation(searchId) {
      return post(`/search/${searchId}/escalate`, {});
    },
    listKnowledgeBaseArticles(q) {
      const qs = q ? `?q=${encodeURIComponent(q)}` : "";
      return get(`/articles${qs}`);
    },
  };
}

const operatorKb = createKnowledgeBaseClient(API_BASE, "/operator/help");
const ownerKb = createKnowledgeBaseClient(OWNER_API_BASE, "/api/owner/help");

export const operatorKnowledgeBaseApi = operatorKb;
export const ownerKnowledgeBaseApi = ownerKb;

export function searchKnowledgeBase(query, limit = 5) {
  return operatorKb.searchKnowledgeBase(query, limit);
}

export function answerKnowledgeBase(query, limit = 5) {
  return operatorKb.answerKnowledgeBase(query, limit);
}

export function logKnowledgeBaseArticleClick(searchId, articleSlug) {
  return operatorKb.logKnowledgeBaseArticleClick(searchId, articleSlug);
}

export function submitKnowledgeBaseFeedback(searchId, helpful) {
  return operatorKb.submitKnowledgeBaseFeedback(searchId, helpful);
}

export function logKnowledgeBaseEscalation(searchId) {
  return operatorKb.logKnowledgeBaseEscalation(searchId);
}
