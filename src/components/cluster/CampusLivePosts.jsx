/**
 * Campus live posts — text only (no video; USC rules). Comment button, Everyone / Connects tabs,
 * recent posts (48h window, newest first), venue filter, report + hide.
 * Guests can post. Connects tab only for signed-in viewers who have Connects.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchClusterLivePosts,
  reportClusterLivePost,
  toggleClusterLivePostRsvp,
} from "../../lib/clusterApi.js";
import { getOrCreateGuestReporterKey } from "../../lib/guestReporterSession.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import ConnectPill from "../connect/ConnectPill.jsx";
import CampusLiveComposerSheet from "./CampusLiveComposerSheet.jsx";

const INITIAL_VISIBLE = 3;
const HIDDEN_POSTS_KEY = "menuply_cluster_hidden_posts_v1";
const REFRESH_MS = 45000;

function readHiddenPostIds() {
  try {
    const raw = window.localStorage.getItem(HIDDEN_POSTS_KEY);
    const list = JSON.parse(raw || "[]");
    return new Set(Array.isArray(list) ? list.map(Number).filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function writeHiddenPostIds(ids) {
  try {
    window.localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {
    /* per-device convenience only */
  }
}

function PostHeader({ post }) {
  const author = post.author || {};
  const name = author.is_guest ? "Guest" : author.label || "Diner";
  const nameNode =
    !author.is_guest && author.user_id ? (
      <Link to={`/diners/${author.user_id}`} style={styles.authorLink}>
        {name}
      </Link>
    ) : (
      <span style={styles.author}>{name}</span>
    );
  return (
    <div style={styles.postHeader} data-testid="campus-post-header">
      {nameNode}
      {post.is_connect ? <ConnectPill data-testid="campus-post-connect" /> : null}
      {post.venue_name ? (
        <span style={styles.venuePill} data-testid="campus-post-venue">
          {post.venue_name}
        </span>
      ) : null}
      {post.age_label ? <span style={styles.age}>{post.age_label}</span> : null}
    </div>
  );
}

