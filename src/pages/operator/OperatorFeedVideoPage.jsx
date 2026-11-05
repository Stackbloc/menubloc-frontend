/**
 * Operator Feed video publish — restaurant profile as creator.
 * Uses existing claimed restaurant identity; no separate content account.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import OperatorProfileVideosPanel from "./OperatorProfileVideosPanel.jsx";
import DealMenuItemsPicker from "../owner/OwnerDealMenuItemsPicker.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  API_BASE,
  postRestaurantFeedVideo,
  uploadRestaurantFeedVideoMedia,
} from "../../lib/operatorApi.js";

/** Up to 3 dishes per restaurant clip (Andre 2026-11-04; diner clips stay at one). */
export const MAX_CLIP_DISHES = 3;

/** This restaurant's dishes with their CK ids (the ids Feed clips link to), one row per dish. */
export function clipDishesFromMenu(payload, restaurantId) {
  const seen = new Set();
  const out = [];
  for (const section of payload?.sections || []) {
    for (const item of section?.items || []) {
      const id = Number(item?.ck_menu_item_id);
      if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
      if (restaurantId && item?.restaurant_id != null && Number(item.restaurant_id) !== Number(restaurantId)) continue;
      const name = String(item?.name || item?.item_name || "").trim();
      if (!name) continue;
      seen.add(id);
      out.push({ id, name });
    }
  }
  return out;
}

const LABEL = { display: "block", fontWeight: 700, marginBottom: 6, fontSize: 14 };
const INPUT = {
  width: "100%",
  maxWidth: 520,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 15,
};

export default function OperatorFeedVideoPage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const restaurantName = selectedRestaurant?.restaurant_name || "your restaurant";

  const [kind, setKind] = useState("ate");
  const [foodName, setFoodName] = useState("");
  const [comment, setComment] = useState("");
  const [dishes, setDishes] = useState([]);
  const [menu, setMenu] = useState({ state: "idle", items: [] });
  const [videoFile, setVideoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!rid) return undefined;
    let alive = true;
    setMenu({ state: "loading", items: [] });
    setDishes([]);
    fetch(`${API_BASE}/public/restaurants/${encodeURIComponent(String(rid))}/menu`, { cache: "no-cache" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => alive && setMenu({ state: "ready", items: clipDishesFromMenu(data, rid) }))
      .catch(() => alive && setMenu({ state: "error", items: [] }));
    return () => {
      alive = false;
    };
  }, [rid]);

  function onDishesChange(next) {
    // The first dish names the clip when the title is still empty.
    if (!foodName.trim() && next[0]?.name) setFoodName(next[0].name);
    setDishes(next.slice(0, MAX_CLIP_DISHES));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!rid) {
      setError("Select a restaurant first.");
      return;
    }
    if (!videoFile) {
      setError("Choose a video to publish.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const upload = await uploadRestaurantFeedVideoMedia(rid, videoFile);
      const videoUrl = upload?.url || upload?.video_url || upload?.public_url;
      if (!videoUrl) {
        throw new Error(upload?.error || "Video upload failed");
      }
      await postRestaurantFeedVideo(rid, {
        kind,
        food_name: foodName.trim(),
        comment: comment.trim() || null,
        menu_item_id: dishes[0]?.id ?? null,
        applies_to_menu_item_ids: dishes.slice(1).map((d) => d.id),
        video_url: videoUrl,
      });
      setSuccess("Published to the national Feed as your restaurant profile.");
      setFoodName("");
      setComment("");
      setDishes([]);
      setVideoFile(null);
    } catch (err) {
      setError(err?.message || "Unable to publish Feed video");
    } finally {
      setBusy(false);
    }
  }

  return (
    <OperatorLayout title="Feed Video">
      <p style={{ maxWidth: 560, lineHeight: 1.5, color: "#334155" }}>
        Publish a public food video as <strong>{restaurantName}</strong>. Your restaurant profile
        is the creator — the same national Feed diners and guests use. Referenced menu items and
        restaurants appear as structured links in the Feed.
      </p>
      <p style={{ maxWidth: 560, lineHeight: 1.5, color: "#64748b", fontSize: 14 }}>
        Posting a <strong>deal or offer video</strong>? Use{" "}
        <Link to="/operator/deals" style={{ color: "#1F4E3D", fontWeight: 700 }}>
          Deals
        </Link>{" "}
        — upload the video on the deal to appear in Feed → Deals swipe.
      </p>

      {!rid ? (
        <p style={{ color: "#b45309", fontWeight: 600 }}>
          Select a claimed restaurant from the operator home screen to publish.
        </p>
      ) : (
        <form onSubmit={onSubmit} style={{ marginTop: 20, maxWidth: 560 }}>
          <label style={LABEL}>
            Video kind
            <select
              value={kind}
              onChange={(ev) => setKind(ev.target.value)}
              style={INPUT}
              disabled={busy}
            >
              <option value="ate">I'm serving / ate-style promo</option>
              <option value="want">Wanna eat / coming soon</option>
            </select>
          </label>

          <label style={{ ...LABEL, marginTop: 14 }}>
            Dish or title
            <input
              type="text"
              value={foodName}
              onChange={(ev) => setFoodName(ev.target.value)}
              style={INPUT}
              placeholder="Double burger"
              required
              disabled={busy}
            />
          </label>

          <label style={{ ...LABEL, marginTop: 14 }}>
            Caption
            <textarea
              value={comment}
              onChange={(ev) => setComment(ev.target.value)}
              style={{ ...INPUT, minHeight: 88, resize: "vertical" }}
              placeholder={`Our new double burger is here @${restaurantName}`}
              disabled={busy}
            />
          </label>

          <div style={{ marginTop: 14, maxWidth: 520 }}>
            <DealMenuItemsPicker
              items={menu.items}
              selected={dishes}
              onChange={onDishesChange}
              loading={menu.state === "loading"}
              disabled={busy}
              max={MAX_CLIP_DISHES}
              title="Dishes in this clip"
              hint="Pick up to 3 dishes from your menu. They show as tags on the clip in the Feed; the first is the main dish."
            />
            {menu.state === "error" ? (
              <p style={{ color: "#b45309", fontSize: 13, marginTop: 6 }}>Couldn’t load your menu. You can still publish with a title.</p>
            ) : null}
          </div>

          <label style={{ ...LABEL, marginTop: 14 }}>
            Video file
            <input
              type="file"
              accept="video/*"
              onChange={(ev) => setVideoFile(ev.target.files?.[0] || null)}
              disabled={busy}
            />
          </label>

          {error ? (
            <p role="alert" style={{ color: "#b91c1c", fontWeight: 600, marginTop: 12 }}>
              {error}
            </p>
          ) : null}
          {success ? (
            <p style={{ color: "#166534", fontWeight: 600, marginTop: 12 }}>
              {success}{" "}
              <Link to="/feed" style={{ color: "#1d4ed8" }}>
                Open Feed
              </Link>
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || !videoFile}
            style={{
              marginTop: 18,
              padding: "12px 18px",
              borderRadius: 8,
              border: "none",
              background: "#1F4E3D",
              color: "#fff",
              fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              opacity: busy || !videoFile ? 0.65 : 1,
            }}
          >
            {busy ? "Publishing…" : "Publish to Feed"}
          </button>
        </form>
      )}

      {rid ? <OperatorProfileVideosPanel restaurantId={rid} /> : null}
    </OperatorLayout>
  );
}
