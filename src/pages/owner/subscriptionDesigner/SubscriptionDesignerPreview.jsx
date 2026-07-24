import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import PlanComparisonTable from "../../../components/PlanComparisonTable.jsx";
import { getSdChartPreview } from "../../../lib/ownerApi.js";

export default function SubscriptionDesignerPreview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSdChartPreview({ audience: "restaurant" })
      .then((json) => setData(json))
      .catch((err) => setError(err.message));
  }, []);

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
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
        {data ? <PlanComparisonTable data={data} /> : <div>Loading preview…</div>}
      </PageCard>
    </OwnerLayout>
  );
}
