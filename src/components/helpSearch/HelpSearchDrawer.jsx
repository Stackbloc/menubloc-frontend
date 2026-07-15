import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  answerKnowledgeBase,
  logKnowledgeBaseArticleClick,
  logKnowledgeBaseEscalation,
  submitKnowledgeBaseFeedback,
} from "../../lib/knowledgeBaseApi.js";

/**
 * Legacy floating drawer — kept for any direct callers.
 * Operator/Owner shells use KnowledgeBasePanel in the right rail instead.
 */
const SUPPORT_PATH = "/operator/help#operations-support-form";

const feedbackButtonStyle = {
  border: "1px solid #d7deea",
  borderRadius: 999,
  background: "#fff",
  color: "#475467",
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

function ArticleResult({ article, searchId }) {
  async function handleClick() {
    if (!searchId || !article.slug) return;
    await logKnowledgeBaseArticleClick(searchId, article.slug).catch(() => {});
  }

  return (
    <Link
      to="/operator/help"
      onClick={handleClick}
      style={{
        display: "grid",
        gap: 5,
        textDecoration: "none",
        color: "inherit",
        border: "1px solid #d7deea",
        borderRadius: 12,
        background: "#fff",
        padding: "11px 12px",
      }}
    >
      <span style={{ fontSize: 12, color: "#667085", fontWeight: 800 }}>{article.category}</span>
      <span style={{ fontSize: 14, color: "#0f1720", fontWeight: 900 }}>{article.title}</span>
      {article.summary ? <span style={{ fontSize: 13, color: "#475467", lineHeight: 1.45 }}>{article.summary}</span> : null}
    </Link>
  );
}

export default function HelpSearchDrawer({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState("");
  const [searchId, setSearchId] = useState(null);
  const [message, setMessage] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const feedbackSent = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = query.trim();
    if (!text || isLoading) return;

    setError("");
    setMessage("");
    setResults([]);
    setAnswer("");
    setSearchId(null);
    setEscalated(false);
    feedbackSent.current = false;
    setIsLoading(true);

    try {
      const response = await answerKnowledgeBase(text);
      setSearchId(response.search_id || null);
      setResults(response.articles || []);
      setAnswer(response.answer || "");
      setMessage(response.message || "");
      setEscalated(Boolean(response.escalated));
    } catch (err) {
      setError(
        err?.status >= 500
          ? "Knowledge Base search is temporarily unavailable. Please contact Menuply support."
          : err.message || "Knowledge Base search is temporarily unavailable."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFeedback(helpful) {
    if (!searchId || feedbackSent.current) return;
    feedbackSent.current = true;
    await submitKnowledgeBaseFeedback(searchId, helpful).catch(() => {
      feedbackSent.current = false;
    });
  }

  async function handleEscalation() {
    if (searchId) await logKnowledgeBaseEscalation(searchId).catch(() => {});
  }

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Knowledge Base Search" style={{ position: "fixed", inset: 0, zIndex: 70, pointerEvents: "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 32, 0.28)", pointerEvents: "auto" }} />
      <aside
        style={{
          position: "absolute",
          right: 18,
          bottom: 18,
          width: "min(420px, calc(100vw - 36px))",
          height: "min(620px, calc(100vh - 36px))",
          background: "#f8fafc",
          border: "1px solid #d7deea",
          borderRadius: 18,
          boxShadow: "0 24px 70px rgba(15, 23, 32, 0.28)",
          display: "grid",
          gridTemplateRows: "auto auto minmax(0, 1fr)",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        <header style={{ padding: "16px 18px", background: "#fff", borderBottom: "1px solid #e4e9f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#0f1720" }}>Knowledge Base Search</div>
            <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>Search Menuply help articles</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Knowledge Base Search" style={{ width: 36, height: 36, border: "1px solid #d7deea", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>
            x
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: 14, background: "#fff", borderBottom: "1px solid #e4e9f0", display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={400}
              placeholder="Search help articles"
              style={{ flex: 1, minWidth: 0, border: "1px solid #d7deea", borderRadius: 12, padding: "11px 12px", fontSize: 14, fontFamily: "inherit" }}
            />
            <button type="submit" disabled={isLoading || !query.trim()} style={{ border: "none", borderRadius: 12, background: "#1F4E3D", color: "#fff", padding: "0 14px", fontSize: 14, fontWeight: 800, opacity: isLoading || !query.trim() ? 0.6 : 1, cursor: isLoading || !query.trim() ? "default" : "pointer" }}>
              Search
            </button>
          </div>
        </form>

        <div style={{ overflowY: "auto", padding: 18, display: "grid", alignContent: "start", gap: 12 }}>
          {isLoading ? <div style={{ fontSize: 13, color: "#667085" }}>Searching the Knowledge Base...</div> : null}
          {error ? <div style={{ fontSize: 13, color: "#991b1b" }}>{error}</div> : null}
          {answer ? (
            <div style={{ border: "1px solid #cfe7da", background: "#f3fbf7", color: "#163f31", borderRadius: 12, padding: "12px 14px", fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#1F4E3D", marginBottom: 6 }}>AI Answer</div>
              {answer}
            </div>
          ) : null}
          {message ? (
            <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 12, padding: "12px 14px", fontSize: 13, lineHeight: 1.5 }}>
              {message}
            </div>
          ) : null}
          {results.length ? <div style={{ fontSize: 12, fontWeight: 900, color: "#1F4E3D", marginTop: 2 }}>Source Articles</div> : null}
          {results.map((article) => <ArticleResult key={article.slug} article={article} searchId={searchId} />)}
          {searchId ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              <button type="button" onClick={() => handleFeedback("up")} style={feedbackButtonStyle}>Helpful</button>
              <button type="button" onClick={() => handleFeedback("down")} style={feedbackButtonStyle}>Not helpful</button>
              <Link to={SUPPORT_PATH} onClick={handleEscalation} style={{ ...feedbackButtonStyle, color: escalated ? "#991b1b" : "#1F4E3D", textDecoration: "none" }}>
                Contact Support
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
