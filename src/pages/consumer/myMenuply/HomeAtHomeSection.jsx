/**
 * @home — photograph home-cooked meals on the diner profile.
 * Photos only. Does not post to Feed. Owner can add/delete; peers are read-only.
 */

import { Link } from "react-router-dom";
import { useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { homemadeDishPath } from "../../../lib/homemadeDishApi.js";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import { SectionHead } from "./myMenuplyBits.jsx";
import * as s from "./myMenuplyStyles.js";

function dishPhoto(dish) {
  return resolveConsumerMediaUrl(dish?.photo_url || "");
}

function HomeDishCell({ dish, readOnly, onDelete, deleteBusy }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const canDelete = !readOnly && typeof onDelete === "function";
  const { open, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);
  const photo = dishPhoto(dish);
  const name = dish?.name || "Home-cooked meal";
  const href = dish?.id || dish?.homemade_dish_id ? homemadeDishPath(dish.id || dish.homemade_dish_id) : null;

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
          if (photo) setLightboxOpen(true);
        }}
      >
        {photo ? (
          <img src={photo} alt="" style={grid.img} loading="lazy" />
        ) : (
          <div style={grid.placeholder}>🍽</div>
        )}
        {name && name !== "Home-cooked meal" ? <span style={grid.caption}>{name}</span> : null}
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
      {lightboxOpen && photo ? (
        <div
          role="presentation"
          style={grid.lightbox}
          onClick={() => setLightboxOpen(false)}
          data-testid="home-at-home-lightbox"
        >
          <img src={photo} alt={name} style={grid.lightboxImg} onClick={(e) => e.stopPropagation()} />
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

function AddHomePhotoCell({ busy, onOpenCamera, onOpenLibrary }) {
  return (
    <div style={grid.addCell} data-testid="home-at-home-add">
      <span style={grid.addPlus}>+</span>
      <span style={grid.addLabel}>Photograph a meal</span>
      <div style={grid.addActions}>
        <button type="button" style={grid.addBtn} disabled={busy} onClick={onOpenCamera}>
          Camera
        </button>
        <button type="button" style={grid.addBtn} disabled={busy} onClick={onOpenLibrary}>
          Library
        </button>
      </div>
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
  const [pickerSource, setPickerSource] = useState(null);
  const rows = Array.isArray(dishes) ? dishes.filter((d) => d && (d.photo_url || d.id)) : [];

  if (readOnly && !rows.length) return null;

  return (
    <section style={{ ...s.presentationBlock, marginTop: 22 }} data-testid="home-at-home">
      <SectionHead
        title="@home"
        testId="home-at-home-head"
        subtitle="Home-cooked meals you’ve photographed."
      />
      {error ? <p style={s.error}>{error}</p> : null}
      {!rows.length && !readOnly ? (
        <p style={s.muted} data-testid="home-at-home-empty">
          Add your first home-cooked dish.
        </p>
      ) : null}

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
        {!readOnly ? (
          <AddHomePhotoCell
            busy={busy}
            onOpenCamera={() => setPickerSource("camera")}
            onOpenLibrary={() => setPickerSource("library")}
          />
        ) : null}
      </div>

      {!readOnly && pickerSource ? (
        <div style={grid.pickerDock} data-testid="home-at-home-picker-dock">
          <MenuplyMediaPicker
            key={`home-at-home-${pickerSource}`}
            onFile={(file) => {
              setPickerSource(null);
              onPhotoFile?.(file);
            }}
            disabled={busy}
            facingMode="environment"
            source={pickerSource === "library" ? "library" : "camera"}
            allowPhoto
            allowVideo={false}
            showPreview={false}
            openOnMount
            testId="home-at-home-picker"
            ariaLabel="Photograph a home-cooked meal"
          />
        </div>
      ) : null}
    </section>
  );
}

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
    background: "#ecfdf5",
    borderRadius: 8,
    overflow: "hidden",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    background: "#dcfce7",
  },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "6px 6px 5px",
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(transparent, rgba(0,0,0,0.62))",
    textAlign: "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  addCell: {
    aspectRatio: "1 / 1",
    borderRadius: 8,
    border: "1.5px dashed #86efac",
    background: "#f0fdf4",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 8,
    boxSizing: "border-box",
  },
  addPlus: { fontSize: 26, lineHeight: 1, color: "#166534" },
  addLabel: { fontSize: 11, fontWeight: 700, color: "#14532d", textAlign: "center" },
  addActions: { display: "flex", gap: 6 },
  addBtn: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #86efac",
    background: "#fff",
    color: "#14532d",
    cursor: "pointer",
  },
  pickerDock: { marginTop: 10 },
  lightbox: {
    position: "fixed",
    inset: 0,
    zIndex: 400,
    background: "rgba(0,0,0,0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  lightboxImg: {
    maxWidth: "100%",
    maxHeight: "86vh",
    objectFit: "contain",
    borderRadius: 8,
  },
  lightboxClose: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "rgba(255,255,255,0.16)",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    width: 36,
    height: 36,
    fontSize: 16,
    cursor: "pointer",
  },
  lightboxLink: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
  },
};
