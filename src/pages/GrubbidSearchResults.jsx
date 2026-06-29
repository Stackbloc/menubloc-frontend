/**
 * ============================================================
 * File: GrubbidSearchResults.jsx
 * Path: menubloc-frontend/src/pages/GrubbidSearchResults.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Search results page for Grubbid.
 *   - Reads query params from URL
 *   - Calls backend /search endpoint (with lat/lng when available)
 *   - Groups menu-item results by restaurant
 *   - Dedupes menu items per restaurant (best score, then lower price)
 *   - Interactive filter bar (vegan, gluten-free, deals, price max)
 *   - Geo-proximity: browser geolocation is requested on mount.
 *
 *   Mobile-safe revision:
 *   - tighter spacing and typography on phones
 *   - filter controls wrap cleanly
 *   - no horizontal overflow
 *   - cards remain one-column and readable on small screens
 * ============================================================
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchResultCard from "../components/SearchResultCard";
import ActiveFilterChips from "../components/discovery/ActiveFilterChips.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import BottomNav from "../components/BottomNav.jsx";
import WaiterRefinementPrompt from "../components/search/WaiterRefinementPrompt.jsx";
import FoodNavigationLadder from "../components/search/FoodNavigationLadder.jsx";
import { useFoodNavigation, FOOD_NAV_SLICE_ENABLED } from "../hooks/useFoodNavigation.js";
import { recordFoodNavEvent } from "../lib/waiterApi.js";

import { SectionTitle, StatusMessage } from "../components/grubbid/GrubbidPrimitives.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { buildDietaryQueryParams } from "../lib/dietaryParams.js";
import { buildRestaurantFilterQueryParams } from "../lib/restaurantFilterParams.js";
import { parseFiltersFromUrl, filtersToUrlParams } from "../lib/filterUtils.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import { trackSearchPerformed } from "../lib/analytics.js";
import {
  buildRestaurantBrowseRows,
  countUniqueRestaurants,
  shouldShowSearchResultModeSelector,
} from "../lib/searchResultViewMode.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SEARCH_SESSION_KEY = "grubbid.search.session_id";

/* ---- Mobile hook ---- */

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

/* ---- Geolocation hook ---- */

function SearchResultModeSelector({ dishCount, restaurantCount, mode, onModeChange }) {
  const dishLabel = `${dishCount} ${dishCount === 1 ? "Dish" : "Dishes"}`;
  const restaurantLabel = `${restaurantCount} ${restaurantCount === 1 ? "Restaurant" : "Restaurants"}`;

  const optionStyle = (selected) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: selected ? 800 : 600,
    color: selected ? "#111827" : "#6B7280",
    userSelect: "none",
  });

  const radioStyle = {
    width: 14,
    height: 14,
    margin: 0,
    accentColor: "#22C55E",
    cursor: "pointer",
  };

  return (
    <div
      role="radiogroup"
      aria-label="Search result view"
      style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginBottom: 12 }}
    >
      <label style={optionStyle(mode === "dishes")}>
        <input
          type="radio"
          name="search-result-mode"
          checked={mode === "dishes"}
          onChange={() => onModeChange("dishes")}
          style={radioStyle}
        />
        {dishLabel}
      </label>
      <label style={optionStyle(mode === "restaurants")}>
        <input
          type="radio"
          name="search-result-mode"
          checked={mode === "restaurants"}
          onChange={() => onModeChange("restaurants")}
          style={radioStyle}
        />
        {restaurantLabel}
      </label>
    </div>
  );
}

