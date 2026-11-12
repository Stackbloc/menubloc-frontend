import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import {
  createFeedComment,
  deleteFeedComment,
  listFeedCommentReplies,
  listFeedComments,
} from "../../../lib/consumerApi.js";
import { dinerPeerProfilePath } from "../../../lib/liveFeedCategory.js";
import { COMMENT_MAX, commentsTitle, commentTimeAgo, newCommentClientKey } from "../../../lib/feedComments.js";
import ClipSafetyMenu from "../../safety/ClipSafetyMenu.jsx";

/**
 * Feed comments sheet (backend mig 0423, flag feed_comments). TikTok-style bottom sheet over the Feed:
 * newest comments first, one level of replies (View n replies / Hide), Reply, Delete your own,
 * Report / Block on others' (ClipSafetyMenu). Sends show at once and can be retried; the client
 * key makes a retry one comment. Comments are plain text (React escapes them; no HTML).
 * The clip keeps its place: the parent holds playback while this is open.
 */

const C = {
  text: "#111613",
  muted: "#5c665f",
  line: "#e1e6e1",
  green: "#0f7a24",
  red: "#b42318",
  surface: "#f4f6f4",
};

const styles = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 250000, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  panel: {
    background: "#fff", color: C.text, width: "100%", maxWidth: 520, height: "min(72vh, 640px)", borderRadius: "16px 16px 0 0",
    display: "flex", flexDirection: "column", boxSizing: "border-box", overflow: "hidden",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "14px 16px 10px", borderBottom: `1px solid ${C.line}` },
  title: { margin: 0, fontSize: 15, fontWeight: 700 },
  close: { position: "absolute", right: 10, top: 8, background: "none", border: 0, fontSize: 22, lineHeight: 1, padding: 6, cursor: "pointer", color: C.muted },
  list: { flex: 1, overflowY: "auto", padding: "6px 16px 12px", overscrollBehavior: "contain" },
  row: { display: "flex", gap: 10, padding: "10px 0", alignItems: "flex-start" },
  rowHighlight: { background: "#fff8db", borderRadius: 10, margin: "0 -8px", padding: "10px 8px" },
  avatar: { width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.muted, border: 0, padding: 0, cursor: "pointer", overflow: "hidden" },
  smallAvatar: { width: 24, height: 24, fontSize: 11 },
  main: { flex: 1, minWidth: 0 },
  name: { background: "none", border: 0, padding: 0, fontSize: 13, fontWeight: 700, color: C.muted, cursor: "pointer" },
  body: { margin: "2px 0 4px", fontSize: 15, lineHeight: 1.35, whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
  replyTo: { color: C.muted, fontWeight: 600 },
  meta: { display: "flex", gap: 14, alignItems: "center", fontSize: 13, color: C.muted },
  metaBtn: { background: "none", border: 0, padding: 0, fontSize: 13, color: C.muted, fontWeight: 600, cursor: "pointer" },
  repliesWrap: { paddingLeft: 42 },
  threadToggle: { background: "none", border: 0, padding: "2px 0 6px 42px", fontSize: 13, fontWeight: 600, color: C.muted, cursor: "pointer" },
  deleted: { margin: "4px 0", fontSize: 14, color: C.muted, fontStyle: "italic" },
  status: { margin: "24px 0", textAlign: "center", fontSize: 14, color: C.muted, lineHeight: 1.45 },
  retry: { background: "none", border: 0, color: C.green, fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0 },
  composer: { borderTop: `1px solid ${C.line}`, padding: "8px 12px calc(8px + env(safe-area-inset-bottom))", background: "#fff" },
  replyChip: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.muted, padding: "2px 4px 6px" },
  inputRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1, resize: "none", fontSize: 15, lineHeight: 1.35, padding: "9px 12px", borderRadius: 18, border: `1px solid ${C.line}`,
    background: C.surface, color: C.text, fontFamily: "inherit", maxHeight: 96, boxSizing: "border-box",
  },
  // Compact text action, no filled pill (Andre: no green pills, no full-width buttons).
  send: { background: "none", border: 0, color: C.green, fontWeight: 700, fontSize: 15, padding: "9px 4px", cursor: "pointer" },
  signIn: { margin: 0, fontSize: 14, color: C.muted, padding: "6px 4px" },
  error: { margin: "4px 4px 0", fontSize: 13, color: C.red },
};

