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
  const [authToast, setAuthToast] = useState("");
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setConsumer(data?.consumer || null);
    setProfile(data?.profile || null);
    setAllergenFilter(data?.allergen_filter || null);
  }, []);

  const clearSession = useCallback(() => {
    setConsumer(null);
    setProfile(null);
    setAllergenFilter(null);
    setAuthToast("");
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const data = await getConsumerSession();
      applySession(data);
      return data;
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

  const loginWithGoogle = useCallback(async (credential) => {
    await loginConsumerWithGoogle(credential);
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
