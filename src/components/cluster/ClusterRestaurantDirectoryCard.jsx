import React, { useState } from "react";
import { Link } from "react-router-dom";
import { restaurantMenuPathFromRow, restaurantPathFromRow } from "../../lib/canonicalUrl.js";
import { isRestaurantMenuReady } from "../../lib/publicCardCounts.js";
import { appendClusterReturnQuery } from "../../lib/clusterReturnNavigation.js";
import {
  CLUSTER_RESTAURANT_BILLBOARD_HEIGHT_PX,
  formatClusterCardStreetAddress,
  formatRestaurantCuisineLabel,
  resolveClusterRestaurantAccent,
  resolveClusterRestaurantBillboardUrl,
  resolveClusterRestaurantStatus,
} from "../../lib/clusterRestaurantDisplay.js";
import { formatClusterListingNoteForDisplay } from "../../lib/clusterListingNoteDisplay.js";
import AddMenuAction from "../AddMenuAction.jsx";
import { canShowAddMenu } from "../../lib/addMenuContribution.js";
import { useClusterVideos } from "./video/ClusterVideoContext.jsx";
import ClusterVideoPlayButton from "./video/ClusterVideoPlayButton.jsx";
import FavHeartIcon from "../icons/FavHeartIcon.jsx";
import IconHoverLabel from "../IconHoverLabel.jsx";
import { FAV_ACCENT, likeButtonVisualStyle } from "../../lib/likeButtonStyles.js";

