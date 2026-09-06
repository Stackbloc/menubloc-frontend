/**
 * @home — home-cooked meal photos plus What I'm Cooking videos on the diner profile.
 * @home still photos do not post to Feed. Cooking videos from Feed X also appear here.
 * Section cameras removed — capture/upload is bottom-nav X; this hub is display (+ delete).
 */

import { Link } from "react-router-dom";
import { useState } from "react";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { homemadeDishPath } from "../../../lib/homemadeDishApi.js";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import { SectionHead } from "./myMenuplyBits.jsx";
import * as s from "./myMenuplyStyles.js";

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
        {name && name !== "Home-cooked meal" && name !== "What I'm Cooking" ? (
          <span style={grid.caption}>{name}</span>
        ) : null}
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
  void onPhotoFile;
  const rows = Array.isArray(dishes)
    ? dishes.filter((d) => d && (d.photo_url || d.video_url || d.id))
    : [];

  if (readOnly && !rows.length) return null;

  return (
    <section style={{ ...s.presentationBlock, marginTop: 22 }} data-testid="home-at-home">
      <SectionHead
        title="@home"
        testId="home-at-home-head"
        subtitle="Home-cooked meals and cooking videos shared from Feed (X)."
      />
      {error ? <p style={s.error}>{error}</p> : null}
      {!rows.length && !readOnly ? (
        <p style={s.muted} data-testid="home-at-home-empty">
          Share a home-cooked meal from{" "}
          <Link to="/feed" data-testid="home-at-home-feed-link" style={{ color: "#0f766e", fontWeight: 700 }}>
            Feed (X)
          </Link>
          . It shows up here.
        </p>
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

const grid = {
  addRow: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
  },
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
  playBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
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
