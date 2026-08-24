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
      MediaRecorder.isTypeSupported?.("video/mp4") ||
      MediaRecorder.isTypeSupported?.("video/webm;codecs=vp8"))
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
  // Video capture uses a smaller frame so short clips upload reliably on mobile networks.
  const size = forVideo
    ? { width: { ideal: 720 }, height: { ideal: 720 } }
    : { width: { ideal: 1920 }, height: { ideal: 1080 } };
  if (deviceId) {
    return {
      deviceId: { exact: deviceId },
      ...size,
    };
  }
  return {
    facingMode: { exact: normalizeFacing(facingMode) },
    ...size,
  };
}

export async function openCameraStream(facingMode = "environment", deviceId = null) {
  const constraints = {
    video: buildVideoConstraints(facingMode, deviceId, { forVideo: false }),
    audio: false,
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

/** Live preview + record path — smaller frames than still photos. */
export async function openCameraStreamForVideoCapture(facingMode = "environment", deviceId = null) {
  const constraints = {
    video: buildVideoConstraints(facingMode, deviceId, { forVideo: true }),
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

/** True for Safari / iOS WebKit where MediaRecorder prefers mp4 containers. */
export function prefersMp4Recorder() {
  if (typeof navigator === "undefined") return false;
  const ua = String(navigator.userAgent || "");
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // Desktop Safari (not Chrome/Chromium/Firefox/Edge).
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS/i.test(ua);
}

/**
 * Append #t=0.001 so iOS paints a first frame for muted preview videos.
 */
export function withVideoPreviewSeek(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.includes("#")) return raw;
  return `${raw}#t=0.001`;
}

export function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  // Chrome often reports video/mp4 as supported but records unplayable/black clips.
  // Prefer WebM on Chromium; mp4 only on Safari/iOS.
  const safariFirst = [
    "video/mp4",
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  const chromiumFirst = [
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
    "video/mp4",
  ];
  const candidates = prefersMp4Recorder() ? safariFirst : chromiumFirst;
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return "";
}

/**
 * Safari mp4 MediaRecorder often needs an audio track for a playable container.
 * Use a silent AudioContext track (no mic permission / no audible audio).
 */
export function withSilentAudioForRecording(videoOnlyStream) {
  const videoTracks = videoOnlyStream?.getVideoTracks?.() || [];
  if (!videoTracks.length) {
    return { stream: videoOnlyStream, cleanup: () => {} };
  }
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return { stream: new MediaStream(videoTracks), cleanup: () => {} };
    }
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const dest = ctx.createMediaStreamDestination();
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    const audioTrack = dest.stream.getAudioTracks()[0];
    const stream = new MediaStream([...videoTracks, audioTrack].filter(Boolean));
    return {
      stream,
      cleanup: () => {
        try {
          osc.stop();
        } catch {
          /* ignore */
        }
        try {
          audioTrack?.stop();
        } catch {
          /* ignore */
        }
        try {
          ctx.close();
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    return { stream: new MediaStream(videoTracks), cleanup: () => {} };
  }
}

/**
 * Build a MediaRecorder.
 * - Chromium: WebM video-only (most reliable preview + upload)
 * - Safari/iOS mp4: silent audio track so the container is playable
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

  const wantsMp4 = mimeType.startsWith("video/mp4");
  const baseVideoStream = new MediaStream(videoTracks);
  const { stream: recordStream, cleanup } = wantsMp4
    ? withSilentAudioForRecording(baseVideoStream)
    : { stream: baseVideoStream, cleanup: () => {} };

  const options = { mimeType, videoBitsPerSecond: 900_000 };
  try {
    return {
      recorder: new MediaRecorder(recordStream, options),
      mimeType,
      recordStream,
      cleanup,
    };
  } catch {
    try {
      return {
        recorder: new MediaRecorder(recordStream, { mimeType }),
        mimeType,
        recordStream,
        cleanup,
      };
    } catch {
      return {
        recorder: new MediaRecorder(recordStream),
        mimeType: mimeType.split(";")[0] || "video/webm",
        recordStream,
        cleanup,
      };
    }
  }
}

/** Grab a still from the live preview for review poster when blob paint fails. */
export function capturePosterFromVideoElement(videoEl) {
  if (!videoEl || !videoEl.videoWidth) return "";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return "";
  }
}

/** Minimum size for a non-empty short clip (headers alone are smaller). */
export const MIN_RECORDED_VIDEO_BYTES = 8 * 1024;
/** Soft client cap before upload — larger clips often die with "Failed to fetch". */
export const MAX_UPLOAD_VIDEO_BYTES = 12 * 1024 * 1024;
/** Auto-stop recording so clips stay uploadable on mobile networks. */
export const MAX_RECORD_SECONDS = 15;

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
  forVideoCapture = false,
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

  const openExact = withAudio
    ? openVideoStream
    : forVideoCapture
      ? openCameraStreamForVideoCapture
      : openCameraStream;
  try {
    return await openExact(facing, deviceId);
  } catch (first) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: forVideoCapture
          ? { facingMode: { ideal: facing }, width: { ideal: 720 }, height: { ideal: 720 } }
          : { facingMode: { ideal: facing } },
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
    forVideoCapture: false,
    previousStream,
  });
}

/** Prefer this for Video mode — smaller frames for upload reliability. */
export async function openVideoCaptureStreamWithFallback(
  facingMode = "environment",
  previousStream = null
) {
  return openMediaStreamForFacing({
    facingMode,
    withAudio: false,
    forVideoCapture: true,
    previousStream,
  });
}

export async function openVideoStreamWithFallback(facingMode = "environment", previousStream = null) {
  return openMediaStreamForFacing({
    facingMode,
    withAudio: true,
    forVideoCapture: true,
    previousStream,
  });
}
