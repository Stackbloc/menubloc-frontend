/**
 * ============================================================
 * Path: menubloc-frontend/src/context/OperatorContext.jsx
 * File: OperatorContext.jsx
 * Date: 2026-03-23
 * Purpose:
 *   Operator session state for the operator portal.
 *   Restores from the backend session cookie on mount and keeps
 *   login / logout / reset flows on one shared API client.
 * ============================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getOperatorSession,
  loginOperator,
  logoutOperator,
  registerOperator,
  sendOperatorSmsCode,
  verifyOperatorSmsCode,
} from "../lib/operatorApi.js";

const OperatorContext = createContext(null);

export function OperatorProvider({ children }) {
  const [operator, setOperator] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((me) => {
    setOperator(me?.operator || null);
    setSubscription(me?.subscription || null);
    setRestaurants(me?.restaurants || []);
    setSelectedRestaurant((current) => {
      if (!me?.restaurants?.length) return null;
      if (current) {
        const stillSelected = me.restaurants.find((restaurant) => restaurant.id === current.id);
        if (stillSelected) return stillSelected;
      }
      return me.restaurants[0];
    });
    return me;
  }, []);

  const clearSession = useCallback(() => {
    setOperator(null);
    setSubscription(null);
    setRestaurants([]);
    setSelectedRestaurant(null);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const me = await getOperatorSession();
      return applySession(me);
    } catch (error) {
      if (error?.status === 401) {
        clearSession();
      }
      throw error;
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    loadMe()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadMe]);

  const refreshRestaurants = useCallback(async () => {
    try {
      const me = await loadMe();
      return me.restaurants || [];
    } catch {
      return [];
    }
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    await loginOperator(email, password);
    const me = await loadMe();
    return { operator: me.operator, restaurants: me.restaurants || [] };
  }, [loadMe]);

  const register = useCallback(async (email, password, full_name) => {
    await registerOperator(email, password, full_name);
    const me = await loadMe();
    return { operator: me.operator, restaurants: me.restaurants || [] };
  }, [loadMe]);

  const logout = useCallback(async () => {
    await logoutOperator().catch(() => {});
    clearSession();
  }, [clearSession]);

  const sendSmsCode = useCallback(async (phoneNumber) => {
    return sendOperatorSmsCode(phoneNumber);
  }, []);

  const verifySmsCode = useCallback(async (phoneNumber, code) => {
    await verifyOperatorSmsCode(phoneNumber, code);
    const me = await loadMe();
    return { operator: me.operator, restaurants: me.restaurants || [] };
  }, [loadMe]);

  const hasBenefit = useCallback((key) => {
    return subscription?.benefits?.[key]?.is_enabled === true;
  }, [subscription]);

  const value = {
    operator,
    subscription,
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    isAuthenticated: !!operator,
    loading,
    login,
    logout,
    register,
    sendSmsCode,
    verifySmsCode,
    refreshRestaurants,
    refreshSession: loadMe,
    hasBenefit,
  };

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const ctx = useContext(OperatorContext);
  if (!ctx) throw new Error("useOperator must be used within OperatorProvider");
  return ctx;
}
