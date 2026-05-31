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
      image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 9001,
          name: "Smoked Wings",
          description: "Wood-smoked wings tossed in Alabama white sauce.",
          price_minor_units: 1300,
          image_url: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=80",
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
      image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 9003,
          name: "Steakhouse Wedge",
          description: "Iceberg wedge with bacon, tomato, blue cheese, and ranch.",
          price_minor_units: 1100,
          image_url: "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80",
        },
      ],
    },
    {
      title: "Sandwiches",
      image_url: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 9004,
          name: "Butcher Block Burger",
          description: "Double patty burger with cheddar, bacon jam, and fries.",
          price_minor_units: 1550,
          image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
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

export const STREET_CHALKBOARD_MENU_PREVIEW_SAMPLE = {
  ok: true,
  restaurant_id: 0,
  restaurant_name: "Boardwalk Smash Co.",
  name: "Boardwalk Smash Co.",
  slug: "boardwalk-smash-co",
  logo_url: null,
  accent_color: "#f6b21a",
  hero_image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=80",
  cover_image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=80",
  menu_name: "Street Menu",
  address_line1: "42 Boardwalk Ave",
  city: "Los Angeles",
  state: "CA",
  zip: "90001",
  tagline: "A chalkboard-inspired menu built for trucks, pop-ups, burgers, tacos, and quick service.",
  font_preset: "bold",
  menu_presentation: { tabs_allowed_for_public_view: false },
  deal_items: [],
  sections: [
    {
      title: "Smash Burgers",
      image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 7001,
          name: "Boardwalk Double",
          description: "Two smashed patties, american cheese, pickles, house sauce.",
          price_minor_units: 1299,
          image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 7002,
          name: "Hot Honey Chicken",
          description: "Crispy chicken, slaw, hot honey glaze, soft bun.",
          price_minor_units: 1349,
          image_url: "https://images.unsplash.com/photo-1606755962773-d324e3a0b7d4?auto=format&fit=crop&w=900&q=80",
        },
      ],
    },
    {
      title: "Street Tacos",
      image_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 7003,
          name: "Birria Trio",
          description: "Slow braised beef, melted cheese, consommé dip.",
          price_minor_units: 1395,
          image_url: "https://images.unsplash.com/photo-1577674183308-7f8d5177e5a5?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 7004,
          name: "Citrus Fish Taco",
          description: "Grilled fish, cabbage, cilantro, lime crema.",
          price_minor_units: 1295,
        },
      ],
    },
    {
      title: "Sides",
      items: [
        {
          id: 7005,
          name: "Loaded Fries",
          description: "Queso, jalapeno, scallions, crema.",
          price_minor_units: 899,
          image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 7006,
          name: "Street Slaw",
          description: "Crunchy cabbage, citrus, sesame, herbs.",
          price_minor_units: 499,
        },
      ],
    },
    {
      title: "Sweets and Drinks",
      items: [
        {
          id: 7007,
          name: "Churro Bites",
          description: "Warm cinnamon sugar with caramel dip.",
          price_minor_units: 699,
          image_url: "https://images.unsplash.com/photo-1519915028121-7d3463d3b6a7?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 7008,
          name: "House Limeade",
          description: "Fresh lime, cane sugar, crushed ice.",
          price_minor_units: 399,
        },
      ],
    },
  ],
};

