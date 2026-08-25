/** Helpers for What I'm Eating photo/video uploads. */

/** Portrait capture dimensions (9:16 content); UI frames match existing photo slots. */
export const SOCIAL_VIDEO_ASPECT_RATIO = "9 / 16";
export const SOCIAL_VIDEO_IDEAL_WIDTH = 720;
export const SOCIAL_VIDEO_IDEAL_HEIGHT = 1280;
/**
 * TikTok-like length cap (10 minutes). Native OS camera records; Menuply only validates.
 * Pair with MAX_UPLOAD_VIDEO_BYTES (~287 MB TikTok-class upload ceiling).
 */
export const SOCIAL_VIDEO_MAX_RECORD_SECONDS = 600;

/** Human label for duration gates and camera hints. */
export function formatVideoMaxDurationLabel(seconds = SOCIAL_VIDEO_MAX_RECORD_SECONDS) {
  const n = Number(seconds) || 0;
  if (n >= 60 && n % 60 === 0) {
    const mins = n / 60;
    return mins === 1 ? "1 minute" : `${mins} minutes`;
  }
  if (n >= 60) {
    const mins = Math.round(n / 60);
    return mins === 1 ? "1 minute" : `${mins} minutes`;
  }
  return `${n} seconds`;
}

export function isVideoFile(file) {
  return Boolean(file && String(file.type || "").startsWith("video/"));
}

export function eatingMediaFromUpload(upload) {
  if (!upload) return {};
  if (upload.video_url) return { video_url: upload.video_url };
  if (upload.photo_url) return { photo_url: upload.photo_url };
  return {};
}

export function eatingMediaLabel(file) {
  return isVideoFile(file) ? "Video" : "Photo";
}
