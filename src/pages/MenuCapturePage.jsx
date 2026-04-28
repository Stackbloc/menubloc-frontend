import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function Field({ label, required, hint, disabled, autoFilled, children }) {
  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 13, fontWeight: 700,
        color: disabled ? "#94a3b8" : "#374151", marginBottom: 6,
      }}>
        {label}{" "}
        {required
          ? <span style={{ color: disabled ? "#cbd5e1" : "#ef4444" }}>*</span>
          : <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>}
        {autoFilled && !disabled && (
          <span style={{
            fontSize: 11, fontWeight: 500, color: "#16a34a",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 4, padding: "1px 5px",
          }}>auto-detected</span>
        )}
      </label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{hint}</p>}
    </div>
  );
}

function inputStyle(disabled) {
  return {
    width: "100%", height: 46, padding: "0 14px",
    border: `1.5px solid ${disabled ? "#f1f5f9" : "#e2e8f0"}`, borderRadius: 10,
    fontSize: 14,
    color: disabled ? "#94a3b8" : "#0f172a",
    background: disabled ? "#f8fafc" : "#fff",
    outline: "none", boxSizing: "border-box",
  };
}

export default function MenuCapturePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [pages, setPages] = useState([]);
  const file = pages[0] ?? null;
  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [extracting, setExtracting] = useState(false);
  const [autoFilled, setAutoFilled] = useState({});

  // "upload" | "form" | "confirm" | "uploading" | "success" | "error"
  const [step, setStep] = useState("upload");
  const [errorMsg, setErrorMsg] = useState("");

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setErrorMsg(`File too large (max 25 MB). Yours is ${(f.size / 1024 / 1024).toFixed(1)} MB.`);
      e.target.value = "";
      return;
    }
    setPages(prev => [...prev, f]);
    if (fileRef.current) fileRef.current.value = "";
    setErrorMsg("");
  }

  async function handleDoneAdding() {
    if (pages.length === 0) { setErrorMsg("Please choose at least one menu photo or PDF."); return; }
    setStep("form");
    setExtracting(true);
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("file", pages[0]);
      const res = await fetch(`${API}/menus-claim-upload-clean/extract-hint`,
        { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.ok && json.hints) {
          const { name, address: addr, phone: ph, email: em } = json.hints;
          const filled = {};
          if (name) { setRestaurantName(name); filled.name = true; }
          if (addr) { setAddress(addr);        filled.address = true; }
          if (ph)   { setPhone(ph);            filled.phone = true; }
          if (em)   { setEmail(em);            filled.email = true; }
          setAutoFilled(filled);
        }
      }
    } catch { /* non-fatal — proceed with empty fields */ }
    setExtracting(false);
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

  if (step === "upload") {
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
            Take a photo of a physical menu or upload a PDF.
            Multi-page menu? Add each page one at a time.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {pages.length === 0 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                height: 54, padding: "0 16px",
                border: "2px dashed #cbd5e1", borderRadius: 10, background: "#f8fafc",
                cursor: "pointer", fontSize: 14, color: "#64748b", fontWeight: 600,
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: 22 }}>📸</span>
              <span>Take photo or choose file</span>
            </button>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {pages.map((p, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px",
                    border: "1.5px solid #16a34a", borderRadius: 10, background: "#f0fdf4",
                  }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <span style={{
                      flex: 1, fontSize: 14, color: "#15803d", fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      Page {i + 1}: {p.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPages(prev => prev.filter((_, j) => j !== i))}
                      style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 46,
                    border: "2px dashed #cbd5e1", borderRadius: 10, background: "#f8fafc",
                    cursor: "pointer", fontSize: 14, color: "#64748b", fontWeight: 600,
                    boxSizing: "border-box",
                  }}
                >
                  + Next menu page
                </button>
                <button
                  type="button"
                  onClick={handleDoneAdding}
                  style={{
                    width: "100%", height: 48,
                    background: "#111827", color: "#fff", border: "none",
                    borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Done — continue
                </button>
              </div>
            </>
          )}

          {errorMsg && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 8,
              background: "#fff5f5", border: "1px solid #fca5a5",
              color: "#b91c1c", fontSize: 13, lineHeight: 1.5,
            }}>
              {errorMsg}
            </div>
          )}
        </div>
      </>
    );
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
            <strong>{restaurantName}</strong> has been matched and your menu
            ({pages.length} page{pages.length !== 1 ? "s" : ""}) is queued for processing.
            Thank you for contributing!
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
            Back to Menuply
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
              { label: "Menu", value: pages.length === 1 ? pages[0]?.name : `${pages.length} pages` },
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

  const fieldsDisabled = step === "uploading" || extracting;

  return (
    <>
      <StickyPageHeader />
      <div style={{
        maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px",
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#0f172a" }}>
          Restaurant details
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 4px", lineHeight: 1.6 }}>
          {pages.length} page{pages.length !== 1 ? "s" : ""} uploaded.{" "}
          <button
            type="button"
            onClick={() => { setStep("upload"); setErrorMsg(""); }}
            style={{ fontSize: 14, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            Change
          </button>
        </p>
        {extracting && (
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>
            Reading menu for restaurant info…
          </p>
        )}
        {!extracting && (
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
            {Object.keys(autoFilled).length > 0
              ? "Some fields were auto-detected. Fill in anything missing."
              : "Fill in the restaurant details below."}
          </p>
        )}

        <form onSubmit={handleReview} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="Restaurant name" required disabled={fieldsDisabled} autoFilled={autoFilled.name}>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="e.g. Fire Stone Wood Fired Grill"
              disabled={fieldsDisabled}
              style={inputStyle(fieldsDisabled)}
            />
          </Field>

          <Field label="Address" required hint="Street address helps us match the correct location." disabled={fieldsDisabled} autoFilled={autoFilled.address}>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Los Angeles, CA 90001"
              disabled={fieldsDisabled}
              style={inputStyle(fieldsDisabled)}
            />
          </Field>

          <Field label="Phone" disabled={fieldsDisabled} autoFilled={autoFilled.phone}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              disabled={fieldsDisabled}
              style={inputStyle(fieldsDisabled)}
            />
          </Field>

          <Field label="Your email" disabled={fieldsDisabled} autoFilled={autoFilled.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={fieldsDisabled}
              style={inputStyle(fieldsDisabled)}
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
            disabled={fieldsDisabled}
            style={{
              height: 48, width: "100%",
              background: fieldsDisabled ? "#94a3b8" : "#111827",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 700,
              cursor: fieldsDisabled ? "not-allowed" : "pointer",
            }}
          >
            Review & confirm
          </button>
        </form>
      </div>
    </>
  );
}
