import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCrmFollowUps,
  markCrmFollowUpStatus,
  scheduleCrmFollowUp,
} from "../../lib/crmApi.js";
import {
  Badge,
  CRM_COLORS,
  CrmCard,
  CrmPage,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
  formatDateTime,
  toInputDateTime,
} from "./CrmShared.jsx";
import CrmEmailComposer from "./CrmEmailComposer.jsx";

export default function CrmFollowUps() {
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [composeLead, setComposeLead] = useState(null);
  const [scheduleLeadId, setScheduleLeadId] = useState(null);
  const [scheduleValue, setScheduleValue] = useState("");

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    try {
      setError("");
      const json = await getCrmFollowUps({ filter });
      setRows(json.follow_ups || []);
    } catch (err) {
      setError(err.message || "Unable to load follow-ups");
    }
  }

  async function markStatus(leadId, status) {
    try {
      setError("");
      await markCrmFollowUpStatus(leadId, { status });
      setSuccess(`Marked ${status.replace(/_/g, " ")}.`);
      load();
    } catch (err) {
      setError(err.message || "Unable to update status");
    }
  }

  async function saveSchedule() {
    try {
      setError("");
      await scheduleCrmFollowUp(scheduleLeadId, { next_follow_up_at: scheduleValue });
      setSuccess("Follow-up scheduled.");
      setScheduleLeadId(null);
      setScheduleValue("");
      load();
    } catch (err) {
      setError(err.message || "Unable to schedule follow-up");
    }
  }

  const contactLabel = (row) => {
    const name = [row.contact_first_name, row.contact_last_name].filter(Boolean).join(" ");
    return name || row.contact_name || row.contact_email || row.lead_email || "—";
  };

  return (
    <CrmPage title="Follow-Ups">
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <CrmCard
        title="Follow-up queue"
        subtitle="Sorted overdue first. Follow-Up Due is derived from next_follow_up_at."
        action={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ border: `1px solid ${CRM_COLORS.line}`, borderRadius: 10, padding: "8px 10px", fontWeight: 600 }}
          >
            <option value="all">All scheduled</option>
            <option value="overdue">Overdue</option>
            <option value="due_today">Due today</option>
            <option value="upcoming">Upcoming</option>
          </select>
        }
      >
        {!rows.length ? (
          <EmptyState>No follow-ups. Prospects with a next follow-up date will appear here.</EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((row) => (
              <div
                key={row.lead_id}
                style={{
                  border: `1px solid ${row.is_overdue ? "#f0b4b7" : CRM_COLORS.line}`,
                  background: row.is_overdue ? "#fff7f7" : "#fff",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>
                      <Link to={`/crm/leads/${row.lead_id}`} style={{ color: CRM_COLORS.accent, textDecoration: "none" }}>
                        {row.restaurant_name || row.lead_name}
                      </Link>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: CRM_COLORS.muted }}>
                      Contact: {contactLabel(row)}
                      {row.contact_title ? ` · ${row.contact_title}` : ""}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <Badge type="status" value={row.is_overdue ? "overdue" : "upcoming"} />
                      <Badge type="status" value={row.status} />
                      <span style={{ fontSize: 12, color: CRM_COLORS.muted }}>
                        Last contact {formatDateTime(row.last_contacted_at)} · Next {formatDateTime(row.next_follow_up_at)}
                      </span>
                    </div>
                    {row.last_email_subject ? (
                      <div style={{ marginTop: 8, fontSize: 13 }}>Last email: {row.last_email_subject}</div>
                    ) : null}
                    {row.notes_summary ? (
                      <div style={{ marginTop: 8, fontSize: 13, color: CRM_COLORS.muted, whiteSpace: "pre-wrap" }}>
                        {row.notes_summary}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignContent: "flex-start" }}>
                    <Link
                      to={`/crm/leads/${row.lead_id}`}
                      style={{ border: `1px solid ${CRM_COLORS.line}`, borderRadius: 10, padding: "8px 10px", fontWeight: 700, textDecoration: "none", color: CRM_COLORS.ink }}
                    >
                      View Prospect
                    </Link>
                    <button
                      type="button"
                      onClick={() => setComposeLead(row)}
                      style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Send Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleLeadId(row.lead_id);
                        setScheduleValue(toInputDateTime(row.next_follow_up_at) || "");
                      }}
                      style={{ border: `1px solid ${CRM_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Schedule Follow-Up
                    </button>
                    <button type="button" onClick={() => markStatus(row.lead_id, "responded")} style={actionBtn}>
                      Mark Responded
                    </button>
                    <button type="button" onClick={() => markStatus(row.lead_id, "lost")} style={actionBtn}>
                      Not Interested
                    </button>
                    <button type="button" onClick={() => markStatus(row.lead_id, "do_not_contact")} style={actionBtn}>
                      Do Not Contact
                    </button>
                  </div>
                </div>
                {scheduleLeadId === row.lead_id ? (
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      type="datetime-local"
                      value={scheduleValue}
                      onChange={(e) => setScheduleValue(e.target.value)}
                      style={{ border: `1px solid ${CRM_COLORS.line}`, borderRadius: 10, padding: "8px 10px" }}
                    />
                    <button type="button" onClick={saveSchedule} style={{ border: "none", background: CRM_COLORS.accent, color: "#fff", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
                      Save
                    </button>
                    <button type="button" onClick={() => setScheduleLeadId(null)} style={actionBtn}>
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CrmCard>

      {composeLead ? (
        <CrmEmailComposer
          leadId={composeLead.lead_id}
          restaurantId={composeLead.restaurant_id}
          defaultContactId={composeLead.primary_contact_id || ""}
          onClose={() => setComposeLead(null)}
          onSent={() => {
            setComposeLead(null);
            setSuccess("Email recorded.");
            load();
          }}
        />
      ) : null}
    </CrmPage>
  );
}

const actionBtn = {
  border: `1px solid ${CRM_COLORS.line}`,
  background: "#fff",
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 700,
  cursor: "pointer",
};
