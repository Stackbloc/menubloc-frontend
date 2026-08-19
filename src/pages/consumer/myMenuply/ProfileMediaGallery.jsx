import { useRef } from "react";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import * as s from "./myMenuplyStyles.js";

const ACCEPT =
  "image/jpeg,image/png,image/webp,video/mp4,video/webm";

export default function ProfileMediaGallery({
  items = [],
  readOnly = false,
  busy = false,
  onAddFile,
  onRemove,
}) {
  const fileRef = useRef(null);

  if (!items.length && readOnly) return null;

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
          <>
            <button
              type="button"
              style={s.profileMediaAdd}
              data-testid="profile-media-add"
              aria-label="Add profile photo or video"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              + Add photo or video
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              style={{ display: "none" }}
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onAddFile?.(file);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
