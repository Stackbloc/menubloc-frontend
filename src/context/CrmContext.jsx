import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCrmSession, loginCrm, logoutCrm } from "../lib/crmApi.js";

const CrmContext = createContext(null);

export function CrmProvider({ children }) {
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setOperator(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const json = await getCrmSession();
      setOperator(json.operator || null);
      return json;
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        clearSession();
      }
      throw error;
    }
  }, [clearSession]);

  useEffect(() => {
    refreshSession().catch(() => {}).finally(() => setLoading(false));
  }, [refreshSession]);

  const login = useCallback(async (email, password) => {
    await loginCrm(email, password);
    return refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await logoutCrm().catch(() => {});
    clearSession();
  }, [clearSession]);

  return (
    <CrmContext.Provider
      value={{
        operator,
        loading,
        isAuthenticated: !!operator,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
