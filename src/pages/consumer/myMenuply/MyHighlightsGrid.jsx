/**
 * Instagram-inspired square media grid for My Highlights.
 * Preview: first MY_HIGHLIGHTS_PREVIEW_COUNT tiles; See all → full page.
 */

import { Link } from "react-router-dom";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import { MY_HIGHLIGHTS_PREVIEW_COUNT } from "./myMenuplyPresentation.js";
import { MY_MENUPLY_HIGHLIGHTS_PATH } from "../../../lib/myMenuplyRoutes.js";
import * as s from "./myMenuplyStyles.js";

function HighlightTile({ card, readOnly = false, onDelete, deleteBusy = false }) {
  const canDelete = !readOnly && card?.deleteKind && typeof onDelete === "function";
  const { open, dismiss, bind } = useLongPressReveal(canDelete);
  const isVideo = Boolean(card.videoUrl) || card.media_kind === "video";
  const pending = Boolean(card.pending);

  return (
    <div
      style={{
        ...styles.tile,
        ...(pending ? styles.tilePending : null),
      }}
      data-testid={pending ? "my-highlight-pending" : "top-highlight-item"}
      data-media={isVideo ? "video" : "photo"}
      data-pending={pending ? "true" : "false"}
      {...bind}
    >
      {isVideo ? (
        <video
          src={card.videoUrl}
          style={styles.media}
          muted
          playsInline
          preload="metadata"
          data-testid="my-highlight-video"
        />
      ) : card.image ? (
        <img src={card.image} alt="" style={styles.media} loading="lazy" />
      ) : (
        <div style={styles.placeholder}>📷</div>
      )}
      {isVideo ? (
        <span style={styles.videoBadge} aria-hidden="true" data-testid="my-highlight-video-badge">
          ▶
        </span>
      ) : null}
      {pending ? (
        <span style={styles.pendingBadge} data-testid="my-highlight-pending-badge">
          Not saved
        </span>
      ) : null}
      {open ? (
        <button
          type="button"
          style={s.mealHolderDelete}
          data-testid="top-highlight-delete"
          aria-label={`Delete ${card.label || "highlight"}`}
          disabled={deleteBusy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (deleteBusy) return;
            dismiss();
            onDelete?.(card);
          }}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

/**
 * @param {object} props
 * @param {boolean} [props.preview] when true, show only first X tiles + See all if overflow
 */
export default function MyHighlightsGrid({
  cards = [],
  readOnly = false,
  onDelete,
  deleteBusy = false,
  onAdd,
  onSave,
  saveBusy = false,
  pendingCount = 0,
  preview = true,
  seeAllHref = MY_MENUPLY_HIGHLIGHTS_PATH,
  previewCount = MY_HIGHLIGHTS_PREVIEW_COUNT,
}) {
  const empty = !cards.length;
  if (readOnly && empty) return null;

  const canAdd = !readOnly && typeof onAdd === "function";
  const overflow = preview && cards.length > Number(previewCount);
  const visible = preview ? cards.slice(0, Number(previewCount)) : cards;

  return (
    <div style={s.presentationBlock} data-testid="top-highlights">
      <div style={styles.sectionHeadRow}>
        <h3 style={s.sectionTitleQuiet}>My Highlights</h3>
        <div style={styles.headAside}>
          {overflow ? (
            <Link
              to={seeAllHref}
              style={styles.seeAll}
              data-testid="my-highlights-see-all"
            >
              See all ({cards.length})
            </Link>
          ) : null}
          {canAdd ? (
            <button
              type="button"
              style={styles.addIconBtn}
              data-testid="my-highlights-add"
              aria-label="Add a highlight photo or video"
              onClick={() => onAdd?.()}
            >
              <span aria-hidden="true">+</span>
            </button>
          ) : null}
        </div>
      </div>
      {!readOnly ? (
        <p style={styles.purposeCopy} data-testid="my-highlights-purpose">
          Photos and short videos about you, your food, or whatever you want to share.
        </p>
      ) : null}
      {pendingCount > 0 && canAdd ? (
        <div style={styles.saveRow} data-testid="my-highlights-save-row">
          <p style={styles.pendingHint}>
            {pendingCount === 1
              ? "1 item ready — tap Save to add it to your profile."
              : `${pendingCount} items ready — tap Save to add them to your profile.`}
          </p>
          <button
            type="button"
            style={styles.saveBtn}
            data-testid="my-highlights-save"
            disabled={saveBusy}
            onClick={() => onSave?.()}
          >
            {saveBusy ? "Saving…" : "Save"}
          </button>
        </div>
      ) : null}
      {empty ? (
        <p style={styles.emptyHint} data-testid="my-highlights-empty">
          No highlights yet. Tap + to add a photo or video, then Save.
        </p>
      ) : (
        <div style={styles.grid} data-testid="my-highlights-grid">
          {visible.map((card) => (
            <HighlightTile
              key={card.key}
              card={card}
              readOnly={readOnly}
              onDelete={onDelete}
              deleteBusy={deleteBusy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  sectionHeadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  headAside: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: 700,
    color: "#14532d",
    textDecoration: "none",
  },
  saveRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    margin: "0 0 12px",
  },
  pendingHint: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.35,
    color: "#b45309",
    fontWeight: 600,
  },
  saveBtn: {
    appearance: "none",
    border: "none",
    background: "#14532d",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 750,
    cursor: "pointer",
    flexShrink: 0,
  },
  addIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "1px solid #a7f3d0",
    background: "#ecfdf5",
    color: "#14532d",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    padding: 0,
  },
  purposeCopy: {
    margin: "0 0 12px",
    fontSize: 13,
    lineHeight: 1.4,
    color: "#64748b",
    fontWeight: 500,
  },
  emptyHint: {
    margin: "0 0 4px",
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 2,
    width: "100%",
  },
  tile: {
    position: "relative",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    background: "#ecfdf5",
  },
  tilePending: {
    outline: "2px dashed #f59e0b",
    outlineOffset: -2,
  },
  media: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    background: "linear-gradient(180deg, #ecfdf5, #d1fae5)",
  },
  videoBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    background: "rgba(15, 23, 42, 0.72)",
    color: "#fff",
    fontSize: 10,
    display: "grid",
    placeItems: "center",
    lineHeight: 1,
  },
  pendingBadge: {
    position: "absolute",
    left: 6,
    top: 6,
    borderRadius: 999,
    background: "rgba(180, 83, 9, 0.92)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    lineHeight: 1.2,
  },
};
