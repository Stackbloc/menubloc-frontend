import React, { useEffect, useState } from "react";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { ownerKnowledgeBaseApi } from "../../lib/knowledgeBaseApi.js";

/**
 * Thin owner Knowledge Base browse page — panel handles ask/search;
 * this page lists articles for deep links from the right rail.
 */
export default function OwnerHelpCenter() {
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await ownerKnowledgeBaseApi.listKnowledgeBaseArticles(query.trim() || undefined);
        if (!cancelled) setArticles(res.articles || []);
      } catch (err) {
        if (!cancelled) {
          setArticles([]);
          setError(err.message || "Could not load Knowledge Base articles.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <OwnerLayout title="Knowledge Base">
      <PageCard style={{ padding: 24 }}>
        <SectionTitle
          title="Menuply Knowledge Base"
          subtitle="Browse help articles. Use the Knowledge Base panel (header) to ask a question."
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter articles"
          style={{
            width: "100%",
            maxWidth: 420,
            boxSizing: "border-box",
            border: `1px solid ${OWNER_COLORS.line}`,
            borderRadius: 12,
            padding: "11px 14px",
            fontSize: 14,
            fontFamily: "inherit",
            marginBottom: 18,
          }}
        />
        {loading ? (
          <div style={{ color: OWNER_COLORS.muted, fontSize: 14 }}>Loading articles…</div>
        ) : null}
        {error ? (
          <div style={{ color: "#991b1b", fontSize: 14, marginBottom: 12 }}>{error}</div>
        ) : null}
        <div style={{ display: "grid", gap: 10 }}>
          {articles.map((article) => (
            <div
              key={article.slug || article.title}
              style={{
                border: `1px solid ${OWNER_COLORS.line}`,
                borderRadius: 12,
                padding: "14px 16px",
                background: "#fff",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {article.category || "Help"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: OWNER_COLORS.ink, marginTop: 4 }}>
                {article.title}
              </div>
              {article.summary ? (
                <div style={{ fontSize: 13, color: "#475467", marginTop: 6, lineHeight: 1.5 }}>
                  {article.summary}
                </div>
              ) : null}
            </div>
          ))}
          {!loading && !error && articles.length === 0 ? (
            <div style={{ color: OWNER_COLORS.muted, fontSize: 14 }}>No articles matched.</div>
          ) : null}
        </div>
      </PageCard>
    </OwnerLayout>
  );
}
