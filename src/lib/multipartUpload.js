/**
 * Multipart upload helpers — XHR for progress, diagnostic network errors.
 * Used by diner/guest video posts (cellular-friendly).
 */

export const VIDEO_UPLOAD_TIMEOUT_FLOOR_MS = 5 * 60 * 1000;
export const VIDEO_UPLOAD_TIMEOUT_CAP_MS = 15 * 60 * 1000;
/** Pad for sync BE H.264 normalize still inside the HTTP request. */
const NORMALIZE_PAD_MS = 3 * 60 * 1000;
/** Weak-cellular budget (~80 KB/s) for timeout sizing only — not a speed guarantee. */
const WEAK_CELLULAR_BYTES_PER_SEC = 80 * 1024;

export function videoUploadTimeoutMs(fileSizeBytes) {
  const size = Math.max(0, Number(fileSizeBytes) || 0);
  const transferMs = size > 0 ? (size / WEAK_CELLULAR_BYTES_PER_SEC) * 1000 : 0;
  return Math.min(
    VIDEO_UPLOAD_TIMEOUT_CAP_MS,
    Math.max(VIDEO_UPLOAD_TIMEOUT_FLOOR_MS, Math.ceil(transferMs + NORMALIZE_PAD_MS))
  );
}

export function isLikelyVideoUploadFile(file) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  return type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(name);
}

/**
 * Map XHR/fetch failures to actionable copy. Preserves HTTP Error objects with status.
 */
export function mapMultipartUploadNetworkError(err, { isVideo = false, timedOutByClient = false } = {}) {
  if (err && typeof err === "object" && Number(err.status) > 0) {
    return err instanceof Error ? err : new Error(String(err.message || "Upload failed"));
  }

  const name = String(err?.name || "");
  const msg = String(err?.message || "");
  const code = String(err?.code || "");

  if (timedOutByClient || code === "UPLOAD_CLIENT_TIMEOUT" || name === "AbortError") {
    return new Error(
      isVideo
        ? "Upload is taking too long on this connection. Stay on this screen and retry — preferably on Wi‑Fi. This is not a length limit."
        : "Upload timed out. Stay on this screen and try again."
    );
  }

  if (code === "UPLOAD_OFFLINE" || (typeof navigator !== "undefined" && navigator.onLine === false)) {
    return new Error(
      isVideo
        ? "You appear offline. Reconnect and stay on this screen while the video uploads. This is not a length limit."
        : "You appear offline. Reconnect and try again."
    );
  }

  if (
    code === "UPLOAD_NETWORK" ||
    /failed to fetch|networkerror|load failed|network request failed|err_network/i.test(msg)
  ) {
    return new Error(
      isVideo
        ? "Connection interrupted during upload (common on weak cellular). Stay on this screen and retry — Wi‑Fi is more reliable. This is not a length limit."
        : "Upload interrupted. Check your connection and try again."
    );
  }

  return err instanceof Error ? err : new Error(msg || "Upload failed");
}

function attachUploadProgress(xhr, onProgress) {
  xhr.upload.onprogress = (event) => {
    if (typeof onProgress !== "function") return;
    const total = Number(event.total) || 0;
    const loaded = Number(event.loaded) || 0;
    const percent =
      event.lengthComputable && total > 0
        ? Math.min(99, Math.max(0, Math.round((loaded / total) * 100)))
        : loaded > 0
          ? 50
          : 0;
    onProgress({ percent, loaded, total });
  };
}

/**
 * PUT a blob/file to a signed URL (direct-to-Supabase). Progress via XHR.
 */
