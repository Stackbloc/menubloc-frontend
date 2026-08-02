import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import PlanComparisonTable from "../../../components/PlanComparisonTable.jsx";
import { getSdChartPreview } from "../../../lib/ownerApi.js";

const AUDIENCES = [
  { id: "restaurant", label: "Restaurant" },
  { id: "food_truck", label: "Food truck" },
];

export default function SubscriptionDesignerPreview() {
  const [audience, setAudience] = useState("restaurant");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    getSdChartPreview({ audience })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [audience]);

  return (
    <OwnerLayout
      title="Comparison chart preview"
      actions={
        <Link to="/owner/subscription-designer" style={{ color: OWNER_COLORS.accent, fontWeight: 600 }}>
          ← Plans
        </Link>
      }
    >
      <PageCard style={{ padding: 20 }}>
        <SectionTitle
          title="Saved configuration preview"
          subtitle="Same layout as the public chart. Draft/publish workflow is deferred — this shows the current saved config."
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {AUDIENCES.map((option) => {
            const active = audience === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAudience(option.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: active ? `1px solid ${OWNER_COLORS.accent}` : "1px solid #d0d5dd",
                  background: active ? "rgba(31,78,61,0.08)" : "#fff",
                  color: active ? OWNER_COLORS.accent : "#344054",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
        {data ? <PlanComparisonTable data={data} audience={audience} /> : <div>Loading preview…</div>}
      </PageCard>
    </OwnerLayout>
  );
}
