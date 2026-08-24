/** Helpers for What I'm Eating photo/video uploads. */

/** Portrait capture dimensions (9:16 content); UI frames match existing photo slots. */
export const SOCIAL_VIDEO_ASPECT_RATIO = "9 / 16";
export const SOCIAL_VIDEO_IDEAL_WIDTH = 720;
export const SOCIAL_VIDEO_IDEAL_HEIGHT = 1280;
/** Story-length cap — keeps uploads under the mobile client size gate. */
export const SOCIAL_VIDEO_MAX_RECORD_SECONDS = 60;

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
