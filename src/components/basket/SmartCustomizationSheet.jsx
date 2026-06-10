/**
 * SmartCustomizationSheet
 *
 * Shown when a user taps a customizable item (burger, sandwich, taco, etc.).
 * Displays ingredient defaults and offers:
 *   - "Remove X" actions for any Foods I Avoid matches (offered quietly, no visual signal)
 *   - "Add Without [ingredient]" primary button when removes are selected
 *   - "Add to basket" fast path otherwise
 *   - "Customize" to open the full ModifierSheet
 *   - Special instructions field
 */

import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { formatMenuItemName } from "../../utils/formatMenuItemName.js";

// ── Customizable item type detection ─────────────────────────────────────────

const CUSTOMIZABLE_TYPES = new Set([
  "BURGERS", "SANDWICHES", "TACOS", "PIZZA", "BOWLS", "SALADS",
]);

const TYPE_KEYWORDS = [
  { pattern: /\bburger\b/i,                       type: "BURGERS" },
  { pattern: /\bcheeseburger\b/i,                 type: "BURGERS" },
  { pattern: /\bsandwich|sub\b|hoagie|grinder/i,  type: "SANDWICHES" },
  { pattern: /\bwrap\b/i,                         type: "SANDWICHES" },
  { pattern: /\btaco\b/i,                         type: "TACOS" },
  { pattern: /\bburrito\b/i,                      type: "TACOS" },
  { pattern: /\bquesadilla\b/i,                   type: "TACOS" },
  { pattern: /\bpizza\b/i,                        type: "PIZZA" },
  { pattern: /\bowl\b/i,                          type: "BOWLS" },
  { pattern: /\bsalad\b/i,                        type: "SALADS" },
  { pattern: /\bhot dog\b/i,                      type: "SANDWICHES" },
];

// Default ingredient sets per type — used when MKS data is unavailable.
// Future: replace with real MKS ingredient data per item.
const DEFAULT_INGREDIENTS = {
  BURGERS:     ["Bun", "Beef Patty", "Lettuce", "Tomato", "Onion", "Pickles", "Sauce"],
  SANDWICHES:  ["Bread", "Protein", "Lettuce", "Tomato", "Onion", "Mayo"],
  TACOS:       ["Tortilla", "Protein", "Onion", "Cilantro", "Salsa"],
  PIZZA:       ["Crust", "Sauce", "Cheese", "Toppings"],
  BOWLS:       ["Base", "Protein", "Vegetables", "Sauce"],
  SALADS:      ["Greens", "Toppings", "Dressing"],
};

// Map avoid_key → ingredient display name(s) — used to match avoided items to defaults.
const AVOID_KEY_TO_INGREDIENTS = {
  onions:        ["Onion", "Onions", "Caramelized Onions", "Red Onion"],
  tomatoes:      ["Tomato", "Tomatoes"],
  pickles:       ["Pickles", "Pickle"],
  cilantro:      ["Cilantro"],
  mushrooms:     ["Mushrooms", "Mushroom"],
  olives:        ["Olives", "Olive"],
  anchovies:     ["Anchovies", "Anchovy"],
  blue_cheese:   ["Blue Cheese"],
  coconut:       ["Coconut"],
  seafood:       ["Seafood", "Shrimp", "Crab", "Lobster", "Clams"],
  organ_meats:   ["Liver", "Kidneys", "Organ Meats"],
  spicy_foods:   ["Jalapeño", "Hot Sauce", "Sriracha", "Chili", "Peppers"],
  fried_foods:   [],
};

export function detectItemType(item) {
  const name = String(item?.name || item?.item_name || "").toLowerCase();
  const section = String(item?.section_name || item?.section_header || item?.category || "").toLowerCase();
  const mksCode = String(item?.mks_category || item?.mksCategory || "").toUpperCase();

  if (CUSTOMIZABLE_TYPES.has(mksCode)) return mksCode;

  for (const { pattern, type } of TYPE_KEYWORDS) {
    if (pattern.test(name) || pattern.test(section)) return type;
  }

  return null;
}

export function isCustomizableItem(item) {
  return detectItemType(item) !== null;
}

function getIngredients(item) {
  const type = detectItemType(item);
  if (!type) return [];
  return DEFAULT_INGREDIENTS[type] || [];
}

