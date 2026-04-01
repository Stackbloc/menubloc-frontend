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
  signupConsumer,
  logoutConsumer,
} from "../lib/consumerApi.js";

const ConsumerContext = createContext(null);

export function ConsumerProvider({ children }) {
  const [consumer, setConsumer] = useState(null);   // { id, email, email_verified }
  const [profile, setProfile] = useState(null);     // { display_name, first_name, ... }
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setConsumer(data?.consumer || null);
    setProfile(data?.profile || null);
  }, []);

  const clearSession = useCallback(() => {
    setConsumer(null);
    setProfile(null);
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

  const signup = useCallback(async (signupData) => {
    await signupConsumer(signupData);
    const data = await loadMe();
    return data;
  }, [loadMe]);

  const logout = useCallback(async () => {
    await logoutConsumer().catch(() => {});
    clearSession();
  }, [clearSession]);

  const value = {
    consumer,
    profile,
    isAuthenticated: !!consumer,
    loading,
    login,
    signup,
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