export function putBlobWithProgress({
  url,
  blob,
  headers = {},
  timeoutMs = VIDEO_UPLOAD_TIMEOUT_FLOOR_MS,
  onProgress,
} = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const offline = new Error("offline");
      offline.code = "UPLOAD_OFFLINE";
      reject(offline);
      return;
    }
    if (!url || !blob) {
      reject(new Error("Missing signed upload url or file"));
      return;
    }

    const xhr = new XMLHttpRequest();
    let timedOutByClient = false;
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      if (err && typeof err === "object") {
        err.timedOutByClient = timedOutByClient;
      }
      reject(err);
    };

    const ok = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    xhr.open("PUT", url, true);
    xhr.timeout = Math.max(1000, Number(timeoutMs) || VIDEO_UPLOAD_TIMEOUT_FLOOR_MS);

    Object.entries(headers || {}).forEach(([key, value]) => {
      if (value == null) return;
      xhr.setRequestHeader(key, String(value));
    });

    attachUploadProgress(xhr, onProgress);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (typeof onProgress === "function") {
          onProgress({ percent: 100, loaded: 1, total: 1 });
        }
        ok({ ok: true, status: xhr.status });
        return;
      }
      const error = new Error(`Direct storage upload failed (${xhr.status})`);
      error.status = xhr.status;
      error.code = "DIRECT_UPLOAD_HTTP";
      fail(error);
    };

    xhr.onerror = () => {
      const err = new Error("network");
      err.code =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? "UPLOAD_OFFLINE"
          : "UPLOAD_NETWORK";
      fail(err);
    };

    xhr.ontimeout = () => {
      timedOutByClient = true;
      const err = new Error("timeout");
      err.name = "AbortError";
      err.code = "UPLOAD_CLIENT_TIMEOUT";
      fail(err);
    };

    xhr.onabort = () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      err.code = timedOutByClient ? "UPLOAD_CLIENT_TIMEOUT" : "UPLOAD_ABORTED";
      fail(err);
    };

    try {
      xhr.send(blob);
    } catch (err) {
      fail(err);
    }
  });
}

/**
 * POST multipart with upload progress. Prefer XHR — fetch has no upload progress.
 */
export function postMultipartWithProgress({
  url,
  formData,
  headers = {},
  timeoutMs = VIDEO_UPLOAD_TIMEOUT_FLOOR_MS,
  credentials = "include",
  onProgress,
} = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const offline = new Error("offline");
      offline.code = "UPLOAD_OFFLINE";
      reject(offline);
      return;
    }

    const xhr = new XMLHttpRequest();
    let timedOutByClient = false;
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      if (err && typeof err === "object") {
        err.timedOutByClient = timedOutByClient;
      }
      reject(err);
    };

    const ok = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    xhr.open("POST", url, true);
    xhr.withCredentials = credentials === "include" || credentials === "same-origin";
    xhr.timeout = Math.max(1000, Number(timeoutMs) || VIDEO_UPLOAD_TIMEOUT_FLOOR_MS);

    Object.entries(headers || {}).forEach(([key, value]) => {
      if (value == null || key.toLowerCase() === "content-type") return;
      xhr.setRequestHeader(key, String(value));
    });

    attachUploadProgress(xhr, onProgress);

    xhr.onload = () => {
      let json = {};
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        json = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (typeof onProgress === "function") {
          onProgress({ percent: 100, loaded: 1, total: 1 });
        }
        ok(json);
        return;
      }
      const error = new Error(json.error || json.message || `Upload failed (${xhr.status})`);
      error.status = xhr.status;
      error.payload = json;
      fail(error);
    };

    xhr.onerror = () => {
      const err = new Error("network");
      err.code =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? "UPLOAD_OFFLINE"
          : "UPLOAD_NETWORK";
      fail(err);
    };

    xhr.ontimeout = () => {
      timedOutByClient = true;
      const err = new Error("timeout");
      err.name = "AbortError";
      err.code = "UPLOAD_CLIENT_TIMEOUT";
      fail(err);
    };

    xhr.onabort = () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      err.code = timedOutByClient ? "UPLOAD_CLIENT_TIMEOUT" : "UPLOAD_ABORTED";
      fail(err);
    };

    try {
      xhr.send(formData);
    } catch (err) {
      fail(err);
    }
  });
}
