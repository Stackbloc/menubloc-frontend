import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCrmClusterPreview } from "../../lib/crmApi.js";
import { CRM_COLORS, CrmPage, ErrorBanner } from "./CrmShared.jsx";

const cardStyle = {
  background: "#fff",
  border: `1px solid ${CRM_COLORS.line}`,
  borderRadius: 14,
  padding: 16,
};

export default function CrmClusterPreviewPage() {
  const { id } = useParams();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const tag = document.querySelector('meta[name="robots"]') || document.createElement("meta");
    const hadTag = Boolean(tag.parentNode);
    const previous = tag.getAttribute("content");
    tag.setAttribute("name", "robots");
    tag.setAttribute("content", "noindex,nofollow");
    if (!tag.parentNode) document.head.appendChild(tag);
    return () => {
      if (hadTag) {
        if (previous) tag.setAttribute("content", previous);
        else tag.removeAttribute("content");
      } else if (tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    };
  }, []);

  useEffect(() => {
    getCrmClusterPreview(id)
      .then((json) => setPreview(json))
      .catch((err) => setError(err.message || "Unable to load preview."));
  }, [id]);

  return (
    <CrmPage
      title="Cluster Preview (Admin)"
      actions={
        <Link
          to={`/clusters/admin/${id}`}
          style={{
            border: `1px solid ${CRM_COLORS.line}`,
            borderRadius: 10,
            padding: "8px 12px",
            color: CRM_COLORS.ink,
            textDecoration: "none",
            fontWeight: 700,
            background: "#fff",
          }}
        >
          Back to cluster
        </Link>
      }
    >
      <ErrorBanner message={error} />
      {preview?.cluster ? (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{preview.cluster.area_name || preview.cluster.name}</div>
            <div style={{ marginTop: 4, color: CRM_COLORS.muted }}>
              {preview.cluster.type} • {preview.cluster.city}, {preview.cluster.state}
            </div>
            <div style={{ marginTop: 8, color: CRM_COLORS.muted, fontSize: 13 }}>
              Preview mode only. This page is non-indexable and requires CRM auth.
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Counts</div>
            <div style={{ color: CRM_COLORS.ink }}>
              {preview.stats?.restaurant_count || 0} restaurants • {preview.stats?.published_menus || 0} menu-ready
              • {preview.stats?.menu_items || 0} menu items
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Sample restaurants</div>
            {(preview.restaurants || []).slice(0, 12).map((row) => (
              <div key={row.restaurant_id} style={{ padding: "6px 0", borderBottom: `1px solid ${CRM_COLORS.line}` }}>
                {row.restaurant_name}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ color: CRM_COLORS.muted }}>Loading preview…</div>
      )}
    </CrmPage>
  );
}
