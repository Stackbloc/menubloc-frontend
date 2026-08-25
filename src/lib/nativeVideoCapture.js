/**
 * Native OS video capture — phone camera / file picker produces the clip.
 * Replaces in-app MediaRecorder (unreliable across Safari/Chrome).
 */

import {
  MAX_UPLOAD_VIDEO_BYTES,
  formatBytes,
} from "./consumerCameraCapture.js";
import {
  SOCIAL_VIDEO_MAX_RECORD_SECONDS,
  formatVideoMaxDurationLabel,
} from "./eatingMediaUtils.js";

export {
  SOCIAL_VIDEO_MAX_RECORD_SECONDS,
  MAX_UPLOAD_VIDEO_BYTES,
  formatVideoMaxDurationLabel,
};

export function captureAttrForFacing(facingMode = "environment") {
  return facingMode === "user" ? "user" : "environment";
}

/** Sync gate before accept — type + upload size only. */
export function validateNativeVideoFile(file) {
  if (!file || !Number(file.size)) {
    throw new Error("No video was selected. Try again.");
  }
  const type = String(file.type || "").toLowerCase();
  if (!type.startsWith("video/")) {
    throw new Error("That file is not a video. Record again with your phone camera.");
  }
  if (file.size > MAX_UPLOAD_VIDEO_BYTES) {
    throw new Error(
      `Video is too large (${formatBytes(file.size)}). Keep it under ${formatBytes(MAX_UPLOAD_VIDEO_BYTES)} (about ${formatVideoMaxDurationLabel()}).`
    );
  }
  return file;
}

/**
 * Metadata probe after OS capture — no MediaRecorder blobs, no URL fragments.
 */
export function probeNativeVideoFile(file) {
  validateNativeVideoFile(file);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.preload = "metadata";

    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timerId);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      fn(value);
    };

    const timerId = window.setTimeout(() => {
      finish(reject, new Error("Could not read that video. Try recording again."));
    }, 12_000);

    video.onloadedmetadata = () => {
      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        finish(reject, new Error("That video looks blank. Try recording again."));
        return;
      }
      const dur = Number(video.duration);
      if (Number.isFinite(dur) && dur > SOCIAL_VIDEO_MAX_RECORD_SECONDS + 1.5) {
        finish(
          reject,
          new Error(
            `Video is too long (${Math.round(dur)}s). Record ${formatVideoMaxDurationLabel()} or less.`
          )
        );
        return;
      }
      finish(resolve, {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: dur,
      });
    };

    video.onerror = () => {
      finish(reject, new Error("Could not read that video. Try recording again."));
    };

    video.src = url;
    video.load();
  });
}

export async function normalizeNativeVideoFile(rawFile) {
  await probeNativeVideoFile(rawFile);
  const type = String(rawFile.type || "video/mp4").split(";")[0].trim().toLowerCase();
  const ext = type.includes("mp4") ? "mp4" : type.includes("quicktime") ? "mov" : "webm";
  const baseName = String(rawFile.name || "").trim() || `menuply-video-${Date.now()}.${ext}`;
  if (rawFile.name && rawFile.type) return rawFile;
  return new File([rawFile], baseName, { type: type || "video/mp4" });
}
