import { useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

// ---------- helpers ----------
function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 64);
}

function isEmail(x) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x || "").trim());
}

// ---------- options ----------
const CUISINES = [
  ["american", "American"],
  ["bbq", "BBQ"],
  ["breakfast_brunch", "Breakfast / Brunch"],
  ["burgers", "Burgers"],
  ["cafe_coffee", "Cafe / Coffee"],
  ["chicken", "Chicken"],
  ["chinese", "Chinese"],
  ["deli_sandwiches", "Deli / Sandwiches"],
  ["dessert_bakery", "Dessert / Bakery"],
  ["fast_food", "Fast Food"],
  ["greek", "Greek"],
  ["healthy", "Healthy"],
  ["indian", "Indian"],
  ["italian", "Italian"],
  ["japanese", "Japanese"],
  ["korean", "Korean"],
  ["latin_mexican", "Mexican / Latin"],
  ["mediterranean", "Mediterranean"],
  ["middle_eastern", "Middle Eastern"],
  ["pizza", "Pizza"],
  ["seafood", "Seafood"],
  ["sushi", "Sushi"],
  ["thai", "Thai"],
  ["vegan_vegetarian", "Vegan / Vegetarian"],
  ["vietnamese", "Vietnamese"],
  ["wings", "Wings"],
  ["other", "Other"],
];

export default function RestaurantProfile() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [slug, setSlug] = useState("");

  const [restaurantId, setRestaurantId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const [menuFile, setMenuFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const RESTAURANTS_CREATE_URL = `${API}/restaurants`;
  const MENU_UPLOAD_URL = `${API}/menus/parse-file`;

  const slugPreview = useMemo(() => {
    return slug?.trim() ? slugify(slug) : slugify(name);
  }, [slug, name]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!cuisine) return false;
    if (!isEmail(email)) return false;
    return true;
  }, [name, cuisine, email]);

  const payload = useMemo(() => {
    const nm = name.trim();
    return {
      restaurant_name: nm,
      name: nm,
      cuisine: cuisine || null,
      slug: slugPreview || null,
      email: email.trim().toLowerCase(),
    };
  }, [name, cuisine, slugPreview, email]);

  async function saveRestaurant() {
    setStatus("");
    setUploadStatus("");

    if (!canSubmit) {
      if (!name.trim() || !cuisine)
        return setStatus("Restaurant name + cuisine required.");
      if (!isEmail(email))
        return setStatus("Valid email required.");
      return setStatus("Please complete required fields.");
    }

    setSaving(true);
    setStatus("Saving…");

    try {
      const res = await fetch(RESTAURANTS_CREATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || `Request failed (${res.status})`);

      const rid =
        data?.restaurant?.id ??
        data?.id ??
        data?.restaurant_id ??
        data?.restaurantId ??
        null;

      if (!rid)
        throw new Error(
          "Saved, but could not read restaurant id from response."
        );

      setRestaurantId(rid);
      setStatus("Saved ✅. Menu upload is now unlocked below.");
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err?.message || "Error saving"}`);
    } finally {
      setSaving(false);
    }
  }

  async function uploadMenuPdf() {
    setUploadStatus("");

    if (!restaurantId)
      return setUploadStatus(
        "Create the restaurant first to unlock menu upload."
      );
    if (!menuFile)
      return setUploadStatus("Choose a PDF file first.");

    setUploading(true);
    setUploadStatus("Uploading + parsing…");

    try {
      const fd = new FormData();
      fd.append("file", menuFile);
      fd.append("restaurant_name", name.trim());
      if (cuisine) fd.append("cuisine", cuisine);

      const res = await fetch(MENU_UPLOAD_URL, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || `Upload failed (${res.status})`);

      setUploadStatus("Menu uploaded ✅");
    } catch (err) {
      console.error(err);
      setUploadStatus(`Upload error: ${err?.message || "failed"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 920, margin: "0 auto" }}>
      <h1>Restaurant Signup</h1>
      <p>Submit basic info → then menu upload appears.</p>

      <div style={{ marginBottom: 12 }}>
        <div>API: {API}</div>
        <div>Slug preview: /{slugPreview || "your-restaurant"}</div>
        {restaurantId && <div>Created: #{restaurantId}</div>}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Email *</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <label>Restaurant Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <label>Cuisine *</label>
        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        >
          <option value="">Select cuisine</option>
          {CUISINES.map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        <label>Slug (optional)</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <button onClick={saveRestaurant} disabled={saving || !canSubmit}>
          {saving ? "Submitting…" : "Submit (Create Restaurant)"}
        </button>

        <div style={{ marginTop: 10 }}>{status}</div>
      </div>

      {restaurantId && (
        <div>
          <h3>Upload Menu (PDF)</h3>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={uploadMenuPdf}
            disabled={uploading || !menuFile}
          >
            {uploading ? "Uploading…" : "Upload PDF"}
          </button>
          <div style={{ marginTop: 10 }}>{uploadStatus}</div>
        </div>
      )}
    </div>
  );
}


