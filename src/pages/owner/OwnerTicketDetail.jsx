import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useNavigate, useParams } from "react-router-dom";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  addOwnerSupportInternalNote,
  getOwnerSupportTicket,
  getOwnerSupportTickets,
  replyOwnerSupportTicket,
  updateOwnerSupportTicketAssignment,
  updateOwnerSupportTicketPriority,
  updateOwnerSupportTicketStatus,
} from "../../lib/ownerApi.js";
import { useOwner } from "../../context/OwnerContext.jsx";

const VALID_STATUSES = ["open", "waiting", "in_progress", "resolved", "closed"];
const TERMINAL_STATUSES = new Set(["resolved", "closed"]);

export default function OwnerTicketDetail() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { owner } = useOwner();
  const [data, setData] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [busy, setBusy] = useState("");

  const load = React.useCallback(async () => {
    const [ticketJson, listJson] = await Promise.all([
      getOwnerSupportTicket(ticketId),
      getOwnerSupportTickets(),
    ]);
    setData(ticketJson);
    setAdmins(ticketJson.admins || listJson.admins || []);
  }, [ticketId]);

  useEffect(() => {
    load().catch(() => setError("Owner dashboard data is temporarily unavailable."));
  }, [load]);

  async function runAction(key, message, action) {
    setError("");
    setSuccessMessage("");
    setBusy(key);
    try {
      await action();
      await load();
      setSuccessMessage(message);
    } catch (err) {
      setError(err?.message || "Request failed.");
    } finally {
      setBusy("");
    }
  }

  async function sendReply() {
    const message = reply.trim();
    if (!message) return;
    await runAction("reply", "Public reply sent. Change has been saved.", async () => {
      await replyOwnerSupportTicket(ticketId, message);
      setReply("");
    });
  }

  async function sendNote() {
    const message = note.trim();
    if (!message) return;
    await runAction("note", "Internal note saved. Change has been saved.", async () => {
      await addOwnerSupportInternalNote(ticketId, message);
      setNote("");
    });
  }

  async function handleStatusChange(nextStatus) {
    await runAction(
      "status",
      `Status updated to “${nextStatus}”. Change has been saved.`,
      () => updateOwnerSupportTicketStatus(ticketId, nextStatus)
    );
  }

  async function handlePriorityChange(nextPriority) {
    await runAction(
      "priority",
      `Priority updated to “${nextPriority}”. Change has been saved.`,
      () => updateOwnerSupportTicketPriority(ticketId, nextPriority)
    );
  }

  async function handleAssignmentChange(nextAssigneeId) {
    const assigneeId = nextAssigneeId ? Number(nextAssigneeId) : null;
    const label = assigneeId
      ? (admins.find((admin) => Number(admin.id) === assigneeId)?.full_name
        || admins.find((admin) => Number(admin.id) === assigneeId)?.email
        || `admin #${assigneeId}`)
      : "Unassigned";
    await runAction(
      "assign",
      `Assignment updated to “${label}”. Change has been saved.`,
      () => updateOwnerSupportTicketAssignment(ticketId, assigneeId)
    );
  }

  async function handleAssignToMe() {
    if (!owner?.id) {
      setError("Owner session not loaded yet. Refresh and try Assign to me again.");
      return;
    }
    await handleAssignmentChange(owner.id);
  }

  const ticket = data?.ticket;
  const assignedValue = ticket?.assigned_to_user_id != null ? String(ticket.assigned_to_user_id) : "";
  const isTerminal = TERMINAL_STATUSES.has(String(ticket?.status || "").toLowerCase());

  return (
    <OwnerLayout title={`Support Ticket ${ticket?.ticket_number || `#${ticketId}`}`}>
      {error ? <ErrorBanner message={error} /> : null}
      {successMessage ? <SuccessBanner message={successMessage} /> : null}
      {!ticket ? <EmptyState>Loading ticket details.</EmptyState> : (
        <div style={{ display: "grid", gap: 18 }}>
          <PageCard style={{ padding: 22 }}>
            <SectionTitle title={ticket.subject} subtitle={ticket.description || "No description captured."} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: 14 }}>
              <MetaCard label="Status" value={ticket.status} />
              <MetaCard label="Priority" value={ticket.priority} />
              <MetaCard label="Restaurant" value={ticket.restaurant_name || "Unlinked"} />
              <MetaCard label="Source" value={ticket.ticket_source || "unknown"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Status</span>
                <select
                  value={ticket.status || "open"}
                  disabled={Boolean(busy)}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={inputStyle}
                >
                  {VALID_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Priority</span>
                <select
                  value={ticket.priority || "normal"}
                  disabled={Boolean(busy)}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  style={inputStyle}
                >
                  {["low", "normal", "high", "urgent"].map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Assignee</span>
                <select
                  value={assignedValue}
                  disabled={Boolean(busy)}
                  onChange={(e) => handleAssignmentChange(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Unassigned</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={String(admin.id)}>{admin.full_name || admin.email}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={Boolean(busy) || !owner?.id}
                onClick={() => handleAssignToMe()}
                style={buttonStyle}
              >
                {busy === "assign" ? "Assigning…" : "Assign to me"}
              </button>
              {!isTerminal ? (
                <>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => handleStatusChange("resolved")}
                    style={secondaryButtonStyle}
                  >
                    {busy === "status" ? "Updating…" : "Resolve ticket"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => handleStatusChange("closed")}
                    style={secondaryButtonStyle}
                  >
                    {busy === "status" ? "Updating…" : "Close ticket"}
                  </button>
                </>
              ) : null}
              {successMessage ? (
                <button type="button" onClick={() => navigate("/owner/support")} style={buttonStyle}>
                  Back to queue
                </button>
              ) : null}
            </div>
          </PageCard>

          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Conversation" subtitle="Customer-visible replies and internal notes are kept separate." />
              {!data?.messages?.length ? <EmptyState>No messages yet.</EmptyState> : (
                <div style={{ display: "grid", gap: 12 }}>
                  {data.messages.map((message) => (
                    <div key={message.id} style={{ padding: 14, borderRadius: 14, background: message.is_internal_note ? "#fff4cf" : "#fff", border: "1px solid #ead9ce" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                        {message.author_type || "system"} {message.is_internal_note ? "• Internal note" : ""}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{message.message_body}</div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 8 }}>{formatDate(message.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>

            <div style={{ display: "grid", gap: 18 }}>
              <PageCard style={{ padding: 22 }}>
                <SectionTitle title="Public Reply" subtitle="Visible to the ticket submitter." />
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} style={textareaStyle} />
                <button type="button" disabled={!reply.trim() || Boolean(busy)} onClick={() => sendReply()} style={buttonStyle}>
                  {busy === "reply" ? "Sending…" : "Send reply"}
                </button>
              </PageCard>

              <PageCard style={{ padding: 22 }}>
                <SectionTitle title="Internal Note" subtitle="Owner/admin only." />
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} style={textareaStyle} />
                <button type="button" disabled={!note.trim() || Boolean(busy)} onClick={() => sendNote()} style={buttonStyle}>
                  {busy === "note" ? "Saving…" : "Save internal note"}
                </button>
              </PageCard>

              <PageCard style={{ padding: 22 }}>
                <SectionTitle title="Event Log" subtitle="Support workflow audit trail." />
                {!data?.events?.length ? <EmptyState>No events captured yet.</EmptyState> : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {data.events.map((event) => (
                      <div key={event.id} style={{ padding: "10px 12px", borderRadius: 12, background: "#fff", border: "1px solid #ead9ce" }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{event.event_type}</div>
                        <div style={{ marginTop: 4, fontSize: 13, color: "#667085" }}>{event.old_value || "∅"} → {event.new_value || "∅"}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: "#667085" }}>{formatDate(event.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </PageCard>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}

function MetaCard({ label, value }) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: "#fff", border: "1px solid #ead9ce" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#667085" }}>{label}</div>
      <div style={{ marginTop: 8, fontWeight: 800 }}>{value || "N/A"}</div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>{message}</div>;
}

function SuccessBanner({ message }) {
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#eef8f0", color: "#155724" }}>{message}</div>;
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

const labelStyle = { display: "grid", gap: 6 };
const labelTextStyle = { fontSize: 12, fontWeight: 700, color: "#667085" };
const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff", width: "100%" };
const textareaStyle = { width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff", padding: 12, marginBottom: 12 };
const buttonStyle = { border: "none", background: "#9f3a22", color: "#fff", borderRadius: 12, padding: "11px 14px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { border: "1px solid #9f3a22", background: "#fff", color: "#9f3a22", borderRadius: 12, padding: "11px 14px", fontWeight: 700, cursor: "pointer" };
