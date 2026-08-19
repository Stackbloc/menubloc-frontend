import { useRef } from "react";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import * as s from "./myMenuplyStyles.js";

const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/*";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/*";

export default function ProfileMediaGallery({
  items = [],
  readOnly = false,
  busy = false,
  onAddFile,
  onRemove,
}) {
  const photoRef = useRef(null);
  const videoRef = useRef(null);

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
          <div style={s.profileMediaAdd} data-testid="profile-media-add">
            <button
              type="button"
              style={s.profileMediaCaptureBtn}
              data-testid="profile-media-take-photo"
              aria-label="Take profile photo with camera"
              disabled={busy}
              onClick={() => photoRef.current?.click()}
            >
              Take photo
            </button>
            <button
              type="button"
              style={s.profileMediaCaptureBtn}
              data-testid="profile-media-record-video"
              aria-label="Record profile video with camera"
              disabled={busy}
              onClick={() => videoRef.current?.click()}
            >
              Record video
            </button>
            <input
              ref={photoRef}
              type="file"
              accept={PHOTO_ACCEPT}
              capture="environment"
              style={{ display: "none" }}
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                handlePick(file);
              }}
            />
            <input
              ref={videoRef}
              type="file"
              accept={VIDEO_ACCEPT}
              capture="environment"
              style={{ display: "none" }}
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                handlePick(file);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
