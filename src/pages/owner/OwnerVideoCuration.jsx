import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { SimpleTable } from "./intelligence/intelligenceShared.jsx";
import {
  listOwnerVideos,
  listOwnerVideoClusters,
  listOwnerVideoFoodForms,
  addOwnerVideoFoodForm,
  listOwnerVideoCuisines,
  lookupOwnerVideo,
  patchOwnerVideoMetadata,
  getOwnerVideoSearchMetadata,
  putOwnerVideoSearchMetadata,
  resetOwnerVideoSearchMetadataField,
  uploadOwnerVideo,
  uploadOwnerVideoThumbnail,
  replaceOwnerVideoMedia,
  createOwnerDeal,
  uploadOwnerDealMediaVideo,
  publishOwnerDeal,
} from "../../lib/ownerApi.js";
import CkRestaurantMenuPicker, {
  useCkPlaceFromVideoIds,
} from "../../components/ck/CkRestaurantMenuPicker.jsx";
import { dishLabel } from "../../lib/foodActivityApi.js";
import {
  DEAL_MEAL_PERIODS,
  formatMealTimeDealCaption,
} from "../../lib/dealMealPeriods.js";
import { formatOwnerVideoCreatorLabel } from "../../lib/ownerVideoCatalogLabels.js";
import { formatBytes, MAX_UPLOAD_VIDEO_BYTES } from "../../lib/consumerCameraCapture.js";

const KIND_OPTIONS = [
  ["all", "All kinds"],
  ["ate", "Ate"],
  ["want", "Want"],
  ["plan", "Plan"],
  ["event", "Event"],
  ["deal", "Deal"],
  ["managed", "Platform upload"],
];

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 14,
};

function formatWhen(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function useOwnerClusterOptions() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await listOwnerVideoClusters({ limit: 500 });
        if (!cancelled) setClusters(result.clusters || []);
      } catch {
        if (!cancelled) setClusters([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { clusters, loading };
}

function OwnerClusterSelect({
  value,
  onChange,
  clusters,
  loading,
  disabled,
  testId = "owner-video-cluster",
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontWeight: 700, fontSize: 13 }}>Cluster</span>
      <select
        value={value ?? ""}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next ? Number(next) : null);
        }}
        disabled={disabled || loading}
        style={inputStyle}
        data-testid={testId}
      >
        <option value="">No cluster</option>
        {clusters.map((cluster) => (
          <option key={cluster.id} value={cluster.id}>
            {cluster.name}
            {cluster.city
              ? ` · ${cluster.city}${cluster.state ? `, ${cluster.state}` : ""}`
              : ""}
          </option>
        ))}
      </select>
      {loading ? (
        <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Loading clusters…</span>
      ) : null}
    </label>
  );
}

