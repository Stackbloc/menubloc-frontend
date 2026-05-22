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
  // Brand identity fields (populated by brand settings API in production)
  tagline: "Crafted with care, served with pride.",
  font_preset: "default",
  menu_presentation: { tabs_allowed_for_public_view: false },
  deal_items: [
    { id: 1001, title: "Chef's choice", headline: "Featured tonight" },
    { id: 1004, title: "Happy hour special", headline: "Until 6pm — save $3" },
    { id: 1005, title: "Date night deal", headline: "Two entrees + wine" },
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
        {
          id: 1005,
          name: "Pan-Seared Salmon",
          description: "Lemon beurre blanc, asparagus, fingerling potatoes.",
          price_minor_units: 2699,
          is_gluten_free: true,
        },
        {
          id: 1006,
          name: "Smash Burger Combo",
          description: "Double smash, american cheese, special sauce, fries.",
          price_minor_units: 1899,
          menuply_display_price_cents: 1899,
        },
      ],
    },
    {
      title: "Sides",
      items: [
        {
          id: 1007,
          name: "Truffle Fries",
          description: "Parmesan, rosemary, aioli.",
          price_minor_units: 799,
        },
        {
          id: 1008,
          name: "House Slaw",
          description: "Apple, cabbage, citrus vinaigrette.",
          price_minor_units: 599,
          is_vegan: true,
          is_gluten_free: true,
        },
      ],
    },
    {
      title: "Drinks",
      items: [
        {
          id: 1009,
          name: "Craft Lemonade",
          description: "Fresh squeezed, seasonal fruit, mint.",
          price_minor_units: 499,
          is_vegan: true,
        },
        {
          id: 1010,
          name: "Sparkling Water",
          description: "Served with citrus.",
          price_minor_units: 299,
        },
      ],
    },
  ],
};
