import React, { useCallback, useEffect, useMemo, useState } from "react";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { SimpleTable } from "./intelligence/intelligenceShared.jsx";
import {
  listOwnerVideos,
  lookupOwnerVideo,
  patchOwnerVideoMetadata,
  uploadOwnerVideo,
} from "../../lib/ownerApi.js";
import CkRestaurantMenuPicker, {
  useCkPlaceFromVideoIds,
} from "../../components/ck/CkRestaurantMenuPicker.jsx";
import { dishLabel } from "../../lib/foodActivityApi.js";

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

function VideoUploadPanel({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
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
        subtitle="Upload MP4, WebM, or MOV — Menuply normalizes to Chrome-safe H.264 MP4 automatically (same path as diner Feed uploads)."
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

function VideoEditor({ video, onSaved, onClose }) {
  const [title, setTitle] = useState(video.title || "");
  const [comment, setComment] = useState(video.comment || "");
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
      const body = {
        title: title.trim() || undefined,
        comment: comment.trim() || null,
        market_discoverable: marketDiscoverable,
      };
      if (supportsRestaurant) {
        body.restaurant_id = restaurant?.restaurant_id ?? null;
      }
      if (supportsMenuItem) {
        body.menu_item_id = dish?.menu_item_id ?? null;
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

  return (
    <PageCard style={{ padding: 18, marginTop: 16 }}>
      <SectionTitle
        title="Edit video metadata"
        subtitle={`Asset #${video.asset_number ?? "—"} · ${video.video_id}`}
        action={
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
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

      <form onSubmit={handleSave} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
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
    </PageCard>
  );
}

export default function OwnerVideoCuration() {
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
      <VideoUploadPanel
        onUploaded={(video) => {
          setSelected(video);
          setVideos((prev) => {
            if (prev.some((v) => v.video_id === video.video_id)) return prev;
            return [video, ...prev];
          });
          loadVideos();
        }}
      />

      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title="Browse videos"
          subtitle="Every Feed video has an asset number (#) and composite id (kind:row_id). Search, filter, and attach restaurant or menu metadata by name."
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
              [
                "Creator",
                "creator",
                (row) => (row.is_guest ? "Guest" : row.creator_type || "—"),
              ],
              ["Metadata", "tagged", (row) => (row.is_tagged ? "Tagged" : "Needs metadata")],
              ["Created", "created_at", (row) => formatWhen(row.created_at)],
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
          video={selected}
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
