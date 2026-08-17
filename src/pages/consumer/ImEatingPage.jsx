/**
 * I'm Eating At — share canonical food activity, optionally Join Me.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import ImEatingAtPanel from "../../components/foodActivity/ImEatingAtPanel.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  activateJoinMe,
  deleteMyFoodActivity,
  endJoinMe,
  listMyFoodActivity,
} from "../../lib/consumerApi.js";
import { buildJoinMeShareData, formatJoinMeLocationLabel } from "../../lib/joinMeShare.js";

export default function ImEatingPage() {
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareInvite, setShareInvite] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await listMyFoodActivity();
      setActivities(data.activities || []);
    } catch (err) {
      setError(err.message || "Unable to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
    }
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, load]);

  const shareData = useMemo(() => {
    if (!shareInvite) return null;
    return buildJoinMeShareData({
      token: shareInvite.invitation_token,
      url: shareInvite.url,
      organizerName: shareInvite.organizer_display_name,
      restaurantName: shareInvite.restaurant_name,
      addressLine1: shareInvite.restaurant_address_line1,
      city: shareInvite.restaurant_city,
      state: shareInvite.restaurant_state,
      locationLabel: shareInvite.location_label,
    });
  }, [shareInvite]);

  async function handleJoinMe(activity) {
    setBusy(true);
    setError("");
    try {
      const data = await activateJoinMe({ food_activity_id: activity.id });
      setShareInvite(data.invitation || null);
      await load();
    } catch (err) {
      setError(err.message || "Unable to start Join Me");
    } finally {
      setBusy(false);
    }
  }

  async function handleEndJoinMe(token) {
    setBusy(true);
    setError("");
    try {
      await endJoinMe(token);
      setShareInvite(null);
      await load();
    } catch (err) {
      setError(err.message || "Unable to end Join Me");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    setError("");
    try {
      await deleteMyFoodActivity(id);
      await load();
    } catch (err) {
      setError(err.message || "Unable to remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="I'm Eating At" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Tell Menuply where you&apos;re eating. Anyone can contribute. Public shares may appear
          on restaurant and cluster surfaces as{" "}
          <strong>user-reported food activity</strong> — not a verified order.{" "}
          <strong>Join Me</strong> and a personal history need a Menuply account.
        </p>

        {error ? <p style={styles.error}>{error}</p> : null}

        <ImEatingAtPanel onPosted={() => isAuthenticated && load()} disabled={busy} />

        {isAuthenticated ? (
        <section style={styles.section}>
          <h2 style={styles.h2}>Your recent activity</h2>
          {loading ? (
            <p style={styles.muted}>Loading…</p>
          ) : activities.length === 0 ? (
            <p style={styles.muted}>No activity yet.</p>
          ) : (
            <ul style={styles.list}>
              {activities.map((a) => {
                const place = formatJoinMeLocationLabel({
                  restaurant_name: a.restaurant_name,
                  address_line1: a.restaurant_address_line1,
                  city: a.restaurant_city,
                  state: a.restaurant_state,
                  location_label: a.location_label,
                });
                const jm = a.join_me;
                return (
                  <li key={a.id} style={styles.card}>
                    <div>
                      <strong>{a.item_name || place}</strong>
                      <div style={styles.muted}>
                        at{" "}
                        {a.restaurant_slug || a.restaurant_id ? (
                          <Link
                            to={`/restaurants/${a.restaurant_slug || a.restaurant_id}`}
                            style={styles.link}
                          >
                            {place}
                          </Link>
                        ) : (
                          place
                        )}
                      </div>
                      {a.comment ? <p style={styles.comment}>{a.comment}</p> : null}
                      <div style={styles.meta}>
                        {a.visibility} · {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                      </div>
                      {jm?.active ? (
                        <div style={styles.joinOn}>Join Me is on</div>
                      ) : null}
                    </div>
                    <div style={styles.side}>
                      {jm?.active ? (
                        <>
                          <button
                            type="button"
                            style={styles.joinMini}
                            disabled={busy}
                            onClick={() =>
                              setShareInvite({
                                invitation_token: jm.invitation_token,
                                restaurant_name: a.restaurant_name,
                                restaurant_address_line1: a.restaurant_address_line1,
                                restaurant_city: a.restaurant_city,
                                restaurant_state: a.restaurant_state,
                                location_label: place,
                              })
                            }
                          >
                            Share
                          </button>
                          <button
                            type="button"
                            style={styles.remove}
                            disabled={busy}
                            onClick={() => handleEndJoinMe(jm.invitation_token)}
                          >
                            End
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          style={styles.joinMini}
                          disabled={busy}
                          onClick={() => handleJoinMe(a)}
                        >
                          Join Me
                        </button>
                      )}
                      <button
                        type="button"
                        style={styles.remove}
                        disabled={busy}
                        onClick={() => handleDelete(a.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        ) : null}
      </div>
      {shareData ? (
        <ShareModal
          open={Boolean(shareInvite)}
          onClose={() => setShareInvite(null)}
          modalTitle="Share Join Me"
          shareData={shareData}
          analyticsContext={{ pageType: "join_me" }}
        />
      ) : null}
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "16px 16px 96px",
    display: "grid",
    gap: 16,
  },
  lead: { margin: 0, fontSize: 14, lineHeight: 1.5, color: "#475569" },
  section: { display: "grid", gap: 10 },
  h2: { margin: 0, fontSize: 18, color: "#0f172a" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 },
  card: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
  },
  comment: { margin: "6px 0 0", fontSize: 14, color: "#334155" },
  meta: { marginTop: 6, fontSize: 12, color: "#94a3b8" },
  muted: { fontSize: 13, color: "#64748b" },
  link: { color: "#2563eb", textDecoration: "none" },
  side: { display: "grid", gap: 6, justifyItems: "end", flexShrink: 0 },
  joinMini: {
    border: "none",
    borderRadius: 8,
    padding: "8px 10px",
    background: "#0f172a",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  joinOn: { marginTop: 6, fontSize: 12, fontWeight: 700, color: "#14532d" },
  remove: {
    border: "none",
    background: "transparent",
    color: "#b91c1c",
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
  },
  error: { margin: 0, color: "#b91c1c", fontSize: 14 },
};
