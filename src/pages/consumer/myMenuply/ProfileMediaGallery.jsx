import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import * as s from "./myMenuplyStyles.js";

export default function ProfileMediaGallery({
  items = [],
  readOnly = false,
  busy = false,
  onAddFile,
  onRemove,
}) {
  if (!items.length && readOnly) return null;

  function handlePick(file) {
    if (file) onAddFile?.(file);
  }

  return (
    <div style={{ marginTop: 16 }} data-testid="about-me-profile-media">
      <h3 style={{ ...s.sectionTitle, fontSize: 16, marginBottom: 8 }}>Profile gallery</h3>
      {!readOnly ? (
        <p style={{ ...s.muted, marginTop: 0, marginBottom: 10 }}>
          Photos and short videos about you — not your eating diary.
        </p>
      ) : null}

      <div style={s.profileMediaGrid}>
        {items.map((item) => {
          const src = resolveConsumerMediaUrl(item.media_url || "");
          const isVideo = item.media_kind === "video";
          return (
            <div key={item.id} style={s.profileMediaTile} data-testid="profile-media-item">
              {isVideo ? (
                <video src={src} style={s.profileMediaThumb} controls playsInline preload="metadata" />
              ) : (
                <img src={src} alt="" style={s.profileMediaThumb} loading="lazy" />
              )}
              {readOnly ? null : (
                <button
                  type="button"
                  style={s.profileMediaRemove}
                  aria-label="Remove profile media"
                  disabled={busy}
                  onClick={() => onRemove?.(item)}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}

        {readOnly ? null : (
          <div style={s.profileMediaAddTile} data-testid="profile-media-add">
            <MenuplyMediaPicker
              onFile={handlePick}
              disabled={busy}
              facingMode="user"
              allowPhoto
              allowVideo
              showPreview={false}
              testId="profile-media-picker"
              ariaLabel="Add profile photo or video"
            />
            <span style={s.profileMediaAddLabel}>Add photo or video</span>
          </div>
        )}
      </div>
    </div>
  );
}
