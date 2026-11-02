import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { listBlockedDiners, unblockDiner } from "../../../lib/consumerApi.js";
import { C, s } from "./safetyStyles.js";

/** Settings → Blocked (Play Store safety, Andre approved 2026-11-02, plan 18). */
export default function BlockedDinersPage() {
  const { isAuthenticated, loading } = useConsumer();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    listBlockedDiners()
      .then((r) => setRows(r?.blocked || []))
      .catch((err) => setError(err?.message || "Couldn't load your blocked list."));
  }, [isAuthenticated]);

  async function onUnblock(userId) {
    setError("");
    try {
      await unblockDiner(userId);
      setRows((prev) => (prev || []).filter((r) => r.user_id !== userId));
    } catch (err) {
      setError(err?.message || "Couldn't unblock. Try again.");
    }
  }

  return (
    <main style={s.page} data-testid="blocked-diners-page">
      <div style={s.stack}>
        <Link to="/feed/profile?view=settings" style={s.back}>‹ Settings</Link>
        <h1 style={s.h1}>Blocked</h1>
        <p style={s.muted}>You and people you block don&apos;t see each other&apos;s clips, and they can&apos;t connect with you or invite you.</p>
        {!loading && !isAuthenticated ? (
          <p style={s.p}><Link to="/account/login?next=%2Faccount%2Fblocked" style={s.link}>Sign in</Link> to see who you&apos;ve blocked.</p>
        ) : null}
        {error ? <p style={s.error} role="alert">{error}</p> : null}
        {rows && rows.length === 0 ? <div style={s.card}><p style={s.muted}>You haven&apos;t blocked anyone.</p></div> : null}
        {rows && rows.length > 0 ? (
          <div style={s.card}>
            {rows.map((r) => (
              <div key={r.user_id} style={s.row} data-testid="blocked-diner-row">
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" width={36} height={36} style={{ borderRadius: 999, objectFit: "cover" }} />
                  ) : (
                    <span style={{ width: 36, height: 36, borderRadius: 999, background: C.surface, display: "inline-block" }} />
                  )}
                  <span style={s.p}>{r.name}</span>
                </span>
                <button type="button" style={s.link} onClick={() => onUnblock(r.user_id)}>Unblock</button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
