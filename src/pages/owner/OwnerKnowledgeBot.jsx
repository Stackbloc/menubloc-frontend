import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  applyKnowledgeBotJob,
  createKnowledgeBotJob,
  findKnowledgeBotMenu,
  getKnowledgeBotJob,
  listKnowledgeBotClusters,
  lookupKnowledgeBotRestaurant,
  updateKnowledgeBotJob,
  uploadKnowledgeBotEvidence,
} from "../../lib/ownerApi.js";

/**
 * Menubot (formerly Knowledge Bot) — three steps:
 *   1. Restaurant       — which profile (existing or new), type, optional cluster
 *   2. Menu sources     — links / photos / PDFs, or leave empty and Menubot finds the website + menu
 *   3. Review & publish — readable plan; nothing is written until Publish
 */
const STEPS = [
  { id: "restaurant", label: "Restaurant" },
  { id: "sources", label: "Menu sources" },
  { id: "review", label: "Review & publish" },
];

const TYPE_OPTIONS = [
  { value: "restaurant", label: "Standalone restaurant" },
  { value: "mle", label: "MLE (multi-location brand, one shared menu)" },
  { value: "franchise", label: "Franchise / chain (all locations)" },
  { value: "location", label: "One franchise location" },
];

const EMPTY_FORM = {
  target_type: "restaurant",
  target_name: "",
  target_location: "",
  restaurant_id: "",
  chain_id: "",
  cluster_slug: "",
  menu_urls: "",
  admin_notes: "",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontFamily: "inherit",
  fontSize: 14,
};

function primaryButtonStyle({ busy = false, disabled = false } = {}) {
  return {
    border: "none",
    background: OWNER_COLORS.accent,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : busy ? "wait" : "pointer",
    opacity: disabled ? 0.45 : busy ? 0.7 : 1,
  };
}

const secondaryButtonStyle = {
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const smallButtonStyle = { ...secondaryButtonStyle, padding: "4px 10px", fontSize: 12 };

function StepNav({ current, jobId }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, alignItems: "center" }}>
      {STEPS.map((step, index) => {
        const active = step.id === current;
        const done = index < currentIndex;
        return (
          <div
            key={step.id}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: active ? OWNER_COLORS.accentSoft : "#fff",
              color: active || done ? OWNER_COLORS.ink : OWNER_COLORS.muted,
              border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
            }}
          >
            {done ? "✓" : index + 1}. {step.label}
          </div>
        );
      })}
      {jobId ? (
        <Link
          to={`/owner/menubot/history?job=${jobId}`}
          style={{ marginLeft: "auto", fontSize: 12, color: OWNER_COLORS.accent, fontWeight: 700 }}
        >
          View in History →
        </Link>
      ) : null}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>{label}</div>
      {children}
      {hint ? (
        <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>{hint}</div>
      ) : null}
    </label>
  );
}

const NOTICE_TONES = {
  info: { background: "#eef4ff", color: "#1e3a6e" },
  ok: { background: "#e8f5e9", color: "#1d4d22" },
  warn: { background: "#fff6e5", color: "#7a4b00" },
  error: { background: "#fdecea", color: "#8b2e1a" },
};

function Notice({ tone = "info", children }) {
  return (
    <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 1.5, ...NOTICE_TONES[tone] }}>
      {children}
    </div>
  );
}

function RestaurantSummary({ restaurant }) {
  if (!restaurant) return null;
  const address = [restaurant.address_line1, restaurant.city, restaurant.state].filter(Boolean).join(", ");
  return (
    <span>
      <strong>{restaurant.restaurant_name}</strong> (#{restaurant.id})
      {address ? ` — ${address}` : ""}
    </span>
  );
}

function CandidateList({ candidates, onChoose, buttonLabel, disabled }) {
  return (candidates || []).slice(0, 8).map((c) => (
    <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "3px 0" }}>
      <span style={{ flex: 1, minWidth: 0 }}><RestaurantSummary restaurant={c} /></span>
      <button type="button" disabled={disabled} onClick={() => onChoose(c)} style={smallButtonStyle}>
        {buttonLabel}
      </button>
    </div>
  ));
}

function formatPrice(price) {
  if (price == null || price === "") return "";
  const n = Number(price);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : String(price);
}

