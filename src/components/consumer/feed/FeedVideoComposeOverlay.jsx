/**
 * In-feed video compose — reuses EatingCompose in feedMode (video required).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import {
  notifyFeedVideoPosted,
  postFeedAteVideo,
  postFeedReviewVideo,
  postFeedWantVideo,
} from "../../../lib/feedVideoCompose.js";
import EatingComposeSheet from "../../../pages/consumer/myMenuply/EatingComposeSheet.jsx";

function resolveMarket() {
  if (typeof window === "undefined") return { city: "Los Angeles", state: "CA" };
  const detected = readDetectedLocation(window.localStorage);
  const city = String(detected?.city || "").trim();
  const state = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (city && state) return { city, state };
  return { city: "Los Angeles", state: "CA" };
}

export default function FeedVideoComposeOverlay({ open, category = "ate", onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const market = resolveMarket();

  if (!open || !category) return null;

  async function handleSubmit(payload) {
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/feed")}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (payload.category === "want") {
        await postFeedWantVideo(payload);
      } else if (payload.category === "reviews") {
        await postFeedReviewVideo(payload);
      } else {
        await postFeedAteVideo(payload);
      }
      notifyFeedVideoPosted();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to post video");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <EatingComposeSheet
        open={open}
        onClose={() => {
          if (!busy) onClose?.();
        }}
        defaultCategory={category}
        mediaSource="camera"
        openLibraryOnMount={false}
        busy={busy}
        feedMode
        onSubmit={handleSubmit}
        locationCity={market.city}
        locationState={market.state}
      />
      {error ? (
        <p
          role="alert"
          data-testid="feed-video-compose-error"
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: "calc(var(--feed-primary-nav-h, 72px) + 16px)",
            zIndex: 1200,
            margin: 0,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(127,29,29,0.92)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {error}
        </p>
      ) : null}
    </>
  );
}
