/**
 * Reusable food discussions thread — restaurant profile + menu item.
 * One-level replies. No likes/feeds/social chrome.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { updateConsumerProfile } from "../../lib/consumerApi.js";
import { fetchRestaurantMenuPreview } from "../../lib/api.js";
import { menuItemPath } from "../../lib/canonicalUrl.js";
import {
  createFoodComment,
  deleteFoodComment,
  listPublicFoodComments,
  updateFoodComment,
} from "../../lib/foodCommentsApi.js";

const TOPIC_RESTAURANT = "";

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

function sectionTitleStyle(compact) {
  return {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.35,
    color: "#57534e",
    textTransform: "uppercase",
    marginBottom: compact ? 8 : 10,
    marginTop: compact ? 12 : 16,
  };
}

function CommentBody({
  comment,
  isReply = false,
  showMenuItemLead = false,
  menuItemHref = null,
}) {
  const isRestaurant = comment.author_type === "restaurant";
  const menuName = String(comment.menu_item_name || "").trim();
  return (
    <div
      data-testid={isReply ? "food-comment-reply" : "food-comment"}
      data-author-type={comment.author_type}
      data-menu-item-id={comment.menu_item_id || undefined}
      style={{
        padding: isReply ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        border: "1px solid #e7e5e4",
        background: isRestaurant ? "#f0fdf4" : "#fff",
        marginLeft: isReply ? 18 : 0,
      }}
    >
      {showMenuItemLead && !isReply && (menuName || comment.menu_item_id) ? (
        <div
          data-testid="food-comment-menu-item-lead"
          style={{ fontSize: 13, color: "#44403c", marginBottom: 6, lineHeight: 1.4 }}
        >
          Menu item:{" "}
          {menuItemHref ? (
            <Link to={menuItemHref} style={{ color: "#166534", fontWeight: 700 }}>
              {menuName || `Item #${comment.menu_item_id}`}
            </Link>
          ) : (
            <strong>{menuName || `Item #${comment.menu_item_id}`}</strong>
          )}
          :
        </div>
      ) : null}
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

function ScreenNameBar({
  screenName,
  editing,
  draftName,
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  busy,
  required,
}) {
  if (editing || required) {
    return (
      <div data-testid="food-comment-screen-name" style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#44403c" }}>
          Screen name {required ? <span style={{ color: "#b91c1c" }}>(required)</span> : null}
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={draftName}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Name shown on your comments"
            maxLength={80}
            data-testid="food-comment-screen-name-input"
            style={{
              flex: "1 1 160px",
              borderRadius: 10,
              border: "1px solid #d6d3d1",
              padding: "8px 10px",
              fontSize: 14,
            }}
          />
          <button type="button" disabled={busy || !draftName.trim()} onClick={onSave}>
            Save screen name
          </button>
          {!required ? (
            <button type="button" onClick={onCancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="food-comment-screen-name"
      style={{ fontSize: 13, color: "#57534e", display: "flex", flexWrap: "wrap", gap: 8 }}
    >
      <span>
        Posting as <strong style={{ color: "#1c1917" }}>{screenName}</strong>
      </span>
      <button type="button" style={linkBtn} onClick={onStartEdit}>
        Change
      </button>
    </div>
  );
}

function CommentThreadList({
  comments,
  myId,
  isAuthenticated,
  showMenuItemLead,
  buildMenuItemHref,
  editingId,
  editDraft,
  setEditingId,
  setEditDraft,
  replyTo,
  replyDraft,
  setReplyTo,
  setReplyDraft,
  busy,
  onSaveEdit,
  onDelete,
  onReply,
  screenNameGate,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {comments.map((comment) => {
        const isMine =
          myId != null &&
          comment.author_type === "consumer" &&
          Number(comment.consumer_user_id) === myId;
        const href = buildMenuItemHref?.(comment) || null;
        return (
          <div key={comment.id} style={{ display: "grid", gap: 8 }}>
            {editingId === comment.id ? (
              <div style={{ display: "grid", gap: 8 }}>
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={3}
                  style={textareaStyle}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" disabled={busy} onClick={() => onSaveEdit(comment.id)}>
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
              <CommentBody
                comment={comment}
                showMenuItemLead={showMenuItemLead}
                menuItemHref={href}
              />
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
                  <button type="button" style={linkBtn} onClick={() => onDelete(comment.id)}>
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
                        style={textareaStyle}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" disabled={busy} onClick={() => onSaveEdit(reply.id)}>
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
                      <button type="button" style={linkBtn} onClick={() => onDelete(reply.id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {replyTo === comment.id ? (
              <div style={{ marginLeft: 18, display: "grid", gap: 8 }}>
                {screenNameGate}
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={2}
                  placeholder="Write a reply…"
                  style={textareaStyle}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" disabled={busy} onClick={() => onReply(comment.id)}>
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
  );
}

export default function FoodComments({
  restaurantId = null,
  menuItemId = null,
  restaurantSlug = null,
  restaurantCity = null,
  restaurantState = null,
  menuPreviewItems = null,
  showFeaturedFirst = true,
  title = "What diners are saying",
  compact = false,
}) {
  const { isAuthenticated, consumer, profile, refreshSession } = useConsumer();
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
  const [topicMenuItemId, setTopicMenuItemId] = useState(TOPIC_RESTAURANT);
  const [dishOptions, setDishOptions] = useState([]);
  const [editingScreenName, setEditingScreenName] = useState(false);
  const [screenNameDraft, setScreenNameDraft] = useState("");

  const myId = consumer?.id != null ? Number(consumer.id) : null;
  const isProfileThread = Boolean(restaurantId) && !menuItemId;
  const screenName = String(profile?.display_name || "").trim();
  const needsScreenName = isAuthenticated && !screenName;

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

  useEffect(() => {
    if (!isProfileThread || !restaurantId) {
      setDishOptions([]);
      return undefined;
    }
    const fromProps = Array.isArray(menuPreviewItems) ? menuPreviewItems : null;
    if (fromProps) {
      setDishOptions(
        fromProps
          .map((row) => ({
            id: String(row.menu_item_id || row.id || ""),
            name: String(row.name || "").trim(),
          }))
          .filter((row) => row.id && row.name)
      );
      return undefined;
    }
    let cancelled = false;
    fetchRestaurantMenuPreview(restaurantId, { limit: 50 })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.preview_items)
          ? data.preview_items
          : Array.isArray(data?.items)
            ? data.items
            : [];
        setDishOptions(
          items
            .map((row) => ({
              id: String(row.menu_item_id || row.id || ""),
              name: String(row.name || "").trim(),
            }))
            .filter((row) => row.id && row.name)
        );
      })
      .catch(() => {
        if (!cancelled) setDishOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isProfileThread, restaurantId, menuPreviewItems]);

  useEffect(() => {
    if (needsScreenName) {
      setEditingScreenName(true);
      setScreenNameDraft("");
    }
  }, [needsScreenName]);

  const loginHref = `/account/login?redirect=${encodeURIComponent(
    `${location.pathname}${location.search}`
  )}`;

  function buildMenuItemHref(comment) {
    const id = comment?.menu_item_id;
    if (!id) return null;
    return menuItemPath({
      restaurantSlug: restaurantSlug || undefined,
      city: restaurantCity || undefined,
      state: restaurantState || undefined,
      itemId: id,
    });
  }

  async function ensureScreenName() {
    if (screenName) return true;
    const next = screenNameDraft.trim();
    if (!next) {
      setError("Choose a screen name before posting a comment.");
      setEditingScreenName(true);
      return false;
    }
    await updateConsumerProfile({ display_name: next });
    await refreshSession();
    setEditingScreenName(false);
    setScreenNameDraft("");
    return true;
  }

  async function handleSaveScreenName() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const next = screenNameDraft.trim();
      if (!next) {
        setError("Screen name is required.");
        return;
      }
      await updateConsumerProfile({ display_name: next });
      await refreshSession();
      setEditingScreenName(false);
      setScreenNameDraft("");
    } catch (err) {
      setError(err?.message || "Could not save screen name.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const ok = await ensureScreenName();
      if (!ok) return;
      const selectedDish = isProfileThread ? topicMenuItemId : null;
      await createFoodComment({
        restaurant_id: restaurantId || undefined,
        menu_item_id: menuItemId || selectedDish || undefined,
        content: draft.trim(),
      });
      setDraft("");
      if (isProfileThread) setTopicMenuItemId(TOPIC_RESTAURANT);
      await load();
    } catch (err) {
      if (err?.code === "display_name_required") {
        setEditingScreenName(true);
        setError(err.message || "Choose a screen name before posting a comment.");
      } else {
        setError(err?.message || "Could not post comment.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReply(parentId) {
    if (!replyDraft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const ok = await ensureScreenName();
      if (!ok) return;
      await createFoodComment({
        parent_comment_id: parentId,
        content: replyDraft.trim(),
      });
      setReplyTo(null);
      setReplyDraft("");
      await load();
    } catch (err) {
      if (err?.code === "display_name_required") {
        setEditingScreenName(true);
        setError(err.message || "Choose a screen name before posting a comment.");
      } else {
        setError(err?.message || "Could not post reply.");
      }
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

  const restaurantComments = useMemo(() => {
    if (!isProfileThread) return comments;
    return comments.filter((c) => c.menu_item_id == null);
  }, [comments, isProfileThread]);

  const menuItemComments = useMemo(() => {
    if (!isProfileThread) return [];
    return comments.filter((c) => c.menu_item_id != null);
  }, [comments, isProfileThread]);

  function withFeaturedSplit(rows) {
    if (!showFeaturedFirst) return { featured: [], thread: rows };
    return {
      featured: rows.filter((c) => c.is_featured),
      thread: rows.filter((c) => !c.is_featured),
    };
  }

  const restaurantSplit = withFeaturedSplit(isProfileThread ? restaurantComments : comments);
  const menuSplit = withFeaturedSplit(menuItemComments);

  const screenNameGate = isAuthenticated ? (
    <ScreenNameBar
      screenName={screenName}
      editing={editingScreenName}
      draftName={screenNameDraft}
      onDraftChange={setScreenNameDraft}
      onStartEdit={() => {
        setEditingScreenName(true);
        setScreenNameDraft(screenName);
      }}
      onCancelEdit={() => {
        setEditingScreenName(false);
        setScreenNameDraft("");
      }}
      onSave={handleSaveScreenName}
      busy={busy}
      required={needsScreenName}
    />
  ) : null;

  const threadProps = {
    myId,
    isAuthenticated,
    editingId,
    editDraft,
    setEditingId,
    setEditDraft,
    replyTo,
    replyDraft,
    setReplyTo,
    setReplyDraft,
    busy,
    onSaveEdit: handleSaveEdit,
    onDelete: handleDelete,
    onReply: handleReply,
    screenNameGate,
    buildMenuItemHref,
  };

  const canPost = Boolean(draft.trim()) && !busy && (!needsScreenName || screenNameDraft.trim());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.location.hash !== "#food-comments") return undefined;
    const t = window.setTimeout(() => {
      document.getElementById("food-comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [loading, comments.length]);

  return (
    <section
      id="food-comments"
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

      {loading ? (
        <div style={{ fontSize: 13, color: "#78716c" }}>Loading comments…</div>
      ) : null}

      {!loading && !comments.length ? (
        <div style={{ fontSize: 13, color: "#78716c", marginBottom: 12 }}>
          No comments yet. Be the first to share a tip.
        </div>
      ) : null}

      {!loading && isProfileThread && (restaurantComments.length || menuItemComments.length) ? (
        <>
          {restaurantComments.length ? (
            <div data-testid="food-comments-restaurant">
              <div style={sectionTitleStyle(compact)}>Restaurant</div>
              {restaurantSplit.featured.length ? (
                <div
                  data-testid="food-comments-featured"
                  style={{ display: "grid", gap: 8, marginBottom: 14 }}
                >
                  {restaurantSplit.featured.map((c) => (
                    <CommentBody key={`feat-${c.id}`} comment={c} />
                  ))}
                </div>
              ) : null}
              <CommentThreadList
                {...threadProps}
                comments={restaurantSplit.thread}
                showMenuItemLead={false}
              />
            </div>
          ) : null}

          {menuItemComments.length ? (
            <div data-testid="food-comments-menu-items">
              <div style={sectionTitleStyle(compact)}>Menu items</div>
              {menuSplit.featured.length ? (
                <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                  {menuSplit.featured.map((c) => (
                    <CommentBody
                      key={`feat-mi-${c.id}`}
                      comment={c}
                      showMenuItemLead
                      menuItemHref={buildMenuItemHref(c)}
                    />
                  ))}
                </div>
              ) : null}
              <CommentThreadList
                {...threadProps}
                comments={menuSplit.thread}
                showMenuItemLead
              />
            </div>
          ) : null}
        </>
      ) : null}

      {!loading && !isProfileThread ? (
        <>
          {restaurantSplit.featured.length ? (
            <div
              data-testid="food-comments-featured"
              style={{ display: "grid", gap: 8, marginBottom: 14 }}
            >
              {restaurantSplit.featured.map((c) => (
                <CommentBody key={`feat-${c.id}`} comment={c} />
              ))}
            </div>
          ) : null}
          <CommentThreadList
            {...threadProps}
            comments={restaurantSplit.thread}
            showMenuItemLead={false}
          />
        </>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {isAuthenticated ? (
          <form onSubmit={handleCreate} style={{ display: "grid", gap: 8 }}>
            {screenNameGate}
            {isProfileThread ? (
              <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: "#44403c" }}>
                Comment about
                <select
                  value={topicMenuItemId}
                  onChange={(e) => setTopicMenuItemId(e.target.value)}
                  data-testid="food-comment-topic"
                  style={{
                    borderRadius: 10,
                    border: "1px solid #d6d3d1",
                    padding: "8px 10px",
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value={TOPIC_RESTAURANT}>This restaurant</option>
                  {dishOptions.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      Menu item: {dish.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Share a tip about this place or dish…"
              data-testid="food-comment-compose"
              style={textareaStyle}
            />
            <button type="submit" disabled={!canPost} data-testid="food-comment-submit">
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

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid #d6d3d1",
  padding: 10,
  fontSize: 14,
};
