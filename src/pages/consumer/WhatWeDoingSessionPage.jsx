/**
 * What We Doing? session room — suggest, vote, make a plan.
 * Route: /account/what-we-doing/:token
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  addWhatWeDoingSuggestion,
  closeWhatWeDoingVoting,
  getWhatWeDoingSession,
  makeWhatWeDoingPlan,
  joinWhatWeDoingSession,
  searchWhatWeDoingEvents,
  searchWhatWeDoingRestaurants,
  searchWhatWeDoingVenues,
  voteWhatWeDoing,
} from "../../lib/consumerApi.js";
import { menuplyWhatWeDoingUrl } from "../../lib/whatWeDoingTitle.js";
import { normalizeConsumerShareUrl } from "../../components/share/shareUtils.js";

export default function WhatWeDoingSessionPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [suggestKind, setSuggestKind] = useState("restaurant");
  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState([]);
  const [customText, setCustomText] = useState("");
  const [planOut, setPlanOut] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getWhatWeDoingSession(token);
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err.message || "Unable to load session");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(
        `/account/login?next=${encodeURIComponent(`/account/what-we-doing/${token}`)}`,
        { replace: true }
      );
      return;
    }
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, navigate, load, token]);

  async function runSearch() {
    const q = searchQ.trim();
    if (q.length < 2) {
      setSearchHits([]);
      return;
    }
    try {
      let data;
      if (suggestKind === "restaurant") data = await searchWhatWeDoingRestaurants(q);
      else if (suggestKind === "venue") data = await searchWhatWeDoingVenues(q);
      else data = await searchWhatWeDoingEvents(q);
      setSearchHits(data.results || []);
    } catch (err) {
      setError(err.message || "Search failed");
    }
  }

  async function proposeEntity(hit) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body =
        suggestKind === "restaurant"
          ? { kind: "restaurant", restaurant_id: hit.id }
          : suggestKind === "venue"
            ? { kind: "venue", venue_restaurant_id: hit.id }
            : { kind: "event", venue_event_id: hit.id };
      const data = await addWhatWeDoingSuggestion(token, body);
      setPayload(data);
      setSearchHits([]);
      setSearchQ("");
      setNotice("Suggestion added.");
    } catch (err) {
      setError(err.message || "Unable to suggest");
    } finally {
      setBusy(false);
    }
  }

  async function proposeCustom(e) {
    e.preventDefault();
    if (!customText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const data = await addWhatWeDoingSuggestion(token, {
        kind: "custom",
        custom_text: customText.trim(),
      });
      setPayload(data);
      setCustomText("");
      setNotice("Suggestion added.");
    } catch (err) {
      setError(err.message || "Unable to suggest");
    } finally {
      setBusy(false);
    }
  }

  async function onVote(suggestionId) {
    setBusy(true);
    setError("");
    try {
      const data = await voteWhatWeDoing(token, suggestionId);
      setPayload(data);
    } catch (err) {
      setError(err.message || "Unable to vote");
    } finally {
      setBusy(false);
    }
  }

  async function onCloseVoting() {
    setBusy(true);
    setError("");
    try {
      const data = await closeWhatWeDoingVoting(token);
      setPayload(data);
      setNotice("Voting closed.");
    } catch (err) {
      setError(err.message || "Unable to close voting");
    } finally {
      setBusy(false);
    }
  }

  async function onMakePlan(suggestionId = null) {
    setBusy(true);
    setError("");
    setPlanOut(null);
    try {
      const data = await makeWhatWeDoingPlan(
        token,
        suggestionId ? { suggestion_id: suggestionId } : {}
      );
      setPayload(data);
      setPlanOut(data.plan || null);
      setNotice("Plan created.");
    } catch (err) {
      setError(err.message || "Unable to make plan");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    setBusy(true);
    setError("");
    try {
      const data = await joinWhatWeDoingSession(token);
      setPayload(data);
      setNotice("You're on this plan.");
    } catch (err) {
      setError(err.message || "Unable to join");
    } finally {
      setBusy(false);
    }
  }

  const session = payload?.session;
  const suggestions = payload?.suggestions || [];
  const shareUrl = normalizeConsumerShareUrl(menuplyWhatWeDoingUrl(token));
  const open = session?.status === "open";
  const isCreator = session?.is_creator;

  return (
    <>
      <StickyPageHeader title="What We Doing?" />
      <div style={styles.page}>
        {loading || authLoading ? (
          <p style={styles.muted}>Loading…</p>
        ) : error && !session ? (
          <p style={styles.error}>{error}</p>
        ) : (
          <>
            <h1 style={styles.title}>{session?.title}</h1>
            {session?.restaurant_name || session?.place_label ? (
              <p style={styles.meta}>{session.restaurant_name || session.place_label}</p>
            ) : null}
            {payload?.can_join ? (
              <button type="button" style={styles.primary} disabled={busy} onClick={onJoin}>
                {busy ? "…" : "Join this plan"}
              </button>
            ) : null}
            <p style={styles.meta}>
              Status: <strong>{session?.status}</strong>
              {session?.voting_closes_at
                ? ` · Closes ${new Date(session.voting_closes_at).toLocaleString()}`
                : ""}
            </p>
            <p style={styles.muted}>
              {payload?.participants?.length || 0} people · My vote:{" "}
              {payload?.my_vote_suggestion_id
                ? suggestions.find((s) => s.id === payload.my_vote_suggestion_id)?.label ||
                  "selected"
                : "none yet"}
            </p>

            <div style={styles.actionsRow}>
              <button type="button" style={styles.secondary} onClick={() => setShareOpen(true)}>
                Share link
              </button>
              {isCreator && open ? (
                <button type="button" style={styles.secondary} disabled={busy} onClick={onCloseVoting}>
                  Close voting
                </button>
              ) : null}
              {isCreator && session?.status !== "planned" && session?.status !== "cancelled" ? (
                <button
                  type="button"
                  style={styles.primary}
                  disabled={busy || suggestions.length === 0}
                  onClick={() => onMakePlan()}
                >
                  Make It a Plan
                </button>
              ) : null}
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
            {notice ? <p style={styles.notice}>{notice}</p> : null}
            {planOut ? (
              <div style={styles.planBox}>
                <strong>Plan ready</strong>
                {planOut.invite_url ? (
                  <p>
                    <Link to={planOut.invite_url.replace(/^https:\/\/menuply\.com/, "")}>
                      Open Invite to Eat
                    </Link>
                  </p>
                ) : null}
                {planOut.event_path ? (
                  <p>
                    <Link to={planOut.event_path}>Open event</Link>
                  </p>
                ) : null}
                {planOut.restaurant_path ? (
                  <p>
                    <Link to={planOut.restaurant_path}>Open venue</Link>
                  </p>
                ) : null}
              </div>
            ) : null}

            {payload?.is_participant === false ? null : (
            <>
            <h2 style={styles.h2}>Suggestions</h2>
            {suggestions.length === 0 ? (
              <p style={styles.muted}>No suggestions yet — be the first.</p>
            ) : (
              <ul style={styles.list}>
                {suggestions.map((s) => {
                  const isMine = payload?.my_vote_suggestion_id === s.id;
                  const isLead = payload?.leading_suggestion_id === s.id;
                  return (
                    <li key={s.id} style={styles.card}>
                      <div style={styles.cardTop}>
                        <span style={styles.kind}>{s.kind}</span>
                        {isLead ? <span style={styles.lead}>Leading</span> : null}
                        {isMine ? <span style={styles.mine}>My vote</span> : null}
                      </div>
                      <div style={styles.cardTitle}>{s.label}</div>
                      <div style={styles.votes}>{s.vote_count} vote{s.vote_count === 1 ? "" : "s"}</div>
                      {open ? (
                        <button
                          type="button"
                          style={isMine ? styles.votedBtn : styles.voteBtn}
                          disabled={busy}
                          onClick={() => onVote(s.id)}
                        >
                          {isMine ? "Voted" : "Vote"}
                        </button>
                      ) : isCreator && session?.status === "voting_closed" ? (
                        <button
                          type="button"
                          style={styles.voteBtn}
                          disabled={busy}
                          onClick={() => onMakePlan(s.id)}
                        >
                          Choose this
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {open ? (
              <section style={styles.suggestBox}>
                <h2 style={styles.h2}>Add a suggestion</h2>
                <div style={styles.kindRow}>
                  {["restaurant", "venue", "event", "custom"].map((k) => (
                    <button
                      key={k}
                      type="button"
                      style={suggestKind === k ? styles.kindOn : styles.kindOff}
                      onClick={() => {
                        setSuggestKind(k);
                        setSearchHits([]);
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                {suggestKind === "custom" ? (
                  <form onSubmit={proposeCustom} style={{ display: "grid", gap: 8 }}>
                    <input
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Something to do…"
                      style={styles.input}
                      maxLength={280}
                    />
                    <button type="submit" style={styles.primary} disabled={busy}>
                      Suggest
                    </button>
                  </form>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder={`Search ${suggestKind}…`}
                      style={styles.input}
                    />
                    <button type="button" style={styles.secondary} onClick={runSearch}>
                      Search
                    </button>
                    <ul style={styles.hits}>
                      {searchHits.map((hit) => (
                        <li key={`${hit.kind}-${hit.id}`}>
                          <button
                            type="button"
                            style={styles.hitBtn}
                            disabled={busy}
                            onClick={() => proposeEntity(hit)}
                          >
                            {hit.name}
                            {hit.city ? ` · ${hit.city}` : ""}
                            {hit.venue_name ? ` @ ${hit.venue_name}` : ""}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ) : null}
            </>
            )}

            <p style={styles.back}>
              <Link to="/account/what-we-doing" style={styles.link}>
                ← All plans
              </Link>
            </p>
          </>
        )}
      </div>
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareData={
          shareUrl
            ? {
                title: session?.title || "What We Doing?",
                text: session?.title || "Join our plan on Menuply",
                url: shareUrl,
              }
            : null
        }
        modalTitle="Share plan"
      />
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "16px 16px 96px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  },
  title: { margin: "0 0 8px", fontSize: 24, fontWeight: 800, lineHeight: 1.2 },
  meta: { margin: 0, fontSize: 13, color: "#334155" },
  muted: { color: "#64748b", fontSize: 13 },
  error: { color: "#b91c1c", fontWeight: 600 },
  notice: { color: "#166534", fontWeight: 600 },
  actionsRow: { display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" },
  primary: {
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(90deg, #16a34a, #22c55e)",
    color: "#052e16",
    fontWeight: 800,
    padding: "10px 14px",
    cursor: "pointer",
  },
  secondary: {
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    background: "#fff",
    fontWeight: 700,
    padding: "10px 14px",
    cursor: "pointer",
  },
  h2: { fontSize: 16, marginTop: 20 },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    background: "#fff",
  },
  cardTop: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 },
  kind: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    color: "#16a34a",
  },
  lead: {
    fontSize: 11,
    fontWeight: 800,
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 999,
    padding: "2px 8px",
  },
  mine: {
    fontSize: 11,
    fontWeight: 800,
    background: "#dcfce7",
    color: "#14532d",
    borderRadius: 999,
    padding: "2px 8px",
  },
  cardTitle: { fontWeight: 800, fontSize: 16 },
  votes: { color: "#64748b", fontSize: 13, margin: "4px 0 10px" },
  voteBtn: {
    border: "1px solid #16a34a",
    background: "#fff",
    color: "#14532d",
    borderRadius: 10,
    fontWeight: 700,
    padding: "8px 12px",
    cursor: "pointer",
  },
  votedBtn: {
    border: "none",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 10,
    fontWeight: 700,
    padding: "8px 12px",
  },
  suggestBox: {
    marginTop: 24,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 16,
  },
  kindRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  kindOn: {
    border: "none",
    background: "#14532d",
    color: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: 12,
    textTransform: "capitalize",
  },
  kindOff: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "capitalize",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 15,
  },
  hits: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 },
  hitBtn: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#f8fafc",
    cursor: "pointer",
  },
  planBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
  },
  back: { marginTop: 24 },
  link: { color: "#166534", fontWeight: 700, textDecoration: "none" },
};
