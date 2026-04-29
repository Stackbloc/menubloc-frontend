/**
 * ============================================================
 * File: WaiterRefinementPrompt.jsx
 * Path: menubloc-frontend/src/components/search/WaiterRefinementPrompt.jsx
 * Date: 2026-04-27
 * Purpose:
 *   Two-choice waiter-style refinement prompt for search results.
 *   Results always remain visible. This component only provides
 *   a simple first fork, such as: Chicken sandwich? Fried or Grilled.
 * ============================================================
 */

import React, { useMemo } from "react";

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function getItemName(item) {
  return (
    item?.menu_item_name ||
    item?.item_name ||
    item?.search_display_name ||
    item?.name ||
    item?.item?.menu_item_name ||
    item?.item?.name ||
    ""
  );
}

function getDescription(item) {
  return (
    item?.description ||
    item?.menu_item_description ||
    item?.item_description ||
    item?.item?.description ||
    ""
  );
}

function getDistance(item) {
  const value = item?.distance_miles ?? item?.restaurant_distance_miles;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getPrice(item) {
  if (item?.price != null) {
    const number = Number(item.price);
    if (Number.isFinite(number)) return number;
  }

  if (item?.price_cents != null) {
    const number = Number(item.price_cents);
    if (Number.isFinite(number)) return number / 100;
  }

  if (item?.price_minor_units != null) {
    const number = Number(item.price_minor_units);
    if (Number.isFinite(number)) return number / 100;
  }

  return null;
}

function itemText(item) {
  return `${getItemName(item)} ${getDescription(item)}`.toLowerCase();
}

function itemMatchesOption(item, option) {
  if (!option?.terms?.length) return true;
  const haystack = itemText(item);
  return option.terms.some((term) => haystack.includes(term));
}

function detectFork(query) {
  const q = normalizeText(query);

  if (q.includes("chicken") && q.includes("sandwich")) {
    return {
      id: "chicken_sandwich_fork",
      question: "Chicken sandwich?",
      left: {
        id: "fried",
        label: "Fried",
        terms: ["fried", "crispy", "breaded"],
      },
      right: {
        id: "grilled",
        label: "Grilled",
        terms: ["grilled"],
      },
    };
  }

  if (q.includes("pizza")) {
    return {
      id: "pizza_style_fork",
      question: "Pizza?",
      left: {
        id: "new_york",
        label: "New York",
        terms: ["new york", "ny style", "slice"],
      },
      right: {
        id: "chicago",
        label: "Chicago",
        terms: ["chicago", "deep dish"],
      },
    };
  }

  if (q.includes("taco")) {
    return {
      id: "taco_style_fork",
      question: "Tacos?",
      left: {
        id: "street",
        label: "Street",
        terms: ["street"],
      },
      right: {
        id: "loaded",
        label: "Loaded",
        terms: ["loaded", "supreme"],
      },
    };
  }

  return null;
}

export function filterAndRankResults(items, selectedOptions = []) {
  if (!Array.isArray(items)) return [];

  let nextItems = [...items];

  selectedOptions.forEach((option) => {
    if (option?.terms?.length) {
      const filtered = nextItems.filter((item) => itemMatchesOption(item, option));

      // Important:
      // If the loaded result text does not contain the terms yet,
      // do not wipe out all results. Keep current results visible.
      if (filtered.length > 0) {
        nextItems = filtered;
      }
    }

    if (option?.sort === "price_asc") {
      nextItems.sort((a, b) => {
        const priceA = getPrice(a);
        const priceB = getPrice(b);
        return (priceA ?? 999999) - (priceB ?? 999999);
      });
    }

    if (option?.sort === "distance_asc") {
      nextItems.sort((a, b) => {
        const distanceA = getDistance(a);
        const distanceB = getDistance(b);
        return (distanceA ?? 999999) - (distanceB ?? 999999);
      });
    }
  });

  return nextItems;
}

export default function WaiterRefinementPrompt({
  query,
  results = [],
  selectedOptions = [],
  onSelectOption,
}) {
  const fork = useMemo(() => detectFork(query), [query]);

  if (!query || selectedOptions.length > 0 || !fork) {
    return null;
  }

  return (
    <section
      style={{
        margin: "0 0 14px",
        padding: "14px 16px",
        borderRadius: 18,
        background: "#111",
        color: "#fff",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          marginBottom: 8,
          color: "rgba(255,255,255,0.82)",
        }}
      >
        {fork.question}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 18,
          fontWeight: 900,
        }}
      >
        <button
          type="button"
          onClick={() => onSelectOption?.(fork.left)}
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: 18,
            fontWeight: 900,
            padding: "4px 6px",
          }}
        >
          {fork.left.label}
        </button>

        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          or
        </span>

        <button
          type="button"
          onClick={() => onSelectOption?.(fork.right)}
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: 18,
            fontWeight: 900,
            padding: "4px 6px",
          }}
        >
          {fork.right.label}
        </button>
      </div>
    </section>
  );
}