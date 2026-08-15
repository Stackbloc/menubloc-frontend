/**
 * Dining Crews — who wants to eat?
 * Create crew, invite, members, meal conversation (text + food entities).
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  listDiningCrews,
  createDiningCrew,
  getDiningCrew,
  inviteToDiningCrew,
  getDiningCrewInvitation,
  acceptDiningCrewInvitation,
  declineDiningCrewInvitation,
  listDiningCrewConversations,
  startDiningCrewConversation,
  listDiningCrewMessages,
  postDiningCrewMessage,
} from "../../lib/consumerApi.js";
import DiningCrewFoodEntityPicker from "../../components/diningCrews/DiningCrewFoodEntityPicker.jsx";

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

  const loadCrew = useCallback(async () => {
    const data = await getDiningCrew(crewId);
    setCrew(data.crew);
    const convos = await listDiningCrewConversations(crewId);
    setConversations(convos.conversations || []);
    if (!activeConvoId && convos.conversations?.[0]) {
      setActiveConvoId(convos.conversations[0].id);
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
              <h2 style={styles.h2}>Members ({crew.member_count})</h2>
              <ul style={styles.list}>
                {crew.members?.map((m) => (
                  <li key={m.user_id} style={styles.card}>
                    <div>
                      <strong>{m.display_name || `Member #${m.user_id}`}</strong>
                      <span style={styles.muted}> · {m.role}</span>
                      {m.edu_verified ? (
                        <div style={styles.edu}>{m.edu_verification_badge}</div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section style={styles.section}>
              <h2 style={styles.h2}>Invite</h2>
              <form onSubmit={handleInvite} style={styles.form}>
                <input
                  style={styles.input}
                  value={inviteeId}
                  onChange={(e) => setInviteeId(e.target.value)}
                  placeholder="Member id (optional)"
                />
                <button type="submit" style={styles.primaryBtn} disabled={busy}>
                  Create invite link
                </button>
              </form>
              {inviteUrl ? (
                <p style={styles.notice}>
                  Share link: <code style={{ wordBreak: "break-all" }}>{inviteUrl}</code>
                </p>
              ) : null}
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
                        {msg.message_type !== "text" ? (
                          <EntityCard entity={msg.entity} type={msg.message_type} />
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
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="submit"
                        style={styles.primaryBtn}
                        disabled={
                          busy ||
                          (entityType === "text" ? !text.trim() : !selectedEntity)
                        }
                      >
                        Send
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
    </>
  );
}

export default function DiningCrewsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [crews, setCrews] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await listDiningCrews();
    setCrews(data.crews || []);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account/login", { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated) {
      load().catch((err) => setError(err.message || "Unable to load crews"));
    }
  }, [authLoading, isAuthenticated, navigate, load]);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await createDiningCrew(name.trim());
      setName("");
      navigate(`/account/dining-crews/${data.crew.id}`);
    } catch (err) {
      setError(err.message || "Unable to create crew");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="Dining Crews" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Small groups who eat together. Create a crew, invite people, and start a meal
          conversation to decide where and what to eat.
        </p>
        {error ? <p style={styles.error}>{error}</p> : null}

        <section style={styles.section}>
          <h2 style={styles.h2}>Create a Dining Crew</h2>
          <form onSubmit={handleCreate} style={styles.form}>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Crew name"
              maxLength={80}
              required
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
                    <div style={styles.muted}>{c.member_count} members</div>
                  </div>
                  <Link to={`/account/dining-crews/${c.id}`} style={styles.link}>
                    Open
                  </Link>
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
  actions: { display: "flex", gap: 8 },
  input: {
    flex: "1 1 180px",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
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
