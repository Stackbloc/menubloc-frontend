import React, { useState } from "react";
import { Link } from "react-router-dom";

function formatDistance(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${n.toFixed(1)} mi`;
}

const CARD_THEMES = [
  {
    gradient: "linear-gradient(145deg, #e879f9 0%, #818cf8 55%, #67e8f9 100%)",
    accent: "#e879f9",
    dot: "#f0abfc",
  },
  {
    gradient: "linear-gradient(145deg, #fb7185 0%, #f472b6 50%, #c084fc 100%)",
    accent: "#fb7185",
    dot: "#fda4af",
  },
  {
    gradient: "linear-gradient(145deg, #10b981 0%, #34d399 45%, #60a5fa 100%)",
    accent: "#10b981",
    dot: "#6ee7b7",
  },
  {
    gradient: "linear-gradient(145deg, #f59e0b 0%, #fb923c 50%, #f472b6 100%)",
    accent: "#f59e0b",
    dot: "#fde68a",
  },
  {
    gradient: "linear-gradient(145deg, #38bdf8 0%, #818cf8 50%, #a78bfa 100%)",
    accent: "#38bdf8",
    dot: "#7dd3fc",
  },
  {
    gradient: "linear-gradient(145deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)",
    accent: "#f97316",
    dot: "#fdba74",
  },
  {
    gradient: "linear-gradient(145deg, #06b6d4 0%, #10b981 50%, #84cc16 100%)",
    accent: "#06b6d4",
    dot: "#a5f3fc",
  },
  {
    gradient: "linear-gradient(145deg, #a855f7 0%, #6366f1 50%, #38bdf8 100%)",
    accent: "#a855f7",
    dot: "#d8b4fe",
  },
  {
    gradient: "linear-gradient(145deg, #eab308 0%, #10b981 50%, #38bdf8 100%)",
    accent: "#eab308",
    dot: "#fde68a",
  },
  {
    gradient: "linear-gradient(145deg, #f43f5e 0%, #f97316 50%, #facc15 100%)",
    accent: "#f43f5e",
    dot: "#fda4af",
  },
];

// Name-based keyword rules — checked first, most specific wins
// Order matters: more specific entries should come before generic ones
const NAME_EMOJI_RULES = [
  // Chicken-forward concepts
  { keywords: ["chick-fil", "chick fil", "chickfil"], emoji: "🍗" },
  { keywords: ["wingstop", "wing stop", "buffalo wild", "bdubs", "hooters", "pluckers"], emoji: "🍗" },
  { keywords: ["popeyes", "popeye", "raising cane", "zaxby", "bojangles", "golden chick", "slim chickens"], emoji: "🍗" },
  { keywords: ["kfc", "kentucky fried"], emoji: "🍗" },
  // Pizza
  { keywords: ["pizza", "pizzeria", "pie", "mellow mushroom", "domino", "papa john", "little caesar", "round table", "zpizza"], emoji: "🍕" },
  // Burgers — genuine burger joints
  { keywords: ["whataburger", "five guys", "smashburger", "shake shack", "in-n-out", "in n out", "culver", "steak n shake", "fatburger", "back yard burger", "habit burger"], emoji: "🍔" },
  { keywords: ["mcdonald", "burger king", "wendy", "jack in the box", "sonic drive"], emoji: "🍔" },
  // Upscale / steak / grill — before generic "burger" or "american" match
  { keywords: ["steakhouse", "steak house", "chop house", "chophouse", "ruth chris", "outback", "longhorn", "texas roadhouse", "black angus", "del frisco", "mastro"], emoji: "🥩" },
  { keywords: ["firestone", "fire stone", "grille", "grill & bar", "gastropub", "craft kitchen", "kitchen & bar", "kitchen + bar", "social kitchen", "american kitchen"], emoji: "🍽️" },
  // Seafood
  { keywords: ["seafood", "sea food", "lobster", "crab", "shrimp", "fish", "oyster", "catch", "captain d", "long john silver", "red lobster", "joe's crab"], emoji: "🦞" },
  // Sushi / Japanese
  { keywords: ["sushi", "hibachi", "ramen", "izakaya", "bento", "teriyaki", "poke", "pokē"], emoji: "🍣" },
  // Mexican
  { keywords: ["taco", "burrito", "chipotle", "qdoba", "moe's", "taqueria", "cantina", "mexican", "tex-mex", "tex mex"], emoji: "🌮" },
  // Italian
  { keywords: ["italian", "pasta", "olive garden", "carrabba", "macaroni grill", "trattoria", "osteria", "ristorante"], emoji: "🍝" },
  // Chinese
  { keywords: ["chinese", "panda express", "dim sum", "wok", "hunan", "szechuan", "sichuan", "canton"], emoji: "🥡" },
  // Indian
  { keywords: ["indian", "curry", "tandoor", "naan", "biryani", "masala"], emoji: "🍛" },
  // Thai
  { keywords: ["thai", "pad thai", "satay"], emoji: "🍜" },
  // Korean
  { keywords: ["korean", "bbq korean", "korean bbq", "bulgogi"], emoji: "🍲" },
  // BBQ (non-Korean) — after Korean BBQ rule
  { keywords: ["bbq", "barbeque", "barbecue", "smokehouse", "smoke house", "dickey", "dreamland", "fat matt", "jim 'n nick", "corky"], emoji: "🔥" },
  // Sandwiches / subs
  { keywords: ["subway", "jersey mike", "firehouse sub", "potbelly", "quiznos", "jimmy john", "sandwich", "sub shop", "deli"], emoji: "🥪" },
  // Breakfast / brunch
  { keywords: ["ihop", "denny", "waffle house", "cracker barrel", "first watch", "egg", "pancake", "breakfast", "brunch", "biscuit"], emoji: "🥞" },
  // Cafe / coffee
  { keywords: ["starbucks", "dunkin", "coffee", "café", "cafe", "espresso", "roast", "brew"], emoji: "☕" },
  // Mediterranean / Greek
  { keywords: ["mediterranean", "greek", "gyro", "falafel", "hummus", "shawarma", "kebab", "kabob"], emoji: "🫒" },
  // Fine dining generic
  { keywords: ["fine dining", "brasserie", "supper club", "tavern", "bistro"], emoji: "🍽️" },
  // Bar / pub
  { keywords: ["brewery", "pub", "tavern", "alehouse", "ale house", "taproom", "tap room"], emoji: "🍺" },
];

const CUISINE_EMOJI = {
  chicken: "🍗", italian: "🍝", mexican: "🌮", chinese: "🥡",
  japanese: "🍱", thai: "🍜", indian: "🍛", french: "🥐",
  mediterranean: "🫒", greek: "🥗", korean: "🍲", vietnamese: "🍜",
  pizza: "🍕", seafood: "🦞", bbq: "🔥", cafe: "☕",
  "fast food": "🍟", "fine dining": "🍽️",
  bar: "🍺", sushi: "🍣", burger: "🍔", sandwich: "🥪",
  breakfast: "🥞", brunch: "🥞", steakhouse: "🥩", american: "🍽️",
};

function getCuisineEmoji(restaurantName, cuisine) {
  // 1. Check restaurant name first — most accurate signal
  if (restaurantName) {
    const name = restaurantName.toLowerCase();
    for (const rule of NAME_EMOJI_RULES) {
      if (rule.keywords.some((kw) => name.includes(kw))) return rule.emoji;
    }
  }
  // 2. Fall back to cuisine type
  if (!cuisine) return "🍽️";
  const key = cuisine.toLowerCase();
  for (const [k, v] of Object.entries(CUISINE_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return "🍽️";
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", inset: 0, zIndex: 20,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        borderRadius: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 18px",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.4 }}>
        {message}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            padding: "8px 22px", borderRadius: 999,
            background: "#fff", color: "#11211a",
            fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer",
          }}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "8px 22px", borderRadius: 999,
            background: "rgba(255,255,255,0.15)", color: "#fff",
            fontSize: 13, fontWeight: 800,
            border: "1px solid rgba(255,255,255,0.35)", cursor: "pointer",
          }}
        >
          No
        </button>
      </div>
    </div>
  );
}

export default function MenuPreviewCard({ menu, index = 0, activeFilterLabel = null, activeFilterParams = "" }) {
  const [hover, setHover] = useState(false);
  const [confirm, setConfirm] = useState(null); // null | "phone" | "order"
  const baseHref = `/public/restaurants/${menu?.restaurant_id}/menu`;
  const href = activeFilterParams ? `${baseHref}?${activeFilterParams}` : baseHref;
  const phone = menu?.phone || null;
  const websiteUrl = menu?.website_url || null;
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const isVerified = menu?.menu_status === "published";
  const distance = formatDistance(menu?.distance_miles);
  const cuisine = menu?.cuisine
    ? menu.cuisine.charAt(0).toUpperCase() + menu.cuisine.slice(1)
    : null;
  const emoji = getCuisineEmoji(menu?.restaurant_name, menu?.cuisine || menu?.category);
  const itemCount = menu?.menu_item_count || 0;
  const itemCountLabel = itemCount > 0
    ? activeFilterLabel
      ? `${itemCount} ${activeFilterLabel} ${itemCount === 1 ? "item" : "items"}`
      : `${itemCount} ${itemCount === 1 ? "item" : "items"}`
    : null;

  return (
    <Link
      to={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        textDecoration: "none",
        color: "#fff",
        transform: hover ? "scale(1.04) translateY(-5px)" : "scale(1)",
        transition: "transform 240ms cubic-bezier(.22,.68,0,1.2), box-shadow 240ms ease",
        borderRadius: 20,
        boxShadow: hover
          ? `0 28px 56px rgba(0,0,0,0.32), 0 8px 20px rgba(0,0,0,0.18), 0 0 0 1.5px rgba(255,255,255,0.18)`
          : "0 6px 20px rgba(0,0,0,0.18)",
      }}
    >
      <article
        style={{
          position: "relative",
          width: "100%",
          height: 210,
          borderRadius: 20,
          overflow: "hidden",
          background: theme.gradient,
        }}
      >
        {/* Noise texture overlay for depth */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.35,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }} />

        {/* Top shimmer highlight */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.32) 0%, transparent 60%), radial-gradient(ellipse at 10% 90%, rgba(255,255,255,0.10) 0%, transparent 40%)",
          pointerEvents: "none",
        }} />

        {/* Accent glow pulse on hover */}
        {hover && (
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse at 50% 100%, ${theme.accent}55 0%, transparent 65%)`,
            transition: "opacity 240ms ease",
            pointerEvents: "none",
          }} />
        )}

        {/* Dark overlay — full card for readability */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: hover
            ? "rgba(0,0,0,0.38)"
            : "rgba(0,0,0,0.28)",
          transition: "background 240ms ease",
          pointerEvents: "none",
        }} />

        {/* Verified badge — top right */}
        {isVerified ? (
          <div style={{
            position: "absolute", top: 12, right: 12, zIndex: 4,
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px",
            borderRadius: 999,
            fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
            background: "rgba(255,255,255,0.22)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.35)",
            color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0, boxShadow: "0 0 5px #4ade80" }} />
            LIVE MENU
          </div>
        ) : (
          <div style={{
            position: "absolute", top: 12, right: 12, zIndex: 4,
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px",
            borderRadius: 999,
            fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
            background: "rgba(0,0,0,0.30)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.75)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#facc15", flexShrink: 0 }} />
            UNVERIFIED
          </div>
        )}

        {/* Center content — emoji + name + meta */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          bottom: (phone || websiteUrl) ? 64 : 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 18px",
          textAlign: "center",
          gap: 0,
        }}>
          {/* Emoji */}
          <div style={{
            fontSize: 42,
            lineHeight: 1,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
            transform: hover ? "scale(1.12)" : "scale(1)",
            transition: "transform 240ms cubic-bezier(.22,.68,0,1.2)",
            marginBottom: 10,
          }}>
            {emoji}
          </div>

          {/* Restaurant name */}
          <div style={{
            fontSize: 19,
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: -0.4,
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
            color: "#fff",
            marginBottom: 6,
          }}>
            {menu?.restaurant_name || "Restaurant"}
          </div>

          {/* Meta pill */}
          {(cuisine || distance || itemCount > 0) && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.28)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: theme.dot,
                flexShrink: 0,
                boxShadow: `0 0 5px ${theme.dot}`,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: "rgba(255,255,255,0.88)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 200,
              }}>
                {[distance, itemCountLabel, cuisine].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons — bottom center */}
        {!confirm && (
          <div
            onClick={(e) => e.preventDefault()}
            style={{
              position: "absolute", bottom: 14, left: 0, right: 0,
              display: "flex", justifyContent: "space-between", zIndex: 10,
              padding: "0 16px",
            }}
          >
            {phone && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirm("phone"); }}
                style={{
                  height: 36, borderRadius: 8, padding: "0 16px",
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.40)",
                  color: "#fff", fontSize: 12, fontWeight: 800,
                  display: "flex", alignItems: "center", gap: 6,
                  cursor: "pointer", whiteSpace: "nowrap",
                  letterSpacing: 0.3,
                  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                }}
              >
                📞 Call
              </button>
            )}
            {websiteUrl && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirm("order"); }}
                style={{
                  height: 36, borderRadius: 8, padding: "0 16px",
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.40)",
                  color: "#fff", fontSize: 12, fontWeight: 800,
                  display: "flex", alignItems: "center", gap: 6,
                  cursor: "pointer", whiteSpace: "nowrap",
                  letterSpacing: 0.3,
                  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                }}
              >
                🍴 Order
              </button>
            )}
          </div>
        )}

        {/* Hover: "View Menu" shimmer */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
          opacity: hover && !confirm ? 1 : 0,
          transition: "opacity 220ms ease",
          zIndex: 5,
        }}>
          <div style={{
            padding: "7px 20px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.35)",
            fontSize: 12, fontWeight: 800,
            color: "#fff",
            letterSpacing: 0.6,
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}>
            View Menu
          </div>
        </div>

        {/* Confirm overlays */}
        {confirm === "phone" && (
          <ConfirmDialog
            message={`Call ${menu?.restaurant_name || "this restaurant"}?`}
            onConfirm={() => { setConfirm(null); window.location.href = `tel:${phone}`; }}
            onCancel={() => setConfirm(null)}
          />
        )}
        {confirm === "order" && (
          <ConfirmDialog
            message={`Go to ${menu?.restaurant_name || "this restaurant"}'s website to order?`}
            onConfirm={() => { setConfirm(null); window.open(websiteUrl, "_blank", "noopener,noreferrer"); }}
            onCancel={() => setConfirm(null)}
          />
        )}
      </article>
    </Link>
  );
}
