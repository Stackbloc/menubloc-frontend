import React, { useCallback, useEffect, useMemo, useState } from "react";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { SimpleTable } from "./intelligence/intelligenceShared.jsx";
import {
  listOwnerVideos,
  lookupOwnerVideo,
  patchOwnerVideoMetadata,
  searchMenuConsoleRestaurants,
  searchMenuConsoleItems,
} from "../../lib/ownerApi.js";

const KIND_OPTIONS = [
  ["all", "All kinds"],
  ["ate", "Ate"],
  ["want", "Want"],
  ["plan", "Plan"],
  ["event", "Event"],
  ["deal", "Deal"],
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

function VideoEditor({ video, onSaved, onClose }) {
  const [title, setTitle] = useState(video.title || "");
  const [comment, setComment] = useState(video.comment || "");
  const [restaurantQuery, setRestaurantQuery] = useState(video.restaurant_name || "");
  const [restaurantId, setRestaurantId] = useState(video.restaurant_id || null);
  const [restaurantHits, setRestaurantHits] = useState([]);
  const [menuItemQuery, setMenuItemQuery] = useState(video.menu_item_name || "");
  const [menuItemId, setMenuItemId] = useState(video.menu_item_id || null);
  const [menuItemHits, setMenuItemHits] = useState([]);
  const [marketDiscoverable, setMarketDiscoverable] = useState(video.market_discoverable !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const supportsMenuItem = video.video_kind === "ate" || video.video_kind === "want" || video.video_kind === "deal";
  const supportsRestaurant =
    video.video_kind === "ate" ||
    video.video_kind === "want" ||
    video.video_kind === "plan" ||
    video.video_kind === "deal";

  useEffect(() => {
    const q = restaurantQuery.trim();
    if (q.length < 2 || (video.restaurant_name && q === video.restaurant_name)) {
      setRestaurantHits([]);
      return;
    }
    const timer = setTimeout(() => {
      searchMenuConsoleRestaurants({ q })
        .then((res) => setRestaurantHits(res?.restaurants || res?.items || []))
        .catch(() => setRestaurantHits([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [restaurantQuery, video.restaurant_name]);

  useEffect(() => {
    if (!supportsMenuItem || !restaurantId) {
      setMenuItemHits([]);
      return;
    }
    const q = menuItemQuery.trim();
    if (q.length < 2) {
      setMenuItemHits([]);
      return;
    }
    const timer = setTimeout(() => {
      searchMenuConsoleItems(restaurantId, { q, limit: 12 })
        .then((res) => setMenuItemHits(res?.items || []))
        .catch(() => setMenuItemHits([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [menuItemQuery, restaurantId, supportsMenuItem]);

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
        body.restaurant_id = restaurantId;
      }
      if (supportsMenuItem) {
        body.menu_item_id = menuItemId;
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

        {supportsRestaurant ? (
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Restaurant</span>
            <input
              value={restaurantQuery}
              onChange={(e) => {
                setRestaurantQuery(e.target.value);
                setRestaurantId(null);
              }}
              placeholder="Search restaurant name"
              style={inputStyle}
            />
            {restaurantHits.length ? (
              <div style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8, overflow: "hidden" }}>
                {restaurantHits.map((hit) => (
                  <button
                    key={hit.id}
                    type="button"
                    onClick={() => {
                      setRestaurantId(hit.id);
                      setRestaurantQuery(hit.name || hit.restaurant_name || "");
                      setRestaurantHits([]);
                      setMenuItemId(null);
                      setMenuItemQuery("");
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      border: "none",
                      borderBottom: `1px solid ${OWNER_COLORS.line}`,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {hit.name || hit.restaurant_name}
                    {hit.city ? ` · ${hit.city}, ${hit.state || ""}` : ""}
                  </button>
                ))}
              </div>
            ) : null}
            {restaurantId ? (
              <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Linked restaurant id: {restaurantId}</div>
            ) : null}
          </label>
        ) : null}

        {supportsMenuItem ? (
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Menu item (CK)</span>
            <input
              value={menuItemQuery}
              onChange={(e) => {
                setMenuItemQuery(e.target.value);
                setMenuItemId(null);
              }}
              placeholder={restaurantId ? "Search menu item" : "Pick a restaurant first"}
              disabled={!restaurantId}
              style={inputStyle}
            />
            {menuItemHits.length ? (
              <div style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8, overflow: "hidden" }}>
                {menuItemHits.map((hit) => (
                  <button
                    key={hit.id}
                    type="button"
                    onClick={() => {
                      setMenuItemId(hit.id);
                      setMenuItemQuery(hit.item_name || hit.name || "");
                      setMenuItemHits([]);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      border: "none",
                      borderBottom: `1px solid ${OWNER_COLORS.line}`,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {hit.item_name || hit.name}
                  </button>
                ))}
              </div>
            ) : null}
            {menuItemId ? (
              <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Linked menu item id: {menuItemId}</div>
            ) : null}
          </label>
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
    [kind, untaggedOnly, query]
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
    <OwnerLayout title="Video Catalog">
      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title="Platform video catalog"
          subtitle="Every Feed video gets an asset number (#) and a composite video id (kind:row_id). Browse, look up, and attach restaurant or menu item metadata."
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
