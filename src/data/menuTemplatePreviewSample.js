/**
 * Sample menu payload for template preview ONLY (/menu-template-preview).
 * Shape mirrors GET /public/restaurants/:id/menu success JSON (minimal fields templates read).
 * Never imported by production menu fetch paths.
 */

export const MENU_TEMPLATE_PREVIEW_SAMPLE = {
  ok: true,
  restaurant_id: 0,
  restaurant_name: "Sample Menu Studio",
  name: "Sample Menu Studio",
  slug: "sample-menu-studio",
  logo_url: null,
  // Optional: when set, menu chrome uses this instead of name-derived hue
  accent_color: "#c45c26",
  hero_image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80",
  cover_image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80",
  menu_name: "Sample Menu Design",
  address_line1: "100 Preview Lane",
  city: "Demo City",
  state: "CA",
  zip: "90001",
  menu_source: null,
  franchise_group: null,
  // Brand identity fields (populated by brand settings API in production)
  tagline: "One sample restaurant, multiple visual menu directions.",
  font_preset: "default",
  menu_presentation: { tabs_allowed_for_public_view: false },
  deal_items: [
    { id: 1001, title: "Sample feature", headline: "Featured menu design item" },
    { id: 1008, title: "Sample special", headline: "Preview-only menu highlight" },
    { id: 1012, title: "Sample dinner", headline: "Premium dining example" },
  ],
  sections: [
    {
      title: "Fast Casual Favorites",
      image_url: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 1001,
          name: "Citrus Chicken Bowl",
          description: "Grilled chicken, brown rice, greens, roasted corn, avocado, lime crema.",
          price_minor_units: 1395,
          chips: {
            nutrition_chip: {
              headline_phrases: ["Balanced bowl"],
            },
          },
        },
        {
          id: 1002,
          name: "Market Greens Salad",
          description: "Mixed greens, cucumber, tomato, chickpeas, herbs, lemon vinaigrette.",
          price_minor_units: 1195,
          is_gluten_free: true,
        },
        {
          id: 1003,
          name: "Turkey Avocado Sandwich",
          description: "Roasted turkey, avocado, tomato, greens, toasted sourdough.",
          price_minor_units: 1295,
        },
      ],
    },
    {
      title: "Truck Window",
      image_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 1004,
          name: "Street Taco Trio",
          description: "Three corn tortillas with grilled steak, chicken, and vegetables.",
          price_minor_units: 1299,
        },
        {
          id: 1005,
          name: "Smash Burger",
          description: "Double patty, american cheese, pickles, truck sauce, toasted bun.",
          price_minor_units: 1199,
          menuply_display_price_cents: 1199,
        },
        {
          id: 1006,
          name: "Loaded Street Fries",
          description: "Crispy fries, queso, pico, crema, scallions.",
          price_minor_units: 899,
        },
      ],
    },
    {
      title: "Family Table",
      image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 1007,
          name: "Homestyle Breakfast Plate",
          description: "Eggs, breakfast potatoes, toast, choice of bacon or sausage.",
          price_minor_units: 1099,
        },
        {
          id: 1008,
          name: "Chicken Tender Basket",
          description: "Hand-breaded tenders, fries, slaw, honey mustard.",
          price_minor_units: 1299,
        },
        {
          id: 1009,
          name: "Mac and Cheese",
          description: "Creamy cheddar sauce, toasted crumbs.",
          price_minor_units: 799,
        },
      ],
    },
    {
      title: "Premium Dinner",
      image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 1010,
          name: "Roasted Seasonal Vegetables",
          description: "Charred carrots, broccolini, herb oil, toasted seeds.",
          price_minor_units: 1500,
          is_vegan: true,
        },
        {
          id: 1011,
          name: "Pan-Seared Salmon",
          description: "Lemon butter, asparagus, fingerling potatoes.",
          price_minor_units: 2699,
          is_gluten_free: true,
        },
        {
          id: 1012,
          name: "Charred Ribeye",
          description: "Herb butter, roasted garlic, potato puree.",
          price_minor_units: 3899,
        },
      ],
    },
    {
      title: "Sweets and Drinks",
      items: [
        {
          id: 1013,
          name: "Warm Brownie Sundae",
          description: "Chocolate brownie, vanilla ice cream, caramel.",
          price_minor_units: 799,
        },
        {
          id: 1014,
          name: "House Lemonade",
          description: "Fresh lemon, cane sugar, mint.",
          price_minor_units: 499,
          is_vegan: true,
        },
        {
          id: 1015,
          name: "Sparkling Water",
          description: "Served with citrus.",
          price_minor_units: 299,
        },
      ],
    },
  ],
};

