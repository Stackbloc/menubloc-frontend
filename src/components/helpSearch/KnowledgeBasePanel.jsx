import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_CONSOLE } from "../adminConsole/adminConsoleTokens.js";

const feedbackButtonStyle = {
  border: `1px solid ${ADMIN_CONSOLE.line}`,
  borderRadius: 999,
  background: "#fff",
  color: "#475467",
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

function ArticleResult({ article, searchId, helpPath, onArticleClick }) {
  async function handleClick() {
    if (!searchId || !article.slug) return;
    await onArticleClick?.(searchId, article.slug);
  }

  return (
    <Link
      to={helpPath}
      onClick={handleClick}
      style={{
        display: "grid",
        gap: 5,
        textDecoration: "none",
        color: "inherit",
        border: `1px solid ${ADMIN_CONSOLE.line}`,
        borderRadius: 12,
        background: "#fff",
        padding: "11px 12px",
      }}
    >
      <span style={{ fontSize: 12, color: ADMIN_CONSOLE.muted, fontWeight: 800 }}>
        {article.category}
      </span>
      <span style={{ fontSize: 14, color: ADMIN_CONSOLE.ink, fontWeight: 800 }}>
        {article.title}
      </span>
      {article.summary ? (
        <span style={{ fontSize: 13, color: "#475467", lineHeight: 1.45 }}>
          {article.summary}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Right-rail Knowledge Base panel (Stripe-style assistant column).
 * `api` must provide answer/search analytics helpers for the active console.
 */
export default function KnowledgeBasePanel({
  onClose,
  api,
  helpPath = "/operator/help",
  supportPath = "/operator/help#operations-support-form",
}) {
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
      const response = await api.answerKnowledgeBase(text);
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
    await api.submitKnowledgeBaseFeedback(searchId, helpful).catch(() => {
      feedbackSent.current = false;
    });
  }

  async function handleEscalation() {
    if (searchId) await api.logKnowledgeBaseEscalation(searchId).catch(() => {});
  }

  async function handleArticleClick(id, slug) {
    await api.logKnowledgeBaseArticleClick(id, slug).catch(() => {});
  }

  return (
    <div
      role="complementary"
      aria-label="Knowledge Base"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: "#fff",
      }}
    >
      <header
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${ADMIN_CONSOLE.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: ADMIN_CONSOLE.ink,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span aria-hidden="true">✦</span> Knowledge Base
          </div>
          <div style={{ fontSize: 12, color: ADMIN_CONSOLE.muted, marginTop: 2 }}>
            Search Menuply help articles
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Knowledge Base"
          style={{
            width: 32,
            height: 32,
            border: `1px solid ${ADMIN_CONSOLE.line}`,
            borderRadius: 8,
            background: "#fff",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            color: ADMIN_CONSOLE.muted,
          }}
        >
          ×
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: 14,
          borderBottom: `1px solid ${ADMIN_CONSOLE.line}`,
          display: "grid",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={400}
            placeholder="Ask a question"
            aria-label="Ask a question"
            style={{
              flex: 1,
              minWidth: 0,
              border: `1px solid ${ADMIN_CONSOLE.line}`,
              borderRadius: 999,
              padding: "10px 14px",
              fontSize: 13,
              fontFamily: "inherit",
              background: ADMIN_CONSOLE.page,
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            aria-label="Send"
            style={{
              width: 40,
              height: 40,
              border: "none",
              borderRadius: 999,
              background: ADMIN_CONSOLE.accentDark,
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              opacity: isLoading || !query.trim() ? 0.55 : 1,
              cursor: isLoading || !query.trim() ? "default" : "pointer",
              flexShrink: 0,
            }}
          >
            →
          </button>
        </div>
      </form>

      <div
        style={{
          overflowY: "auto",
          padding: 16,
          display: "grid",
          alignContent: "start",
          gap: 12,
          flex: 1,
          minHeight: 0,
          background: ADMIN_CONSOLE.page,
        }}
      >
        {isLoading ? (
          <div style={{ fontSize: 13, color: ADMIN_CONSOLE.muted }}>
            Searching the Knowledge Base...
          </div>
        ) : null}
        {error ? (
          <div style={{ fontSize: 13, color: "#991b1b" }}>{error}</div>
        ) : null}
        {answer ? (
          <div
            style={{
              border: "1px solid #cfe7da",
              background: "#f3fbf7",
              color: "#163f31",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: ADMIN_CONSOLE.accentDark,
                marginBottom: 6,
              }}
            >
              Answer
            </div>
            {answer}
          </div>
        ) : null}
        {message ? (
          <div
            style={{
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        ) : null}
        {results.length ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: ADMIN_CONSOLE.accentDark,
              marginTop: 2,
            }}
          >
            Source Articles
          </div>
        ) : null}
        {results.map((article) => (
          <ArticleResult
            key={article.slug}
            article={article}
            searchId={searchId}
            helpPath={helpPath}
            onArticleClick={handleArticleClick}
          />
        ))}
        {searchId ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <button
              type="button"
              onClick={() => handleFeedback("up")}
              style={feedbackButtonStyle}
            >
              Helpful
            </button>
            <button
              type="button"
              onClick={() => handleFeedback("down")}
              style={feedbackButtonStyle}
            >
              Not helpful
            </button>
            <Link
              to={supportPath}
              onClick={handleEscalation}
              style={{
                ...feedbackButtonStyle,
                color: escalated ? "#991b1b" : ADMIN_CONSOLE.accentDark,
                textDecoration: "none",
              }}
            >
              Contact Support
            </Link>
          </div>
        ) : null}
        {!isLoading && !answer && !error && !results.length ? (
          <div style={{ fontSize: 13, color: ADMIN_CONSOLE.muted, lineHeight: 1.5 }}>
            Ask about orders, menus, billing, or display boards. Answers come from
            Menuply help articles.
          </div>
        ) : null}
      </div>

      <footer
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${ADMIN_CONSOLE.line}`,
          flexShrink: 0,
          background: "#fff",
        }}
      >
        <Link
          to={helpPath}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: ADMIN_CONSOLE.accentDark,
            textDecoration: "none",
          }}
        >
          View all articles →
        </Link>
      </footer>
    </div>
  );
}
