import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 13, fontWeight: 700,
        color: "#374151", marginBottom: 6,
      }}>
        {label}{" "}
        {required
          ? <span style={{ color: "#ef4444" }}>*</span>
          : <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>}
      </label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{hint}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%", height: 46, padding: "0 14px",
  border: "1.5px solid #e2e8f0", borderRadius: 10,
  fontSize: 14, color: "#0f172a", background: "#fff",
  outline: "none", boxSizing: "border-box",
};

export default function MenuCapturePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // "form" | "confirm" | "uploading" | "success" | "error"
  const [step, setStep] = useState("form");
  const [errorMsg, setErrorMsg] = useState("");

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setErrorMsg(`File too large (max 25 MB). Yours is ${(f.size / 1024 / 1024).toFixed(1)} MB.`);
      e.target.value = "";
      return;
    }
    setFile(f);
    setErrorMsg("");
  }

  function handleReview(e) {
    e.preventDefault();
    if (!file) { setErrorMsg("Please choose a menu photo or PDF."); return; }
    if (!restaurantName.trim()) { setErrorMsg("Please enter the restaurant name."); return; }
    if (!address.trim()) { setErrorMsg("Please enter the restaurant address."); return; }
    setErrorMsg("");
    setStep("confirm");
  }

  async function handleConfirmSubmit() {
    setStep("uploading");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("restaurant_name", restaurantName.trim());
    fd.append("address", address.trim());
    if (phone.trim()) fd.append("phone", phone.trim());
    if (email.trim()) fd.append("email", email.trim());
    try {
      const res = await fetch(`${API}/menus-claim-upload-clean/claim-upload`,
        { method: "POST", body: fd, credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!json.ok) throw new Error(json.error || `Upload failed (${res.status})`);
      setStep("success");
    } catch (err) {
      setErrorMsg(err.message || "Upload failed. Please try again.");
      setStep("error");
    }
  }

  if (step === "success") {
    return (
      <>
        <StickyPageHeader />
        <div style={{
          maxWidth: 480, margin: "0 auto", padding: "40px 16px 80px",
          fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", color: "#0f172a" }}>
            Menu received
          </h1>
          <p style={{ fontSize: 15, color: "#475569", margin: "0 0 28px", lineHeight: 1.65 }}>
            <strong>{restaurantName}</strong> has been matched and your menu is queued for
            processing. Thank you for contributing!
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              display: "block", width: "100%", height: 46,
              background: "#111827", color: "#fff", border: "none",
              borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}
          >
            Back to Grubbid
          </button>
        </div>
      </>
    );
  }

  if (step === "confirm") {
    return (
      <>
        <StickyPageHeader />
        <div style={{
          maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px",
          fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
            Confirm details
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
            Review before submitting. Tap Edit to go back.
          </p>

          <div style={{
            border: "1.5px solid #e2e8f0", borderRadius: 12,
            overflow: "hidden", marginBottom: 24,
          }}>
            {[
              { label: "Restaurant", value: restaurantName },
              { label: "Address", value: address },
              { label: "Phone", value: phone || "—" },
              { label: "Email", value: email || "—" },
              { label: "Menu file", value: file?.name },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{
                display: "flex", padding: "12px 16px",
                borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none",
                background: i % 2 === 0 ? "#fff" : "#f8fafc",
              }}>
                <span style={{ width: 110, fontSize: 12, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 14, color: "#0f172a",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {errorMsg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 16,
              background: "#fff5f5", border: "1px solid #fca5a5",
              color: "#b91c1c", fontSize: 13, lineHeight: 1.5,
            }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => { setStep("form"); setErrorMsg(""); }}
              style={{
                flex: 1, height: 46, background: "#f1f5f9", color: "#374151",
                border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              style={{
                flex: 2, height: 46, background: "#111827", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Submit menu
            </button>
          </div>
        </div>
      </>
    );
  }

  const uploading = step === "uploading";

  return (
    <>
      <StickyPageHeader />
      <div style={{
        maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px",
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#0f172a" }}>
          Add a menu
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
          Take a photo of a physical menu or upload a PDF. We'll link it to the restaurant
          and queue it for ingestion.
        </p>

        <form onSubmit={handleReview} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="Menu photo or PDF" required>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                height: 54, padding: "0 16px",
                border: file ? "2px solid #16a34a" : "2px dashed #cbd5e1",
                borderRadius: 10, background: file ? "#f0fdf4" : "#f8fafc",
                cursor: "pointer", fontSize: 14, color: file ? "#15803d" : "#64748b",
                fontWeight: 600, boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{file ? "📄" : "📸"}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file ? file.name : "Take photo or choose file"}
              </span>
            </button>
            {file && (
              <button
                type="button"
                onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                style={{
                  marginTop: 6, fontSize: 12, color: "#64748b",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                Remove
              </button>
            )}
          </Field>

          <Field label="Restaurant name" required>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="e.g. Fire Stone Wood Fired Grill"
              style={inputStyle}
            />
          </Field>

          <Field label="Address" required hint="Street address helps us match the correct location.">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Los Angeles, CA 90001"
              style={inputStyle}
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              style={inputStyle}
            />
          </Field>

          <Field label="Your email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </Field>

          {errorMsg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "#fff5f5", border: "1px solid #fca5a5",
              color: "#b91c1c", fontSize: 13, lineHeight: 1.5,
            }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            style={{
              height: 48, width: "100%",
              background: uploading ? "#94a3b8" : "#111827",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 700,
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            Review & confirm
          </button>
        </form>
      </div>
    </>
  );
}
