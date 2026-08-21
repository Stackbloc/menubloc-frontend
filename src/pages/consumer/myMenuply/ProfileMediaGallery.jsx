import { useState } from "react";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { prefersHoverReveal } from "./mediaHoverReveal.js";
import * as s from "./myMenuplyStyles.js";

/**
 * Profile gallery — presentation of existing media only.
 * Add/camera moves to bottom-nav X (not inline here).
 * Owner: hover (or always on touch) to delete photo or video tiles.
 */
function ProfileMediaTile({ item, readOnly, busy, onRemove }) {
  const src = resolveConsumerMediaUrl(item.media_url || "");
  const isVideo = item.media_kind === "video";
  const canDelete = !readOnly && typeof onRemove === "function";
  const [hovered, setHovered] = useState(() => !prefersHoverReveal());
  const showDelete = canDelete && (hovered || !prefersHoverReveal());

  return (
    <div
      style={s.profileMediaTile}
      data-testid="profile-media-item"
      data-media={isVideo ? "video" : "photo"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(prefersHoverReveal() ? false : true)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setHovered(prefersHoverReveal() ? false : true);
        }
      }}
    >
      {isVideo ? (
        <video src={src} style={s.profileMediaThumb} controls playsInline preload="metadata" />
      ) : (
        <img src={src} alt="" style={s.profileMediaThumb} loading="lazy" />
      )}
      {showDelete ? (
        <button
          type="button"
          style={s.profileMediaRemove}
          data-testid="profile-media-delete"
          aria-label={isVideo ? "Delete profile video" : "Delete profile photo"}
          disabled={busy}
          onClick={() => onRemove?.(item)}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

export default function ProfileMediaGallery({
  items = [],
  readOnly = false,
  busy = false,
  onAddFile,
  onRemove,
}) {
  void onAddFile;
  if (!items.length) return null;

  return (
    <div style={{ marginTop: 16 }} data-testid="about-me-profile-media">
      <h3 style={{ ...s.sectionTitle, fontSize: 16, marginBottom: 8 }}>Profile gallery</h3>
      {!readOnly ? (
        <p style={{ ...s.muted, marginTop: 0, marginBottom: 10 }}>
          Photos and short videos about you — not your eating diary.
        </p>
      ) : null}

      <div style={s.profileMediaGrid}>
        {items.map((item) => (
          <ProfileMediaTile
            key={item.id}
            item={item}
            readOnly={readOnly}
            busy={busy}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
