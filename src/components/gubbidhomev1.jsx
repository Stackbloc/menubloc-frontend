#!/bin/bash
# Grubbid Home Screen v1 - Install Script
# Drops GrubbidHomeV1.jsx into src/components and prints wiring instructions.
# Run from any directory. Does NOT modify existing files.

FRONTEND="$HOME/menubloc/menubloc-frontend"
DEST="$FRONTEND/src/components/GrubbidHomeV1.jsx"

mkdir -p "$FRONTEND/src/components"

cat > "$DEST" << 'COMPONENT'
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const restaurants = [
  {
    id: 1,
    name: "Bella's Fine Dining",
    cuisine: "Italian",
    distance: "0.4 mi",
    rating: 4.7,
    reviews: 312,
    price: "$$$$",
    open: true,
    waitTime: "15–20 min",
    tags: ["Pasta", "Wine", "Romantic"],
    accent: "#e8a87c",
    emoji: "🍝",
  },
  {
    id: 2,
    name: "The Blue Plate",
    cuisine: "American Diner",
    distance: "0.6 mi",
    rating: 4.4,
    reviews: 189,
    price: "$$",
    open: true,
    waitTime: "5–10 min",
    tags: ["Burgers", "Breakfast", "Classic"],
    accent: "#6bb5d6",
    emoji: "🍔",
  },
  {
    id: 3,
    name: "The Blue Plate South",
    cuisine: "Southern",
    distance: "0.6 mi",
    rating: 4.6,
    reviews: 241,
    price: "$$",
    open: false,
    waitTime: null,
    tags: ["Soul Food", "BBQ", "Comfort"],
    accent: "#c97b4b",
    emoji: "🍖",
  },
  {
    id: 4,
    name: "Burger King",
    cuisine: "Fast Food",
    distance: "0.9 mi",
    rating: 3.8,
    reviews: 540,
    price: "$",
    open: true,
    waitTime: "< 5 min",
    tags: ["Burgers", "Quick", "Value"],
    accent: "#d4a017",
    emoji: "👑",
  },
  {
    id: 5,
    name: "Pho Saigon",
    cuisine: "Vietnamese",
    distance: "1.1 mi",
    rating: 4.9,
    reviews: 88,
    price: "$$",
    open: true,
    waitTime: "10–15 min",
    tags: ["Pho", "Noodles", "Healthy"],
    accent: "#7bc47b",
    emoji: "🍜",
  },
];

const categories = [
  { label: "All", icon: "✦" },
  { label: "Pizza", icon: "🍕" },
  { label: "Tacos", icon: "🌮" },
  { label: "Sushi", icon: "🍣" },
  { label: "Healthy", icon: "🥗" },
  { label: "Dessert", icon: "🍦" },
];

function StarRating({ rating }) {
  return (
    <span style={{ color: "#f5a623", fontSize: "11px", fontWeight: 700 }}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span style={{ color: "#aaa", fontWeight: 400 }}> {rating}</span>
    </span>
  );
}

