// menubloc-frontend/src/pages/RestaurantProfile.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HomeButton } from "../components/NavButton.jsx";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function safeText(v) {
  return String(v ?? "").trim();
}

function useQuery() {
  const loc = useLocation();
  return useMemo(() => new URLSearchParams(loc.search), [loc.search]);
}

export default function RestaurantProfile() {
  const nav = useNavigate();
  const qs = useQuery();

  const presetEmail = safeText(qs.get("email") || "");

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [restaurantId, setRestaurantId] = useState(null);

  const [form, setForm] = useState({
    restaurant_name: "",
    category: "",
    cuisine: "",
    phone: "",
    website: "",
    manager_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    email: presetEmail,
  });

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [uploadOk, setUploadOk] = useState(false);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const canSave = useMemo(() => {
    return safeText(form.restaurant_name) && safeText(form.category);
  }, [form]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaveErr("");
    setUploadOk(false);

    if (!canSave) {
      setSaveErr("Restaurant name and category are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      const r = json.restaurant || {};
      const id = r.id ? String(r.id) : null;
      if (!id) throw new Error("Saved, but no restaurant id returned.");
      setRestaurantId(id);
      nav("/restaurant/subscription");
    } catch (err) {
      setRestaurantId(null);
      setSaveErr(err?.message || "Failed to save restaurant.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPdf(e) {
    e.preventDefault();
    setUploadErr("");
    setUploadOk(false);

    if (!restaurantId) {
      setUploadErr("Save your restaurant profile first.");
      return;
    }
    if (!file) {
      setUploadErr("Choose a PDF file first.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("restaurant_id", String(restaurantId));

      const res = await fetch(`${API}/menus/parse-file`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || json?.detail || `HTTP ${res.status}`);

      setUploadOk(true);
    } catch (err) {
      setUploadOk(false);
      setUploadErr(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const styles = {
    wrap: { maxWidth: 980, margin: "40px auto", padding: "0 16px", fontFamily: "Arial, sans-serif" },
    topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 },
    brand: { fontWeight: 900, fontSize: 18 },
    back: { fontWeight: 900, textDecoration: "underline", color: "#111" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    card: { border: "1px solid #eee", borderRadius: 14, padding: 14, background: "#fff" },
    h: { fontSize: 18, fontWeight: 900, margin: "0 0 10px" },
    label: { fontSize: 12, fontWeight: 900, color: "#333", marginBottom: 6 },
    input: {
      width: "100%",
      height: 42,
      padding: "0 12px",
      border: "1px solid #e5e5e5",
      borderRadius: 12,
      outline: "none",
      background: "#fff",
    },
    btn: {
      height: 44,
      padding: "0 16px",
      borderRadius: 12,
      border: 0,
      background: "#111",
      color: "#fff",
      fontWeight: 900,
      cursor: "pointer",
    },
    btn2: {
      height: 44,
      padding: "0 16px",
      borderRadius: 12,
      border: "1px solid #e5e5e5",
      background: "#fff",
      color: "#111",
      fontWeight: 900,
      cursor: "pointer",
    },
    err: { marginTop: 10, padding: 10, background: "#fff5f5", border: "1px solid #ffd2d2", borderRadius: 12 },
    ok: { marginTop: 10, padding: 10, background: "#f3fff6", border: "1px solid #c6f3d1", borderRadius: 12 },
    row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
    small: { color: "#666", fontSize: 12 },
    full: { gridColumn: "1 / -1" },
  };

  const publicLink = restaurantId ? `/restaurants/${encodeURIComponent(restaurantId)}` : null;

  return (
    <div style={styles.wrap}>
      <div style={{ marginBottom: 18 }}>
        <HomeButton />
        <div style={{ ...styles.brand, marginTop: 14 }}>Grubbid · Restaurant Setup</div>
      </div>

      <div style={styles.card}>
        <div style={styles.h}>Step 1 — Restaurant info</div>
        <div style={styles.small}>Save this first. After saving, the menu upload becomes available.</div>

        <form onSubmit={saveProfile} style={{ marginTop: 12 }}>
          <div style={styles.grid}>
            <div>
              <div style={styles.label}>Restaurant name *</div>
              <input
                style={styles.input}
                value={form.restaurant_name}
                onChange={(e) => setField("restaurant_name", e.target.value)}
              />
            </div>

            <div>
              <div style={styles.label}>Category *</div>
              <input
                style={styles.input}
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="e.g., Restaurant"
              />
            </div>

            <div>
              <div style={styles.label}>Cuisine</div>
              <input
                style={styles.input}
                value={form.cuisine}
                onChange={(e) => setField("cuisine", e.target.value)}
                placeholder="e.g., Italian"
              />
            </div>

            <div>
              <div style={styles.label}>Manager name</div>
              <input
                style={styles.input}
                value={form.manager_name}
                onChange={(e) => setField("manager_name", e.target.value)}
              />
            </div>

            <div>
              <div style={styles.label}>Phone</div>
              <input style={styles.input} value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
            </div>

            <div>
              <div style={styles.label}>Website</div>
              <input
                style={styles.input}
                value={form.website}
                onChange={(e) => setField("website", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div style={styles.full}>
              <div style={styles.label}>Address line 1</div>
              <input
                style={styles.input}
                value={form.address_line1}
                onChange={(e) => setField("address_line1", e.target.value)}
              />
            </div>

            <div style={styles.full}>
              <div style={styles.label}>Address line 2</div>
              <input
                style={styles.input}
                value={form.address_line2}
                onChange={(e) => setField("address_line2", e.target.value)}
              />
            </div>

            <div>
              <div style={styles.label}>City</div>
              <input style={styles.input} value={form.city} onChange={(e) => setField("city", e.target.value)} />
            </div>

            <div>
              <div style={styles.label}>State</div>
              <input style={styles.input} value={form.state} onChange={(e) => setField("state", e.target.value)} />
            </div>

            <div>
              <div style={styles.label}>Postal code</div>
              <input
                style={styles.input}
                value={form.postal_code}
                onChange={(e) => setField("postal_code", e.target.value)}
              />
            </div>

            <div>
              <div style={styles.label}>Email</div>
              <input style={styles.input} value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 14, ...styles.row }}>
            <button type="submit" style={styles.btn} disabled={saving}>
              {saving ? "Saving…" : "Save restaurant"}
            </button>

            {restaurantId ? (
              <>
                <div style={styles.small}>
                  Saved as ID <b>{restaurantId}</b>
                </div>

                {publicLink ? (
                  <button type="button" style={styles.btn2} onClick={() => nav(publicLink)}>
                    View public page →
                  </button>
                ) : null}
              </>
            ) : null}
          </div>

          {saveErr ? (
            <div style={styles.err}>
              <b>Error:</b> {saveErr}
            </div>
          ) : null}

          <div style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
            By saving your restaurant profile you agree to the{" "}
            <Link to="/terms" style={{ color: "#555", textDecoration: "underline" }}>
              Terms of Service
            </Link>
            .
          </div>
        </form>
      </div>

      <div style={{ height: 14 }} />

      <div style={styles.card}>
        <div style={styles.h}>Step 2 — Upload menu PDF</div>
        <div style={styles.small}>This becomes active after Step 1 is saved.</div>

        <form onSubmit={uploadPdf} style={{ marginTop: 12 }}>
          <div style={styles.row}>
            <input
              type="file"
              accept="application/pdf"
              disabled={!restaurantId || uploading}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <button type="submit" style={styles.btn} disabled={!restaurantId || !file || uploading}>
              {uploading ? "Uploading…" : "Upload + Parse"}
            </button>

            {restaurantId ? (
              <button type="button" style={styles.btn2} onClick={() => nav(`/menus/${encodeURIComponent(String(restaurantId))}`)}>
                View menu →
              </button>
            ) : null}
          </div>

          {!restaurantId ? (
            <div style={{ marginTop: 10, ...styles.small }}>Save the restaurant profile first to enable upload.</div>
          ) : null}

          {uploadErr ? (
            <div style={styles.err}>
              <b>Error:</b> {uploadErr}
            </div>
          ) : null}

          {uploadOk ? (
            <div style={styles.ok}>
              <b>Success.</b> Menu parsed and saved.
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}