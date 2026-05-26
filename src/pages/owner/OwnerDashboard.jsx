import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerDashboardSummary } from "../../lib/ownerApi.js";

const CARD_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOwnerDashboardSummary()
      .then(setData)
      .catch(() => setError("Owner dashboard data is temporarily unavailable."));
  }, []);

  const summary = data?.summary || {};

  return (
    <OwnerLayout title="Owner Dashboard">
      {error ? <ErrorBanner message={error} /> : null}

      {/* Platform metrics */}
      <SectionTitle title="Platform Overview" subtitle="Live platform metrics." />
      <div style={CARD_GRID}>
        {[
          ["Total Site Visits", summary.total_site_visits],
          ["Visits Today", summary.visits_today],
          ["Visits Last 7 Days", summary.visits_last_7_days],
          ["Total Searches", summary.total_searches],
          ["Searches Today", summary.searches_today],
          ["New Restaurant Signups", summary.new_restaurant_signups],
          ["Claimed Restaurants", summary.claimed_restaurants],
          ["Active Subscriptions", summary.active_subscriptions],
          ["MRR", formatMoney(summary.current_subscription_revenue_cents)],
          ["Open Support Tickets", summary.support_tickets_open],
          ["Awaiting Response", summary.support_tickets_awaiting_response],
          ["Recent Failed Jobs", summary.recent_failed_jobs ?? "N/A"],
        ].map(([label, value]) => (
          <MetricCard key={label} label={label} value={value} />
        ))}
      </div>

      {/* Menu Upload metrics */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle title="Menu Uploads" subtitle="Ingestion and upload activity across the platform." />
        <div style={CARD_GRID}>
          <MetricCard
            label="Total Uploads"
            value={summary.menu_uploads_total}
            href="/owner/menu-uploads"
          />
          <MetricCard
            label="Uploads Today"
            value={summary.menu_uploads_today}
            href="/owner/menu-uploads?status=today"
          />
          <MetricCard
            label="Pending"
            value={summary.menu_uploads_pending}
            href="/owner/menu-uploads?status=pending"
          />
          <MetricCard
            label="Failed"
            value={summary.menu_uploads_failed}
            href="/owner/menu-uploads?status=failed"
            highlight={Number(summary.menu_uploads_failed) > 0}
          />
          <MetricCard
            label="Needs Review"
            value={summary.menu_uploads_needs_review}
            href="/owner/menu-uploads?status=needs_review"
            highlight={Number(summary.menu_uploads_needs_review) > 0}
          />
          <MetricCard
            label="Published"
            value={summary.menu_uploads_published}
            href="/owner/menu-uploads?status=published"
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginTop: 28 }}>
        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Trends" subtitle="Last 7 days across the platform." />
          <div style={{ display: "grid", gap: 18 }}>
            <MiniSeries title="Visits" rows={data?.trend?.visits || []} valueKey="count" />
            <MiniSeries title="Searches" rows={data?.trend?.searches || []} valueKey="count" />
            <MiniSeries title="Signups" rows={data?.trend?.signups || []} valueKey="count" />
            <MiniSeries title="Revenue" rows={data?.trend?.revenue || []} valueKey="amount_cents" formatter={formatMoney} />
            <MiniSeries title="Support Volume" rows={data?.trend?.support || []} valueKey="count" />
          </div>
        </PageCard>

        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Tracking Coverage" subtitle="Owner views only show data that is actually tracked." />
          {data?.availability ? (
            <div style={{ display: "grid", gap: 10 }}>
              {Object.entries(data.availability).map(([key, available]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, background: "#fff" }}>
                  <span style={{ textTransform: "capitalize" }}>{key.replaceAll("_", " ")}</span>
                  <span style={{ color: available ? "#16794f" : OWNER_COLORS.muted, fontWeight: 700 }}>
                    {available ? "Tracked" : "Not available"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Loading tracking availability.</EmptyState>
          )}
        </PageCard>
      </div>
    </OwnerLayout>
  );
}

function MetricCard({ label, value, href, highlight }) {
  const card = (
    <PageCard
      style={{
        padding: 18,
        cursor: href ? "pointer" : "default",
        border: highlight ? `1px solid ${OWNER_COLORS.accent}` : undefined,
        transition: "box-shadow 0.15s",
      }}
    >
      <div style={{ color: OWNER_COLORS.muted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, letterSpacing: "-0.05em", color: highlight ? OWNER_COLORS.accent : undefined }}>
        {value ?? "N/A"}
      </div>
    </PageCard>
  );

  if (href) {
    return (
      <Link to={href} style={{ textDecoration: "none", display: "block" }}>
        {card}
      </Link>
    );
  }
  return card;
}

function MiniSeries({ title, rows, valueKey, formatter = (value) => value }) {
  if (!rows.length) return <EmptyState>{title} data will appear here as tracking accumulates.</EmptyState>;

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((row) => (
          <div key={`${title}-${row.day}`} style={{ display: "grid", gridTemplateColumns: "92px 1fr auto", gap: 12, alignItems: "center" }}>
            <div style={{ color: OWNER_COLORS.muted, fontSize: 12 }}>{row.day}</div>
            <div style={{ height: 10, borderRadius: 999, background: "#f1e3d8", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, Number(row[valueKey] || 0))}%`, height: "100%", background: OWNER_COLORS.accent }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{formatter(row[valueKey])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
      {message}
    </div>
  );
}

function formatMoney(cents) {
  if (cents == null) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(cents || 0) / 100);
}
