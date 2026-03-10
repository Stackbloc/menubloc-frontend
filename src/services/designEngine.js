/**
 * File:    designEngine.js
 * Path:    menubloc-frontend/src/services/designEngine.js
 * Date:    2026-03-09
 * Purpose:
 *   Placeholder Adobe design engine integration layer.
 *   Provides design style catalogue data and stub async functions
 *   that will be replaced with real Adobe API calls when integration is enabled.
 *
 *   ADOBE INTEGRATION READY — wire points clearly marked below:
 *     getDesignPreview()  → Adobe Express Embed SDK / Express API
 *     generateMenuAsset() → Adobe PDF Services API or Adobe Express Template API
 *
 *   Nothing here makes real Adobe API calls.
 *   All functions return clearly labelled placeholder responses.
 */

// ─────────────────────────────────────────────────────────────
// Design style catalogue
// ─────────────────────────────────────────────────────────────

export const DESIGN_STYLES = [
  {
    id:          "clean_classic",
    name:        "Clean Classic",
    tagline:     "Timeless and easy to read",
    description: "Simple, structured layout with a polished professional feel. Works beautifully for any restaurant type.",
    popular:     false,
    preview: {
      bg:          "#ffffff",
      headerBg:    "#ffffff",
      headerColor: "#111111",
      accent:      "#111111",
      divider:     "#e8e8e8",
      sectionColor:"#888888",
      itemColor:   "#1a1a1a",
      priceColor:  "#111111",
      border:      "1.5px solid #e8e8e8",
    },
  },
  {
    id:          "modern_bold",
    name:        "Modern Bold",
    tagline:     "High-contrast and unmistakably sharp",
    description: "Dark backgrounds with bold typography. Commands attention — ideal for upscale, trendy, or bar concepts.",
    popular:     true,
    preview: {
      bg:          "#111111",
      headerBg:    "#111111",
      headerColor: "#ffffff",
      accent:      "#f5c842",
      divider:     "rgba(255,255,255,0.1)",
      sectionColor:"rgba(255,255,255,0.4)",
      itemColor:   "rgba(255,255,255,0.88)",
      priceColor:  "#f5c842",
      border:      "1.5px solid #2a2a2a",
    },
  },
  {
    id:          "elegant_bistro",
    name:        "Elegant Bistro",
    tagline:     "Warm, refined, and inviting",
    description: "Soft cream tones with graceful spacing. Perfect for fine dining, wine bars, and neighborhood cafes.",
    popular:     false,
    preview: {
      bg:          "#faf6f0",
      headerBg:    "#faf6f0",
      headerColor: "#4a2e12",
      accent:      "#8b5e3c",
      divider:     "#e8ddd1",
      sectionColor:"#a07850",
      itemColor:   "#3a2410",
      priceColor:  "#8b5e3c",
      border:      "1.5px solid #e8ddd1",
    },
  },
  {
    id:          "fast_casual_bright",
    name:        "Fast Casual Bright",
    tagline:     "Energetic, colorful, and fast to scan",
    description: "Vibrant and approachable. Makes your menu feel alive — great for casual restaurants, food trucks, and delis.",
    popular:     false,
    preview: {
      bg:          "#f0f7ff",
      headerBg:    "#0d5fd6",
      headerColor: "#ffffff",
      accent:      "#0d5fd6",
      divider:     "#c8dff8",
      sectionColor:"#0d5fd6",
      itemColor:   "#1a2a40",
      priceColor:  "#0d5fd6",
      border:      "1.5px solid #c8dff8",
    },
  },
  {
    id:          "minimal_bw",
    name:        "Minimal Black & White",
    tagline:     "Editorial, pure, and confident",
    description: "Maximum white space and clean typography. A bold statement of simplicity — stunning for premium concepts.",
    popular:     false,
    preview: {
      bg:          "#fafafa",
      headerBg:    "#fafafa",
      headerColor: "#000000",
      accent:      "#000000",
      divider:     "#f0f0f0",
      sectionColor:"#aaaaaa",
      itemColor:   "#111111",
      priceColor:  "#000000",
      border:      "1px solid #e0e0e0",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Adobe-ready stub functions
// ─────────────────────────────────────────────────────────────

/**
 * Returns a mock design preview config for the given styleId.
 *
 * ADOBE INTEGRATION:
 *   Replace this function body with a call to the Adobe Express Embed SDK
 *   or the Adobe Express Template API to generate a real live preview.
 *   The preview_url field should be populated with the Adobe-generated asset URL.
 *
 * @param {string} styleId
 * @param {{ restaurant_name?: string, menu_id?: number }} restaurantData
 * @returns {Promise<object>}
 */
export async function getDesignPreview(styleId, restaurantData = {}) {
  // Simulate a brief async lookup
  await new Promise((r) => setTimeout(r, 200));

  const style = DESIGN_STYLES.find((s) => s.id === styleId);
  if (!style) return null;

  return {
    style_id:      styleId,
    preview_ready: false,   // ADOBE INTEGRATION: true once real preview URL is available
    preview_url:   null,    // ADOBE INTEGRATION: populate with Adobe-generated preview URL
    config:        { ...style },
    restaurant:    restaurantData,
    generated_at:  null,    // ADOBE INTEGRATION: ISO timestamp of generation
    _placeholder:  true,    // remove this flag when Adobe is connected
  };
}

/**
 * Initiates menu asset generation for a chosen design style.
 *
 * ADOBE INTEGRATION:
 *   Replace this function body with a call to the Adobe PDF Services API
 *   or the Adobe Express Template API to generate the real designed menu asset.
 *   Return the Adobe job ID so the frontend can poll for completion.
 *
 * @param {string} styleId
 * @param {{ menu_id: number, restaurant_id: number }} menuData
 * @param {{ restaurant_name: string }} restaurantData
 * @returns {Promise<object>}
 */
export async function generateMenuAsset(styleId, menuData = {}, restaurantData = {}) {
  return {
    job_id:     null,       // ADOBE INTEGRATION: return Adobe job ID
    status:     "queued",
    style_id:   styleId,
    menu_data:  menuData,
    restaurant: restaurantData,
    asset_url:  null,       // ADOBE INTEGRATION: populated on job completion
    _placeholder: true,     // remove this flag when Adobe is connected
    note: "Design engine placeholder — Adobe integration not yet connected.",
  };
}
