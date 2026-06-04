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
  loginConsumer,
  loginConsumerWithApple,
  loginConsumerWithGoogle,
  sendSmsCode as sendConsumerSmsCode,
  signupConsumer,
  logoutConsumer,
  verifySmsCode as verifyConsumerSmsCode,
} from "../lib/consumerApi.js";

const ConsumerContext = createContext(null);

export function ConsumerProvider({ children }) {
  const [consumer, setConsumer] = useState(null);   // { id, email, email_verified }
  const [profile, setProfile] = useState(null);     // { display_name, first_name, ... }
  const [allergenFilter, setAllergenFilter] = useState(null);
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [allergenPreferences, setAllergenPreferences] = useState([]);
  const [authToast, setAuthToast] = useState("");
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data, preferences = null) => {
    setConsumer(data?.consumer || null);
    setProfile(data?.profile || null);
    setAllergenFilter(preferences?.allergen_filter || data?.allergen_filter || null);
    setDietaryPreferences(Array.isArray(preferences?.dietary_preferences) ? preferences.dietary_preferences : []);
    setAllergenPreferences(Array.isArray(preferences?.allergen_preferences) ? preferences.allergen_preferences : []);
  }, []);

  const clearSession = useCallback(() => {
    setConsumer(null);
    setProfile(null);
    setAllergenFilter(null);
    setDietaryPreferences([]);
    setAllergenPreferences([]);
    setAuthToast("");
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
      applySession(data, preferences);
      return {
        ...data,
        dietary_preferences: preferences?.dietary_preferences || [],
        allergen_preferences: preferences?.allergen_preferences || [],
        allergen_filter: preferences?.allergen_filter || data?.allergen_filter || null,
      };
    } catch (err) {
      if (err?.status === 401) clearSession();
      throw err;
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    loadMe()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    await loginConsumer(email, password);
    const data = await loadMe();
    return data;
  }, [loadMe]);

  const loginWithGoogle = useCallback(async (credential, consent) => {
    await loginConsumerWithGoogle(credential, consent);
    const data = await loadMe();
    return data;
  }, [loadMe]);

  const loginWithApple = useCallback(async (payload) => {
    await loginConsumerWithApple(payload);
    const data = await loadMe();
    return data;
  }, [loadMe]);

  const signup = useCallback(async (signupData) => {
    await signupConsumer(signupData);
    const data = await loadMe();
    return data;
  }, [loadMe]);

  const logout = useCallback(async () => {
    await logoutConsumer().catch(() => {});
    clearSession();
  }, [clearSession]);

  const sendSmsCode = useCallback(async (phoneNumber) => {
    return sendConsumerSmsCode(phoneNumber);
  }, []);

  const verifySmsCode = useCallback(async (phoneNumber, code) => {
    await verifyConsumerSmsCode(phoneNumber, code);
    const data = await loadMe();
    setAuthToast("You're signed in ✓");
    return data;
  }, [loadMe]);

  const clearAuthToast = useCallback(() => {
    setAuthToast("");
  }, []);

  const value = {
    consumer,
    profile,
    allergenFilter,
    dietaryPreferences,
    allergenPreferences,
    isAuthenticated: !!consumer,
    loading,
    login,
    loginWithGoogle,
    loginWithApple,
    signup,
    sendSmsCode,
    verifySmsCode,
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
