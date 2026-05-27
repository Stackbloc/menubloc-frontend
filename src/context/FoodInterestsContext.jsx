import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useConsumer } from "./ConsumerContext.jsx";
import {
  followFoodInterest as followFoodInterestRequest,
  getFoodInterests,
  getFoodInterestSuggestions,
  unfollowFoodInterest as unfollowFoodInterestRequest,
} from "../lib/consumerApi.js";

const LOCAL_STORAGE_KEY = "menuply.food_interests.v1";

const DEFAULT_TRAITS = Object.freeze([
  { interest_key: "lower_sugar", display_label: "Lower Sugar" },
  { interest_key: "lower_carb", display_label: "Lower Carb" },
  { interest_key: "high_protein", display_label: "High Protein" },
  { interest_key: "low_sodium", display_label: "Low Sodium" },
  { interest_key: "high_fiber", display_label: "High Fiber" },
  { interest_key: "spicy", display_label: "Spicy" },
  { interest_key: "vegetarian", display_label: "Vegetarian" },
  { interest_key: "vegan", display_label: "Vegan" },
  { interest_key: "glp1_friendly", display_label: "GLP-1 Friendly" },
]);

const DEFAULT_NEW_FOR_YOU = Object.freeze([
  { id: "spicy_nearby", title: "New spicy dishes nearby", body: "Fresh spicy finds can show up here." },
  { id: "high_protein_added", title: "High protein options added", body: "New higher-protein picks can show up here." },
  { id: "mediterranean_nearby", title: "Mediterranean dishes near you", body: "Nearby Mediterranean dishes can show up here." },
  { id: "price_drops", title: "Price drops for dishes you are interested in", body: "Future price-change highlights can show up here." },
]);

const FoodInterestsContext = createContext(null);

function slugifyInterestKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function normalizeMenuItemId(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeInterest(input = {}) {
  const interestType = String(input.interest_type || "").trim().toLowerCase();
  const displayLabel = String(input.display_label || "").trim();
  const sourceMenuItemId = normalizeMenuItemId(input.source_menu_item_id);
  let interestKey = String(input.interest_key || "").trim().toLowerCase();

  if (interestType === "dish" && sourceMenuItemId && !interestKey) {
    interestKey = `menu_item_${sourceMenuItemId}`;
  }

  if (!interestKey) interestKey = slugifyInterestKey(displayLabel);

  return {
    interest_type: interestType,
    interest_key: interestKey,
    display_label: displayLabel,
    source_menu_item_id: sourceMenuItemId,
  };
}

function getInterestSignature(interest = {}) {
  const normalized = normalizeInterest(interest);
  return `${normalized.interest_type}:${normalized.interest_key}`;
}

function safeReadLocalInterests() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeInterest).filter((entry) => entry.interest_type && entry.interest_key) : [];
  } catch {
    return [];
  }
}

function writeLocalInterests(interests) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(interests));
  } catch {
    // ignore local storage failures
  }
}

function dedupeInterests(interests) {
  const map = new Map();
  for (const interest of Array.isArray(interests) ? interests : []) {
    const normalized = normalizeInterest(interest);
    if (!normalized.interest_type || !normalized.interest_key) continue;
    map.set(getInterestSignature(normalized), normalized);
  }
  return Array.from(map.values());
}

export function FoodInterestsProvider({ children }) {
  const { isAuthenticated, loading: consumerLoading } = useConsumer();
  const [interests, setInterests] = useState(() => safeReadLocalInterests());
  const [suggestions, setSuggestions] = useState({
    traits: DEFAULT_TRAITS,
    cuisines: [],
    new_for_you: DEFAULT_NEW_FOR_YOU,
  });
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState(() => new Set());
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const [error, setError] = useState("");
  const syncedAnonymousRef = useRef(false);

  useEffect(() => {
    let alive = true;
    getFoodInterestSuggestions()
      .then((data) => {
        if (!alive) return;
        setSuggestions({
          traits: Array.isArray(data?.traits) && data.traits.length ? data.traits : DEFAULT_TRAITS,
          cuisines: Array.isArray(data?.cuisines) ? data.cuisines : [],
          new_for_you: Array.isArray(data?.new_for_you) && data.new_for_you.length ? data.new_for_you : DEFAULT_NEW_FOR_YOU,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (consumerLoading) return;
    let alive = true;

    async function loadInterests() {
      setLoading(true);
      setError("");

      if (!isAuthenticated) {
        syncedAnonymousRef.current = false;
        if (alive) {
          setInterests(safeReadLocalInterests());
          setLoading(false);
        }
        return;
      }

      try {
        const localInterests = safeReadLocalInterests();
        if (localInterests.length > 0 && !syncedAnonymousRef.current) {
          for (const interest of localInterests) {
            await followFoodInterestRequest(interest);
          }
          writeLocalInterests([]);
          syncedAnonymousRef.current = true;
        }

        const data = await getFoodInterests();
        if (!alive) return;
        setInterests(dedupeInterests(data?.interests || []));
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Unable to load food interests.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadInterests();
    return () => {
      alive = false;
    };
  }, [consumerLoading, isAuthenticated]);

  const isFollowing = useCallback(
    (interest) => {
      const signature = getInterestSignature(interest);
      return interests.some((entry) => getInterestSignature(entry) === signature);
    },
    [interests]
  );

  const toggleInterest = useCallback(
    async (interest) => {
      const normalized = normalizeInterest(interest);
      const signature = getInterestSignature(normalized);
      const alreadyFollowing = interests.some((entry) => getInterestSignature(entry) === signature);
      setError("");

      if (!isAuthenticated) {
        const next = alreadyFollowing
          ? interests.filter((entry) => getInterestSignature(entry) !== signature)
          : dedupeInterests([normalized, ...interests]);
        setInterests(next);
        writeLocalInterests(next);
        setAuthPromptVisible(true);
        return { followed: !alreadyFollowing, localOnly: true };
      }

      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.add(signature);
        return next;
      });

      try {
        if (alreadyFollowing) {
          await unfollowFoodInterestRequest(normalized);
          setInterests((prev) => prev.filter((entry) => getInterestSignature(entry) !== signature));
          return { followed: false, localOnly: false };
        }

        const data = await followFoodInterestRequest(normalized);
        const savedInterest = normalizeInterest(data?.interest || normalized);
        setInterests((prev) => dedupeInterests([savedInterest, ...prev]));
        return { followed: true, localOnly: false };
      } catch (err) {
        setError(err.message || "Unable to update food interests.");
        throw err;
      } finally {
        setSavingKeys((prev) => {
          const next = new Set(prev);
          next.delete(signature);
          return next;
        });
      }
    },
    [interests, isAuthenticated]
  );

  const dismissAuthPrompt = useCallback(() => {
    setAuthPromptVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      interests,
      suggestions,
      loading,
      error,
      authPromptVisible,
      isFollowing,
      toggleInterest,
      dismissAuthPrompt,
      isSavingInterest: (interest) => savingKeys.has(getInterestSignature(interest)),
    }),
    [authPromptVisible, error, interests, isFollowing, loading, savingKeys, suggestions, toggleInterest, dismissAuthPrompt]
  );

  return (
    <FoodInterestsContext.Provider value={value}>
      {children}
    </FoodInterestsContext.Provider>
  );
}

export function useFoodInterests() {
  const ctx = useContext(FoodInterestsContext);
  if (!ctx) throw new Error("useFoodInterests must be used within FoodInterestsProvider");
  return ctx;
}