function withClusterLocation(href, locationId) {
  if (!href || !locationId) return href;
  const [path, hash = ""] = String(href).split("#");
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}location=${encodeURIComponent(locationId)}${hash ? `#${hash}` : ""}`;
}

export default function ClusterRestaurantDirectoryCard({
  restaurant,
  placeReturnPath = null,
  placeReturnLabel = null,
  // Fav heart (restaurants → My Favs); omit onToggleFav to hide it.
  isFav = false,
  favBusy = false,
  onToggleFav = null,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const { index: videoIndex } = useClusterVideos();

  if (!restaurant) return null;

  const name = restaurant?.restaurant_name || restaurant?.name || "Restaurant";
  const listingNote = formatClusterListingNoteForDisplay(
    restaurant?.listing_note || restaurant?.notes || ""
  );
  const accent = resolveClusterRestaurantAccent(restaurant);
  const cuisineLabel = formatRestaurantCuisineLabel(restaurant);
  const addressHint = formatClusterCardStreetAddress(restaurant);
  const status = resolveClusterRestaurantStatus(restaurant);
  const menuReady = isRestaurantMenuReady(restaurant);
  const showAddMenu = canShowAddMenu(restaurant);
  const profileHref = restaurantPathFromRow(restaurant);
  const menuHref = restaurantMenuPathFromRow(restaurant);
  // MLE: open the restaurant at the kitchen that is in this cluster (its address is on the card).
  const rawHref = withClusterLocation(menuReady && menuHref ? menuHref : profileHref, restaurant?.location_id);
  const href =
    rawHref && placeReturnPath
      ? appendClusterReturnQuery(rawHref, placeReturnPath, placeReturnLabel)
      : rawHref;
  const restaurantId = Number(restaurant?.restaurant_id ?? restaurant?.id) || null;
  const showFav = typeof onToggleFav === "function" && Boolean(restaurantId);
  const billboardUrl = imageFailed ? null : resolveClusterRestaurantBillboardUrl(restaurant);

  const content = (
    <article
      className="cluster-restaurant-directory-card cluster-themed-card"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: "100%",
        minHeight: 236,
        padding: 0,
        borderRadius: 6,
        border: `2px solid ${accent.border}`,
        background: accent.bg,
        boxSizing: "border-box",
        boxShadow: "0 2px 0 rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        color: "inherit",
      }}
    >
      {/* Same-height header on every card (photo, else cuisine emoji band) so rows line up. */}
      {billboardUrl ? (
        <img
          src={billboardUrl}
          alt=""
          data-testid="cluster-restaurant-billboard"
          loading="lazy"
          onError={() => setImageFailed(true)}
          style={{
            width: "100%",
            height: CLUSTER_RESTAURANT_BILLBOARD_HEIGHT_PX,
            objectFit: "cover",
            display: "block",
            flexShrink: 0,
            background: "#e5e7eb",
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          data-testid="cluster-restaurant-emoji-band"
          style={{
            height: CLUSTER_RESTAURANT_BILLBOARD_HEIGHT_PX,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            paddingLeft: "0.9rem",
            fontSize: "1.6rem",
            lineHeight: 1,
            background: `linear-gradient(180deg, ${accent.border}22 0%, ${accent.border}0d 100%)`,
            borderBottom: `1px solid ${accent.border}33`,
          }}
        >
          {accent.emoji}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          padding: "0.7rem 0.9rem 0.8rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          <div
            className="cluster-card-title"
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.3,
              fontSynthesis: "none",
              WebkitFontSmoothing: "antialiased",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {name}
          </div>
          {cuisineLabel ? (
            <div
              className="cluster-card-meta"
              style={{
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "#4b5563",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                overflowWrap: "anywhere",
              }}
            >
              {cuisineLabel}
            </div>
          ) : null}
          {addressHint ? (
            <div
              className="cluster-card-muted"
              data-testid="cluster-restaurant-address"
              style={{ color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.35, overflowWrap: "anywhere" }}
            >
              {addressHint}
            </div>
          ) : null}
          {listingNote ? (
            <div
              className="cluster-card-muted"
              data-testid="cluster-restaurant-listing-note"
              style={{ color: "#6b7280", fontSize: "0.78rem", lineHeight: 1.35, overflowWrap: "anywhere" }}
            >
              {listingNote}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: "0.65rem",
            paddingTop: "0.6rem",
            // Room for the Fav heart, which sits over this row outside the link.
            paddingRight: showFav ? 40 : 0,
            minHeight: 32,
            borderTop: `1px solid ${accent.border}`,
            flexShrink: 0,
          }}
          className="cluster-card-title"
        >
          {showAddMenu ? (
            <AddMenuAction restaurant={restaurant} testId="add-menu-cluster-directory" />
          ) : (
            <span
              data-testid="cluster-restaurant-status"
              style={{
                fontWeight: 700,
                color: menuReady ? "#111827" : status.tone,
                fontSize: "0.9rem",
                overflowWrap: "anywhere",
              }}
            >
              {menuReady ? "View menu →" : "View profile →"}
            </span>
          )}
        </div>
      </div>
    </article>
  );

  const card = href ? (
    <Link
      to={href}
      className="cluster-themed-card-link"
      {...clusterListingEngagementAttrs(restaurant, Boolean(menuHref) && rawHref === menuHref)}
      style={{ display: "block", height: "100%", color: "inherit", textDecoration: "none", minWidth: 0, maxWidth: "100%" }}
    >
      {content}
    </Link>
  ) : (
    content
  );

  // Clip pill (top-right) and Fav heart (bottom-right) are siblings of the link, so tapping them
  // plays the clip / toggles My Favs instead of opening the menu.
  const videos = videoIndex.forRestaurant(restaurantId);
  if (videos.length === 0 && !showFav) return card;
  const favLabel = isFav ? `${name} is in My Favs. Tap to remove.` : `Add ${name} to My Favs`;
  return (
    <div
      style={{ position: "relative", minWidth: 0, maxWidth: "100%", height: "100%" }}
      data-testid={videos.length > 0 ? "cluster-restaurant-video-card" : undefined}
    >
      {card}
      {videos.length > 0 ? (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
          <ClusterVideoPlayButton
            videos={videos}
            trigger="restaurant_icon"
            label={`Play ${name} clip`}
            variant="overlay"
            testId="cluster-restaurant-video-play"
          />
        </div>
      ) : null}
      {showFav ? (
        <div style={{ position: "absolute", right: 10, bottom: 10, zIndex: 1 }}>
          <IconHoverLabel label={isFav ? "My Fav" : "Fav"}>
            <button
              type="button"
              data-testid="cluster-restaurant-fav"
              onClick={() => onToggleFav(restaurantId, name)}
              disabled={favBusy}
              aria-label={favLabel}
              aria-pressed={isFav}
              title={isFav ? "My Fav" : "Fav"}
              style={{
                ...likeButtonVisualStyle({ selected: isFav, loading: favBusy, accent: FAV_ACCENT }),
                width: 32,
                height: 32,
              }}
            >
              {/* currentColor when on: red by default, cream on a themed cluster's pressed fill. */}
              <FavHeartIcon size={16} filled={isFav} color={isFav ? "currentColor" : "#0f172a"} />
            </button>
          </IconHoverLabel>
        </div>
      ) : null}
    </div>
  );
}

/** Engagement analytics: listing impression + click-through (cluster page only; see useEngagementPage). */
function clusterListingEngagementAttrs(restaurant, toMenu) {
  const restaurantId = Number(restaurant?.restaurant_id ?? restaurant?.id) || null;
  if (!restaurantId) return {};
  return {
    "data-mp-event": "restaurant_click",
    "data-mp-impression": "restaurant_impression",
    "data-mp-restaurant-id": restaurantId,
    "data-mp-subtype": toMenu ? "menu" : "profile",
    "data-mp-placement": "cluster_directory",
  };
}
