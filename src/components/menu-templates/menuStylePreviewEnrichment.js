/**
 * When operators Preview my menu with ?menuStyle=, fill missing hero / section /
 * item images from the theme's stock sample so boutique layouts show real variety.
 * Keeps restaurant name, prices, and item text from the live payload.
 */

import { MENU_THEME_PREVIEW_PAYLOADS } from "../../data/menuTemplatePreviewSample.js";
import { resolveTemplateMenuStyle } from "./menuPresentationUtils.js";

/** Map gallery / resolved styles to photo-rich sample payload keys. */
const STYLE_STOCK_SAMPLE_KEY = {
  v12: "v1",
  v13: "v6",
  v14: "v9",
  v15: "v8",
};

function collectStockUrls(sample) {
  const heroes = [];
  const sections = [];
  const items = [];
  if (!sample || typeof sample !== "object") return { heroes, sections, items };

  for (const key of ["hero_image_url", "cover_image_url", "banner_image_url", "hero_image"]) {
    const url = String(sample[key] || "").trim();
    if (url) heroes.push(url);
  }

  for (const section of sample.sections || []) {
    const sectionUrl = String(
      section?.image_url || section?.photo_url || section?.section_image_url || "",
    ).trim();
    if (sectionUrl) sections.push(sectionUrl);
    for (const item of section?.items || []) {
      const itemUrl = String(
        item?.image_url || item?.photo_url || item?.menu_item_image_url || "",
      ).trim();
      if (itemUrl) items.push(itemUrl);
    }
  }

  return { heroes, sections, items };
}

function nextUrl(pool, index) {
  if (!pool.length) return null;
  return pool[index % pool.length];
}

/**
 * @param {object|null} payload live public menu JSON
 * @param {string} menuStyle raw or resolved style (e.g. v14)
 * @returns {object|null} shallow-cloned payload with stock images filled where missing
 */
export function enrichMenuPayloadWithStyleStockPhotos(payload, menuStyle) {
  if (!payload || typeof payload !== "object") return payload;

  const resolved = resolveTemplateMenuStyle(menuStyle);
  // Classic + Fine stay text/photo-as-authored — no stock fill.
  if (resolved === "v1" || resolved === "v17") return payload;

  const sampleKey = STYLE_STOCK_SAMPLE_KEY[resolved] || "v1";
  const sample = MENU_THEME_PREVIEW_PAYLOADS[sampleKey];
  const stock = collectStockUrls(sample);
  if (!stock.heroes.length && !stock.sections.length && !stock.items.length) {
    return payload;
  }

  const enriched = {
    ...payload,
    sections: Array.isArray(payload.sections)
      ? payload.sections.map((section, sIdx) => {
          const sectionCopy = { ...section };
          const hasSectionImage = String(
            sectionCopy.image_url || sectionCopy.photo_url || sectionCopy.section_image_url || "",
          ).trim();
          if (!hasSectionImage) {
            const url = nextUrl(stock.sections.length ? stock.sections : stock.heroes, sIdx);
            if (url) sectionCopy.image_url = url;
          }
          if (Array.isArray(sectionCopy.items)) {
            sectionCopy.items = sectionCopy.items.map((item, iIdx) => {
              const itemCopy = { ...item };
              const hasItemImage = String(
                itemCopy.image_url || itemCopy.photo_url || itemCopy.menu_item_image_url || "",
              ).trim();
              if (!hasItemImage) {
                const url = nextUrl(stock.items.length ? stock.items : stock.heroes, sIdx * 20 + iIdx);
                if (url) itemCopy.image_url = url;
              }
              return itemCopy;
            });
          }
          return sectionCopy;
        })
      : payload.sections,
  };

  const hasHero = String(
    enriched.hero_image_url || enriched.cover_image_url || enriched.banner_image_url || enriched.hero_image || "",
  ).trim();
  if (!hasHero) {
    const url = nextUrl(stock.heroes.length ? stock.heroes : stock.sections, 0);
    if (url) enriched.hero_image_url = url;
  }

  return enriched;
}

/**
 * During style preview, force image display settings so stock/live photos actually render.
 */
export function stylePreviewImageThemeOverrides(menuThemeSettings = {}) {
  return {
    ...menuThemeSettings,
    hero_enabled: true,
    image_density: "all",
    item_image_style: "all",
  };
}
