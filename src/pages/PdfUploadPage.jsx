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

/** OCR menu photo + server processing — staged UX (single round-trip; phases timed + milestone-based). */
const OCR_PHASE_COPY = {
  uploading_photo: { title: "Uploading photo…", sub: "Sending your picture securely." },
  reading_menu: { title: "Reading menu…", sub: "Opening your menu page on our servers." },
  extracting_text: { title: "Extracting menu text…", sub: "Pulling words and prices from the image." },
  structuring: { title: "Organizing menu items…", sub: "Grouping sections and dishes." },
  finalizing: { title: "Finalizing your menu…", sub: "Saving items for review." },
};

const OCR_PHASE_STEP = {
  uploading_photo: 1,
  reading_menu: 2,
  extracting_text: 3,
  structuring: 4,
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

function buildPreviewUrl(file) {
  return URL.createObjectURL(file);
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
  /** Same as uploadSessionId state, updated synchronously so "Finish" never uses a stale empty id. */
  const uploadSessionIdRef = useRef("");
  const ocrTimerRefs = useRef([]);
  const ocrPageWorkRef = useRef(false);
  const [file, setFile] = useState(null);
  const [uploadSessionId, setUploadSessionId] = useState("");
  const [capturedPages, setCapturedPages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [result, setResult] = useState(null);
  /** null = idle; otherwise staged OCR UX label key */
  const [ocrProgressPhase, setOcrProgressPhase] = useState(null);
  /** 1-based page index while a photo is being processed (consumer-facing progress). */
  const [ocrActivePageNumber, setOcrActivePageNumber] = useState(null);

  const missingState = recovery.missing;
  const chosenStyle = design_style
    ? DESIGN_STYLES.find((entry) => entry.id === design_style) || null
    : null;
  const isOcrRoute =
    typeof location.pathname === "string" && location.pathname.endsWith("/ocr-upload");
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
        ? "Choose a phone photo of the menu."
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

  async function uploadCapturedPage(imageFile) {
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
      formData.append("page_role", "menu_items");
      formData.append("image_file", imageFile, imageFile.name);
      formData.append("pdf_file", pdfFile, pdfFile.name);

      if (ocrPageWorkRef.current) setOcrProgressPhase("reading_menu");

      const schedulePhase = (phase, ms) => {
        const id = setTimeout(() => {
          if (ocrPageWorkRef.current) setOcrProgressPhase(phase);
        }, ms);
        ocrTimerRefs.current.push(id);
      };
      schedulePhase("extracting_text", 2200);
      schedulePhase("structuring", 4800);

      const res = await fetch(`${API}/uploads/menu-session/${sessionId}/page`, {
        method: "POST",
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
          ocrText: data.ocr_text,
          preview: data.preview,
          status: data.status,
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

  async function handleSubmit(event) {
    event.preventDefault();
    setUploadErr("");
    setFileError("");

    if (isOcrFlow && capturedPages.length > 0) {
      setUploading(true);
      setOcrProgressPhase("finalizing");
      setUploadErr("");

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

        const res = await fetch(`${API}/uploads/menu-session/${sessionForFinish}/finish`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
          const err = new Error(data?.error || `Finish failed (${res.status})`);
          err.status = res.status;
          throw err;
        }

        const itemsSaved = (Number(data.inserted_items) || 0) + (Number(data.updated_items) || 0);
        if (itemsSaved <= 0) {
          throw new Error(
            "Upload finished but no menu items were saved. Try clearer photos or contact support."
          );
        }

        setResult(data);
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
      setFileError(isOcrFlow ? "Please take a menu photo to begin the upload session." : "Please select a PDF file to upload.");
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
          {(() => {
            const pageCount = Number(result.page_count || result.pages || 0) || 0;
            const itemsProcessed =
              (Number(result.inserted_items) || 0) + (Number(result.updated_items) || 0);
            const summaryParts = [];
            if (pageCount > 0) summaryParts.push(`${pageCount} page${pageCount === 1 ? "" : "s"}`);
            if (itemsProcessed > 0) {
              summaryParts.push(`${itemsProcessed} item${itemsProcessed === 1 ? "" : "s"} processed`);
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
          <Link to={`/restaurant-profile/${restaurant_id}`} style={s.profileLink}>
            Go to your restaurant profile
          </Link>
          <div style={s.pendingNote}>
            {result.text_length > 0 && `${result.text_length.toLocaleString()} characters extracted · `}
            {(Number(result.inserted_items) > 0 || Number(result.updated_items) > 0) && (
              <>
                {Number(result.inserted_items) || 0} new / {Number(result.updated_items) || 0} updated ·{" "}
              </>
            )}
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

      <div style={s.heading}>{isOcrFlow ? "Take a menu photo or upload a scan" : "Upload your menu PDF"}</div>
      <div style={s.subheading}>
        {isOcrFlow
          ? "Upload one photo at a time."
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

      <form onSubmit={handleSubmit} noValidate aria-busy={uploading ? "true" : "false"}>
        <div
          style={{
            ...s.dropZone(isDragOver, !!file, !!fileError),
            ...(isOcrFlow && uploading ? s.dropZoneDisabled : {}),
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onDropZoneClick}
          role="button"
          tabIndex={0}
          aria-busy={isOcrFlow && uploading ? "true" : "false"}
          aria-label={isOcrFlow ? "Tap to take a photo of the menu" : "Click or drag to upload PDF"}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onDropZoneClick();
            }
          }}
        >
          <div style={s.dropIcon}>{isOcrFlow ? "📷" : "📄"}</div>
          <div style={s.dropTitle}>
            {isOcrFlow ? "Tap to take a photo of the menu" : "Click or drag to upload your menu PDF"}
          </div>
          <div style={s.dropSub}>
            {isOcrFlow
              ? "On phones, the camera opens when supported. Each photo is added to the same upload session."
              : "Select a PDF from your device or drag it into this box. Multi-page PDFs are supported."}
          </div>
          <div style={s.dropHint}>
            {isOcrFlow ? "Accepted: phone photos, PNG/JPG, or WEBP" : "Accepted format: PDF only · Max file size: 20 MB"}
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
            {capturedPages.map((page) => (
              <div
                key={page.pageNumber}
                style={{ marginBottom: 16, border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{`Page ${page.pageNumber} added`}</div>
                <img
                  src={page.previewUrl}
                  alt={`Menu page ${page.pageNumber}`}
                  style={{ width: "100%", borderRadius: 10, marginBottom: 8 }}
                />
                <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>
                  {page.preview?.readable ? "Readable text detected." : "Text preview is weak."}
                  {page.preview?.item_count > 0 ? ` Menu-like items found: ${page.preview.item_count}.` : ""}
                </div>
                {page.ocrText ? <div style={{ fontSize: 12, color: "#666" }}>{page.ocrText.slice(0, 180)}</div> : null}
              </div>
            ))}
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
              {OCR_PHASE_STEP[ocrProgressPhase] != null ? (
                <div style={s.ocrProgressMeta}>
                  {ocrActivePageNumber != null ? `Page ${ocrActivePageNumber} · ` : ""}
                  {`Step ${OCR_PHASE_STEP[ocrProgressPhase]} of 4 · Please keep this screen open`}
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
              {uploading && ocrProgressPhase === "finalizing" ? "Finalizing…" : uploading ? "Working…" : "Submit menu"}
            </button>
          </div>
        ) : (
          <button type="submit" style={s.submitBtn(submitDisabled)} disabled={submitDisabled}>
            {uploading ? "Working…" : isOcrFlow ? "Start menu photo upload" : "Upload PDF"}
          </button>
        )}
      </form>
    </div>
  );
}
