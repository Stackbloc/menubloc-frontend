import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import ShareButton from "../components/share/ShareButton.jsx";
import {
  fetchHomemadeDish,
  likeHomemadeDish,
  unlikeHomemadeDish,
  saveHomemadeDish,
  unsaveHomemadeDish,
  listHomemadeDishComments,
  postHomemadeDishComment,
  buildHomemadeDishShareData,
} from "../lib/homemadeDishApi.js";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { captureEvent } from "../services/posthog.js";
import { API_BASE } from "../lib/api.js";

const BACKEND_BASE = String(API_BASE || "").replace(/\/$/, "");

function mediaUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${BACKEND_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}

function NutritionBlock({ nutrition, servings }) {
  if (!nutrition?.recipe_total && !nutrition?.per_serving) return null;
  const block = nutrition.per_serving || nutrition.recipe_total;
  const label = nutrition.per_serving ? "Per serving" : "Recipe total";
  const rows = [
    ["Calories", block.calories],
    ["Protein", block.protein_g != null ? `${block.protein_g} g` : null],
    ["Carbs", block.carbs_g != null ? `${block.carbs_g} g` : null],
    ["Fat", block.fat_g != null ? `${block.fat_g} g` : null],
    ["Fiber", block.fiber_g != null ? `${block.fiber_g} g` : null],
    ["Sugar", block.sugar_g != null ? `${block.sugar_g} g` : null],
    ["Sodium", block.sodium_mg != null ? `${block.sodium_mg} mg` : null],
  ].filter(([, v]) => v != null);

  if (!rows.length) return null;

  return (
    <section style={{ marginTop: 24 }} data-testid="homemade-nutrition">
      <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Nutrition</h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px" }}>
        {label}
        {servings && nutrition.per_serving ? ` · ${servings} servings` : ""}
        {" · "}
        <span style={{ fontStyle: "italic" }}>Calculated from ingredients</span>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{k}</div>
            <div style={{ fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomemadeComments({ dishId, consumer }) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listHomemadeDishComments(dishId)
      .then((res) => {
        if (!cancelled) setComments(res.comments || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [dishId]);

  async function submit() {
    const text = draft.trim();
    if (!text || !consumer || busy) return;
    setBusy(true);
    try {
      const res = await postHomemadeDishComment(dishId, text);
      setComments((prev) => [...prev, { ...res.comment, author_name: "You" }]);
      setDraft("");
      captureEvent("homemade_dish_commented", { homemade_dish_id: dishId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 28 }} id="homemade-comments">
      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Discussion</h2>
      {comments.map((c) => (
        <div key={c.id} style={{ marginBottom: 12, padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{c.author_name || "Diner"}</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{c.content}</div>
        </div>
      ))}
      {consumer ? (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            placeholder="Add a comment"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #cbd5e1" }}
            maxLength={2000}
          />
          <button type="button" onClick={submit} disabled={busy || !draft.trim()} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: "#15803d", color: "#fff", fontWeight: 600 }}>
            Post
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#64748b" }}>Sign in to comment.</p>
      )}
    </section>
  );
}

export default function HomemadeDishDetailPage() {
  const { id } = useParams();
  const { consumer } = useConsumer();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchHomemadeDish(id)
      .then((res) => {
        if (cancelled) return;
        setDish(res.dish);
        setLiked(res.dish?.liked_by_viewer === true);
        setSaved(res.dish?.saved_by_viewer === true);
        captureEvent("homemade_dish_viewed", {
          homemade_dish_id: res.dish?.id,
          canonical_food_id: res.dish?.food_entity_id,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  async function toggleLike() {
    if (!consumer) return;
    const next = !liked;
    setLiked(next);
    try {
      if (next) {
        await likeHomemadeDish(id);
        captureEvent("homemade_dish_liked", { homemade_dish_id: id });
      } else {
        await unlikeHomemadeDish(id);
      }
    } catch {
      setLiked(!next);
    }
  }

  async function toggleSave() {
    if (!consumer) return;
    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        await saveHomemadeDish(id);
        captureEvent("homemade_dish_saved", { homemade_dish_id: id });
      } else {
        await unsaveHomemadeDish(id);
      }
    } catch {
      setSaved(!next);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <StickyPageHeader title="Homemade" />
        <p>Loading…</p>
        <BottomNav />
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <StickyPageHeader title="Homemade" backTo="/search" />
        <p>{error || "Homemade dish not found."}</p>
        <BottomNav />
      </div>
    );
  }

  const photo = mediaUrl(dish.photo_url);
  const shareData = buildHomemadeDishShareData(dish);

  return (
    <div style={{ padding: "0 16px calc(var(--bottom-nav-h, 72px) + 16px)", maxWidth: 720, margin: "0 auto" }} data-testid="homemade-dish-detail">
      <StickyPageHeader title="Homemade" backTo="/search" />

      <div style={{ marginTop: 12 }}>
        <span style={{ display: "inline-block", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#15803d", background: "#dcfce7", padding: "4px 10px", borderRadius: 999 }}>
          Homemade
        </span>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "10px 0 4px", fontFamily: 'Georgia, "Times New Roman", serif' }}>
          {dish.name}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
          by {dish.creator_display_name || "Diner"}
        </p>
      </div>

      {photo ? (
        <img src={photo} alt="" style={{ width: "100%", borderRadius: 16, marginTop: 16, maxHeight: 360, objectFit: "cover" }} />
      ) : null}

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button type="button" onClick={toggleLike} disabled={!consumer} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid #cbd5e1", background: liked ? "#fef3c7" : "#fff" }}>
          {liked ? "Liked" : "Like"}
        </button>
        <ShareButton
          shareData={shareData}
          label="Share"
          size="compact"
          tone="ghost"
          onShare={() => captureEvent("homemade_dish_shared", { homemade_dish_id: dish.id })}
        />
        <button type="button" onClick={toggleSave} disabled={!consumer} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid #cbd5e1", background: saved ? "#dbeafe" : "#fff" }}>
          {saved ? "Saved" : "Save"}
        </button>
        <a href="#homemade-comments" style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid #cbd5e1", color: "#0f172a", textDecoration: "none" }}>
          Comment
        </a>
      </div>

      {dish.description ? (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Description</h2>
          <p style={{ margin: 0, lineHeight: 1.55, color: "#334155" }}>{dish.description}</p>
        </section>
      ) : null}

      {dish.ingredients?.length ? (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Ingredients</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            {dish.ingredients.map((ing) => (
              <li key={ing.id}>
                <strong>{ing.ingredient_name}</strong>
                {ing.quantity != null ? ` — ${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {dish.preparation_instructions ? (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Preparation</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55, color: "#334155" }}>
            {dish.preparation_instructions}
          </p>
        </section>
      ) : null}

      <NutritionBlock nutrition={dish.nutrition} servings={dish.servings} />

      <HomemadeComments dishId={dish.id} consumer={consumer} />

      {dish.is_owner ? (
        <p style={{ marginTop: 24, fontSize: 13, color: "#64748b" }}>
          This counts toward your <Link to="/my-menuply/month-in-food">Month in Food</Link> homemade activity.
        </p>
      ) : null}

      <BottomNav />
    </div>
  );
}
