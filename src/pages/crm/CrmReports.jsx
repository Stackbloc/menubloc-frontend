import React, { useEffect, useState } from "react";
import {
  getCrmConversionsReport,
  getCrmFollowupsReport,
  getCrmPipelineReport,
  getCrmSourcesReport,
} from "../../lib/crmApi.js";
import { CrmCard, CrmPage, DataTable, ErrorBanner } from "./CrmShared.jsx";

export default function CrmReports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getCrmPipelineReport(),
      getCrmSourcesReport(),
      getCrmConversionsReport(),
      getCrmFollowupsReport(),
    ])
      .then(([pipeline, sources, conversions, followups]) => setData({ pipeline, sources, conversions, followups }))
      .catch((err) => setError(err.message || "Unable to load CRM reports"));
  }, []);

  return (
    <CrmPage title="CRM Reports">
      <ErrorBanner message={error} />

      <div style={{ display: "grid", gap: 18 }}>
        <CrmCard title="Pipeline Report">
          <DataTable
            rows={data?.pipeline?.rows || []}
            columns={[
              { key: "pipeline_stage", label: "Stage" },
              { key: "lead_count", label: "Leads" },
              { key: "won_count", label: "Won" },
              { key: "lost_count", label: "Lost" },
            ]}
            emptyLabel="No pipeline data yet."
          />
        </CrmCard>

        <CrmCard title="Source Performance">
          <DataTable
            rows={data?.sources?.rows || []}
            columns={[
              { key: "source", label: "Source" },
              { key: "lead_count", label: "Leads" },
              { key: "won_count", label: "Won" },
              { key: "lost_count", label: "Lost" },
            ]}
            emptyLabel="No source data yet."
          />
        </CrmCard>

        <CrmCard title="Conversions By Source">
          <DataTable
            rows={data?.conversions?.by_source || []}
            columns={[
              { key: "source", label: "Source" },
              { key: "converted_count", label: "Converted" },
              { key: "total_count", label: "Total leads" },
            ]}
            emptyLabel="No conversion source data yet."
          />
        </CrmCard>

        <CrmCard title="Conversions By Market">
          <DataTable
            rows={data?.conversions?.by_market || []}
            columns={[
              { key: "city", label: "City" },
              { key: "state", label: "State" },
              { key: "converted_count", label: "Converted" },
              { key: "total_count", label: "Total leads" },
            ]}
            emptyLabel="No conversion market data yet."
          />
        </CrmCard>

        <CrmCard title="Follow-Up Summary" subtitle={`Linked leads: ${data?.conversions?.linkage?.linked_leads || 0} · Unlinked leads: ${data?.conversions?.linkage?.unlinked_leads || 0}`}>
          <DataTable
            rows={data?.followups?.queue || []}
            keyField="lead_id"
            columns={[
              { key: "lead_name", label: "Lead" },
              { key: "restaurant_name", label: "Restaurant" },
              { key: "priority", label: "Priority" },
              { key: "next_follow_up_at", label: "Next follow-up" },
            ]}
            emptyLabel="No scheduled follow-ups."
          />
        </CrmCard>
      </div>
    </CrmPage>
  );
}
