/**
 * Input surface for Eating compose — kept off the presentation feed.
 */

import { useEffect } from "react";
import EatingCompose from "./EatingCompose.jsx";
import {
  CLEAR_STUCK_MEDIA_CHROME_EVENT,
  restoreDocumentScroll,
} from "./pendingHighlightMedia.js";
import {
  mobileDialogBackdrop,
  mobileDialogPanel,
  mobileDialogScrollBody,
  useMobileDialogMaxHeight,
} from "./mobileDialogLayout.js";

export default function EatingComposeSheet({
  open,
  onClose,
  defaultCategory = "ate",
  defaultMealPeriod = null,
  initialFile = null,
  mediaSource = "camera",
  openLibraryOnMount = false,
  busy = false,
  uploadPercent = null,
  feedMode = false,
  onSubmit,
  onPlanSchedule,
  followed = [],
  locationCity = null,
  locationState = null,
  inviteMeOutOpen = false,
  inviteMeOutAudience = "connections",
  inviteMeOutSelectedIds = [],
  inviteMeOutCandidates = [],
  initialWhereType = null,
  initialRestaurant = null,
  initialDish = null,
  identityLocked = false,
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onForceClose() {
      if (!busy) onClose?.();
    }
    window.addEventListener(CLEAR_STUCK_MEDIA_CHROME_EVENT, onForceClose);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener(CLEAR_STUCK_MEDIA_CHROME_EVENT, onForceClose);
      restoreDocumentScroll();
    };
  }, [open, onClose, busy]);

  const maxHeight = useMobileDialogMaxHeight(open);

  if (!open) return null;

  async function handleSubmit(payload) {
    await onSubmit?.(payload);
    onClose?.();
  }

  function handlePlanSchedule(payload) {
    onPlanSchedule?.(payload);
    onClose?.();
  }

  return (
    <div
      role="presentation"
      style={mobileDialogBackdrop()}
      data-testid="eating-compose-sheet"
      onClick={() => {
        if (!busy) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log food"
        style={{ ...mobileDialogPanel(maxHeight), padding: "16px 16px 12px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <p style={styles.title}>
            {identityLocked && defaultCategory === "reviews"
              ? `Review ${String(initialDish?.item_name || "").trim() || "this dish"}`
              : feedMode
              ? defaultCategory === "want"
                ? "Wanna Eat"
                : "I'm Eating"
              : defaultCategory === "want"
                ? "What I Want to Eat"
                : defaultCategory === "plan"
                  ? "Eating Plan"
                  : "What I'm Eating"}
          </p>
          <button
            type="button"
            style={styles.close}
            onClick={() => {
              if (!busy) onClose?.();
            }}
            aria-label="Close"
            disabled={busy}
          >
            ✕
          </button>
        </div>
        <div style={mobileDialogScrollBody}>
        <p style={styles.lead}>
          {identityLocked && defaultCategory === "reviews"
            ? "This video is already about this menu item. Record or upload — you do not pick the restaurant or dish again."
            : feedMode
            ? "Record a video for Feed. Tag restaurant or dish after if you like — optional caption below."
            : defaultCategory === "want"
              ? "Cuisine, restaurant, menu item, or a general food craving — no restaurant required."
              : defaultCategory === "plan"
                ? "Pick a place, then set the date and Join Me on the next step."
                : "Photo or video, restaurant or @home, meal time, then an optional comment."}
        </p>
        <EatingCompose
          key={`${defaultCategory}-${defaultMealPeriod || "auto"}-${mediaSource}-${feedMode ? "feed" : "hub"}-${initialWhereType || "where"}-${identityLocked ? "locked" : "open"}-${initialDish?.menu_item_id || "nodish"}-${initialFile?.name || (initialFile ? "blob" : "none")}`}
          busy={busy}
          uploadPercent={uploadPercent}
          defaultCategory={defaultCategory}
          defaultMealPeriod={defaultMealPeriod}
          initialFile={initialFile}
          mediaSource={mediaSource}
          openLibraryOnMount={openLibraryOnMount}
          feedMode={feedMode}
          onSubmit={handleSubmit}
          onPlanSchedule={handlePlanSchedule}
          followed={followed}
          locationCity={locationCity}
          locationState={locationState}
          inviteMeOutOpen={inviteMeOutOpen}
          inviteMeOutAudience={inviteMeOutAudience}
          inviteMeOutSelectedIds={inviteMeOutSelectedIds}
          inviteMeOutCandidates={inviteMeOutCandidates}
          initialWhereType={initialWhereType}
          initialRestaurant={initialRestaurant}
          initialDish={initialDish}
          identityLocked={identityLocked}
          inSheet
        />
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0f172a",
  },
  lead: {
    margin: "0 0 14px",
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.45,
  },
  close: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    lineHeight: 1,
    color: "#3C3C43",
    cursor: "pointer",
    flexShrink: 0,
  },
};
