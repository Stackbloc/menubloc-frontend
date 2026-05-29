import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useParams } from "react-router-dom";
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

export default function OwnerTicketDetail() {
  const { t } = useLanguage();
  const { ticketId } = useParams();
  const { owner } = useOwner();
  const [data, setData] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = React.useCallback(async () => {
    const [ticketJson, listJson] = await Promise.all([
      getOwnerSupportTicket(ticketId),
      getOwnerSupportTickets(),
    ]);
    setData(ticketJson);
    setAdmins(listJson.admins || []);
  }, [ticketId]);

  useEffect(() => {
    load().catch(() => setError("Owner dashboard data is temporarily unavailable."));
  }, [load]);

  async function sendReply() {
    await replyOwnerSupportTicket(ticketId, reply);
    setReply("");
    await load();
  }

  async function sendNote() {
    await addOwnerSupportInternalNote(ticketId, note);
    setNote("");
    await load();
  }

  const ticket = data?.ticket;

  return (
    <OwnerLayout title={`Support Ticket ${ticket?.ticket_number || `#${ticketId}`}`}>
      {error ? <ErrorBanner message={error} /> : null}
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
              <select value={ticket.status || "open"} onChange={(e) => updateOwnerSupportTicketStatus(ticketId, e.target.value).then(load).catch((err) => setError(err.message))} style={inputStyle}>
                {["open", "pending", "waiting", "in_progress", "resolved", "closed"].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select value={ticket.priority || "normal"} onChange={(e) => updateOwnerSupportTicketPriority(ticketId, e.target.value).then(load).catch((err) => setError(err.message))} style={inputStyle}>
                {["low", "normal", "high", "urgent"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
              <select value={ticket.assigned_to_user_id || ""} onChange={(e) => updateOwnerSupportTicketAssignment(ticketId, e.target.value || null).then(load).catch((err) => setError(err.message))} style={inputStyle}>
                <option value="">Unassigned</option>
                {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.full_name || admin.email}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => updateOwnerSupportTicketAssignment(ticketId, owner?.id || null).then(load).catch((err) => setError(err.message))} style={buttonStyle}>
                Assign to me
              </button>
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
                <button disabled={!reply.trim()} onClick={() => sendReply().catch((err) => setError(err.message))} style={buttonStyle}>
                  Send reply
                </button>
              </PageCard>

              <PageCard style={{ padding: 22 }}>
                <SectionTitle title="Internal Note" subtitle="Owner/admin only." />
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} style={textareaStyle} />
                <button disabled={!note.trim()} onClick={() => sendNote().catch((err) => setError(err.message))} style={buttonStyle}>
                  Save internal note
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
  return <div style={{ padding: 14, borderRadius: 14, background: "#fff", border: "1px solid #ead9ce" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#667085" }}>{label}</div><div style={{ marginTop: 8, fontWeight: 800 }}>{value || "N/A"}</div></div>;
}

function ErrorBanner({ message }) {
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>{message}</div>;
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff", width: "100%" };
const textareaStyle = { width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff", padding: 12, marginBottom: 12 };
const buttonStyle = { border: "none", background: "#9f3a22", color: "#fff", borderRadius: 12, padding: "11px 14px", fontWeight: 700, cursor: "pointer" };
