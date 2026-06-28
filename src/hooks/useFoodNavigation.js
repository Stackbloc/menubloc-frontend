import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchFoodNavResolve, recordFoodNavEvent } from "../lib/waiterApi.js";

export const FOOD_NAV_SLICE_ENABLED =
  import.meta.env.VITE_ENABLE_FOOD_NAVIGATION === "1" ||
  import.meta.env.VITE_ENABLE_FOOD_NAVIGATION === "true";

function isPhase1bSliceQuery(query) {
  const q = String(query || "").trim().toLowerCase();
  return q === "chicken" || q === "chix" || q === "salad" || q === "salads";
}

function sliceLabelForQuery(query) {
  const q = String(query || "").trim().toLowerCase();
  if (q === "salad" || q === "salads") return "salads_collapsed";
  return "chicken_ladder";
}

export function useFoodNavigation(intentQuery, options = {}) {
  const enabled = Boolean(options.enabled && FOOD_NAV_SLICE_ENABLED);
  const [navState, setNavState] = useState(null);
  const [drill, setDrill] = useState({ family_id: null, form_id: null });
  const [terminalQuery, setTerminalQuery] = useState(null);
  const [bypassed, setBypassed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sessionStartedRef = useRef(null);
  const decisionsRef = useRef(0);

  const reset = useCallback(() => {
    setDrill({ family_id: null, form_id: null });
    setTerminalQuery(null);
    setNavState(null);
    setError("");
    setBypassed(false);
    decisionsRef.current = 0;
    sessionStartedRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled || !intentQuery) {
      reset();
      return undefined;
    }
    if (!isPhase1bSliceQuery(intentQuery) && !drill.family_id) {
      reset();
      return undefined;
    }

    let alive = true;
    setLoading(true);
    setError("");

    fetchFoodNavResolve(intentQuery, {
      family_id: drill.family_id,
      form_id: drill.form_id,
      decisions: decisionsRef.current,
    })
      .then((payload) => {
        if (!alive) return;
        setNavState(payload);
        if (!sessionStartedRef.current) {
          sessionStartedRef.current = Date.now();
          if (payload.behavior === "guided_nav" || payload.behavior === "exploratory_nav") {
            void recordFoodNavEvent({
              type: "activation",
              query: intentQuery,
              slice: sliceLabelForQuery(intentQuery),
            });
          }
        }
        if (payload.terminal?.search_query) {
          setTerminalQuery(payload.terminal.search_query);
          void recordFoodNavEvent({
            type: "terminal",
            query: intentQuery,
            search_query: payload.terminal.search_query,
            food_id: payload.terminal.food_id || null,
            depth: payload.breadcrumb?.length || 0,
            decisions: decisionsRef.current,
            elapsed_ms: sessionStartedRef.current ? Date.now() - sessionStartedRef.current : null,
            slice: sliceLabelForQuery(intentQuery),
          });
        }
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || "Food navigation failed");
        setNavState(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [enabled, intentQuery, drill.family_id, drill.form_id, reset]);

  const pendingNavigation = useMemo(() => {
    if (!enabled || !navState || bypassed) return false;
    if (terminalQuery) return false;
    return navState.behavior === "guided_nav" || navState.behavior === "exploratory_nav";
  }, [enabled, navState, terminalQuery, bypassed]);

  const selectChoice = useCallback(
    (choice) => {
      if (!choice?.next) return;
      decisionsRef.current += 1;
      const next = choice.next;
      if (next.food_id) {
        fetchFoodNavResolve(intentQuery, {
          food_id: next.food_id,
          family_id: next.family_id,
          form_id: next.form_id,
          decisions: decisionsRef.current,
        }).then((payload) => {
          if (payload.terminal?.search_query) {
            setTerminalQuery(payload.terminal.search_query);
            setNavState(payload);
          }
        });
        return;
      }
      setDrill({
        family_id: next.family_id || drill.family_id,
        form_id: next.form_id || null,
      });
    },
    [intentQuery, drill.family_id]
  );

  const bypass = useCallback(() => {
    void recordFoodNavEvent({ type: "bypass", query: intentQuery, slice: sliceLabelForQuery(intentQuery) });
    setBypassed(true);
    setNavState(null);
    setDrill({ family_id: null, form_id: null });
  }, [intentQuery]);

  const goBack = useCallback(() => {
    if (drill.form_id) {
      setDrill({ family_id: drill.family_id, form_id: null });
      return;
    }
    if (drill.family_id) {
      setDrill({ family_id: null, form_id: null });
    }
  }, [drill.family_id, drill.form_id]);

  return {
    enabled,
    navState,
    pendingNavigation,
    terminalQuery,
    loading,
    error,
    breadcrumb: navState?.breadcrumb || navState?.step?.breadcrumb || [],
    selectChoice,
    bypass,
    goBack,
    reset,
  };
}