export const RUSTIC_ITALIAN_MENU_PREVIEW_SAMPLE = {
  ok: true,
  restaurant_id: 0,
  restaurant_name: "Riviera Pizzeria",
  name: "Riviera Pizzeria",
  slug: "riviera-pizzeria",
  logo_url: null,
  accent_color: "#b63c2f",
  hero_image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80",
  cover_image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80",
  menu_name: "Dinner Menu",
  address_line1: "214 Via Roma",
  city: "Birmingham",
  state: "AL",
  zip: "35203",
  tagline: "Warm red accents, wood-fired food, and a menu that feels like a neighborhood pizzeria.",
  font_preset: "serif",
  menu_presentation: { tabs_allowed_for_public_view: false },
  deal_items: [],
  sections: [
    {
      title: "Antipasti",
      image_url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 8001,
          name: "Burrata Caprese",
          description: "Tomatoes, basil oil, balsamic, grilled bread.",
          price_minor_units: 1395,
          image_url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 8002,
          name: "Garlic Knots",
          description: "Parmesan, herbs, marinara.",
          price_minor_units: 795,
        },
      ],
    },
    {
      title: "Pizzas",
      image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 8003,
          name: "Margherita",
          description: "San Marzano, mozzarella, basil, olive oil.",
          price_minor_units: 1595,
          image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 8004,
          name: "Sausage and Peppers",
          description: "Roasted peppers, fennel sausage, mozzarella.",
          price_minor_units: 1795,
        },
      ],
    },
    {
      title: "Pasta",
      image_url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 8005,
          name: "Rigatoni Bolognese",
          description: "Slow simmered meat sauce, pecorino.",
          price_minor_units: 1895,
        },
        {
          id: 8006,
          name: "Lemon Cacio e Pepe",
          description: "Black pepper, pecorino, lemon zest.",
          price_minor_units: 1745,
          image_url: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
        },
      ],
    },
    {
      title: "Dolci and Drinks",
      items: [
        {
          id: 8007,
          name: "Tiramisu",
          description: "Mascarpone, espresso, cocoa.",
          price_minor_units: 895,
          image_url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 8008,
          name: "House Chianti",
          description: "Glass pour, red fruit, dry finish.",
          price_minor_units: 1095,
        },
      ],
    },
  ],
};

export const MODERN_ASIAN_MENU_PREVIEW_SAMPLE = {
  ok: true,
  restaurant_id: 0,
  restaurant_name: "Sora Kitchen",
  name: "Sora Kitchen",
  slug: "sora-kitchen",
  logo_url: null,
  accent_color: "#c9a35b",
  hero_image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1600&q=80",
  cover_image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1600&q=80",
  menu_name: "Chef's Menu",
  address_line1: "18 Lantern Street",
  city: "Los Angeles",
  state: "CA",
  zip: "90012",
  tagline: "Sushi, bowls, and elegant shared plates with a calm, photo-forward presentation.",
  font_preset: "default",
  menu_presentation: { tabs_allowed_for_public_view: false },
  deal_items: [],
  sections: [
    {
      title: "Rolls",
      image_url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 9001,
          name: "Sunset Roll",
          description: "Salmon, mango, avocado, yuzu mayo.",
          price_minor_units: 1595,
          image_url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 9002,
          name: "Crispy Tempura Roll",
          description: "Shrimp tempura, cucumber, spicy crunch.",
          price_minor_units: 1495,
        },
      ],
    },
    {
      title: "Bowls",
      image_url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=80",
      items: [
        {
          id: 9003,
          name: "Spicy Tuna Bowl",
          description: "Rice, tuna, avocado, cucumber, sesame.",
          price_minor_units: 1795,
          image_url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 9004,
          name: "Miso Salmon Bowl",
          description: "Rice, salmon, greens, miso glaze, pickles.",
          price_minor_units: 1895,
        },
      ],
    },
    {
      title: "Shared Plates",
      items: [
        {
          id: 9005,
          name: "Gyoza",
          description: "Crispy dumplings, ginger soy.",
          price_minor_units: 995,
        },
        {
          id: 9006,
          name: "Crispy Brussels",
          description: "Chili vinaigrette, toasted sesame.",
          price_minor_units: 895,
          image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
        },
      ],
    },
    {
      title: "Tea and Dessert",
      items: [
        {
          id: 9007,
          name: "Matcha Cheesecake",
          description: "Sesame crust, berry compote.",
          price_minor_units: 795,
          image_url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80",
        },
        {
          id: 9008,
          name: "Yuzu Sparkling Tea",
          description: "Bright citrus, lightly sweet.",
          price_minor_units: 495,
        },
      ],
    },
  ],
};

export const MENU_THEME_PREVIEW_PAYLOADS = {
  v1: KBC_DEFAULT_MENU_PREVIEW_SAMPLE,
  v4: MENU_TEMPLATE_PREVIEW_SAMPLE,
  v6: MENU_TEMPLATE_PREVIEW_SAMPLE,
  v7: STREET_CHALKBOARD_MENU_PREVIEW_SAMPLE,
  v8: RUSTIC_ITALIAN_MENU_PREVIEW_SAMPLE,
  v9: MODERN_ASIAN_MENU_PREVIEW_SAMPLE,
};