function FoodFormPicker({ value, onChange, disabled }) {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("");
  const [families, setFamilies] = useState([]);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedParents, setExpandedParents] = useState(() => new Set());
  const [addFamily, setAddFamily] = useState("hot dog");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await listOwnerVideoFoodForms({
          q,
          family: family || undefined,
          limit: 200,
        });
        if (cancelled) return;
        setFamilies(result.families || []);
        setResults(result.results || []);
        // Auto-expand parents when browsing a family or searching so children are visible.
        const next = new Set();
        for (const row of result.results || []) {
          if (row.parent_form) next.add(row.parent_form);
          if (family && row.form_key === family) next.add(row.form_key);
        }
        if (family || q.trim()) setExpandedParents(next);
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, family]);

  useEffect(() => {
    function onDocClick(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedLabel = value
    ? results.find((row) => row.form_key === value)?.display_label || value
    : "";
  const qLower = q.trim().toLowerCase();
  const hasExact = results.some(
    (row) =>
      row.form_key === qLower ||
      (row.aliases || []).includes(qLower) ||
      String(row.display_label || "").toLowerCase() === qLower
  );
  const canAdd = q.trim().length >= 2 && !hasExact && !value;

  async function handleAdd() {
    setAddBusy(true);
    setAddError("");
    try {
      const result = await addOwnerVideoFoodForm({
        label: q.trim(),
        family_key: addFamily,
      });
      const form = result.form;
      if (form?.form_key) {
        onChange?.(form.form_key);
        setQ("");
        setOpen(false);
      }
    } catch (err) {
      setAddError(err.message || "Unable to add food type");
    } finally {
      setAddBusy(false);
    }
  }

  function toggleParent(formKey) {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(formKey)) next.delete(formKey);
      else next.add(formKey);
      return next;
    });
  }

  function selectForm(formKey) {
    onChange?.(formKey);
    setQ("");
    setOpen(false);
  }

  /** Family → roots (no parent in this result set) → children nested under parent_form. */
  const grouped = [];
  const byFamily = new Map();
  for (const row of results) {
    if (!byFamily.has(row.family_key)) {
      const group = {
        family_key: row.family_key,
        family_label: row.family_label,
        roots: [],
        childrenByParent: new Map(),
      };
      byFamily.set(row.family_key, group);
      grouped.push(group);
    }
    const group = byFamily.get(row.family_key);
    if (row.parent_form) {
      if (!group.childrenByParent.has(row.parent_form)) {
        group.childrenByParent.set(row.parent_form, []);
      }
      group.childrenByParent.get(row.parent_form).push(row);
    } else {
      group.roots.push(row);
    }
  }
  for (const group of grouped) {
    // Orphan children whose parent isn't in this page — promote to roots.
    for (const [parentKey, kids] of group.childrenByParent) {
      if (!group.roots.some((r) => r.form_key === parentKey) && !results.some((r) => r.form_key === parentKey)) {
        group.roots.push(...kids);
        group.childrenByParent.delete(parentKey);
      }
    }
    group.roots.sort((a, b) => a.display_label.localeCompare(b.display_label));
    for (const kids of group.childrenByParent.values()) {
      kids.sort((a, b) => a.display_label.localeCompare(b.display_label));
    }
  }

  function renderOption(row, { depth = 0, hasChildren = false } = {}) {
    const expanded = expandedParents.has(row.form_key);
    return (
      <div key={`${row.source}-${row.form_key}`} style={{ display: "grid", gap: 0 }}>
        <div style={{ display: "flex", alignItems: "stretch", paddingLeft: depth * 14 }}>
          {hasChildren ? (
            <button
              type="button"
              aria-label={expanded ? `Collapse ${row.display_label}` : `Expand ${row.display_label}`}
              onClick={() => toggleParent(row.form_key)}
              data-testid={`owner-video-food-form-expand-${row.form_key}`}
              style={{
                width: 28,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
                color: OWNER_COLORS.muted,
                flex: "0 0 auto",
              }}
            >
              {expanded ? "▾" : "▸"}
            </button>
          ) : (
            <span style={{ width: 28, flex: "0 0 auto" }} aria-hidden />
          )}
          <button
            type="button"
            onClick={() => selectForm(row.form_key)}
            data-testid={`owner-video-food-form-option-${row.form_key}`}
            style={{
              flex: 1,
              textAlign: "left",
              border: "none",
              background: value === row.form_key ? OWNER_COLORS.accentSoft : "transparent",
              borderRadius: 8,
              padding: "7px 8px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: depth ? 600 : 700,
              color: OWNER_COLORS.ink,
            }}
          >
            {row.display_label}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ display: "grid", gap: 6 }} data-testid="owner-video-food-form-picker">
      <span style={{ fontWeight: 700, fontSize: 13 }}>Food type</span>
      <span style={{ fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.4 }}>
        Browse any category as a tree (Sandwiches → Gyro, Cakes → Cupcake, Desserts →
        Brownie) or type to search. Connects this clip to search even when there is no menu
        item.
      </span>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr) minmax(140px, 180px)" }}>
        <input
          value={open || !value ? q : selectedLabel}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            if (value) onChange?.("");
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type a food type or browse the tree"
          disabled={disabled}
          style={inputStyle}
          data-testid="owner-video-food-form-input"
          autoComplete="off"
        />
        <select
          value={family}
          onChange={(e) => {
            setFamily(e.target.value);
            setOpen(true);
          }}
          disabled={disabled}
          style={inputStyle}
          data-testid="owner-video-food-form-family"
        >
          <option value="">All categories</option>
          {families.map((row) => (
            <option key={row.key} value={row.key}>
              {row.label}
            </option>
          ))}
        </select>
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange?.("");
            setQ("");
          }}
          disabled={disabled}
          data-testid="owner-video-food-form-clear"
          style={{
            justifySelf: "start",
            border: "none",
            background: "transparent",
            color: "#b91c1c",
            fontWeight: 700,
            fontSize: 12,
            cursor: disabled ? "wait" : "pointer",
            padding: 0,
          }}
        >
          Clear food type
        </button>
      ) : null}
      {open ? (
        <div
          data-testid="owner-video-food-form-results"
          style={{
            maxHeight: 280,
            overflowY: "auto",
            border: `1px solid ${OWNER_COLORS.line}`,
            borderRadius: 10,
            background: "#fff",
            padding: 6,
          }}
        >
          {loading ? (
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, padding: 8 }}>Matching food types…</div>
          ) : null}
          {!loading && !results.length ? (
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, padding: 8 }}>No match in the food catalog.</div>
          ) : null}
          {grouped.map((group) => (
            <div key={group.family_key} style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: OWNER_COLORS.muted,
                  padding: "6px 8px 2px",
                }}
              >
                {group.family_label}
              </div>
              {group.roots.map((row) => {
                const kids = group.childrenByParent.get(row.form_key) || [];
                const hasChildren = kids.length > 0;
                return (
                  <div key={`${row.source}-${row.form_key}-branch`}>
                    {renderOption(row, { depth: 0, hasChildren })}
                    {hasChildren && expandedParents.has(row.form_key)
                      ? kids.map((child) => renderOption(child, { depth: 1, hasChildren: false }))
                      : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
      {canAdd ? (
        <div
          data-testid="owner-video-food-form-add"
          style={{
            display: "grid",
            gap: 8,
            padding: 10,
            borderRadius: 10,
            border: `1px dashed ${OWNER_COLORS.line}`,
            background: "#FAFAF9",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>
            Add “{q.trim()}” under an existing category
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={addFamily}
              onChange={(e) => setAddFamily(e.target.value)}
              disabled={disabled || addBusy}
              style={{ ...inputStyle, flex: "1 1 160px" }}
              data-testid="owner-video-food-form-add-family"
            >
              {families.map((row) => (
                <option key={row.key} value={row.key}>
                  {row.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={disabled || addBusy || !addFamily}
              data-testid="owner-video-food-form-add-submit"
              style={{
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
                borderRadius: 8,
                padding: "8px 12px",
                fontWeight: 700,
                cursor: addBusy ? "wait" : "pointer",
              }}
            >
              {addBusy ? "Adding…" : "Add food type"}
            </button>
          </div>
          {addError ? <span style={{ fontSize: 12, color: "#b91c1c" }}>{addError}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function CuisinePicker({ value, onChange, disabled }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await listOwnerVideoCuisines({ q, limit: 80 });
        if (cancelled) return;
        setResults(result.cuisines || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q]);

  useEffect(() => {
    function onDocClick(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedLabel = value
    ? results.find((row) => row.value === value)?.label || value
    : "";

  return (
    <div ref={wrapRef} style={{ display: "grid", gap: 6 }} data-testid="owner-video-cuisine-picker">
      <span style={{ fontWeight: 700, fontSize: 13 }}>Cuisine</span>
      <span style={{ fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.4 }}>
        Use when the clip covers several dishes that share a cuisine (for example Thai or Asian).
      </span>
      <input
        value={open || !value ? q : selectedLabel}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          if (value) onChange?.("");
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type a cuisine or browse below"
        disabled={disabled}
        style={inputStyle}
        data-testid="owner-video-cuisine-input"
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange?.("");
            setQ("");
          }}
          disabled={disabled}
          data-testid="owner-video-cuisine-clear"
          style={{
            justifySelf: "start",
            border: "none",
            background: "transparent",
            color: "#b91c1c",
            fontWeight: 700,
            fontSize: 12,
            cursor: disabled ? "wait" : "pointer",
            padding: 0,
          }}
        >
          Clear cuisine
        </button>
      ) : null}
      {open ? (
        <div
          data-testid="owner-video-cuisine-results"
          style={{
            maxHeight: 240,
            overflowY: "auto",
            border: `1px solid ${OWNER_COLORS.line}`,
            borderRadius: 10,
            background: "#fff",
            padding: 6,
          }}
        >
          {loading ? (
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, padding: 8 }}>Matching cuisines…</div>
          ) : null}
          {!loading && !results.length ? (
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, padding: 8 }}>No match in the cuisine list.</div>
          ) : null}
          {results.map((row) => (
            <button
              key={row.value}
              type="button"
              onClick={() => {
                onChange?.(row.value);
                setQ("");
                setOpen(false);
              }}
              disabled={disabled}
              data-testid={`owner-video-cuisine-option-${row.value}`}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                border: "none",
                background: row.value === value ? "#FEF3C7" : "transparent",
                padding: "6px 8px",
                borderRadius: 8,
                cursor: disabled ? "wait" : "pointer",
                fontSize: 13,
              }}
            >
              {row.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VideoUploadPanel({ onUploaded, clusters, clustersLoading }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [clusterId, setClusterId] = useState(null);
  const [marketDiscoverable, setMarketDiscoverable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleDishChange(next) {
    setDish(next);
    if (next && !title.trim()) {
      setTitle(dishLabel(next) || title);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a video file to upload.");
      return;
    }
    if (Number(file.size || 0) > MAX_UPLOAD_VIDEO_BYTES) {
      setError(
        `Video is too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_UPLOAD_VIDEO_BYTES)}. Use a shorter/smaller clip.`
      );
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await uploadOwnerVideo({
        file,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
        restaurant_id: restaurant?.restaurant_id ?? undefined,
        menu_item_id: dish?.menu_item_id ?? undefined,
        cluster_id: clusterId ?? undefined,
        market_discoverable: marketDiscoverable,
      });
      setSuccess(
        result?.video?.asset_number != null
          ? `Uploaded — asset #${result.video.asset_number}`
          : "Uploaded"
      );
      setFile(null);
      setTitle("");
      setComment("");
      setRestaurant(null);
      setDish(null);
      setClusterId(null);
      setMarketDiscoverable(true);
      onUploaded?.(result.video);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageCard style={{ padding: 18, marginBottom: 16 }} data-testid="owner-video-upload-panel">
      <SectionTitle
        title="Upload video"
        subtitle="Upload MP4, WebM, or MOV (up to ~10 minutes / ~287 MB). Bytes go direct to storage; Menuply normalizes to Chrome-safe H.264 in the background. Stay on this page until upload finishes. Restaurant and menu item are optional — add or change them anytime after upload."
      />
      <form onSubmit={handleUpload} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Video file *</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            data-testid="owner-video-upload-file"
          />
          {file ? (
            <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
              {file.name} ({Math.round(file.size / (1024 * 1024))} MB)
            </span>
          ) : null}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Caption / description</span>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} style={inputStyle} />
        </label>

        <CkRestaurantMenuPicker
          restaurant={restaurant}
          onRestaurantChange={setRestaurant}
          dish={dish}
          onDishChange={handleDishChange}
          allowMenuItem
          disabled={busy}
          testIdPrefix="owner-video-upload"
        />

        <OwnerClusterSelect
          value={clusterId}
          onChange={setClusterId}
          clusters={clusters}
          loading={clustersLoading}
          disabled={busy}
          testId="owner-video-upload-cluster"
        />

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
          <input
            type="checkbox"
            checked={marketDiscoverable}
            onChange={(e) => setMarketDiscoverable(e.target.checked)}
          />
          Show on public Feed when saved
        </label>

        {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
        {success ? <div style={{ color: "#15803d", fontSize: 13 }}>{success}</div> : null}

        <button
          type="submit"
          disabled={busy || !file}
          style={{
            justifySelf: "start",
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: OWNER_COLORS.accent,
            color: "#fff",
            fontWeight: 700,
            cursor: busy || !file ? "wait" : "pointer",
          }}
          data-testid="owner-video-upload-submit"
        >
          {busy ? "Uploading & converting…" : "Upload video"}
        </button>
      </form>
    </PageCard>
  );
}

/** Convenience default end date for the form — not a platform maximum. */
function defaultDealEndDate() {
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return end.toISOString().slice(0, 10);
}

function DealVideoUploadPanel({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [restaurant, setRestaurant] = useState(null);
  const [mealPeriods, setMealPeriods] = useState([]);
  const [showMealTimeCaption, setShowMealTimeCaption] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultDealEndDate);
  const [publishNow, setPublishNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mealTimeCaptionPreview =
    showMealTimeCaption && mealPeriods.length
      ? formatMealTimeDealCaption(mealPeriods)
      : null;

  function toggleMealPeriod(id) {
    setMealPeriods((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const next = DEAL_MEAL_PERIODS.map((p) => p.id).filter((pid) => set.has(pid));
      if (!next.length) setShowMealTimeCaption(false);
      return next;
    });
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!restaurant?.restaurant_id) {
      setError("Choose a restaurant for this deal video.");
      return;
    }
    if (!file) {
      setError("Choose a video file to upload.");
      return;
    }
    if (Number(file.size || 0) > MAX_UPLOAD_VIDEO_BYTES) {
      setError(
        `Video is too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_UPLOAD_VIDEO_BYTES)}. Use a shorter/smaller clip.`
      );
      return;
    }
    if (!title.trim()) {
      setError("Deal title is required.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Start and end dates are required.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const rid = restaurant.restaurant_id;
      const created = await createOwnerDeal(rid, {
        title: title.trim(),
        description: description.trim() || undefined,
        deal_type: "other",
        allow_null_menu_item: true,
        start_date: startDate,
        end_date: endDate,
        meal_periods: mealPeriods,
        show_meal_time_caption: showMealTimeCaption && mealPeriods.length > 0,
        publish: false,
      });
      const dealId = created.deal?.id;
      if (!dealId) throw new Error("Deal was not created");

      await uploadOwnerDealMediaVideo(rid, dealId, file);

      if (publishNow) {
        await publishOwnerDeal(rid, dealId);
      }

      setSuccess(
        publishNow
          ? `Deal video published to Feed → Deals for ${restaurant.restaurant_name || "restaurant"}`
          : `Deal video saved as draft for ${restaurant.restaurant_name || "restaurant"}`
      );
      setFile(null);
      setTitle("");
      setDescription("");
      setMealPeriods([]);
      setShowMealTimeCaption(true);
      onUploaded?.();
    } catch (err) {
      setError(err.message || "Deal video upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageCard style={{ padding: 18, marginBottom: 16 }} data-testid="owner-deal-video-upload-panel">
      <SectionTitle
        title="Upload deal video"
        subtitle="Feed → Deals category only. Pick meal time (breakfast, lunch, etc.), attach video, and publish. Subscribing restaurants upload via Operator → Deals; owner can post for any restaurant here."
      />
      <form onSubmit={handleUpload} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        <CkRestaurantMenuPicker
          restaurant={restaurant}
          onRestaurantChange={setRestaurant}
          dish={null}
          onDishChange={() => {}}
          allowMenuItem={false}
          restaurantRequired
          disabled={busy}
          testIdPrefix="owner-deal"
        />

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Deal title *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Taco Tuesday special"
            style={inputStyle}
            disabled={busy}
            data-testid="owner-deal-video-title"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
            disabled={busy}
          />
        </label>

        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Meal time</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} data-testid="owner-deal-meal-periods">
            {DEAL_MEAL_PERIODS.map((period) => {
              const active = mealPeriods.includes(period.id);
              return (
                <button
                  key={period.id}
                  type="button"
                  disabled={busy}
                  onClick={() => toggleMealPeriod(period.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1.5px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                    background: active ? OWNER_COLORS.accentSoft : "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            Leave none selected for all-day. Consumers filter Feed → Deals by meal time.
          </span>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={showMealTimeCaption && mealPeriods.length > 0}
            disabled={!mealPeriods.length || busy}
            onChange={(e) => setShowMealTimeCaption(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span style={{ fontSize: 13, lineHeight: 1.45 }}>
            Show meal time caption on Feed video
            {mealTimeCaptionPreview ? (
              <span
                style={{ display: "block", marginTop: 4, fontWeight: 700, color: OWNER_COLORS.accent }}
                data-testid="owner-deal-meal-time-caption-preview"
              >
                Preview: {mealTimeCaptionPreview}
              </span>
            ) : null}
          </span>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Starts *</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
              disabled={busy}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Ends *</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
              disabled={busy}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Deal video *</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            data-testid="owner-deal-video-upload-file"
          />
          {file ? (
            <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
              {file.name} ({Math.round(file.size / (1024 * 1024))} MB)
            </span>
          ) : null}
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
            disabled={busy}
          />
          <span style={{ fontSize: 13 }}>Publish to Feed → Deals immediately</span>
        </label>

        {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
        {success ? <div style={{ color: "#166534", fontSize: 13, fontWeight: 600 }}>{success}</div> : null}

        <button
          type="submit"
          disabled={busy || !file || !restaurant?.restaurant_id}
          style={{
            justifySelf: "start",
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: OWNER_COLORS.accent,
            color: "#fff",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
          }}
          data-testid="owner-deal-video-upload-submit"
        >
          {busy ? "Uploading deal video…" : "Upload deal video"}
        </button>
      </form>
    </PageCard>
  );
}

function resolveVideoEditorTitle({ title, dish, video }) {
  const trimmed = String(title || "").trim();
  if (trimmed) return trimmed;
  const fromDish = dish ? dishLabel(dish) : "";
  if (fromDish) return fromDish;
  const fromVideo = String(video?.title || "").trim();
  if (fromVideo) return fromVideo;
  return video?.video_kind === "managed" ? "Platform video" : "";
}

function ymdFromIso(value) {
  if (!value) return "";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const SEARCH_METADATA_KINDS = new Set(["ate", "want", "managed", "cooking", "deal"]);

function SearchWebMetadataSection({ video }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payload, setPayload] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationNeighborhood, setLocationNeighborhood] = useState("");
  const [locationRegion, setLocationRegion] = useState("");
  const [spiceLevel, setSpiceLevel] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");

  const kind = video?.video_kind;
  const sourceId = video?.video_source_id;
  const supported = SEARCH_METADATA_KINDS.has(kind);

  const applyPayload = useCallback((data) => {
    setPayload(data);
    const fields = data?.fields || {};
    const hints = data?.form_hints || {};
    setTitle(fields.title || "");
    setDescription(
      hints.description_form_value != null
        ? hints.description_form_value
        : fields.description || ""
    );
    setKeywordsText(Array.isArray(fields.keywords) ? fields.keywords.join(", ") : "");
    setCuisine(fields.cuisine || "");
    setLocationCity(fields.location_city || "");
    setLocationNeighborhood(fields.location_neighborhood || "");
    setLocationRegion(fields.location_region || "");
    setSpiceLevel(fields.spice_level || "");
    setDietaryNotes(fields.dietary_notes || "");
  }, []);

  useEffect(() => {
    if (!supported || !kind || sourceId == null) {
      setLoading(false);
      setPayload(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setSuccess("");
    getOwnerVideoSearchMetadata(kind, sourceId)
      .then((data) => {
        if (!cancelled) applyPayload(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load search metadata");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supported, kind, sourceId, applyPayload]);

  if (!supported) return null;

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const body = {
        title,
        description,
        keywords: keywordsText,
        cuisine,
        spice_level: spiceLevel || null,
        dietary_notes: dietaryNotes || null,
      };
      if (!payload?.form_hints?.omit_restaurant_location) {
        body.location_city = locationCity;
        body.location_neighborhood = locationNeighborhood;
        body.location_region = locationRegion;
      }
      const next = await putOwnerVideoSearchMetadata(kind, sourceId, body);
      applyPayload(next);
      setSuccess("Search & web metadata saved");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(field) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const next = await resetOwnerVideoSearchMetadataField(kind, sourceId, field);
      applyPayload(next);
      setSuccess(`Reset ${field} to auto`);
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  function fieldBadge(field) {
    const src = payload?.field_sources?.[field] || "prefilled";
    const edited = src === "admin_edited";
    return (
      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 999,
            background: edited ? "#fef3c7" : "#ecfdf5",
            color: edited ? "#92400e" : "#065f46",
          }}
        >
          {edited ? "Edited" : "Auto"}
        </span>
        {edited ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleReset(field)}
            style={{
              fontSize: 12,
              border: "none",
              background: "transparent",
              color: "#1d4ed8",
              cursor: busy ? "wait" : "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Reset to auto
          </button>
        ) : null}
      </span>
    );
  }

  const titleMax = payload?.form_hints?.title_max || 70;
  const descSoftMax = payload?.form_hints?.description_soft_max || 300;
  const omitLoc = payload?.form_hints?.omit_restaurant_location;

  return (
    <fieldset
      data-testid="owner-video-search-web-metadata"
      style={{
        border: `1px solid ${OWNER_COLORS.line}`,
        borderRadius: 12,
        padding: "12px 14px",
        margin: "8px 0 0",
        display: "grid",
        gap: 10,
      }}
    >
      <legend style={{ fontWeight: 700, fontSize: 13, padding: "0 6px" }}>
        Search &amp; web metadata
      </legend>
      <p style={{ margin: 0, fontSize: 12, color: OWNER_COLORS.muted }}>
        Public title/description for search engines. Auto values come from tags and restaurant
        profile only — diner caption can prefill the description here but is not public until you
        save. Status: <strong>{payload?.status || "auto"}</strong>
        {payload && !payload.eligible ? " · not currently eligible for public emission" : ""}.
      </p>
      {loading ? <p style={{ margin: 0, fontSize: 13, color: OWNER_COLORS.muted }}>Loading…</p> : null}
      {error ? <p style={{ margin: 0, color: "#b91c1c", fontSize: 13 }}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#065f46", fontSize: 13 }}>{success}</p> : null}
      {!loading && payload ? (
        <form onSubmit={handleSave} style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 700 }}>
              <span>SEO title</span>
              {fieldBadge("title")}
            </span>
            <input
              value={title}
              maxLength={titleMax}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              data-testid="owner-video-seo-title"
            />
            <span style={{ fontSize: 11, color: OWNER_COLORS.muted }}>
              {title.length}/{titleMax}
            </span>
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 700 }}>
              <span>SEO description</span>
              {fieldBadge("description")}
            </span>
            <textarea
              value={description}
              rows={4}
              onChange={(e) => setDescription(e.target.value)}
              style={inputStyle}
              data-testid="owner-video-seo-description"
            />
            <span style={{ fontSize: 11, color: OWNER_COLORS.muted }}>
              {description.length} chars (target 150–{descSoftMax})
            </span>
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 700 }}>
              <span>Keywords (≤ 8, comma-separated)</span>
              {fieldBadge("keywords")}
            </span>
            <input
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              style={inputStyle}
              data-testid="owner-video-seo-keywords"
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 700 }}>
              <span>Cuisine</span>
              {fieldBadge("cuisine")}
            </span>
            <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} style={inputStyle} />
          </label>
          {!omitLoc ? (
            <>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 700 }}>
                  <span>City</span>
                  {fieldBadge("location_city")}
                </span>
                <input
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 700 }}>
                  <span>Neighborhood</span>
                  {fieldBadge("location_neighborhood")}
                </span>
                <input
                  value={locationNeighborhood}
                  onChange={(e) => setLocationNeighborhood(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 700 }}>
                  <span>Region / state</span>
                  {fieldBadge("location_region")}
                </span>
                <input
                  value={locationRegion}
                  onChange={(e) => setLocationRegion(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </>
          ) : null}
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 700 }}>
              <span>Spice level</span>
              {fieldBadge("spice_level")}
            </span>
            <input
              value={spiceLevel}
              onChange={(e) => setSpiceLevel(e.target.value)}
              style={inputStyle}
              placeholder="Optional"
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Dietary notes</span>
            <input
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              style={inputStyle}
              placeholder="Admin-entered only"
            />
          </label>
          {payload.derived?.deal_offer_text ? (
            <p style={{ margin: 0, fontSize: 12, color: OWNER_COLORS.muted }}>
              Deal (from record): {payload.derived.deal_offer_text}
            </p>
          ) : null}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 8,
              padding: 10,
              fontSize: 12,
              display: "grid",
              gap: 4,
            }}
            data-testid="owner-video-seo-preview"
          >
            <strong>Public preview</strong>
            <div>Title: {payload.preview?.title || "—"}</div>
            <div>Description: {payload.preview?.description || "—"}</div>
            <div>Location: {payload.preview?.location_line || "—"}</div>
            <div>
              Derived dish: {payload.derived?.dish_name || "—"} · Restaurant:{" "}
              {payload.derived?.restaurant_name || "—"}
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            data-testid="owner-video-seo-save"
            style={{
              justifySelf: "start",
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#166534",
              color: "#fff",
              fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "Saving…" : "Save search metadata"}
          </button>
        </form>
      ) : null}
    </fieldset>
  );
}

function VideoEditor({ video, onSaved, onClose, clusters, clustersLoading }) {
  const videoPreviewRef = useRef(null);
  const thumbFileInputRef = useRef(null);
  const replaceFileInputRef = useRef(null);
  const [title, setTitle] = useState(video.title || "");
  const [comment, setComment] = useState(video.comment || "");
  const [clusterId, setClusterId] = useState(
    video.cluster_id != null ? Number(video.cluster_id) : null
  );
  const {
    restaurant,
    setRestaurant,
    dish,
    setDish,
    loading: placeLoading,
  } = useCkPlaceFromVideoIds({
    restaurantId: video.restaurant_id,
    menuItemId: video.menu_item_id,
    videoKey: video.video_id,
  });
  const [marketDiscoverable, setMarketDiscoverable] = useState(video.market_discoverable !== false);
  const [playMuted, setPlayMuted] = useState(video.play_muted === true);
  const [foodForm, setFoodForm] = useState(video.food_form || "");
  const [cuisine, setCuisine] = useState(video.cuisine || "");
  const [managerActive, setManagerActive] = useState(video.manager_active !== false);
  const [runStartsAt, setRunStartsAt] = useState(() => ymdFromIso(video.run_starts_at));
  const [runEndsAt, setRunEndsAt] = useState(() => ymdFromIso(video.run_ends_at));
  const [photoUrl, setPhotoUrl] = useState(video.photo_url || null);
  const [previewUrl, setPreviewUrl] = useState(video.video_url || null);
  const [previewKey, setPreviewKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [thumbBusy, setThumbBusy] = useState(false);
  const [replaceBusy, setReplaceBusy] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setTitle(video.title || "");
    setComment(video.comment || "");
    setClusterId(video.cluster_id != null ? Number(video.cluster_id) : null);
    setMarketDiscoverable(video.market_discoverable !== false);
    setPlayMuted(video.play_muted === true);
    setFoodForm(video.food_form || "");
    setCuisine(video.cuisine || "");
    setManagerActive(video.manager_active !== false);
    setRunStartsAt(ymdFromIso(video.run_starts_at));
    setRunEndsAt(ymdFromIso(video.run_ends_at));
    setPhotoUrl(video.photo_url || null);
    setPreviewUrl(video.video_url || null);
    setPreviewKey((k) => k + 1);
    setError("");
    setSuccess("");
    setReplaceProgress(null);
  }, [video]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const supportsMenuItem =
    video.video_kind === "ate" ||
    video.video_kind === "want" ||
    video.video_kind === "deal" ||
    video.video_kind === "managed";
  const supportsRestaurant =
    video.video_kind === "ate" ||
    video.video_kind === "want" ||
    video.video_kind === "plan" ||
    video.video_kind === "deal" ||
    video.video_kind === "managed";

  function handleDishChange(next) {
    setDish(next);
    if (next && !title.trim()) {
      setTitle(dishLabel(next) || title);
    }
  }

  async function saveMetadata({ managerActiveOverride, successMessage } = {}) {
    setBusy(true);
    setError("");
    setSuccess("");
    const nextActive =
      managerActiveOverride !== undefined ? managerActiveOverride : managerActive;
    try {
      const resolvedTitle = resolveVideoEditorTitle({ title, dish, video });
      const body = {
        title: resolvedTitle || undefined,
        comment: comment.trim() || null,
        market_discoverable: marketDiscoverable,
        play_muted: playMuted,
        food_form: foodForm || null,
        cuisine: cuisine || null,
        manager_active: nextActive,
        run_starts_at: runStartsAt || null,
        run_ends_at: runEndsAt || null,
      };
      if (supportsRestaurant) {
        body.restaurant_id = restaurant?.restaurant_id ?? null;
      }
      if (supportsMenuItem) {
        body.menu_item_id = dish?.menu_item_id ?? null;
      }
      if (video.video_kind === "managed") {
        body.cluster_id = clusterId;
      }
      const result = await patchOwnerVideoMetadata(
        video.video_kind,
        video.video_source_id,
        body
      );
      if (managerActiveOverride !== undefined) {
        setManagerActive(managerActiveOverride);
      }
      setSuccess(successMessage || "Saved");
      onSaved?.(result.video);
      return result.video;
    } catch (err) {
      setError(err.message || "Unable to save video metadata");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    await saveMetadata();
  }

  async function handleStopShowingInFeed() {
    await saveMetadata({
      managerActiveOverride: false,
      successMessage: "Stopped — hidden from Feed, profiles, and watch pages",
    });
  }

  async function applyThumbnailFile(file) {
    if (!file) return;
    setThumbBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await uploadOwnerVideoThumbnail(
        video.video_kind,
        video.video_source_id,
        file
      );
      const next = result?.video || result;
      const nextUrl = next?.photo_url || null;
      setPhotoUrl(nextUrl);
      setSuccess("Thumbnail saved");
      onSaved?.(next);
    } catch (err) {
      setError(err.message || "Unable to save thumbnail");
    } finally {
      setThumbBusy(false);
    }
  }

  async function applyReplaceVideoFile(file) {
    if (!file) return;
    if (Number(file.size || 0) > MAX_UPLOAD_VIDEO_BYTES) {
      setError(
        `Video is too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_UPLOAD_VIDEO_BYTES)}. Use a shorter/smaller clip.`
      );
      return;
    }
    setReplaceBusy(true);
    setError("");
    setSuccess("");
    setReplaceProgress({ percent: 0 });
    try {
      const result = await replaceOwnerVideoMedia({
        kind: video.video_kind,
        sourceId: video.video_source_id,
        file,
        onProgress: (p) => setReplaceProgress(p),
      });
      const next = result?.video || result;
      const nextUrl = next?.video_url || null;
      if (nextUrl) {
        setPreviewUrl(nextUrl);
        setPreviewKey((k) => k + 1);
      }
      setSuccess(
        result?.video_transcoding === "pending"
          ? "Video file replaced — normalizing in the background"
          : "Video file replaced"
      );
      onSaved?.(next);
    } catch (err) {
      setError(err.message || "Unable to replace video file");
    } finally {
      setReplaceBusy(false);
      setReplaceProgress(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  }

  async function handleCaptureFrame() {
    const el = videoPreviewRef.current;
    if (!el || !previewUrl) {
      setError("Play or seek the video, then capture a frame.");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      const w = el.videoWidth || 720;
      const h = el.videoHeight || 1280;
      if (!w || !h) {
        setError("Wait for the video to load, then capture again.");
        return;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(el, 0, 0, w, h);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Could not capture frame"))),
          "image/jpeg",
          0.9
        );
      });
      const file = new File([blob], `thumb-${video.video_id || "video"}.jpg`, {
        type: "image/jpeg",
      });
      await applyThumbnailFile(file);
    } catch (err) {
      setError(err.message || "Unable to capture frame");
    }
  }

  async function handleClearThumbnail() {
    setThumbBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await patchOwnerVideoMetadata(video.video_kind, video.video_source_id, {
        photo_url: null,
      });
      setPhotoUrl(null);
      setSuccess("Thumbnail cleared");
      onSaved?.(result.video);
    } catch (err) {
      setError(err.message || "Unable to clear thumbnail");
    } finally {
      setThumbBusy(false);
    }
  }

  return createPortal(
    <div
      data-testid="owner-video-editor"
      role="dialog"
      aria-modal="true"
      aria-label="Edit video metadata"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(20, 16, 14, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(640px, 100%)",
          maxHeight: "min(92vh, 900px)",
          overflow: "auto",
          background: "#fff",
          color: OWNER_COLORS.ink,
          borderRadius: 16,
          border: `1px solid ${OWNER_COLORS.line}`,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.18)",
          padding: "20px 22px",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <SectionTitle
          title="Edit video metadata"
          subtitle={`Asset #${video.asset_number ?? "—"} · ${video.video_id}. Search by restaurant name, then pick a CK menu item.`}
          action={
            <button
              type="button"
              onClick={onClose}
              style={{
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
              data-testid="owner-video-editor-close"
            >
              Close
            </button>
          }
        />

        {previewUrl ? (
          <div style={{ marginBottom: 16, display: "grid", gap: 8, maxWidth: 360 }}>
            <video
              key={previewKey}
              ref={videoPreviewRef}
              src={previewUrl}
              controls
              playsInline
              muted={playMuted}
              crossOrigin="anonymous"
              data-testid="owner-video-preview"
              onVolumeChange={(e) => {
                // Native player mute must update Feed mute state — preview-only mute was a false save.
                setPlayMuted(Boolean(e.currentTarget.muted));
              }}
              style={{ width: "100%", borderRadius: 12, background: "#000" }}
            />
            <div
              data-testid="owner-video-replace-panel"
              style={{
                display: "grid",
                gap: 8,
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#FAFAF9",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13 }}>Replace video file</span>
              <span style={{ fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.4 }}>
                Upload an improved MP4, WebM, or MOV. Keeps this asset’s tags, SEO metadata, and id —
                only the playable file changes.
              </span>
              <input
                ref={replaceFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                hidden
                data-testid="owner-video-replace-file"
                onChange={(e) => {
                  const next = e.target.files?.[0] || null;
                  if (next) void applyReplaceVideoFile(next);
                }}
              />
              <button
                type="button"
                disabled={replaceBusy || busy || thumbBusy}
                onClick={() => replaceFileInputRef.current?.click()}
                data-testid="owner-video-replace-upload"
                style={{
                  justifySelf: "start",
                  border: `1px solid ${OWNER_COLORS.line}`,
                  background: "#fff",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontWeight: 700,
                  cursor: replaceBusy || busy || thumbBusy ? "wait" : "pointer",
                }}
              >
                {replaceBusy
                  ? replaceProgress?.percent != null
                    ? `Uploading… ${Math.round(replaceProgress.percent)}%`
                    : "Replacing…"
                  : "Choose new file"}
              </button>
            </div>
            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: 14,
                fontWeight: 700,
                color: playMuted ? "#b91c1c" : OWNER_COLORS.ink,
              }}
            >
              <input
                type="checkbox"
                checked={playMuted}
                onChange={(e) => setPlayMuted(e.target.checked)}
                data-testid="owner-video-play-muted"
              />
              Mute on Feed (diners see “No sound.” and cannot unmute)
            </label>
            {playMuted ? (
              <p style={{ margin: 0, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
                Will save as muted on live Feed. Using the player’s speaker icon alone also sets this.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: OWNER_COLORS.muted }}>
                Check Mute (or mute the preview player) before Save — otherwise Feed plays with sound.
              </p>
            )}
            <div
              data-testid="owner-video-thumbnail-panel"
              style={{
                display: "grid",
                gap: 8,
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#FAFAF9",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13 }}>Search / Feed thumbnail</span>
              <span style={{ fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.4 }}>
                Upload an image or capture the current video frame. Used on search cards and Feed
                previews.
              </span>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  data-testid="owner-video-thumbnail-preview"
                  style={{
                    width: 96,
                    height: 170,
                    objectFit: "cover",
                    borderRadius: 10,
                    background: "#E5E7EB",
                  }}
                />
              ) : (
                <div
                  data-testid="owner-video-thumbnail-empty"
                  style={{
                    width: 96,
                    height: 170,
                    borderRadius: 10,
                    background: "linear-gradient(180deg,#F3F4F6,#E5E7EB)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    color: OWNER_COLORS.muted,
                    fontWeight: 600,
                  }}
                >
                  No thumb
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  disabled={thumbBusy || busy}
                  onClick={() => thumbFileInputRef.current?.click()}
                  data-testid="owner-video-thumbnail-upload"
                  style={{
                    border: `1px solid ${OWNER_COLORS.line}`,
                    background: "#fff",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: thumbBusy || busy ? "wait" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {thumbBusy ? "Saving…" : "Upload image"}
                </button>
                <button
                  type="button"
                  disabled={thumbBusy || busy || replaceBusy || !previewUrl}
                  onClick={handleCaptureFrame}
                  data-testid="owner-video-thumbnail-capture"
                  style={{
                    border: `1px solid ${OWNER_COLORS.line}`,
                    background: "#fff",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: thumbBusy || busy ? "wait" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Capture frame
                </button>
                {photoUrl ? (
                  <button
                    type="button"
                    disabled={thumbBusy || busy}
                    onClick={handleClearThumbnail}
                    data-testid="owner-video-thumbnail-clear"
                    style={{
                      border: `1px solid ${OWNER_COLORS.line}`,
                      background: "#fff",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: thumbBusy || busy ? "wait" : "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#B91C1C",
                    }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <input
                ref={thumbFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                hidden
                data-testid="owner-video-thumbnail-file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  e.target.value = "";
                  if (file) void applyThumbnailFile(file);
                }}
              />
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSave} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Caption / description</span>
          <textarea value={comment || ""} onChange={(e) => setComment(e.target.value)} rows={3} style={inputStyle} />
        </label>

        {supportsRestaurant || supportsMenuItem ? (
          placeLoading ? (
            <p style={{ fontSize: 13, color: OWNER_COLORS.muted, margin: 0 }}>Loading CK place data…</p>
          ) : (
            <CkRestaurantMenuPicker
              restaurant={restaurant}
              onRestaurantChange={setRestaurant}
              dish={dish}
              onDishChange={handleDishChange}
              allowMenuItem={supportsMenuItem}
              disabled={busy}
              testIdPrefix="owner-video"
            />
          )
        ) : null}

        <FoodFormPicker value={foodForm || ""} onChange={setFoodForm} disabled={busy} />
        <CuisinePicker value={cuisine || ""} onChange={setCuisine} disabled={busy} />
        <SearchWebMetadataSection video={video} />

        {video.video_kind === "managed" ? (
          <OwnerClusterSelect
            value={clusterId}
            onChange={setClusterId}
            clusters={clusters}
            loading={clustersLoading}
            disabled={busy}
            testId="owner-video-edit-cluster"
          />
        ) : null}

        <fieldset
          data-testid="owner-video-playback-settings"
          style={{
            border: `1px solid ${OWNER_COLORS.line}`,
            borderRadius: 12,
            padding: "12px 14px",
            margin: 0,
            display: "grid",
            gap: 10,
          }}
        >
          <legend style={{ fontWeight: 700, fontSize: 13, padding: "0 6px" }}>
            Playback settings
          </legend>
          <p style={{ margin: 0, fontSize: 12, color: OWNER_COLORS.muted }}>
            Feed mute is controlled above the form (next to the preview).
          </p>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={managerActive}
              onChange={(e) => setManagerActive(e.target.checked)}
              data-testid="owner-video-manager-active"
            />
            Show in Feed (uncheck to hide across Feed, profiles, and watch pages)
          </label>
          {managerActive ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleStopShowingInFeed}
              data-testid="owner-video-stop-feed"
              style={{
                justifySelf: "start",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #b91c1c",
                background: "#fff",
                color: "#b91c1c",
                fontWeight: 700,
                fontSize: 13,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              Stop showing in Feed
            </button>
          ) : (
            <p
              style={{ margin: 0, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}
              data-testid="owner-video-stopped-banner"
            >
              Stopped — not showing in Feed until you check Show in Feed and save.
            </p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>Run start</span>
              <input
                type="date"
                value={runStartsAt}
                max={runEndsAt || undefined}
                onChange={(e) => setRunStartsAt(e.target.value)}
                style={inputStyle}
                data-testid="owner-video-run-starts"
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>Run end</span>
              <input
                type="date"
                value={runEndsAt}
                min={runStartsAt || undefined}
                onChange={(e) => setRunEndsAt(e.target.value)}
                style={inputStyle}
                data-testid="owner-video-run-ends"
              />
            </label>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: OWNER_COLORS.muted }}>
            Leave run dates blank for always-on. Outside the window the video is hidden everywhere.
          </p>
        </fieldset>

        {video.video_kind !== "deal" ? (
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={marketDiscoverable}
              onChange={(e) => setMarketDiscoverable(e.target.checked)}
            />
            Market discoverable on Feed
          </label>
        ) : null}

        {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
        {success ? <div style={{ color: "#15803d", fontSize: 13 }}>{success}</div> : null}

        <button
          type="submit"
          disabled={busy}
          style={{
            justifySelf: "start",
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: OWNER_COLORS.accent,
            color: "#fff",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Saving…" : "Save metadata"}
        </button>
      </form>
      </div>
    </div>,
    document.body
  );
}

export default function OwnerVideoCuration() {
  const { clusters, loading: clustersLoading } = useOwnerClusterOptions();
  const [videos, setVideos] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("all");
  const [untaggedOnly, setUntaggedOnly] = useState(false);
  const [noAdminDescription, setNoAdminDescription] = useState(false);
  const [query, setQuery] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [lookupValue, setLookupValue] = useState("");
  const [selected, setSelected] = useState(null);

  const loadVideos = useCallback(
    async ({ cursor = null, append = false } = {}) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");
      try {
        const result = await listOwnerVideos({
          kind: kind === "all" ? undefined : kind,
          untagged_only: untaggedOnly,
          no_admin_description: noAdminDescription,
          q: query.trim() || undefined,
          date_from: dateFromFilter || undefined,
          date_to: dateToFilter || undefined,
          cursor: cursor || undefined,
          limit: 40,
        });
        setVideos((prev) => (append ? [...prev, ...(result.videos || [])] : result.videos || []));
        setNextCursor(result.next_cursor || null);
      } catch (err) {
        setError(err.message || "Video catalog is temporarily unavailable.");
        if (!append) setVideos([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [kind, untaggedOnly, noAdminDescription, query, dateFromFilter, dateToFilter]
  );

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const rows = useMemo(() => videos || [], [videos]);

  async function handleLookup(e) {
    e.preventDefault();
    const raw = lookupValue.trim();
    if (!raw) return;
    setError("");
    try {
      let result;
      if (/^\d+$/.test(raw)) {
        result = await lookupOwnerVideo({ assetNumber: raw });
      } else if (raw.includes(":")) {
        result = await lookupOwnerVideo({ videoId: raw });
      } else {
        throw new Error('Use asset number (e.g. 1042) or video id (e.g. ate:123)');
      }
      if (!result?.video) throw new Error("Video not found");
      setSelected(result.video);
      setVideos((prev) => {
        if (prev.some((v) => v.video_id === result.video.video_id)) return prev;
        return [result.video, ...prev];
      });
    } catch (err) {
      setError(err.message || "Lookup failed");
    }
  }

  return (
    <OwnerLayout title="Video Manager">
      <DealVideoUploadPanel onUploaded={() => loadVideos({ kind: "deal" })} />

      <VideoUploadPanel
        clusters={clusters}
        clustersLoading={clustersLoading}
        onUploaded={(video) => {
          setSelected(video);
          setVideos((prev) => [video, ...prev.filter((v) => v.video_id !== video.video_id)]);
        }}
      />

      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title="Browse videos"
          subtitle="Select any video to open the metadata editor — add or change restaurant, menu item, title, and caption anytime after upload."
        />

        <form
          onSubmit={handleLookup}
          style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, alignItems: "center" }}
        >
          <input
            value={lookupValue}
            onChange={(e) => setLookupValue(e.target.value)}
            placeholder="Lookup by asset # or video id (ate:123)"
            style={{ ...inputStyle, flex: "1 1 240px", maxWidth: 360 }}
          />
          <button type="submit" style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}` }}>
            Lookup
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <select value={kind} onChange={(e) => setKind(e.target.value)} style={inputStyle}>
            {KIND_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, restaurant, URL…"
            style={{ ...inputStyle, flex: "1 1 220px", maxWidth: 320 }}
          />
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            <span style={{ color: OWNER_COLORS.muted }}>Created from (PT)</span>
            <input
              type="date"
              value={dateFromFilter}
              max={dateToFilter || undefined}
              onChange={(e) => setDateFromFilter(e.target.value)}
              style={{ ...inputStyle, width: "auto", minWidth: 148 }}
              aria-label="Filter videos created on or after this date"
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            <span style={{ color: OWNER_COLORS.muted }}>Created to (PT)</span>
            <input
              type="date"
              value={dateToFilter}
              min={dateFromFilter || undefined}
              onChange={(e) => setDateToFilter(e.target.value)}
              style={{ ...inputStyle, width: "auto", minWidth: 148 }}
              aria-label="Filter videos created on or before this date"
            />
          </label>
          {dateFromFilter || dateToFilter ? (
            <button
              type="button"
              onClick={() => {
                setDateFromFilter("");
                setDateToFilter("");
              }}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}` }}
            >
              Clear dates
            </button>
          ) : null}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={untaggedOnly}
              onChange={(e) => setUntaggedOnly(e.target.checked)}
            />
            Untagged only
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={noAdminDescription}
              onChange={(e) => setNoAdminDescription(e.target.checked)}
              data-testid="owner-video-no-admin-description-filter"
            />
            No admin description
          </label>
          <button
            type="button"
            onClick={() => loadVideos()}
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}` }}
          >
            Refresh
          </button>
        </div>

        {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
        {loading ? <div style={{ color: OWNER_COLORS.muted }}>Loading videos…</div> : null}

        {!loading ? (
          <SimpleTable
            rows={rows}
            columns={[
              ["Asset #", "asset_number", (row) => (row.asset_number != null ? `#${row.asset_number}` : "—")],
              ["Video ID", "video_id"],
              ["Kind", "video_kind"],
              ["Title", "title", (row) => row.title || "—"],
              ["Restaurant", "restaurant_name", (row) => row.restaurant_name || "—"],
              ["Menu item", "menu_item_name", (row) => row.menu_item_name || "—"],
              ["Cluster", "cluster_name", (row) => row.cluster_name || "—"],
              [
                "Creator",
                "creator",
                (row) => formatOwnerVideoCreatorLabel(row),
              ],
              ["Metadata", "tagged", (row) => (row.is_tagged ? "Tagged" : "Needs metadata")],
              [
                "Settings",
                "settings",
                (row) => {
                  const bits = [];
                  if (row.play_muted === true) bits.push("Muted");
                  if (row.food_form) bits.push(row.food_form);
                  if (row.cuisine) bits.push(row.cuisine);
                  if (row.manager_active === false) bits.push("Inactive");
                  if (row.run_starts_at || row.run_ends_at) bits.push("Scheduled");
                  return bits.length ? bits.join(" · ") : "—";
                },
              ],
              ["Created", "created_at", (row) => formatWhen(row.created_at)],
              [
                "Edit",
                "edit",
                (row) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(row);
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: `1px solid ${OWNER_COLORS.line}`,
                      background: selected?.video_id === row.video_id ? OWNER_COLORS.accentSoft : "#fff",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    data-testid={`owner-video-edit-${row.video_id}`}
                  >
                    {selected?.video_id === row.video_id ? "Open" : "Edit metadata"}
                  </button>
                ),
              ],
            ]}
            emptyLabel="No videos match these filters."
            onRowClick={(row) => setSelected(row)}
          />
        ) : null}

        {nextCursor ? (
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => loadVideos({ cursor: nextCursor, append: true })}
            style={{ marginTop: 14, padding: "8px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}` }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </PageCard>

      {selected ? (
        <VideoEditor
          key={selected.video_id}
          video={selected}
          clusters={clusters}
          clustersLoading={clustersLoading}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(updated);
            setVideos((prev) => prev.map((v) => (v.video_id === updated.video_id ? updated : v)));
          }}
        />
      ) : null}
    </OwnerLayout>
  );
}
