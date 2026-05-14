/**
 * Sample menu payload for template preview ONLY (/menu-template-preview).
 * Shape mirrors GET /public/restaurants/:id/menu success JSON (minimal fields templates read).
 * Never imported by production menu fetch paths.
 */

export const MENU_TEMPLATE_PREVIEW_SAMPLE = {
  ok: true,
  restaurant_id: 0,
  restaurant_name: "Preview Kitchen",
  name: "Preview Kitchen",
  slug: "preview-kitchen",
  logo_url: null,
  // Optional: when set, menu chrome uses this instead of name-derived hue
  accent_color: "#c45c26",
  hero_image_url: null,
  cover_image_url: null,
  menu_name: "Dinner",
  address_line1: "100 Demo Lane",
  city: "Sample City",
  state: "CA",
  zip: "90001",
  menu_source: null,
  franchise_group: null,
  deal_items: [
    { id: 1001, title: "Chef's choice", headline: "Featured tonight" },
    { id: 1004, title: "Happy hour", headline: "Until 6pm" },
  ],
  sections: [
    {
      title: "Featured",
      items: [
        {
          id: 1001,
          name: "Seasonal Plate",
          description: "Rotating ingredients from local producers.",
          price_minor_units: 1899,
          chips: {
            nutrition_chip: {
              headline_phrases: ["Balanced plate"],
            },
          },
        },
        {
          id: 1002,
          name: "Market Salad",
          description: "Greens, citrus, herbs, light vinaigrette.",
          price_minor_units: 1299,
          is_gluten_free: true,
        },
      ],
    },
    {
      title: "Mains",
      items: [
        {
          id: 1003,
          name: "Roasted Vegetables",
          description: "Harissa glaze, yogurt, herbs.",
          price_minor_units: 1599,
          is_vegan: true,
        },
        {
          id: 1004,
          name: "Classic Burger",
          description: "House sauce, pickles, brioche.",
          price_minor_units: 1499,
          menuply_display_price_cents: 1499,
        },
      ],
    },
  ],
};
