import React, { useEffect, useState } from "react";
import { getAdvertisementByRegion, getAdvertisements } from "../../lib/advertisementApi.js";

/**
 * Generic cluster ad slot.
 * Resolves ads by inventory_key or page_region — no venue-specific keys hardcoded.
 * Creatives render edge-to-edge at their native ratio (no cover-crop).
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
  const frameStyle = resolveFrameStyle(type, style);
  const mediaStyle = {
    width: "100%",
    height: "auto",
    display: "block",
    verticalAlign: "top",
  };

  const media = ad.mobile_image_url ? (
    <picture>
      <source media="(max-width: 640px)" srcSet={ad.mobile_image_url} />
      <img src={ad.image_url} alt={ad.headline || ad.name || "Advertisement"} style={mediaStyle} />
    </picture>
  ) : (
    <img src={ad.image_url} alt={ad.headline || ad.name || "Advertisement"} style={mediaStyle} />
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
        <div style={{ padding: "10px 12px 12px" }}>
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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", width: "100%", textDecoration: "none", color: "inherit" }}
      >
        {body}
      </a>
    );
  }
  return body;
}

function resolveFrameStyle(type, style = {}) {
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
  switch (type) {
    case "Sponsored Card":
    case "Featured Listing":
      return {
        ...base,
        border: "1px solid #e5e7eb",
        background: "#fff",
      };
    case "Interstitial":
      return {
        ...base,
        background: "#111827",
      };
    case "Floating Banner":
      return {
        ...base,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      };
    case "Native Promotion":
      return { ...base, background: "transparent", borderRadius: 0 };
    default:
      return base;
  }
}