function Avatar({ author, small, onOpen }) {
  const st = { ...styles.avatar, ...(small ? styles.smallAvatar : null) };
  const initial = String(author?.name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <button type="button" style={st} onClick={onOpen} aria-label={`${author?.name || "Diner"} profile`}>
      {author?.avatar_url ? <img src={author.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
    </button>
  );
}

function CommentRow({ c, small = false, highlight = false, signedIn, onReply, onDelete, onOpenProfile, onHidden, onRetry, onInvite }) {
  if (c.deleted) {
    return (
      <div style={styles.row} data-testid="feed-comment-deleted">
        <div style={{ ...styles.avatar, ...(small ? styles.smallAvatar : null), cursor: "default" }} aria-hidden="true" />
        <p style={styles.deleted}>Comment deleted</p>
      </div>
    );
  }
  const sending = c._state === "sending";
  const failed = c._state === "failed";
  return (
    <div style={{ ...styles.row, ...(highlight ? styles.rowHighlight : null), opacity: sending ? 0.6 : 1 }} data-testid="feed-comment" data-comment-id={c.id}>
      <Avatar author={c.author} small={small} onOpen={() => onOpenProfile(c.author)} />
      <div style={styles.main}>
        <button type="button" style={styles.name} onClick={() => onOpenProfile(c.author)}>
          {c.author?.name || "A diner"}
        </button>
        <p style={styles.body}>
          {c.reply_to ? <span style={styles.replyTo}>@{c.reply_to.name} </span> : null}
          {c.body}
        </p>
        <div style={styles.meta}>
          {failed ? (
            <>
              <span style={{ color: C.red }}>Didn&apos;t send.</span>
              <button type="button" style={{ ...styles.metaBtn, color: C.green }} onClick={() => onRetry(c)} data-testid="feed-comment-retry">
                Try again
              </button>
              <button type="button" style={styles.metaBtn} onClick={() => onDelete(c)}>Discard</button>
            </>
          ) : sending ? (
            <span>Posting…</span>
          ) : (
            <>
              <span>{commentTimeAgo(c.created_at)}</span>
              {signedIn ? (
                <button type="button" style={styles.metaBtn} onClick={() => onReply(c)} data-testid="feed-comment-reply">
                  Reply
                </button>
              ) : null}
              {/* Invite to eat (Andre 2026-11-12): only a Connect's comment — in-app invites reach Connects only. */}
              {onInvite && !c.mine && c.author?.connect ? (
                <button type="button" style={styles.metaBtn} onClick={() => onInvite(c)} data-testid="feed-comment-invite">
                  Invite
                </button>
              ) : null}
              {c.mine ? (
                <button type="button" style={styles.metaBtn} onClick={() => onDelete(c)} data-testid="feed-comment-delete">
                  Delete
                </button>
              ) : (
                <ClipSafetyMenu
                  kind="feed_comment"
                  contentId={c.id}
                  dinerId={c.author?.id ?? null}
                  dinerName={c.author?.name || ""}
                  noun="comment"
                  onHidden={() => onHidden(c)}
                  buttonStyle={styles.metaBtn}
                  label="Report or block"
                >
                  Report
                </ClipSafetyMenu>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedCommentsSheet({ open, postId, initialTotal = 0, focusCommentId = null, onClose, onCountChange, onInvite = null }) {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [total, setTotal] = useState(initialTotal);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [threads, setThreads] = useState({}); // parentId → { open, items, cursor, loading, error }
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null); // { parentId, name }
  const [sendError, setSendError] = useState("");
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const sendingRef = useRef(false);
  const reqRef = useRef(0);

  const bumpTotal = useCallback(
    (delta) => {
      setTotal((t) => {
        const next = Math.max(0, t + delta);
        onCountChange?.(next);
        return next;
      });
    },
    [onCountChange]
  );

  const loadFirst = useCallback(async () => {
    if (!postId) return;
    const req = ++reqRef.current;
    setStatus("loading");
    try {
      const res = await listFeedComments(postId);
      if (req !== reqRef.current) return;
      setComments(res.comments || []);
      setCursor(res.next_cursor || null);
      setTotal(Number(res.total) || 0);
      onCountChange?.(Number(res.total) || 0);
      setCanComment(Boolean(res.can_comment));
      setRestaurant(res.restaurant?.id ? res.restaurant : null);
      setStatus("ready");
    } catch (err) {
      if (req !== reqRef.current) return;
      setStatus(err?.payload?.code === "post_unavailable" ? "gone" : "error");
    }
  }, [postId, onCountChange]);

  // Fresh each time the sheet opens on a clip.
  useEffect(() => {
    if (!open) return;
    setComments([]);
    setThreads({});
    setCursor(null);
    setReplyTo(null);
    setSendError("");
    setTotal(initialTotal);
    void loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // From a notification: bring the comment into view once it is loaded.
  useEffect(() => {
    if (!open || !focusCommentId || status !== "ready") return;
    const el = listRef.current?.querySelector(`[data-comment-id="${Number(focusCommentId)}"]`);
    el?.scrollIntoView?.({ block: "center" });
  }, [open, focusCommentId, status, comments]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listFeedComments(postId, { cursor });
      setComments((list) => {
        const seen = new Set(list.map((c) => c.id));
        return [...list, ...(res.comments || []).filter((c) => !seen.has(c.id))];
      });
      setCursor(res.next_cursor || null);
    } catch {
      // The next scroll tries again.
    } finally {
      setLoadingMore(false);
    }
  }

  function onListScroll(e) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) void loadMore();
  }

  async function loadReplies(parentId, more = false) {
    const cur = threads[parentId];
    setThreads((t) => ({ ...t, [parentId]: { items: [], cursor: null, ...cur, open: true, loading: true, error: false } }));
    try {
      const res = await listFeedCommentReplies(parentId, { cursor: more ? cur?.cursor : null });
      setThreads((t) => {
        const prev = t[parentId] || {};
        const base = more ? prev.items || [] : (prev.items || []).filter((r) => r._state);
        const seen = new Set(base.map((r) => r.id));
        return {
          ...t,
          [parentId]: { ...prev, open: true, loading: false, items: [...base, ...(res.replies || []).filter((r) => !seen.has(r.id))], cursor: res.next_cursor || null },
        };
      });
    } catch {
      setThreads((t) => ({ ...t, [parentId]: { ...(t[parentId] || {}), loading: false, error: true } }));
    }
  }

  function toggleThread(parentId) {
    const th = threads[parentId];
    if (th?.open) setThreads((t) => ({ ...t, [parentId]: { ...th, open: false } }));
    else if (th?.items?.length && !th.error) setThreads((t) => ({ ...t, [parentId]: { ...th, open: true } }));
    else void loadReplies(parentId);
  }

  function openProfile(author) {
    const path = dinerPeerProfilePath(author?.id);
    if (!path) return;
    onClose?.();
    navigate(path);
  }

  function startReply(c) {
    const parentId = c.parent_id ?? c.id;
    setReplyTo({ parentId, targetId: c.id, name: c.author?.name || "this diner" });
    inputRef.current?.focus();
  }

  function replaceItem(tempId, parentId, next) {
    if (parentId) {
      setThreads((t) => {
        const th = t[parentId] || { items: [] };
        return { ...t, [parentId]: { ...th, items: (th.items || []).map((r) => (r.id === tempId ? next : r)) } };
      });
    } else {
      setComments((list) => list.map((c) => (c.id === tempId ? next : c)));
    }
  }

  function removeItem(id, parentId) {
    if (parentId) {
      setThreads((t) => {
        const th = t[parentId] || { items: [] };
        return { ...t, [parentId]: { ...th, items: (th.items || []).filter((r) => r.id !== id) } };
      });
    } else {
      setComments((list) => list.filter((c) => c.id !== id));
    }
  }

  async function send(item) {
    const parentId = item.parent_id || null;
    try {
      const res = await createFeedComment(postId, { body: item.body, parentId: item._targetId || parentId, clientKey: item._clientKey });
      replaceItem(item.id, parentId, { ...res.comment, _state: undefined });
      if (res.created !== false) {
        bumpTotal(1);
        if (parentId) setComments((list) => list.map((c) => (c.id === parentId ? { ...c, reply_count: (c.reply_count || 0) + 1 } : c)));
      }
    } catch (err) {
      const code = err?.payload?.code;
      // Refusals that a retry won't fix: take the comment back out and say why.
      if (err?.status && err.status < 500 && code !== "comment_rate_limited") {
        removeItem(item.id, parentId);
        setDraft(item.body);
        setSendError(err.message || "Couldn't post that.");
        return;
      }
      if (code === "comment_rate_limited") setSendError(err.message);
      replaceItem(item.id, parentId, { ...item, _state: "failed" });
    }
  }

  async function submit(e) {
    e?.preventDefault?.();
    const body = draft.trim();
    if (!body || sendingRef.current) return;
    sendingRef.current = true;
    setSendError("");
    const parentId = replyTo?.parentId || null;
    const temp = {
      id: `tmp-${Date.now()}`,
      post: postId,
      parent_id: parentId,
      body,
      created_at: new Date().toISOString(),
      author: { id: null, name: "You", avatar_url: null },
      reply_to: replyTo && replyTo.targetId !== replyTo.parentId ? { name: replyTo.name } : null,
      reply_count: 0,
      mine: true,
      _state: "sending",
      _clientKey: newCommentClientKey(),
      _targetId: replyTo?.targetId || null,
    };
    if (parentId) {
      setThreads((t) => {
        const th = t[parentId] || { items: [], cursor: null };
        return { ...t, [parentId]: { ...th, open: true, items: [...(th.items || []), temp] } };
      });
    } else {
      setComments((list) => [temp, ...list]);
      listRef.current?.scrollTo?.({ top: 0 });
    }
    setDraft("");
    setReplyTo(null);
    try {
      await send(temp);
    } finally {
      sendingRef.current = false;
    }
  }

  function retry(item) {
    replaceItem(item.id, item.parent_id || null, { ...item, _state: "sending" });
    void send({ ...item, _state: "sending" });
  }

  async function remove(c) {
    const parentId = c.parent_id || null;
    if (c._state) {
      removeItem(c.id, parentId);
      return;
    }
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteFeedComment(c.id);
      bumpTotal(-1);
      if (parentId) {
        removeItem(c.id, parentId);
        setComments((list) => list.map((x) => (x.id === parentId ? { ...x, reply_count: Math.max(0, (x.reply_count || 0) - 1) } : x)));
      } else if ((c.reply_count || 0) > 0) {
        setComments((list) => list.map((x) => (x.id === c.id ? { ...x, deleted: true, body: null, author: null, mine: false } : x)));
      } else {
        removeItem(c.id, null);
      }
    } catch (err) {
      setSendError(err?.message || "Couldn't delete that. Try again.");
    }
  }

  // Reported or blocked from a comment: it leaves this sheet now (the server leaves it out next time).
  function hide(c) {
    removeItem(c.id, c.parent_id || null);
  }

  if (!open) return null;
  const stop = (e) => e.stopPropagation();
  // The Feed opens its invite dialog once this sheet is closed (one dialog at a time).
  const inviteToEat = onInvite && restaurant ? (c) => { onClose?.(); onInvite({ userId: c.author.id, name: c.author.name }, restaurant); } : null;
  const rowProps = { signedIn: isAuthenticated, onReply: startReply, onDelete: remove, onOpenProfile: openProfile, onHidden: hide, onRetry: retry, onInvite: inviteToEat };
  const loginTo = `/account/login?next=${encodeURIComponent(location.pathname + location.search)}`;

  const ui = (
    <div
      style={styles.backdrop}
      onClick={onClose}
      onTouchStart={stop}
      onTouchEnd={stop}
      onWheel={stop}
      role="presentation"
      data-testid="feed-comments-backdrop"
    >
      <div style={styles.panel} onClick={stop} role="dialog" aria-modal="true" aria-label="Comments" data-testid="feed-comments-sheet">
        <div style={styles.header}>
          <p style={styles.title}>{status === "ready" ? commentsTitle(total) : "Comments"}</p>
          <button type="button" style={styles.close} onClick={onClose} aria-label="Close comments">
            ×
          </button>
        </div>

        <div style={styles.list} ref={listRef} onScroll={onListScroll}>
          {status === "loading" ? <p style={styles.status}>Loading comments…</p> : null}
          {status === "error" ? (
            <p style={styles.status}>
              Couldn&apos;t load comments.{" "}
              <button type="button" style={styles.retry} onClick={loadFirst}>
                Try again
              </button>
            </p>
          ) : null}
          {status === "gone" ? <p style={styles.status}>This clip isn&apos;t available anymore.</p> : null}
          {status === "ready" && comments.length === 0 ? (
            <p style={styles.status} data-testid="feed-comments-empty">
              No comments yet.
              <br />
              Start the conversation.
            </p>
          ) : null}
          {comments.map((c) => {
            const th = threads[c.id];
            const loadedReplies = th?.items?.filter((r) => !r._state).length || 0;
            const more = Math.max(0, (c.reply_count || 0) - loadedReplies);
            return (
              <div key={c.id}>
                <CommentRow c={c} highlight={Number(focusCommentId) === Number(c.id)} {...rowProps} />
                {th?.open ? (
                  <div style={styles.repliesWrap}>
                    {(th.items || []).map((r) => (
                      <CommentRow key={r.id} c={r} small highlight={Number(focusCommentId) === Number(r.id)} {...rowProps} />
                    ))}
                  </div>
                ) : null}
                {c.reply_count > 0 || th?.items?.length ? (
                  th?.loading ? (
                    <p style={{ ...styles.threadToggle, cursor: "default" }}>Loading replies…</p>
                  ) : th?.error ? (
                    <button type="button" style={styles.threadToggle} onClick={() => loadReplies(c.id)}>
                      Couldn&apos;t load replies. Try again
                    </button>
                  ) : th?.open && th.cursor ? (
                    <button type="button" style={styles.threadToggle} onClick={() => loadReplies(c.id, true)}>
                      View more replies
                    </button>
                  ) : th?.open ? (
                    <button type="button" style={styles.threadToggle} onClick={() => toggleThread(c.id)} data-testid="feed-comment-hide-replies">
                      Hide replies
                    </button>
                  ) : (
                    <button type="button" style={styles.threadToggle} onClick={() => toggleThread(c.id)} data-testid="feed-comment-view-replies">
                      {`View ${more || c.reply_count} ${(more || c.reply_count) === 1 ? "reply" : "replies"}`}
                    </button>
                  )
                ) : null}
              </div>
            );
          })}
          {loadingMore ? <p style={styles.status}>Loading…</p> : null}
        </div>

        <div style={styles.composer}>
          {!isAuthenticated ? (
            <p style={styles.signIn}>
              <Link to={loginTo} style={{ color: C.green, fontWeight: 600 }}>
                Sign in
              </Link>{" "}
              to comment.
            </p>
          ) : status === "ready" && !canComment ? (
            <p style={styles.signIn}>You can&apos;t comment on this clip.</p>
          ) : (
            <form onSubmit={submit}>
              {replyTo ? (
                <div style={styles.replyChip}>
                  <span>Replying to {replyTo.name}</span>
                  <button type="button" style={styles.metaBtn} onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                    ×
                  </button>
                </div>
              ) : null}
              <div style={styles.inputRow}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  maxLength={COMMENT_MAX}
                  placeholder={replyTo ? `Reply to ${replyTo.name}…` : "Add a comment…"}
                  aria-label={replyTo ? `Reply to ${replyTo.name}` : "Add a comment"}
                  style={styles.input}
                  data-testid="feed-comment-input"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                />
                <button type="submit" style={{ ...styles.send, opacity: draft.trim() ? 1 : 0.4 }} disabled={!draft.trim()} data-testid="feed-comment-send">
                  Post
                </button>
              </div>
              {sendError ? (
                <p style={styles.error} role="alert">
                  {sendError}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(ui, document.body);
}
