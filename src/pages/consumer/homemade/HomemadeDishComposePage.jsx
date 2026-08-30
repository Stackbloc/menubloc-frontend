import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../../components/StickyPageHeader.jsx";
import BottomNav from "../../../components/BottomNav.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import {
  createHomemadeDish,
  uploadHomemadeDishPhoto,
  homemadeDishPath,
} from "../../../lib/homemadeDishApi.js";
import { captureEvent } from "../../../services/posthog.js";
import * as s from "../myMenuply/myMenuplyStyles.js";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${s.BORDER_INPUT || "#86efac"}`,
  fontSize: 15,
  marginBottom: 12,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#14532d",
  marginBottom: 6,
};

function emptyIngredient() {
  return { ingredient: "", quantity: "", unit: "" };
}

export default function HomemadeDishComposePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { consumer, loading: authLoading } = useConsumer();

  const [name, setName] = useState(searchParams.get("name") || "");
  const [description, setDescription] = useState("");
  const [preparation, setPreparation] = useState("");
  const [servings, setServings] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [ingredients, setIngredients] = useState([emptyIngredient(), emptyIngredient()]);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const sourceMenuItemId = searchParams.get("source_menu_item_id") || null;

  if (!authLoading && !consumer) {
    return (
      <div style={s.page}>
        <StickyPageHeader title="Create Homemade Dish" backTo="/my-menuply" />
        <p style={{ marginTop: 24 }}>Sign in to share how you make it.</p>
        <Link to={`/account/login?next=${encodeURIComponent("/my-menuply/homemade/create")}`}>
          Sign in
        </Link>
        <BottomNav />
      </div>
    );
  }

  function updateIngredient(index, field, value) {
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  }

  function removeIngredient(index) {
    setIngredients((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handlePhoto(file) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const up = await uploadHomemadeDishPhoto(file);
      setPhotoUrl(up.photo_url || up.url || null);
    } catch (e) {
      setError(e.message || "Photo upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        preparation_instructions: preparation.trim() || null,
        servings: servings.trim() ? Number(servings) : null,
        visibility,
        photo_url: photoUrl,
        video_url: videoUrl,
        source_menu_item_id: sourceMenuItemId ? Number(sourceMenuItemId) : null,
        ingredients: ingredients
          .map((row) => ({
            ingredient: row.ingredient.trim(),
            quantity: row.quantity !== "" ? row.quantity : null,
            unit: row.unit.trim() || null,
          }))
          .filter((row) => row.ingredient),
      };
      const res = await createHomemadeDish(payload);
      captureEvent("homemade_dish_created", {
        homemade_dish_id: res.dish?.id,
        source_menu_item_id: sourceMenuItemId,
        source_surface: sourceMenuItemId ? "show_me_how" : "compose",
      });
      navigate(homemadeDishPath(res.dish.id));
    } catch (err) {
      setError(err.message || "Could not create dish");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={s.page} data-testid="homemade-dish-compose">
      <StickyPageHeader title="Create Homemade Dish" backTo="/my-menuply" />
      <p style={{ ...s.lead, color: "#334155", marginTop: 16, marginBottom: 20 }}>
        Share structured ingredients and how you make it — not a separate recipe app.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle} htmlFor="hd-name">Dish name</label>
        <input
          id="hd-name"
          style={inputStyle}
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          placeholder="Chicken Parmesan"
          required
          maxLength={160}
        />

        <label style={labelStyle} htmlFor="hd-desc">Description</label>
        <textarea
          id="hd-desc"
          style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          placeholder="Short description of your dish"
          maxLength={2000}
        />

        <label style={labelStyle}>Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(ev) => handlePhoto(ev.target.files?.[0])}
          disabled={busy}
          style={{ marginBottom: 12 }}
        />
        {photoUrl ? (
          <img
            src={photoUrl.startsWith("http") ? photoUrl : `${import.meta.env.VITE_API_BASE_URL || "https://menubloc-backend-production.up.railway.app"}${photoUrl}`}
            alt=""
            style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, marginBottom: 12 }}
          />
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={labelStyle}>Ingredients</span>
          <button type="button" onClick={addIngredient} style={{ fontSize: 13, color: "#15803d" }}>
            + Add ingredient
          </button>
        </div>
        {ingredients.map((row, index) => (
          <div key={`ing-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px auto", gap: 8, marginBottom: 8 }}>
            <input
              style={{ ...inputStyle, marginBottom: 0 }}
              value={row.ingredient}
              onChange={(ev) => updateIngredient(index, "ingredient", ev.target.value)}
              placeholder="Ingredient"
            />
            <input
              style={{ ...inputStyle, marginBottom: 0 }}
              value={row.quantity}
              onChange={(ev) => updateIngredient(index, "quantity", ev.target.value)}
              placeholder="Qty"
              inputMode="decimal"
            />
            <input
              style={{ ...inputStyle, marginBottom: 0 }}
              value={row.unit}
              onChange={(ev) => updateIngredient(index, "unit", ev.target.value)}
              placeholder="Unit"
            />
            <button type="button" onClick={() => removeIngredient(index)} aria-label="Remove" style={{ border: "none", background: "transparent" }}>
              ×
            </button>
          </div>
        ))}

        <label style={labelStyle} htmlFor="hd-prep">Preparation</label>
        <textarea
          id="hd-prep"
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
          value={preparation}
          onChange={(ev) => setPreparation(ev.target.value)}
          placeholder="Steps to prepare this dish"
          maxLength={8000}
        />

        <label style={labelStyle} htmlFor="hd-servings">Servings (optional)</label>
        <input
          id="hd-servings"
          style={inputStyle}
          value={servings}
          onChange={(ev) => setServings(ev.target.value.replace(/[^\d]/g, ""))}
          placeholder="Leave blank if unknown"
          inputMode="numeric"
        />

        <label style={labelStyle} htmlFor="hd-vis">Visibility</label>
        <select id="hd-vis" style={inputStyle} value={visibility} onChange={(ev) => setVisibility(ev.target.value)}>
          <option value="public">Public</option>
          <option value="connections">Connections only</option>
          <option value="private">Private</option>
        </select>

        {error ? <p style={{ color: "#b91c1c", fontSize: 14 }}>{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !name.trim()}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "14px 16px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #15803d, #166534)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            cursor: busy ? "wait" : "pointer",
            opacity: busy || !name.trim() ? 0.6 : 1,
          }}
        >
          {busy ? "Publishing…" : "Publish Homemade Dish"}
        </button>
      </form>
      <BottomNav />
    </div>
  );
}
