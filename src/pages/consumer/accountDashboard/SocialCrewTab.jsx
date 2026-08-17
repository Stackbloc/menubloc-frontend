import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShareModal from "../../../components/share/ShareModal.jsx";
import {
  acceptConnection,
  createDiningCrew,
  declineConnection,
  inviteToDiningCrew,
  listConnections,
  listDiningCrews,
  listWhatWeDoingSessions,
} from "../../../lib/consumerApi.js";
import { buildDiningCrewInviteShareData } from "../../../lib/diningCrewInviteShare.js";
import { formatWhatWeDoingTitle } from "../../../lib/whatWeDoingTitle.js";
import AccountActionLink from "./AccountActionLink.jsx";
import { accountStyles as styles } from "./accountDashboardStyles.js";
import ImEatingAtPanel from "../../../components/foodActivity/ImEatingAtPanel.jsx";

function memberNames(crew) {
  const members = crew?.members_preview || crew?.members || [];
  return members
    .map((m) => m.display_name || (m.user_id ? `Member #${m.user_id}` : ""))
    .filter(Boolean);
}

export default function SocialCrewTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [crews, setCrews] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [newCrewName, setNewCrewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteShareData, setInviteShareData] = useState(null);
  const [inviteShareOpen, setInviteShareOpen] = useState(false);
  const [inviteCrewId, setInviteCrewId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const crewData = await listDiningCrews();
      setCrews(crewData.crews || []);
    } catch (err) {
      setCrews([]);
      setError(err.message || "Unable to load Dining Crew");
    }
    try {
      const [connData, sessData] = await Promise.all([
        listConnections().catch(() => ({ accepted: [], pending_incoming: [] })),
        listWhatWeDoingSessions().catch(() => ({ sessions: [] })),
      ]);
      setAccepted(connData.accepted || []);
      setPendingIncoming(connData.pending_incoming || []);
      setSessions(sessData.sessions || []);
    } catch (err) {
      setError((prev) => prev || err.message || "Unable to load social activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateCrew(e) {
    e.preventDefault();
    if (!newCrewName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const data = await createDiningCrew({ name: newCrewName.trim() });
      setNewCrewName("");
      setNotice("Dining Crew created.");
      if (data?.crew?.id) {
        navigate(`/account/dining-crews/${data.crew.id}`);
        return;
      }
      await load();
    } catch (err) {
      setError(err.message || "Unable to create Dining Crew");
    } finally {
      setBusy(false);
    }
  }

  async function handleShareInvite(crewId) {
    setBusy(true);
    setError("");
    try {
      const data = await inviteToDiningCrew(crewId, {});
      const shareData = buildDiningCrewInviteShareData(data.invitation?.url || "");
      if (!shareData?.url) throw new Error("Unable to create invite link");
      setInviteCrewId(crewId);
      setInviteShareData(shareData);
      setInviteShareOpen(true);
    } catch (err) {
      setError(err.message || "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept(id) {
    setBusy(true);
    setError("");
    try {
      await acceptConnection(id);
      await load();
    } catch (err) {
      setError(err.message || "Could not accept");
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline(id) {
    setBusy(true);
    setError("");
    try {
      await declineConnection(id);
      await load();
    } catch (err) {
      setError(err.message || "Could not decline");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p style={styles.muted}>Loading Dining Crew…</p>;
  }

  return (
    <div>
      {error ? <p style={styles.statusErr}>{error}</p> : null}
      {notice ? <p style={styles.statusOk}>{notice}</p> : null}

      <section style={styles.section} data-testid="im-eating-at-social">
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>I&apos;m Eating At</h2>
        </div>
        <p style={styles.sectionDesc}>
          Tell Menuply where you&apos;re eating and what you&apos;re experiencing. After you
          share, you can optionally turn on Join Me — I&apos;m here now, come join me.
        </p>
        <ImEatingAtPanel compact onPosted={() => {}} />
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Dining Crew</h2>
          {crews.length > 0 ? (
            <Link to="/account/dining-crews" style={styles.textBtn}>
              Manage
            </Link>
          ) : null}
        </div>
        <p style={styles.sectionDesc}>
          Who you eat with on Menuply. Invite people, plan meals, and share food experiences —
          not a generic friend list.
        </p>

        {crews.length === 0 ? (
          <div>
            <p style={styles.summary}>No Dining Crew yet</p>
            <p style={styles.sectionDesc}>
              Create a small crew so you can decide where to eat together and send invitations
              from one place.
            </p>
            <form onSubmit={handleCreateCrew} style={{ display: "grid", gap: 10 }}>
              <input
                style={styles.input}
                value={newCrewName}
                onChange={(e) => setNewCrewName(e.target.value)}
                placeholder="Crew name"
                maxLength={80}
                required
              />
              <button
                type="submit"
                style={styles.primaryBtn}
                disabled={busy || !newCrewName.trim()}
              >
                {busy ? "Creating…" : "Create a Dining Crew"}
              </button>
            </form>
          </div>
        ) : (
          crews.map((crew) => {
            const names = memberNames(crew);
            return (
              <div key={crew.id} style={styles.crewBlock}>
                <p style={styles.actionTitle}>{crew.name}</p>
                <p style={styles.memberLine}>
                  {crew.member_count} {crew.member_count === 1 ? "member" : "members"}
                  {crew.visibility ? ` · ${crew.visibility}` : ""}
                </p>
                <p style={styles.memberLine}>
                  {names.length ? names.join(" · ") : "Open the crew to see who is in it."}
                </p>
                <div style={styles.actions}>
                  <Link to={`/account/dining-crews/${crew.id}`} style={styles.primaryBtn}>
                    Open crew
                  </Link>
                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    disabled={busy || crew.is_full}
                    onClick={() => handleShareInvite(crew.id)}
                  >
                    Invite
                  </button>
                </div>
                {crew.is_full ? (
                  <p style={styles.muted}>This crew is full. Open the crew to raise the member limit.</p>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Dining invitations</h2>
          <Link to="/account/what-we-doing" style={styles.textBtn}>
            What We Doing?
          </Link>
        </div>
        <p style={styles.sectionDesc}>
          Plan with Connections or a Dining Crew — suggest restaurants, venues, or events, vote,
          then Make It a Plan.
        </p>
        {sessions.length === 0 ? (
          <p style={{ margin: "0 0 12px" }}>
            <Link to="/account/what-we-doing" style={styles.primaryBtn}>
              Start a plan
            </Link>
          </p>
        ) : (
          sessions.filter((s) => s.token).slice(0, 4).map((s) => (
            <AccountActionLink
              key={s.token || s.id}
              to={`/account/what-we-doing/${s.token}`}
              title={s.title || formatWhatWeDoingTitle(s.plan_date)}
              actionLabel="Open"
            />
          ))
        )}
        <AccountActionLink
          to="/account/notifications"
          title="Notifications"
          description="Invites and plan updates"
        />
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Meet up around food</h2>
        <AccountActionLink
          to="/account/diner-qr"
          title="My Diner QR"
          description="Your personal Menuply QR — others scan to connect with you."
        />
        <AccountActionLink
          to="/account/diner-qr?share=1"
          title="Share My Menuply"
          description="Opens your Diner Card share sheet — Copy Link is primary."
          actionLabel="Share"
        />
        <AccountActionLink
          to="/account/meet-me-here"
          title="Meet Me Here"
          description="Temporary QR for someone nearby — separate from your Diner QR."
          last
        />
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Connections</h2>
          <Link to="/account/connections" style={styles.textBtn}>
            Manage Connections
          </Link>
        </div>
        <p style={styles.sectionDesc}>
          People you interact with through Menuply meals and invitations — not a Friend list.
        </p>
        {pendingIncoming.length > 0 ? (
          pendingIncoming.map((c) => (
            <div key={c.id} style={styles.actionRow}>
              <div style={styles.actionCopy}>
                <p style={styles.actionTitle}>
                  {c.peer?.display_name || `Member #${c.peer?.id || c.id}`}
                </p>
                <p style={styles.muted}>Wants to connect</p>
              </div>
              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy}
                  onClick={() => handleAccept(c.id)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy}
                  onClick={() => handleDecline(c.id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={styles.muted}>
            {accepted.length
              ? `${accepted.length} connection${accepted.length === 1 ? "" : "s"}`
              : "No connections yet. They form through meals and invitations."}
          </p>
        )}
      </section>

      <section style={{ ...styles.section, ...styles.sectionLast }}>
        <h2 style={styles.sectionTitle}>More around eating together</h2>
        <AccountActionLink
          to="/account/social-onboarding"
          title="Who do you eat with?"
          description="Optional intro to Dining Crew and meeting people around food."
        />
        <AccountActionLink
          to="/account/cluster-subscriptions"
          title="Cluster food report"
          description="Follow clusters for statuses, what people are eating, and deals."
          actionLabel="Manage"
        />
        <AccountActionLink
          to="/account/following"
          title="Restaurants you follow"
          description="Places you already follow — not a people follower list."
          last
        />
      </section>

      {inviteShareData ? (
        <ShareModal
          open={inviteShareOpen}
          onClose={() => setInviteShareOpen(false)}
          modalTitle="Share Dining Crew invite"
          shareData={inviteShareData}
          analyticsContext={{
            pageType: "dining_crew_invite",
            crewId: inviteCrewId,
          }}
        />
      ) : null}
    </div>
  );
}
