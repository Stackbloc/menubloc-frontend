/** Inline camera capture — reliable on mobile where hidden file+capture opens Downloads only. */

export function inlineCameraSupported() {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function preferInlineCamera() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const narrow = window.innerWidth <= 900;
  const mobileUa = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  return mobileUa || coarse || narrow;
}

export function videoRecorderSupported() {
  return (
    inlineCameraSupported() &&
    typeof MediaRecorder !== "undefined" &&
    (MediaRecorder.isTypeSupported?.("video/webm") ||
      MediaRecorder.isTypeSupported?.("video/mp4"))
  );
}

export async function openCameraStream(facingMode = "environment") {
  const constraints = {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

export async function openVideoStream(facingMode = "environment") {
  const constraints = {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: true,
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

export function stopMediaStream(stream) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      /* ignore */
    }
  }
}

export async function photoFileFromVideoElement(videoEl, filenamePrefix = "photo") {
  const w = videoEl.videoWidth || 1280;
  const h = videoEl.videoHeight || 720;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not capture photo");
  ctx.drawImage(videoEl, 0, 0, w, h);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode photo"))),
      "image/jpeg",
      0.9
    );
  });
  return new File([blob], `${filenamePrefix}-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported?.("video/webm;codecs=vp9,opus")) {
    return "video/webm;codecs=vp9,opus";
  }
  if (MediaRecorder.isTypeSupported?.("video/webm;codecs=vp8,opus")) {
    return "video/webm;codecs=vp8,opus";
  }
  if (MediaRecorder.isTypeSupported?.("video/webm")) return "video/webm";
  if (MediaRecorder.isTypeSupported?.("video/mp4")) return "video/mp4";
  return "";
}

export function formatCameraError(err) {
  const name = String(err?.name || "");
  const message = String(err?.message || "");
  if (
    name === "NotAllowedError" ||
    name === "SecurityError" ||
    /permission denied/i.test(message)
  ) {
    return "Camera blocked. Allow Camera for menuply.com in your browser settings, reload this page, then tap Allow when asked.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera found on this device.";
  }
  if (name === "NotReadableError") {
    return "Camera is in use by another app. Close it and try again.";
  }
  return message || "Could not open camera.";
}

export async function openCameraStreamWithFallback(facingMode = "environment") {
  try {
    return await openCameraStream(facingMode);
  } catch (first) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });
    } catch {
      throw first;
    }
  }
}

export async function openVideoStreamWithFallback(facingMode = "environment") {
  try {
    return await openVideoStream(facingMode);
  } catch (first) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: true,
      });
    } catch {
      throw first;
    }
  }
}
