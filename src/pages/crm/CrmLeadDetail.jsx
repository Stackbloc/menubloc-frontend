import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createCrmLeadActivity,
  createCrmLeadTask,
  getCrmLead,
  linkCrmLeadRestaurant,
  updateCrmLead,
  updateCrmLeadStage,
  completeCrmTask,
} from "../../lib/crmApi.js";
import {
  Badge,
  CrmCard,
  CrmPage,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
  fieldValue,
  formatDateTime,
  toInputDateTime,
} from "./CrmShared.jsx";

const STAGES = ["new", "qualified", "outreach", "engaged", "demo", "trial", "negotiation", "won", "lost"];

export default function CrmLeadDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [leadForm, setLeadForm] = useState(null);
  const [stageForm, setStageForm] = useState({ pipeline_stage: "engaged", change_reason: "", loss_reason: "" });
  const [activityForm, setActivityForm] = useState({ activity_type: "call", direction: "outbound", subject: "", body: "", follow_up_at: "" });
  const [taskForm, setTaskForm] = useState({ title: "", task_type: "follow_up_call", priority: "normal", due_at: "" });
  const [linkRestaurantId, setLinkRestaurantId] = useState("");

  useEffect(() => {
    loadLead();
  }, [id]);

  async function loadLead() {
    try {
      setError("");
      const json = await getCrmLead(id);
      setData(json);
      setLeadForm({
        lead_name: json.lead?.lead_name || "",
        contact_name: json.lead?.contact_name || "",
        contact_title: json.lead?.contact_title || "",
        phone: json.lead?.phone || "",
        email: json.lead?.email || "",
        website: json.lead?.website || "",
        address_line1: json.lead?.address_line1 || json.lead?.account_address || "",
        city: json.lead?.city || "",
        state: json.lead?.state || "",
        postal_code: json.lead?.postal_code || json.lead?.account_postal_code || "",
        source: json.lead?.source || "",
        source_detail: json.lead?.source_detail || "",
        priority: json.lead?.priority || "normal",
        assigned_user: json.lead?.assigned_user || "",
        notes_summary: json.lead?.notes_summary || "",
        next_follow_up_at: toInputDateTime(json.lead?.next_follow_up_at),
      });
      setStageForm((current) => ({ ...current, pipeline_stage: json.lead?.pipeline_stage || "new" }));
    } catch (err) {
      setError(err.message || "Unable to load lead");
    }
  }

  async function handleLeadSave(event) {
    event.preventDefault();
    try {
      setError("");
      await updateCrmLead(id, leadForm);
      setSuccess("Lead updated.");
      loadLead();
    } catch (err) {
      setError(err.message || "Unable to update lead");
    }
  }

  async function handleStageChange(event) {
    event.preventDefault();
    try {
      setError("");
      await updateCrmLeadStage(id, stageForm);
      setSuccess("Pipeline stage updated.");
      loadLead();
    } catch (err) {
      setError(err.message || "Unable to update stage");
    }
  }

  async function handleActivityCreate(event) {
    event.preventDefault();
    try {
      setError("");
      await createCrmLeadActivity(id, activityForm);
      setActivityForm({ activity_type: "call", direction: "outbound", subject: "", body: "", follow_up_at: "" });
      setSuccess("Activity added.");
      loadLead();
    } catch (err) {
      setError(err.message || "Unable to add activity");
    }
  }

  async function handleTaskCreate(event) {
    event.preventDefault();
    try {
      setError("");
      await createCrmLeadTask(id, taskForm);
      setTaskForm({ title: "", task_type: "follow_up_call", priority: "normal", due_at: "" });
      setSuccess("Task created.");
      loadLead();
    } catch (err) {
      setError(err.message || "Unable to create task");
    }
  }

  async function handleTaskComplete(taskId) {
    try {
      setError("");
      await completeCrmTask(taskId);
      setSuccess("Task completed.");
      loadLead();
    } catch (err) {
      setError(err.message || "Unable to complete task");
    }
  }

  async function handleLinkRestaurant(event) {
    event.preventDefault();
    try {
      setError("");
      await linkCrmLeadRestaurant(id, Number(linkRestaurantId));
      setSuccess("Restaurant linked.");
      setLinkRestaurantId("");
      loadLead();
    } catch (err) {
      setError(err.message || "Unable to link restaurant");
    }
  }

  const lead = data?.lead;

  return (
    <CrmPage
      title={lead ? `CRM Lead: ${lead.lead_name}` : "CRM Lead"}
      actions={<Link to="/crm/leads" style={backLinkStyle}>Back to leads</Link>}
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {!lead || !leadForm ? (
        <EmptyState>Loading lead.</EmptyState>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 18 }}>
            <CrmCard title="Lead Overview" subtitle={lead.restaurant_name || "No linked restaurant yet"}>
              <div style={overviewGridStyle}>
                <Field label="Lead name" value={lead.lead_name} />
                <Field label="Restaurant" value={lead.restaurant_name || "—"} />
                <Field label="Address" value={[lead.account_address, lead.account_city, lead.account_state, lead.account_postal_code].filter(Boolean).join(", ") || "—"} />
                <Field label="City / State" value={`${fieldValue(lead.account_city)} / ${fieldValue(lead.account_state)}`} />
                <Field label="Source" value={lead.source} />
                <Field label="Assigned user" value={lead.assigned_user} />
                <Field label="Next follow-up" value={formatDateTime(lead.next_follow_up_at)} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                <Badge type="stage" value={lead.pipeline_stage} />
                <Badge type="status" value={lead.status} />
                <Badge type="priority" value={lead.priority} />
              </div>
            </CrmCard>

            <CrmCard title="Account Intelligence" subtitle="Live Common Knowledge snapshot">
              <div style={overviewGridStyle}>
                <Field label="Restaurant ID" value={lead.restaurant_id} />
                <Field label="Claim status" value={<Badge type="account" value={lead.claim_status} />} />
                <Field label="Subscription" value={<Badge type="account" value={lead.subscription_status} />} />
                <Field label="Plan" value={fieldValue(lead.subscription_plan)} />
                <Field label="Onboarding" value={<Badge type="account" value={lead.onboarding_status} />} />
                <Field label="Menus" value={`${lead.menu_count || 0} menus / ${lead.menu_item_count || 0} items`} />
                <Field label="Recent activity" value={fieldValue(lead.recent_activity_count)} />
                <Field label="Open tasks" value={fieldValue(lead.open_task_count)} />
                <Field label="Search demand" value={fieldValue(lead.search_demand_count)} />
              </div>
              {lead.restaurant_slug ? (
                <a href={`/restaurants/${lead.restaurant_slug}`} target="_blank" rel="noreferrer" style={inlineLinkStyle}>
                  Open public profile
                </a>
              ) : null}
            </CrmCard>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, marginBottom: 18 }}>
            <CrmCard title="Edit Lead">
              <form onSubmit={handleLeadSave} style={{ display: "grid", gap: 10 }}>
                <div style={twoColStyle}>
                  <input value={leadForm.lead_name} onChange={(e) => setLeadForm({ ...leadForm, lead_name: e.target.value })} placeholder="Lead name" style={inputStyle} />
                  <input value={leadForm.contact_name} onChange={(e) => setLeadForm({ ...leadForm, contact_name: e.target.value })} placeholder="Contact name" style={inputStyle} />
                </div>
                <div style={twoColStyle}>
                  <input value={leadForm.contact_title} onChange={(e) => setLeadForm({ ...leadForm, contact_title: e.target.value })} placeholder="Contact title" style={inputStyle} />
                  <input value={leadForm.assigned_user} onChange={(e) => setLeadForm({ ...leadForm, assigned_user: e.target.value })} placeholder="Assigned user" style={inputStyle} />
                </div>
                <div style={twoColStyle}>
                  <input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
                  <input value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="Email" style={inputStyle} />
                </div>
                <div style={twoColStyle}>
                  <input value={leadForm.website} onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })} placeholder="Website" style={inputStyle} />
                  <select value={leadForm.priority} onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value })} style={inputStyle}>
                    {["low", "normal", "high", "urgent"].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </div>
                <input value={leadForm.address_line1} onChange={(e) => setLeadForm({ ...leadForm, address_line1: e.target.value })} placeholder="Street address" style={inputStyle} />
                <div style={threeColStyle}>
                  <input value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })} placeholder="City" style={inputStyle} />
                  <input value={leadForm.state} onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })} placeholder="State" style={inputStyle} />
                  <input value={leadForm.postal_code} onChange={(e) => setLeadForm({ ...leadForm, postal_code: e.target.value })} placeholder="ZIP" style={inputStyle} />
                </div>
                <div style={twoColStyle}>
                  <input value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} placeholder="Source" style={inputStyle} />
                  <input value={leadForm.source_detail} onChange={(e) => setLeadForm({ ...leadForm, source_detail: e.target.value })} placeholder="Source detail" style={inputStyle} />
                </div>
                <input type="datetime-local" value={leadForm.next_follow_up_at} onChange={(e) => setLeadForm({ ...leadForm, next_follow_up_at: e.target.value })} style={inputStyle} />
                <textarea value={leadForm.notes_summary} onChange={(e) => setLeadForm({ ...leadForm, notes_summary: e.target.value })} placeholder="Notes summary" rows={4} style={{ ...inputStyle, resize: "vertical" }} />
                <button type="submit" style={primaryButtonStyle}>Save lead</button>
              </form>
            </CrmCard>

            <CrmCard title="Pipeline Controls">
              <form onSubmit={handleStageChange} style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                <select value={stageForm.pipeline_stage} onChange={(e) => setStageForm({ ...stageForm, pipeline_stage: e.target.value })} style={inputStyle}>
                  {STAGES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <input value={stageForm.change_reason} onChange={(e) => setStageForm({ ...stageForm, change_reason: e.target.value })} placeholder="Change reason" style={inputStyle} />
                {stageForm.pipeline_stage === "lost" ? (
                  <input value={stageForm.loss_reason} onChange={(e) => setStageForm({ ...stageForm, loss_reason: e.target.value })} placeholder="Loss reason" style={inputStyle} />
                ) : null}
                <button type="submit" style={primaryButtonStyle}>Update stage</button>
              </form>

              <form onSubmit={handleLinkRestaurant} style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>Restaurant linkage</div>
                <input value={linkRestaurantId} onChange={(e) => setLinkRestaurantId(e.target.value)} placeholder="Existing restaurants.id" style={inputStyle} />
                <button type="submit" style={secondaryButtonStyle}>Link restaurant</button>
              </form>
            </CrmCard>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            <CrmCard title="Activity Composer">
              <form onSubmit={handleActivityCreate} style={{ display: "grid", gap: 10 }}>
                <div style={twoColStyle}>
                  <select value={activityForm.activity_type} onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })} style={inputStyle}>
                    {["call", "email", "text", "note", "meeting", "demo", "visit"].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <select value={activityForm.direction} onChange={(e) => setActivityForm({ ...activityForm, direction: e.target.value })} style={inputStyle}>
                    {["outbound", "inbound", "internal"].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </div>
                <input value={activityForm.subject} onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })} placeholder="Subject" style={inputStyle} />
                <textarea value={activityForm.body} onChange={(e) => setActivityForm({ ...activityForm, body: e.target.value })} placeholder="Body / notes" rows={4} style={{ ...inputStyle, resize: "vertical" }} />
                <input type="datetime-local" value={activityForm.follow_up_at} onChange={(e) => setActivityForm({ ...activityForm, follow_up_at: e.target.value })} style={inputStyle} />
                <button type="submit" style={primaryButtonStyle}>Add activity</button>
              </form>
            </CrmCard>

            <CrmCard title="Task Composer">
              <form onSubmit={handleTaskCreate} style={{ display: "grid", gap: 10 }}>
                <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" style={inputStyle} />
                <div style={twoColStyle}>
                  <select value={taskForm.task_type} onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })} style={inputStyle}>
                    {["follow_up_call", "follow_up_email", "research", "demo_prep", "onboarding", "support", "custom"].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} style={inputStyle}>
                    {["low", "normal", "high", "urgent"].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </div>
                <input type="datetime-local" value={taskForm.due_at} onChange={(e) => setTaskForm({ ...taskForm, due_at: e.target.value })} style={inputStyle} />
                <button type="submit" style={primaryButtonStyle}>Create task</button>
              </form>
            </CrmCard>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
            <CrmCard title="Timeline" subtitle="Activities, tasks, and stage history">
              <TimelineSection title="Activities" items={data.activities || []} renderItem={(item) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{item.activity_type} {item.direction ? `· ${item.direction}` : ""}</div>
                  <div style={{ marginTop: 4, color: "#64748b" }}>{item.subject || item.body || "No notes"}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>{formatDateTime(item.created_at)}</div>
                </div>
              )} />

              <TimelineSection title="Tasks" items={data.tasks || []} renderItem={(item) => (
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                    <div style={{ marginTop: 4, color: "#64748b" }}>{item.task_type}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
                      Due {formatDateTime(item.due_at)} · Status {item.status}
                    </div>
                  </div>
                  {item.status !== "completed" ? <button onClick={() => handleTaskComplete(item.id)} style={secondaryButtonStyle}>Complete</button> : null}
                </div>
              )} />

              <TimelineSection title="Stage History" items={data.stage_history || []} renderItem={(item) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{fieldValue(item.from_stage)} → {item.to_stage}</div>
                  <div style={{ marginTop: 4, color: "#64748b" }}>{item.change_reason || "No reason logged"}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>{formatDateTime(item.created_at)}</div>
                </div>
              )} />
            </CrmCard>

            <CrmCard title="Score Panel" subtitle="Transparent lead scoring">
              <div style={{ display: "grid", gap: 10 }}>
                <Field label="Traffic score" value={data.score?.traffic_score ?? "0"} />
                <Field label="Completeness score" value={data.score?.completeness_score ?? "0"} />
                <Field label="Conversion score" value={data.score?.conversion_score ?? "0"} />
                <Field label="Priority score" value={data.score?.priority_score ?? "0"} />
                <div>
                  <div style={fieldLabelStyle}>Reasons</div>
                  <pre style={{ margin: "8px 0 0", padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #d9e0ea", fontSize: 12, overflowX: "auto" }}>
                    {JSON.stringify(data.score?.reasons_json || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </CrmCard>
          </div>
        </>
      )}
    </CrmPage>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 14, color: "#0f1720" }}>{value}</div>
    </div>
  );
}

function TimelineSection({ title, items, renderItem }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 800, color: "#0f1720" }}>{title}</div>
      {!items.length ? (
        <EmptyState>No {title.toLowerCase()} yet.</EmptyState>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => (
            <div key={`${title}-${item.id}`} style={{ border: "1px solid #d9e0ea", borderRadius: 12, padding: 12, background: "#fff" }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const overviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const threeColStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr",
  gap: 10,
};

const fieldLabelStyle = {
  fontSize: 12,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #d9e0ea",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  color: "#0f1720",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  background: "#194b3a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#0f1720",
  border: "1px solid #d9e0ea",
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
};

const backLinkStyle = {
  textDecoration: "none",
  color: "#194b3a",
  fontWeight: 700,
};

const inlineLinkStyle = {
  display: "inline-block",
  marginTop: 12,
  color: "#194b3a",
  fontWeight: 700,
  textDecoration: "none",
};
