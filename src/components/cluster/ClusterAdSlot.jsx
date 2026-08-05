import React, { useEffect, useState } from "react";
import { getAdvertisementByRegion, getAdvertisements } from "../../lib/advertisementApi.js";

/**
 * Generic cluster ad slot.
 * Resolves ads by inventory_key or page_region — no venue-specific keys hardcoded.
 */
export default function ClusterAdSlot({
  clusterSlug,
  inventoryKey = null,
  pageRegion = null,
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
  const href = ad.destination_url || undefined;
  const imgSrc = ad.mobile_image_url
    ? undefined // handled via picture below when mobile set
    : ad.image_url;

  const frameStyle = resolveFrameStyle(type, style);
  const mediaStyle = resolveMediaStyle(type);

  const media = ad.mobile_image_url ? (
    <picture>
      <source media="(max-width: 640px)" srcSet={ad.mobile_image_url} />
      <img
        src={ad.image_url}
        alt={ad.headline || ad.name || "Advertisement"}
        style={mediaStyle}
      />
    </picture>
  ) : (
    <img
      src={imgSrc}
      alt={ad.headline || ad.name || "Advertisement"}
      style={mediaStyle}
    />
  );

  const body = (
    <div
      className={className}
      data-testid="cluster-ad-slot"
      data-inventory-type={type}
      data-page-region={pageRegion || ad.page_region || ""}
      data-inventory-key={inventoryKey || ad.inventory_key || ""}
      style={frameStyle}
    >
      {media}
      {(ad.headline || ad.cta_text) && type !== "Inline Banner" ? (
        <div style={{ marginTop: 8 }}>
          {ad.headline ? (
            <div style={{ fontWeight: 700, fontSize: type === "Hero Banner" ? 18 : 15 }}>
              {ad.headline}
            </div>
          ) : null}
          {ad.description ? (
            <div style={{ marginTop: 4, color: "#4b5563", fontSize: 13 }}>{ad.description}</div>
          ) : null}
          {ad.cta_text ? (
            <div style={{ marginTop: 8, fontWeight: 600, fontSize: 13 }}>{ad.cta_text}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
        {body}
      </a>
    );
  }
  return body;
}

function resolveMediaStyle(type) {
  const cover = {
    width: "100%",
    display: "block",
    borderRadius: 8,
    objectFit: "cover",
    objectPosition: "center",
  };
  switch (type) {
    case "Hero Banner":
      return { ...cover, aspectRatio: "16 / 9", maxHeight: 320 };
    case "Page Banner":
      return { ...cover, aspectRatio: "3 / 1", maxHeight: 148 };
    case "Inline Banner":
      return { ...cover, aspectRatio: "4 / 3", maxHeight: 220 };
    case "Sponsored Card":
      return { ...cover, aspectRatio: "16 / 9", maxHeight: 200 };
    case "Featured Listing":
      return { ...cover, aspectRatio: "4 / 3", maxHeight: 240 };
    case "Interstitial":
      return { ...cover, aspectRatio: "21 / 9", maxHeight: 176 };
    case "Floating Banner":
      return { ...cover, aspectRatio: "5 / 1", maxHeight: 96, borderRadius: 0 };
    default:
      return { width: "100%", height: "auto", display: "block", borderRadius: 8 };
  }
}

function resolveFrameStyle(type, style = {}) {
  const base = {
    margin: "16px 0",
    ...style,
  };
  switch (type) {
    case "Hero Banner":
      return { ...base, width: "100%" };
    case "Page Banner":
      return { ...base, width: "100%" };
    case "Inline Banner":
      return {
        ...base,
        maxWidth: 420,
        width: "100%",
        marginLeft: "auto",
        marginRight: "auto",
      };
    case "Sponsored Card":
    case "Featured Listing":
      return {
        ...base,
        maxWidth: 560,
        padding: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
      };
    case "Interstitial":
      return {
        ...base,
        padding: 12,
        borderRadius: 12,
        background: "#111827",
        color: "#fff",
      };
    case "Floating Banner":
      return {
        ...base,
        position: "sticky",
        bottom: 12,
        zIndex: 5,
        maxWidth: 640,
        marginLeft: "auto",
        marginRight: "auto",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      };
    case "Native Promotion":
      return { ...base, padding: "8px 0" };
    default:
      return base;
  }
}
