/** Helpers for What I'm Eating photo/video uploads. */

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
