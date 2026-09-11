/**
 * In-feed video compose — reuses EatingCompose in feedMode (video required).
 * Guests may publish ate / want / review via public API after Terms gate.
 */

import { useState } from "react";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import {
  notifyFeedVideoPosted,
  postFeedAteVideo,
  postFeedCookingVideo,
  postFeedReviewVideo,
  postFeedWantVideo,
  postGuestFeedAteVideo,
  postGuestFeedReviewVideo,
  postGuestFeedWantVideo,
} from "../../../lib/feedVideoCompose.js";
import { LEGAL_VERSIONS } from "../../../content/legal.js";
import { storeGuestFeedClaimSession } from "../../../lib/guestFeedClaimSession.js";
import { markGuestPublicationConsentAccepted } from "../../../lib/guestLegalConsentSession.js";
import EatingComposeSheet from "../../../pages/consumer/myMenuply/EatingComposeSheet.jsx";
import GuestFeedVideoConsentGate from "./GuestFeedVideoConsentGate.jsx";
import GuestFeedVideoNextStep from "./GuestFeedVideoNextStep.jsx";

function resolveMarket() {
  if (typeof window === "undefined") return { city: "Los Angeles", state: "CA" };
  const detected = readDetectedLocation(window.localStorage);
  const city = String(detected?.city || "").trim();
  const state = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (city && state) return { city, state };
  return { city: "Los Angeles", state: "CA" };
}

export default function FeedVideoComposeOverlay({
  open,
  category = "ate",
  mediaSource = "camera",
  openLibraryOnMount = false,
  initialWhereType = null,
  onClose,
}) {
  const { isAuthenticated } = useConsumer();
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(null);
  const [error, setError] = useState("");
  const [pendingPayload, setPendingPayload] = useState(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [showGuestNextStep, setShowGuestNextStep] = useState(false);
  const market = resolveMarket();

  if (!open || !category) return null;

  function onUploadProgress(p) {
    const pct = Number(p?.percent);
    if (Number.isFinite(pct)) setUploadPercent(Math.max(0, Math.min(100, Math.round(pct))));
  }

  async function publishAuthenticated(payload) {
    const withProgress = { ...payload, onUploadProgress };
    if (payload.category === "want") {
      await postFeedWantVideo(withProgress);
    } else if (payload.category === "reviews") {
      await postFeedReviewVideo(withProgress);
    } else if (payload.category === "cooking") {
      await postFeedCookingVideo(withProgress);
    } else {
      await postFeedAteVideo(withProgress);
    }
    notifyFeedVideoPosted();
    onClose?.();
  }

  async function publishGuest(payload) {
    if (payload.category === "cooking") {
      const err = new Error("Sign in to post What's Cooking @home");
      err.code = "auth_required";
      throw err;
    }
    let result;
    const opts = { onUploadProgress };
    if (payload.category === "want") {
      result = await postGuestFeedWantVideo(payload, opts);
    } else if (payload.category === "reviews") {
      result = await postGuestFeedReviewVideo(payload, opts);
    } else {
      result = await postGuestFeedAteVideo(payload, opts);
    }

    markGuestPublicationConsentAccepted(
      LEGAL_VERSIONS.consumerTerms,
      LEGAL_VERSIONS.privacyPolicy
    );

    const claimToken = result?.claim?.claim_token || result?.claim_token;
    if (claimToken) {
      storeGuestFeedClaimSession({ claimToken });
    }

    notifyFeedVideoPosted();
    setConsentOpen(false);
    setPendingPayload(null);
    setShowGuestNextStep(true);
    onClose?.();
  }

  async function handleSubmit(payload) {
    if (!isAuthenticated) {
      setPendingPayload(payload);
      setConsentOpen(true);
      setError("");
      return;
    }
    setBusy(true);
    setUploadPercent(0);
    setError("");
    try {
      await publishAuthenticated(payload);
    } catch (err) {
      setError(err?.message || "Unable to post video");
      throw err;
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  }

  async function handleGuestConsentConfirm() {
    if (!pendingPayload) return;
    setBusy(true);
    setUploadPercent(0);
    setError("");
    try {
      await publishGuest(pendingPayload);
    } catch (err) {
      if (err?.code === "legal_consent_required" || err?.code === "legal_consent_version_mismatch") {
        setError("Accept the current Terms of Use to publish.");
      } else {
        setError(err?.message || "Unable to post video");
      }
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  }

  function handleConsentCancel() {
    if (busy) return;
    setConsentOpen(false);
    setPendingPayload(null);
  }

  function handleGuestNextDismiss() {
    setShowGuestNextStep(false);
  }

  return (
    <>
      <EatingComposeSheet
        open={open && !consentOpen}
        onClose={() => {
          if (!busy && !consentOpen) onClose?.();
        }}
        defaultCategory={category}
        mediaSource={mediaSource}
        openLibraryOnMount={openLibraryOnMount}
        initialWhereType={initialWhereType}
        busy={busy}
        uploadPercent={uploadPercent}
        feedMode
        onSubmit={handleSubmit}
        locationCity={market.city}
        locationState={market.state}
      />
      <GuestFeedVideoConsentGate
        open={consentOpen}
        busy={busy}
        onCancel={handleConsentCancel}
        onConfirm={handleGuestConsentConfirm}
      />
      {showGuestNextStep ? <GuestFeedVideoNextStep onDismiss={handleGuestNextDismiss} /> : null}
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
