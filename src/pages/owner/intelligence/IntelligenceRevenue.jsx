import React from "react";
import { EmptyState } from "../OwnerLayout.jsx";
import { usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import {
  ErrorBanner,
  IntelligenceSection,
  LoadingState,
  MetricCard,
  SimpleTable,
  formatCents,
  useIntelligenceData,
} from "./intelligenceShared.jsx";
import { getOwnerIntelligenceRevenue } from "../../../lib/ownerApi.js";

export default function IntelligenceRevenue() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceRevenue, range);

  if (loading) return <LoadingState label="Loading revenue intelligence…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) {
    return <EmptyState>{data?.reason || "Revenue data is not available for this range."}</EmptyState>;
  }

  const s = data.summary || {};

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {data.note ? (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "#fff8ef", color: "#7a4b12", fontSize: 13 }}>
          {data.note}
        </div>
      ) : null}

      <div className="owner-responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 14 }}>
        <MetricCard label="Total Revenue" value={formatCents(s.total_revenue_cents)} />
        <MetricCard label="Booked Revenue" value={formatCents(s.booked_revenue_cents)} />
        <MetricCard label="MRR" value={formatCents(s.mrr_cents)} />
        <MetricCard label="ARR" value={formatCents(s.arr_cents)} />
        <MetricCard label="Failed Payments" value={s.failed_payments} />
        <MetricCard label="Order Revenue" value={data.order_revenue} />
      </div>

      <IntelligenceSection title="Revenue Trend" subtitle="Monthly subscription billing in selected range.">
        <SimpleTable
          rows={data.revenue_trend || []}
          columns={[
            ["Month", "month"],
            ["Amount", "amount_cents", (row) => formatCents(row.amount_cents)],
          ]}
        />
      </IntelligenceSection>
    </div>
  );
}
