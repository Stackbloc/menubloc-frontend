import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { SimpleTable } from "./intelligence/intelligenceShared.jsx";
import {
  listOwnerVideos,
  listOwnerVideoClusters,
  lookupOwnerVideo,
  patchOwnerVideoMetadata,
  uploadOwnerVideo,
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
      const form = new FormData();
      form.append("video", file);
      if (title.trim()) form.append("title", title.trim());
      if (comment.trim()) form.append("comment", comment.trim());
      if (restaurant?.restaurant_id != null) {
        form.append("restaurant_id", String(restaurant.restaurant_id));
      }
      if (dish?.menu_item_id != null) {
        form.append("menu_item_id", String(dish.menu_item_id));
      }
      if (clusterId != null) {
        form.append("cluster_id", String(clusterId));
      }
      form.append("market_discoverable", marketDiscoverable ? "1" : "0");

      const result = await uploadOwnerVideo(form);
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
        subtitle="Upload MP4, WebM, or MOV — Menuply normalizes to Chrome-safe H.264 MP4 automatically (same path as diner Feed uploads). Stay on this page until upload finishes. Max ~287 MB. Restaurant and menu item are optional now; add or change them anytime after upload."
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

function VideoEditor({ video, onSaved, onClose, clusters, clustersLoading }) {
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setTitle(video.title || "");
    setComment(video.comment || "");
    setClusterId(video.cluster_id != null ? Number(video.cluster_id) : null);
    setMarketDiscoverable(video.market_discoverable !== false);
    setError("");
    setSuccess("");
  }, [video.video_id, video.title, video.comment, video.cluster_id, video.market_discoverable]);

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

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const resolvedTitle = resolveVideoEditorTitle({ title, dish, video });
      const body = {
        title: resolvedTitle || undefined,
        comment: comment.trim() || null,
        market_discoverable: marketDiscoverable,
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
      setSuccess("Saved");
      onSaved?.(result.video);
    } catch (err) {
      setError(err.message || "Unable to save video metadata");
    } finally {
      setBusy(false);
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

        {video.video_url ? (
          <video
            src={video.video_url}
            controls
            playsInline
            style={{ width: "100%", maxWidth: 360, borderRadius: 12, background: "#000", marginBottom: 16 }}
          />
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
    [kind, untaggedOnly, query, dateFromFilter, dateToFilter]
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
