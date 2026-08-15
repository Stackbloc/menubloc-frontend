/**
 * Dining Crews — persistent social entity.
 * Create/settings, roster, invites, join requests, crew Invite to Eat, conversations.
 * No Crew Deals.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import InviteToEatModal from "../../components/InviteToEatModal.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  listDiningCrews,
  discoverPublicDiningCrews,
  createDiningCrew,
  updateDiningCrew,
  getDiningCrew,
  inviteToDiningCrew,
  requestJoinDiningCrew,
  listDiningCrewJoinRequests,
  resolveDiningCrewJoinRequest,
  voteDiningCrewJoinRequest,
  setDiningCrewMemberRole,
  getDiningCrewInvitation,
  acceptDiningCrewInvitation,
  declineDiningCrewInvitation,
  listDiningCrewConversations,
  startDiningCrewConversation,
  listDiningCrewMessages,
  postDiningCrewMessage,
  postDiningCrewPhoto,
  CONSUMER_API_BASE,
} from "../../lib/consumerApi.js";
import DiningCrewFoodEntityPicker from "../../components/diningCrews/DiningCrewFoodEntityPicker.jsx";

function resolveMediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(CONSUMER_API_BASE || "").replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

const MAX_MEMBER_OPTIONS = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "250", label: "250" },
  { value: "500", label: "500" },
  { value: "unlimited", label: "Unlimited" },
];

function restaurantHref(entity) {
  const key = entity?.restaurant_slug || entity?.restaurant_id;
  return key ? `/restaurants/${key}` : null;
}

function EntityCard({ entity, type }) {
  if (!entity) return null;
  if (type === "restaurant") {
    const href = restaurantHref(entity);
    return (
      <div style={styles.entityCard}>
        <div style={styles.entityKind}>Restaurant</div>
        <strong>{entity.restaurant_name}</strong>
        {(entity.city || entity.state) && (
          <div style={styles.muted}>
            {[entity.city, entity.state].filter(Boolean).join(", ")}
          </div>
        )}
        {href ? (
          <Link to={href} style={styles.link}>
            Open on Menuply
          </Link>
        ) : null}
      </div>
    );
  }
  if (type === "menu") {
    const href = restaurantHref(entity);
    return (
      <div style={styles.entityCard}>
        <div style={styles.entityKind}>Menu</div>
        <strong>{entity.menu_name}</strong>
        <div style={styles.muted}>{entity.restaurant_name}</div>
        {href ? (
          <Link to={href} style={styles.link}>
            Open restaurant
          </Link>
        ) : null}
      </div>
    );
  }
  if (type === "menu_item") {
    return (
      <div style={styles.entityCard}>
        <div style={styles.entityKind}>Menu item</div>
        <strong>{entity.item_name}</strong>
        <div style={styles.muted}>{entity.restaurant_name}</div>
        {entity.menu_item_id ? (
          <Link to={`/menu-items/${entity.menu_item_id}`} style={styles.link}>
            Open dish
          </Link>
        ) : null}
      </div>
    );
  }
  return null;
}

function CrewSettingsFields({
  description,
  setDescription,
  visibility,
  setVisibility,
  maxMembers,
  setMaxMembers,
  membershipApproval,
  setMembershipApproval,
  disabled,
}) {
  return (
    <>
      <textarea
        style={styles.textarea}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What is this crew about? (optional)"
        maxLength={1000}
        rows={3}
        disabled={disabled}
      />
      <div style={styles.fieldRow}>
        <label style={styles.label}>
          Visibility
          <select
            style={styles.select}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            disabled={disabled}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label style={styles.label}>
          Max members
          <select
            style={styles.select}
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
            disabled={disabled}
          >
            {MAX_MEMBER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.label}>
          Join approval
          <select
            style={styles.select}
            value={membershipApproval}
            onChange={(e) => setMembershipApproval(e.target.value)}
            disabled={disabled}
          >
            <option value="organizer">Organizer approval</option>
            <option value="admin">Admin approval</option>
            <option value="member_vote">Member vote</option>
          </select>
        </label>
      </div>
    </>
  );
}

export function DiningCrewInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(`/account/dining-crews/invite/${token}`)}`, {
        replace: true,
      });
      return;
    }
    if (!authLoading && isAuthenticated && token) {
      getDiningCrewInvitation(token)
        .then((data) => setInvite(data.invitation))
        .catch((err) => setError(err.message || "Invitation not found"));
    }
  }, [authLoading, isAuthenticated, navigate, token]);

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const data = await acceptDiningCrewInvitation(token);
      navigate(`/account/dining-crews/${data.crew.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to accept");
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    setError("");
    try {
      await declineDiningCrewInvitation(token);
      navigate("/account/dining-crews", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to decline");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="Dining Crew invite" />
      <div style={styles.page}>
        {error ? <p style={styles.error}>{error}</p> : null}
        {!invite && !error ? <p style={styles.muted}>Loading…</p> : null}
        {invite ? (
          <>
            <p style={styles.lead}>
              You are invited to join <strong>{invite.crew_name}</strong>.
            </p>
            <div style={styles.actions}>
              <button type="button" style={styles.primaryBtn} disabled={busy} onClick={accept}>
                Accept
              </button>
              <button type="button" style={styles.secondaryBtn} disabled={busy} onClick={decline}>
                Decline
              </button>
            </div>
          </>
        ) : null}
      </div>
      <BottomNav />
    </>
  );
}

export function DiningCrewDetailPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [crew, setCrew] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [inviteeId, setInviteeId] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [entityType, setEntityType] = useState("text");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rosterExpanded, setRosterExpanded] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [maxMembers, setMaxMembers] = useState("unlimited");
  const [membershipApproval, setMembershipApproval] = useState("organizer");
  const [inviteRestaurant, setInviteRestaurant] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const photoInputRef = React.useRef(null);

  const loadCrew = useCallback(async () => {
    const data = await getDiningCrew(crewId);
    setCrew(data.crew);
    setDesc(data.crew.description || "");
    setVisibility(data.crew.visibility || "private");
    setMaxMembers(
      data.crew.max_members == null ? "unlimited" : String(data.crew.max_members)
    );
    setMembershipApproval(data.crew.membership_approval || "organizer");
    const convos = await listDiningCrewConversations(crewId);
    setConversations(convos.conversations || []);
    if (!activeConvoId && convos.conversations?.[0]) {
      setActiveConvoId(convos.conversations[0].id);
    }
    try {
      const jr = await listDiningCrewJoinRequests(crewId);
      setJoinRequests(jr.requests || []);
    } catch {
      setJoinRequests([]);
    }
  }, [crewId, activeConvoId]);

  const loadMessages = useCallback(async (id) => {
    if (!id) {
      setMessages([]);
      return;
    }
    const data = await listDiningCrewMessages(id);
    setMessages(data.messages || []);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account/login", { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated) {
      loadCrew().catch((err) => setError(err.message || "Unable to load crew"));
    }
  }, [authLoading, isAuthenticated, navigate, loadCrew]);

  useEffect(() => {
    if (activeConvoId) {
      loadMessages(activeConvoId).catch((err) => setError(err.message || "Unable to load messages"));
    }
  }, [activeConvoId, loadMessages]);

  async function handleInvite(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {};
      const id = Number(String(inviteeId).trim());
      if (Number.isFinite(id) && id > 0) body.invitee_user_id = id;
      const data = await inviteToDiningCrew(crewId, body);
      setInviteUrl(data.invitation?.url || "");
      setInviteeId("");
    } catch (err) {
      setError(err.message || "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await updateDiningCrew(crewId, {
        description: desc,
        visibility,
        max_members: maxMembers === "unlimited" ? "unlimited" : Number(maxMembers),
        membership_approval: membershipApproval,
      });
      setCrew(data.crew);
      setSettingsOpen(false);
    } catch (err) {
      setError(err.message || "Unable to save settings");
    } finally {
      setBusy(false);
    }
  }

  async function handleResolveJoin(requestId, decision) {
    setBusy(true);
    setError("");
    try {
      await resolveDiningCrewJoinRequest(crewId, requestId, decision);
      await loadCrew();
    } catch (err) {
      setError(err.message || "Unable to resolve request");
    } finally {
      setBusy(false);
    }
  }

  async function handleVoteJoin(requestId, vote) {
    setBusy(true);
    setError("");
    try {
      await voteDiningCrewJoinRequest(crewId, requestId, vote);
      await loadCrew();
    } catch (err) {
      setError(err.message || "Unable to vote");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetRole(userId, role) {
    setBusy(true);
    setError("");
    try {
      const data = await setDiningCrewMemberRole(crewId, userId, role);
      setCrew(data.crew);
    } catch (err) {
      setError(err.message || "Unable to update role");
    } finally {
      setBusy(false);
    }
  }

  async function handleStartConvo() {
    setBusy(true);
    setError("");
    try {
      const data = await startDiningCrewConversation(crewId, "Where should we eat?");
      setConversations((prev) => [data.conversation, ...prev]);
      setActiveConvoId(data.conversation.id);
    } catch (err) {
      setError(err.message || "Unable to start conversation");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!activeConvoId) return;
    setBusy(true);
    setError("");
    try {
      if (photoFile) {
        await postDiningCrewPhoto(activeConvoId, {
          file: photoFile,
          body: text.trim() || null,
          restaurant_id: selectedEntity?.restaurant_id || null,
          menu_item_id: selectedEntity?.menu_item_id || null,
        });
        setPhotoFile(null);
        setText("");
        setSelectedEntity(null);
        setEntityType("text");
        if (photoInputRef.current) photoInputRef.current.value = "";
        await loadMessages(activeConvoId);
        return;
      }
      const payload = { message_type: entityType };
      if (entityType === "text") {
        payload.body = text.trim();
      } else {
        if (!selectedEntity) {
          throw new Error("Select a restaurant, menu, or menu item to share");
        }
        payload.body = text.trim() || null;
        payload.restaurant_id = selectedEntity.restaurant_id || null;
        if (entityType === "menu") payload.menu_id = selectedEntity.menu_id || null;
        if (entityType === "menu_item") {
          payload.menu_item_id = selectedEntity.menu_item_id || null;
          if (selectedEntity.menu_id) payload.menu_id = selectedEntity.menu_id;
        }
      }
      await postDiningCrewMessage(activeConvoId, payload);
      setText("");
      setSelectedEntity(null);
      setEntityType("text");
      await loadMessages(activeConvoId);
    } catch (err) {
      setError(err.message || "Unable to send");
    } finally {
      setBusy(false);
    }
  }

  const canManageSettings = crew?.viewer_role === "owner" || crew?.viewer_role === "admin";
  const isOwner = crew?.viewer_role === "owner";
  const members = crew?.members || [];
  const preview = crew?.members_preview || members.slice(0, 5);
  const shownMembers = rosterExpanded ? members : preview;

  return (
    <>
      <StickyPageHeader title={crew?.name || "Dining Crew"} />
      <div style={styles.page}>
        <p>
          <Link to="/account/dining-crews" style={styles.link}>
            ← All crews
          </Link>
        </p>
        {error ? <p style={styles.error}>{error}</p> : null}

        {crew ? (
          <>
            <section style={styles.section}>
              <p style={styles.muted}>
                {crew.visibility === "public" ? "Public" : "Private"}
                {" · "}
                Max {crew.max_members_label}
                {" · "}
                Approval: {crew.membership_approval}
                {crew.is_full ? " · Full" : null}
              </p>
              {crew.description ? <p style={styles.lead}>{crew.description}</p> : null}
              {canManageSettings ? (
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => setSettingsOpen((v) => !v)}
                >
                  {settingsOpen ? "Hide settings" : "Crew settings"}
                </button>
              ) : null}
              {settingsOpen && canManageSettings ? (
                <form onSubmit={handleSaveSettings} style={{ ...styles.formCol, marginTop: 12 }}>
                  <CrewSettingsFields
                    description={desc}
                    setDescription={setDesc}
                    visibility={visibility}
                    setVisibility={setVisibility}
                    maxMembers={maxMembers}
                    setMaxMembers={setMaxMembers}
                    membershipApproval={membershipApproval}
                    setMembershipApproval={setMembershipApproval}
                    disabled={busy}
                  />
                  <button type="submit" style={styles.primaryBtn} disabled={busy}>
                    Save settings
                  </button>
                </form>
              ) : null}
            </section>

            <section style={styles.section}>
              <h2 style={styles.h2}>
                Diner Crew — {crew.member_count} member{crew.member_count === 1 ? "" : "s"}
              </h2>
              <ul style={styles.list}>
                {shownMembers.map((m) => (
                  <li key={m.user_id} style={styles.card}>
                    <div>
                      <strong>{m.display_name || `Member #${m.user_id}`}</strong>
                      <span style={styles.muted}> · {m.role}</span>
                      {m.edu_verified ? (
                        <div style={styles.edu}>{m.edu_verification_badge}</div>
                      ) : null}
                    </div>
                    {isOwner && m.role !== "owner" ? (
                      <button
                        type="button"
                        style={styles.secondaryBtn}
                        disabled={busy}
                        onClick={() =>
                          handleSetRole(m.user_id, m.role === "admin" ? "member" : "admin")
                        }
                      >
                        {m.role === "admin" ? "Make member" : "Make admin"}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {members.length > 5 ? (
                <button
                  type="button"
                  style={{ ...styles.linkBtn, marginTop: 8 }}
                  onClick={() => setRosterExpanded((v) => !v)}
                >
                  {rosterExpanded
                    ? "Show fewer members"
                    : `View all ${crew.member_count} members`}
                </button>
              ) : null}
            </section>

            {joinRequests.length > 0 ? (
              <section style={styles.section}>
                <h2 style={styles.h2}>Join requests</h2>
                <ul style={styles.list}>
                  {joinRequests.map((jr) => (
                    <li key={jr.id} style={styles.card}>
                      <div>
                        <strong>{jr.display_name || `User #${jr.requester_user_id}`}</strong>
                        {crew.membership_approval === "member_vote" ? (
                          <div style={styles.muted}>
                            Votes: {jr.yes_votes} yes / {jr.no_votes} no
                          </div>
                        ) : null}
                      </div>
                      <div style={styles.actions}>
                        {crew.membership_approval === "member_vote" ? (
                          <>
                            <button
                              type="button"
                              style={styles.primaryBtn}
                              disabled={busy}
                              onClick={() => handleVoteJoin(jr.id, "yes")}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              style={styles.secondaryBtn}
                              disabled={busy}
                              onClick={() => handleVoteJoin(jr.id, "no")}
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              style={styles.primaryBtn}
                              disabled={busy}
                              onClick={() => handleResolveJoin(jr.id, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              style={styles.secondaryBtn}
                              disabled={busy}
                              onClick={() => handleResolveJoin(jr.id, "declined")}
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section style={styles.section}>
              <h2 style={styles.h2}>Invite members</h2>
              <form onSubmit={handleInvite} style={styles.form}>
                <input
                  style={styles.input}
                  value={inviteeId}
                  onChange={(e) => setInviteeId(e.target.value)}
                  placeholder="Member id (optional)"
                />
                <button type="submit" style={styles.primaryBtn} disabled={busy || crew.is_full}>
                  Create invite link
                </button>
              </form>
              {crew.is_full ? (
                <p style={styles.muted}>This crew is full. Increase the max in settings to invite more.</p>
              ) : null}
              {inviteUrl ? (
                <p style={styles.notice}>
                  Share link: <code style={{ wordBreak: "break-all" }}>{inviteUrl}</code>
                </p>
              ) : null}
            </section>

            <section style={styles.section}>
              <h2 style={styles.h2}>Invite to Eat (crew outing)</h2>
              <p style={styles.muted}>
                Pick a restaurant, then create a group Invite to Eat linked to this crew
                (organizer or recipient date/time).
              </p>
              <DiningCrewFoodEntityPicker
                messageType="restaurant"
                onMessageTypeChange={() => {}}
                selected={inviteRestaurant}
                onSelectedChange={setInviteRestaurant}
                note=""
                onNoteChange={() => {}}
                disabled={busy}
                hideNote
                forceRestaurantOnly
              />
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy || !inviteRestaurant?.restaurant_id}
                  onClick={() => setInviteModalOpen(true)}
                >
                  Create crew Invite to Eat
                </button>
              </div>
            </section>

            <section style={styles.section}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <h2 style={styles.h2}>Meal conversation</h2>
                <button type="button" style={styles.secondaryBtn} disabled={busy} onClick={handleStartConvo}>
                  Start conversation
                </button>
              </div>
              {conversations.length === 0 ? (
                <p style={styles.muted}>No conversations yet. Start one to decide where to eat.</p>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      style={activeConvoId === c.id ? styles.primaryBtn : styles.secondaryBtn}
                      onClick={() => setActiveConvoId(c.id)}
                    >
                      {c.title || `Conversation #${c.id}`}
                    </button>
                  ))}
                </div>
              )}

              {activeConvoId ? (
                <>
                  <div style={styles.thread}>
                    {messages.map((msg) => (
                      <div key={msg.id} style={styles.message}>
                        <div style={styles.msgMeta}>
                          <strong>{msg.author_display_name || `Member #${msg.author_user_id}`}</strong>
                        </div>
                        {msg.message_type === "photo" && msg.photo_url ? (
                          <img
                            src={resolveMediaUrl(msg.photo_url)}
                            alt={msg.body || "Food photo"}
                            style={styles.photo}
                          />
                        ) : null}
                        {msg.message_type !== "text" && msg.message_type !== "photo" ? (
                          <EntityCard entity={msg.entity} type={msg.message_type} />
                        ) : null}
                        {msg.message_type === "photo" && msg.entity ? (
                          <EntityCard
                            entity={msg.entity}
                            type={msg.entity.menu_item_id ? "menu_item" : "restaurant"}
                          />
                        ) : null}
                        {msg.body ? <p style={styles.msgBody}>{msg.body}</p> : null}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSend} style={{ marginTop: 12 }}>
                    <DiningCrewFoodEntityPicker
                      messageType={entityType}
                      onMessageTypeChange={(type) => {
                        setEntityType(type);
                        setSelectedEntity(null);
                      }}
                      selected={selectedEntity}
                      onSelectedChange={setSelectedEntity}
                      note={text}
                      onNoteChange={setText}
                      disabled={busy}
                    />
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        data-testid="dining-crew-food-photo-input"
                        disabled={busy}
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      />
                      {photoFile ? (
                        <span style={styles.muted}>Photo ready: {photoFile.name}</span>
                      ) : (
                        <span style={styles.muted}>Camera / food photo (optional)</span>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="submit"
                        style={styles.primaryBtn}
                        disabled={
                          busy ||
                          (photoFile
                            ? false
                            : entityType === "text"
                              ? !text.trim()
                              : !selectedEntity)
                        }
                      >
                        {photoFile ? "Share food photo" : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              ) : null}
            </section>
          </>
        ) : (
          <p style={styles.muted}>Loading…</p>
        )}
      </div>
      <BottomNav />
      {inviteRestaurant?.restaurant_id ? (
        <InviteToEatModal
          open={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          restaurantId={inviteRestaurant.restaurant_id}
          restaurantName={inviteRestaurant.restaurant_name || inviteRestaurant.label || ""}
          diningCrewId={Number(crewId)}
        />
      ) : null}
    </>
  );
}

export default function DiningCrewsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [crews, setCrews] = useState([]);
  const [publicCrews, setPublicCrews] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [maxMembers, setMaxMembers] = useState("25");
  const [membershipApproval, setMembershipApproval] = useState("organizer");
  const [discoverQ, setDiscoverQ] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await listDiningCrews();
    setCrews(data.crews || []);
  }, []);

  const loadDiscover = useCallback(async (q = "") => {
    const data = await discoverPublicDiningCrews({ q, limit: 12 });
    setPublicCrews(data.crews || []);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account/login", { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated) {
      load().catch((err) => setError(err.message || "Unable to load crews"));
      loadDiscover().catch(() => setPublicCrews([]));
    }
  }, [authLoading, isAuthenticated, navigate, load, loadDiscover]);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await createDiningCrew({
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        max_members: maxMembers === "unlimited" ? "unlimited" : Number(maxMembers),
        membership_approval: membershipApproval,
      });
      setName("");
      setDescription("");
      navigate(`/account/dining-crews/${data.crew.id}`);
    } catch (err) {
      setError(err.message || "Unable to create crew");
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestJoin(crewId) {
    setBusy(true);
    setError("");
    try {
      await requestJoinDiningCrew(crewId);
      setError("");
      setPublicCrews((prev) =>
        prev.map((c) => (c.id === crewId ? { ...c, _requested: true } : c))
      );
    } catch (err) {
      setError(err.message || "Unable to request join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="Dining Crews" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Persistent groups who eat together. Set a purpose, public/private status, member
          limit, and approval rules — then invite friends or organize an Invite to Eat.
        </p>
        {error ? <p style={styles.error}>{error}</p> : null}

        <section style={styles.section}>
          <h2 style={styles.h2}>Create a Dining Crew</h2>
          <form onSubmit={handleCreate} style={styles.formCol}>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Crew name"
              maxLength={80}
              required
            />
            <CrewSettingsFields
              description={description}
              setDescription={setDescription}
              visibility={visibility}
              setVisibility={setVisibility}
              maxMembers={maxMembers}
              setMaxMembers={setMaxMembers}
              membershipApproval={membershipApproval}
              setMembershipApproval={setMembershipApproval}
              disabled={busy}
            />
            <button type="submit" style={styles.primaryBtn} disabled={busy || !name.trim()}>
              Create
            </button>
          </form>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Your crews</h2>
          {crews.length === 0 ? (
            <p style={styles.muted}>No Dining Crews yet.</p>
          ) : (
            <ul style={styles.list}>
              {crews.map((c) => (
                <li key={c.id} style={styles.card}>
                  <div>
                    <strong>{c.name}</strong>
                    <div style={styles.muted}>
                      {c.member_count} members
                      {c.visibility ? ` · ${c.visibility}` : ""}
                      {c.is_full ? " · Full" : ""}
                    </div>
                    {c.description ? (
                      <div style={{ ...styles.muted, marginTop: 4 }}>{c.description}</div>
                    ) : null}
                  </div>
                  <Link to={`/account/dining-crews/${c.id}`} style={styles.link}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Discover public crews</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadDiscover(discoverQ).catch((err) =>
                setError(err.message || "Unable to search public crews")
              );
            }}
            style={styles.form}
          >
            <input
              style={styles.input}
              value={discoverQ}
              onChange={(e) => setDiscoverQ(e.target.value)}
              placeholder="Search public crews"
            />
            <button type="submit" style={styles.secondaryBtn} disabled={busy}>
              Search
            </button>
          </form>
          {publicCrews.length === 0 ? (
            <p style={styles.muted}>No public crews found.</p>
          ) : (
            <ul style={styles.list}>
              {publicCrews.map((c) => (
                <li key={c.id} style={styles.card}>
                  <div>
                    <strong>{c.name}</strong>
                    <div style={styles.muted}>
                      {c.member_count} members · Max {c.max_members_label}
                      {c.is_full ? " · Full" : ""}
                    </div>
                    {c.description ? (
                      <div style={{ ...styles.muted, marginTop: 4 }}>{c.description}</div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    disabled={busy || c.is_full || c._requested}
                    onClick={() => handleRequestJoin(c.id)}
                  >
                    {c._requested ? "Request sent" : "Request to join"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p style={{ marginTop: 24 }}>
          <Link to="/account" style={styles.link}>
            Back to account
          </Link>
        </p>
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page, #f8fafc)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 16px)",
    maxWidth: 720,
    margin: "0 auto",
  },
  lead: { fontSize: 14, color: "#334155", lineHeight: 1.5 },
  muted: { fontSize: 13, color: "#64748b" },
  error: { color: "#b91c1c", fontWeight: 700, fontSize: 13 },
  notice: { color: "#14532d", fontWeight: 600, fontSize: 13, marginTop: 8 },
  edu: { fontSize: 12, color: "#14532d", fontWeight: 600, marginTop: 2 },
  section: { marginTop: 20 },
  h2: { fontSize: 16, margin: "0 0 10px", color: "#0f172a" },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  form: { display: "flex", gap: 8, flexWrap: "wrap" },
  formCol: { display: "grid", gap: 10 },
  fieldRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  label: { display: "grid", gap: 4, fontSize: 12, color: "#475569", flex: "1 1 140px" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: {
    flex: "1 1 180px",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    resize: "vertical",
    boxSizing: "border-box",
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    background: "#fff",
  },
  primaryBtn: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 14px",
    background: "#fff",
    color: "#334155",
    fontWeight: 600,
    cursor: "pointer",
  },
  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#0f766e",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontSize: 14,
  },
  link: { color: "#0f766e", fontWeight: 600, textDecoration: "none" },
  thread: {
    display: "grid",
    gap: 10,
    maxHeight: 360,
    overflowY: "auto",
    padding: 12,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  message: { borderBottom: "1px solid #f1f5f9", paddingBottom: 8 },
  msgMeta: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  msgBody: { margin: "4px 0 0", fontSize: 14, color: "#0f172a" },
  photo: {
    display: "block",
    width: "100%",
    maxHeight: 280,
    objectFit: "cover",
    borderRadius: 10,
    marginTop: 6,
    background: "#e2e8f0",
  },
  entityCard: {
    padding: "8px 10px",
    background: "#f0fdf4",
    borderRadius: 8,
    border: "1px solid #bbf7d0",
    fontSize: 14,
  },
  entityKind: {
    fontSize: 11,
    fontWeight: 700,
    color: "#166534",
    textTransform: "uppercase",
    marginBottom: 2,
  },
};
