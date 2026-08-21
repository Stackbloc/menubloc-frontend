import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import * as s from "./myMenuplyStyles.js";

/**
 * Profile gallery — presentation of existing media only.
 * Add/camera moves to bottom-nav X (not inline here).
 * Owner: long-press (hard press) / right-click to delete photo or video — not hover.
 */
function ProfileMediaTile({ item, readOnly, busy, onRemove }) {
  const src = resolveConsumerMediaUrl(item.media_url || "");
  const isVideo = item.media_kind === "video";
  const canDelete = !readOnly && typeof onRemove === "function";
  const { open, dismiss, bind } = useLongPressReveal(canDelete);

  return (
    <div
      style={s.profileMediaTile}
      data-testid="profile-media-item"
      data-media={isVideo ? "video" : "photo"}
      {...bind}
    >
      {isVideo ? (
        <video src={src} style={s.profileMediaThumb} controls playsInline preload="metadata" />
      ) : (
        <img src={src} alt="" style={s.profileMediaThumb} loading="lazy" />
      )}
      {open ? (
        <button
          type="button"
          style={s.profileMediaRemove}
          data-testid="profile-media-delete"
          aria-label={isVideo ? "Delete profile video" : "Delete profile photo"}
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dismiss();
            onRemove?.(item);
          }}
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
          Photos and short videos about you — not your eating diary. Long-press to delete.
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
