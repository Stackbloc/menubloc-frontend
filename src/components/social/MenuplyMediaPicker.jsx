/**
 * Camera icon → ConsumerCameraSheet (Video | Photo when allowVideo; defaults to Video).
 * Library via source="library" (file picker without capture).
 * Diner avatar should pass allowVideo={false}.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import ConsumerCameraSheet from "../consumer/ConsumerCameraSheet.jsx";
import NativeVideoCapture from "../consumer/NativeVideoCapture.jsx";
import {
  capturePosterFromVideoElement,
  inlineCameraSupported,
  preferInlineCamera,
  withVideoPreviewSeek,
} from "../../lib/consumerCameraCapture.js";
import { isVideoFile } from "../../lib/eatingMediaUtils.js";
import { socialBtn } from "../../lib/socialDesignTokens.js";

function buildAccept({ allowPhoto, allowVideo }) {
  if (allowPhoto && allowVideo) return "image/*,video/*";
  if (allowVideo) return "video/*";
  return "image/*";
}

function captureAttr(facingMode) {
  if (facingMode === "user") return "user";
  return "environment";
}

export default function MenuplyMediaPicker({
  onFile,
  file = null,
  onClear,
  disabled = false,
  facingMode = "environment",
  allowPhoto = true,
  allowVideo = true,
  /** "camera" = live photo sheet (+ video mode when allowVideo); "library" = files without capture */
  source = "camera",
  testId = "menuply-media-picker",
  ariaLabel = "Add photo or video",
  showPreview = true,
  iconStyle,
  renderTrigger = null,
  openOnMount = false,
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  /** Prefer Video when allowVideo so chips open Video | Photo. */
  const defaultCameraMode = allowVideo ? "video" : "photo";
  const [sheetInitialMode, setSheetInitialMode] = useState(defaultCameraMode);
  const inputRef = useRef(null);
  const useLibrary = source === "library";
  const canInlineSheet =
    !useLibrary && allowPhoto && inlineCameraSupported() && preferInlineCamera();

  const accept = useMemo(
    () => buildAccept({ allowPhoto, allowVideo }),
    [allowPhoto, allowVideo]
  );

  function openLibraryFallback() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function openCameraSheet(initialMode = defaultCameraMode) {
    if (disabled) return;
    if (useLibrary) {
      openLibraryFallback();
      return;
    }
    if (canInlineSheet) {
      const next =
        allowVideo && initialMode === "photo"
          ? "photo"
          : allowVideo
            ? "video"
            : "photo";
      setSheetInitialMode(next);
      setSheetOpen(true);
      return;
    }
    openLibraryFallback();
  }

  useEffect(() => {
    if (openOnMount && !disabled && !file) {
      if (canInlineSheet && allowPhoto) openCameraSheet(defaultCameraMode);
      else if (allowVideo && !useLibrary && !allowPhoto) {
        /* video-only surfaces use NativeVideoCapture trigger */
      } else if (allowPhoto) openCameraSheet("photo");
      else openLibraryFallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once on mount when requested
  }, [openOnMount, disabled, file]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handlePick(event) {
    const picked = event.target.files?.[0] || null;
    event.target.value = "";
    if (picked) onFile?.(picked);
  }

  const isVideo = isVideoFile(file);
  const [composePoster, setComposePoster] = useState("");

  useEffect(() => {
    setComposePoster("");
    if (!isVideo || !previewUrl || typeof document === "undefined") return undefined;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = withVideoPreviewSeek(previewUrl);
    const capture = () => {
      const dataUrl = capturePosterFromVideoElement(video);
      if (dataUrl) setComposePoster(dataUrl);
    };
    video.onloadeddata = () => {
      try {
        video.currentTime = 0.1;
      } catch {
        capture();
      }
    };
    video.onseeked = capture;
    video.onerror = () => setComposePoster("");
    return () => {
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [isVideo, previewUrl]);

  /** One camera control opens the sheet (Photo | Video inside). No separate Record video row. */
  const showUnifiedCamera = canInlineSheet;
  const showVideoOnlyNative = !useLibrary && allowVideo && !allowPhoto;

  return (
    <div data-testid={testId} style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}>
      {showPreview && file && previewUrl ? (
        <div style={previewStyles.wrap} data-testid={`${testId}-preview`}>
          {isVideo ? (
            composePoster ? (
              <img
                src={composePoster}
                alt=""
                style={previewStyles.media}
                data-testid={`${testId}-video-poster`}
              />
            ) : (
              /* Never use native controls — Chrome’s control bar includes Download (file prompt). */
              <video
                key={previewUrl}
                src={previewUrl}
                style={previewStyles.media}
                controls={false}
                playsInline
                muted
                preload="metadata"
                onLoadedData={(e) => {
                  const el = e.currentTarget;
                  try {
                    if (el.duration && Number.isFinite(el.duration)) {
                      el.currentTime = Math.min(0.1, el.duration * 0.05);
                    }
                  } catch {
                    /* ignore */
                  }
                  const dataUrl = capturePosterFromVideoElement(el);
                  if (dataUrl) setComposePoster(dataUrl);
                }}
                onError={() => {
                  /* HEVC etc. — keep "Video ready" caption; poster may stay empty */
                }}
              />
            )
          ) : (
            <img src={previewUrl} alt="" style={previewStyles.media} />
          )}
          <p style={previewStyles.caption}>
            {isVideo
              ? `Video ready · ${(file.size / 1024).toFixed(0)} KB`
              : "Photo ready"}
          </p>
          <div style={previewStyles.actions}>
            {allowPhoto ? (
              <button
                type="button"
                style={previewStyles.link}
                disabled={disabled}
                onClick={() => openCameraSheet("photo")}
              >
                Replace photo
              </button>
            ) : null}
            {allowVideo ? (
              canInlineSheet ? (
                <button
                  type="button"
                  style={previewStyles.link}
                  disabled={disabled}
                  onClick={() => openCameraSheet("video")}
                  data-testid={`${testId}-replace-video`}
                >
                  Replace video
                </button>
              ) : (
                <NativeVideoCapture
                  compact
                  disabled={disabled}
                  facingMode={facingMode}
                  testId={`${testId}-replace-video`}
                  buttonLabel="Replace video"
                  onFile={(next) => onFile?.(next)}
                />
              )
            ) : null}
            <button
              type="button"
              style={previewStyles.link}
              disabled={disabled}
              onClick={() => onClear?.()}
            >
              Remove
            </button>
          </div>
        </div>
      ) : renderTrigger ? (
        renderTrigger({ open: () => openCameraSheet(defaultCameraMode), disabled })
      ) : showUnifiedCamera ? (
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => openCameraSheet(defaultCameraMode)}
          style={{ ...socialBtn.icon, ...iconStyle }}
          data-testid={`${testId}-trigger`}
        >
          <CameraIcon />
        </button>
      ) : showVideoOnlyNative ? (
        <NativeVideoCapture
          disabled={disabled}
          facingMode={facingMode}
          testId={`${testId}-video`}
          onFile={(next) => onFile?.(next)}
        />
      ) : (
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => openCameraSheet(defaultCameraMode)}
          style={{ ...socialBtn.icon, ...iconStyle }}
          data-testid={`${testId}-trigger`}
        >
          <CameraIcon />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={useLibrary ? accept : allowVideo && !canInlineSheet ? accept : "image/*"}
        {...(useLibrary
          ? {}
          : allowPhoto && !canInlineSheet
            ? { capture: captureAttr(facingMode) }
            : {})}
        hidden
        disabled={disabled}
        data-testid={useLibrary ? `${testId}-library-input` : `${testId}-camera-input`}
        onChange={handlePick}
      />

      {canInlineSheet ? (
        <ConsumerCameraSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          facingMode={facingMode}
          allowVideo={allowVideo}
          initialMode={sheetInitialMode}
          onCapture={(captured) => {
            if (captured) onFile?.(captured);
            setSheetOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5L9 4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

const previewStyles = {
  wrap: { display: "flex", flexDirection: "column", gap: 8, maxWidth: "100%" },
  media: {
    width: "100%",
    maxWidth: 320,
    height: 180,
    objectFit: "cover",
    borderRadius: 12,
    background: "#0f172a",
    display: "block",
  },
  caption: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" },
  link: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
};
