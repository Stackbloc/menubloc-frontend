/**
 * Event Group detail + invite accept (Phase 5).
 * Private membership lists stay hidden from non-members.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { apiGet } from "../lib/api.js";
import { useConsumer } from "../context/ConsumerContext.jsx";
import * as consumerApi from "../lib/consumerApi.js";

export function EventGroupDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (isAuthenticated) {
        data = await consumerApi.getVenueEventGroup(slug);
      } else {
        data = await apiGet(`/public/event-groups/${encodeURIComponent(String(slug || ""))}`);
      }
      setGroup(data?.group || null);
    } catch (err) {
      setError(err?.message || "Group not found");
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [slug, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  async function join() {
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(`/events/groups/${slug}`)}`);
      return;
    }
    setBusy(true);
    try {
      const data = await consumerApi.joinVenueEventGroup(slug);
      setGroup(data.group);
    } catch (err) {
      setError(err?.message || "Could not join");
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setBusy(true);
    try {
      await consumerApi.leaveVenueEventGroup(slug);
      await load();
    } catch (err) {
      setError(err?.message || "Could not leave");
    } finally {
      setBusy(false);
    }
  }

  async function createInvite() {
    setBusy(true);
    setInviteUrl("");
    try {
      const data = await consumerApi.inviteToVenueEventGroup(slug);
      setInviteUrl(data?.invitation?.url || "");
    } catch (err) {
      setError(err?.message || "Could not create invite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="event-group-detail" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <StickyPageHeader title={group?.name || "Event group"} />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 96px", display: "grid", gap: 14 }}>
        {loading ? <div style={{ color: "#5b6675" }}>Loading…</div> : null}
        {error ? (
          <div role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </div>
        ) : null}
        {group ? (
          <>
            <div>
              <h1 style={{ margin: 0, fontSize: 26 }}>{group.name}</h1>
              <div style={{ color: "#5b6675", fontSize: 14, marginTop: 4 }}>
                {group.member_count} {group.member_count === 1 ? "person" : "people"}
                {group.visibility === "private" ? " · Private" : " · Public"}
              </div>
              {group.event_slug ? (
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  Event:{" "}
                  <Link to={`/events/${encodeURIComponent(group.event_slug)}`} style={{ color: "#166534", fontWeight: 700 }}>
                    {group.event_name || group.event_slug}
                  </Link>
                </div>
              ) : null}
              {group.description ? (
                <p style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{group.description}</p>
              ) : null}
              {group.dining_crew_id ? (
                <div style={{ fontSize: 13, color: "#5b6675" }}>
                  Linked Dining Crew #{group.dining_crew_id}
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!group.viewer_role ? (
                <button type="button" disabled={busy} onClick={join} style={{ fontWeight: 700 }}>
                  Join group
                </button>
              ) : (
                <>
                  <button type="button" disabled={busy} onClick={createInvite}>
                    Invite others
                  </button>
                  <button type="button" disabled={busy} onClick={leave}>
                    Leave
                  </button>
                </>
              )}
            </div>
            {inviteUrl ? (
              <div style={{ fontSize: 13, wordBreak: "break-all", padding: 12, background: "#fff", borderRadius: 10, border: "1px solid #e7e5e4" }}>
                Invite link: {inviteUrl}
              </div>
            ) : null}

            <section style={{ display: "grid", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Members</h2>
              {group.members_hidden ? (
                <div style={{ fontSize: 13, color: "#5b6675" }}>
                  Member list is private. Join or accept an invite to see who is in this group.
                </div>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                  {(group.members || []).map((m) => (
                    <li
                      key={m.user_id}
                      style={{ padding: "8px 10px", background: "#fff", borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 14 }}
                    >
                      {m.display_name}
                      <span style={{ color: "#78716c" }}> · {m.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}

export function EventGroupInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(`/events/groups/invite/${token}`)}`);
      return;
    }
    consumerApi
      .getVenueEventGroupInvitation(token)
      .then((data) => setPreview(data.invitation))
      .catch((err) => setError(err?.message || "Invitation not found"));
  }, [authLoading, isAuthenticated, navigate, token]);

  async function accept() {
    setBusy(true);
    try {
      const data = await consumerApi.acceptVenueEventGroupInvitation(token);
      if (data?.group?.slug) navigate(`/events/groups/${encodeURIComponent(data.group.slug)}`);
    } catch (err) {
      setError(err?.message || "Could not accept invite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="event-group-invite" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <StickyPageHeader title="Event group invite" />
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 96px", display: "grid", gap: 12 }}>
        {error ? (
          <div role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </div>
        ) : null}
        {preview ? (
          <>
            <h1 style={{ margin: 0, fontSize: 22 }}>{preview.group?.name}</h1>
            <div style={{ color: "#5b6675", fontSize: 14 }}>
              Invited by {preview.inviter_display_name}
              {preview.event?.name ? ` · ${preview.event.name}` : ""}
            </div>
            <button type="button" disabled={busy || preview.status !== "pending"} onClick={accept} style={{ fontWeight: 700 }}>
              Accept invite
            </button>
          </>
        ) : !error ? (
          <div style={{ color: "#5b6675" }}>Loading…</div>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}

export default EventGroupDetailPage;
