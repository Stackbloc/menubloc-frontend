import React, { useEffect, useState } from "react";
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
    >
      {resolvedSize === "small" ? (
        <div
          style={{
            padding: "5px 8px 0",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#9ca3af",
            lineHeight: 1.2,
          }}
        >
          Sponsored
        </div>
      ) : null}
      <div style={{ position: "relative", padding: resolvedSize === "small" ? "6px 6px 8px" : 0 }}>
        {media}
        {resolvedSize === "slim" ? (
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 8,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.78)",
            }}
          >
            Sponsored
          </div>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          width: resolvedSize === "small" ? "auto" : "100%",
          maxWidth: resolvedSize === "small" ? 228 : "100%",
          textDecoration: "none",
          color: "inherit",
        }}
      >
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
      aspectRatio: "16 / 9",
      maxHeight: 420,
      objectFit: "contain",
      objectPosition: "center top",
      background: "#ffffff",
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

  if (size === "hero") return { ...base, background: "#ffffff" };

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
