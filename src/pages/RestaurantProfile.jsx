// menubloc-frontend/src/RestaurantProfile.jsx
import React, { useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function isEmail(x) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x || "").trim());
}

export default function RestaurantProfile() {
  // Required anchor for restaurant owners (MVP)
  const [email, setEmail] = useState("");

  // Minimal restaurant fields (MVP)
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisine, setCuisine] = useState("");

  // Status + created restaurant
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [restaurantId, setRestaurantId] = useState(null);

  // Upload
  const [menuFile, setMenuFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Endpoints (single source of truth)
  const RESTAURANTS_CREATE_URL = `${API}/restaurants`;
  const MENU_UPLOAD_URL = `${API}/menus/parse-file`; // your backend health: /menus/health

  const canSubmit = useMemo(() => {
    if (!restaurantName.trim()) return false;
    if (!cuisine.trim()) return false;
    if (!isEmail(email)) return false;
    return true;
  }, [restaurantName, cuisine, email]);

  async function saveRestaurant() {
    setStatus("");
    setUploadStatus("");

    if (!canSubmit) {
      if (!restaurantName.trim() || !cuisine.trim()) {
        setStatus("Restaurant name + cuisine are required.");
        return;
      }
      if (!isEmail(email)) {
        setStatus("Valid email required.");
        return;
      }
      setStatus("Please complete required fields.");
      return;
    }

    setSaving(true);
    setStatus("Saving…");

    try {
      // IMPORTANT: send BOTH restaurant_name and name to be compatible
      const payload = {
        restaurant_name: restaurantName.trim(),
        name: restaurantName.trim(),
        cuisine: cuisine.trim(),
        email: email.trim().toLowerCase(),
      };

      const res = await fetch(RESTAURANTS_CREATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

      const rid = data?.restaurant?.id ?? data?.id ?? data?.restaurant_id ?? data?.restaurantId ?? null;
      if (!rid) throw new Error("Saved, but could not read restaurant id from response.");

      setRestaurantId(rid);
      setStatus(`Saved ✅ (restaurant_id: ${rid}). Menu upload unlocked below.`);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err?.message || "Error saving"}`);
    } finally {
      setSaving(false);
    }
  }

  async function uploadMenuPdf() {
    setUploadStatus("");

    if (!restaurantId) return setUploadStatus("Create the restaurant first to unlock menu upload.");
    if (!menuFile) return setUploadStatus("Choose a PDF file first.");

    setUploading(true);
    setUploadStatus("Uploading + parsing…");

    try {
      const fd = new FormData();
      fd.append("file", menuFile); // must match multer field name: upload.single("file")
      fd.append("restaurant_id", String(restaurantId));

      const res = await fetch(MENU_UPLOAD_URL, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);

      setUploadStatus("Menu uploaded ✅");
    } catch (err) {
      console.error(err);
      setUploadStatus(`Upload error: ${err?.message || "failed"}`);
    } finally {
      setUploading(false);
    }
  }

  const styles = {
    page: {
      padding: 28,
      maxWidth: 820,
      margin: "0 auto",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    },
    h1: { fontSize: 28, margin: "0 0 6px 0" },
    sub: { margin: "0 0 18px 0", color: "#555" },
    card: {
      background: "#fff",
      border: "1px solid #e7e7e7",
      borderRadius: 14,
      padding: 16,
      boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
      marginBottom: 14,
    },
    cardTitle: { fontSize: 12, letterSpacing: 1.2, color: "#666", marginBottom: 12 },
    row: { display: "grid", gap: 8, marginBottom: 12 },
    label: { fontSize: 12, color: "#333" },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #ddd",
      outline: "none",
      fontSize: 14,
      boxSizing: "border-box",
    },
    actions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
    btn: {
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid #111",
      background: "#111",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    },
    disabled: { opacity: 0.55, cursor: "not-allowed" },
    muted: { color: "#666", fontSize: 12, lineHeight: 1.35 },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid #e6e6e6",
      background: "#fafafa",
      fontSize: 12,
      color: "#444",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.h1}>Restaurant Signup</div>
      <div style={styles.sub}>Create your restaurant → then upload your menu PDF.</div>

      <div style={{ marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={styles.pill}>
          API: <code>{API}</code>
        </span>
        <span style={styles.pill}>
          Upload endpoint: <code>{MENU_UPLOAD_URL}</code>
        </span>
        {restaurantId ? (
          <span style={styles.pill}>
            Created: <strong>#{restaurantId}</strong>
          </span>
        ) : null}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>BASIC INFO</div>

        <div style={styles.row}>
          <div style={styles.label}>Owner email *</div>
          <input
            style={styles.input}
            placeholder="owner@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div style={styles.row}>
          <div style={styles.label}>Restaurant name *</div>
          <input
            style={styles.input}
            placeholder="e.g., Pizza Mouth"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.label}>Cuisine *</div>
          <input
            style={styles.input}
            placeholder="e.g., Italian"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          />
        </div>

        <div style={styles.actions}>
          <button
            style={{ ...styles.btn, ...(saving || !canSubmit ? styles.disabled : {}) }}
            onClick={saveRestaurant}
            disabled={saving || !canSubmit}
            type="button"
          >
            {saving ? "Saving…" : "Save Restaurant"}
          </button>

          <div style={styles.muted}>{status || "Save creates the restaurant record."}</div>
        </div>
      </div>

      {restaurantId ? (
        <div style={styles.card}>
          <div style={styles.cardTitle}>MENU UPLOAD (PDF)</div>

          <div style={styles.muted}>
            Restaurant created ✅. Choose a PDF and upload.
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
            />

            <button
              style={{ ...styles.btn, ...(uploading || !menuFile ? styles.disabled : {}) }}
              onClick={uploadMenuPdf}
              disabled={uploading || !menuFile}
              type="button"
            >
              {uploading ? "Uploading…" : "Upload PDF"}
            </button>

            {menuFile ? (
              <span style={styles.pill}>
                Selected: <code>{menuFile.name}</code>
              </span>
            ) : null}
          </div>

          {uploadStatus ? <div style={{ marginTop: 10, fontSize: 14 }}>{uploadStatus}</div> : null}
        </div>
      ) : (
        <div style={styles.muted}>
          Menu upload stays hidden until the restaurant is saved.
        </div>
      )}
    </div>
  );
}