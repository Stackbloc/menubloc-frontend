/**
 * Restaurant Comments (Andre 2026-11-12, plan 40): what diners say about this restaurant and its dishes.
 *   On clips     — Feed comments on clips about the restaurant or one of its dishes
 *   Discussion   — the restaurant's own discussion thread (profile + dish pages)
 * Reply as the restaurant (the diner is notified) or Remove an unwanted comment from the profile.
 * Opening this page clears the "new" count in the menu.
 */

import React, { useCallback, useEffect, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  getRestaurantFeedComments,
  replyRestaurantFeedComment,
  removeRestaurantFeedComment,
  getRestaurantFoodComments,
  replyRestaurantFoodComment,
  removeRestaurantFoodComment,
} from "../../lib/operatorApi.js";

const SITE = "https://menuply.com";

function when(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function ReplyBox({ onSend, onCancel, max = 500 }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function send() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      await onSend(body);
      setText("");
    } catch (err) {
      setError(err.message || "Couldn't send. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        value={text}
        maxLength={max}
        rows={2}
        autoFocus
        placeholder="Reply as the restaurant…"
        onChange={(e) => setText(e.target.value)}
        style={styles.textarea}
        data-testid="operator-comment-reply-input"
      />
      {error ? <div style={styles.error}>{error}</div> : null}
      <div style={styles.actions}>
        <button type="button" style={styles.primary} disabled={busy || !text.trim()} onClick={send} data-testid="operator-comment-reply-send">
          {busy ? "Sending…" : "Send reply"}
        </button>
        <button type="button" style={styles.ghost} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function CommentCard({ author, isRestaurant, body, createdAt, context, quote, link, canReply, onReply, onRemove, removeLabel }) {
  const [replying, setReplying] = useState(false);
  const [removing, setRemoving] = useState(false);
  async function remove() {
    if (!window.confirm(isRestaurant ? "Delete your reply?" : "Remove this comment from your profile? Diners won't see it anymore.")) return;
    setRemoving(true);
    try {
      await onRemove();
    } catch (err) {
      window.alert(err.message || "Couldn't remove it. Try again.");
      setRemoving(false);
    }
  }
  return (
    <div style={{ ...styles.card, ...(isRestaurant ? styles.cardMine : null) }} data-testid="operator-comment">
      <div style={styles.head}>
        <strong>{isRestaurant ? "You (restaurant)" : author}</strong>
        <span style={styles.muted}>{when(createdAt)}</span>
      </div>
      {context ? <div style={styles.context}>{context}</div> : null}
      {quote ? <div style={styles.quote}>Replying to {quote.name}: “{quote.body}”</div> : null}
      <p style={styles.body}>{body}</p>
      <div style={styles.actions}>
        {canReply && !replying ? (
          <button type="button" style={styles.ghost} onClick={() => setReplying(true)} data-testid="operator-comment-reply">
            Reply
          </button>
        ) : null}
        <button type="button" style={styles.danger} disabled={removing} onClick={remove} data-testid="operator-comment-remove">
          {removing ? "Removing…" : removeLabel || (isRestaurant ? "Delete" : "Remove")}
        </button>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" style={styles.link}>
            See it on Menuply
          </a>
        ) : null}
      </div>
      {replying ? (
        <ReplyBox
          onCancel={() => setReplying(false)}
          onSend={async (text) => {
            await onReply(text);
            setReplying(false);
          }}
        />
      ) : null}
    </div>
  );
}

export default function OperatorCommentsPage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const [tab, setTab] = useState("clips");
  const [feed, setFeed] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [discussion, setDiscussion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    setError("");
    try {
      const [f, d] = await Promise.all([
        getRestaurantFeedComments(rid).catch((err) => ({ _err: err })),
        getRestaurantFoodComments(rid).catch((err) => ({ _err: err })),
      ]);
      if (f?._err && d?._err) throw f._err;
      setFeed(f?.comments || []);
      setCursor(f?.next_cursor || null);
      setDiscussion(d?.comments || []);
    } catch (err) {
      setError(err.message || "Couldn't load comments");
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => {
    load();
  }, [load]);

  async function more() {
    if (!cursor) return;
    try {
      const f = await getRestaurantFeedComments(rid, cursor);
      setFeed((prev) => [...prev, ...(f.comments || [])]);
      setCursor(f.next_cursor || null);
    } catch (err) {
      setError(err.message || "Couldn't load more");
    }
  }

  const feedCount = feed.length;
  const discussionCount = discussion.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0);

  return (
    <OperatorLayout title="Comments">
      <p style={{ color: "#64748b", marginTop: 0, marginBottom: 12 }}>
        What diners say about {selectedRestaurant?.restaurant_name || "your restaurant"} and your dishes. Reply as the
        restaurant (the diner gets notified) or remove a comment you don&apos;t want on your profile. We email you about
        new comments at most once an hour.
      </p>
      <div style={styles.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === "clips"} style={tab === "clips" ? styles.tabOn : styles.tab} onClick={() => setTab("clips")}>
          On clips{feedCount ? ` (${feedCount}${cursor ? "+" : ""})` : ""}
        </button>
        <button type="button" role="tab" aria-selected={tab === "discussion"} style={tab === "discussion" ? styles.tabOn : styles.tab} onClick={() => setTab("discussion")}>
          Discussion{discussionCount ? ` (${discussionCount})` : ""}
        </button>
      </div>
      {error ? <div style={styles.error}>{error}</div> : null}
      {!rid ? (
        <p>Select a restaurant to see comments.</p>
      ) : loading ? (
        <p>Loading…</p>
      ) : tab === "clips" ? (
        feed.length === 0 ? (
          <div style={styles.empty}>No comments on clips about your restaurant yet.</div>
        ) : (
          <>
            {feed.map((c) => (
              <CommentCard
                key={`f-${c.id}`}
                author={c.author?.name || "A diner"}
                isRestaurant={c.from_restaurant}
                body={c.body}
                createdAt={c.created_at}
                context={`On a clip${c.menu_item?.name ? ` about ${c.menu_item.name}` : ""}${c.post_live ? "" : " (clip no longer on the Feed)"}`}
                quote={c.in_reply_to}
                link={c.post_live && c.href ? `${SITE}${c.href}` : null}
                canReply={!c.from_restaurant && c.post_live}
                onReply={async (text) => {
                  await replyRestaurantFeedComment(rid, c.id, text);
                  await load();
                }}
                onRemove={async () => {
                  await removeRestaurantFeedComment(rid, c.id);
                  setFeed((prev) => prev.filter((x) => x.id !== c.id));
                }}
              />
            ))}
            {cursor ? (
              <button type="button" style={styles.ghost} onClick={more}>
                Show more
              </button>
            ) : null}
          </>
        )
      ) : discussion.length === 0 ? (
        <div style={styles.empty}>No discussion comments yet.</div>
      ) : (
        discussion.map((c) => (
          <div key={`d-${c.id}`}>
            <CommentCard
              author={c.author_label || "A diner"}
              isRestaurant={c.author_type === "restaurant"}
              body={c.content}
              createdAt={c.created_at}
              context={c.menu_item_name ? `About ${c.menu_item_name}` : "On your profile"}
              canReply={c.author_type !== "restaurant"}
              onReply={async (text) => {
                await replyRestaurantFoodComment(rid, c.id, text);
                await load();
              }}
              onRemove={async () => {
                await removeRestaurantFoodComment(rid, c.id);
                setDiscussion((prev) => prev.filter((x) => x.id !== c.id));
              }}
            />
            {(c.replies || []).map((r) => (
              <div key={`d-${r.id}`} style={{ marginLeft: 24 }}>
                <CommentCard
                  author={r.author_label || "A diner"}
                  isRestaurant={r.author_type === "restaurant"}
                  body={r.content}
                  createdAt={r.created_at}
                  canReply={false}
                  onRemove={async () => {
                    await removeRestaurantFoodComment(rid, r.id);
                    setDiscussion((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, replies: (x.replies || []).filter((y) => y.id !== r.id) } : x))
                    );
                  }}
                />
              </div>
            ))}
          </div>
        ))
      )}
    </OperatorLayout>
  );
}

