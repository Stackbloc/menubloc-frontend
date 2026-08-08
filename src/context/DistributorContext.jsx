import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  getDistributorSession,
  loginDistributor,
  logoutDistributor,
  switchDistributor,
} from "../lib/distributorApi.js";

const DistributorContext = createContext(null);

export function DistributorProvider({ children }) {
  const [operator, setOperator] = useState(null);
  const [distributor, setDistributor] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [distributorRole, setDistributorRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((me) => {
    setOperator(me?.operator || null);
    setDistributor(me?.distributor || null);
    setMemberships(Array.isArray(me?.memberships) ? me.memberships : []);
    setDistributorRole(me?.distributor_role || null);
    return me;
  }, []);

  const clearSession = useCallback(() => {
    setOperator(null);
    setDistributor(null);
    setMemberships([]);
    setDistributorRole(null);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const me = await getDistributorSession();
      return applySession(me);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
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

  const login = useCallback(
    async (email, password) => {
      const result = await loginDistributor(email, password);
      await loadMe().catch(() => applySession(result));
      return result;
    },
    [applySession, loadMe]
  );

  const logout = useCallback(async () => {
    await logoutDistributor().catch(() => {});
    clearSession();
  }, [clearSession]);

  const selectDistributor = useCallback(
    async (distributorId) => {
      await switchDistributor(distributorId);
      return loadMe();
    },
    [loadMe]
  );

  const value = {
    operator,
    distributor,
    memberships,
    distributorRole,
    loading,
    isAuthenticated: Boolean(operator && distributor),
    login,
    logout,
    selectDistributor,
    refresh: loadMe,
  };

  return (
    <DistributorContext.Provider value={value}>{children}</DistributorContext.Provider>
  );
}

export function useDistributor() {
  const ctx = useContext(DistributorContext);
  if (!ctx) throw new Error("useDistributor must be used within DistributorProvider");
  return ctx;
}
