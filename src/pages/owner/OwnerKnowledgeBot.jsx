import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  applyKnowledgeBotJob,
  createKnowledgeBotJob,
  getKnowledgeBotJob,
  runKnowledgeBotPreview,
  runKnowledgeBotResearch,
  updateKnowledgeBotJob,
  uploadKnowledgeBotEvidence,
} from "../../lib/ownerApi.js";

const STEPS = [
  { id: "target", label: "Define Target" },
  { id: "evidence", label: "Add Evidence" },
  { id: "instructions", label: "Instructions" },
  { id: "research", label: "Research" },
  { id: "preview", label: "Preview" },
  { id: "apply", label: "Apply" },
];

function StepNav({ current, jobId }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
      {STEPS.map((step, index) => {
        const active = step.id === current;
        return (
          <div
            key={step.id}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: active ? OWNER_COLORS.accentSoft : "#fff",
              color: active ? OWNER_COLORS.ink : OWNER_COLORS.muted,
              border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
            }}
          >
            {index + 1}. {step.label}
          </div>
        );
      })}
      {jobId ? (
        <Link
          to={`/owner/knowledge-bot/history?job=${jobId}`}
          style={{ marginLeft: "auto", fontSize: 12, color: OWNER_COLORS.accent, fontWeight: 700 }}
        >
          View in History →
        </Link>
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontFamily: "inherit",
  fontSize: 14,
};

function JsonBlock({ value }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 14,
        borderRadius: 12,
        background: "#faf8f6",
        border: `1px solid ${OWNER_COLORS.line}`,
        fontSize: 12,
        overflow: "auto",
        maxHeight: 360,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function OwnerKnowledgeBot() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeJobId = searchParams.get("job");

  const [step, setStep] = useState("target");
  const [jobId, setJobId] = useState(resumeJobId || null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmLarge, setConfirmLarge] = useState(false);

  const [form, setForm] = useState({
    target_type: "restaurant",
    target_name: "",
    target_location: "",
    restaurant_id: "",
    chain_id: "",
    reference_urls: "",
    additional_urls: "",
    admin_notes: "",
    instructions: "",
  });
  const [files, setFiles] = useState([]);

  const refreshJob = useCallback(async (id) => {
    const data = await getKnowledgeBotJob(id);
    setJob(data);
    return data;
  }, []);

  useEffect(() => {
    if (!resumeJobId) return;
    refreshJob(resumeJobId).catch(() => setError("Could not load job."));
  }, [resumeJobId, refreshJob]);

  async function ensureJob() {
    if (jobId) {
      await updateKnowledgeBotJob(jobId, {
        target_type: form.target_type,
        target_name: form.target_name,
        target_location: form.target_location,
        restaurant_id: form.restaurant_id ? Number(form.restaurant_id) : null,
        chain_id: form.chain_id ? Number(form.chain_id) : null,
        admin_notes: form.admin_notes,
        instructions: form.instructions,
        reference_urls: form.reference_urls.split("\n").map((s) => s.trim()).filter(Boolean),
        additional_urls: form.additional_urls.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      return jobId;
    }
    const created = await createKnowledgeBotJob({
      target_type: form.target_type,
      target_name: form.target_name,
      target_location: form.target_location,
      restaurant_id: form.restaurant_id ? Number(form.restaurant_id) : null,
      chain_id: form.chain_id ? Number(form.chain_id) : null,
      admin_notes: form.admin_notes,
      instructions: form.instructions,
      reference_urls: form.reference_urls.split("\n").map((s) => s.trim()).filter(Boolean),
      additional_urls: form.additional_urls.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setJobId(created.job.id);
    setJob(created);
    return created.job.id;
  }

  async function handleSaveTarget() {
    setBusy(true);
    setError("");
    try {
      await ensureJob();
      setStep("evidence");
    } catch (err) {
      setError(err.message || "Could not save target.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadEvidence() {
    setBusy(true);
    setError("");
    try {
      const id = await ensureJob();
      if (files.length) {
        const fd = new FormData();
        for (const file of files) fd.append("files", file);
        if (form.admin_notes) fd.append("note", form.admin_notes);
        await uploadKnowledgeBotEvidence(id, fd);
      }
      await refreshJob(id);
      setStep("instructions");
    } catch (err) {
      setError(err.message || "Evidence upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResearch() {
    setBusy(true);
    setError("");
    try {
      const id = await ensureJob();
      await runKnowledgeBotResearch(id);
      await refreshJob(id);
      setStep("research");
    } catch (err) {
      setError(err.message || "Research failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePreview() {
    setBusy(true);
    setError("");
    try {
      const id = await ensureJob();
      await runKnowledgeBotPreview(id);
      const data = await refreshJob(id);
      setJob(data);
      setStep("preview");
    } catch (err) {
      setError(err.message || "Preview failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleApply() {
    setBusy(true);
    setError("");
    try {
      const id = await ensureJob();
      await applyKnowledgeBotJob(id, { confirm_large: confirmLarge });
      const data = await refreshJob(id);
      setJob(data);
      setStep("apply");
    } catch (err) {
      if (err.payload?.code === "confirmation_required") {
        setError("This job requires explicit confirmation for large or franchise-wide changes. Check the box below and try again.");
      } else {
        setError(err.message || "Apply failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  const preview = job?.job?.preview_plan || job?.preview_plan;
  const research = job?.job?.research_report || job?.research_report;
  const applyResult = job?.job?.apply_result || job?.apply_result;
  const requiresConfirmation = preview?.requires_confirmation;

  const primaryButton = useMemo(() => {
    if (step === "target") return { label: busy ? "Saving…" : "Continue → Evidence", onClick: handleSaveTarget };
    if (step === "evidence") return { label: busy ? "Uploading…" : "Continue → Instructions", onClick: handleUploadEvidence };
    if (step === "instructions") return { label: busy ? "Researching…" : "Run Research", onClick: handleResearch };
    if (step === "research") return { label: busy ? "Building preview…" : "Build Preview", onClick: handlePreview };
    if (step === "preview") return { label: busy ? "Applying…" : "Approve & Apply", onClick: handleApply };
    return null;
  }, [step, busy, confirmLarge, form, files, jobId]);

  return (
    <OwnerLayout
      title="Knowledge Bot"
      actions={
        <Link
          to="/owner/knowledge-bot/history"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: OWNER_COLORS.accent,
            textDecoration: "none",
          }}
        >
          History
        </Link>
      }
    >
      <PageCard style={{ padding: "22px 24px" }}>
        <SectionTitle
          title="Restaurant & franchise ingestion"
          subtitle="Behaves like an agent install: OCR screenshots for address, hours, phone, and menu items; writes public restaurants + Common Knowledge. Choose Standalone, MLE, or Franchise."
        />
        <StepNav current={step} jobId={jobId} />

        {error ? (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#fdecea", color: "#8b2e1a", fontSize: 13 }}>
            {error}
          </div>
        ) : null}

        {step === "target" ? (
          <div>
            <Field label="Target type">
              <select
                value={form.target_type}
                onChange={(e) => setForm((f) => ({ ...f, target_type: e.target.value }))}
                style={inputStyle}
              >
                <option value="restaurant">Standalone restaurant</option>
                <option value="mle">MLE (multi-location brand)</option>
                <option value="franchise">Franchise / chain</option>
                <option value="location">Specific franchise location</option>
              </select>
            </Field>
            <Field label="Restaurant / franchise name">
              <input
                style={inputStyle}
                value={form.target_name}
                onChange={(e) => setForm((f) => ({ ...f, target_name: e.target.value }))}
                placeholder="e.g. Yogurtland"
              />
            </Field>
            <Field label="Location scope (city, county, market)">
              <input
                style={inputStyle}
                value={form.target_location}
                onChange={(e) => setForm((f) => ({ ...f, target_location: e.target.value }))}
                placeholder="e.g. Los Angeles County, CA"
              />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Existing restaurant ID (optional)">
                <input
                  style={inputStyle}
                  value={form.restaurant_id}
                  onChange={(e) => setForm((f) => ({ ...f, restaurant_id: e.target.value }))}
                />
              </Field>
              <Field label="Existing chain ID (optional)">
                <input
                  style={inputStyle}
                  value={form.chain_id}
                  onChange={(e) => setForm((f) => ({ ...f, chain_id: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {step === "evidence" ? (
          <div>
            <Field label="Reference website URLs (one per line)">
              <textarea
                style={{ ...inputStyle, minHeight: 90 }}
                value={form.reference_urls}
                onChange={(e) => setForm((f) => ({ ...f, reference_urls: e.target.value }))}
                placeholder="https://official-site.com/menu"
              />
            </Field>
            <Field label="Additional URLs (one per line)">
              <textarea
                style={{ ...inputStyle, minHeight: 70 }}
                value={form.additional_urls}
                onChange={(e) => setForm((f) => ({ ...f, additional_urls: e.target.value }))}
              />
            </Field>
            <Field label="Screenshots, images, PDFs, menu documents">
              <input type="file" multiple accept="image/*,.pdf,.txt,.md" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
                Screenshots are OCR’d (Adobe image→PDF). Include address, phone, hours, and menu items when possible — missing prices still keep dishes.
              </div>
            </Field>
            <Field label="Administrator notes">
              <textarea
                style={{ ...inputStyle, minHeight: 80 }}
                value={form.admin_notes}
                onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))}
              />
            </Field>
          </div>
        ) : null}

        {step === "instructions" || step === "research" ? (
          <div>
            <Field label="Natural-language instructions">
              <textarea
                style={{ ...inputStyle, minHeight: 120 }}
                value={form.instructions}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                placeholder="Add this franchise and all locations in Los Angeles County. Use the attached menu and website, then research anything missing."
              />
            </Field>
            {step === "research" && research ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Research report</div>
                <JsonBlock value={research} />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "preview" && preview ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                ["Create", preview.creates?.length || 0, "#e8f5e9"],
                ["Update", preview.updates?.length || 0, "#e3f2fd"],
                ["Unchanged", preview.unchanged?.length || 0, "#f5f5f5"],
                ["Conflicts", preview.conflicts?.length || 0, "#fff3e0"],
              ].map(([label, count, bg]) => (
                <div key={label} style={{ padding: 12, borderRadius: 12, background: bg, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{count}</div>
                  <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{label}</div>
                </div>
              ))}
            </div>
            <JsonBlock value={preview} />
            {requiresConfirmation ? (
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, fontSize: 13 }}>
                <input type="checkbox" checked={confirmLarge} onChange={(e) => setConfirmLarge(e.target.checked)} />
                I confirm this franchise-wide or large-scale change should be applied.
              </label>
            ) : null}
          </div>
        ) : null}

        {step === "apply" ? (
          <div>
            <div style={{ padding: 14, borderRadius: 12, background: "#e8f5e9", marginBottom: 16, fontSize: 14 }}>
              Apply completed. Review the audit summary below.
            </div>
            {(applyResult?.restaurant_id || job?.job?.restaurant_id) ? (
              <div style={{ marginBottom: 12, fontSize: 14 }}>
                Public restaurant id:{" "}
                <strong>{applyResult?.restaurant_id || job?.job?.restaurant_id}</strong>
                {" · "}
                <Link
                  to={`/owner/menu-console/restaurants/${applyResult?.restaurant_id || job?.job?.restaurant_id}`}
                  style={{ color: OWNER_COLORS.accent, fontWeight: 600 }}
                >
                  Owner menu console
                </Link>
                {" · "}
                <a
                  href={`/restaurants/${applyResult?.restaurant_id || job?.job?.restaurant_id}`}
                  style={{ color: OWNER_COLORS.accent, fontWeight: 600 }}
                  target="_blank"
                  rel="noreferrer"
                >
                  Public profile
                </a>
              </div>
            ) : null}
            <JsonBlock value={applyResult || job?.job || {}} />
            <button
              type="button"
              onClick={() => navigate(`/owner/knowledge-bot/history?job=${jobId}`)}
              style={{
                marginTop: 16,
                border: "none",
                background: OWNER_COLORS.accent,
                color: "#fff",
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Open History & Audit
            </button>
          </div>
        ) : null}

        {primaryButton ? (
          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <button
              type="button"
              disabled={busy}
              onClick={primaryButton.onClick}
              style={{
                border: "none",
                background: OWNER_COLORS.accent,
                color: "#fff",
                borderRadius: 10,
                padding: "10px 18px",
                fontWeight: 700,
                cursor: busy ? "wait" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {primaryButton.label}
            </button>
            {step !== "target" ? (
              <button
                type="button"
                onClick={() => {
                  const idx = STEPS.findIndex((s) => s.id === step);
                  if (idx > 0) setStep(STEPS[idx - 1].id);
                }}
                style={{
                  border: `1px solid ${OWNER_COLORS.line}`,
                  background: "#fff",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            ) : null}
          </div>
        ) : null}
      </PageCard>
    </OwnerLayout>
  );
}