export const KBC_DEFAULT_MENU_PREVIEW_SAMPLE = {
  ...MENU_TEMPLATE_PREVIEW_SAMPLE,
  restaurant_name: "KBC Butcher Block",
  name: "KBC Butcher Block",
  slug: "kbc-butcher-block",
  accent_color: "#1F4E3D",
  hero_image_url: null,
  cover_image_url: null,
  menu_name: "Main Menu",
  address_line1: "151 N Foster St",
  city: "Dothan",
  state: "AL",
  zip: "36303",
  tagline: "Default Menuply menu sample based on a Dothan restaurant format.",
  deal_items: [],
  sections: [
    {
      title: "Appetizers",
      items: [
        {
          id: 9001,
          name: "Smoked Wings",
          description: "Wood-smoked wings tossed in Alabama white sauce.",
          price_minor_units: 1300,
        },
        {
          id: 9002,
          name: "Brisket Nachos",
          description: "House chips, queso, smoked brisket, jalapenos, and pico.",
          price_minor_units: 1450,
        },
      ],
    },
    {
      title: "Salads",
      items: [
        {
          id: 9003,
          name: "Steakhouse Wedge",
          description: "Iceberg wedge with bacon, tomato, blue cheese, and ranch.",
          price_minor_units: 1100,
        },
      ],
    },
    {
      title: "Sandwiches",
      items: [
        {
          id: 9004,
          name: "Butcher Block Burger",
          description: "Double patty burger with cheddar, bacon jam, and fries.",
          price_minor_units: 1550,
        },
      ],
    },
    {
      title: "Entrees",
      items: [
        {
          id: 9005,
          name: "Smoked Ribeye",
          description: "Hand-cut ribeye finished over live fire with mashed potatoes.",
          price_minor_units: 2900,
        },
        {
          id: 9006,
          name: "BBQ Meatloaf",
          description: "House meatloaf glazed with tangy barbecue sauce.",
          price_minor_units: 1800,
        },
      ],
    },
    {
      title: "Desserts and Drinks",
      items: [
        {
          id: 9007,
          name: "Banana Pudding",
          description: "Classic banana pudding with vanilla wafers.",
          price_minor_units: 700,
        },
        {
          id: 9008,
          name: "Fresh Lemonade",
          description: "Fresh squeezed lemonade.",
          price_minor_units: 350,
        },
      ],
    },
  ],
};

export const MENU_THEME_SAMPLES = [
  {
    style: "v1",
    name: "Default Menu",
    bestFit: "Default Menuply menu format, local restaurants, broad menus",
    description: "The standard Menuply menu presentation using a KBC Butcher Block-style Dothan sample menu.",
  },
  {
    style: "v4",
    name: "Steakhouse / Dark Premium",
    bestFit: "Steakhouses, cocktail lounges, upscale dinner, bourbon bars",
    description: "Dark, dramatic menu styling with strong contrast and premium spacing.",
  },
  {
    style: "v6",
    name: "Premium Bistro",
    bestFit: "Bistros, chef-driven restaurants, date-night menus",
    description: "Editorial restaurant-first design with collection buttons, decorative headings, and image breaks.",
  },
];
