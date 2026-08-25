/**
 * Native OS video capture — phone camera / file picker produces the clip.
 * Replaces in-app MediaRecorder (unreliable across Safari/Chrome).
 *
 * Decode probe is soft: many phone cameras produce HEVC/MOV that desktop Chrome
 * cannot decode in a hidden <video>, but the file is still a valid upload.
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

const VIDEO_NAME_RE = /\.(mp4|mov|m4v|webm|mkv)$/i;

export function captureAttrForFacing(facingMode = "environment") {
  return facingMode === "user" ? "user" : "environment";
}

function baseMime(file) {
  return String(file?.type || "")
    .toLowerCase()
    .split(";")[0]
    .trim();
}

export function looksLikeVideoFile(file) {
  if (!file) return false;
  const mime = baseMime(file);
  if (mime.startsWith("video/")) return true;
  return VIDEO_NAME_RE.test(String(file.name || ""));
}

/** Sync gate before accept — type/extension + upload size only. */
export function validateNativeVideoFile(file) {
  if (!file || !Number(file.size)) {
    throw new Error("No video was selected. Try again.");
  }
  if (!looksLikeVideoFile(file)) {
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
 * Best-effort metadata probe. Prefer dimensions; duration may be Infinity/NaN.
 * Rejects only when duration is known and over the TikTok-class cap.
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
      try {
        video.pause();
      } catch {
        /* ignore */
      }
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.oncanplay = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      fn(value);
    };

    const timerId = window.setTimeout(() => {
      finish(reject, new Error("Could not read that video. Try recording again."));
    }, 12_000);

    const tryAccept = () => {
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
      // Dimensions preferred; some containers report 0 until canplay — keep waiting.
      if (video.videoWidth <= 0 || video.videoHeight <= 0) return;
      finish(resolve, {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: dur,
      });
    };

    video.onloadedmetadata = tryAccept;
    video.onloadeddata = tryAccept;
    video.oncanplay = tryAccept;

    video.onerror = () => {
      finish(reject, new Error("Could not read that video. Try recording again."));
    };

    video.src = url;
    video.load();
  });
}

function resolveVideoMimeAndExt(file) {
  const mime = baseMime(file);
  const name = String(file.name || "").toLowerCase();
  if (mime.includes("webm") || name.endsWith(".webm")) {
    return { type: mime || "video/webm", ext: "webm" };
  }
  if (mime.includes("quicktime") || name.endsWith(".mov")) {
    return { type: mime || "video/quicktime", ext: "mov" };
  }
  if (name.endsWith(".m4v")) {
    return { type: mime || "video/mp4", ext: "m4v" };
  }
  return { type: mime && mime.startsWith("video/") ? mime : "video/mp4", ext: "mp4" };
}

/**
 * Normalize OS camera / picker file for compose + upload.
 * Soft-probes decode: if the browser cannot preview HEVC/MOV, still accept after
 * size/type gates so the diner can Post (upload path does not require browser decode).
 */
export async function normalizeNativeVideoFile(rawFile) {
  validateNativeVideoFile(rawFile);

  try {
    await probeNativeVideoFile(rawFile);
  } catch (err) {
    const msg = String(err?.message || "");
    // Hard gates only — decode/preview failures must not block Post.
    if (/too long/i.test(msg) || /too large/i.test(msg) || /not a video/i.test(msg) || /No video was selected/i.test(msg)) {
      throw err;
    }
  }

  const { type, ext } = resolveVideoMimeAndExt(rawFile);
  const baseName = String(rawFile.name || "").trim() || `menuply-video-${Date.now()}.${ext}`;
  if (rawFile.name && baseMime(rawFile).startsWith("video/")) return rawFile;
  return new File([rawFile], baseName, { type: type || "video/mp4" });
}
