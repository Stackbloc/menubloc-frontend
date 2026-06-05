import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchCompareItems } from "../lib/api.js";
import CompareItemsModal from "../components/menu/CompareItemsModal.jsx";

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const baseId      = searchParams.get("base");
  const candidateId = searchParams.get("candidate");
  const lat  = searchParams.get("lat")  ? Number(searchParams.get("lat"))  : null;
  const lng  = searchParams.get("lng")  ? Number(searchParams.get("lng"))  : null;

  const [comparison, setComparison] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!baseId || !candidateId) {
      setError("Missing item IDs");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCompareItems(Number(baseId), Number(candidateId), lat, lng, { skipEligibilityCheck: false })
      .then((data) => {
        if (!cancelled) { setComparison(data); setLoading(false); }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Could not load comparison");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  // lat/lng intentionally excluded — re-fetching on coord change is unnecessary
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId, candidateId]);

  if (!baseId || !candidateId) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0B0F0C", color: "#9CA3AF", gap: 16, padding: 24,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          This comparison is no longer available.
        </div>
        <button
          onClick={() => navigate("/search")}
          style={{
            padding: "10px 22px", borderRadius: 999,
            background: "#22C55E", color: "#0B0F0C",
            border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14,
          }}
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "rgba(14,22,18,0.92)" }}>
      <CompareItemsModal
        open
        loading={loading}
        error={error ? "This comparison is no longer available." : null}
        comparison={comparison}
        onClose={() => {
          if (window.history.length > 1) navigate(-1);
          else navigate("/search", { replace: true });
        }}
        onViewBase={() => {
          if (baseId) navigate(`/menu-items/${baseId}?from=search`);
        }}
        onSwap={(candidateItem) => {
          const id = candidateItem?.id;
          if (id) navigate(`/menu-items/${id}?from=search`);
        }}
        baseLabel="Base Item"
      />
    </div>
  );
}
