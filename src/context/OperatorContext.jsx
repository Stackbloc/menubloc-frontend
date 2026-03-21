/**
 * src/context/OperatorContext.jsx
 *
 * Operator session state. Restores from the backend session cookie on mount.
 * Provides: operator, restaurants, selectedRestaurant, isAuthenticated, loading
 * Actions:  login, logout, register, setSelectedRestaurant, refreshRestaurants
 *
 * login() and register() return { operator, restaurants } so callers can
 * immediately decide where to redirect (claim flow vs dashboard).
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

const OperatorContext = createContext(null);

export function OperatorProvider({ children }) {
  const [operator, setOperator]                     = useState(null);
  const [restaurants, setRestaurants]               = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading]                       = useState(true);

  async function loadMe() {
    const me = await apiFetch("/operator/auth/me");
    setOperator(me.operator);
    setRestaurants(me.restaurants || []);
    if (me.restaurants?.length) setSelectedRestaurant(me.restaurants[0]);
    return me;
  }

  // Restore session on mount
  useEffect(() => {
    loadMe().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const refreshRestaurants = useCallback(async () => {
    try {
      const me = await loadMe();
      return me.restaurants || [];
    } catch {
      return [];
    }
  }, []);

  const login = useCallback(async (email, password) => {
    await apiFetch("/operator/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const me = await loadMe();
    return { operator: me.operator, restaurants: me.restaurants || [] };
  }, []);

  const register = useCallback(async (email, password, full_name) => {
    await apiFetch("/operator/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    });
    const me = await loadMe();
    return { operator: me.operator, restaurants: me.restaurants || [] };
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/operator/auth/logout", { method: "POST" }).catch(() => {});
    setOperator(null);
    setRestaurants([]);
    setSelectedRestaurant(null);
  }, []);

  const value = {
    operator,
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    isAuthenticated: !!operator,
    loading,
    login,
    logout,
    register,
    refreshRestaurants,
  };

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const ctx = useContext(OperatorContext);
  if (!ctx) throw new Error("useOperator must be used within OperatorProvider");
  return ctx;
}
