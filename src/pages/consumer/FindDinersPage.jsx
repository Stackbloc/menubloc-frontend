/**
 * Find Diners — food-social people search with privacy + connection actions.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  acceptConnection,
  declineConnection,
  removeConnection,
  requestConnection,
  searchDiners,
} from "../../lib/consumerApi.js";

function ContextChips({ diner }) {
  const chips = [];
  if (diner.mutual_connection_count > 0) {
    chips.push(`${diner.mutual_connection_count} mutual`);
  }
  if (diner.same_city) chips.push("Same city");
  if (diner.same_neighborhood && diner.neighborhood) chips.push(diner.neighborhood);
  if (diner.same_school && diner.edu_verification_badge) chips.push(diner.edu_verification_badge);
  if (diner.shared_cluster_count > 0) chips.push(`${diner.shared_cluster_count} shared places`);
  if (!chips.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {chips.map((chip) => (
        <span
          key={chip}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#166534",
            background: "#ecfdf5",
            borderRadius: 999,
            padding: "3px 8px",
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function ConnectionAction({ diner, busy, onAction }) {
  const status = diner.connection_status;
  if (status === "accepted") {
    return (
      <Link
        to={`/account/connections/${encodeURIComponent(String(diner.id))}`}
        style={styles.secondaryBtn}
      >
        View connection
      </Link>
    );
  }
  if (status === "pending" && diner.connection_direction === "incoming") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={styles.primaryBtn} disabled={busy} onClick={() => onAction("accept")}>
          Accept
        </button>
        <button type="button" style={styles.secondaryBtn} disabled={busy} onClick={() => onAction("decline")}>
          Decline
        </button>
      </div>
    );
  }
  if (status === "pending" && diner.connection_direction === "outgoing") {
    return (
      <button type="button" style={styles.secondaryBtn} disabled={busy} onClick={() => onAction("cancel")}>
        Request sent
      </button>
    );
  }
  return (
    <button type="button" style={styles.primaryBtn} disabled={busy} onClick={() => onAction("connect")}>
      Connect
    </button>
  );
}

export default function FindDinersPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account/login?next=/account/find-diners", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const runSearch = useCallback(async (nextQuery) => {
    const q = String(nextQuery ?? query).trim();
    if (q.length < 2) {
      setError("Enter at least 2 characters to search.");
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await searchDiners(q);
      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      setError(err.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  async function handleAction(diner, action) {
    setBusyId(diner.id);
    setError("");
    try {
      if (action === "connect") {
        await requestConnection({ recipient_user_id: diner.id, source: "explicit" });
      } else if (action === "accept") {
        await acceptConnection(diner.connection_id);
      } else if (action === "decline") {
        await declineConnection(diner.connection_id);
      } else if (action === "cancel") {
        await removeConnection(diner.connection_id);
      }
      await runSearch(query);
    } catch (err) {
      setError(err.message || "Connection action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.page}>
      <StickyPageHeader title="Find Diners" backTo="/account?tab=social" />
      <main style={styles.main}>
        <p style={styles.lead}>
          Search by name, phone, email, member ID, city, neighborhood, or school. Results respect each diner&apos;s
          privacy settings — only diners who chose to be searchable appear. Use Connect to send a connection request.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          style={styles.searchRow}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, phone, email, or #member id"
            style={styles.searchInput}
            aria-label="Search diners"
          />
          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {error ? <p style={styles.error}>{error}</p> : null}

        {searched && !loading && results.length === 0 ? (
          <p style={styles.empty}>No diners matched. Try a name, phone, email, city, or member ID.</p>
        ) : null}

        <ul style={styles.list}>
          {results.map((diner) => (
            <li key={diner.id} style={styles.card}>
              <div style={styles.cardTop}>
                {diner.avatar_url ? (
                  <img src={diner.avatar_url} alt="" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarFallback}>
                    {(diner.display_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.name}>{diner.display_name || `Member #${diner.id}`}</div>
                  {diner.location_label ? (
                    <div style={styles.location}>📍 {diner.location_label}</div>
                  ) : null}
                  {diner.diner_about ? (
                    <div style={styles.about}>{diner.diner_about}</div>
                  ) : null}
                  <ContextChips diner={diner} />
                </div>
              </div>
              <ConnectionAction
                diner={diner}
                busy={busyId === diner.id}
                onAction={(action) => handleAction(diner, action)}
              />
            </li>
          ))}
        </ul>
      </main>
      <BottomNav />
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", paddingBottom: 88 },
  main: { maxWidth: 720, margin: "0 auto", padding: "12px 16px 24px" },
  lead: { margin: "0 0 14px", fontSize: 14, color: "#475569", lineHeight: 1.55 },
  searchRow: { display: "flex", gap: 8, marginBottom: 16 },
  searchInput: {
    flex: 1,
    padding: "11px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 15,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  secondaryBtn: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    textDecoration: "none",
    textAlign: "center",
  },
  error: { color: "#b91c1c", fontSize: 14, margin: "0 0 12px" },
  empty: { color: "#64748b", fontSize: 14 },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 12,
  },
  cardTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  avatar: { width: 52, height: 52, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#166534",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 20,
  },
  name: { fontWeight: 800, color: "#0f172a", fontSize: 16 },
  location: { fontSize: 13, color: "#475569", marginTop: 2 },
  about: { fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 1.45 },
};