function MenuPreview({ items }) {
  const [showAll, setShowAll] = useState(false);
  const limit = 60;
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of showAll ? items : items.slice(0, limit)) {
      const section = item.section || "Menu";
      if (!map.has(section)) map.set(section, []);
      map.get(section).push(item);
    }
    return [...map.entries()];
  }, [items, showAll]);

  return (
    <div style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, padding: "12px 16px", maxHeight: 420, overflow: "auto" }}>
      {groups.map(([section, sectionItems]) => (
        <div key={section} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: OWNER_COLORS.muted, marginBottom: 6 }}>
            {section}
          </div>
          {sectionItems.map((item, index) => (
            <div key={`${item.name}-${index}`} style={{ display: "flex", gap: 12, fontSize: 14, padding: "3px 0" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                {item.description ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{item.description}</div> : null}
              </div>
              <div style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatPrice(item.price)}</div>
            </div>
          ))}
        </div>
      ))}
      {items.length > limit ? (
        <button type="button" onClick={() => setShowAll((v) => !v)} style={smallButtonStyle}>
          {showAll ? "Show fewer" : `Show all ${items.length} items`}
        </button>
      ) : null}
    </div>
  );
}

function urlsFromTextarea(value) {
  return String(value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function effectiveTargetType(jobRow) {
  if (jobRow?.scope?.target_kind === "mle") return "mle";
  return jobRow?.target_type || "restaurant";
}

function stepForJob(jobRow) {
  if (!jobRow) return "restaurant";
  if (jobRow.preview_plan && Object.keys(jobRow.preview_plan).length) return "review";
  return jobRow.target_name ? "sources" : "restaurant";
}

export default function OwnerKnowledgeBot() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeJobId = searchParams.get("job");

  const [step, setStep] = useState("restaurant");
  const [jobId, setJobId] = useState(resumeJobId || null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmLarge, setConfirmLarge] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [lookup, setLookup] = useState(null);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    listKnowledgeBotClusters()
      .then((data) => setClusters(data?.clusters || []))
      .catch(() => setClusters([]));
  }, []);

  const hydrate = useCallback((data) => {
    const row = data?.job;
    if (!row) return;
    setJob(data);
    setForm({
      target_type: effectiveTargetType(row),
      target_name: row.target_name || "",
      target_location: row.target_location || "",
      restaurant_id: row.restaurant_id != null ? String(row.restaurant_id) : "",
      chain_id: row.chain_id != null ? String(row.chain_id) : "",
      cluster_slug: row.scope?.cluster_slug || "",
      menu_urls: [...(row.reference_urls || []), ...(row.additional_urls || [])].join("\n"),
      admin_notes: row.admin_notes || "",
    });
  }, []);

  useEffect(() => {
    if (!resumeJobId || job?.job?.id === resumeJobId) return;
    getKnowledgeBotJob(resumeJobId)
      .then((data) => {
        hydrate(data);
        setStep(stepForJob(data?.job));
      })
      .catch(() => setError("Could not load this Menubot job."));
    // Only on first load / when the URL points at a different job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeJobId]);

  async function run(label, fn) {
    setBusy(label);
    setError("");
    try {
      await fn();
    } catch (err) {
      if (err?.payload?.code === "confirmation_required") {
        setError("This is a franchise-wide or large change. Tick the confirmation box, then publish again.");
      } else {
        setError(err?.payload?.error || err?.message || "Something went wrong.");
      }
    } finally {
      setBusy("");
    }
  }

  function buildPayload(overrides = {}) {
    const { target_kind, ...scopeRest } = job?.job?.scope || {};
    const values = { ...form, ...overrides };
    const franchiseLike = values.target_type === "franchise" || values.target_type === "location";
    return {
      target_type: values.target_type,
      target_name: String(values.target_name || "").trim(),
      target_location: String(values.target_location || "").trim(),
      restaurant_id: values.restaurant_id ? Number(values.restaurant_id) : null,
      chain_id: franchiseLike && values.chain_id ? Number(values.chain_id) : null,
      admin_notes: values.admin_notes,
      reference_urls: urlsFromTextarea(values.menu_urls),
      additional_urls: [],
      scope: { ...scopeRest, cluster_slug: values.cluster_slug || null },
    };
  }

  async function saveJob(overrides = {}) {
    const payload = buildPayload(overrides);
    if (jobId) {
      const updated = await updateKnowledgeBotJob(jobId, payload);
      if (updated?.job) setJob((prev) => ({ ...(prev || {}), job: updated.job }));
      return jobId;
    }
    const created = await createKnowledgeBotJob(payload);
    setJobId(created.job.id);
    setJob({ job: created.job, evidence: [] });
    setSearchParams({ job: created.job.id }, { replace: true });
    return created.job.id;
  }

  async function refresh(id) {
    hydrate(await getKnowledgeBotJob(id));
  }

  function chooseRestaurant(candidate) {
    setForm((f) => ({
      ...f,
      restaurant_id: String(candidate.id),
      target_name: f.target_name || candidate.restaurant_name || "",
    }));
    setLookup({ match: candidate, candidates: [candidate] });
  }

  async function handleLookup() {
    await run("lookup", async () => {
      const data = form.restaurant_id
        ? await lookupKnowledgeBotRestaurant({ id: form.restaurant_id })
        : await lookupKnowledgeBotRestaurant({ name: form.target_name });
      setLookup(data);
      if (data?.match && !form.target_name.trim()) {
        setForm((f) => ({ ...f, target_name: data.match.restaurant_name || "" }));
      }
    });
  }

  async function handleRestaurantNext() {
    await run("save", async () => {
      const overrides = {};
      if (!form.target_name.trim()) {
        if (!form.restaurant_id) throw new Error("Enter the restaurant name (or an existing restaurant ID).");
        const data = await lookupKnowledgeBotRestaurant({ id: form.restaurant_id });
        if (!data?.match) throw new Error(`No restaurant with ID ${form.restaurant_id}.`);
        overrides.target_name = data.match.restaurant_name;
        setForm((f) => ({ ...f, target_name: data.match.restaurant_name }));
      }
      await saveJob(overrides);
      setStep("sources");
    });
  }

  async function handleFind() {
    await run("find", async () => {
      const id = await saveJob();
      if (files.length) {
        const fd = new FormData();
        for (const file of files) fd.append("files", file);
        await uploadKnowledgeBotEvidence(id, fd);
        setFiles([]);
      }
      await findKnowledgeBotMenu(id);
      await refresh(id);
      setConfirmLarge(false);
      setStep("review");
    });
  }

  async function handleChooseCandidate(candidate) {
    chooseRestaurant(candidate);
    await run("find", async () => {
      await saveJob({ restaurant_id: String(candidate.id) });
      await findKnowledgeBotMenu(jobId);
      await refresh(jobId);
    });
  }

  async function handlePublish() {
    await run("publish", async () => {
      try {
        await applyKnowledgeBotJob(jobId, { confirm_large: confirmLarge });
      } finally {
        // A failed publish also records its reason on the job — show it either way.
        await refresh(jobId).catch(() => {});
      }
    });
  }

  function startOver() {
    setJobId(null);
    setJob(null);
    setLookup(null);
    setFiles([]);
    setError("");
    setConfirmLarge(false);
    setForm(EMPTY_FORM);
    setSearchParams({}, { replace: true });
    setStep("restaurant");
  }

  const row = job?.job || null;
  const research = row?.research_report || {};
  const preview = row?.preview_plan || {};
  const applyResult = row?.apply_result && Object.keys(row.apply_result).length ? row.apply_result : null;
  const evidenceFiles = (job?.evidence || []).filter((e) => e.file_name);
  const items = research.menu_candidates || [];
  const isFranchise = form.target_type === "franchise" || form.target_type === "location";
  const restaurantConflict = (preview.conflicts || []).find((c) => c.entity === "restaurant_match");
  const needsRestaurantChoice = Boolean(restaurantConflict) && !row?.restaurant_id;
  const published = row?.status === "completed" && applyResult;
  const publishBlocked =
    (!items.length && !isFranchise) || needsRestaurantChoice || (preview.requires_confirmation && !confirmLarge);
  const clusterName = useMemo(() => {
    const slug = research.cluster_slug || form.cluster_slug;
    if (!slug) return null;
    return clusters.find((c) => c.slug === slug)?.name || slug;
  }, [clusters, research.cluster_slug, form.cluster_slug]);

  return (
    <OwnerLayout
      title="Menubot"
      actions={
        <div style={{ display: "flex", gap: 16 }}>
          <Link to="/owner/menubot/cluster" style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}>
            Cluster run
          </Link>
          <Link to="/owner/menubot/history" style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}>
            History
          </Link>
        </div>
      }
    >
      <PageCard style={{ padding: "22px 24px" }}>
        <SectionTitle
          title="Add a menu"
          subtitle="Pick the restaurant, give Menubot menu links or photos — or let it find the menu online — then review before anything is published."
        />
        <StepNav current={step} jobId={jobId} />

        {error ? <Notice tone="error">{error}</Notice> : null}

        {step === "restaurant" ? (
          <div>
            <Field label="What are you adding?">
              <select value={form.target_type} onChange={setField("target_type")} style={inputStyle}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Restaurant name">
              <input style={inputStyle} value={form.target_name} onChange={setField("target_name")} placeholder="e.g. Daikokuya" />
            </Field>
            <Field label="City or area" hint="Helps Menubot find the right business and the right branch's menu.">
              <input style={inputStyle} value={form.target_location} onChange={setField("target_location")} placeholder="e.g. Little Tokyo, Los Angeles, CA" />
            </Field>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <Field
                  label="Already on Menuply? Restaurant ID (optional)"
                  hint="With an ID the menu goes onto that existing profile — no duplicate restaurant is created."
                >
                  <input style={inputStyle} value={form.restaurant_id} onChange={setField("restaurant_id")} inputMode="numeric" placeholder="e.g. 2136" />
                </Field>
              </div>
              <button
                type="button"
                onClick={handleLookup}
                disabled={Boolean(busy) || (!form.restaurant_id && !form.target_name.trim())}
                style={{ ...secondaryButtonStyle, marginTop: 22 }}
              >
                {busy === "lookup" ? "Checking…" : "Check existing"}
              </button>
            </div>

            {lookup ? (
              lookup.match ? (
                <Notice tone="ok">
                  Menu will go onto <RestaurantSummary restaurant={lookup.match} />
                  {Number(lookup.match.menu_item_count) > 0 ? ` — it already has ${lookup.match.menu_item_count} menu items.` : "."}
                  {lookup.match.claim_status === "claimed" ? " This restaurant is claimed; only its operator can change the menu." : ""}
                </Notice>
              ) : (lookup.candidates || []).length ? (
                <Notice tone="warn">
                  <div style={{ marginBottom: 8 }}>Several existing restaurants look similar — pick one, or continue to create a new restaurant:</div>
                  <CandidateList candidates={lookup.candidates} onChoose={chooseRestaurant} buttonLabel="Use this" disabled={Boolean(busy)} />
                </Notice>
              ) : (
                <Notice>No existing restaurant found — Menubot will create a new profile.</Notice>
              )
            ) : null}

            <Field label="Add to a cluster (optional)">
              <select value={form.cluster_slug} onChange={setField("cluster_slug")} style={inputStyle}>
                <option value="">No cluster</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}{c.city ? ` — ${c.city}` : ""}</option>
                ))}
              </select>
            </Field>

            {isFranchise ? (
              <Field label="Existing chain ID (optional)">
                <input style={inputStyle} value={form.chain_id} onChange={setField("chain_id")} inputMode="numeric" />
              </Field>
            ) : null}

            <div style={{ marginTop: 20 }}>
              <button type="button" disabled={Boolean(busy)} onClick={handleRestaurantNext} style={primaryButtonStyle({ busy: Boolean(busy) })}>
                {busy === "save" ? "Saving…" : "Next: menu sources →"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "sources" ? (
          <div>
            <Field
              label="Menu links (optional, one per line)"
              hint={
                isFranchise
                  ? "For a franchise, paste the brand's official menu page or PDF."
                  : "Leave empty and Menubot will look up the restaurant's website and find its menu."
              }
            >
              <textarea style={{ ...inputStyle, minHeight: 90 }} value={form.menu_urls} onChange={setField("menu_urls")} placeholder="https://restaurant.com/menu" />
            </Field>
            <Field
              label="Menu photos, screenshots, or PDFs (optional)"
              hint="The most reliable source — photos and PDFs are read with OCR. Up to 12 files, 25 MB each."
            >
              <input type="file" multiple accept="image/*,.pdf,.txt,.md" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              {evidenceFiles.length ? (
                <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
                  Already uploaded: {evidenceFiles.map((e) => e.file_name).join(", ")}
                </div>
              ) : null}
            </Field>
            <Field label="Notes (optional)">
              <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.admin_notes} onChange={setField("admin_notes")} />
            </Field>

            {busy === "find" ? (
              <Notice>Finding and reading the menu… websites and photos can take up to a minute.</Notice>
            ) : null}

            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" disabled={Boolean(busy)} onClick={handleFind} style={primaryButtonStyle({ busy: Boolean(busy) })}>
                {busy === "find" ? "Finding menu…" : "Find menu →"}
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => setStep("restaurant")} style={secondaryButtonStyle}>
                Back
              </button>
            </div>
          </div>
        ) : null}

        {step === "review" ? (
          <div>
            {published ? (
              (applyResult.errors || []).length ? (
                <Notice tone="warn">
                  <strong>Published with problems:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {applyResult.errors.map((e, i) => <li key={i}>{e.error}</li>)}
                  </ul>
                </Notice>
              ) : (
                <Notice tone="ok"><strong>Published.</strong> The menu is live.</Notice>
              )
            ) : row?.status === "applying" ? (
              <Notice>Publishing in the background (large franchise job). Check History for progress.</Notice>
            ) : row?.status === "failed" && row?.error_message ? (
              <Notice tone="error"><strong>Not published:</strong> {row.error_message}</Notice>
            ) : null}

            {published && applyResult.restaurant_id ? (
              <div style={{ marginBottom: 16, fontSize: 14, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <a href={`/restaurants/${applyResult.restaurant_id}`} target="_blank" rel="noreferrer" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>
                  Open public profile ↗
                </a>
                <Link to={`/owner/menu-console/restaurants/${applyResult.restaurant_id}`} style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>
                  Edit in menu console
                </Link>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
              {[
                ["Menu items", items.length],
                ["Hours", (research.hours || []).length ? `${research.hours.length} days` : "—"],
                ["Phone", research.identity?.phone || "—"],
                ["Cluster", clusterName || "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 12, borderRadius: 12, background: "#faf8f6", border: `1px solid ${OWNER_COLORS.line}` }}>
                  <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, overflowWrap: "anywhere" }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
              {research.restaurant ? (
                <>Menu goes onto existing restaurant <RestaurantSummary restaurant={research.restaurant} />.</>
              ) : isFranchise ? (
                <>Updates the <strong>{row?.target_name}</strong> chain menu and its locations.</>
              ) : (
                <>Creates a new restaurant: <strong>{row?.target_name}</strong>{row?.target_location ? ` (${row.target_location})` : ""}.</>
              )}
              {research.discovery?.chosen_url ? (
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                  Menu found at{" "}
                  <a href={research.discovery.chosen_url} target="_blank" rel="noreferrer" style={{ color: OWNER_COLORS.accent }}>
                    {research.discovery.chosen_url}
                  </a>
                </div>
              ) : null}
            </div>

            {needsRestaurantChoice ? (
              <Notice tone="warn">
                <div style={{ marginBottom: 8 }}>
                  <strong>Which restaurant is this?</strong> Several existing profiles match — choose one so the menu isn't added to the wrong place:
                </div>
                <CandidateList candidates={restaurantConflict.candidates} onChoose={handleChooseCandidate} buttonLabel="This one" disabled={Boolean(busy)} />
              </Notice>
            ) : null}

            {(research.gaps || []).length ? (
              <Notice tone="warn">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {research.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </Notice>
            ) : null}

            {items.length ? (
              <MenuPreview items={items} />
            ) : (
              <Notice tone="error">
                No menu items found yet. Go back and add menu photos, a PDF, or a direct link to the menu page.
              </Notice>
            )}

            {preview.requires_confirmation && !published ? (
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, fontSize: 13 }}>
                <input type="checkbox" checked={confirmLarge} onChange={(e) => setConfirmLarge(e.target.checked)} />
                I confirm this franchise-wide or large change should be published.
              </label>
            ) : null}

            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {published ? (
                <button type="button" onClick={startOver} style={primaryButtonStyle()}>
                  Add another menu
                </button>
              ) : (
                <button
                  type="button"
                  disabled={Boolean(busy) || publishBlocked}
                  onClick={handlePublish}
                  style={primaryButtonStyle({ busy: Boolean(busy), disabled: publishBlocked })}
                >
                  {busy === "publish" ? "Publishing…" : items.length ? `Publish ${items.length} items` : "Publish"}
                </button>
              )}
              {!published ? (
                <button type="button" disabled={Boolean(busy)} onClick={() => setStep("sources")} style={secondaryButtonStyle}>
                  Back to sources
                </button>
              ) : null}
            </div>

            <details style={{ marginTop: 20 }}>
              <summary style={{ cursor: "pointer", fontSize: 12, color: OWNER_COLORS.muted }}>Technical details</summary>
              <pre style={{ marginTop: 8, padding: 12, borderRadius: 10, background: "#faf8f6", border: `1px solid ${OWNER_COLORS.line}`, fontSize: 11, overflow: "auto", maxHeight: 320 }}>
                {JSON.stringify({ status: row?.status, preview_plan: preview, apply_result: applyResult, discovery: research.discovery }, null, 2)}
              </pre>
            </details>
          </div>
        ) : null}
      </PageCard>
    </OwnerLayout>
  );
}