function formatPlanTime(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

function goingLine(rsvp) {
  if (!rsvp || !rsvp.count) return "";
  const names = Array.isArray(rsvp.names) ? rsvp.names : [];
  const others = Number(rsvp.others) || 0;
  if (!names.length) return `${others} going`;
  return `${names.join(", ")}${others ? ` +${others}` : ""} going`;
}

function PlanBlock({ post, onRsvp, busy }) {
  const rsvp = post.rsvp || { count: 0, viewer_in: false };
  const going = goingLine(rsvp);
  return (
    <div style={styles.planRow} data-testid="campus-post-plan">
      <span style={styles.planTime}>Around {formatPlanTime(post.plan_time)}</span>
      <button
        type="button"
        data-testid="campus-post-rsvp"
        aria-pressed={Boolean(rsvp.viewer_in)}
        disabled={busy}
        onClick={() => onRsvp(post)}
        style={{ ...styles.rsvpButton, ...(rsvp.viewer_in ? styles.rsvpOn : null) }}
      >
        {rsvp.viewer_in ? "You're in" : "I'm in"}
      </button>
      {going ? <span style={styles.going} data-testid="campus-post-going">{going}</span> : null}
    </div>
  );
}

function PostCard({ post, highlighted, onReport, onHide, reported, onRsvp, rsvpBusy }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <li
      data-testid="campus-post"
      data-post-id={post.id}
      style={{ ...styles.post, ...(highlighted ? styles.postHighlight : null) }}
    >
      <div style={styles.postTop}>
        <PostHeader post={post} />
        <button
          type="button"
          aria-label="Post options"
          data-testid="campus-post-menu"
          style={styles.menuButton}
          onClick={() => setMenuOpen((v) => !v)}
        >
          ···
        </button>
      </div>
      {post.body ? <p style={styles.body}>{post.body}</p> : null}
      {post.type === "plan" ? <PlanBlock post={post} onRsvp={onRsvp} busy={rsvpBusy} /> : null}
      {menuOpen ? (
        <div style={styles.menuRow}>
          <button
            type="button"
            data-testid="campus-post-report"
            style={styles.menuAction}
            disabled={reported}
            onClick={() => {
              setMenuOpen(false);
              onReport(post);
            }}
          >
            {reported ? "Reported" : "Report"}
          </button>
          <button
            type="button"
            data-testid="campus-post-hide"
            style={styles.menuAction}
            onClick={() => {
              setMenuOpen(false);
              onHide(post);
            }}
          >
            Hide
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default function CampusLivePosts({
  clusterSlug,
  clusterName = "",
  venues = [],
  venueFilter = null,
  onClearVenueFilter = null,
  onLiveRefresh = null,
}) {
  const { isAuthenticated } = useConsumer();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("everyone");
  const [expanded, setExpanded] = useState(false);
  const [hiddenIds, setHiddenIds] = useState(() => readHiddenPostIds());
  const [reportedIds, setReportedIds] = useState(() => new Set());
  const [highlightId, setHighlightId] = useState(null);
  const [composer, setComposer] = useState(null);
  const [rsvpBusyId, setRsvpBusyId] = useState(null);
  const listRef = useRef(null);

  const filterId = venueFilter?.restaurant_id ? Number(venueFilter.restaurant_id) : null;

  const load = useCallback(() => {
    if (!clusterSlug) return Promise.resolve(null);
    return fetchClusterLivePosts(clusterSlug, {
      guestKey: isAuthenticated ? null : getOrCreateGuestReporterKey(),
      restaurantId: filterId,
    })
      .then((res) => {
        setData(res || null);
        return res;
      })
      .catch(() => null);
  }, [clusterSlug, isAuthenticated, filterId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    setExpanded(false);
  }, [filterId, tab]);

  const connectsTab = Boolean(isAuthenticated && data?.connects_tab);
  useEffect(() => {
    if (!connectsTab && tab !== "everyone") setTab("everyone");
  }, [connectsTab, tab]);

  const posts = useMemo(() => {
    const all = Array.isArray(data?.posts) ? data.posts : [];
    return all.filter(
      (p) => !hiddenIds.has(Number(p.id)) && (tab === "everyone" || p.is_connect)
    );
  }, [data, hiddenIds, tab]);

  const visible = expanded ? posts : posts.slice(0, INITIAL_VISIBLE);
  const moreCount = Math.max(0, posts.length - INITIAL_VISIBLE);
  const maxChars = Number(data?.limits?.max_chars) || 140;

  function handlePosted(post) {
    if (!post) return;
    setData((prev) => {
      const prior = Array.isArray(prev?.posts) ? prev.posts : [];
      return { ...(prev || {}), posts: [post, ...prior.filter((p) => p.id !== post.id)] };
    });
    setTab("everyone");
    setHighlightId(post.id);
    setTimeout(() => setHighlightId(null), 2400);
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleReport(post) {
    try {
      const res = await reportClusterLivePost(clusterSlug, post.id, {
        guest_key: isAuthenticated ? undefined : getOrCreateGuestReporterKey(),
      });
      setReportedIds((prev) => new Set(prev).add(Number(post.id)));
      if (res?.hidden) load();
    } catch {
      /* best-effort; the menu stays usable */
    }
  }

  async function handleRsvp(post) {
    if (rsvpBusyId) return;
    setRsvpBusyId(post.id);
    try {
      const res = await toggleClusterLivePostRsvp(clusterSlug, post.id, {
        guest_key: isAuthenticated ? undefined : getOrCreateGuestReporterKey(),
      });
      if (res?.rsvp) {
        setData((prev) => ({
          ...(prev || {}),
          posts: (prev?.posts || []).map((p) => (p.id === post.id ? { ...p, rsvp: res.rsvp } : p)),
        }));
      }
    } catch {
      load();
    } finally {
      setRsvpBusyId(null);
    }
  }

  function handleHide(post) {
    setHiddenIds((prev) => {
      const next = new Set(prev).add(Number(post.id));
      writeHiddenPostIds(next);
      return next;
    });
  }

  if (!clusterSlug) return null;

  const placeLabel = clusterName ? `${clusterName} Cluster` : "this cluster";

  return (
    <div id="cluster-live-posts" data-testid="campus-live-posts" style={styles.wrap}>
      <div style={styles.actions}>
        <button
          type="button"
          data-testid="campus-live-comment-button"
          style={styles.actionButton}
          onClick={() => setComposer({ mode: "comment" })}
        >
          Comment
        </button>
      </div>

      {connectsTab ? (
        <div style={styles.tabs} role="tablist" data-testid="campus-live-tabs">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "everyone"}
            style={{ ...styles.tab, ...(tab === "everyone" ? styles.tabActive : null) }}
            onClick={() => setTab("everyone")}
          >
            Everyone
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "connects"}
            data-testid="campus-live-tab-connects"
            style={{ ...styles.tab, ...(tab === "connects" ? styles.tabActive : null) }}
            onClick={() => setTab("connects")}
          >
            Connects {Number(data?.connects_count) > 0 ? `(${data.connects_count})` : ""}
          </button>
        </div>
      ) : null}

      {venueFilter ? (
        <div style={styles.filterBar} data-testid="campus-live-filter-bar">
          <span style={styles.filterText}>{venueFilter.name || "This place"}</span>
          <button
            type="button"
            data-testid="campus-live-show-all"
            style={styles.showAll}
            onClick={() => onClearVenueFilter && onClearVenueFilter()}
          >
            Show all
          </button>
        </div>
      ) : null}

      <ul style={styles.list} ref={listRef} data-testid="campus-live-post-list">
        {visible.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            highlighted={highlightId === post.id}
            reported={reportedIds.has(Number(post.id))}
            onReport={handleReport}
            onHide={handleHide}
            onRsvp={handleRsvp}
            rsvpBusy={rsvpBusyId === post.id}
          />
        ))}
      </ul>

      {/* Empty-state copy only when the whole recent window is empty (not a venue filter). */}
      {!loading && !venueFilter && posts.length === 0 ? (
        <p style={styles.muted} data-testid="cluster-feed-empty">
          Quiet so far today — check back when people post.
        </p>
      ) : null}

      {moreCount > 0 ? (
        <button
          type="button"
          data-testid="campus-live-show-more"
          style={styles.moreButton}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : `Show ${moreCount} more`}
        </button>
      ) : null}

      <CampusLiveComposerSheet
        open={Boolean(composer)}
        onClose={() => setComposer(null)}
        clusterSlug={clusterSlug}
        placeLabel={placeLabel}
        venues={venues}
        initialVenueId={filterId}
        maxChars={maxChars}
        onPosted={(post) => {
          setComposer(null);
          handlePosted(post);
        }}
        onLiveRefresh={onLiveRefresh}
      />
    </div>
  );
}

