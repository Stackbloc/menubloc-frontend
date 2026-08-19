/**
 * I'm Eating At + optional Join Me.
 * Status report first; Join Me is a spontaneous follow-up, not Invite to Eat.
 */

import React, { useEffect, useMemo, useState } from "react";
import ShareModal from "../share/ShareModal.jsx";
import ImEatingComposer from "./ImEatingComposer.jsx";
import EatingMediaAttach from "./EatingMediaAttach.jsx";
import GuestContributeNextStep from "./GuestContributeNextStep.jsx";
import {
  activateJoinMe,
  createImEating,
  createWhatIAteToday,
  endJoinMe,
  resolveConsumerMediaUrl,
  uploadFoodActivityPhoto,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import {
  createPublicFoodActivity,
  uploadPublicFoodActivityPhoto,
  asRestaurantPlace,
  asDishPlace,
} from "../../lib/foodActivityApi.js";
import { defaultWhatIAteMealPeriod } from "../../lib/whatIAteTodayMealPeriod.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { readOptionalReporterCoords } from "../../lib/guestReporterSession.js";
import { buildJoinMeShareData, formatJoinMeLocationLabel } from "../../lib/joinMeShare.js";

function relativeAgo(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hr ago";
  if (hours < 48) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function locationOf(activity, restaurant) {
  return formatJoinMeLocationLabel({
    restaurant_name: activity?.restaurant_name || restaurant?.restaurant_name,
    address_line1: activity?.restaurant_address_line1 || restaurant?.address_line1,
    city: activity?.restaurant_city || restaurant?.city,
    state: activity?.restaurant_state || restaurant?.state,
    location_label: activity?.location_label,
  });
}

function resolvedFoodName({ foodName, menuItem, comment, skipMenuItem }) {
  const fromItem = String(menuItem?.item_name || "").trim();
  if (fromItem) return fromItem;
  const fromField = String(foodName || "").trim();
  if (fromField) return fromField;
  const fromComment = String(comment || "").trim();
  if (fromComment && skipMenuItem) return fromComment.slice(0, 120);
  return "";
}

export default function ImEatingAtPanel({
  compact = false,
  onPosted = null,
  disabled = false,
  initialRestaurant = null,
  initialMenuItem = null,
  lockRestaurant = false,
  skipMenuItem = false,
}) {
  const { isAuthenticated } = useConsumer();
  const [restaurant, setRestaurant] = useState(() => asRestaurantPlace(initialRestaurant));
  const [menuItem, setMenuItem] = useState(() => asDishPlace(initialMenuItem));
  const [foodName, setFoodName] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastPosted, setLastPosted] = useState(null);
  const [joinMe, setJoinMe] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const next = asRestaurantPlace(initialRestaurant);
    if (next?.restaurant_id) setRestaurant(next);
  }, [initialRestaurant]);

  useEffect(() => {
    const next = asDishPlace(initialMenuItem);
    if (next?.menu_item_id) {
      setMenuItem(next);
      if (next.item_name) setFoodName(next.item_name);
    }
  }, [initialMenuItem]);

  const shareData = useMemo(() => {
    if (!joinMe?.invitation_token && !joinMe?.url) return null;
    return buildJoinMeShareData({
      token: joinMe.invitation_token,
      url: joinMe.url,
      organizerName: joinMe.organizer_display_name,
      restaurantName: joinMe.restaurant_name || lastPosted?.restaurant_name,
      addressLine1: joinMe.restaurant_address_line1 || lastPosted?.restaurant_address_line1,
      city: joinMe.restaurant_city || lastPosted?.restaurant_city,
      state: joinMe.restaurant_state || lastPosted?.restaurant_state,
      locationLabel: joinMe.location_label || lastPosted?.location_label,
    });
  }, [joinMe, lastPosted]);

  async function handleShare(e) {
    e.preventDefault();
    if (!restaurant?.restaurant_id) {
      setError("Choose a specific restaurant location.");
      return;
    }
    const name = resolvedFoodName({ foodName, menuItem, comment, skipMenuItem });
    if (!menuItem?.menu_item_id && !name && !comment.trim()) {
      setError(
        skipMenuItem
          ? "Say what's good today."
          : "Name what you ate, pick a menu item, or add a brief note."
      );
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      let photo_url;
      if (mediaFile) {
        const up = isAuthenticated
          ? await uploadFoodActivityPhoto(mediaFile)
          : await uploadPublicFoodActivityPhoto(mediaFile);
        photo_url = up.photo_url || undefined;
      }

      const coords = await readOptionalReporterCoords();
      const note =
        comment.trim() ||
        (name && !menuItem?.menu_item_id ? name : "") ||
        null;
      const body = {
        restaurant_id: restaurant.restaurant_id,
        menu_item_id: menuItem?.menu_item_id || null,
        menu_id: menuItem?.menu_id || null,
        comment: note,
        photo_url,
        visibility: isAuthenticated ? visibility : "public",
        lat: coords.lat,
        lng: coords.lng,
      };

      const data = isAuthenticated
        ? await createImEating(body)
        : await createPublicFoodActivity(body);

      const activity = data.activity || null;

      if (isAuthenticated && activity) {
        const diaryName =
          name ||
          activity.item_name ||
          activity.comment ||
          restaurant.restaurant_name ||
          "Food";
        await createWhatIAteToday({
          food_name: diaryName,
          menu_item_id: menuItem?.menu_item_id || undefined,
          restaurant_id: restaurant.restaurant_id,
          comment: note || undefined,
          photo_url,
          eaten_on: whatIAteTodayLocalDate(),
          meal_period: defaultWhatIAteMealPeriod(),
        }).catch(() => {
          /* diary mirror is best-effort; food_activity is canonical for restaurant feed */
        });
      }

      setLastPosted(activity);
      setJoinMe(null);
      setNotice(
        data.notice ||
          "Shared as user-reported food activity. Menuply does not verify that you purchased this item."
      );
      if (!lockRestaurant) setRestaurant(null);
      setMenuItem(null);
      setFoodName("");
      setMediaFile(null);
      setComment("");
      setVisibility("public");
      if (onPosted) onPosted(activity);
    } catch (err) {
      setError(err.message || "Unable to share");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinMe() {
    if (!lastPosted?.id) return;
    setBusy(true);
    setError("");
    try {
      const data = await activateJoinMe({ food_activity_id: lastPosted.id });
      setJoinMe(data.invitation || null);
      setNotice(data.notice || "Join Me is on.");
      setShareOpen(true);
    } catch (err) {
      setError(err.message || "Unable to start Join Me");
    } finally {
      setBusy(false);
    }
  }

  async function handleEndJoinMe() {
    const token = joinMe?.invitation_token;
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await endJoinMe(token);
      setJoinMe(null);
      setNotice("Join Me has ended.");
      setShareOpen(false);
    } catch (err) {
      setError(err.message || "Unable to end Join Me");
    } finally {
      setBusy(false);
    }
  }

  const place = lastPosted ? locationOf(lastPosted, restaurant) : "";
  const showFoodName = !menuItem?.menu_item_id && !skipMenuItem;

  return (
    <div data-testid="im-eating-at-panel">
      {error ? <p style={styles.error}>{error}</p> : null}
      {notice ? <p style={styles.notice}>{notice}</p> : null}

      <form onSubmit={handleShare} style={styles.form}>
        <EatingMediaAttach disabled={busy || disabled} file={mediaFile} onFileChange={setMediaFile} />
        {showFoodName ? (
          <>
            <label style={styles.label} htmlFor="im-eating-food-name">
              What did you eat?
            </label>
            <input
              id="im-eating-food-name"
              type="text"
              value={foodName}
              disabled={busy || disabled}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="Spicy chicken sandwich"
              maxLength={120}
              style={styles.input}
              data-testid="im-eating-food-name"
            />
          </>
        ) : null}
        <ImEatingComposer
          restaurant={restaurant}
          menuItem={menuItem}
          onRestaurantChange={setRestaurant}
          onMenuItemChange={(next) => {
            setMenuItem(next);
            if (next?.item_name) setFoodName(next.item_name);
          }}
          comment={comment}
          onCommentChange={setComment}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          disabled={busy || disabled}
          isAuthenticated={isAuthenticated}
          lockRestaurant={lockRestaurant}
          skipMenuItem={skipMenuItem}
        />
        <button type="submit" style={styles.primary} disabled={busy || disabled}>
          {busy ? "Sharing…" : skipMenuItem ? "Post what's good today" : "Publish"}
        </button>
      </form>

      {lastPosted ? (
        <div data-testid="im-eating-at-posted" style={styles.posted}>
          <div style={styles.kicker}>I'm Eating At</div>
          {lastPosted.photo_url ? (
            <img
              src={resolveConsumerMediaUrl(lastPosted.photo_url)}
              alt=""
              style={styles.postedPhoto}
              data-testid="im-eating-posted-photo"
            />
          ) : null}
          <strong style={styles.place}>{place}</strong>
          <p style={styles.meta}>
            {[lastPosted.item_name || foodName, lastPosted.comment, relativeAgo(lastPosted.created_at)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {joinMe?.join_me_active !== false && joinMe?.invitation_token ? (
            <div style={styles.joinRow}>
              <p style={styles.joinOn}>Join Me is on — I'm here now.</p>
              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.primary}
                  disabled={busy}
                  onClick={() => setShareOpen(true)}
                >
                  Share Join Me
                </button>
                <button type="button" style={styles.secondary} disabled={busy} onClick={handleEndJoinMe}>
                  End
                </button>
              </div>
            </div>
          ) : !isAuthenticated ? (
            <GuestContributeNextStep identityAction="Join Me and a personal activity history" />
          ) : (
            <div style={styles.joinRow}>
              <p style={compact ? styles.hint : styles.joinLead}>
                Already here? Invite someone to come join you now — not a planned dinner.
              </p>
              <button
                type="button"
                data-testid="join-me-activate"
                style={styles.joinBtn}
                disabled={busy}
                onClick={handleJoinMe}
              >
                Join Me
              </button>
            </div>
          )}
        </div>
      ) : null}

      {shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          modalTitle="Share Join Me"
          shareData={shareData}
          analyticsContext={{ pageType: "join_me", foodActivityId: lastPosted?.id }}
        />
      ) : null}
    </div>
  );
}

const styles = {
  form: { display: "grid", gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: "#334155" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 15,
  },
  primary: {
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  secondary: {
    border: "1.5px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  joinBtn: {
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#0f172a",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },
  posted: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    display: "grid",
    gap: 8,
  },
  postedPhoto: {
    width: "100%",
    maxHeight: 240,
    objectFit: "cover",
    borderRadius: 10,
    display: "block",
  },
  kicker: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  place: { fontSize: 18, color: "#0f172a" },
  meta: { margin: 0, fontSize: 13, color: "#64748b" },
  joinRow: { display: "grid", gap: 8, marginTop: 4 },
  joinLead: { margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.45 },
  hint: { margin: 0, fontSize: 13, color: "#475569" },
  joinOn: { margin: 0, fontSize: 14, fontWeight: 700, color: "#14532d" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  error: { margin: "0 0 10px", color: "#b91c1c", fontSize: 14 },
  notice: { margin: "0 0 10px", color: "#14532d", fontSize: 14, fontWeight: 600 },
};