function useGeolocation() {
  const [geo, setGeo] = useState({ status: "pending", lat: null, lng: null });

  useEffect(() => {
    if (!navigator?.geolocation) {
      setGeo({ status: "unavailable", lat: null, lng: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          status: "granted",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setGeo({ status: "denied", lat: null, lng: null });
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return geo;
}

/* ---- Row normalization ---- */

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const US_STATE_ABBREVS = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

const WAITER_MIN_RESULTS = 8;
const WAITER_PRICE_MIN_RESULTS = 15;
const WAITER_FOLLOW_UP_MAX_RESULTS = 5;
const WAITER_MIN_OPTIONS = 1;
const WAITER_MAX_OPTIONS = 3;
const MAX_MENU_ITEMS_PER_RESTAURANT_GROUP = 3;
const WAITER_MIN_ITEM_SIGNALS = 6;
const WAITER_FOLLOW_UP_MIN_ITEM_SIGNALS = 4;
const WAITER_MIN_OPTION_MATCHES = 1;
const WAITER_MIN_REMOVED_ITEMS = 1;
const WAITER_STRONG_UTILITY = 0.3;
const WAITER_EXCEPTIONAL_UTILITY = 0.55;
const WAITER_MIN_INFORMATION_GAIN = 0.55;
const WAITER_MIN_OPTION_SHARE = 0.1;
const WAITER_TIER_FOOD = 3;
const WAITER_TIER_NUTRITION = 2;
const WAITER_TIER_COMMERCE = 1;
const WAITER_STOP_WORDS = new Set([
  "the",
  "and",
  "with",
  "for",
  "to",
  "of",
  "a",
  "an",
  "in",
  "on",
  "our",
  "your",
  "special",
  "meal",
  "combo",
  "plate",
  "menu",
  "item",
  "items",
  "restaurant",
  "restaurants",
  "fresh",
  "classic",
  "style",
  "choice",
  "available",
  "served",
  "includes",
  "featuring",
  "made",
  "order",
  "kitchen",
  "demo",
  // Cut/shape words — not useful as primary refinements (spec section 6)
  "diced",
  "chopped",
  "sliced",
  "cubed",
  "shredded",
  "minced",
]);
// Kids meal detection — mirrors backend isKidsMealItem in pairComparabilityService.js
const KIDS_NAME_RE    = /\b(kids?'?s?\b|junior\b|jr\.?\b|children'?s?\b|lil'?\b)/i;
const KIDS_SECTION_RE = /\b(kid|child|junior|jr)\b/i;
function isKidsMealRow(row) {
  if (!row) return false;
  const section = String(row.section_name || row.section_header || row.category || "");
  if (KIDS_SECTION_RE.test(section)) return true;
  const name = String(row.item_name || row.name || row.search_display_name || "");
  return KIDS_NAME_RE.test(name);
}

const WAITER_TEXT_ONLY_PREPARATION_SIGNALS = [
  { key: "fried", label: "Fried", terms: ["fried", "crispy", "breaded", "battered", "tempura", "crunchy"] },
  { key: "grilled", label: "Grilled", terms: ["grilled", "chargrilled", "char-grilled", "blackened"] },
  { key: "roasted", label: "Roasted", terms: ["roasted", "roast"] },
  { key: "baked", label: "Baked", terms: ["baked", "oven baked", "oven-baked"] },
  { key: "smoked", label: "Smoked", terms: ["smoked", "smoky"] },
  { key: "steamed", label: "Steamed", terms: ["steamed"] },
  { key: "seared", label: "Seared", terms: ["seared"] },
  { key: "spicy", label: "Spicy", terms: ["spicy", "hot", "buffalo", "nashville hot", "cajun"] },
  { key: "iced", label: "Iced", terms: ["iced", "cold brew", "cold"] },
  { key: "hot", label: "Hot", terms: ["hot"] },
];
const WAITER_TEXT_ONLY_PREPARATION_ALIASES = new Map(
  WAITER_TEXT_ONLY_PREPARATION_SIGNALS.flatMap((signal) =>
    signal.terms.map((term) => [normalizeWaiterValue(term), signal])
  )
);
const WAITER_INTENT_PHRASES = Object.freeze({
  high_protein: ["high protein", "higher protein", "protein packed", "protein rich"],
  low_sodium: ["low sodium", "lower sodium", "reduced sodium"],
  low_fat: ["low fat", "lower fat"],
  vegetarian: ["vegetarian", "veggie"],
  vegan: ["vegan"],
  gluten_free: ["gluten free", "gluten-free"],
  dairy_free: ["dairy free", "dairy-free"],
  keto: ["keto", "low carb", "low-carb"],
  diabetic_friendly: ["diabetic friendly", "diabetic-friendly", "diabetic"],
  glp1_friendly: ["glp 1", "glp-1", "glp1"],
  deals: ["deal", "deals", "special", "specials", "discount", "discounts"],
  nearby: ["nearby", "near me", "close by"],
});

function parseLocation(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return { zip: "", city: "", state: "", near: "", label: "" };
  if (/^\d{5}(?:-\d{4})?$/.test(raw)) {
    return { zip: raw, city: "", state: "", near: "", label: raw };
  }

  // Handle "City, ST" format (with comma)
  const parts = raw.split(",");
  if (parts.length >= 2) {
    const city = String(parts[0] || "").trim();
    const state = String(parts[1] || "").trim().toUpperCase();
    return { zip: "", city, state, near: "", label: raw };
  }

  // Handle "City ST" format (no comma) — strip trailing 2-letter state abbreviation
  const tokens = raw.split(/\s+/);
  const last = tokens[tokens.length - 1].toLowerCase();
  if (tokens.length >= 2 && US_STATE_ABBREVS.has(last)) {
    const city = tokens.slice(0, -1).join(" ");
    return { zip: "", city, state: last.toUpperCase(), near: "", label: raw };
  }

  return { zip: "", city: raw, state: "", near: "", label: raw };
}

function getOrCreateSearchSessionId() {
  if (typeof window === "undefined") return "";

  const existing = String(window.sessionStorage.getItem(SEARCH_SESSION_KEY) || "").trim();
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `search-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.sessionStorage.setItem(SEARCH_SESSION_KEY, created);
  return created;
}

function compactObject(value) {
  if (Array.isArray(value)) {
    return value
      .map(compactObject)
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [key, nextValue] of Object.entries(value)) {
      const compacted = compactObject(nextValue);
      if (compacted !== undefined) out[key] = compacted;
    }
    return Object.keys(out).length ? out : undefined;
  }

  if (value === undefined || value === null || value === "") return undefined;
  return value;
}

function buildVisibleResultSignature(json) {
  const rows = normalizeRows(json);
  return rows
    .slice(0, 50)
    .map((row) => {
      const menuItemId = asString(pickFirst(row, ["menu_item_id", "menuItemId", "id"], ""));
      const restaurantId = asString(
        pickFirst(row, ["restaurant_id", "restaurantId"], "")
      );
      const name = asString(
        pickFirst(
          row,
          ["search_display_name", "menu_item_name", "menuItemName", "restaurant_name", "name"],
          ""
        )
      ).toLowerCase();

      return [menuItemId, restaurantId, name].join(":");
    })
    .join("|");
}

function isDishRow(x) {
  return !!(x?.menu_item_id || x?.menu_item_name || x?.item_name);
}

function singularizeWaiterToken(value) {
  const normalized = normalizeKey(value);
  if (normalized === "sandwiches" || normalized === "sandwhiches" || normalized === "sanwiches") {
    return "sandwich";
  }
  if (normalized.endsWith("ies")) return `${normalized.slice(0, -3)}y`;
  if (normalized.endsWith("s") && !normalized.endsWith("ss")) return normalized.slice(0, -1);
  return normalized;
}

function normalizeRows(json) {
  if (!json) return [];

  if (Array.isArray(json.results) && json.results.length) {
    const out = [];
    for (const r of json.results) {
      if (r?.item && r?.restaurant) {
        out.push({
          ...r,
          menu_item_id: r.item.id ?? r.item.menu_item_id ?? null,
          menu_item_name: r.item.name ?? r.item.menu_item_name ?? null,
          search_display_name:
            r.item.search_display_name ?? r.search_display_name ?? r.item.name ?? r.item.menu_item_name ?? null,
          restaurant_id: r.restaurant.id ?? r.restaurant.restaurant_id ?? null,
          restaurant_slug: r.restaurant.slug ?? r.restaurant.restaurant_slug ?? null,
          restaurant_name:
            r.restaurant.name ?? r.restaurant.restaurant_name ?? r.restaurant.title ?? null,
          price_cents: r.item.price_cents ?? r.item.priceMinor ?? r.item.price_minor ?? null,
          item: r.item,
          restaurant: r.restaurant,
        });
      } else {
        out.push(r);
      }
    }
    return out;
  }

  if (Array.isArray(json.rows)) return json.rows;
  if (Array.isArray(json.restaurants)) return json.restaurants;

  return [];
}

function hasDegradedEmptyResponse(json) {
  return json?.degraded === true && normalizeRows(json).length === 0;
}

function asString(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

function pickFirst(obj, keys, fallback = "") {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && asString(v) !== "") return v;
  }
  return fallback;
}

function normalizeKey(v) {
  return asString(v).toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeWaiterValue(value) {
  return normalizeKey(value)
    .replace(/[_/]+/g, " ")
    .replace(/[^\w\s$.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseWaiterValue(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// TEMPORARY: Text-only fallback taxonomy. Do NOT expand this list.
// Once MKS/Common Knowledge food-form data is present in the search payload,
// replace this with structured MKS field lookups and remove these text terms.
// Preferred long-term signal order: MKS food-form → canonical_family → categories → text fallback.
const TEMP_WAITER_FORM_TEXT_FALLBACK = [
  { key: "taco", label: "Tacos", terms: ["taco", "tacos"] },
  { key: "salad", label: "Salads", terms: ["salad"] },
  { key: "sandwich", label: "Sandwiches", terms: ["sandwich", "sub", "hoagie", "hero", "po boy", "po-boy", "panini"] },
  { key: "burger", label: "Burgers", terms: ["burger", "cheeseburger", "hamburger"] },
  { key: "wrap", label: "Wraps", terms: ["wrap", "gyro", "pita wrap"] },
  { key: "burrito", label: "Burritos", terms: ["burrito", "quesadilla", "enchilada"] },
  { key: "pizza", label: "Pizzas", terms: ["pizza", "flatbread", "calzone"] },
  { key: "pasta", label: "Pastas", terms: ["pasta", "spaghetti", "fettuccine", "penne", "rigatoni", "lasagna", "mac and cheese", "noodle", "ramen", "udon"] },
  { key: "bowl", label: "Bowls", terms: ["bowl", "rice bowl", "grain bowl", "acai bowl", "poke bowl"] },
  { key: "soup", label: "Soups", terms: ["soup", "bisque", "chowder", "stew"] },
  { key: "dessert", label: "Desserts", terms: ["dessert", "ice cream", "sundae", "milkshake", "shake", "brownie", "cookie", "donut", "doughnut", "cheesecake", "sorbet", "gelato", "pudding", "mousse"] },
  { key: "drink", label: "Drinks", terms: ["drink", "beverage", "soda", "lemonade", "juice", "coffee", "tea", "smoothie", "beer", "wine", "cocktail", "cider"] },
];
// Maps normalized form key or normalized plural label → signal (for structured category/canonical_family matching).
const _WAITER_FORM_KEY_LOOKUP = new Map(
  TEMP_WAITER_FORM_TEXT_FALLBACK.flatMap((signal) => [
    [signal.key, signal],
    [normalizeWaiterValue(signal.label), signal],
  ])
);
const _WAITER_FORM_RANK = new Map(TEMP_WAITER_FORM_TEXT_FALLBACK.map((signal, index) => [signal.key, index]));

function foodFormSignalTerms(formKey) {
  const signal =
    _WAITER_FORM_KEY_LOOKUP.get(normalizeWaiterValue(formKey)) ||
    _WAITER_FORM_KEY_LOOKUP.get(singularizeWaiterToken(formKey));
  return signal?.terms || [formKey];
}

function itemNameSupportsFoodForm(itemName, formKey) {
  const name = normalizeWaiterValue(itemName);
  if (!name) return false;
  return foodFormSignalTerms(formKey).some((term) => name.includes(normalizeWaiterValue(term)));
}

/** MKS food_form can disagree with the item name (e.g. chicken sandwich tagged burger). Prefer the name. */
function foodFormMetadataConflictsWithItemName(itemName, formKey) {
  const name = normalizeWaiterValue(itemName);
  const form = normalizeWaiterValue(formKey);
  if (!name || !form) return false;

  if (form === "burger") {
    return (
      /\b(sandwich|sub|hoagie|hero|panini|wrap)\b/.test(name) &&
      !/\b(burger|cheeseburger|hamburger)\b/.test(name)
    );
  }

  if (form === "sandwich") {
    return (
      (/\b(parmesan|parm)\b/.test(name) ||
        /\bwaffles?\b/.test(name) ||
        (/\b(fried|southern fried)\b/.test(name) &&
          /\bchicken\b/.test(name) &&
          !/\b(sandwich|sub|wrap)\b/.test(name))) &&
      !/\b(sandwich|sub|hoagie|hero|panini|wrap)\b/.test(name)
    );
  }

  return false;
}

function foodFormOptionShouldBeOffered(option, inventory) {
  if (option?.type !== "form") return true;
  const formKey = normalizeWaiterValue(option.key);

  // Never ask "Burgers?" when the only matching items are named as sandwiches.
  if (formKey !== "burger") return true;

  const matching = (Array.isArray(inventory) ? inventory : []).filter((row) =>
    typeof option.test === "function" ? option.test(row) : false
  );
  if (!matching.length) return false;
  return matching.some((row) => itemNameSupportsFoodForm(getWaiterItemName(row), formKey));
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sourceRecordFor(row, sourceField, sourceValue) {
  return {
    sourceField,
    sourceValue,
    menu_item_id: asString(pickFirst(row, ["menu_item_id", "menuItemId", "item_id", "id"], "")),
    menu_item_name: getWaiterItemName(row),
    restaurant_id: asString(pickFirst(row, ["restaurant_id", "restaurantId"], "")),
    restaurant_name: getWaiterRestaurantName(row),
  };
}

function waiterTextIncludesPhrase(text, phrase) {
  const normalizedText = ` ${normalizeWaiterValue(text)} `;
  const normalizedPhrase = normalizeWaiterValue(phrase);
  if (!normalizedPhrase) return false;
  return normalizedText.includes(` ${normalizedPhrase} `);
}

function waiterCorrectionPair(value) {
  if (value && typeof value === "object" && value?.from && value?.to) {
    return { from: String(value.from).trim(), to: String(value.to).trim() };
  }

  const text = String(value || "").trim();
  if (!text) return null;
  const quoted = /[""]?([^""]+)[""]?\s*(?:→|->| to )\s*[""]?([^""]+)[""]?/i.exec(text);
  if (quoted) return { from: quoted[1].trim(), to: quoted[2].trim() };
  return null;
}

function applyWaiterDisplayCorrections(query, queryMeta) {
  let display = String(query || "").replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  if (!display) return "";

  const corrections = [
    ...(Array.isArray(queryMeta?.typos_corrected) ? queryMeta.typos_corrected : []),
    ...(Array.isArray(queryMeta?.smart?.typos_corrected) ? queryMeta.smart.typos_corrected : []),
  ];

  for (const rawCorrection of corrections) {
    const pair = waiterCorrectionPair(rawCorrection);
    if (!pair?.from || !pair?.to) continue;
    display = display.replace(new RegExp(`\\b${escapeRegExp(pair.from)}\\b`, "gi"), pair.to);
  }

  return display;
}

function activeWaiterIntentKeys(context = {}) {
  const text = [
    context.query,
    context.urlIntentText,
    ...(Array.isArray(context.activeLabels) ? context.activeLabels : []),
  ].join(" ");
  const keys = new Set();

  for (const [key, phrases] of Object.entries(WAITER_INTENT_PHRASES)) {
    if (phrases.some((phrase) => waiterTextIncludesPhrase(text, phrase))) keys.add(key);
  }

  if (/\b(?:under|below|less than)\s*\$?\s*\d+/i.test(text)) keys.add("price");
  if (context.activeFilters?.vegan) keys.add("vegan");
  if (context.activeFilters?.vegetarian) keys.add("vegetarian");
  if (context.activeFilters?.gluten_free) keys.add("gluten_free");
  if (context.activeFilters?.dairy_free) keys.add("dairy_free");
  if (context.activeFilters?.diabetic_friendly) keys.add("diabetic_friendly");
  if (context.activeFilters?.glp1_friendly) keys.add("glp1_friendly");
  if (context.activeFilters?.keto) keys.add("keto");
  if (context.activeFilters?.low_fat) keys.add("low_fat");
  if (context.activeFilters?.low_sodium) keys.add("low_sodium");
  if (context.activeFilters?.deals) keys.add("deals");
  if (context.high_protein) keys.add("high_protein");
  if (context.priceMax) {
    keys.add("price");
    keys.add(`price_max:${context.priceMax}`);
  }

  return keys;
}

function waiterOptionRepeatsIntent(option, intentKeys) {
  if (!option || !intentKeys?.size) return false;
  const key = normalizeWaiterValue(option.key);
  const label = normalizeWaiterValue(option.label);

  if (option.type === "nutrition") {
    if ((key.includes("protein") || label.includes("protein")) && intentKeys.has("high_protein")) return true;
    if ((key.includes("sodium") || label.includes("sodium")) && intentKeys.has("low_sodium")) return true;
    if ((key.includes("fat") || label.includes("fat")) && intentKeys.has("low_fat")) return true;
  }

  if (option.type === "commerce") {
    if (option.commerceType === "deal" && intentKeys.has("deals")) return true;
    if (option.commerceType === "distance" && intentKeys.has("nearby")) return true;
    if (option.commerceType === "price" && intentKeys.has("price")) return true;
    if (option.commerceType === "price") {
      for (const intentKey of intentKeys) {
        if (intentKey.startsWith("price_max:") && key.startsWith("under_")) return true;
      }
      if (waiterTextIncludesPhrase(label, "under") && waiterTextIncludesPhrase([...intentKeys].join(" "), "under")) return true;
    }
  }

  const impliedPhrases = [...intentKeys].flatMap((intentKey) => WAITER_INTENT_PHRASES[intentKey] || []);
  return impliedPhrases.some((phrase) =>
    waiterTextIncludesPhrase(key, phrase) || waiterTextIncludesPhrase(label, phrase)
  );
}

function canonicalizeMenuItemName(v) {
  return normalizeKey(v)
    .replace(/\((?:\s*\d+\s*(?:pc|pcs|piece|pieces|count|ct)\s*)\)/g, " ")
    .replace(/\b\d+\s*(?:pc|pcs|piece|pieces|count|ct)\b/g, " ")
    .replace(/\b(?:small|medium|large|regular)\b/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:oz|ounce|ounces|lb|lbs)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function getScore(row) {
  return asNumber(row?.score);
}

function getPriceMinor(row) {
  const minor = asNumber(row?.price_minor_units);
  if (minor !== null) return Math.round(minor);
  const cents = asNumber(row?.price_cents);
  if (cents !== null) return Math.round(cents);
  const dollars = asNumber(row?.price);
  if (dollars !== null) return Math.round(dollars * 100);
  return null;
}

function getWaiterPriceDollars(row) {
  const minor = getPriceMinor(row);
  return minor !== null ? minor / 100 : null;
}

function getWaiterProtein(row) {
  const direct = asNumber(pickFirst(row, ["protein_g", "protein"], null));
  if (direct !== null) return direct;
  const chip = asNumber(row?.chips?.nutrition_chip?.protein_g);
  return chip !== null ? chip : null;
}

function getWaiterHasDeal(row) {
  return row?.has_active_deal === true || row?.deal_active === true || row?.active_deal === true;
}

function getWaiterItemName(row) {
  return asString(
    pickFirst(
      row,
      ["search_display_name", "menu_item_name", "menuItemName", "item_name", "name"],
      ""
    )
  );
}

function getWaiterRestaurantName(row) {
  return asString(pickFirst(row, ["restaurant_name", "restaurantName", "name"], ""));
}

function getWaiterCategory(row) {
  return asString(
    pickFirst(
      row,
      ["category", "type", "broad_category", "strict_type", "menu_item_category", "section", "section_name"],
      ""
    )
  );
}

function getWaiterDescription(row) {
  return asString(
    pickFirst(
      row,
      ["description", "menu_item_description", "item_description", "summary", "short_description"],
      ""
    )
  );
}

function getWaiterText(row) {
  return normalizeKey(
    [
      getWaiterItemName(row),
      getWaiterDescription(row),
      getWaiterCategory(row),
      Array.isArray(row?.preview_items) ? row.preview_items.join(" ") : "",
    ].join(" ")
  );
}

function tokenizeWaiterText(value) {
  return normalizeKey(value)
    .split(/[^a-z0-9]+/)
    .map((token) => singularizeWaiterToken(token))
    .filter((token) => token && !WAITER_STOP_WORDS.has(token));
}

function buildQueryTokenSet(query) {
  return new Set(tokenizeWaiterText(query));
}

function normalizedOptionTokens(option) {
  return tokenizeWaiterText(option?.label || option?.key || "").map((token) => {
    const t = String(token || "").toLowerCase();
    if (t === "sanwich" || t === "sandwhich") return "sandwich";
    if (t === "sanwiches" || t === "sandwhiches") return "sandwich";
    return t;
  });
}

function isOtherOption(option) {
  const key = normalizeWaiterValue(option?.key || "");
  const label = normalizeWaiterValue(option?.label || "");
  return key === "unknown" || label === "unknown" || key === "other" || label === "other";
}

function withSomethingElseLabel(option) {
  return {
    ...option,
    label: "Something Else",
    key: option?.key || "something_else",
  };
}

function createSomethingElseOption(displayOptions, uncoveredCount) {
  const tests = displayOptions
    .filter((option) => !isOtherOption(option))
    .map((option) => option.test)
    .filter((test) => typeof test === "function");

  return {
    id: "waiter:other",
    type: displayOptions[0]?.type || "form",
    key: "something_else",
    label: "Something Else",
    count: uncoveredCount,
    predicateDescription: "Items outside the shown options",
    test: (row) => !tests.some((test) => test(row)),
  };
}

function countUncoveredWaiterInventory(inventory, displayOptions) {
  const tests = displayOptions
    .filter((option) => !isOtherOption(option))
    .map((option) => option.test)
    .filter((test) => typeof test === "function");
  if (!tests.length) return 0;

  return (Array.isArray(inventory) ? inventory : []).filter(
    (row) => !tests.some((test) => test(row))
  ).length;
}

function appendSomethingElseForUncoveredResults(displayOptions, inventory) {
  if (!Array.isArray(displayOptions) || displayOptions.length === 0) return displayOptions;
  if (displayOptions.length >= WAITER_MAX_OPTIONS) {
    return displayOptions.slice(0, WAITER_MAX_OPTIONS);
  }
  if (displayOptions.some((option) => isOtherOption(option) || option.key === "something_else")) {
    return displayOptions;
  }

  const total = Array.isArray(inventory) ? inventory.length : 0;
  if (total === 0) return displayOptions;

  const uncoveredCount = countUncoveredWaiterInventory(inventory, displayOptions);
  if (uncoveredCount < WAITER_MIN_OPTION_MATCHES) return displayOptions;

  const coveredCount = total - uncoveredCount;
  if (coveredCount <= 0) return displayOptions;

  return [
    ...displayOptions,
    createSomethingElseOption(displayOptions, uncoveredCount),
  ].slice(0, WAITER_MAX_OPTIONS);
}

function titleFromTokens(tokens, fallbackLabel = "") {
  const words = (Array.isArray(tokens) ? tokens : []).filter(Boolean);
  if (!words.length) return String(fallbackLabel || "").trim();
  return words
    .map((word) => {
      const singular = singularizeWaiterToken(String(word || "").toLowerCase());
      const mapped = singular === "sandwich" ? "sandwich" : singular;
      if (mapped === "sandwich") return "Sandwich";
      return mapped.charAt(0).toUpperCase() + mapped.slice(1);
    })
    .join(" ");
}

export function buildContextAwareRefinementOptions(options, query, inventory = null) {
  const source = Array.isArray(options) ? options : [];
  if (!source.length) return [];

  const queryTokens = buildQueryTokenSet(query);
  const ranked = source.map((option, index) => ({
    option,
    index,
    tokens: normalizedOptionTokens(option),
  }));

  const bestByCore = new Map();
  for (const entry of ranked) {
    const coreTokensRaw = entry.tokens.filter((token) => !queryTokens.has(token));
    const coreTokens =
      coreTokensRaw.length > 0
        ? coreTokensRaw
        : entry.tokens;
    const coreKey = coreTokens.join(" ");
    const overlapCount = entry.tokens.length - coreTokens.length;
    const existing = bestByCore.get(coreKey);
    if (
      !existing ||
      overlapCount < existing.overlapCount ||
      (overlapCount === existing.overlapCount && entry.index < existing.index)
    ) {
      bestByCore.set(coreKey, {
        ...entry,
        coreTokens,
        overlapCount,
        option: {
          ...entry.option,
          label: titleFromTokens(coreTokens, entry.option?.label || entry.option?.key || ""),
        },
      });
    }
  }

  let deduped = Array.from(bestByCore.values())
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.option);

  deduped = deduped.map((option) => (isOtherOption(option) ? withSomethingElseLabel(option) : option));

  if (Array.isArray(inventory)) {
    return appendSomethingElseForUncoveredResults(deduped, inventory);
  }

  // Unit-test fallback when inventory is not supplied.
  if (deduped.length === 1 && source.length > 1 && !deduped.some(isOtherOption)) {
    deduped = [
      deduped[0],
      createSomethingElseOption(deduped, Math.max(0, Number(deduped[0].totalCount || 0) - Number(deduped[0].count || 0))),
    ];
  }

  return deduped;
}

function canonicalWaiterPreparation(value) {
  const normalized = normalizeWaiterValue(value);
  const alias = WAITER_TEXT_ONLY_PREPARATION_ALIASES.get(normalized);
  if (alias) return { key: alias.key, label: alias.label };
  return { key: normalized, label: titleCaseWaiterValue(normalized) };
}

function extractWaiterTextFeatures(row, queryTokens) {
  const text = getWaiterText(row);
  const tokens = tokenizeWaiterText(text)
    .filter((token) => !queryTokens.has(token))
    .filter((token) => token.length >= 3);
  const features = new Set(tokens);

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const first = tokens[index];
    const second = tokens[index + 1];
    if (first && second && first !== second) features.add(`${first} ${second}`);
  }

  return features;
}

function buildWaiterInventory(rows) {
  const inventory = [];
  const seen = new Set();

  for (const row of Array.isArray(rows) ? rows : []) {
    const restaurantName = getWaiterRestaurantName(row);
    const category = normalizeKey(getWaiterCategory(row));
    const baseItemNames = isDishRow(row)
      ? [getWaiterItemName(row)]
      : Array.isArray(row?.preview_items)
      ? row.preview_items
      : [];

    for (const rawItemName of baseItemNames) {
      const itemName = asString(rawItemName);
      if (!itemName) continue;

      const dedupeKey = `${normalizeKey(restaurantName)}|${normalizeKey(itemName)}|${category}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      // Read structured attributes supplied by the backend waiter_attributes payload.
      // Each array entry is already a normalized string key from the backend.
      const wa = row.waiter_attributes || {};
      const attributes = {
        preparation: new Set(Array.isArray(wa.preparations) ? wa.preparations : []),
        ingredient:  new Set(Array.isArray(wa.ingredients)  ? wa.ingredients  : []),
        modifier:    new Set(),
        category:    new Set(Array.isArray(wa.categories)   ? wa.categories   : []),
      };

      const itemText = [itemName, getWaiterDescription(row)].join(" ");

      inventory.push({
        ...row,
        __waiterSourceRow: row,
        item_name: itemName,
        search_display_name: itemName,
        restaurant_name: restaurantName || row?.restaurant_name || "",
        category: category || null,
        price: getWaiterPriceDollars(row),
        protein_g: getWaiterProtein(row),
        distance_miles: getDistanceMiles(row),
        __waiterAttributes: attributes,
        __waiterText: itemText,
        __isKidsMeal: (wa.context?.kids_meal === true) || isKidsMealRow({ ...row, item_name: itemName }),
      });
    }
  }

  return inventory;
}

function waiterRowKey(row) {
  return asString(pickFirst(row, ["menu_item_id", "menuItemId", "item_id", "id"], ""));
}

export function resolveWaiterRefinementStep(option, rows, query, context = {}) {
  if (!option) return null;
  if (typeof option.test === "function") return option;

  const stepState = buildWaiterOptions(rows, query, context);
  const displayOptions = buildContextAwareRefinementOptions(
    stepState.options,
    query,
    stepState.inventory
  );
  const pools = [...displayOptions, ...stepState.options];
  const match =
    pools.find((candidate) => option.id && candidate.id === option.id) ||
    pools.find(
      (candidate) =>
        candidate.key === option.key &&
        (candidate.type || null) === (option.type || null)
    );

  return match && typeof match.test === "function" ? match : null;
}

export function applyWaiterRefinementStackToRows(rows, inventory, stack) {
  if (!Array.isArray(stack) || stack.length === 0) return rows;

  let narrowedRows = Array.isArray(rows) ? rows : [];
  let anyStepApplied = false;

  for (const step of stack) {
    const test = step?.test;
    if (typeof test !== "function") continue;
    anyStepApplied = true;

    const stepInventory = buildWaiterInventory(narrowedRows);
    const allowedKeys = new Set(
      stepInventory
        .filter((invRow) => test(invRow))
        .map((invRow) => waiterRowKey(invRow.__waiterSourceRow || invRow))
        .filter(Boolean)
    );

    narrowedRows = narrowedRows.filter((row) => {
      const key = waiterRowKey(row);
      return key && allowedKeys.has(key);
    });
  }

  if (!anyStepApplied) return Array.isArray(rows) ? rows : [];
  return narrowedRows;
}

function countWaiterMatches(rows, test) {
  return (Array.isArray(rows) ? rows : []).reduce((count, row) => count + (test(row) ? 1 : 0), 0);
}

function isFoodFormWaiterGroup(group) {
  return (
    group?.tier === WAITER_TIER_FOOD &&
    (group.dimension === "form" || group.dimension === "canonical_family")
  );
}

function focusFoodFormWaiterOptions(options, maxOptions = 2) {
  return [...(Array.isArray(options) ? options : [])]
    .sort(
      (a, b) =>
        b.count - a.count ||
        (a.formRank ?? Number.MAX_SAFE_INTEGER) - (b.formRank ?? Number.MAX_SAFE_INTEGER) ||
        String(a.label).localeCompare(String(b.label))
    )
    .slice(0, maxOptions);
}

function trimWaiterGroupOptions(group) {
  if (isFoodFormWaiterGroup(group)) {
    return focusFoodFormWaiterOptions(group.options, 2);
  }
  return group.options.slice(0, WAITER_MAX_OPTIONS);
}

function minWaiterOptionsForGroup(group) {
  return isFoodFormWaiterGroup(group) ? 2 : WAITER_MIN_OPTIONS;
}

function finalizeWaiterGroups(groups, totalCount) {
  return groups
    .map((group) => ({
      ...group,
      totalCount,
      options: trimWaiterGroupOptions(group),
    }))
    .filter((group) => group.options.length >= minWaiterOptionsForGroup(group));
}

function buildWaiterOptionRows(rows, dimension, candidates, intentKeys) {
  const total = Array.isArray(rows) ? rows.length : 0;
  return Array.from(candidates.values())
    .map((candidate) => ({
      id: `${dimension}:${candidate.key}`,
      type: dimension,
      key: candidate.key,
      label: candidate.label,
      predicateDescription: candidate.predicateDescription || `${candidate.label} items`,
      commerceType: candidate.commerceType || null,
      test: candidate.test,
      count: countWaiterMatches(rows, candidate.test),
      sourceValues: candidate.sourceValues || [],
      formRank: candidate.formRank ?? null,
    }))
    .filter((option) => !waiterOptionRepeatsIntent(option, intentKeys))
    .filter((option) => dimension !== "form" || foodFormOptionShouldBeOffered(option, rows))
    .filter((option) => (
      option.count >= WAITER_MIN_OPTION_MATCHES &&
      option.count < total &&
      total - option.count >= WAITER_MIN_REMOVED_ITEMS
    ))
    // Block raw numeric values (e.g. protein grams leaked from chips.nutrition_chip)
    .filter((option) => !/^\$?\d+(\.\d+)?(g|mg|kcal|cal|ml|oz)?$/i.test(String(option.label).trim()))
    .sort((a, b) => b.count - a.count || (a.formRank ?? Number.MAX_SAFE_INTEGER) - (b.formRank ?? Number.MAX_SAFE_INTEGER) || a.label.localeCompare(b.label));
}

function scoreWaiterGroup(group) {
  if (!group || group.options.length < minWaiterOptionsForGroup(group)) return -1;
  const totalCount = Math.max(group.totalCount || 0, 1);
  const isFoodForm = isFoodFormWaiterGroup(group);
  const optionCounts = group.options.map((option) => option.count).filter((count) => count > 0);
  if (optionCounts.length < minWaiterOptionsForGroup(group)) return -1;

  const coveredCount = Math.min(optionCounts.reduce((sum, count) => sum + count, 0), totalCount);
  const residualCount = Math.max(totalCount - coveredCount, 0);
  const buckets = residualCount > 0 ? [...optionCounts, residualCount] : optionCounts;
  const bucketCount = buckets.length;
  const entropy = buckets.reduce((sum, count) => {
    const probability = count / totalCount;
    return probability > 0 ? sum - probability * Math.log2(probability) : sum;
  }, 0);
  const informationGain = bucketCount > 1 ? entropy / Math.log2(bucketCount) : 0;
  const coverageRatio = coveredCount / totalCount;
  const averageRemovalRatio =
    optionCounts.reduce((sum, count) => sum + ((totalCount - count) / totalCount), 0) /
    optionCounts.length;
  const sortedCounts = [...optionCounts].sort((a, b) => b - a);
  const smallestShare = Math.min(...optionCounts) / totalCount;
  const optionVariety = Math.min(optionCounts.length, WAITER_MAX_OPTIONS) / WAITER_MAX_OPTIONS;

  if (informationGain < WAITER_MIN_INFORMATION_GAIN) return -1;
  if (isFoodForm) {
    const topCount = sortedCounts[0] || 0;
    const secondCount = sortedCounts[1] || 0;
    if (topCount / totalCount < WAITER_MIN_OPTION_SHARE) return -1;
    if (secondCount < WAITER_MIN_OPTION_MATCHES) return -1;
  } else if (smallestShare < WAITER_MIN_OPTION_SHARE) {
    return -1;
  }

  return coverageRatio * (
    informationGain * 0.5 +
    averageRemovalRatio * 0.3 +
    optionVariety * 0.2
  );
}

export function selectWaiterGroup(groups) {
  const ranked = groups
    .map((group) => ({
      ...group,
      utilityScore: scoreWaiterGroup(group),
    }))
    .filter((group) => group.utilityScore >= WAITER_STRONG_UTILITY)
    .sort((a, b) =>
      b.tier - a.tier ||
      b.utilityScore - a.utilityScore ||
      (b.priority || 0) - (a.priority || 0)
    );

  // Food-form (dish type: sandwich, taco, salad, bowl…) must be asked before preparation
  // (fried, grilled, spicy…) whenever a form question qualifies. Only fall through to
  // preparation/ingredient/modifier if no form or canonical_family group passes the threshold.
  const formGroup = ranked.find(
    (g) => g.tier === WAITER_TIER_FOOD && (g.dimension === "form" || g.dimension === "canonical_family")
  );
  if (formGroup) return formGroup;

  return ranked[0] || null;
}

export function shouldOfferWaiterFollowUp({
  visibleResultCount,
  refinementStackLength,
  utilityScore = 0,
  optionCount,
  inventorySignalCount,
  minItemSignals = WAITER_MIN_ITEM_SIGNALS,
}) {
  if (optionCount < 1) return false;
  if (inventorySignalCount < minItemSignals) return false;

  if (refinementStackLength === 0) {
    return visibleResultCount >= WAITER_MIN_RESULTS;
  }

  if (visibleResultCount > WAITER_FOLLOW_UP_MAX_RESULTS) return true;

  return utilityScore >= WAITER_EXCEPTIONAL_UTILITY;
}

function buildFormCandidates(inventory, queryTokens) {
  const candidates = new Map();

  for (const row of inventory) {
    let resolvedSignal = null;
    let formSourceField = null;
    let formSourceValue = null;

    // Priority 0: waiter_attributes.context.food_form (MKS strict_type — highest-authority structured source).
    const directForm = normalizeWaiterValue(row.waiter_attributes?.context?.food_form || "");
    if (directForm) {
      const itemName = getWaiterItemName(row);
      const signal =
        _WAITER_FORM_KEY_LOOKUP.get(directForm) ||
        _WAITER_FORM_KEY_LOOKUP.get(singularizeWaiterToken(directForm));
      if (signal && !foodFormMetadataConflictsWithItemName(itemName, directForm)) {
        resolvedSignal = signal;
        formSourceField = "waiter_attributes.context.food_form";
        formSourceValue = row.waiter_attributes.context.food_form;
      }
    }

    // Priority 1: waiter_attributes.categories (MKS-backed structured data).
    if (!resolvedSignal) {
      const categorySet = row.__waiterAttributes?.category;
      if (categorySet && categorySet.size > 0) {
        for (const rawCategory of categorySet) {
          const norm = normalizeWaiterValue(rawCategory);
          const signal =
            _WAITER_FORM_KEY_LOOKUP.get(norm) ||
            _WAITER_FORM_KEY_LOOKUP.get(singularizeWaiterToken(norm));
          if (
            signal &&
            !foodFormMetadataConflictsWithItemName(getWaiterItemName(row), signal.key)
          ) {
            resolvedSignal = signal;
            formSourceField = "waiter_attributes.categories";
            formSourceValue = rawCategory;
            break;
          }
        }
      }
    }

    // Priority 2: waiter_attributes.context.canonical_family (structured).
    if (!resolvedSignal) {
      const family = normalizeWaiterValue(row.waiter_attributes?.context?.canonical_family || "");
      if (family && family.length >= 3) {
        const signal =
          _WAITER_FORM_KEY_LOOKUP.get(family) ||
          _WAITER_FORM_KEY_LOOKUP.get(singularizeWaiterToken(family));
        if (signal) {
          resolvedSignal = signal;
          formSourceField = "waiter_attributes.context.canonical_family";
          formSourceValue = row.waiter_attributes?.context?.canonical_family || family;
        }
      }
    }

    // Priority 3: Text fallback — TEMPORARY. Remove once MKS food-form data is in the search payload.
    if (!resolvedSignal) {
      const text = getWaiterText(row);
      const normalizedText = normalizeWaiterValue(text);
      for (const signal of TEMP_WAITER_FORM_TEXT_FALLBACK) {
        if (signal.terms.some((term) => normalizedText.includes(normalizeWaiterValue(term)))) {
          resolvedSignal = signal;
          formSourceField = "waiter_text";
          formSourceValue = text;
          break;
        }
      }
    }

    if (!resolvedSignal || !formSourceField) continue;
    if (queryTokens.has(singularizeWaiterToken(resolvedSignal.key))) continue;

    addCandidate(
      candidates,
      resolvedSignal.key,
      resolvedSignal.label,
      (candidateRow) => {
        const ff = normalizeWaiterValue(candidateRow.waiter_attributes?.context?.food_form || "");
        if (ff) {
          if (
            (_WAITER_FORM_KEY_LOOKUP.get(ff) || _WAITER_FORM_KEY_LOOKUP.get(singularizeWaiterToken(ff)))?.key ===
            resolvedSignal.key
          ) return true;
        }
        const cats = candidateRow.__waiterAttributes?.category;
        if (cats && cats.size > 0) {
          for (const rawCat of cats) {
            const n = normalizeWaiterValue(rawCat);
            if (
              (_WAITER_FORM_KEY_LOOKUP.get(n) || _WAITER_FORM_KEY_LOOKUP.get(singularizeWaiterToken(n)))?.key ===
              resolvedSignal.key
            ) return true;
          }
        }
        const fam = normalizeWaiterValue(candidateRow.waiter_attributes?.context?.canonical_family || "");
        if (fam) {
          if (
            (_WAITER_FORM_KEY_LOOKUP.get(fam) || _WAITER_FORM_KEY_LOOKUP.get(singularizeWaiterToken(fam)))?.key ===
            resolvedSignal.key
          ) return true;
        }
        return normalizeWaiterValue(getWaiterText(candidateRow)).includes(resolvedSignal.key);
      },
      `${resolvedSignal.label} items`,
      {
        sourceValues: [sourceRecordFor(row, formSourceField, formSourceValue)],
        formRank: _WAITER_FORM_RANK.get(resolvedSignal.key) ?? Number.MAX_SAFE_INTEGER,
      }
    );
  }

  return candidates;
}

function addCandidate(candidates, key, label, test, predicateDescription, metadata = {}) {
  const normalizedKey = normalizeWaiterValue(key);
  if (!normalizedKey) return;
  const existing = candidates.get(normalizedKey);
  const sourceValues = [
    ...(Array.isArray(existing?.sourceValues) ? existing.sourceValues : []),
    ...(Array.isArray(metadata.sourceValues) ? metadata.sourceValues : []),
  ];
  candidates.set(normalizedKey, {
    ...(existing || {}),
    key: normalizedKey,
    label: label || titleCaseWaiterValue(normalizedKey),
    predicateDescription,
    test,
    ...metadata,
    sourceValues,
  });
}

function buildAttributeCandidates(inventory, group, queryTokens) {
  const candidates = new Map();
  const valuesByRow = [];

  for (const row of inventory) {
    const values = row.__waiterAttributes?.[group];
    const normalizedValues = [];
    for (const rawValue of values || []) {
      const value = group === "preparation"
        ? canonicalWaiterPreparation(rawValue)
        : { key: normalizeWaiterValue(rawValue), label: titleCaseWaiterValue(rawValue) };
      if (!value.key) continue;
      if (queryTokens.has(singularizeWaiterToken(value.key))) continue;
      normalizedValues.push({ ...value, rawValue });
    }
    valuesByRow.push({ row, values: normalizedValues });
  }

  for (const { row, values } of valuesByRow) {
    for (const value of values) {
      const sourceField = group === "preparation"
        ? "waiter_attributes.preparations"
        : group === "ingredient"
        ? "waiter_attributes.ingredients"
        : group === "modifier"
        ? "waiter_attributes.modifiers"
        : "waiter_attributes.categories";
      addCandidate(
        candidates,
        value.key,
        value.label,
        (candidateRow) => {
          const rowValues = candidateRow.__waiterAttributes?.[group] || new Set();
          if (group === "preparation") {
            return Array.from(rowValues).some((entry) => canonicalWaiterPreparation(entry).key === value.key);
          }
          return rowValues.has(value.key);
        },
        `${value.label} matches`,
        {
          sourceValues: [
            sourceRecordFor(row, sourceField, value.rawValue ?? value.label),
          ],
        }
      );
    }
  }
  return candidates;
}

function buildCanonicalFamilyCandidates(inventory, queryTokens) {
  const candidates = new Map();
  for (const row of inventory) {
    const family = normalizeWaiterValue(row.waiter_attributes?.context?.canonical_family || "");
    if (!family || family.length < 3) continue;
    const familyTokens = tokenizeWaiterText(family).map((token) => {
      const t = String(token || "").toLowerCase();
      if (t === "sanwich" || t === "sandwhich") return "sandwich";
      if (t === "sanwiches" || t === "sandwhiches") return "sandwich";
      return t;
    });
    const reducedTokens = familyTokens.filter((token) => !queryTokens.has(singularizeWaiterToken(token)));
    if (reducedTokens.length === 0) continue;
    const reducedKey = reducedTokens.join(" ");
    const reducedLabel = reducedTokens
      .map((token) => {
        const singular = singularizeWaiterToken(token);
        if (singular === "sandwich") return "Sandwich";
        return titleCaseWaiterValue(singular);
      })
      .join(" ");
    addCandidate(
      candidates,
      reducedKey,
      reducedLabel,
      (r) => normalizeWaiterValue(r.waiter_attributes?.context?.canonical_family || "") === family,
      `${reducedLabel} items`,
      {
        sourceValues: [
          sourceRecordFor(row, "waiter_attributes.context.canonical_family", row.waiter_attributes?.context?.canonical_family || ""),
        ],
      }
    );
  }
  return candidates;
}

function buildTextFeatureCandidates(inventory, queryTokens) {
  const counts = new Map();
  const sources = new Map();
  for (const row of inventory) {
    for (const feature of extractWaiterTextFeatures(row, queryTokens)) {
      counts.set(feature, (counts.get(feature) || 0) + 1);
      const record = sourceRecordFor(row, "waiter_text", getWaiterText(row));
      sources.set(feature, [...(sources.get(feature) || []), record]);
    }
  }

  const candidates = new Map();
  for (const [feature, count] of counts) {
    if (count < WAITER_MIN_OPTION_MATCHES) continue;
    if (feature.split(" ").some((token) => queryTokens.has(token))) continue;
    addCandidate(
      candidates,
      feature,
      titleCaseWaiterValue(feature),
      (row) => extractWaiterTextFeatures(row, queryTokens).has(feature),
      `${titleCaseWaiterValue(feature)} matches`,
      {
        sourceValues: sources.get(feature) || [],
      }
    );
  }
  return candidates;
}

function buildPriceCommerceCandidates(inventory) {
  const candidates = new Map();
  const priced = inventory.filter((row) => getWaiterPriceDollars(row) !== null);
  if (priced.length >= WAITER_PRICE_MIN_RESULTS) {
    const prices = priced.map((row) => getWaiterPriceDollars(row)).sort((a, b) => a - b);
    const midpointIndex = Math.floor(prices.length / 2);
    const threshold = prices.length % 2 === 0
      ? (prices[midpointIndex - 1] + prices[midpointIndex]) / 2
      : prices[midpointIndex];
    const displayThreshold = Math.ceil(threshold);
    if (Number.isFinite(threshold) && threshold > 0 && Number.isFinite(displayThreshold)) {
      addCandidate(
        candidates,
        `under_${displayThreshold}`,
        `Under $${displayThreshold}`,
        (row) => {
          const price = getWaiterPriceDollars(row);
          return price !== null && price < threshold;
        },
        `Items under $${displayThreshold}`,
        {
          commerceType: "price",
          sourceValues: priced.map((row) =>
            sourceRecordFor(row, "waiter_attributes.commerce.price", row.waiter_attributes?.commerce?.price ?? getWaiterPriceDollars(row))
          ),
        }
      );
    }
  }

  return candidates;
}

function buildDealCommerceCandidates() {
  // Deal refinement is not a useful waiter question for open-ended dish search —
  // everyone wants a deal. Deals are surfaced via filters/badges, not waiter prompts.
  return new Map();
}

function buildDistanceCommerceCandidates(inventory) {
  const candidates = new Map();
  const withDistance = inventory.filter((row) => getDistanceMiles(row) !== null);
  if (withDistance.length >= WAITER_MIN_RESULTS) {
    const nearbyCount = withDistance.filter((row) => getDistanceMiles(row) <= 3).length;
    if (nearbyCount > 0 && nearbyCount < withDistance.length) {
      addCandidate(
        candidates,
        "nearby",
        "Nearby",
        (row) => {
          const distance = getDistanceMiles(row);
          return distance !== null && distance <= 3;
        },
        "Items within 3 miles",
        {
          commerceType: "distance",
          sourceValues: withDistance
            .filter((row) => getDistanceMiles(row) <= 3)
            .map((row) => sourceRecordFor(row, "waiter_attributes.commerce.distance_miles", row.waiter_attributes?.commerce?.distance_miles ?? getDistanceMiles(row))),
        }
      );
    }
  }

  return candidates;
}

function buildNutritionCandidates(inventory) {
  const candidates = new Map();
  const proteins = inventory.map(getWaiterProtein).filter((value) => value !== null).sort((a, b) => a - b);
  if (proteins.length >= WAITER_MIN_RESULTS) {
    const median = proteins[Math.floor(proteins.length / 2)];
    if (Number.isFinite(median) && median > 0) {
      addCandidate(
        candidates,
        `protein_${Math.round(median)}g_plus`,
        "Higher Protein",
        (row) => {
          const protein = getWaiterProtein(row);
          return protein !== null && protein >= median;
        },
        `Items with at least ${Math.round(median)}g protein`
      );
    }
  }
  return candidates;
}

export function buildWaiterOptions(rows, query, context = {}) {
  const rawInventory = buildWaiterInventory(rows);
  const minItemSignals =
    Number(context.waiterRefinementDepth || 0) > 0
      ? WAITER_FOLLOW_UP_MIN_ITEM_SIGNALS
      : WAITER_MIN_ITEM_SIGNALS;
  if (rawInventory.length < minItemSignals) {
    return { inventory: rawInventory, options: [], dimension: null };
  }

  // Kids meal boundary: waiter refines only within one context at a time.
  // If the result set is all-kids → keep all. If mixed → keep only standard items
  // so kids meals don't pollute adult refinement questions (and vice versa).
  const kidsCount = rawInventory.filter((r) => r.__isKidsMeal).length;
  const allKids = kidsCount === rawInventory.length;
  const inventory = allKids
    ? rawInventory
    : rawInventory.filter((r) => !r.__isKidsMeal);

  if (inventory.length < minItemSignals) {
    return { inventory: rawInventory, options: [], dimension: null };
  }

  const queryTokens = buildQueryTokenSet(query);
  const intentKeys = activeWaiterIntentKeys({ ...context, query });
  const rawGroups = [
    {
      dimension: "form",
      tier: WAITER_TIER_FOOD,
      priority: 70,
      options: buildWaiterOptionRows(
        inventory,
        "form",
        buildFormCandidates(inventory, queryTokens),
        intentKeys
      ),
    },
    {
      dimension: "preparation",
      tier: WAITER_TIER_FOOD,
      priority: 60,
      options: buildWaiterOptionRows(
        inventory,
        "preparation",
        buildAttributeCandidates(inventory, "preparation", queryTokens),
        intentKeys
      ),
    },
    {
      dimension: "ingredient",
      tier: WAITER_TIER_FOOD,
      priority: 50,
      options: buildWaiterOptionRows(
        inventory,
        "ingredient",
        buildAttributeCandidates(inventory, "ingredient", queryTokens),
        intentKeys
      ),
    },
    {
      dimension: "canonical_family",
      tier: WAITER_TIER_FOOD,
      priority: 48,
      options: buildWaiterOptionRows(
        inventory,
        "canonical_family",
        buildCanonicalFamilyCandidates(inventory, queryTokens),
        intentKeys
      ),
    },
    {
      dimension: "modifier",
      tier: WAITER_TIER_FOOD,
      priority: 45,
      options: buildWaiterOptionRows(
        inventory,
        "modifier",
        buildAttributeCandidates(inventory, "modifier", queryTokens),
        intentKeys
      ),
    },
    {
      dimension: "category",
      tier: WAITER_TIER_FOOD,
      priority: 35,
      options: buildWaiterOptionRows(
        inventory,
        "category",
        buildAttributeCandidates(inventory, "category", queryTokens),
        intentKeys
      ),
    },
    {
      dimension: "nutrition",
      tier: WAITER_TIER_NUTRITION,
      priority: 15,
      options: buildWaiterOptionRows(inventory, "nutrition", buildNutritionCandidates(inventory), intentKeys),
    },
    ...[
      { commerceType: "price", priority: 10, candidates: buildPriceCommerceCandidates(inventory) },
      { commerceType: "deal", priority: 9, candidates: buildDealCommerceCandidates(inventory) },
      { commerceType: "distance", priority: 8, candidates: buildDistanceCommerceCandidates(inventory) },
    ].map((commerceGroup) => ({
      dimension: "commerce",
      commerceType: commerceGroup.commerceType,
      tier: WAITER_TIER_COMMERCE,
      priority: commerceGroup.priority,
      options: buildWaiterOptionRows(inventory, "commerce", commerceGroup.candidates, intentKeys),
    })),
  ];

  const groups = finalizeWaiterGroups(rawGroups, inventory.length);

  const selectedGroup = selectWaiterGroup(groups);
  if (!selectedGroup) return { inventory, options: [], dimension: null };

  return {
    inventory,
    options: selectedGroup.options,
    dimension: selectedGroup.dimension,
    utilityScore: selectedGroup.utilityScore ?? 0,
  };
}

// Debug export — returns all candidate groups with utility scores for auditing.
// Not used in production rendering.
export function buildWaiterDebugGroups(rows, query, context = {}) {
  const rawInventory = buildWaiterInventory(rows);
  if (rawInventory.length < WAITER_MIN_ITEM_SIGNALS) return { inventory: rawInventory, groups: [] };
  const kidsCount = rawInventory.filter((r) => r.__isKidsMeal).length;
  const allKids = kidsCount === rawInventory.length;
  const inventory = allKids ? rawInventory : rawInventory.filter((r) => !r.__isKidsMeal);
  if (inventory.length < WAITER_MIN_ITEM_SIGNALS) return { inventory: rawInventory, groups: [] };

  const queryTokens = buildQueryTokenSet(query);
  const intentKeys = activeWaiterIntentKeys({ ...context, query });
  const rawGroups = [
    { dimension: "form", tier: WAITER_TIER_FOOD, priority: 70, options: buildWaiterOptionRows(inventory, "form", buildFormCandidates(inventory, queryTokens), intentKeys) },
    { dimension: "preparation", tier: WAITER_TIER_FOOD, priority: 60, options: buildWaiterOptionRows(inventory, "preparation", buildAttributeCandidates(inventory, "preparation", queryTokens), intentKeys) },
    { dimension: "ingredient", tier: WAITER_TIER_FOOD, priority: 50, options: buildWaiterOptionRows(inventory, "ingredient", buildAttributeCandidates(inventory, "ingredient", queryTokens), intentKeys) },
    { dimension: "canonical_family", tier: WAITER_TIER_FOOD, priority: 48, options: buildWaiterOptionRows(inventory, "canonical_family", buildCanonicalFamilyCandidates(inventory, queryTokens), intentKeys) },
    { dimension: "modifier", tier: WAITER_TIER_FOOD, priority: 45, options: buildWaiterOptionRows(inventory, "modifier", buildAttributeCandidates(inventory, "modifier", queryTokens), intentKeys) },
    { dimension: "category", tier: WAITER_TIER_FOOD, priority: 35, options: buildWaiterOptionRows(inventory, "category", buildAttributeCandidates(inventory, "category", queryTokens), intentKeys) },
    { dimension: "nutrition", tier: WAITER_TIER_NUTRITION, priority: 15, options: buildWaiterOptionRows(inventory, "nutrition", buildNutritionCandidates(inventory), intentKeys) },
    ...[
      { commerceType: "price", priority: 10, candidates: buildPriceCommerceCandidates(inventory) },
      { commerceType: "deal", priority: 9, candidates: buildDealCommerceCandidates(inventory) },
      { commerceType: "distance", priority: 8, candidates: buildDistanceCommerceCandidates(inventory) },
    ].map((cg) => ({ dimension: "commerce", commerceType: cg.commerceType, tier: WAITER_TIER_COMMERCE, priority: cg.priority, options: buildWaiterOptionRows(inventory, "commerce", cg.candidates, intentKeys) })),
  ];

  const groups = finalizeWaiterGroups(rawGroups, inventory.length);

  const scored = groups.map((g) => ({ ...g, utilityScore: scoreWaiterGroup(g) }));
  const selectedGroup = selectWaiterGroup(groups);
  return {
    inventory,
    totalCount: inventory.length,
    groups: scored.map((g) => ({
      dimension: g.dimension,
      commerceType: g.commerceType || null,
      tier: g.tier,
      priority: g.priority,
      utilityScore: g.utilityScore,
      options: g.options.map((o) => ({ key: o.key, label: o.label, count: o.count, sourceValues: (o.sourceValues || []).slice(0, 2) })),
      selected: selectedGroup ? (g.dimension === selectedGroup.dimension && (g.commerceType || null) === (selectedGroup.commerceType || null) && g.priority === selectedGroup.priority) : false,
    })),
    selectedDimension: selectedGroup?.dimension || null,
  };
}

function getDistanceMiles(row) {
  const distance = asNumber(
    pickFirst(row, ["distance_miles", "restaurant_distance_miles"], null)
  );
  return distance !== null ? distance : null;
}

function compareNullableNumbers(a, b) {
  if (a !== null && b !== null && a !== b) return a - b;
  if (a !== null && b === null) return -1;
  if (a === null && b !== null) return 1;
  return 0;
}

function sortByWaiterRefinement(filteredRows, refinement) {
  if (!refinement) return filteredRows;
  const sorted = [...filteredRows];
  const refinementKey = String(refinement.key || "");

  if (refinement.type === "nutrition" && refinementKey.includes("protein")) {
    sorted.sort((a, b) => {
      const pa = getWaiterProtein(a) ?? -1;
      const pb = getWaiterProtein(b) ?? -1;
      return pb - pa;
    });
  } else if (refinement.type === "commerce") {
    if (refinement.key === "nearby") {
      sorted.sort((a, b) => {
        const da = getDistanceMiles(a) ?? Infinity;
        const db = getDistanceMiles(b) ?? Infinity;
        return da - db;
      });
    } else if (refinement.key === "farther_out") {
      sorted.sort((a, b) => {
        const da = getDistanceMiles(a) ?? -Infinity;
        const db = getDistanceMiles(b) ?? -Infinity;
        return db - da;
      });
    } else if (refinementKey.startsWith("under_") || /^\d+_plus$/.test(refinementKey)) {
      sorted.sort((a, b) => {
        const pa = getWaiterPriceDollars(a) ?? Infinity;
        const pb = getWaiterPriceDollars(b) ?? Infinity;
        return pa - pb;
      });
    }
  }

  return sorted;
}

function isBetterRestaurantRepresentative(nextRow, currentRow) {
  const nextDistance = getDistanceMiles(nextRow);
  const currentDistance = getDistanceMiles(currentRow);

  if (nextDistance !== null && currentDistance !== null && nextDistance !== currentDistance) {
    return nextDistance < currentDistance;
  }
  if (nextDistance !== null && currentDistance === null) return true;
  if (nextDistance === null && currentDistance !== null) return false;

  return isBetterRow(nextRow, currentRow);
}

function isBetterRow(nextRow, currentRow) {
  const nextScore = getScore(nextRow);
  const currentScore = getScore(currentRow);
  if (nextScore !== null && currentScore !== null && nextScore !== currentScore) {
    return nextScore > currentScore;
  }
  if (nextScore !== null && currentScore === null) return true;
  if (nextScore === null && currentScore !== null) return false;

  const nextPrice = getPriceMinor(nextRow);
  const currentPrice = getPriceMinor(currentRow);
  if (nextPrice !== null && currentPrice !== null && nextPrice !== currentPrice) {
    return nextPrice < currentPrice;
  }
  return false;
}

function buildRestaurantGroups(dishRows, maxItemsPerRestaurantGroup = MAX_MENU_ITEMS_PER_RESTAURANT_GROUP) {
  const restaurantMap = new Map();

  for (const row of dishRows) {
    const chainId = asString(pickFirst(row, ["chain_id", "restaurant_chain_id"], ""));
    const restaurantId = asString(pickFirst(row, ["restaurant_id", "restaurantId"], ""));
    const restaurantSlug = asString(pickFirst(row, ["restaurant_slug", "restaurantSlug"], ""));
    const restaurantName = asString(
      pickFirst(row, ["restaurant_name", "restaurantName"], "Restaurant")
    );
    const normalizedBrand = normalizeKey(restaurantName);
    const city = normalizeKey(pickFirst(row, ["city", "restaurant_city", "restaurant_city_name"], ""));
    const state = normalizeKey(pickFirst(row, ["state", "restaurant_state"], ""));
    const brandLocKey =
      normalizedBrand && (city || state) ? `brandloc:${normalizedBrand}|${city}|${state}` : "";

    // Prefer venue id so inconsistent chain_id values do not split one location into multiple cards.
    // When ids differ across franchise rows in the same market, fall back to brand + city + state.
    const restaurantKey = restaurantId
      ? `id:${restaurantId}`
      : brandLocKey ||
        (chainId ? `chain:${chainId}` : normalizedBrand ? `brand:${normalizedBrand}` : `name:${normalizedBrand || "unknown"}`);

    if (!restaurantMap.has(restaurantKey)) {
      restaurantMap.set(restaurantKey, {
        restaurant_id: restaurantId,
        restaurant_slug: restaurantSlug,
        restaurant_name: restaurantName || "Restaurant",
        _first: row,
        _itemMap: new Map(),
      });
    }

    const group = restaurantMap.get(restaurantKey);

    if (isBetterRestaurantRepresentative(row, group._first)) {
      group.restaurant_id = restaurantId || group.restaurant_id;
      group.restaurant_slug = restaurantSlug || group.restaurant_slug;
      group.restaurant_name = restaurantName || group.restaurant_name;
      group._first = row;
    }

    if (!group.restaurant_slug && restaurantSlug) {
      group.restaurant_slug = restaurantSlug;
    }

    const nameKey = canonicalizeMenuItemName(
      pickFirst(row, ["search_display_name", "menu_item_name", "menuItemName", "name"], "")
    );
    const sectionKey = normalizeKey(
      pickFirst(row, ["section", "section_name", "menu_section"], "")
    );
    const itemKey = `ns:${nameKey}::${sectionKey}`;

    const existing = group._itemMap.get(itemKey);
    if (!existing) {
      group._itemMap.set(itemKey, { ...row, __dupCount: 1 });
      continue;
    }

    const nextDupCount = (existing.__dupCount || 1) + 1;
    if (isBetterRow(row, existing)) {
      group._itemMap.set(itemKey, { ...row, __dupCount: nextDupCount });
    } else {
      group._itemMap.set(itemKey, { ...existing, __dupCount: nextDupCount });
    }
  }

  const groups = [];
  for (const g of restaurantMap.values()) {
    const items = Array.from(g._itemMap.values())
      .sort((a, b) => {
        const sa = getScore(a);
        const sb = getScore(b);
        if (sa !== null && sb !== null && sa !== sb) return sb - sa;
        const pa = getPriceMinor(a);
        const pb = getPriceMinor(b);
        if (pa !== null && pb !== null && pa !== pb) return pa - pb;
        return 0;
      })
      .slice(
        0,
        Number.isFinite(maxItemsPerRestaurantGroup) && maxItemsPerRestaurantGroup > 0
          ? maxItemsPerRestaurantGroup
          : Number.MAX_SAFE_INTEGER
      );

    groups.push({
      restaurant_id: g.restaurant_id,
      restaurant_slug: g.restaurant_slug,
      restaurant_name: g.restaurant_name,
      _first: g._first,
      items,
    });
  }

  return groups;
}

/* ---- Filter helpers ---- */

function applyFilter(params, navigate, key, value) {
  const next = new URLSearchParams(params.toString());
  if (next.get(key) === value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  navigate("?" + next.toString(), { replace: true });
}

function setFilter(params, navigate, key, value) {
  const next = new URLSearchParams(params.toString());
  if (!value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  navigate("?" + next.toString(), { replace: true });
}

/* ---- Filter toggle button ---- */

function FilterToggle({ label, active, onClick, isMobile }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        padding: isMobile ? "8px 13px" : "5px 13px",
        minHeight: isMobile ? 36 : "auto",
        fontSize: "var(--text-2, 14px)",
        fontWeight: 700,
        lineHeight: 1,
        cursor: "pointer",
        border: active ? "1.5px solid #22C55E" : "1px solid #1F2937",
        background: active ? "#22C55E" : "#1A2419",
        color: active ? "#0B0F0C" : "#D1D5DB",
        transition: "background 0.1s, color 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function GrubbidSearchResults() {
  const { t, language } = useLanguage();
  const params = useQueryParams();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const isMobile = useIsMobile();
  const sessionLocation = useMemo(() => {
    if (typeof window === "undefined") return "";
    return String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
  }, []);

  const q = String(params.get("q") || "").trim();

  useEffect(() => {
    setSearchViewMode("dishes");
  }, [q]);
  const foodNav = useFoodNavigation(q, { enabled: FOOD_NAV_SLICE_ENABLED });
  const normalizedQuery = (q || "")
    .toLowerCase()
    .replace(/\+/g, " ")
    .trim();
  const vegan = params.get("vegan") === "1";
  const gluten_free = params.get("gluten_free") === "1";
  const deals_only = params.get("deals_only") === "1";
  const routeZip = String(params.get("zip") || "").trim();
  const routeCity = String(params.get("city") || "").trim();
  const routeState = String(params.get("state") || "").trim();
  const routeNear = String(params.get("near") || "").trim();
  const routeLocationLabel = String(params.get("location_label") || "").trim();
  const routeLat = params.get("lat");
  const routeLng = params.get("lng");
  const routeRadiusMiles = params.get("radius_miles");
  const routeMetroId = String(params.get("metro_id") || "").trim();
  const routeCuisine = String(params.get("cuisine") || "").trim();
  const routeCategory = String(params.get("category") || "").trim();
  const vegetarian = params.get("vegetarian") === "1";
  const keto = params.get("keto") === "1" || params.get("low_carb") === "1";
  const low_fat = params.get("low_fat") === "1" || params.get("low_fat") === "true";
  const low_sodium = params.get("low_sodium") === "1";
  const high_protein = params.get("high_protein") === "1" || params.get("high_protein") === "true";
  const dairy_free = params.get("dairy_free") === "1";
  const diabetic_friendly = params.get("diabetic_friendly") === "1";
  const glp1_friendly =
    params.get("glp1_friendly") === "1" || params.get("glp1_friendly") === "true";
  const routePriceMax = String(params.get("price_max") || "").trim();


  const fallbackLocation = useMemo(() => {
    if (routeZip || routeCity || routeState || routeNear || routeLocationLabel) {
      return {
        zip: routeZip,
        city: routeCity,
        state: routeState,
        near: routeNear,
        label: routeLocationLabel,
      };
    }
    return parseLocation(sessionLocation);
  }, [routeZip, routeCity, routeState, routeNear, routeLocationLabel, sessionLocation]);
  const zip = fallbackLocation.zip;
  const city = fallbackLocation.city;
  const state = fallbackLocation.state;
  const near = fallbackLocation.near;
  const explicitLocationLabel = fallbackLocation.label;
  const requestZip = routeZip;
  const requestCity = routeCity;
  const requestState = routeState;
  const requestNear = routeNear;

  useEffect(() => {
    if (!foodNav.terminalQuery || foodNav.terminalQuery === q) return;
    const next = new URLSearchParams(params);
    next.set("q", foodNav.terminalQuery);
    navigate({ search: `?${next.toString()}` }, { replace: false });
  }, [foodNav.terminalQuery, q, params, navigate]);

  // Persist the resolved location back to sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const label = city && state
      ? `${city}, ${state}`
      : city || zip || near || "";
    if (label) {
      window.sessionStorage.setItem(SESSION_LOCATION_KEY, label);
    }
  }, [city, state, zip, near]);
  const sessionId = useMemo(() => getOrCreateSearchSessionId(), []);
  const trackedEventKeysRef = useRef(new Set());
  const sortMode = String(params.get("sort") || "default_relevance").trim() || "default_relevance";
  const activeFilters = useMemo(() => parseFiltersFromUrl(params), [params]);
  const [waiterRefinementStack, setWaiterRefinementStack] = useState([]);
  const waiterIntentContext = useMemo(() => ({
    activeFilters,
    high_protein,
    priceMax: routePriceMax,
    urlIntentText: Array.from(params.entries()).flat().join(" "),
    waiterRefinementDepth: waiterRefinementStack.length,
  }), [activeFilters, high_protein, params, routePriceMax, waiterRefinementStack.length]);

  const [rows, setRows] = useState([]);
  const [restaurantMetaMap, setRestaurantMetaMap] = useState(new Map());
  const [queryMeta, setQueryMeta] = useState(null);
  const [searchMeta, setSearchMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState("");
  const [searchOffset, setSearchOffset] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchTotalCount, setSearchTotalCount] = useState(0);
  const [searchViewMode, setSearchViewMode] = useState("dishes");
  const SEARCH_LIMIT = 24;
  const [shareCopied, setShareCopied] = useState(false);

  const baseWaiterState = useMemo(
    () => buildWaiterOptions(rows, q, waiterIntentContext),
    [rows, q, waiterIntentContext]
  );

  const waiterFilteredRows = useMemo(() => {
    const filtered = applyWaiterRefinementStackToRows(
      rows,
      baseWaiterState.inventory,
      waiterRefinementStack
    );
    if (!waiterRefinementStack.length) return filtered;
    const lastStep = waiterRefinementStack[waiterRefinementStack.length - 1];
    return sortByWaiterRefinement(filtered, lastStep);
  }, [rows, baseWaiterState.inventory, waiterRefinementStack]);

  const activeWaiterState = useMemo(
    () => buildWaiterOptions(waiterFilteredRows, q, waiterIntentContext),
    [waiterFilteredRows, q, waiterIntentContext]
  );

  const handleWaiterSelect = useCallback((option) => {
    const resolved = resolveWaiterRefinementStep(option, waiterFilteredRows, q, {
      ...waiterIntentContext,
      waiterRefinementDepth: waiterRefinementStack.length,
    });
    if (!resolved) return;
    setWaiterRefinementStack((prev) => [...prev, resolved]);
  }, [waiterFilteredRows, q, waiterIntentContext, waiterRefinementStack.length]);

  const handleWaiterUndo = useCallback(() => {
    setWaiterRefinementStack((prev) => (prev.length ? prev.slice(0, -1) : prev));
  }, []);

  const waiterRestoredRef = useRef(false);

  // Reset waiter only on query/location changes — not on results reload.
  useEffect(() => {
    setWaiterRefinementStack([]);
    waiterRestoredRef.current = false;
  }, [q, city, state, zip, near]);

  // Keep ?waiter= in the URL in sync with the active refinement stack (silent, no re-render).
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (waiterRefinementStack.length) {
        url.searchParams.set(
          "waiter",
          waiterRefinementStack.map((step) => step.id).join(",")
        );
      } else {
        url.searchParams.delete("waiter");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (_) {}
  }, [waiterRefinementStack]);

  // Restore waiter stack from URL after results load (supports shared links).
  useEffect(() => {
    if (loading || waiterRestoredRef.current) return;
    if (!rows.length) return;
    try {
      const raw = new URL(window.location.href).searchParams.get("waiter");
      if (!raw) {
        waiterRestoredRef.current = true;
        return;
      }
      const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
      if (!ids.length) {
        waiterRestoredRef.current = true;
        return;
      }

      let restoredRows = rows;
      const restoredStack = [];
      for (const id of ids) {
        const stepState = buildWaiterOptions(restoredRows, q, {
          ...waiterIntentContext,
          waiterRefinementDepth: restoredStack.length,
        });
        const match =
          resolveWaiterRefinementStep({ id }, restoredRows, q, {
            ...waiterIntentContext,
            waiterRefinementDepth: restoredStack.length,
          }) ||
          stepState.options.find((option) => option.id === id) ||
          buildContextAwareRefinementOptions(stepState.options, q, stepState.inventory).find(
            (option) => option.id === id
          );
        if (!match || typeof match.test !== "function") break;
        restoredStack.push(match);
        restoredRows = applyWaiterRefinementStackToRows(
          restoredRows,
          stepState.inventory,
          restoredStack
        );
      }
      if (restoredStack.length) setWaiterRefinementStack(restoredStack);
    } catch (_) {}
    waiterRestoredRef.current = true;
  }, [loading, rows, q, waiterIntentContext]);

  const { primaryUrl, fallbackUrl, hasGeoFilter } = useMemo(() => {
    const u = new URL(`${API}/search`);
    const hasRouteCoords = routeLat != null && routeLat !== "" && routeLng != null && routeLng !== "";
    // Only URL-authored manual location filters should suppress geo mode.
    // Session/display labels must not turn an auto-location search into a city-only search.
    const hasExplicitLocation = Boolean(requestZip || requestNear || (requestCity && !hasRouteCoords));
    if (q) u.searchParams.set("q", q);
    const dietaryParams = buildDietaryQueryParams({
      vegan,
      vegetarian,
      gluten_free,
      dairy_free,
      diabetic_friendly,
      glp1_friendly,
      keto,
      low_fat,
      low_sodium,
      high_protein,
    });
    for (const [key, value] of Object.entries(dietaryParams)) {
      if (value) u.searchParams.set(key, String(value));
    }
    const restaurantParams = buildRestaurantFilterQueryParams({
      cuisine: routeCuisine,
      category: routeCategory,
    });
    for (const [key, value] of Object.entries(restaurantParams)) {
      if (value) u.searchParams.set(key, value);
    }
    if (deals_only) u.searchParams.set("deals_only", "1");
    if (routePriceMax) u.searchParams.set("price_max", routePriceMax);
    if (hasExplicitLocation) {
      if (requestZip) u.searchParams.set("zip", requestZip);
      if (requestCity) u.searchParams.set("city", requestCity);
      if (requestState) u.searchParams.set("state", requestState);
      if (requestNear) u.searchParams.set("near", requestNear);
    }
    u.searchParams.set("limit", String(SEARCH_LIMIT));
    if (language && language !== "en") {
      u.searchParams.set("lang", language);
    }

    // Save the base URL (no geo) for fallback use
    const baseUrl = u.toString();

    let geoAdded = false;
    if (!hasExplicitLocation) {
      const urlLat = routeLat != null ? Number(routeLat) : null;
      const urlLng = routeLng != null ? Number(routeLng) : null;
      if (urlLat != null && Number.isFinite(urlLat) && urlLng != null && Number.isFinite(urlLng)) {
        u.searchParams.set("lat", String(urlLat));
        u.searchParams.set("lng", String(urlLng));
        const r = routeRadiusMiles != null ? Number(routeRadiusMiles) : NaN;
        u.searchParams.set("radius_miles", String(Number.isFinite(r) && r > 0 ? r : 8));
        geoAdded = true;
      } else if (geo.lat != null && geo.lng != null) {
        u.searchParams.set("lat", String(geo.lat));
        u.searchParams.set("lng", String(geo.lng));
        u.searchParams.set("radius_miles", "8");
        geoAdded = true;
      }
    }

    return { primaryUrl: u.toString(), fallbackUrl: baseUrl, hasGeoFilter: geoAdded };
  }, [
    q,
    vegan,
    gluten_free,
    deals_only,
    vegetarian,
    keto,
    low_fat,
    low_sodium,
    high_protein,
    dairy_free,
    diabetic_friendly,
    glp1_friendly,
    routePriceMax,
    requestZip,
    requestCity,
    requestState,
    requestNear,
    routeLat,
    routeLng,
    routeRadiusMiles,
    geo.lat,
    geo.lng,
    routeCuisine,
    routeCategory,
    language,
  ]);

  const [geoFallbackUsed, setGeoFallbackUsed] = useState(false);
  const gaTrackedSearchKeysRef = useRef(new Set());

  useEffect(() => {
    let alive = true;

    const startedAt = new Date().toISOString();

    async function fetchSearch(url) {
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || hasDegradedEmptyResponse(json)) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      return json;
    }

    async function trackSearchEvent(resultJson, fallbackUsed) {
      if (!q) return;

      const routeLatNum = routeLat != null ? Number(routeLat) : null;
      const routeLngNum = routeLng != null ? Number(routeLng) : null;
      const routeRadiusNum = routeRadiusMiles != null ? Number(routeRadiusMiles) : null;
      const hasRouteCoords = routeLat != null && routeLat !== "" && routeLng != null && routeLng !== "";
      const hasExplicitTarget = Boolean(requestZip || requestNear || (requestCity && !hasRouteCoords));

      const targetLat =
        !hasExplicitTarget && Number.isFinite(routeLatNum)
          ? routeLatNum
          : !hasExplicitTarget && Number.isFinite(geo.lat)
          ? geo.lat
          : null;
      const targetLng =
        !hasExplicitTarget && Number.isFinite(routeLngNum)
          ? routeLngNum
          : !hasExplicitTarget && Number.isFinite(geo.lng)
          ? geo.lng
          : null;
      const targetRadiusMiles =
        !hasExplicitTarget && Number.isFinite(routeRadiusNum) && routeRadiusNum > 0
          ? routeRadiusNum
          : !hasExplicitTarget && targetLat !== null && targetLng !== null
          ? 8
          : null;

      const originLat =
        Number.isFinite(geo.lat)
          ? geo.lat
          : Number.isFinite(routeLatNum)
          ? routeLatNum
          : null;
      const originLng =
        Number.isFinite(geo.lng)
          ? geo.lng
          : Number.isFinite(routeLngNum)
          ? routeLngNum
          : null;

      const originFallback = parseLocation(
        routeLocationLabel || explicitLocationLabel || sessionLocation || ""
      );

      const targetCity = requestCity || requestNear || originFallback.city || "";
      const targetState = requestState || originFallback.state || "";

      const payload = compactObject({
        searchOrigin: {
          lat: originLat,
          lng: originLng,
          city: originFallback.city || null,
          state: originFallback.state || null,
        },
        searchTarget: {
          city: targetCity || null,
          state: targetState || null,
          metroId: routeMetroId || null,
          lat: targetLat,
          lng: targetLng,
          radiusMiles: targetRadiusMiles,
        },
        filters: {
          vegan,
          vegetarian,
          gluten_free,
          deals_only,
        },
        sortMode,
        resultCount: normalizeRows(resultJson).length,
        geoFallbackUsed: fallbackUsed === true,
      });

      if (!payload) return;

      const eventKey = JSON.stringify({
        q,
        sessionId,
        sortMode,
        fallbackUsed: fallbackUsed === true,
        searchOrigin: payload.searchOrigin || null,
        searchTarget: payload.searchTarget || null,
        filters: payload.filters || null,
        resultCount: payload.resultCount ?? 0,
        visibleResults: buildVisibleResultSignature(resultJson),
      });

      if (trackedEventKeysRef.current.has(eventKey)) return;
      trackedEventKeysRef.current.add(eventKey);

      try {
        await fetch(`${API}/search/track`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query_text: q,
            occurred_at: startedAt,
            session_id: sessionId || null,
            metro_id: routeMetroId || null,
            event_payload_json: payload,
          }),
        });
      } catch (trackingError) {
        console.error("search tracking failed:", trackingError);
      }
    }

    async function run() {
      if (foodNav.pendingNavigation) {
        setLoading(false);
        setErr("");
        setRows([]);
        setQueryMeta(null);
        setSearchMeta(null);
        return;
      }

      setLoading(true);
      setErr("");
      setGeoFallbackUsed(false);
      setSearchOffset(0);
      setSearchHasMore(false);
      setRestaurantMetaMap(new Map());

      try {
        let json = await fetchSearch(primaryUrl);
        let usedFallback = false;

        // If geo filter produced 0 results, retry without geo
        if (hasGeoFilter && fallbackUrl !== primaryUrl && normalizeRows(json).length === 0) {
          json = await fetchSearch(fallbackUrl);
          usedFallback = true;
          if (alive) setGeoFallbackUsed(true);
        }

        if (!alive) return;

        const resultRows = normalizeRows(json);
        const total = Number.isFinite(Number(json?.total)) ? Number(json.total) : resultRows.length;
        const returned = resultRows.length;
        const pageOffset = 0;

        // Build restaurant meta lookup (location_count for franchise groups)
        const rMeta = new Map();
        if (Array.isArray(json?.restaurants)) {
          for (const r of json.restaurants) {
            const id = asString(pickFirst(r, ["restaurant_id", "id"], ""));
            if (id) rMeta.set(id, r);
          }
        }
        setRows(resultRows);
        setRestaurantMetaMap(rMeta);
        setQueryMeta(json?.query || null);
        setSearchMeta(json?.search_meta || null);
        setSearchTotalCount(total);
        setSearchOffset(pageOffset + returned);
        setSearchHasMore(pageOffset + returned < total);
        const locationLabelForAnalytics =
          routeLocationLabel ||
          explicitLocationLabel ||
          [requestCity, requestState].filter(Boolean).join(", ") ||
          sessionLocation ||
          "";
        const gaSearchKey = JSON.stringify({
          q,
          total,
          locationLabelForAnalytics,
          source: params.get("source") || "discovery_search",
          primaryUrl,
          usedFallback,
        });
        if (!gaTrackedSearchKeysRef.current.has(gaSearchKey)) {
          gaTrackedSearchKeysRef.current.add(gaSearchKey);
          trackSearchPerformed({
            searchTerm: q,
            source: params.get("source") || "discovery_search",
            resultCount: total,
            locationLabel: locationLabelForAnalytics || null,
          });
        }
        void trackSearchEvent(json, usedFallback);
      } catch (e) {
        if (!alive) return;
        setErr(
          toConsumerErrorMessage(
            e,
            "We couldn’t load search results right now. Please try again in a moment."
          )
        );
        setRows([]);
        setQueryMeta(null);
        setSearchMeta(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [
    primaryUrl,
    fallbackUrl,
    hasGeoFilter,
    q,
    foodNav.pendingNavigation,
    requestZip,
    requestCity,
    requestState,
    requestNear,
    routeLat,
    routeLng,
    routeRadiusMiles,
    routeLocationLabel,
    routeMetroId,
    vegan,
    vegetarian,
    gluten_free,
    deals_only,
    keto,
    low_fat,
    low_sodium,
    dairy_free,
    diabetic_friendly,
    glp1_friendly,
    high_protein,
    geo.lat,
    geo.lng,
    explicitLocationLabel,
    sessionLocation,
    sessionId,
    sortMode,
  ]);

  const waiterDisplayOptions = useMemo(
    () => buildContextAwareRefinementOptions(activeWaiterState.options, q, activeWaiterState.inventory),
    [activeWaiterState.options, activeWaiterState.inventory, q]
  );

  const dishRows = useMemo(() => waiterFilteredRows.filter(isDishRow), [waiterFilteredRows]);
  const restaurantOnlyRows = useMemo(() => waiterFilteredRows.filter((r) => !isDishRow(r)), [waiterFilteredRows]);
  const allDishRows = useMemo(() => rows.filter(isDishRow), [rows]);
  const allRestaurantOnlyRows = useMemo(() => rows.filter((r) => !isDishRow(r)), [rows]);

  const activeDietFilterLabels = useMemo(() => {
    const labels = [];
    if (vegan) labels.push("Vegan");
    if (vegetarian) labels.push("Vegetarian");
    if (gluten_free) labels.push("Gluten-Free");
    if (keto) labels.push("Keto");
    if (low_fat) labels.push("Low-Fat");
    if (low_sodium) labels.push("Low-Sodium");
    if (dairy_free) labels.push("Dairy-Free");
    if (diabetic_friendly) labels.push("Diabetic-Friendly");
    if (glp1_friendly) labels.push("GLP-1 Friendly");
    if (high_protein) labels.push("High Protein");
    return labels;
  }, [vegan, vegetarian, gluten_free, keto, low_fat, low_sodium, dairy_free, diabetic_friendly, glp1_friendly, high_protein]);
  const hasDietFilter = activeDietFilterLabels.length > 0;
  const restaurantIntent = !!(
    searchMeta?.restaurant_oriented ||
    searchMeta?.restaurant_first ||
    searchMeta?.direct_restaurant_name
  );
  // Dish-first rule: grouped restaurant rendering only activates when the
  // backend explicitly suppressed menu items (confirmed restaurant-name search)
  // OR when restaurantIntent is set but there are no actual dish rows (cuisine
  // keyword with no local item data — fall back to restaurant bucket cards).
  // This prevents food queries like "pizza" or "Italian" from suppressing
  // individual dish cards just because the query word is also a cuisine type.
  const useRestaurantGroupedRendering = !!(
    searchMeta?.suppress_menu_items ||
    (restaurantIntent && dishRows.length === 0)
  );

  const dishResultCount = allDishRows.length;
  const restaurantResultCount = useMemo(
    () => countUniqueRestaurants(allDishRows, allRestaurantOnlyRows),
    [allDishRows, allRestaurantOnlyRows]
  );
  const showResultModeSelector = useMemo(
    () => shouldShowSearchResultModeSelector({
      directRestaurantName: searchMeta?.direct_restaurant_name === true,
      suppressMenuItems: searchMeta?.suppress_menu_items === true,
      dishCount: dishResultCount,
      restaurantCount: restaurantResultCount,
    }),
    [searchMeta, dishResultCount, restaurantResultCount]
  );
  const preferRestaurantView = showResultModeSelector && searchViewMode === "restaurants";
  const activeRestaurantGroupedRendering = useRestaurantGroupedRendering || preferRestaurantView;
  const restaurantBrowseRows = useMemo(() => {
    if (!preferRestaurantView) return [];
    const userGeo =
      geo.lat != null && geo.lng != null ? { lat: geo.lat, lng: geo.lng } : null;
    return buildRestaurantBrowseRows(
      allDishRows,
      allRestaurantOnlyRows,
      restaurantMetaMap,
      userGeo
    );
  }, [
    preferRestaurantView,
    allDishRows,
    allRestaurantOnlyRows,
    restaurantMetaMap,
    geo.lat,
    geo.lng,
  ]);
  const isRestaurantResultsView =
    preferRestaurantView ||
    (useRestaurantGroupedRendering && searchMeta?.suppress_menu_items === true);

  const relaxPerRestaurantItemCap = useMemo(() => {
    if (!activeRestaurantGroupedRendering) return false;
    if (hasDietFilter) return true;
    const n = normalizedQuery;
    return /\b(high[\s-]?protein|protein[\s-]?(rich|packed)|low[\s-]?carb|low[\s-]?sodium|keto|vegan|vegetarian|gluten[\s-]?free|diabetic|heart[\s-]?healthy)\b/i.test(
      n
    );
  }, [hasDietFilter, normalizedQuery, activeRestaurantGroupedRendering]);

  const restaurantGroups = useMemo(() => {
    if (!activeRestaurantGroupedRendering) return [];
    return buildRestaurantGroups(
      dishRows,
      relaxPerRestaurantItemCap ? Number.MAX_SAFE_INTEGER : MAX_MENU_ITEMS_PER_RESTAURANT_GROUP
    );
  }, [dishRows, relaxPerRestaurantItemCap, activeRestaurantGroupedRendering]);

  function toggleSearchFilter(key) {
    const next = { ...activeFilters, [key]: !activeFilters[key] };
    const nextParams = filtersToUrlParams(next, params);
    navigate("?" + nextParams.toString(), { replace: true });
  }

  // GUARDRAIL:
  // Ordinary food searches are dish-first experiences.
  // Restaurant-first grouping, section splitting, or venue-grouped rendering may only activate when explicit restaurant intent is detected.
  // Food-intent queries must prioritize individual menu-item relevance over restaurant grouping.
  // Agents may not redesign search hierarchy, grouping, ranking, or result presentation without explicit user approval.
  const visibleDishRows = useMemo(
    () => (activeRestaurantGroupedRendering ? [] : dishRows),
    [dishRows, activeRestaurantGroupedRendering]
  );
  const hasMenuMatches = restaurantGroups.length > 0;
  const hasDishMatches = visibleDishRows.length > 0;
  const visibleResultCountForWaiter = activeRestaurantGroupedRendering
    ? restaurantGroups.length || restaurantOnlyRows.length
    : visibleDishRows.length;
  const waiterMinItemSignals =
    waiterRefinementStack.length > 0 ? WAITER_FOLLOW_UP_MIN_ITEM_SIGNALS : WAITER_MIN_ITEM_SIGNALS;
  const showWaiterQuestion = shouldOfferWaiterFollowUp({
    visibleResultCount: visibleResultCountForWaiter,
    refinementStackLength: waiterRefinementStack.length,
    utilityScore: activeWaiterState.utilityScore,
    optionCount: waiterDisplayOptions.length,
    inventorySignalCount: activeWaiterState.inventory.length,
    minItemSignals: waiterMinItemSignals,
  });
  const showWaiterBar =
    !foodNav.pendingNavigation &&
    !isRestaurantResultsView &&
    (showWaiterQuestion || waiterRefinementStack.length > 0);
  const activeWaiterRefinement =
    waiterRefinementStack.length > 0
      ? waiterRefinementStack[waiterRefinementStack.length - 1]
      : null;

  const restaurantGroupsById = useMemo(() => {
    if (!activeRestaurantGroupedRendering) return new Set();
    const s = new Set();
    for (const g of restaurantGroups) {
      const id = asString(g.restaurant_id);
      if (id) s.add(id);
    }
    return s;
  }, [restaurantGroups, activeRestaurantGroupedRendering]);

  const restaurantOnlyVisible = useMemo(() => {
    if (!activeRestaurantGroupedRendering) return [];
    if (!restaurantOnlyRows.length) return [];
    return restaurantOnlyRows.filter((r) => {
      const id = asString(pickFirst(r, ["restaurant_id", "id"], ""));
      if (!id) return true;
      return !restaurantGroupsById.has(id);
    });
  }, [restaurantOnlyRows, restaurantGroupsById, activeRestaurantGroupedRendering]);

  const minVisibleDistance = useMemo(() => {
    const distances = rows
      .map((row) => asNumber(pickFirst(row, ["distance_miles", "restaurant_distance_miles"], null)))
      .filter((value) => value !== null);
    if (!distances.length) return null;
    return Math.min(...distances);
  }, [rows]);

  const locationLabel = useMemo(() => {
    if (explicitLocationLabel) return explicitLocationLabel;
    if (city || near) return city || near;
    if (zip) return zip;
    if (geo.status === "granted" && minVisibleDistance !== null && minVisibleDistance <= 25) {
      return "your current location";
    }
    return "";
  }, [explicitLocationLabel, city, near, zip, geo.status, minVisibleDistance]);

  const locationPhrase = useMemo(() => {
    if (!locationLabel) return "";
    if (locationLabel === "your current location") return "near your current location";
    return `in ${locationLabel}`;
  }, [locationLabel]);
  const displayQuery = useMemo(() => {
    return applyWaiterDisplayCorrections(q, queryMeta);
  }, [queryMeta, q]);

  const styles = {
    grid: {
      display: "grid",
      gap: 12,
      marginTop: 16,
      minWidth: 0,
    },
  };

  const emptyMessage = displayQuery
    ? t("search.noResultsFor", `No results for "${displayQuery}"${locationPhrase ? ` ${locationPhrase}` : ""}.`, {
        query: displayQuery,
        location: locationPhrase ? ` ${locationPhrase}` : "",
      })
    : t("search.noResultsGeneric", `No results${locationPhrase ? ` ${locationPhrase}` : ""}.`, {
        location: locationPhrase ? ` ${locationPhrase}` : "",
      });

  const subtitleParts = [
    locationLabel && locationLabel !== "your current location"
      ? t("search.near", `near ${locationLabel}`, { location: locationLabel })
      : locationLabel === "your current location"
      ? t("search.nearYou", "near you")
      : null,
    !loading && (() => {
      if (activeRestaurantGroupedRendering ? hasMenuMatches : hasDishMatches) {
        const totalDishes = activeRestaurantGroupedRendering
          ? restaurantGroups.reduce((acc, g) => acc + g.items.length, 0)
          : visibleDishRows.length;
        return totalDishes === 1
          ? t("search.foundDish", "1 dish found", { count: totalDishes })
          : t("search.foundDishes", `${totalDishes} dishes found`, { count: totalDishes });
      }
      if (activeRestaurantGroupedRendering && !hasDietFilter && restaurantOnlyVisible.length) {
        return restaurantOnlyVisible.length === 1
          ? t("search.foundRestaurant", "1 restaurant found", { count: restaurantOnlyVisible.length })
          : t("search.foundRestaurants", `${restaurantOnlyVisible.length} restaurants found`, { count: restaurantOnlyVisible.length });
      }
      return null;
    })(),
  ].filter(Boolean).join(" · ");
  const hasVisibleResults = preferRestaurantView
    ? restaurantBrowseRows.length > 0
    : activeRestaurantGroupedRendering
      ? hasMenuMatches || restaurantOnlyVisible.length > 0
      : hasDishMatches;

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "var(--gb-color-page)" }}>
      {/* ── STICKY HEADER ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--gb-color-page)",
        borderBottom: "1px solid #1F2937",
        paddingBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{ border: "none", background: "transparent", fontSize: 22, color: "#6B7280", cursor: "pointer", padding: 4, lineHeight: 1, flexShrink: 0 }}
          >
            ←
          </button>
          <BrandLogo height={48} radius={14} />
          <div style={{ width: 30, flexShrink: 0 }} />
        </div>
        <div style={{ maxWidth: 576, margin: "0 auto", padding: "0 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#0B0F0C", letterSpacing: "-0.02em" }}>
            🔍 {displayQuery ? `"${displayQuery}"` : "Search"}
          </span>
          {locationLabel && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: "#22C55E",
              background: "rgba(34,197,94,0.08)", borderRadius: 999,
              padding: "2px 10px", border: "1px solid rgba(34,197,94,0.2)",
            }}>
              Near {locationLabel}
            </span>
          )}
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2200);
              } catch {
                prompt("Copy this search link:", window.location.href);
              }
            }}
            title="Share these search results"
            style={{
              marginLeft: "auto", border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 999, background: shareCopied ? "rgba(34,197,94,0.14)" : "transparent",
              color: shareCopied ? "#22C55E" : "#9CA3AF",
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              padding: "3px 12px", whiteSpace: "nowrap", transition: "color 0.15s",
            }}
          >
            {shareCopied ? "Copied!" : "Share"}
          </button>
        </div>
        {showWaiterBar && (
          <div style={{ maxWidth: 576, margin: "0 auto", padding: "4px 14px 2px" }}>
            <WaiterRefinementPrompt
              displayQuery={displayQuery}
              filteredResultCount={visibleResultCountForWaiter}
              refinementOptions={showWaiterQuestion ? waiterDisplayOptions : []}
              refinementStackLength={waiterRefinementStack.length}
              onSelectRefinement={handleWaiterSelect}
              onUndo={handleWaiterUndo}
            />
          </div>
        )}
      </div>
      {/* ── SCROLLABLE FEED ── */}
      <div style={{ maxWidth: 576, margin: "0 auto", padding: "10px 14px calc(var(--bottom-nav-h, 72px) + 8px)" }}>

      <ActiveFilterChips filters={activeFilters} onToggle={toggleSearchFilter} />

      {geoFallbackUsed && (
        <StatusMessage tone="warning">
          {t("search.geoFallback", "No results found near your location — showing all matching results instead.")}
        </StatusMessage>
      )}

      {!loading && !err && searchMeta?.result_mode === "fallback" && searchMeta?.fallback_explanation && (
        <StatusMessage tone="warning">
          {searchMeta.fallback_explanation}
        </StatusMessage>
      )}

      {err && <StatusMessage>Error: {err}</StatusMessage>}
      {loading && <StatusMessage tone="muted">{t("common.loading")}</StatusMessage>}

      {!loading && !err && !hasDishMatches && hasDietFilter && (
        <StatusMessage tone="muted">
          {t("search.noDietaryResults", `No menu items meet your preference for ${activeDietFilterLabels.join(", ")}.`, {
            filters: activeDietFilterLabels.join(", "),
          })}
        </StatusMessage>
      )}

      {!loading && !err && q && !hasVisibleResults && !hasDietFilter && (
        <StatusMessage tone="muted">{emptyMessage}</StatusMessage>
      )}

      {foodNav.pendingNavigation && (
        <FoodNavigationLadder
          step={foodNav.navState?.step}
          breadcrumb={foodNav.navState?.step?.breadcrumb || foodNav.breadcrumb}
          loading={foodNav.loading}
          onSelectChoice={foodNav.selectChoice}
          onBypass={foodNav.bypass}
          onBack={foodNav.goBack}
        />
      )}

      {!foodNav.pendingNavigation && !loading && !err && hasVisibleResults && showResultModeSelector && (
        <SearchResultModeSelector
          dishCount={dishResultCount}
          restaurantCount={restaurantResultCount}
          mode={searchViewMode}
          onModeChange={setSearchViewMode}
        />
      )}

      {!loading && !err && preferRestaurantView && restaurantBrowseRows.length > 0 && (
        <div style={styles.grid}>
          {restaurantBrowseRows.map((r) => (
            <SearchResultCard
              key={`rb-${
                asString(pickFirst(r, ["restaurant_id", "id"], "")) ||
                asString(pickFirst(r, ["restaurant_name", "name"], ""))
              }`}
              item={r}
              query={q}
              queryMeta={queryMeta}
              resultView="restaurant"
              matchContext={{
                wantsNearby: searchMeta?.wants_nearby === true,
                coordinateSearchActive: hasGeoFilter === true,
              }}
              geo={geo.lat != null && geo.lng != null ? { lat: geo.lat, lng: geo.lng } : null}
            />
          ))}
        </div>
      )}

      {!loading && !err && activeRestaurantGroupedRendering && !preferRestaurantView && !hasDietFilter && restaurantOnlyVisible.length > 0 && (restaurantIntent || !hasMenuMatches) && (
        <>
          <SectionTitle style={{ color: "#0B0F0C" }}>{t("search.restaurants", "Restaurants")}</SectionTitle>
          <div style={styles.grid}>
            {restaurantOnlyVisible.map((r) => (
              <SearchResultCard
                key={`r-${
                  asString(pickFirst(r, ["restaurant_id", "id"], "")) || asString(r?.name)
                }`}
                item={r}
                query={q}
                queryMeta={queryMeta}
                matchContext={{
                  wantsNearby: searchMeta?.wants_nearby === true,
                  coordinateSearchActive: hasGeoFilter === true,
                }}
                geo={geo.lat != null && geo.lng != null ? { lat: geo.lat, lng: geo.lng } : null}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !err && activeRestaurantGroupedRendering && !preferRestaurantView && hasMenuMatches && (
        <>
          {!showWaiterBar && restaurantIntent && <SectionTitle style={{ color: "#0B0F0C" }}>{t("common.dishes")}</SectionTitle>}
          <div style={styles.grid}>
            {restaurantGroups.map((g) => {
              const rMeta = restaurantMetaMap.get(asString(g.restaurant_id));
              return (
                <SearchResultCard
                  key={`rg-${g.restaurant_id || g.restaurant_name}`}
                    restaurant={{
                      id: g.restaurant_id,
                      slug: g.restaurant_slug || g._first?.restaurant_slug || g._first?.slug || null,
                      name: g.restaurant_name,
                      cuisine: g._first?.cuisine || g._first?.restaurant_cuisine || null,
                      category: g._first?.category || g._first?.restaurant_category || null,
                      phone: g._first?.phone || g._first?.restaurant_phone || null,
                      distance_miles:
                        g._first?.distance_miles ?? g._first?.restaurant_distance_miles ?? null,
                      profile_tier:
                        g._first?.profile_tier || g._first?.restaurant_profile_tier || null,
                      listing_status:
                        g._first?.listing_status || g._first?.restaurant_listing_status || null,
                      location_count: rMeta?.location_count ?? null,
                      raw: g._first,
                    }}
                    items={g.items}
                    query={q}
                    queryMeta={queryMeta}
                    matchContext={{
                      wantsNearby: searchMeta?.wants_nearby === true,
                      coordinateSearchActive: hasGeoFilter === true,
                    }}
                    geo={geo.lat != null && geo.lng != null ? { lat: geo.lat, lng: geo.lng } : null}
                    activeRefinement={activeWaiterRefinement}
                  />
              );
          })}
          </div>
        </>
      )}

      {!loading && !err && !activeRestaurantGroupedRendering && hasDishMatches && (
        <>
          <div style={styles.grid}>
            {visibleDishRows.map((row) => {
              const rowId = asString(pickFirst(row, ["menu_item_id", "id"], ""));
              const rowName = asString(
                pickFirst(row, ["search_display_name", "menu_item_name", "menuItemName", "name"], "")
              );
              return (
                <SearchResultCard
                  key={`mi-${rowId || rowName}`}
                  item={row}
                  query={q}
                  queryMeta={queryMeta}
                  matchContext={{
                    wantsNearby: searchMeta?.wants_nearby === true,
                    coordinateSearchActive: hasGeoFilter === true,
                  }}
                  geo={geo.lat != null && geo.lng != null ? { lat: geo.lat, lng: geo.lng } : null}
                  activeRefinement={activeWaiterRefinement}
                />
              );
            })}
          </div>
        </>
      )}
      {/* Load More — search pagination */}
      {!loading && !err && searchHasMore && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <button
            type="button"
            disabled={loadingMore}
            className={`gb-pill-button ${loadingMore ? "gb-pill-button--secondary" : "gb-pill-button--primary"}`}
            onClick={async () => {
              setLoadingMore(true);
              setErr("");
              try {
                const u = new URL(primaryUrl);
                u.searchParams.set("limit", String(SEARCH_LIMIT));
                u.searchParams.set("offset", String(searchOffset));
                const res = await fetch(u.toString(), { credentials: "include" });
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
                const moreRows = normalizeRows(json);
                const total = Number.isFinite(Number(json?.total)) ? Number(json.total) : (searchOffset + moreRows.length);
                const returned = moreRows.length;
                const pageOffset = searchOffset;
                if (Array.isArray(json?.restaurants)) {
                  setRestaurantMetaMap((prev) => {
                    const next = new Map(prev);
                    for (const r of json.restaurants) {
                      const id = asString(pickFirst(r, ["restaurant_id", "id"], ""));
                      if (id) next.set(id, r);
                    }
                    return next;
                  });
                }
                setRows((prev) => [...prev, ...moreRows]);
                setQueryMeta((prev) => json?.query || prev || null);
                setSearchTotalCount(total);
                setSearchOffset(pageOffset + returned);
                setSearchHasMore(pageOffset + returned < total);
              } catch (e) {
                setErr(toConsumerErrorMessage(e, "Couldn't load more results. Please try again."));
              } finally {
                setLoadingMore(false);
              }
            }}
          >
            {loadingMore
              ? "Loading…"
              : `Load More (${searchTotalCount - rows.length} remaining)`}
          </button>
        </div>
      )}

      </div>
      <BottomNav />
    </div>
  );
}
