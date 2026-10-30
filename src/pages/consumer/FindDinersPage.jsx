/**
 * Find Connects — people search with connection actions, the same as the app (Andre 2026-10-30).
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
import { formatDinerPeerLabel } from "../../lib/dinerPublicIdentity.js";
import DinerAvatar from "../../components/social/DinerAvatar.jsx";

function ConnectionAction({ diner, busy, onAction }) {
  const status = diner.connection_status;
  if (status === "accepted") {
    return (
      <Link
        to={`/account/connections/${encodeURIComponent(String(diner.id))}`}
        style={styles.secondaryBtn}
      >
        View
      </Link>
    );
  }
  if (status === "pending" && diner.connection_direction === "incoming") {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link
          to={`/account/diners/${encodeURIComponent(String(diner.id))}?from=incoming`}
          style={styles.secondaryBtn}
        >
          Review profile
        </Link>
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
      <StickyPageHeader title="Find Connects" backTo="/feed/profile" />
      <main style={styles.main}>
        <p style={styles.lead}>Search by name, email, phone, hometown or city.</p>

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
            placeholder="Name, email, phone or city"
            style={styles.searchInput}
            aria-label="Search diners"
          />
          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {error ? <p style={styles.error}>{error}</p> : null}

        {searched && !loading && results.length === 0 ? (
          <p style={styles.empty}>
            No diners matched. Try their exact email or phone, or a name / hometown / city spelling they
            use on Menuply.
          </p>
        ) : null}

        <ul style={styles.list}>
          {results.map((diner) => {
            const profileHref = `/account/diners/${encodeURIComponent(String(diner.id))}?from=find-diners`;
            return (
            <li key={diner.id} style={styles.card} data-testid="find-diners-result">
              <Link to={profileHref} style={styles.cardLink} data-testid="find-diners-name-link">
                <DinerAvatar avatarUrl={diner.avatar_url} avatarMotionUrl={diner.avatar_motion_url} displayName={diner.display_name} size={44} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={styles.nameLink}>{formatDinerPeerLabel(diner)}</span>
                  {diner.location_label || diner.mutual_connection_count > 0 ? (
                    <span style={styles.location}>
                      {[diner.location_label, diner.mutual_connection_count > 0 ? `${diner.mutual_connection_count} mutual` : null].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </span>
              </Link>
              <ConnectionAction
                diner={diner}
                busy={busyId === diner.id}
                onAction={(action) => handleAction(diner, action)}
              />
            </li>
          );
          })}
        </ul>
      </main>
      <BottomNav />
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f5f7f4", paddingBottom: 88 },
  main: { maxWidth: 560, margin: "0 auto", padding: "12px 16px 24px" },
  lead: { margin: "0 0 12px", fontSize: 13, color: "#5c665f" },
  searchRow: { display: "flex", gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10, border: "1px solid #e1e6e1", fontSize: 15 },
  primaryBtn: { padding: "8px 16px", borderRadius: 999, border: "none", background: "#0f7a24", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" },
  secondaryBtn: { display: "inline-block", padding: "8px 12px", borderRadius: 999, border: "1px solid #e1e6e1", background: "#fff", color: "#111613", fontWeight: 600, cursor: "pointer", fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" },
  error: { color: "#b42318", fontSize: 14, margin: "0 0 12px" },
  empty: { color: "#5c665f", fontSize: 14 },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  card: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#fff", border: "1px solid #e1e6e1", borderRadius: 12, padding: 12 },
  cardLink: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 180, color: "inherit", textDecoration: "none" },
  nameLink: { display: "block", fontSize: 15, fontWeight: 600, color: "#111613" },
  location: { display: "block", fontSize: 13, color: "#5c665f" },
};