export default function GrubbidHomeV1() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [savedIds, setSavedIds] = useState([]);

  const toggleSave = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#f7f4ef",
      minHeight: "100vh",
      maxWidth: "390px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflowX: "hidden",
    }}>

      {/* Header */}
      <div style={{
        padding: "18px 20px 14px",
        background: "#f7f4ef",
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: "1px solid #e8e2d9",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a1a1a" }}>
              Grubbid
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "1px", fontFamily: "monospace" }}>
              📍 Near Dothan, AL
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button style={{
              background: "#1a1a1a",
              color: "#f7f4ef",
              border: "none",
              borderRadius: "20px",
              padding: "7px 14px",
              fontSize: "12px",
              fontFamily: "Georgia, serif",
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: "0.3px",
            }}>Deals</button>
            <div style={{
              width: "34px", height: "34px",
              background: "#e8e2d9",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "15px", cursor: "pointer",
            }}>👤</div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "#fff",
          borderRadius: "14px",
          border: searchFocused ? "2px solid #1a1a1a" : "2px solid #e8e2d9",
          padding: "11px 14px",
          gap: "10px",
          transition: "border 0.2s",
          boxShadow: searchFocused ? "0 4px 20px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <span style={{ fontSize: "16px", color: "#999" }}>🔍</span>
          <input
            placeholder="Search meals, ingredients..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              border: "none",
              outline: "none",
              flex: 1,
              minWidth: 0,
              width: "100%",
              fontSize: "14px",
              background: "transparent",
              color: "#1a1a1a",
              fontFamily: "Georgia, serif",
            }}
          />
          <div style={{
            background: "#f0ebe3",
            borderRadius: "8px",
            padding: "5px 8px",
            fontSize: "11px",
            color: "#666",
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "monospace",
            flexShrink: 0,
          }}>📷 Photo</div>
        </div>
      </div>

      {/* Category chips */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "14px 20px",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 13px",
              borderRadius: "20px",
              border: activeCategory === cat.label ? "2px solid #1a1a1a" : "2px solid #e8e2d9",
              background: activeCategory === cat.label ? "#1a1a1a" : "#fff",
              color: activeCategory === cat.label ? "#f7f4ef" : "#555",
              fontSize: "12px",
              fontFamily: "Georgia, serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: activeCategory === cat.label ? 700 : 400,
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Section label */}
      <div style={{ padding: "0 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
          Near You
        </div>
        <div style={{ fontSize: "12px", color: "#888", fontFamily: "monospace", cursor: "pointer" }}>
          Sort: Distance ↓
        </div>
      </div>

      {/* Restaurant Cards */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "90px" }}>
        {restaurants.map((r) => (
          <div key={r.id} style={{
            background: "#fff",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            border: "1px solid #ede8df",
            cursor: "pointer",
          }}>
            {/* Card color band */}
            <div style={{
              height: "6px",
              background: `linear-gradient(90deg, ${r.accent}, ${r.accent}88)`,
            }} />

            <div style={{ padding: "14px 16px" }}>
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{
                    width: "44px", height: "44px",
                    background: `${r.accent}22`,
                    borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}>{r.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#1a1a1a", letterSpacing: "-0.2px" }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "2px", fontFamily: "monospace" }}>
                      {r.cuisine} · {r.distance} · {r.price}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSave(r.id)}
                  style={{
                    background: "none", border: "none",
                    fontSize: "18px", cursor: "pointer",
                    padding: "2px",
                    opacity: savedIds.includes(r.id) ? 1 : 0.35,
                    transition: "opacity 0.2s",
                    flexShrink: 0,
                  }}
                >
                  🔖
                </button>
              </div>

              {/* Rating + status */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                <StarRating rating={r.rating} />
                <span style={{ color: "#ccc" }}>·</span>
                <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "monospace" }}>{r.reviews} reviews</span>
                <span style={{ color: "#ccc" }}>·</span>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: r.open ? "#3a9e5f" : "#cc5555",
                  background: r.open ? "#eaf7f0" : "#fdf0f0",
                  padding: "2px 7px",
                  borderRadius: "6px",
                }}>
                  {r.open ? `Open · ${r.waitTime}` : "Closed"}
                </span>
              </div>

              {/* Tags */}
              <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                {r.tags.map((tag) => (
                  <span key={tag} style={{
                    background: "#f4f0ea",
                    color: "#666",
                    fontSize: "11px",
                    padding: "3px 9px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                  }}>{tag}</span>
                ))}
              </div>

              {/* CTA */}
              <div style={{
                marginTop: "12px",
                paddingTop: "10px",
                borderTop: "1px solid #f0ebe3",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  letterSpacing: "0.2px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textDecorationColor: r.accent,
                  textUnderlineOffset: "3px",
                }}>View menu →</span>
                <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "monospace" }}>158 items</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "390px",
        background: "#fff",
        borderTop: "1px solid #e8e2d9",
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 0 20px",
        zIndex: 20,
      }}>
        {[
          { id: "home", icon: "⌂", label: "Home" },
          { id: "search", icon: "⊕", label: "Explore" },
          { id: "saved", icon: "◈", label: "Saved" },
          { id: "account", icon: "○", label: "Account" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              padding: "4px 12px",
            }}
          >
            <span style={{
              fontSize: "20px",
              color: activeTab === tab.id ? "#1a1a1a" : "#bbb",
              transition: "color 0.15s",
            }}>{tab.icon}</span>
            <span style={{
              fontSize: "10px",
              color: activeTab === tab.id ? "#1a1a1a" : "#bbb",
              fontFamily: "monospace",
              fontWeight: activeTab === tab.id ? 700 : 400,
              transition: "color 0.15s",
            }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
COMPONENT

echo ""
echo "✅ File written to: $DEST"
echo ""
echo "Next step: open a Claude Code session and paste this prompt:"
echo "------------------------------------------------------------"
cat << 'PROMPT'
Task: Wire up the new GrubbidHomeV1 component into the existing Grubbid React+Vite app.

The new component lives at:
  src/components/GrubbidHomeV1.jsx

Steps:
1. Read App.jsx (or the root router file) to understand current routing/layout structure
2. Read the existing home/landing component to understand what props or state (restaurants list, search query, location) it currently receives from the app shell
3. Replace the static mock `restaurants` array in GrubbidHomeV1.jsx with the real data source already used by the existing home component — keep the same shape: { id, name, cuisine, distance, rating, reviews, price, open, waitTime, tags, accent, emoji }
4. Wire the search input's onChange to the existing search handler
5. Wire "View menu →" onClick to the existing restaurant detail navigation
6. Mount GrubbidHomeV1 on the same route as the current home screen (replace or alias — your call based on what you see)
7. Do not delete the old home component yet — just swap the route so GrubbidHomeV1 renders first
8. Show me a diff of every file changed before writing anything
PROMPT
echo "------------------------------------------------------------"