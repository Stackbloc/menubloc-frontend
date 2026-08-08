import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import {
  getDistributorInbox,
  getDistributorMessages,
  postDistributorMessage,
} from "../../lib/distributorApi.js";

export function DistributorInboxPage() {
  const [threads, setThreads] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDistributorInbox()
      .then((data) => {
        if (!cancelled) setThreads(data.threads || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load inbox");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DistributorLayout title="Messages">
      <PageCard>
        <SectionTitle
          title="Inbox"
          subtitle="Messaging is available after a restaurant accepts your connection."
        />
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
        <div style={{ display: "grid", gap: 10 }}>
          {threads.map((t) => (
            <Link
              key={t.thread_id}
              to={`/distributor/messages/${t.relationship_id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                border: `1px solid ${DIST_COLORS.line}`,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 800 }}>{t.restaurant_name}</div>
              <div style={{ fontSize: 12, color: DIST_COLORS.muted, marginTop: 4 }}>
                {t.last_body || "No messages yet"}
                {t.unread_count ? ` · ${t.unread_count} unread` : ""}
              </div>
            </Link>
          ))}
          {!error && threads.length === 0 ? (
            <div style={{ color: DIST_COLORS.muted }}>No conversations yet.</div>
          ) : null}
        </div>
      </PageCard>
    </DistributorLayout>
  );
}

export function DistributorThreadPage() {
  const { relationshipId } = useParams();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await getDistributorMessages(relationshipId);
    setMessages(data.messages || []);
  }

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load messages");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationshipId]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      await postDistributorMessage(relationshipId, body.trim());
      setBody("");
      await load();
    } catch (err) {
      setError(err.message || "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DistributorLayout title="Conversation">
      <PageCard>
        <SectionTitle
          title="Thread"
          subtitle="Connected-party messages only"
          action={
            <Link to="/distributor/messages" style={{ fontSize: 13, color: DIST_COLORS.accent }}>
              ← Inbox
            </Link>
          }
        />
        {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.sender_side === "distributor" ? "end" : "start",
                background: m.sender_side === "distributor" ? "#ecfdf5" : "#f8fafc",
                border: `1px solid ${DIST_COLORS.line}`,
                borderRadius: 12,
                padding: 12,
                maxWidth: "85%",
              }}
            >
              <div style={{ fontSize: 11, color: DIST_COLORS.muted, marginBottom: 4 }}>
                {m.sender_side} · {new Date(m.created_at).toLocaleString()}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
            </div>
          ))}
        </div>
        <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message…"
            style={{
              flex: 1,
              border: `1px solid ${DIST_COLORS.line}`,
              borderRadius: 10,
              padding: "10px 12px",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={busy}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "10px 14px",
              background: DIST_COLORS.accent,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Send
          </button>
        </form>
      </PageCard>
    </DistributorLayout>
  );
}
