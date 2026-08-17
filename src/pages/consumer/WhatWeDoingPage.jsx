/**
 * What We Doing? — list + create planning sessions.
 * Route: /account/what-we-doing
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  createWhatWeDoingSession,
  listConnections,
  listDiningCrews,
  listWhatWeDoingSessions,
} from "../../lib/consumerApi.js";
import { formatWhatWeDoingTitle } from "../../lib/whatWeDoingTitle.js";

export default function WhatWeDoingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [planDate, setPlanDate] = useState("");
  const [votingClosesAt, setVotingClosesAt] = useState("");
  const [connections, setConnections] = useState([]);
  const [crews, setCrews] = useState([]);
  const [selectedPeers, setSelectedPeers] = useState(() => new Set());
  const [crewId, setCrewId] = useState("");

  const titlePreview = useMemo(() => formatWhatWeDoingTitle(planDate), [planDate]);

  const load = useCallback(async () => {
    setError("");
    try {
      const [sess, conn, crewList] = await Promise.all([
        listWhatWeDoingSessions(),
        listConnections("accepted"),
        listDiningCrews(),
      ]);
      setSessions(sess.sessions || []);
      setConnections(conn.accepted || []);
      setCrews(crewList.crews || crewList.items || []);
    } catch (err) {
      setError(err.message || "Unable to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/what-we-doing")}`, {
        replace: true,
      });
      return;
    }
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, navigate, load]);

  useEffect(() => {
    const withId = Number(searchParams.get("with"));
    if (!Number.isFinite(withId) || withId <= 0) return;
    setSelectedPeers((prev) => {
      if (prev.has(withId)) return prev;
      const next = new Set(prev);
      next.add(withId);
      return next;
    });
  }, [searchParams]);

  function togglePeer(id) {
    setSelectedPeers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onCreate(e) {
    e.preventDefault();
    if (!planDate) {
      setError("Pick a date");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = {
        plan_date: planDate,
        connection_user_ids: [...selectedPeers],
      };
      if (crewId) body.dining_crew_id = Number(crewId);
      if (votingClosesAt) {
        body.voting_closes_at = new Date(votingClosesAt).toISOString();
      }
      const data = await createWhatWeDoingSession(body);
      const token = data?.session?.token;
      if (token) navigate(`/account/what-we-doing/${token}`);
      else await load();
    } catch (err) {
      setError(err.message || "Unable to create");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="What We Doing?" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Ask your Connections or a Dining Crew what to do — suggest places, vote, then make it a
          plan.
        </p>
        {error ? <p style={styles.error}>{error}</p> : null}

        <form onSubmit={onCreate} style={styles.card}>
          <label style={styles.label}>
            When?
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              style={styles.input}
              required
            />
          </label>
          <p style={styles.preview} aria-live="polite">
            {planDate ? titlePreview : "What we doing [pick a date]?"}
          </p>

          <label style={styles.label}>
            Voting closes (optional)
            <input
              type="datetime-local"
              value={votingClosesAt}
              onChange={(e) => setVotingClosesAt(e.target.value)}
              style={styles.input}
            />
          </label>

          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>Invite Connections</legend>
            {connections.length === 0 ? (
              <p style={styles.muted}>No accepted Connections yet.</p>
            ) : (
              connections.map((c) => {
                const id = Number(c.peer?.id);
                if (!id) return null;
                return (
                  <label key={c.id} style={styles.check}>
                    <input
                      type="checkbox"
                      checked={selectedPeers.has(id)}
                      onChange={() => togglePeer(id)}
                    />
                    {c.peer?.display_name || "Connection"}
                  </label>
                );
              })
            )}
          </fieldset>

          <label style={styles.label}>
            Or invite a Dining Crew
            <select
              value={crewId}
              onChange={(e) => setCrewId(e.target.value)}
              style={styles.input}
            >
              <option value="">None</option>
              {(crews || []).map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={styles.primary} disabled={busy || !planDate}>
            {busy ? "Starting…" : "Start planning"}
          </button>
        </form>

        <h2 style={styles.h2}>Your sessions</h2>
        {loading || authLoading ? (
          <p style={styles.muted}>Loading…</p>
        ) : sessions.length === 0 ? (
          <p style={styles.muted}>No plans yet.</p>
        ) : (
          <ul style={styles.list}>
            {sessions.map((s) => (
              <li key={s.token}>
                <Link to={`/account/what-we-doing/${s.token}`} style={styles.sessionLink}>
                  <strong>{s.title}</strong>
                  <span style={styles.muted}> · {s.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p style={styles.back}>
          <Link to="/account/notifications" style={styles.link}>
            Notifications
          </Link>
          {" · "}
          <Link to="/account" style={styles.link}>
            Account
          </Link>
        </p>
      </div>
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
  lead: { color: "#475569", fontSize: 14, lineHeight: 1.45 },
  error: { color: "#b91c1c", fontWeight: 600 },
  muted: { color: "#64748b", fontSize: 13 },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    display: "grid",
    gap: 12,
    marginTop: 12,
  },
  label: { display: "grid", gap: 6, fontSize: 13, fontWeight: 700, color: "#0f172a" },
  input: {
    fontWeight: 500,
    fontSize: 15,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
  },
  preview: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.25,
  },
  fieldset: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 },
  legend: { fontWeight: 800, fontSize: 13, padding: "0 6px" },
  check: { display: "flex", gap: 8, alignItems: "center", fontWeight: 500, marginBottom: 6 },
  primary: {
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(90deg, #16a34a, #22c55e)",
    color: "#052e16",
    fontWeight: 800,
    fontSize: 15,
    padding: "12px 14px",
    cursor: "pointer",
  },
  h2: { fontSize: 16, marginTop: 28 },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  sessionLink: { color: "#0f172a", textDecoration: "none", fontSize: 15 },
  back: { marginTop: 24, fontSize: 14 },
  link: { color: "#166534", fontWeight: 700, textDecoration: "none" },
};
