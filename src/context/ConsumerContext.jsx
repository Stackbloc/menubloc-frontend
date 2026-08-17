/**
 * ============================================================
 * Path: menubloc-frontend/src/context/ConsumerContext.jsx
 * Purpose:
 *   Consumer session state. Mirrors OperatorContext pattern.
 *   Restores from backend session cookie on mount.
 *   Provides login, signup, logout, and profile helpers.
 * ============================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getConsumerSession,
  getPreferences,
  getFoodsToAvoid,
  loginConsumer,
  loginConsumerWithApple,
  loginConsumerWithGoogle,
  sendSmsCode as sendConsumerSmsCode,
  sendPhoneChangeCode as sendConsumerPhoneChangeCode,
  signupConsumer,
  logoutConsumer,
  verifySmsCode as verifyConsumerSmsCode,
  verifyPhoneChangeCode as verifyConsumerPhoneChangeCode,
} from "../lib/consumerApi.js";
import {
  clearAllergenExclusionSessionToastMarker,
  hasActiveAllergenExclusions,
  maybeBuildAllergenExclusionSessionToast,
} from "../lib/allergenExclusionSessionToast.js";
import { resetMenuPreferenceSessionForLogin } from "../lib/menuCatalogBrowsePreferences.js";

const ConsumerContext = createContext(null);

export function ConsumerProvider({ children }) {
  const [consumer, setConsumer] = useState(null);   // { id, email, email_verified }
  const [profile, setProfile] = useState(null);     // { display_name, first_name, ... }
  const [allergenFilter, setAllergenFilter] = useState(null);
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [allergenPreferences, setAllergenPreferences] = useState([]);
  const [foodsToAvoid, setFoodsToAvoid] = useState([]);
  const [authToast, setAuthToast] = useState("");
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data, preferences = null, avoidKeys = []) => {
    setConsumer(data?.consumer || null);
    setProfile(data?.profile || null);
    setAllergenFilter(preferences?.allergen_filter || data?.allergen_filter || null);
    setDietaryPreferences(Array.isArray(preferences?.dietary_preferences) ? preferences.dietary_preferences : []);
    setAllergenPreferences(Array.isArray(preferences?.allergen_preferences) ? preferences.allergen_preferences : []);
    setFoodsToAvoid(Array.isArray(avoidKeys) ? avoidKeys : []);
  }, []);

  const clearSession = useCallback(() => {
    setConsumer(null);
    setProfile(null);
    setAllergenFilter(null);
    setDietaryPreferences([]);
    setAllergenPreferences([]);
    setFoodsToAvoid([]);
    setAuthToast("");
    clearAllergenExclusionSessionToastMarker();
  }, []);

  const publishSessionToast = useCallback((data, preferences) => {
    const message = maybeBuildAllergenExclusionSessionToast({
      consumerId: data?.consumer?.id || null,
      profile: data?.profile || null,
      allergenFilter: preferences?.allergen_filter || data?.allergen_filter || null,
      allergenPreferences: preferences?.allergen_preferences || [],
    });
    if (message) setAuthToast(message);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const [data, preferences] = await Promise.all([
        getConsumerSession(),
        getPreferences().catch((err) => {
          if (err?.status === 401) throw err;
          return null;
        }),
      ]);
      const avoidData = await getFoodsToAvoid().catch(() => ({ foods_to_avoid: [] }));
      const avoidKeys = Array.isArray(avoidData?.foods_to_avoid) ? avoidData.foods_to_avoid : [];
      applySession(data, preferences, avoidKeys);
      publishSessionToast(data, preferences);
      return {
        ...data,
        dietary_preferences: preferences?.dietary_preferences || [],
        allergen_preferences: preferences?.allergen_preferences || [],
        allergen_filter: preferences?.allergen_filter || data?.allergen_filter || null,
        foods_to_avoid: avoidKeys,
      };
    } catch (err) {
      if (err?.status === 401) clearSession();
      throw err;
    }
  }, [applySession, clearSession, publishSessionToast]);

  const maybeResetMenuPreferenceSession = useCallback((data, preferences) => {
    const dietEnabled = Array.isArray(preferences?.dietary_preferences)
      && preferences.dietary_preferences.some((row) => row?.is_enabled === true);
    const allergenEnabled = Array.isArray(preferences?.allergen_preferences)
      && preferences.allergen_preferences.some((row) => row?.is_enabled === true);
    if (data?.consumer?.id && (dietEnabled || allergenEnabled)) {
      resetMenuPreferenceSessionForLogin();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadMe()
      .then((data) => {
        if (cancelled || !data?.consumer?.id) return;
        maybeResetMenuPreferenceSession(data, {
          dietary_preferences: data?.dietary_preferences,
          allergen_preferences: data?.allergen_preferences,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadMe, maybeResetMenuPreferenceSession]);

  const login = useCallback(async (email, password) => {
    const payload = await loginConsumer(email, password);
    if (payload?.requires_phone_verification || payload?.code === "phone_verification_required") {
      const error = new Error(payload?.error || "Complete phone verification to continue.");
      error.payload = payload;
      error.status = 202;
      throw error;
    }
    const data = await loadMe();
    maybeResetMenuPreferenceSession(data, {
      dietary_preferences: data?.dietary_preferences,
      allergen_preferences: data?.allergen_preferences,
    });
    return data;
  }, [loadMe, maybeResetMenuPreferenceSession]);

  const loginWithGoogle = useCallback(async (credential, consent) => {
    const payload = await loginConsumerWithGoogle(credential, consent);
    if (payload?.requires_phone_verification || payload?.code === "phone_verification_required") {
      const error = new Error(payload?.error || "Complete phone verification to continue.");
      error.payload = payload;
      error.status = 202;
      throw error;
    }
    const data = await loadMe();
    maybeResetMenuPreferenceSession(data, {
      dietary_preferences: data?.dietary_preferences,
      allergen_preferences: data?.allergen_preferences,
    });
    return data;
  }, [loadMe, maybeResetMenuPreferenceSession]);

  const loginWithApple = useCallback(async (payload) => {
    const result = await loginConsumerWithApple(payload);
    if (result?.requires_phone_verification || result?.code === "phone_verification_required") {
      const error = new Error(result?.error || "Complete phone verification to continue.");
      error.payload = result;
      error.status = 202;
      throw error;
    }
    const data = await loadMe();
    maybeResetMenuPreferenceSession(data, {
      dietary_preferences: data?.dietary_preferences,
      allergen_preferences: data?.allergen_preferences,
    });
    return data;
  }, [loadMe, maybeResetMenuPreferenceSession]);

  const signup = useCallback(async (signupData) => {
    return signupConsumer(signupData);
  }, []);

  const logout = useCallback(async () => {
    await logoutConsumer().catch(() => {});
    clearSession();
  }, [clearSession]);

  const sendSmsCode = useCallback(async (phoneNumber, verificationToken = null) => {
    return sendConsumerSmsCode(phoneNumber, verificationToken);
  }, []);

  const verifySmsCode = useCallback(async (phoneNumber, code, verificationSid = null, verificationToken = null) => {
    await verifyConsumerSmsCode(phoneNumber, code, verificationSid, verificationToken);
    const data = await loadMe();
    maybeResetMenuPreferenceSession(data, {
      dietary_preferences: data?.dietary_preferences,
      allergen_preferences: data?.allergen_preferences,
    });
    if (
      !hasActiveAllergenExclusions(
        data?.allergen_filter || null,
        data?.allergen_preferences || []
      )
    ) {
      setAuthToast("You're signed in ✓");
    }
    return data;
  }, [loadMe, maybeResetMenuPreferenceSession]);

  const sendPhoneChangeCode = useCallback(async (phoneNumber) => {
    return sendConsumerPhoneChangeCode(phoneNumber);
  }, []);

  const verifyPhoneChangeCode = useCallback(async (phoneNumber, code, verificationSid = null) => {
    const verified = await verifyConsumerPhoneChangeCode(phoneNumber, code, verificationSid);
    if (verified?.consumer) {
      applySession(verified);
      return verified;
    }
    return loadMe();
  }, [applySession, loadMe]);

  const clearAuthToast = useCallback(() => {
    setAuthToast("");
  }, []);

  const value = {
    consumer,
    profile,
    allergenFilter,
    dietaryPreferences,
    allergenPreferences,
    foodsToAvoid,
    isAuthenticated: !!consumer,
    loading,
    login,
    loginWithGoogle,
    loginWithApple,
    signup,
    sendSmsCode,
    verifySmsCode,
    sendPhoneChangeCode,
    verifyPhoneChangeCode,
    authToast,
    clearAuthToast,
    logout,
    refreshSession: loadMe,
  };

  return (
    <ConsumerContext.Provider value={value}>
      {children}
    </ConsumerContext.Provider>
  );
}

export function useConsumer() {
  const ctx = useContext(ConsumerContext);
  if (!ctx) throw new Error("useConsumer must be used within ConsumerProvider");
  return ctx;
}
