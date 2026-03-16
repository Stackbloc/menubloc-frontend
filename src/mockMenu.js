// menubloc-frontend/src/mockMenu.js
// Mock menu data used by GrubbidMenuView while backend wiring stabilizes.
// Shape intentionally supports multiple possible schemas via adapter:
// - categories: [{ key/title, items: [...] }]
// - menu: [{ name/title, items: [...] }]  (legacy sections)

export const MOCK_MENU = {
  restaurant: {
    id: 10,
    slug: "diddy-riese",
    name: "Diddy Riese",
    cuisine: "Dessert / Cookies",
    address: "926 Broxton Ave",
    city: "Los Angeles",
    state: "CA",
    phone: "(310) 208-0444",
    hero_image_url:
      "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1600&q=60",
  },

  // Legacy “sections” shape (adapter will normalize this)
  menu: [
    {
      id: "sec-specials",
      name: "Specials",
      items: [
        {
          id: "sp-1",
          name: "Cookie + Scoop Combo",
          description: "Any cookie with any scoop. Limited time.",
          price: 5.0,
          signals: ["deal", "popular"],
        },
      ],
    },
    {
      id: "sec-apps",
      name: "Appetizers",
      items: [
        {
          id: "ap-1",
          name: "Mini Cookie Sampler",
          description: "A small box of rotating favorites.",
          price: 4.5,
          signals: ["trending"],
        },
      ],
    },
    {
      id: "sec-desserts",
      name: "Desserts",
      items: [
        {
          id: "d-1",
          name: "Chocolate Chip Cookie",
          description: "Classic chewy cookie with chocolate chips.",
          price: 2.5,
          signals: ["popular"],
        },
        {
          id: "d-2",
          name: "Oatmeal Raisin Cookie",
          description: "Oats, raisins, cinnamon — soft and hearty.",
          price: 2.5,
          signals: [],
        },
        {
          id: "d-3",
          name: "Vanilla Scoop",
          description: "Simple, creamy vanilla.",
          price: 3.5,
          signals: [],
        },
        {
          id: "d-4",
          name: "Chocolate Scoop",
          description: "Rich chocolate ice cream.",
          price: 3.5,
          signals: [],
        },
      ],
    },
    {
      id: "sec-bev",
      name: "Beverages",
      items: [
        {
          id: "b-1",
          name: "Cold Brew",
          description: "Smooth, bold, and cold.",
          price: 3.75,
          signals: ["recommended"],
        },
      ],
    },
  ],
};

export const mockMenu = MOCK_MENU;
export default MOCK_MENU;