import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getOwnerSession, loginOwner, logoutOwner } from "../lib/ownerApi.js";

const OwnerContext = createContext(null);

export function OwnerProvider({ children }) {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setOwner(null);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const json = await getOwnerSession();
      setOwner(json.owner || null);
      return json;
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        clearSession();
      }
      throw error;
    }
  }, [clearSession]);

  useEffect(() => {
    loadMe().catch(() => {}).finally(() => setLoading(false));
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    await loginOwner(email, password);
    return loadMe();
  }, [loadMe]);

  const logout = useCallback(async () => {
    await logoutOwner().catch(() => {});
    clearSession();
  }, [clearSession]);

  const value = {
    owner,
    loading,
    isAuthenticated: !!owner,
    login,
    logout,
    refreshSession: loadMe,
  };

  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>;
}

export function useOwner() {
  const ctx = useContext(OwnerContext);
  if (!ctx) throw new Error("useOwner must be used within OwnerProvider");
  return ctx;
}
