import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { DESIGN_STYLES } from "../services/designEngine.js";
import { BrandLockup } from "../components/BrandLogo.jsx";
import OperatorLayout from "./operator/OperatorLayout.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  RESTAURANT_SIGNUP_RESTART_ROUTE,
  navigateWithRestaurantOnboardingState,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../lib/restaurantOnboardingState.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

/** OCR from menu-page images — page capture is fast; menu reading happens once on Finish. */
const OCR_PHASE_COPY = {
  uploading_photo: { title: "Saving page…", sub: "Sending your menu image securely." },
  processing: {
    title: "Reading your menu…",
    sub: "We're reading every page now. This usually takes about 8–15 seconds per page.",
  },
  finalizing: { title: "Finalizing your menu…", sub: "Saving items for review." },
};

const OCR_PHASE_STEP = {
  uploading_photo: null,
  processing: null,
  finalizing: null,
};

function formatOcrFlowError(rawMessage, httpStatus) {
  const msg = String(rawMessage || "").trim();
  const status = Number(httpStatus) || 0;
  const lower = msg.toLowerCase();

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (status === 408 || status === 504 || /timeout|timed out/i.test(lower)) {
    return "This is taking too long. Try again with a smaller photo or a stronger signal.";
  }
  if (status === 413 || /too large|payload/i.test(lower)) {
    return "That file is too large to upload. Try a smaller photo.";
  }
  if (
    /could not parse menu items|could not parse|menu items were saved|parse menu/i.test(lower) ||
    /structuring|normalized from/i.test(lower)
  ) {
    return msg || "We could not turn this menu into items. Try a clearer photo.";
  }
  if (/extracted text|no menu-like|readable menu|does not look like a readable/i.test(lower)) {
    return msg || "We could not read menu text in this photo. Try better lighting or a closer shot.";
  }
  if (status === 422) {
    return msg || "This upload could not be processed. Try another photo.";
  }
  if (status >= 500 || /ocr|ingestion|adobe|extraction failed/i.test(lower)) {
    return msg || "Menu reading failed on our side. Please try again in a moment.";
  }
  if (status === 401 || status === 403) {
    return msg || "Your session is no longer valid. Restart signup and try again.";
  }
  return msg || "Something went wrong. Please try again.";
}

function OcrProgressSpinner() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="#e8e8e8" strokeWidth="2.5" fill="none" />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.75s"
          repeatCount="indefinite"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#111"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="47 63"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function CompletionNextSteps({ isOperatorFlow, restaurantId }) {
  return (
    <div style={s.nextStepsBox}>
      <div style={s.nextStepsTitle}>What happens next</div>
      <p style={s.nextStepsCopy}>
        Your upload is saved and pending review. Use My Account to return to menu management and continue your
        restaurant setup from the operational side.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Link to={isOperatorFlow ? "/operator/menu" : "/operator/login"} style={s.profileLink}>
          {isOperatorFlow ? "Open My Account" : "Sign in to My Account"}
        </Link>
        {!isOperatorFlow ? (
          <Link to={`/restaurant-profile/${restaurantId}`} style={s.secondaryAction}>
            View restaurant profile
          </Link>
        ) : null}
      </div>
    </div>
  );
}

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
  ocrProgressCard: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: "16px 18px",
    minHeight: 72,
    background: "#f6f8fc",
    border: "1px solid #c5d4eb",
    borderRadius: 12,
    marginBottom: 18,
    boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
  },
  ocrProgressText: {
    flex: 1,
    minWidth: 0,
  },
  ocrProgressTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
    lineHeight: 1.35,
  },
  ocrProgressSub: {
    fontSize: 13,
    color: "#5a6578",
    lineHeight: 1.45,
  },
  ocrProgressMeta: {
    fontSize: 11,
    fontWeight: 600,
    color: "#2563a8",
    marginTop: 8,
    letterSpacing: "0.02em",
  },
  dropZoneDisabled: {
    opacity: 0.72,
    pointerEvents: "none",
    cursor: "default",
  },
  infoStepCard: {
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    padding: "18px 18px 20px",
    marginBottom: 20,
    background: "#fafafa",
  },
  infoStepBadge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#475569",
    background: "#eef2f7",
    border: "1px solid #dbe2ec",
    borderRadius: 999,
    padding: "2px 10px",
    marginBottom: 10,
  },
  infoStepTitle: { fontSize: 15, fontWeight: 800, marginBottom: 6, color: "#111" },
  infoStepBody: { fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 14 },
  infoStepActions: { display: "grid", gap: 8 },
  infoStepPrimary: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1.5px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: FONT,
  },
  infoStepSecondary: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1.5px solid #cbd5e1",
    background: "#fff",
    color: "#111",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: FONT,
  },
  infoStepHint: { fontSize: 12, color: "#94a3b8", marginTop: 8, lineHeight: 1.5 },
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
  secondaryAction: {
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: 12,
    background: "#fff",
    color: "#111",
    border: "1px solid #d0d5dd",
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
  nextStepsBox: {
    marginTop: 18,
    padding: "14px 16px",
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #dbe4ee",
    textAlign: "left",
  },
  nextStepsTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#101828",
    marginBottom: 8,
  },
  nextStepsCopy: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#475467",
    margin: 0,
  },
  ingestionReviewHint: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 10,
    background: "#f4f6fb",
    border: "1px solid #dde3f0",
    fontSize: 13,
    color: "#3d4d63",
    lineHeight: 1.55,
    maxWidth: 520,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "left",
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

