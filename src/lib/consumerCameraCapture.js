/** Inline camera capture — getUserMedia with exact front/rear device selection. */

export function inlineCameraSupported() {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function preferInlineCamera() {
  // Live getUserMedia sheet — hidden file+capture opens Files/Downloads on many phones.
  return inlineCameraSupported();
}

export function videoRecorderSupported() {
  return (
    inlineCameraSupported() &&
    typeof MediaRecorder !== "undefined" &&
    (MediaRecorder.isTypeSupported?.("video/webm") ||
      MediaRecorder.isTypeSupported?.("video/mp4"))
  );
}

function normalizeFacing(facingMode = "environment") {
  return facingMode === "user" ? "user" : "environment";
}

/**
 * Pick a videoinput deviceId that matches front (user) or rear (environment).
 * Requires a prior getUserMedia grant so labels are populated on most browsers.
 */
export async function resolveCameraDeviceId(facingMode = "environment") {
  if (!navigator.mediaDevices?.enumerateDevices) return null;
  const want = normalizeFacing(facingMode);
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter((d) => d.kind === "videoinput" && d.deviceId);
  if (!cameras.length) return null;

  const scored = cameras.map((device) => {
    const label = String(device.label || "").toLowerCase();
    let score = 0;
    if (want === "user") {
      if (/front|user|face|selfie/.test(label)) score += 10;
      if (/back|rear|environment|world/.test(label)) score -= 5;
    } else {
      if (/back|rear|environment|world/.test(label)) score += 10;
      if (/front|user|face|selfie/.test(label)) score -= 5;
    }
    return { deviceId: device.deviceId, score, label };
  });

  scored.sort((a, b) => b.score - a.score);
  if (scored[0].score > 0) return scored[0].deviceId;
  // Fallback: rear often listed first on phones; front often second.
  if (want === "user" && scored.length > 1) return scored[1].deviceId;
  return scored[0].deviceId;
}

export async function countVideoInputDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return 0;
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "videoinput").length;
}

function buildVideoConstraints(facingMode, deviceId, { forVideo = false } = {}) {
  if (deviceId) {
    return {
      deviceId: { exact: deviceId },
      width: { ideal: forVideo ? 1280 : 1920 },
      height: { ideal: forVideo ? 720 : 1080 },
    };
  }
  return {
    facingMode: { exact: normalizeFacing(facingMode) },
    width: { ideal: forVideo ? 1280 : 1920 },
    height: { ideal: forVideo ? 720 : 1080 },
  };
}

export async function openCameraStream(facingMode = "environment", deviceId = null) {
  const constraints = {
    video: buildVideoConstraints(facingMode, deviceId, { forVideo: false }),
    audio: false,
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

export async function openVideoStream(facingMode = "environment", deviceId = null) {
  const constraints = {
    video: buildVideoConstraints(facingMode, deviceId, { forVideo: true }),
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
  // Prefer mp4 first — Safari/iOS often cannot produce usable WebM.
  const candidates = [
    "video/mp4",
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return "";
}

/**
 * Build a MediaRecorder. Uses video tracks only — audio+video containers often
 * produce black / unplayable clips on mobile Safari and some Chromium builds.
 */
export function createCameraMediaRecorder(stream) {
  const mimeType = pickRecorderMimeType();
  if (!mimeType) {
    throw new Error(
      "Video recording is not supported in this browser. Use Open phone camera below."
    );
  }
  const videoTracks = stream?.getVideoTracks?.() || [];
  if (!videoTracks.length) {
    throw new Error("No camera video track available to record.");
  }
  const recordStream = new MediaStream(videoTracks);
  try {
    return {
      recorder: new MediaRecorder(recordStream, { mimeType }),
      mimeType,
      recordStream,
    };
  } catch {
    return {
      recorder: new MediaRecorder(recordStream),
      mimeType: mimeType.split(";")[0] || "video/webm",
      recordStream,
    };
  }
}

/** Minimum size for a non-empty short clip (headers alone are smaller). */
export const MIN_RECORDED_VIDEO_BYTES = 8 * 1024;

export function formatBytes(n) {
  const size = Number(n) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return "No matching camera found on this device.";
  }
  if (name === "NotReadableError") {
    return "Camera is in use by another app. Close it and try again.";
  }
  return message || "Could not open camera.";
}

/**
 * Open photo or video stream preferring an exact deviceId for the facing side.
 * Stops any previousStream tracks first so flip can reopen cleanly.
 */
export async function openMediaStreamForFacing({
  facingMode = "environment",
  withAudio = false,
  previousStream = null,
} = {}) {
  stopMediaStream(previousStream);

  const facing = normalizeFacing(facingMode);
  let deviceId = null;

  // Warm permission so enumerateDevices returns labels, then resolve deviceId.
  try {
    const warm = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing } },
      audio: false,
    });
    stopMediaStream(warm);
    deviceId = await resolveCameraDeviceId(facing);
  } catch {
    deviceId = null;
  }

  const openExact = withAudio ? openVideoStream : openCameraStream;
  try {
    return await openExact(facing, deviceId);
  } catch (first) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: withAudio,
      });
    } catch {
      throw first;
    }
  }
}

export async function openCameraStreamWithFallback(facingMode = "environment", previousStream = null) {
  return openMediaStreamForFacing({
    facingMode,
    withAudio: false,
    previousStream,
  });
}

export async function openVideoStreamWithFallback(facingMode = "environment", previousStream = null) {
  return openMediaStreamForFacing({
    facingMode,
    withAudio: true,
    previousStream,
  });
}
