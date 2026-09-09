/**
 * @home — home-cooked meal **photos** on the diner profile.
 * Videos use Multiplier category "What's Cooking @home" (Feed + may land here).
 *
 * Your view: short photo prompt + compact + Add → library media loader (no camera).
 * Connect / peer (readOnly): content only — never how-to or Add.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { homemadeDishPath } from "../../../lib/homemadeDishApi.js";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import { SectionHead } from "./myMenuplyBits.jsx";
import * as s from "./myMenuplyStyles.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

function dishPhoto(dish) {
  return resolveConsumerMediaUrl(dish?.photo_url || "");
}

function dishVideo(dish) {
  return resolveConsumerMediaUrl(dish?.video_url || "");
}

function HomeDishCell({ dish, readOnly, onDelete, deleteBusy }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const canDelete = !readOnly && typeof onDelete === "function";
  const { open, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);
  const photo = dishPhoto(dish);
  const video = dishVideo(dish);
  const name = dish?.name || "Home-cooked meal";
  const href = dish?.id || dish?.homemade_dish_id ? homemadeDishPath(dish.id || dish.homemade_dish_id) : null;
  const skipCaption =
    !name ||
    name === "Home-cooked meal" ||
    name === "What I'm Cooking" ||
    name === "What's Cooking @home";

  return (
    <div style={grid.cellWrap} data-testid="home-at-home-cell" {...bind}>
      <button
        type="button"
        style={grid.cellBtn}
        aria-label={name}
        onClick={() => {
          if (consumeArmedClick() || open) {
            dismiss();
            return;
          }
          if (photo || video) setLightboxOpen(true);
        }}
      >
        {video ? (
          <video src={video} muted playsInline preload="metadata" style={grid.img} />
        ) : photo ? (
          <img src={photo} alt="" style={grid.img} loading="lazy" />
        ) : (
          <div style={grid.placeholder}>🍽</div>
        )}
        {video ? <span style={grid.playBadge}>▶</span> : null}
        {!skipCaption ? <span style={grid.caption}>{name}</span> : null}
      </button>
      {open ? (
        <button
          type="button"
          style={s.mealHolderDelete}
          data-testid="home-at-home-delete"
          aria-label={`Delete ${name}`}
          disabled={deleteBusy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (deleteBusy) return;
            dismiss();
            onDelete?.(dish);
          }}
        >
          Delete
        </button>
      ) : null}
      {lightboxOpen && (photo || video) ? (
        <div
          role="presentation"
          style={grid.lightbox}
          onClick={() => setLightboxOpen(false)}
          data-testid="home-at-home-lightbox"
        >
          {video ? (
            <video
              src={video}
              controls
              playsInline
              autoPlay
              style={grid.lightboxImg}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img src={photo} alt={name} style={grid.lightboxImg} onClick={(e) => e.stopPropagation()} />
          )}
          {href ? (
            <Link to={href} style={grid.lightboxLink} onClick={(e) => e.stopPropagation()}>
              View dish
            </Link>
          ) : null}
          <button type="button" style={grid.lightboxClose} onClick={() => setLightboxOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function HomeAtHomeSection({
  dishes = [],
  readOnly = false,
  busy = false,
  error = "",
  onPhotoFile,
  onDelete,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const rows = Array.isArray(dishes)
    ? dishes.filter((d) => d && (d.photo_url || d.video_url || d.id))
    : [];
  const canAdd = !readOnly && typeof onPhotoFile === "function";

  if (readOnly && !rows.length) return null;

  return (
    <section style={{ ...s.presentationBlock, marginTop: 22 }} data-testid="home-at-home">
      <SectionHead
        title="@home"
        testId="home-at-home-head"
        subtitle={readOnly ? undefined : "Add photos of your home cooked meals."}
        aside={
          canAdd ? (
            pickerOpen ? null : (
              <button
                type="button"
                style={styles.compactAdd}
                data-testid="home-at-home-add"
                disabled={busy}
                onClick={() => setPickerOpen(true)}
              >
                <span aria-hidden="true">+</span> Add
              </button>
            )
          ) : null
        }
      />
      {error ? <p style={s.error}>{error}</p> : null}
      {canAdd && pickerOpen ? (
        <div style={styles.pickerWrap} data-testid="home-at-home-picker">
          <MenuplyMediaPicker
            key="home-at-home-photo-picker"
            onFile={(file) => {
              setPickerOpen(false);
              onPhotoFile?.(file);
            }}
            disabled={busy}
            source="library"
            allowPhoto
            allowVideo={false}
            showPreview={false}
            openOnMount
            testId="home-at-home-media-picker"
            ariaLabel="Add home-cooked meal photo"
          />
          <button
            type="button"
            style={styles.cancelPicker}
            data-testid="home-at-home-picker-cancel"
            onClick={() => setPickerOpen(false)}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {rows.length ? (
        <div style={grid.grid}>
          {rows.map((dish) => (
            <HomeDishCell
              key={dish.id || dish.homemade_dish_id || dish.photo_url}
              dish={dish}
              readOnly={readOnly}
              onDelete={onDelete}
              deleteBusy={busy}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  compactAdd: {
    appearance: "none",
    border: "1px dashed #cbd5e1",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 700,
    color: GREEN_MID,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
  },
  pickerWrap: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  cancelPicker: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: 4,
  },
};

const grid = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 4,
    marginTop: 12,
  },
  cellWrap: {
    position: "relative",
    aspectRatio: "1 / 1",
  },
  cellBtn: {
    display: "block",
    width: "100%",
    height: "100%",
    padding: 0,
    border: "none",
    borderRadius: 8,
    overflow: "hidden",
    background: "#f1f5f9",
    cursor: "pointer",
    position: "relative",
  },
  img: {
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
    background: "#f8fafc",
  },
  playBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "rgba(15,23,42,0.72)",
    color: "#fff",
    fontSize: 10,
    display: "grid",
    placeItems: "center",
  },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "18px 6px 6px",
    background: "linear-gradient(180deg, transparent, rgba(15,23,42,0.75))",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    textAlign: "left",
  },
  lightbox: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "rgba(15,23,42,0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  lightboxImg: {
    maxWidth: "min(920px, 100%)",
    maxHeight: "min(86vh, 100%)",
    objectFit: "contain",
    borderRadius: 8,
  },
  lightboxLink: {
    position: "absolute",
    left: 16,
    bottom: 16,
    color: "#fff",
    fontWeight: 700,
    textDecoration: "underline",
  },
  lightboxClose: {
    position: "absolute",
    top: 16,
    right: 16,
    appearance: "none",
    border: "none",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    width: 36,
    height: 36,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 16,
  },
};