function buildPreviewUrl(file) {
  return URL.createObjectURL(file);
}

export default function PdfUploadPage() {
  const location = useLocation();
  const nav = useNavigate();
  const { selectedRestaurant, operator } = useOperator();
  const isOperatorFlow = location.pathname.startsWith("/operator/");
  const recovery = useMemo(
    () => resolveRestaurantOnboardingState({ routeState: location.state, search: location.search }),
    [location.state, location.search]
  );

  useEffect(() => {
    if (!isOperatorFlow && recovery.hasAnyData) {
      persistRestaurantOnboardingState(recovery.state);
    }
  }, [isOperatorFlow, recovery]);

  const state = isOperatorFlow
    ? {
        restaurant_id: selectedRestaurant?.id || "",
        restaurant_name: selectedRestaurant?.restaurant_name || "Your restaurant",
        email: operator?.email || "",
        owner_token: "",
        plan: "",
        design_style: null,
        ingestion_method: location.pathname.endsWith("/photo") ? "ocr" : "pdf",
      }
    : (recovery.state || {});
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
  const restaurantInfoInputRef = useRef(null);
  /** Same as uploadSessionId state, updated synchronously so "Finish" never uses a stale empty id. */
  const uploadSessionIdRef = useRef("");
  const ocrTimerRefs = useRef([]);
  const ocrPageWorkRef = useRef(false);
  const [file, setFile] = useState(null);
  const [uploadSessionId, setUploadSessionId] = useState("");
  const [capturedPages, setCapturedPages] = useState([]);
  /**
   * Optional first step on the operator phone flow:
   *   null      – user has not chosen yet (show the choice block)
   *   "captured" – they took a restaurant_info photo
   *   "skipped"  – they confirmed their menu pages already include it
   */
  const [restaurantInfoChoice, setRestaurantInfoChoice] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [result, setResult] = useState(null);
  /** null = idle; otherwise staged OCR UX label key */
  const [ocrProgressPhase, setOcrProgressPhase] = useState(null);
  /** 1-based page index while a photo is being processed (consumer-facing progress). */
  const [ocrActivePageNumber, setOcrActivePageNumber] = useState(null);
  /** Per-page Finish processing progress (deferred Adobe ingestion). */
  const [finishProgress, setFinishProgress] = useState({ processed: 0, total: 0 });

  const missingState = isOperatorFlow ? !selectedRestaurant?.id : recovery.missing;
  const chosenStyle = design_style
    ? DESIGN_STYLES.find((entry) => entry.id === design_style) || null
    : null;
  const isOcrRoute =
    typeof location.pathname === "string" &&
    (location.pathname.endsWith("/ocr-upload") || location.pathname.endsWith("/operator/menu/upload/photo"));
  const isOcrFlow = ingestion_method === "ocr" || isOcrRoute;
  const accept = isOcrFlow ? "image/*" : "application/pdf,.pdf";

  function clearOcrPhaseTimers() {
    ocrTimerRefs.current.forEach((id) => clearTimeout(id));
    ocrTimerRefs.current = [];
  }

  useEffect(() => {
    return () => clearOcrPhaseTimers();
  }, []);

  function validateChosenFile(chosen) {
    setFileError("");
    setUploadErr("");
    if (!chosen) return { ok: false };

    const allowed = isOcrFlow ? isImageFile(chosen) : isPdfFile(chosen);
    if (!allowed) {
      const message = isOcrFlow
        ? "Choose a clear photo of the menu page (text and prices), not a dish photo."
        : "Only PDF files are accepted.";
      setFileError(message);
      return { ok: false };
    }
    if (chosen.size > MAX_FILE_BYTES) {
      const message = `File is too large (${formatBytes(chosen.size)}). Maximum is 20 MB.`;
      setFileError(message);
      return { ok: false };
    }
    return { ok: true };
  }

  async function ensureUploadSession() {
    if (uploadSessionIdRef.current) return uploadSessionIdRef.current;
    if (uploadSessionId) {
      uploadSessionIdRef.current = uploadSessionId;
      return uploadSessionId;
    }

    const formData = new FormData();
    formData.append("restaurant_id", String(restaurant_id));
    formData.append("email", email);
    formData.append("owner_token", owner_token);
    if (plan) formData.append("plan", plan);

    const res = await fetch(`${API}/uploads/menu-session/start`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `Session start failed (${res.status})`);
    }

    uploadSessionIdRef.current = data.upload_session_id;
    setUploadSessionId(data.upload_session_id);
    return data.upload_session_id;
  }

  async function uploadCapturedPage(imageFile, { pageRole = "menu_items" } = {}) {
    ocrPageWorkRef.current = true;
    clearOcrPhaseTimers();
    setUploadErr("");
    const pageIndex = capturedPages.length + 1;
    setOcrActivePageNumber(pageIndex);
    setOcrProgressPhase("uploading_photo");

    try {
      const sessionId = await ensureUploadSession();
      const pdfFile = await convertImageFileToPdf(imageFile);
      const nextPageNumber = capturedPages.length + 1;

      const formData = new FormData();
      formData.append("restaurant_id", String(restaurant_id));
      formData.append("email", email);
      formData.append("owner_token", owner_token);
      formData.append("page_number", String(nextPageNumber));
      formData.append("page_role", pageRole);
      formData.append("image_file", imageFile, imageFile.name);
      formData.append("pdf_file", pdfFile, pdfFile.name);

      const res = await fetch(`${API}/uploads/menu-session/${sessionId}/page`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const err = new Error(data?.error || `Page upload failed (${res.status})`);
        err.status = res.status;
        throw err;
      }

      setCapturedPages((pages) => [
        ...pages,
        {
          pageNumber: data.page_number,
          previewUrl: buildPreviewUrl(imageFile),
          imageUrl: data.image_url,
          ocrText: data.ocr_text || "",
          preview: data.preview || { captured: true, accepted: true },
          status: data.status,
          pageRole,
        },
      ]);
    } catch (error) {
      const status = error?.status ?? error?.cause?.status;
      setUploadErr(formatOcrFlowError(error?.message, status));
      throw error;
    } finally {
      ocrPageWorkRef.current = false;
      clearOcrPhaseTimers();
      setOcrProgressPhase(null);
      setOcrActivePageNumber(null);
    }
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
    const chosen = event.dataTransfer.files?.[0] || null;
    const validation = validateChosenFile(chosen);
    if (!validation.ok || !chosen) return;
    if (isOcrFlow && isImageFile(chosen)) {
      setUploading(true);
      uploadCapturedPage(chosen)
        .catch(() => {})
        .finally(() => setUploading(false));
      return;
    }
    setFile(chosen);
  }

  function onDropZoneClick() {
    fileInputRef.current?.click();
  }

  function onFileChange(event) {
    const chosen = event.target.files?.[0] || null;
    const validation = validateChosenFile(chosen);
    if (validation.ok && chosen) {
      if (isOcrFlow) {
        setUploading(true);
        uploadCapturedPage(chosen)
          .catch(() => {})
          .finally(() => setUploading(false));
      } else {
        setFile(chosen);
      }
    }
    event.target.value = "";
  }

  function onRestaurantInfoChange(event) {
    const chosen = event.target.files?.[0] || null;
    const validation = validateChosenFile(chosen);
    if (validation.ok && chosen) {
      setUploading(true);
      uploadCapturedPage(chosen, { pageRole: "restaurant_info" })
        .then(() => setRestaurantInfoChoice("captured"))
        .catch(() => {})
        .finally(() => setUploading(false));
    }
    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setUploadErr("");
    setFileError("");

    if (isOcrFlow && capturedPages.length > 0) {
      setUploading(true);
      setOcrProgressPhase("processing");
      setUploadErr("");
      setFinishProgress({ processed: 0, total: capturedPages.length });

      try {
        const sessionForFinish = String(uploadSessionIdRef.current || uploadSessionId || "").trim();
        if (!sessionForFinish) {
          throw new Error(
            "Upload session is not ready yet. Wait for the photo to finish processing, or capture another page."
          );
        }

        const formData = new FormData();
        formData.append("restaurant_id", String(restaurant_id));
        formData.append("email", email);
        formData.append("owner_token", owner_token);

        const startRes = await fetch(`${API}/uploads/menu-session/${sessionForFinish}/finish`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const startData = await startRes.json().catch(() => null);

        if (!startRes.ok || !startData?.ok) {
          const err = new Error(startData?.error || `Finish failed (${startRes.status})`);
          err.status = startRes.status;
          throw err;
        }

        if (startData.result) {
          const itemsSaved =
            (Number(startData.result.inserted_items) || 0) +
            (Number(startData.result.updated_items) || 0);
          if (itemsSaved <= 0) {
            throw new Error(
              "Upload finished but no imported menu items were saved. Try a clearer PDF, clearer menu photos, or contact support."
            );
          }
          setResult(startData.result);
          return;
        }

        if (Number(startData.total_pages) > 0) {
          setFinishProgress({ processed: 0, total: Number(startData.total_pages) });
        }

        const statusUrl = new URL(`${API}/uploads/menu-session/${sessionForFinish}/finish-status`);
        statusUrl.searchParams.set("restaurant_id", String(restaurant_id));
        statusUrl.searchParams.set("email", email);
        statusUrl.searchParams.set("owner_token", owner_token);

        let pollResult = null;
        const startedAt = Date.now();
        const maxWaitMs = 8 * 60 * 1000;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (Date.now() - startedAt > maxWaitMs) {
            throw new Error("Menu processing is taking longer than expected. Please refresh and try again.");
          }
          await new Promise((r) => setTimeout(r, 1500));
          const r = await fetch(statusUrl.toString(), { method: "GET", credentials: "include" });
          const j = await r.json().catch(() => null);
          if (!r.ok || !j?.ok) {
            const err = new Error(j?.error || `Status check failed (${r.status})`);
            err.status = r.status;
            throw err;
          }
          if (j.found) {
            if (typeof j.processed === "number" && typeof j.total === "number" && j.total > 0) {
              setFinishProgress({ processed: j.processed, total: j.total });
            }
            if (j.done) {
              if (j.error) {
                const err = new Error(j.error);
                throw err;
              }
              pollResult = j.result;
              break;
            }
          }
        }

        if (!pollResult) {
          throw new Error("Menu processing finished without a result. Please try again.");
        }

        const itemsSaved =
          (Number(pollResult.inserted_items) || 0) + (Number(pollResult.updated_items) || 0);
        if (itemsSaved <= 0) {
          throw new Error(
            "Upload finished but no imported menu items were saved. Try a clearer PDF, clearer menu photos, or contact support."
          );
        }

        setResult(pollResult);
        return;
      } catch (error) {
        const status = error?.status ?? error?.cause?.status;
        setUploadErr(formatOcrFlowError(error?.message, status));
      } finally {
        setOcrProgressPhase(null);
        setUploading(false);
      }
    }

    if (!file) {
      setFileError(isOcrFlow ? "Add at least one photo of a menu page (text and prices)." : "Please select a PDF file to upload.");
      return;
    }

    if (isOcrFlow) {
      setFileError("Use the camera flow for OCR uploads. This route now submits pages only through the upload session.");
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
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const err = new Error(data?.error || `Upload failed (${res.status})`);
        err.status = res.status;
        throw err;
      }

      setResult(data);
    } catch (error) {
      const raw = error.message || "";
      const status = error?.status;
      setUploadErr(formatOcrFlowError(raw, status));
    } finally {
      setUploading(false);
    }
  }

  if (missingState) {
    if (isOperatorFlow) {
      return (
        <OperatorLayout title="Upload Menu">
          <div style={{ ...s.error, marginTop: 8 }}>
            Select a restaurant from the operator sidebar to start a menu upload.
          </div>
        </OperatorLayout>
      );
    }
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
    if (isOperatorFlow) {
      return (
        <OperatorLayout title="Upload Menu">
          <div style={s.page}>
            <div style={s.successBox}>
              <div style={s.successIcon}>✓</div>
              {(() => {
                const pageCount = Number(result.page_count || result.pages || 0) || 0;
                const itemsProcessed =
                  (Number(result.inserted_items) || 0) + (Number(result.updated_items) || 0);
                const summaryParts = [];
                if (pageCount > 0) summaryParts.push(`${pageCount} page${pageCount === 1 ? "" : "s"}`);
                if (itemsProcessed > 0) {
                  summaryParts.push(`${itemsProcessed} menu item${itemsProcessed === 1 ? "" : "s"} successfully imported`);
                }
                const dash = summaryParts.length ? ` — ${summaryParts.join(", ")}` : "";
                return (
                  <>
                    <div style={s.successTitle}>{`Menu uploaded successfully${dash}.`}</div>
                    <p style={s.successSub}>
                      Your menu is being reviewed. Once approved, it will appear on your Menuply public profile.
                    </p>
                  </>
                );
              })()}
              <Link to="/operator/menu" style={s.profileLink}>
                Back to menu
              </Link>
              <CompletionNextSteps isOperatorFlow restaurantId={restaurant_id} />
            </div>
          </div>
        </OperatorLayout>
      );
    }
    return (
      <div style={s.page}>
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />

        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          {(() => {
            const pageCount = Number(result.page_count || result.pages || 0) || 0;
            const itemsProcessed =
              (Number(result.inserted_items) || 0) + (Number(result.updated_items) || 0);
            const summaryParts = [];
            if (pageCount > 0) summaryParts.push(`${pageCount} page${pageCount === 1 ? "" : "s"}`);
            if (itemsProcessed > 0) {
              summaryParts.push(`${itemsProcessed} menu item${itemsProcessed === 1 ? "" : "s"} successfully imported`);
            }
            const dash = summaryParts.length ? ` — ${summaryParts.join(", ")}` : "";
            return (
              <>
                <div style={s.successTitle}>{`Menu uploaded successfully${dash}.`}</div>
                <p style={s.successSub}>
                  Your menu is being reviewed. Once approved, it will appear on your Menuply profile.
                </p>
              </>
            );
          })()}
          <div style={s.pendingNote}>
            {result.text_length > 0 && `${result.text_length.toLocaleString()} characters extracted · `}
            {(Number(result.inserted_items) > 0 || Number(result.updated_items) > 0) && (
              <>
                {Number(result.inserted_items) || 0} new / {Number(result.updated_items) || 0} updated ·{" "}
              </>
            )}
            Menu status: <strong>pending review</strong>
          </div>
          {(() => {
            const q = result.ingestion_quality_summary;
            if (!q || typeof q !== "object") return null;

            const isPdfRoute = Boolean(result.structured_summary);
            const low = Number(q.low_confidence_row_count) || 0;
            const sus = Number(q.suspicious_row_count) || 0;
            const ext = Number(q.extreme_low_confidence_row_count) || 0;
            const blocked =
              Number(result.promotion_blocked_count ?? q.promotion_blocked_count ?? 0) || 0;
            const ocrWeak = q.ocr_quality_score != null && Number(q.ocr_quality_score) < 0.55;
            const pdfScore =
              q.pdf_extraction_quality_score != null ? Number(q.pdf_extraction_quality_score) : null;
            const pdfWeak = pdfScore != null && Number.isFinite(pdfScore) && pdfScore < 0.58;
            const extractionFlagCount = Array.isArray(q.extraction_quality_flags)
              ? q.extraction_quality_flags.length
              : 0;
            const extractionNoisy = extractionFlagCount > 3;

            if (
              low === 0 &&
              sus === 0 &&
              ext === 0 &&
              blocked === 0 &&
              !ocrWeak &&
              !pdfWeak &&
              !extractionNoisy
            ) {
              return null;
            }

            const routeNote = isPdfRoute
              ? pdfWeak || extractionNoisy
                ? " — PDF text extraction looked noisy or low-signal in places."
                : blocked > 0
                  ? " — some lines were held from automatic promotion until reviewed."
                  : "."
              : ocrWeak
                ? " — overall photo capture was soft."
                : ".";

            const holdLine =
              blocked > 0 || ext > 0
                ? ` (${Math.max(blocked, ext)} queued for extra review / held from auto-publish)`
                : "";

            return (
              <div style={s.ingestionReviewHint} role="status">
                <strong>Quick check recommended:</strong> automatic import flagged uncertainty on parts of this menu
                {low ? ` (${low} lower-confidence lines)` : ""}
                {sus ? ` (${sus} unusual patterns)` : ""}
                {holdLine}
                {routeNote}{" "}
                When you review your menu, confirm names and prices look right.
              </div>
            );
          })()}
          <CompletionNextSteps isOperatorFlow={false} restaurantId={restaurant_id} />
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
                    ingestion_method: isOcrFlow ? "ocr" : ingestion_method,
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

  const submitDisabled = uploading || !!fileError || (!file && capturedPages.length === 0);

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

      <div style={s.heading}>
        {isOcrFlow ? "Photo or scan of the menu text" : "Upload your menu PDF"}
      </div>
      <div style={s.subheading}>
        {isOcrFlow
          ? "Photograph printed menu wording and prices one menu page at a time. Not for food photos."
          : "Upload a PDF menu. Multi-page PDFs are supported."}
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
      <div style={{
        marginTop: 14,
        marginBottom: 18,
        borderRadius: 14,
        border: "1px solid #d9e0ea",
        background: "#f8faf9",
        padding: "14px 16px",
        fontSize: 13,
        lineHeight: 1.6,
        color: "#475467",
      }}>
        Upload only menu PDFs, menu photos, and descriptions you are authorized to submit for this restaurant.
        Imported menu items remain pending review until approved.
      </div>

      <form onSubmit={handleSubmit} noValidate aria-busy={uploading ? "true" : "false"}>
        {isOcrFlow && capturedPages.length === 0 && restaurantInfoChoice === null ? (
          <div style={s.infoStepCard}>
            <div style={s.infoStepBadge}>Optional · Step 1 of 2</div>
            <div style={s.infoStepTitle}>Photo of your restaurant name or address</div>
            <div style={s.infoStepBody}>
              Take one photo of your restaurant's name, address, or signage so we can confirm
              the listing details. We'll also pick up this info from your menu pages if it's
              already printed there — this photo just makes sure we get it right. Skip if your
              menu pages already show the name and address.
            </div>
            <div style={s.infoStepActions}>
              <button
                type="button"
                style={s.infoStepPrimary}
                disabled={uploading}
                onClick={() => restaurantInfoInputRef.current?.click()}
              >
                Take photo of restaurant info
              </button>
              <button
                type="button"
                style={s.infoStepSecondary}
                disabled={uploading}
                onClick={() => setRestaurantInfoChoice("skipped")}
              >
                Skip — my menu pages already show this
              </button>
            </div>
            <div style={s.infoStepHint}>
              You can capture menu pages right after. We don't process anything until you tap Submit menu.
            </div>
            <input
              ref={restaurantInfoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={onRestaurantInfoChange}
            />
          </div>
        ) : null}

        <div
          style={{
            ...s.dropZone(isDragOver, !!file, !!fileError),
            ...(isOcrFlow && uploading ? s.dropZoneDisabled : {}),
            ...(isOcrFlow && capturedPages.length === 0 && restaurantInfoChoice === null
              ? { display: "none" }
              : {}),
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onDropZoneClick}
          role="button"
          tabIndex={0}
          aria-busy={isOcrFlow && uploading ? "true" : "false"}
          aria-label={isOcrFlow ? "Tap to add a photo of menu text" : "Click or drag to upload PDF"}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onDropZoneClick();
            }
          }}
        >
          <div style={s.dropIcon}>{isOcrFlow ? "📷" : "📄"}</div>
          <div style={s.dropTitle}>
            {isOcrFlow
              ? capturedPages.length === 0
                ? restaurantInfoChoice === "captured"
                  ? "Now photograph your first menu page"
                  : "Tap to photograph menu text"
                : "Tap to add the next menu page"
              : "Click or drag to upload your menu PDF"}
          </div>
          <div style={s.dropSub}>
            {isOcrFlow
              ? "On phones, the camera opens when supported. Add one menu page per menu photo—show prices and dish names, not plated food."
              : "Select a PDF from your device or drag it into this box. Multi-page PDFs are supported."}
          </div>
          <div style={s.dropHint}>
            {isOcrFlow ? "Accepted: menu page photos (PNG/JPG/WEBP)" : "Accepted format: PDF only · Max file size: 20 MB"}
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

        {capturedPages.length > 0 ? (
          <div>
            {capturedPages.map((page) => {
              const role = page.pageRole === "restaurant_info" ? "restaurant_info" : "menu_items";
              const headerLabel =
                role === "restaurant_info"
                  ? "Restaurant info photo"
                  : `Page ${page.pageNumber} captured`;
              const statusLine =
                page.preview?.captured || !page.ocrText
                  ? role === "restaurant_info"
                    ? "Saved. We'll use this on Finish."
                    : "Saved. We'll read this page when you click Submit menu."
                  : page.preview?.readable
                    ? "Readable text detected."
                    : "Text preview is weak.";
              return (
                <div
                  key={page.pageNumber}
                  style={{ marginBottom: 16, border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{headerLabel}</div>
                  <img
                    src={page.previewUrl}
                    alt={`Menu page ${page.pageNumber}`}
                    style={{ width: "100%", borderRadius: 10, marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>
                    {statusLine}
                    {page.preview?.item_count > 0
                      ? ` Menu-like items found: ${page.preview.item_count}.`
                      : ""}
                  </div>
                  {page.ocrText ? (
                    <div style={{ fontSize: 12, color: "#666" }}>{page.ocrText.slice(0, 180)}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : file ? (
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

        {isOcrFlow && ocrProgressPhase && OCR_PHASE_COPY[ocrProgressPhase] ? (
          <div style={s.ocrProgressCard} role="status" aria-live="polite" aria-atomic="true">
            <OcrProgressSpinner />
            <div style={s.ocrProgressText}>
              <div style={s.ocrProgressTitle}>{OCR_PHASE_COPY[ocrProgressPhase].title}</div>
              <div style={s.ocrProgressSub}>{OCR_PHASE_COPY[ocrProgressPhase].sub}</div>
              {ocrProgressPhase === "processing" && finishProgress.total > 0 ? (
                <div style={s.ocrProgressMeta}>
                  {`Processing ${Math.min(finishProgress.processed, finishProgress.total)} of ${finishProgress.total} page${finishProgress.total === 1 ? "" : "s"} · Please keep this screen open`}
                </div>
              ) : ocrProgressPhase === "uploading_photo" ? (
                <div style={s.ocrProgressMeta}>
                  {ocrActivePageNumber != null ? `Page ${ocrActivePageNumber} · ` : ""}
                  Saving page · Please keep this screen open
                </div>
              ) : (
                <div style={s.ocrProgressMeta}>
                  {ocrProgressPhase === "finalizing" && capturedPages.length > 0
                    ? `${capturedPages.length} page${capturedPages.length === 1 ? "" : "s"} ready · `
                    : ""}
                  Almost done · Please keep this screen open
                </div>
              )}
            </div>
          </div>
        ) : null}

        {!isOcrFlow && uploading ? (
          <div style={s.ocrProgressCard} role="status" aria-live="polite">
            <OcrProgressSpinner />
            <div style={s.ocrProgressText}>
              <div style={s.ocrProgressTitle}>Uploading your PDF…</div>
              <div style={s.ocrProgressSub}>Large files may take a minute. Please keep this screen open.</div>
            </div>
          </div>
        ) : null}

        {isOcrFlow && capturedPages.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            <button
              type="button"
              style={s.submitBtn(uploading)}
              disabled={uploading}
              onClick={onDropZoneClick}
            >
              Add another page
            </button>
            <button type="submit" style={s.submitBtn(submitDisabled)} disabled={submitDisabled}>
              {uploading && ocrProgressPhase === "processing"
                ? finishProgress.total > 0
                  ? `Processing ${Math.min(finishProgress.processed, finishProgress.total)} of ${finishProgress.total}…`
                  : "Processing…"
                : uploading && ocrProgressPhase === "finalizing"
                  ? "Finalizing…"
                  : uploading
                    ? "Working…"
                    : "Submit menu"}
            </button>
          </div>
        ) : (
          <button type="submit" style={s.submitBtn(submitDisabled)} disabled={submitDisabled}>
            {uploading ? "Working…" : isOcrFlow ? "Start menu page upload" : "Upload PDF"}
          </button>
        )}
      </form>
    </div>
  );
}
