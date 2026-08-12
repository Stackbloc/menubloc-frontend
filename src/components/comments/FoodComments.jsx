/**
 * Reusable food discussions thread — restaurant profile + menu item.
 * One-level replies. No likes/feeds/social chrome.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  createFoodComment,
  deleteFoodComment,
  listPublicFoodComments,
  updateFoodComment,
} from "../../lib/foodCommentsApi.js";

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function CommentBody({ comment, isReply = false }) {
  const isRestaurant = comment.author_type === "restaurant";
  return (
    <div
      data-testid={isReply ? "food-comment-reply" : "food-comment"}
      data-author-type={comment.author_type}
      style={{
        padding: isReply ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        border: "1px solid #e7e5e4",
        background: isRestaurant ? "#f0fdf4" : "#fff",
        marginLeft: isReply ? 18 : 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <strong style={{ fontSize: 14, color: "#1c1917" }}>
          {comment.author_label || comment.author_display_name || "Diner"}
        </strong>
        {comment.is_featured ? (
          <span
            data-testid="food-comment-featured-badge"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#166534",
              background: "#dcfce7",
              borderRadius: 999,
              padding: "2px 8px",
            }}
          >
            Featured
          </span>
        ) : null}
        <span style={{ fontSize: 12, color: "#78716c" }}>
          {formatWhen(comment.created_at)}
          {comment.edited ? " · edited" : ""}
        </span>
      </div>
      <div style={{ fontSize: 14, color: "#292524", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
        {comment.content}
      </div>
    </div>
  );
}

export default function FoodComments({
  restaurantId = null,
  menuItemId = null,
  showFeaturedFirst = true,
  title = "What diners are saying",
  compact = false,
}) {
  const { isAuthenticated, consumer } = useConsumer();
  const location = useLocation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const myId = consumer?.id != null ? Number(consumer.id) : null;

  const load = useCallback(async () => {
    if (!restaurantId && !menuItemId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await listPublicFoodComments({
        restaurantId: menuItemId ? null : restaurantId,
        menuItemId,
      });
      setComments(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || "Could not load comments.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, menuItemId]);

  useEffect(() => {
    load();
  }, [load]);

  const loginHref = `/account/login?redirect=${encodeURIComponent(
    `${location.pathname}${location.search}`
  )}`;

  async function handleCreate(e) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await createFoodComment({
        restaurant_id: restaurantId || undefined,
        menu_item_id: menuItemId || undefined,
        content: draft.trim(),
      });
      setDraft("");
      await load();
    } catch (err) {
      setError(err?.message || "Could not post comment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReply(parentId) {
    if (!replyDraft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await createFoodComment({
        parent_comment_id: parentId,
        content: replyDraft.trim(),
      });
      setReplyTo(null);
      setReplyDraft("");
      await load();
    } catch (err) {
      setError(err?.message || "Could not post reply.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(commentId) {
    if (!editDraft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await updateFoodComment(commentId, editDraft.trim());
      setEditingId(null);
      setEditDraft("");
      await load();
    } catch (err) {
      setError(err?.message || "Could not update comment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(commentId) {
    if (busy) return;
    if (!window.confirm("Delete this comment?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteFoodComment(commentId);
      await load();
    } catch (err) {
      setError(err?.message || "Could not delete comment.");
    } finally {
      setBusy(false);
    }
  }

  const featured = showFeaturedFirst
    ? comments.filter((c) => c.is_featured)
    : [];
  const threadComments = showFeaturedFirst
    ? comments.filter((c) => !c.is_featured)
    : comments;

  return (
    <section
      data-testid="food-comments"
      aria-label={title}
      style={{ marginBottom: compact ? 16 : 28 }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: "#1c1917",
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      {error ? (
        <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }} role="alert">
          {error}
        </div>
      ) : null}

      {featured.length ? (
        <div data-testid="food-comments-featured" style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {featured.map((c) => (
            <CommentBody key={`feat-${c.id}`} comment={c} />
          ))}
        </div>
      ) : null}

      {loading ? (
        <div style={{ fontSize: 13, color: "#78716c" }}>Loading comments…</div>
      ) : null}

      {!loading && !comments.length ? (
        <div style={{ fontSize: 13, color: "#78716c", marginBottom: 12 }}>
          No comments yet. Be the first to share a tip.
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {threadComments.map((comment) => {
          const isMine =
            myId != null &&
            comment.author_type === "consumer" &&
            Number(comment.consumer_user_id) === myId;
          return (
            <div key={comment.id} style={{ display: "grid", gap: 8 }}>
              {editingId === comment.id ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      borderRadius: 10,
                      border: "1px solid #d6d3d1",
                      padding: 10,
                      fontSize: 14,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" disabled={busy} onClick={() => handleSaveEdit(comment.id)}>
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <CommentBody comment={comment} />
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginLeft: 4 }}>
                {isAuthenticated ? (
                  <button
                    type="button"
                    style={linkBtn}
                    onClick={() => {
                      setReplyTo(comment.id);
                      setReplyDraft("");
                    }}
                  >
                    Reply
                  </button>
                ) : null}
                {isMine ? (
                  <>
                    <button
                      type="button"
                      style={linkBtn}
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditDraft(comment.content || "");
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" style={linkBtn} onClick={() => handleDelete(comment.id)}>
                      Delete
                    </button>
                  </>
                ) : null}
              </div>

              {(comment.replies || []).map((reply) => {
                const replyMine =
                  myId != null &&
                  reply.author_type === "consumer" &&
                  Number(reply.consumer_user_id) === myId;
                return (
                  <div key={reply.id} style={{ display: "grid", gap: 6 }}>
                    {editingId === reply.id ? (
                      <div style={{ marginLeft: 18, display: "grid", gap: 8 }}>
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={2}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            borderRadius: 10,
                            border: "1px solid #d6d3d1",
                            padding: 10,
                            fontSize: 14,
                          }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" disabled={busy} onClick={() => handleSaveEdit(reply.id)}>
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <CommentBody comment={reply} isReply />
                    )}
                    {replyMine ? (
                      <div style={{ display: "flex", gap: 10, marginLeft: 22 }}>
                        <button
                          type="button"
                          style={linkBtn}
                          onClick={() => {
                            setEditingId(reply.id);
                            setEditDraft(reply.content || "");
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" style={linkBtn} onClick={() => handleDelete(reply.id)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {replyTo === comment.id ? (
                <div style={{ marginLeft: 18, display: "grid", gap: 8 }}>
                  <textarea
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    rows={2}
                    placeholder="Write a reply…"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      borderRadius: 10,
                      border: "1px solid #d6d3d1",
                      padding: 10,
                      fontSize: 14,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" disabled={busy} onClick={() => handleReply(comment.id)}>
                      Post reply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyDraft("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        {isAuthenticated ? (
          <form onSubmit={handleCreate} style={{ display: "grid", gap: 8 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Share a tip about this place or dish…"
              data-testid="food-comment-compose"
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 10,
                border: "1px solid #d6d3d1",
                padding: 10,
                fontSize: 14,
              }}
            />
            <button type="submit" disabled={busy || !draft.trim()} data-testid="food-comment-submit">
              Post comment
            </button>
          </form>
        ) : (
          <div style={{ fontSize: 13, color: "#57534e" }}>
            <Link to={loginHref} style={{ color: "#166534", fontWeight: 700 }}>
              Sign in
            </Link>{" "}
            to join the discussion.
          </div>
        )}
      </div>
    </section>
  );
}

const linkBtn = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#166534",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
