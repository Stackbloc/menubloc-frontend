import React, { useCallback, useEffect, useMemo, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  acceptDistributorRelationship,
  declineDistributorRelationship,
  disconnectDistributorRelationship,
  getDistributorRelationships,
  getOperatorDistributorInbox,
  getOperatorDistributorMessages,
  postOperatorDistributorMessage,
} from "../../lib/operatorApi.js";

export default function OperatorDistributorRelationships() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const [relationships, setRelationships] = useState([]);
  const [threads, setThreads] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    if (!rid) return;
    const [rels, inbox] = await Promise.all([
      getDistributorRelationships(rid),
      getOperatorDistributorInbox(rid).catch(() => ({ threads: [] })),
    ]);
    setRelationships(rels.relationships || []);
    setThreads(inbox.threads || []);
  }, [rid]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    load().catch((err) => {
      if (!cancelled) setError(err.message || "Failed to load relationships");
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const groups = useMemo(() => {
    const pending = relationships.filter((r) => r.status === "requested");
    const connected = relationships.filter((r) => r.status === "connected");
    const reported = relationships.filter(
      (r) => r.usage_reported && r.status === "reported"
    );
    const other = relationships.filter((r) =>
      ["declined", "disconnected"].includes(r.status)
    );
    return { pending, connected, reported, other };
  }, [relationships]);

  async function act(relationshipId, action) {
    if (!rid) return;
    setBusyId(relationshipId);
    setError("");
    try {
      if (action === "accept") await acceptDistributorRelationship(rid, relationshipId);
      if (action === "decline") await declineDistributorRelationship(rid, relationshipId);
      if (action === "disconnect") await disconnectDistributorRelationship(rid, relationshipId);
      await load();
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function openThread(relationshipId) {
    setActiveThreadId(relationshipId);
    setBody("");
    try {
      const data = await getOperatorDistributorMessages(rid, relationshipId);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!rid || !activeThreadId || !body.trim()) return;
    try {
      await postOperatorDistributorMessage(rid, activeThreadId, body.trim());
      setBody("");
      const data = await getOperatorDistributorMessages(rid, activeThreadId);
      setMessages(data.messages || []);
      await load();
    } catch (err) {
      setError(err.message || "Send failed");
    }
  }

  return (
    <OperatorLayout title="Distributor Relationships">
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "8px 4px 40px" }}>
        {!rid ? (
          <p>Select a restaurant to manage distributor relationships.</p>
        ) : (
          <>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
              Review connection requests from distributors. Accepting enables messaging.
              Reporting usage during onboarding does not grant outreach consent.
            </p>
            {error ? (
              <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>
            ) : null}

            <Section
              title="Connection requests"
              empty="No pending connection requests."
              items={groups.pending}
              renderActions={(r) => (
                <>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => act(r.id, "accept")}
                    style={primaryBtn}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => act(r.id, "decline")}
                    style={secondaryBtn}
                  >
                    Decline
                  </button>
                </>
              )}
              requestCopy
            />

            <Section
              title="Connected"
              empty="No connected distributors yet."
              items={groups.connected}
              renderActions={(r) => (
                <>
                  <button type="button" onClick={() => openThread(r.id)} style={secondaryBtn}>
                    Messages
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => act(r.id, "disconnect")}
                    style={secondaryBtn}
                  >
                    Disconnect
                  </button>
                </>
              )}
            />

            <Section
              title="Reported usage"
              empty="No distributors reported for this restaurant."
              items={groups.reported}
            />

            <details style={{ marginTop: 20 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                Declined / disconnected ({groups.other.length})
              </summary>
              <Section title="" empty="None." items={groups.other} />
            </details>

            {threads.length > 0 ? (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ margin: "0 0 10px" }}>Message inbox</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {threads.map((t) => (
                    <button
                      key={t.thread_id}
                      type="button"
                      onClick={() => openThread(t.relationship_id)}
                      style={{
                        textAlign: "left",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: 12,
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <strong>{t.distributor_display_name}</strong>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {t.last_body || "No messages"}
                        {t.unread_count ? ` · ${t.unread_count} unread` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {activeThreadId ? (
              <div
                style={{
                  marginTop: 24,
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 16,
                  background: "#fff",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Conversation</h3>
                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: m.sender_side === "restaurant" ? "#ecfdf5" : "#f8fafc",
                        borderRadius: 10,
                        padding: 10,
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {m.sender_side} · {new Date(m.created_at).toLocaleString()}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write a message…"
                    style={{
                      flex: 1,
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  />
                  <button type="submit" style={primaryBtn}>
                    Send
                  </button>
                </form>
              </div>
            ) : null}
          </>
        )}
      </div>
    </OperatorLayout>
  );
}

function Section({ title, empty, items, renderActions, requestCopy }) {
  return (
    <section style={{ marginTop: 22 }}>
      {title ? <h3 style={{ margin: "0 0 10px" }}>{title}</h3> : null}
      {items.length === 0 ? (
        <div style={{ color: "#94a3b8", fontSize: 14 }}>{empty}</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 14,
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                {requestCopy ? (
                  <div style={{ fontWeight: 700 }}>
                    {r.distributor_display_name || "A distributor"} wants to connect
                  </div>
                ) : (
                  <div style={{ fontWeight: 700 }}>
                    {r.distributor_display_name || r.distributor_slug || "Distributor"}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Status: {r.status}
                  {r.usage_reported ? " · usage reported" : ""}
                </div>
              </div>
              {renderActions ? (
                <div style={{ display: "flex", gap: 8 }}>{renderActions(r)}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const primaryBtn = {
  border: "none",
  borderRadius: 10,
  padding: "8px 12px",
  background: "#15803d",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  ...primaryBtn,
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #e2e8f0",
};
