import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdvertisementByRegion, getAdvertisements } from "../../lib/advertisementApi.js";

/**
 * Generic cluster ad slot.
 * Resolves ads by inventory_key or page_region — no venue-specific keys hardcoded.
 * Size variants: hero (premium wide), standard, small (lower-cost unit).
 */
export default function ClusterAdSlot({
  clusterSlug,
  inventoryKey = null,
  pageRegion = null,
  size = null,
  className,
  style,
}) {
  const [ad, setAd] = useState(null);
  const [inventoryType, setInventoryType] = useState(null);
  const [delivery, setDelivery] = useState(null);

  useEffect(() => {
    if (!clusterSlug || (!inventoryKey && !pageRegion)) {
      setAd(null);
      return undefined;
    }
    const controller = new AbortController();
    const loader = inventoryKey
      ? getAdvertisements(inventoryKey, { clusterSlug })
      : getAdvertisementByRegion(pageRegion, { clusterSlug });

    loader
      .then((data) => {
        if (controller.signal.aborted) return;
        setAd(data?.advertisement || data?.advertisements?.[0] || null);
        setDelivery({ inventoryId: data?.inventory?.id ?? null, adSource: data?.ad_source ?? null });
        setInventoryType(
          data?.inventory?.inventory_type ||
            data?.advertisement?.inventory_type ||
            null
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setAd(null);
      });

    return () => controller.abort();
  }, [clusterSlug, inventoryKey, pageRegion]);

  if (!ad?.image_url) return null;

  const type = inventoryType || ad.inventory_type || "Page Banner";
  const resolvedSize = size || sizeForPlacement(pageRegion, type);
  const href = ad.destination_url || undefined;
  const frameStyle = resolveFrameStyle(type, resolvedSize, style);
  const mediaStyle = resolveMediaStyle(resolvedSize);

  const media = (
    <img src={ad.image_url} alt={ad.headline || ad.name || "Advertisement"} style={mediaStyle} />
  );

  const body = (
    <div
      className={className}
      data-testid="cluster-ad-slot"
      data-ad-size={resolvedSize}
      data-inventory-type={type}
      data-page-region={pageRegion || ad.page_region || ""}
      data-inventory-key={inventoryKey || ad.inventory_key || ""}
      style={frameStyle}
      {...adEngagementAttrs(ad, delivery)}
    >
      <div style={{ position: "relative" }}>
        {media}
        {resolvedSize === "slim" || resolvedSize === "small" ? (
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 8,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#fff",
              background: "rgba(15, 23, 42, 0.55)",
              padding: "2px 6px",
              borderRadius: 4,
              lineHeight: 1.3,
            }}
          >
            Sponsored
          </div>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    const linkStyle = {
      display: "block",
      width: resolvedSize === "small" ? "auto" : "100%",
      maxWidth: resolvedSize === "small" ? 228 : "100%",
      textDecoration: "none",
      color: "inherit",
    };
    // Restaurant / deal ads resolve to Menuply paths ("/restaurants/12") — keep those in-app.
    if (href.startsWith("/") && !href.startsWith("//")) {
      return (
        <Link to={href} style={linkStyle}>
          {body}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        {body}
      </a>
    );
  }
  return body;
}

function sizeForPlacement(pageRegion, type) {
  if (pageRegion === "cluster_landing_hero") return "hero";
  if (pageRegion === "cluster_deals_top") return "slim";
  if (pageRegion === "cluster_search_top") return "slim";
  if (pageRegion === "cluster_landing_footer") return "small";
  if (pageRegion === "cluster_search_inline") return "small";
  if (type === "Native Promotion" || type === "Inline Banner") return "small";
  if (type === "Hero Banner") return "hero";
  return "standard";
}

/** Keep frame sizes; composed wide/slim/small assets fill slots without clipping branding. */
function resolveMediaStyle(size) {
  const base = {
    width: "100%",
    display: "block",
    verticalAlign: "top",
  };
  if (size === "slim") {
    return {
      ...base,
      height: 220,
      maxHeight: 220,
      objectFit: "cover",
      objectPosition: "left center",
    };
  }
  if (size === "small") {
    return {
      ...base,
      height: 148,
      maxHeight: 148,
      objectFit: "cover",
      objectPosition: "top center",
    };
  }
  if (size === "hero") {
    return {
      ...base,
      height: "auto",
      maxWidth: "100%",
      objectFit: "unset",
    };
  }
  return { ...base, height: "auto", objectFit: "contain", objectPosition: "center top" };
}

function resolveFrameStyle(type, size, style = {}) {
  if (size === "small") {
    return {
      margin: 0,
      width: 228,
      maxWidth: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      background: "#fff",
      lineHeight: 0,
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
      ...style,
    };
  }

  if (size === "slim") {
    return {
      margin: "0.35rem 0",
      width: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      background: "#0b1220",
      lineHeight: 0,
      ...style,
    };
  }

  const base = {
    margin: 0,
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    borderRadius: 12,
    background: "#111827",
    lineHeight: 0,
    ...style,
  };

  if (size === "hero") {
    return {
      ...base,
      background: "#ffffff",
      overflow: "visible",
      border: "1px solid #e5e7eb",
    };
  }

  switch (type) {
    case "Sponsored Card":
    case "Featured Listing":
      return {
        ...base,
        maxWidth: 420,
        border: "1px solid #e5e7eb",
        background: "#fff",
      };
    case "Interstitial":
      return { ...base, maxWidth: 640 };
    case "Floating Banner":
      return {
        ...base,
        maxWidth: 520,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      };
    default:
      return base;
  }
}

/**
 * Engagement analytics (impression + click) for a served ad. Requires the inventory id and
 * ad source from the delivery response; the server derives cluster, destination, and
 * paid/house class from its own rows. Unknown delivery → not tracked.
 */
function adEngagementAttrs(ad, delivery) {
  const inventoryId = Number(delivery?.inventoryId) || null;
  const adSource = delivery?.adSource || null;
  if (!inventoryId || !adSource) return {};
  const attrs = {
    "data-mp-event": "ad_click",
    "data-mp-impression": "ad_impression",
    "data-mp-ad-inventory-id": inventoryId,
    "data-mp-subtype": adSource,
  };
  if ((adSource === "sold" || adSource === "slot_house") && Number(ad?.id) > 0) attrs["data-mp-ad-id"] = ad.id;
  else if (adSource === "default_banner" && Number(ad?.default_banner_id) > 0) attrs["data-mp-ad-banner-id"] = ad.default_banner_id;
  else if (adSource !== "built_in") return {};
  if (Number(ad?.restaurant_id) > 0) attrs["data-mp-restaurant-id"] = ad.restaurant_id;
  if (Number(ad?.deal_id) > 0) attrs["data-mp-deal-id"] = ad.deal_id;
  return attrs;
}
