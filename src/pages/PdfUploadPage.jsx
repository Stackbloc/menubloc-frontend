import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { DESIGN_STYLES } from "../services/designEngine.js";
import { BrandLockup } from "../components/BrandLogo.jsx";
import {
  RESTAURANT_SIGNUP_RESTART_ROUTE,
  navigateWithRestaurantOnboardingState,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../lib/restaurantOnboardingState.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

const s = {
  page: {
    maxWidth: 620,
    margin: "0 auto",
    padding: "36px 20px 80px",
    fontFamily: FONT,
    color: "#111",
  },
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 36,
    fontSize: 11,
    fontWeight: 600,
    flexWrap: "wrap",
    rowGap: 8,
  },
  step: (active, done) => ({
    padding: "4px 10px",
    borderRadius: 999,
    background: done ? "#111" : active ? "#f0f0f5" : "transparent",
    color: done ? "#fff" : active ? "#111" : "#aaa",
    border: active ? "1.5px solid #111" : "1.5px solid transparent",
    whiteSpace: "nowrap",
    fontSize: 11,
  }),
  stepDivider: { flex: "0 0 12px", height: 1, background: "#e0e0e0", margin: "0 2px" },
  heading: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  subheading: { fontSize: 14, color: "#666", marginBottom: 28, lineHeight: 1.5 },
  contextCard: {
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 24,
    background: "#fafafa",
    fontSize: 13,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  contextItem: { color: "#555" },
  contextLabel: { fontWeight: 700, color: "#111", marginRight: 4 },
  planBadge: (plan) => ({
    display: "inline-block",
    fontSize: 11,
    fontWeight: 800,
    background: plan === "pro" ? "#1a56db" : "#111",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 10px",
    textTransform: "capitalize",
  }),
  designBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    background: "#f0f0f5",
    color: "#333",
    borderRadius: 999,
    padding: "2px 10px",
  },
  designDot: (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  dropZone: (isDragOver, hasFile, hasError) => ({
    border: `2px dashed ${hasError ? "#c00" : isDragOver ? "#111" : hasFile ? "#2a7a2a" : "#ccc"}`,
    borderRadius: 16,
    padding: "36px 24px",
    textAlign: "center",
    cursor: "pointer",
    background: isDragOver ? "#f5f5f5" : hasFile ? "#f0fbf0" : "#fafafa",
    transition: "border-color 0.15s, background 0.15s",
    marginBottom: 20,
    userSelect: "none",
  }),
  dropIcon: { fontSize: 36, marginBottom: 10, lineHeight: 1 },
  dropTitle: { fontSize: 15, fontWeight: 700, marginBottom: 6 },
  dropSub: { fontSize: 13, color: "#666", lineHeight: 1.5 },
  dropHint: { fontSize: 12, color: "#999", marginTop: 8 },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "#f0fbf0",
    border: "1px solid #b2dfb2",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
  },
  fileName: { fontWeight: 700, flex: 1, wordBreak: "break-all" },
  fileSize: { color: "#555", flexShrink: 0 },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: "#888",
    lineHeight: 1,
    padding: 0,
    flexShrink: 0,
  },
  submitBtn: (disabled) => ({
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: 0,
    background: disabled ? "#ccc" : "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: FONT,
  }),
  error: {
    padding: "12px 16px",
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    fontSize: 13,
    color: "#c00",
    marginBottom: 16,
    lineHeight: 1.5,
  },
  progress: {
    padding: "14px 16px",
    background: "#f0f7ff",
    border: "1px solid #c2d9f0",
    borderRadius: 10,
    fontSize: 13,
    color: "#2563a8",
    marginBottom: 16,
    fontWeight: 600,
  },
  successBox: {
    border: "2px solid #2a7a2a",
    borderRadius: 16,
    padding: "32px 28px",
    textAlign: "center",
    background: "#f0fbf0",
    marginBottom: 24,
  },
  successIcon: { fontSize: 48, marginBottom: 12, lineHeight: 1 },
  successTitle: { fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#1a5c1a" },
  successSub: {
    fontSize: 14,
    color: "#444",
    marginBottom: 24,
    lineHeight: 1.6,
    maxWidth: 420,
    margin: "0 auto 24px",
  },
  profileLink: {
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: 12,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
  },
  pendingNote: {
    marginTop: 16,
    fontSize: 12,
    color: "#777",
    lineHeight: 1.5,
  },
  designBanner: (hasStyle) => ({
    border: hasStyle ? "1.5px solid #e0e0e0" : "1.5px dashed #ccc",
    borderRadius: 14,
    padding: "20px 22px",
    background: hasStyle ? "#fafafa" : "#fff",
    display: "flex",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  }),
  designBannerIcon: { fontSize: 28, flexShrink: 0 },
  designBannerText: { flex: 1 },
  designBannerTitle: { fontSize: 15, fontWeight: 800, marginBottom: 4 },
  designBannerDesc: { fontSize: 13, color: "#555", lineHeight: 1.5 },
  designBannerLink: {
    display: "inline-block",
    marginTop: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#111",
    textDecoration: "underline",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: FONT,
  },
  restartBtn: {
    display: "inline-flex",
    marginTop: 14,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  },
};

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfFile(file) {
  if (!file) return false;
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(file) {
  return Boolean(file?.type?.startsWith("image/"));
}

async function loadImageElement(file) {
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => reject(new Error("Could not read this image. Try a JPG, PNG, or a PDF instead."));
    image.src = objectUrl;
  });
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function buildSingleImagePdfBlob(jpegBytes, width, height) {
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let length = 0;

  function pushText(text) {
    const bytes = encoder.encode(text);
    parts.push(bytes);
    length += bytes.length;
  }

  function pushBytes(bytes) {
    parts.push(bytes);
    length += bytes.length;
  }

  pushText("%PDF-1.3\n");

  offsets[1] = length;
  pushText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  offsets[2] = length;
  pushText("2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n");

  offsets[3] = length;
  pushText(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  offsets[4] = length;
  pushText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushText("\nendstream\nendobj\n");

  const contents = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets[5] = length;
  pushText(`5 0 obj\n<< /Length ${contents.length} >>\nstream\n${contents}endstream\nendobj\n`);

  const xrefOffset = length;
  pushText("xref\n0 6\n0000000000 65535 f \n");
  for (let index = 1; index <= 5; index += 1) {
    pushText(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: "application/pdf" });
}

async function convertImageFileToPdf(file) {
  const { image, objectUrl } = await loadImageElement(file);

  try {
    const maxDimension = 2200;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare your image for upload on this device.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = jpegDataUrl.split(",")[1];
    if (!base64) {
      throw new Error("Could not prepare your image for upload.");
    }

    const jpegBytes = base64ToUint8Array(base64);
    const pdfBlob = buildSingleImagePdfBlob(jpegBytes, width, height);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "menu-scan";

    return new File([pdfBlob], `${baseName}.pdf`, {
      type: "application/pdf",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function PdfUploadPage() {
  const location = useLocation();
  const nav = useNavigate();
  const recovery = useMemo(
    () => resolveRestaurantOnboardingState({ routeState: location.state, search: location.search }),
    [location.state, location.search]
  );

  useEffect(() => {
    if (recovery.hasAnyData) {
      persistRestaurantOnboardingState(recovery.state);
    }
  }, [recovery]);

  const state = recovery.state || {};
  const {
    restaurant_id,
    restaurant_name = "Your restaurant",
    email = "",
    owner_token = "",
    plan = "",
    design_style = null,
    ingestion_method = "pdf",
  } = state;

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [result, setResult] = useState(null);

  const missingState = recovery.missing;
  const chosenStyle = design_style
    ? DESIGN_STYLES.find((entry) => entry.id === design_style) || null
    : null;
  const isOcrFlow = ingestion_method === "ocr";
  const accept = isOcrFlow ? "image/*,application/pdf,.pdf" : "application/pdf,.pdf";

  function validateAndSetFile(chosen) {
    setFileError("");
    setUploadErr("");
    if (!chosen) return;

    const allowed = isPdfFile(chosen) || (isOcrFlow && isImageFile(chosen));
    if (!allowed) {
      setFileError(
        isOcrFlow
          ? "Choose a menu PDF or a phone photo of the menu."
          : "Only PDF files are accepted."
      );
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      setFileError(`File is too large (${formatBytes(chosen.size)}). Maximum is 20 MB.`);
      return;
    }
    setFile(chosen);
  }

  function onDragOver(event) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function onDragLeave() {
    setIsDragOver(false);
  }

  function onDrop(event) {
    event.preventDefault();
    setIsDragOver(false);
    validateAndSetFile(event.dataTransfer.files?.[0] || null);
  }

  function onDropZoneClick() {
    fileInputRef.current?.click();
  }

  function onFileChange(event) {
    validateAndSetFile(event.target.files?.[0] || null);
    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setUploadErr("");
    setFileError("");

    if (!file) {
      setFileError(isOcrFlow ? "Please take a menu photo or choose a PDF." : "Please select a PDF file to upload.");
      return;
    }

    setUploading(true);

    try {
      const uploadFile = isOcrFlow && isImageFile(file)
        ? await convertImageFileToPdf(file)
        : file;

      if (uploadFile.size > MAX_FILE_BYTES) {
        throw new Error(`Prepared upload is too large (${formatBytes(uploadFile.size)}). Try a closer crop or a smaller PDF.`);
      }

      const formData = new FormData();
      formData.append("file", uploadFile, uploadFile.name);
      formData.append("restaurant_id", String(restaurant_id));
      formData.append("email", email);
      formData.append("owner_token", owner_token);
      if (plan) formData.append("plan", plan);

      const res = await fetch(`${API}/menu-upload/pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }

      setResult(data);
    } catch (error) {
      const raw = error.message || "";
      const isFetchError = /failed to fetch|networkerror|load failed/i.test(raw);
      setUploadErr(
        isFetchError
          ? "Your menu failed to upload. Make sure the file is a clear menu PDF or photo and try again."
          : raw || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  if (missingState) {
    return (
      <div style={s.page}>
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />
        <div style={{ ...s.error, marginTop: 24 }}>
          <strong>We could not recover your restaurant signup session.</strong><br />
          Restart signup to reconnect this upload to your restaurant.
          <br />
          <Link to={RESTAURANT_SIGNUP_RESTART_ROUTE} style={s.restartBtn}>
            Restart restaurant signup
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div style={s.page}>
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />

        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          <div style={s.successTitle}>Menu uploaded successfully</div>
          <p style={s.successSub}>
            Your menu file has been received and is being processed. Once approved, your
            menu will appear on your Menuply profile.
          </p>
          <Link to={`/restaurant-profile/${restaurant_id}`} style={s.profileLink}>
            Go to your restaurant profile
          </Link>
          <div style={s.pendingNote}>
            {result.pages > 0 && `${result.pages}-page PDF · `}
            {result.text_length > 0 && `${result.text_length.toLocaleString()} characters extracted · `}
            Menu status: <strong>pending review</strong>
          </div>
        </div>

        {chosenStyle ? (
          <div style={s.designBanner(true)}>
            <div style={s.designBannerIcon}>🎨</div>
            <div style={s.designBannerText}>
              <div style={s.designBannerTitle}>
                Design style selected: {chosenStyle.name}
              </div>
              <div style={s.designBannerDesc}>
                {chosenStyle.tagline}. Your menu will be styled and ready once it is approved and published.
              </div>
            </div>
          </div>
        ) : (
          <div style={s.designBanner(false)}>
            <div style={s.designBannerIcon}>✦</div>
            <div style={s.designBannerText}>
              <div style={s.designBannerTitle}>Make your menu look beautiful</div>
              <div style={s.designBannerDesc}>
                You skipped the design step. Choose a style anytime to give your menu a polished, professional look.
              </div>
              <button
                style={s.designBannerLink}
                onClick={() =>
                  navigateWithRestaurantOnboardingState(nav, "/restaurant/design-select", {
                    ...state,
                    ingestion_method,
                  })
                }
              >
                Choose a design style →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const submitDisabled = uploading || !!fileError || !file;

  return (
    <div style={s.page}>
      <BrandLockup
        subtitle="for Restaurants"
        logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
      />

      <div style={s.steps}>
        <div style={s.step(false, true)}>1. Account</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>2. Choose plan</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>3. Design</div>
        <div style={s.stepDivider} />
        <div style={s.step(true, false)}>4. Upload menu</div>
      </div>

      <div style={s.heading}>{isOcrFlow ? "Take a menu photo or upload a scan" : "Upload your menu PDF"}</div>
      <div style={s.subheading}>
        {isOcrFlow
          ? "Mobile-first OCR upload. Use your phone camera for a menu photo, or upload a menu PDF if you already have one."
          : "Upload a PDF of your menu and we will extract and structure it automatically."}
      </div>

      <div style={s.contextCard}>
        <span style={s.contextItem}>
          <span style={s.contextLabel}>Restaurant</span>
          {restaurant_name}
        </span>
        {plan ? <span style={s.planBadge(plan)}>{plan}</span> : null}
        {chosenStyle ? (
          <span style={s.designBadge}>
            <span style={s.designDot(chosenStyle.preview.accent)} />
            {chosenStyle.name}
          </span>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div
          style={s.dropZone(isDragOver, !!file, !!fileError)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onDropZoneClick}
          role="button"
          tabIndex={0}
          aria-label={isOcrFlow ? "Tap to take a photo or choose a menu PDF" : "Click or drag to upload PDF"}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onDropZoneClick();
            }
          }}
        >
          <div style={s.dropIcon}>{isOcrFlow ? "📷" : "📄"}</div>
          <div style={s.dropTitle}>
            {isOcrFlow ? "Tap to take a photo or choose a menu PDF" : "Click or drag to upload your menu PDF"}
          </div>
          <div style={s.dropSub}>
            {isOcrFlow
              ? "On phones, the camera will open when supported. We convert photos to a PDF before upload so they stay attached to this restaurant signup."
              : "Select a PDF from your device or drag it into this box to begin the upload."}
          </div>
          <div style={s.dropHint}>
            {isOcrFlow ? "Accepted: phone photos, PNG/JPG, or PDF" : "Accepted format: PDF only · Max file size: 20 MB"}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            capture={isOcrFlow ? "environment" : undefined}
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </div>

        {file ? (
          <div style={s.fileInfo}>
            <span style={s.fileName}>{file.name}</span>
            <span style={s.fileSize}>{formatBytes(file.size)}</span>
            <button type="button" style={s.clearBtn} onClick={() => setFile(null)} aria-label="Clear selected file">
              ×
            </button>
          </div>
        ) : null}

        {fileError ? <div style={s.error}>{fileError}</div> : null}
        {uploadErr ? <div style={s.error}>{uploadErr}</div> : null}
        {uploading ? (
          <div style={s.progress}>
            {isOcrFlow && isImageFile(file)
              ? "Preparing your photo for upload and sending it now..."
              : "Uploading and processing your menu. This may take a few moments…"}
          </div>
        ) : null}

        <button type="submit" style={s.submitBtn(submitDisabled)} disabled={submitDisabled}>
          {uploading ? "Uploading..." : isOcrFlow ? "Upload menu photo or PDF" : "Upload PDF"}
        </button>
      </form>
    </div>
  );
}