const styles = {
  wrap: { margin: "4px 0 18px" },
  actions: { display: "flex", gap: 8, marginBottom: 10 },
  actionButton: {
    flex: 1,
    border: "1px solid #d1d5db",
    background: "#fff",
    borderRadius: 999,
    padding: "9px 12px",
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    cursor: "pointer",
  },
  tabs: { display: "flex", gap: 6, marginBottom: 8 },
  tab: {
    border: "none",
    background: "transparent",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
    cursor: "pointer",
  },
  tabActive: { background: "#ecfdf5", color: "#065f46" },
  filterBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    background: "#f3f4f6",
    borderRadius: 10,
    padding: "6px 10px",
    marginBottom: 8,
  },
  filterText: { fontSize: 13, fontWeight: 700, color: "#111827" },
  showAll: {
    border: "none",
    background: "transparent",
    fontSize: 13,
    fontWeight: 700,
    color: "#166534",
    cursor: "pointer",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    borderTop: "1px solid #e5e7eb",
  },
  post: {
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
    transition: "background 0.6s ease",
  },
  postHighlight: { background: "#ecfdf5" },
  postTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  postHeader: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, minWidth: 0 },
  author: { fontSize: 14, fontWeight: 700, color: "#111827" },
  authorLink: { fontSize: 14, fontWeight: 700, color: "#111827", textDecoration: "none" },
  venuePill: {
    fontSize: 11,
    fontWeight: 700,
    color: "#374151",
    background: "#f3f4f6",
    borderRadius: 999,
    padding: "1px 7px",
  },
  age: { fontSize: 12, color: "#6b7280" },
  body: { margin: "4px 0 0", fontSize: 14, color: "#374151", lineHeight: 1.4 },
  menuButton: {
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
    padding: "2px 4px",
  },
  menuRow: { display: "flex", gap: 8, marginTop: 6 },
  menuAction: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    cursor: "pointer",
  },
  muted: { fontSize: 13, color: "#6b7280", margin: "8px 0" },
  planRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 6 },
  planTime: { fontSize: 13, fontWeight: 700, color: "#111827" },
  rsvpButton: {
    border: "1px solid #059669",
    background: "#fff",
    color: "#065f46",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  rsvpOn: { background: "#059669", color: "#fff" },
  going: { fontSize: 12, color: "#4b5563" },
  moreButton: {
    marginTop: 8,
    border: "none",
    background: "transparent",
    fontSize: 14,
    fontWeight: 700,
    color: "#166534",
    cursor: "pointer",
    padding: 0,
  },
};
