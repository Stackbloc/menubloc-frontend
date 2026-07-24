import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { getSdChangeLog } from "../../../lib/ownerApi.js";

export default function SubscriptionDesignerAudit() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSdChangeLog({ limit: 200 })
      .then((res) => setEntries(res.entries || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <OwnerLayout
      title="Subscription Designer change log"
      actions={
        <Link to="/owner/subscription-designer" style={{ color: OWNER_COLORS.accent, fontWeight: 600 }}>
          ← Plans
        </Link>
      }
    >
      <PageCard style={{ padding: 20 }}>
        <SectionTitle title="Audit trail" subtitle="Read-only. Entries cannot be edited from the UI." />
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
        {!entries.length ? (
          <EmptyState>No changes recorded yet.</EmptyState>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
                <th style={th}>When</th>
                <th style={th}>Actor</th>
                <th style={th}>Type</th>
                <th style={th}>Entity</th>
                <th style={th}>Field</th>
                <th style={th}>From</th>
                <th style={th}>To</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}` }}>
                  <td style={td}>{e.created_at ? new Date(e.created_at).toLocaleString() : "—"}</td>
                  <td style={td}>{e.actor_email || e.actor_operator_id || "—"}</td>
                  <td style={td}>{e.change_type}</td>
                  <td style={td}>
                    {e.entity_type} {e.entity_key || e.entity_id || ""}
                  </td>
                  <td style={td}>{e.field_name || "—"}</td>
                  <td style={td}>{truncate(e.previous_value)}</td>
                  <td style={td}>{truncate(e.new_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
    </OwnerLayout>
  );
}

function truncate(v) {
  if (v == null) return "—";
  const s = String(v);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}

const th = { padding: "8px 6px", fontWeight: 600 };
const td = { padding: "8px 6px", verticalAlign: "top", color: OWNER_COLORS.ink };