const pill = { borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const styles = {
  tabs: { display: "flex", gap: 8, marginBottom: 14 },
  tab: { ...pill, border: "1px solid #e2e8f0", background: "#fff", color: "#334155" },
  tabOn: { ...pill, border: "1px solid #0f172a", background: "#0f172a", color: "#fff" },
  card: { padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", marginBottom: 10 },
  cardMine: { background: "#f8fafc" },
  head: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14 },
  muted: { color: "#64748b", fontSize: 12 },
  context: { color: "#64748b", fontSize: 12, marginTop: 2 },
  quote: { color: "#475569", fontSize: 13, marginTop: 6, paddingLeft: 8, borderLeft: "3px solid #e2e8f0" },
  body: { margin: "8px 0 0", whiteSpace: "pre-wrap", fontSize: 15, color: "#0f172a" },
  actions: { display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" },
  primary: { ...pill, border: "1px solid #0f172a", background: "#0f172a", color: "#fff" },
  ghost: { ...pill, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a" },
  danger: { ...pill, border: "1px solid #fecaca", background: "#fff", color: "#b42318" },
  link: { fontSize: 13, color: "#1d4ed8" },
  textarea: { width: "100%", boxSizing: "border-box", borderRadius: 10, border: "1px solid #cbd5e1", padding: 10, fontSize: 15, fontFamily: "inherit" },
  error: { color: "#b91c1c", margin: "8px 0" },
  empty: { padding: 20, borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b" },
};
