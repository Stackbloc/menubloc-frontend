import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  getVenueSession,
  loginVenue,
  logoutVenue,
  switchVenue,
} from "../lib/venueApi.js";

const VenueContext = createContext(null);

export function VenueProvider({ children }) {
  const [operator, setOperator] = useState(null);
  const [venue, setVenue] = useState(null);
  const [venues, setVenues] = useState([]);
  const [venueRole, setVenueRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((me) => {
    setOperator(me?.operator || null);
    setVenue(me?.venue || null);
    setVenues(Array.isArray(me?.venues) ? me.venues : []);
    setVenueRole(me?.venue_role || null);
    return me;
  }, []);

  const clearSession = useCallback(() => {
    setOperator(null);
    setVenue(null);
    setVenues([]);
    setVenueRole(null);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const me = await getVenueSession();
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
      const result = await loginVenue(email, password);
      await loadMe().catch(() => applySession(result));
      return result;
    },
    [applySession, loadMe]
  );

  const logout = useCallback(async () => {
    await logoutVenue().catch(() => {});
    clearSession();
  }, [clearSession]);

  const selectVenue = useCallback(
    async (venueId) => {
      await switchVenue(venueId);
      return loadMe();
    },
    [loadMe]
  );

  const value = {
    operator,
    venue,
    venues,
    venueRole,
    loading,
    isAuthenticated: Boolean(operator && venue),
    login,
    logout,
    selectVenue,
    refresh: loadMe,
  };

  return <VenueContext.Provider value={value}>{children}</VenueContext.Provider>;
}

export function useVenue() {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error("useVenue must be used within VenueProvider");
  return ctx;
}