function findAvoidedInIngredients(ingredients, foodsToAvoid) {
  const avoidedSet = new Set(foodsToAvoid);
  const hits = [];
  for (const key of avoidedSet) {
    const matchNames = AVOID_KEY_TO_INGREDIENTS[key] || [];
    for (const ingredient of ingredients) {
      if (matchNames.some((m) => ingredient.toLowerCase().includes(m.toLowerCase()))) {
        hits.push({ key, ingredient });
      }
    }
  }
  return hits;
}

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SmartCustomizationSheet({
  item,
  foodsToAvoid = [],
  open,
  onClose,
  onAddToCart,
  onCustomize,
}) {
  const { t } = useLanguage();
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [removedIngredients, setRemovedIngredients] = useState(new Set());

  if (!open || !item) return null;

  const name = formatMenuItemName(item.name) || "Item";
  const description = item.description || null;
  const priceCents = item.consumer_display_price ?? item.price_cents ?? 0;
  const ingredients = getIngredients(item);
  const avoidsInItem = findAvoidedInIngredients(ingredients, foodsToAvoid);

  function toggleRemove(ingredient) {
    setRemovedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredient)) {
        next.delete(ingredient);
      } else {
        next.add(ingredient);
      }
      return next;
    });
  }

  function buildAvoidanceNote() {
    if (removedIngredients.size === 0) return null;
    const list = [...removedIngredients].join(", ");
    return `No ${list}`;
  }

  function handleAddToCart() {
    const avoidNote = buildAvoidanceNote();
    const combined = [avoidNote, specialInstructions.trim()].filter(Boolean).join(". ");
    onAddToCart(item, combined || null);
  }

  function handleCustomize() {
    const avoidNote = buildAvoidanceNote();
    const combined = [avoidNote, specialInstructions.trim()].filter(Boolean).join(". ");
    onCustomize(item, combined || null);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2,6,23,0.42)",
          zIndex: 1180,
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${t("smart.customize", "Order")} ${name}`}
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: 12,
          maxWidth: 560,
          margin: "0 auto",
          background: "#fffef8",
          borderRadius: 24,
          border: "1px solid rgba(17,33,26,0.10)",
          boxShadow: "0 28px 60px rgba(15,23,42,0.22)",
          zIndex: 1181,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(17,33,26,0.08)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#11211a" }}>{name}</div>
              {description ? (
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: "#475467" }}>
                  {description}
                </div>
              ) : null}
              {priceCents > 0 ? (
                <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: "#11211a" }}>
                  {formatMoney(priceCents)}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "1px solid rgba(17,33,26,0.10)",
                background: "#fff",
                borderRadius: 999,
                width: 36,
                height: 36,
                cursor: "pointer",
                flexShrink: 0,
                fontSize: 18,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Ingredients list */}
        {ingredients.length > 0 ? (
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
              {t("smart.includes", "Includes")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ingredients.map((ingredient) => {
                const removed = removedIngredients.has(ingredient);
                return (
                  <span
                    key={ingredient}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "5px 10px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                      border: removed ? "1.5px solid #d1d5db" : "1.5px solid rgba(17,33,26,0.12)",
                      background: removed ? "#f9fafb" : "#fff",
                      color: removed ? "#9ca3af" : "#11211a",
                      textDecoration: removed ? "line-through" : "none",
                    }}
                  >
                    {ingredient}
                  </span>
                );
              })}
            </div>

          </div>
        ) : null}

        {/* Quick remove buttons for avoided ingredients */}
        {avoidsInItem.length > 0 ? (
          <div style={{ padding: "12px 20px 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {avoidsInItem.map(({ ingredient }) => {
              const removed = removedIngredients.has(ingredient);
              return (
                <button
                  key={ingredient}
                  type="button"
                  onClick={() => toggleRemove(ingredient)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: removed ? "1.5px solid #22c55e" : "1.5px solid rgba(17,33,26,0.15)",
                    background: removed ? "#f0fdf4" : "#fff",
                    color: removed ? "#15803d" : "#11211a",
                  }}
                >
                  {removed
                    ? `✓ ${t("smart.removed", "Removed")} ${ingredient}`
                    : `${t("smart.removeX", "Remove")} ${ingredient}`}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Special instructions */}
        <div style={{ padding: "16px 20px 0" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#475467", marginBottom: 6 }}>
            {t("modifier.specialInstructions", "Special instructions")}
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder={t("modifier.specialInstructionsPlaceholder", "Example: no onions, sauce on side, light mayo")}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(17,33,26,0.15)",
              fontSize: 13,
              color: "#11211a",
              resize: "none",
              fontFamily: "inherit",
              outline: "none",
              background: "#f9fafb",
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ padding: "16px 20px 20px", display: "grid", gap: 8 }}>
          <button
            type="button"
            onClick={handleAddToCart}
            style={{
              border: "none",
              borderRadius: 16,
              background: "#11211a",
              color: "#fff",
              padding: "14px 16px",
              fontSize: 15,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {removedIngredients.size > 0
              ? `${t("smart.addWithout", "Add Without")} ${[...removedIngredients].join(", ")}`
              : t("modifier.addToBasket", "Add to basket")}
          </button>
          <button
            type="button"
            onClick={handleCustomize}
            style={{
              border: "1.5px solid rgba(17,33,26,0.15)",
              borderRadius: 16,
              background: "#fff",
              color: "#11211a",
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {t("smart.customize", "Customize")}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#667085",
              padding: "2px 0 0",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {t("modifier.cancel", "Cancel")}
          </button>
        </div>
      </div>
    </>
  );
}
