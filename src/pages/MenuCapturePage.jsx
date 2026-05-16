import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import {
  buildCapturePreviewUrl,
  convertImageFileToPdf,
  isCaptureImageFile,
} from "../lib/menuCaptureImagePdf.js";

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3001"
    : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");
const MAX_FILE_BYTES = 25 * 1024 * 1024;
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

function formatFlowError(rawMessage, httpStatus) {
  const msg = String(rawMessage || "").trim();
  const status = Number(httpStatus) || 0;
  const lower = msg.toLowerCase();
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (status === 408 || status === 504 || /timeout/i.test(lower)) {
    return "This is taking too long. Try again with a smaller photo or a stronger signal.";
  }
  if (status === 413) return "That file is too large to upload.";
  return msg || "Something went wrong. Please try again.";
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {label}{" "}
        {required ? (
          <span style={{ color: "#ef4444" }}>*</span>
        ) : (
          <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
        )}
      </label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{hint}</p>}
    </div>
  );
}

function inputStyle() {
  return {
    width: "100%",
    height: 46,
    padding: "0 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 14,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };
}

/**
 * Phases: identity | optional_info_photo | menu | review | success
 */
export default function MenuCapturePage() {
  const navigate = useNavigate();
  const step1InputRef = useRef(null);
  const menuInputRef = useRef(null);

  const [phase, setPhase] = useState("identity");
  const [captureSessionId, setCaptureSessionId] = useState("");
  const [sessionStartError, setSessionStartError] = useState("");
  const [nextPageNumber, setNextPageNumber] = useState(1);
  const [hasRestaurantInfoPhoto, setHasRestaurantInfoPhoto] = useState(false);
  const [ocrHintsFromPhoto, setOcrHintsFromPhoto] = useState(null);
  const [menuPageCount, setMenuPageCount] = useState(0);
  const [menuThumbUrls, setMenuThumbUrls] = useState([]);

  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captureStatus, setCaptureStatus] = useState(null);

  const postPage = useCallback(
    async (file, pageRole, pageNumber) => {
      if (!captureSessionId) throw new Error("Session not ready.");
      const pdfFile = await convertImageFileToPdf(file);
      const fd = new FormData();
      fd.append("page_number", String(pageNumber));
      fd.append("page_role", pageRole);
      fd.append("image_file", file, file.name);
      fd.append("pdf_file", pdfFile, pdfFile.name);

      setSavingPhoto(true);
      const res = await fetch(
        `${API}/menus-claim-upload-clean/capture-session/${captureSessionId}/page`,
        { method: "POST", body: fd, credentials: "include" }
      );
      const json = await res.json().catch(() => ({}));
      setSavingPhoto(false);

      if (!res.ok || !json?.ok) {
        const err = new Error(json?.error || `Upload failed (${res.status})`);
        err.status = res.status;
        throw err;
      }
      return json;
    },
    [captureSessionId]
  );

  async function startCaptureSessionFromIdentity() {
    if (!restaurantName.trim()) {
      setErrorMsg("Please enter the restaurant name.");
      return;
    }
    if (!city.trim()) {
      setErrorMsg("Please enter the city.");
      return;
    }
    if (!stateField.trim()) {
      setErrorMsg("Please enter the state.");
      return;
    }
    setErrorMsg("");
    setSessionStartError("");
    setSavingPhoto(true);
    try {
      const res = await fetch(`${API}/menus-claim-upload-clean/capture-session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim() || "",
          restaurant_name_input: restaurantName.trim(),
          restaurant_address_input: address.trim(),
          locked_city: city.trim(),
          locked_state: stateField.trim(),
          phone: phone.trim(),
          website: website.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data.capture_session_id) {
        setSessionStartError(data?.error || "Could not start upload session.");
        return;
      }
      setCaptureSessionId(data.capture_session_id);
      setHasRestaurantInfoPhoto(false);
      setNextPageNumber(1);
      setOcrHintsFromPhoto(null);
      setPhase("optional_info_photo");
    } catch {
      setSessionStartError("Could not start upload session.");
    } finally {
      setSavingPhoto(false);
    }
  }

  function validateImageFile(f) {
    if (!f) return "No file selected.";
    if (!isCaptureImageFile(f)) return "Please choose a photo (JPG or PNG).";
    if (f.size > MAX_FILE_BYTES) {
      return `File too large (max 25 MB). Yours is ${(f.size / 1024 / 1024).toFixed(1)} MB.`;
    }
    return "";
  }

  async function onRestaurantPhotoChosen(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    const v = validateImageFile(f);
    if (v) {
      setErrorMsg(v);
      return;
    }
    if (!captureSessionId) {
      setErrorMsg(sessionStartError || "Session not ready. Go back and continue from restaurant details.");
      return;
    }
    setErrorMsg("");
    const pn = 1;
    try {
      await postPage(f, "restaurant_info", pn);
      setHasRestaurantInfoPhoto(true);
      setNextPageNumber(2);
      setPhase("menu");
    } catch (err) {
      setErrorMsg(formatFlowError(err.message, err.status));
    }
  }

  function skipOptionalRestaurantPhoto() {
    setErrorMsg("");
    setHasRestaurantInfoPhoto(false);
    setNextPageNumber(1);
    setPhase("menu");
  }

  async function onMenuPhotoChosen(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    const v = validateImageFile(f);
    if (v) {
      setErrorMsg(v);
      return;
    }
    if (!captureSessionId) {
      setErrorMsg(sessionStartError || "Session not ready.");
      return;
    }
    setErrorMsg("");
    const pn = nextPageNumber;
    try {
      await postPage(f, "menu_items", pn);
      setMenuPageCount((c) => c + 1);
      setNextPageNumber((n) => n + 1);
      setMenuThumbUrls((prev) => [...prev, buildCapturePreviewUrl(f)]);
    } catch (err) {
      setErrorMsg(formatFlowError(err.message, err.status));
    }
  }

  function goReview() {
    if (menuPageCount < 1) {
      setErrorMsg("Add at least one photo of a menu page (text and prices).");
      return;
    }
    setErrorMsg("");
    setPhase("review");
  }

  async function finalizeSubmit() {
    const name = restaurantName.trim();
    if (!name) {
      setErrorMsg("Please enter the restaurant name before submitting.");
      return;
    }
    if (!city.trim() || !stateField.trim()) {
      setErrorMsg("City and state are required.");
      return;
    }
    if (!captureSessionId) {
      setErrorMsg("Session missing. Refresh and try again.");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API}/menus-claim-upload-clean/capture-session/${captureSessionId}/finish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            restaurant_name: name,
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            state: stateField.trim(),
            website: website.trim(),
            email: email.trim(),
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Submit failed (${res.status})`);
      }
      if (!json.queued) {
        throw new Error("Unexpected response from server. Please try again.");
      }
      setCaptureStatus({ session_status: "queued", processing_complete: false });
      setPhase("success");
    } catch (err) {
      setErrorMsg(formatFlowError(err.message, err.status));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (phase !== "success" || !captureSessionId) return undefined;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `${API}/menus-claim-upload-clean/capture-session/${captureSessionId}/status`,
          { credentials: "include" }
        );
        const json = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && json?.ok) {
          setCaptureStatus({
            session_status: json.session?.status || null,
            processing_complete: Boolean(json.processing_complete),
            menu_completeness_status: json.menu_completeness_status,
            review_pending_count: json.review_pending_count,
            item_total: json.item_total,
            job_error: json.job_error,
          });
        }
      } catch {
        /* ignore transient poll errors */
      }
    }

    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, captureSessionId]);

  const mergedHintsDisplay = ocrHintsFromPhoto
    ? [
        ocrHintsFromPhoto.name && `Name (from photo): ${ocrHintsFromPhoto.name}`,
        ocrHintsFromPhoto.phone && `Phone (from photo): ${ocrHintsFromPhoto.phone}`,
        ocrHintsFromPhoto.address && `Address (from photo): ${ocrHintsFromPhoto.address}`,
        ocrHintsFromPhoto.website && `Website (from photo): ${ocrHintsFromPhoto.website}`,
      ].filter(Boolean)
    : [];

  const progressCard = savingPhoto ? (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: "16px 18px",
        background: "#f6f8fc",
        border: "1px solid #c5d4eb",
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <OcrProgressSpinner />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 }}>
          Saving photo…
        </div>
        <div style={{ fontSize: 13, color: "#5a6578", lineHeight: 1.45 }}>
          Uploading securely. You can add another page as soon as this finishes.
        </div>
      </div>
    </div>
  ) : null;

  if (phase === "success") {
    return (
      <>
        <StickyPageHeader />
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "40px 16px 80px",
            fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", color: "#0f172a" }}>
            Menu received
          </h1>
          <p style={{ fontSize: 15, color: "#475569", margin: "0 0 16px", lineHeight: 1.65 }}>
            <strong>{restaurantName.trim()}</strong>: we received{" "}
            <strong>{menuPageCount}</strong> menu page{menuPageCount !== 1 ? "s" : ""}
            {hasRestaurantInfoPhoto ? " plus your optional restaurant-details photo" : ""}. Photos are processing in
            the background — items may take a few minutes to appear in search. Thank you for contributing!
          </p>
          {captureStatus?.session_status === "failed" && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 8,
                background: "#fff5f5",
                border: "1px solid #fca5a5",
                color: "#b91c1c",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Processing could not finish. You can try submitting again or contact support if this persists.
            </div>
          )}
          {captureStatus?.processing_complete &&
            captureStatus?.menu_completeness_status &&
            captureStatus.menu_completeness_status !== "complete" && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "#fffbeb",
                  border: "1px solid #fcd34d",
                  color: "#92400e",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {captureStatus.menu_completeness_status === "partial" ||
                captureStatus.menu_completeness_status === "review_pending" ? (
                  <>
                    Some items from your photos are still under review
                    {Number(captureStatus.review_pending_count) > 0
                      ? ` (${captureStatus.review_pending_count} held for quality check)`
                      : ""}
                    . Approved items are already on the menu.
                  </>
                ) : (
                  <>Menu processing finished with limited items published.</>
                )}
              </div>
            )}
          {captureStatus?.processing_complete &&
            captureStatus?.menu_completeness_status === "complete" &&
            Number(captureStatus.item_total) > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "#ecfdf5",
                  border: "1px solid #6ee7b7",
                  color: "#065f46",
                  fontSize: 13,
                }}
              >
                Processing complete — {captureStatus.item_total} menu item
                {captureStatus.item_total !== 1 ? "s" : ""} published.
              </div>
            )}
          {!captureStatus?.processing_complete && captureStatus?.session_status !== "failed" && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 8,
                background: "#f6f8fc",
                border: "1px solid #c5d4eb",
                color: "#334155",
                fontSize: 13,
              }}
            >
              Still processing your photos…
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              display: "block",
              width: "100%",
              height: 46,
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to Menuply
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <StickyPageHeader />
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "24px 16px 80px",
          fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#0f172a" }}>
          Add a menu
        </h1>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
          Step{" "}
          {phase === "identity"
            ? "1"
            : phase === "optional_info_photo"
              ? "2"
              : phase === "menu"
                ? "3"
                : phase === "review"
                  ? "4"
                  : "—"}{" "}
          of 4
        </p>

        {sessionStartError && phase === "identity" && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 8,
              background: "#fff5f5",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {sessionStartError}
          </div>
        )}

        {progressCard}

        {phase === "optional_info_photo" && (
          <>
            <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.6, marginBottom: 8 }}>
              Optional: add a photo of the <strong>restaurant name or address</strong> from the menu cover or window
              card. Text will be read after you submit (in the background).
            </p>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
              You can skip this if you already entered the details on the previous step.
            </p>
            <input
              ref={step1InputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onRestaurantPhotoChosen}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                disabled={!captureSessionId || savingPhoto}
                onClick={() => step1InputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  height: 52,
                  border: "2px dashed #cbd5e1",
                  borderRadius: 10,
                  background: "#f8fafc",
                  cursor: !captureSessionId || savingPhoto ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                <span style={{ fontSize: 22 }}>📸</span>
                Take photo / upload image
              </button>
              <button
                type="button"
                disabled={!captureSessionId || savingPhoto}
                onClick={skipOptionalRestaurantPhoto}
                style={{
                  width: "100%",
                  height: 46,
                  background: "#fff",
                  color: "#475569",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !captureSessionId || savingPhoto ? "not-allowed" : "pointer",
                }}
              >
                Skip — go to menu pages
              </button>
            </div>
          </>
        )}

        {phase === "identity" && (
          <>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
              Enter the restaurant this menu belongs to. Street address is optional. Phone and website are optional.
              We use this to lock the correct restaurant before you photograph the menu.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Restaurant name" required>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. Joe's Diner"
                  style={inputStyle()}
                />
              </Field>
              <Field label="Street address">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Optional"
                  style={inputStyle()}
                />
              </Field>
              <Field label="City" required>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  style={inputStyle()}
                />
              </Field>
              <Field label="State" required hint="e.g. CA or California">
                <input
                  type="text"
                  value={stateField}
                  onChange={(e) => setStateField(e.target.value)}
                  placeholder="State"
                  style={inputStyle()}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  style={inputStyle()}
                />
              </Field>
              <Field label="Website">
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  style={inputStyle()}
                />
              </Field>
              <button
                type="button"
                onClick={startCaptureSessionFromIdentity}
                disabled={savingPhoto}
                style={{
                  height: 48,
                  background: savingPhoto ? "#94a3b8" : "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: savingPhoto ? "not-allowed" : "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {phase === "menu" && (
          <>
            <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.6, marginBottom: 16 }}>
              Now take photos of the <strong>menu listings</strong> (dish names and prices on the printed menu—not photos of food).
            </p>
            <input
              ref={menuInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onMenuPhotoChosen}
              style={{ display: "none" }}
            />
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                marginBottom: 14,
                fontSize: 14,
                color: "#166534",
                fontWeight: 600,
              }}
            >
              Menu pages added: {menuPageCount}
            </div>
            {menuThumbUrls.length > 0 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
                {menuThumbUrls.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              disabled={!captureSessionId || savingPhoto}
              onClick={() => menuInputRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                height: 50,
                border: "2px dashed #cbd5e1",
                borderRadius: 10,
                background: "#f8fafc",
                cursor: !captureSessionId || savingPhoto ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 700,
                color: "#334155",
                marginBottom: 10,
              }}
            >
              + Add menu page photo
            </button>
            <button
              type="button"
              disabled={menuPageCount < 1 || savingPhoto}
              onClick={goReview}
              style={{
                width: "100%",
                height: 48,
                background: menuPageCount < 1 ? "#94a3b8" : "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: menuPageCount < 1 || savingPhoto ? "not-allowed" : "pointer",
              }}
            >
              Continue to review
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg("");
                setPhase("optional_info_photo");
              }}
              style={{
                marginTop: 12,
                width: "100%",
                height: 40,
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ← Back
            </button>
          </>
        )}

        {phase === "review" && (
          <>
            <p style={{ fontSize: 14, color: "#0f172a", marginBottom: 12, lineHeight: 1.55, fontWeight: 600 }}>
              Items will be added to:{" "}
              <strong>
                {restaurantName.trim() || "—"}
                {city.trim() && stateField.trim()
                  ? `, ${city.trim()}, ${stateField.trim()}`
                  : ""}
              </strong>
              . Processing runs in the background after you submit.
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
              Review & submit
            </p>
            <div
              style={{
                border: "1.5px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {[
                { label: "Restaurant", value: restaurantName.trim() || "—" },
                { label: "City", value: city.trim() || "—" },
                { label: "State", value: stateField.trim() || "—" },
                { label: "Phone", value: phone.trim() || "—" },
                { label: "Website", value: website.trim() || "—" },
                ...(address.trim()
                  ? [{ label: "Address (from photo)", value: address.trim() }]
                  : []),
                { label: "Menu photos", value: String(menuPageCount) },
                {
                  label: "Restaurant info photo",
                  value: hasRestaurantInfoPhoto ? "Yes (used for matching, not menu items)" : "No (manual / skipped)",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    padding: "12px 16px",
                    borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none",
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  <span
                    style={{
                      width: 130,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#64748b",
                      flexShrink: 0,
                    }}
                  >
                    {row.label}
                  </span>
                  <span style={{ fontSize: 14, color: "#0f172a", wordBreak: "break-word" }}>{row.value}</span>
                </div>
              ))}
            </div>
            {mergedHintsDisplay.length > 0 && (
              <div
                style={{
                  fontSize: 13,
                  color: "#475569",
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Detected from restaurant photo</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {mergedHintsDisplay.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                  Values you entered above take priority when we save the menu.
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field
                label="Restaurant name (confirm)"
                required
                hint={
                  hasRestaurantInfoPhoto
                    ? "Required to submit. Add or fix the name if needed."
                    : "Required to submit. City and state must also be filled in (from the previous step)."
                }
              >
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  style={inputStyle()}
                />
              </Field>
              <Field label="Your email (optional)" hint="For questions about this upload.">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle()}
                />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setErrorMsg("");
                  setPhase("menu");
                }}
                style={{
                  flex: 1,
                  height: 46,
                  background: "#f1f5f9",
                  color: "#374151",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting || savingPhoto}
                onClick={finalizeSubmit}
                style={{
                  flex: 2,
                  height: 46,
                  background: submitting ? "#94a3b8" : "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: submitting || savingPhoto ? "not-allowed" : "pointer",
                }}
              >
                Submit menu
              </button>
            </div>
          </>
        )}

        {errorMsg && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 8,
              background: "#fff5f5",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>
    </>
  );
}
