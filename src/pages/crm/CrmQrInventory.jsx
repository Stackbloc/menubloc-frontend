import React, { useCallback, useEffect, useState } from "react";
import CrmLayout, { CRM_COLORS, CrmCard } from "./CrmShared.jsx";
import {
  downloadQrBatchCsvUrl,
  downloadQrBatchReportUrl,
  generateQrInventoryBatch,
  getQrInventory,
  markQrInventoryDamaged,
  markQrInventoryReplaced,
  validateQrInventoryCode,
} from "../../lib/crmApi.js";

export default function CrmQrInventory() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [batchQty, setBatchQty] = useState("50");
  const [batchType, setBatchType] = useState("DOOR");
  const [batchMsg, setBatchMsg] = useState("");
  const [lastBatchId, setLastBatchId] = useState("");
  const [validateCode, setValidateCode] = useState("");
  const [validateResult, setValidateResult] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getQrInventory({
        status: statusFilter || undefined,
        qr_type: typeFilter || undefined,
        q: search || undefined,
        limit: 200,
      });
      setSummary(data?.summary || null);
      setItems(data?.items || []);
    } catch (e) {
      setError(e?.message || "Unable to load QR inventory");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleGenerateBatch() {
    setBatchMsg("");
    setError("");
    try {
      const data = await generateQrInventoryBatch({
        qr_type: batchType,
        quantity: Number(batchQty) || 10,
      });
      const batchId = data?.batch?.print_batch_id;
      setLastBatchId(batchId || "");
      setBatchMsg(`Created ${data?.batch?.quantity || 0} stickers — batch ${batchId}`);
      await refresh();
    } catch (e) {
      setError(e?.message || "Batch generation failed");
    }
  }

  async function handleValidate() {
    setValidateResult(null);
    try {
      const data = await validateQrInventoryCode(validateCode.trim());
      setValidateResult(data?.validation || null);
    } catch (e) {
      setError(e?.message || "Validation failed");
    }
  }

  const summaryCards = [
    { label: "Unclaimed inventory", value: summary?.unclaimed_inventory ?? "—" },
    {
      label: "Active restaurant stickers",
      value:
        (Number(summary?.active_restaurant_door) || 0) +
        (Number(summary?.active_restaurant_other) || 0),
    },
    { label: "Active food truck stickers", value: summary?.active_food_truck ?? "—" },
    { label: "Damaged / replaced", value: summary?.damaged_or_replaced ?? "—" },
  ];

  return (
    <CrmLayout
      title="QR Inventory"
      actions={
        <div style={{ fontSize: 12, color: CRM_COLORS.muted, maxWidth: 320, lineHeight: 1.5 }}>
          Inventory ships unassigned. Restaurants activate with QR ID + PIN — no manual QR-to-restaurant mapping.
        </div>
      }
    >
      {error ? (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
          {error}
        </div>
      ) : null}
      {batchMsg ? (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "#ecfdf3", color: "#166534" }}>
          {batchMsg}
          {lastBatchId ? (
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={downloadQrBatchCsvUrl(lastBatchId)} style={linkStyle}>
                Download CSV
              </a>
              <a href={downloadQrBatchReportUrl(lastBatchId)} target="_blank" rel="noreferrer" style={linkStyle}>
                Inventory report (print PDF)
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {summaryCards.map((card) => (
          <CrmCard key={card.label}>
            <div style={{ fontSize: 11, color: CRM_COLORS.muted, fontWeight: 700, textTransform: "uppercase" }}>
              {card.label}
            </div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{card.value}</div>
          </CrmCard>
        ))}
      </div>

      <CrmCard title="Generate print batch" subtitle="Creates unclaimed inventory only — never pre-links restaurants.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <select value={batchType} onChange={(e) => setBatchType(e.target.value)} style={inputStyle}>
            <option value="DOOR">DOOR (100)</option>
            <option value="FOOD_TRUCK">FOOD_TRUCK (50)</option>
            <option value="TABLE">TABLE</option>
            <option value="COUNTER">COUNTER</option>
            <option value="BILLBOARD">BILLBOARD (BILL-… reserved)</option>
          </select>
          <input
            type="number"
            min={1}
            max={500}
            value={batchQty}
            onChange={(e) => setBatchQty(e.target.value)}
            style={{ ...inputStyle, width: 90 }}
          />
          <button type="button" onClick={handleGenerateBatch} style={btnPrimary}>
            Generate batch
          </button>
        </div>
      </CrmCard>

      <CrmCard title="Pre-ship validation" subtitle="GET /operator/qr-stickers/validate/:qrCode">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={validateCode}
            onChange={(e) => setValidateCode(e.target.value)}
            placeholder="DOOR-7K42M9"
            style={{ ...inputStyle, minWidth: 200 }}
          />
          <button type="button" onClick={handleValidate} style={btnSecondary}>
            Validate
          </button>
        </div>
        {validateResult ? (
          <pre style={{ marginTop: 12, fontSize: 11, background: "#f8fafc", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {JSON.stringify(validateResult, null, 2)}
          </pre>
        ) : null}
      </CrmCard>

      <CrmCard title="Inventory" subtitle="PIN visible for fulfillment manifests only.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QR ID, batch, restaurant"
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
            <option value="">All statuses</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="active">Active</option>
            <option value="replaced">Replaced</option>
            <option value="damaged">Damaged</option>
            <option value="test">Test</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={inputStyle}>
            <option value="">All types</option>
            <option value="DOOR">DOOR</option>
            <option value="FT">FT</option>
            <option value="BILLBOARD">BILLBOARD</option>
          </select>
          <button type="button" onClick={refresh} style={btnSecondary}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ color: CRM_COLORS.muted }}>Loading…</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${CRM_COLORS.line}` }}>
                  {[
                    "QR ID",
                    "Type",
                    "Status",
                    "PIN",
                    "Batch",
                    "Restaurant",
                    "Activated",
                    "Scans",
                    "Created",
                    "",
                  ].map((h) => (
                    <th key={h} style={{ padding: "8px 6px", color: CRM_COLORS.muted, fontSize: 10 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id || row.qr_code} style={{ borderBottom: `1px solid ${CRM_COLORS.line}` }}>
                    <td style={cell}>
                      <code>{row.qr_code}</code>
                    </td>
                    <td style={cell}>{row.qr_type}</td>
                    <td style={cell}>{row.status}</td>
                    <td style={cell}>{row.activation_pin || "—"}</td>
                    <td style={cell}>{row.print_batch_id || "—"}</td>
                    <td style={cell}>
                      {row.restaurant_name || (row.restaurant_id ? `#${row.restaurant_id}` : "—")}
                    </td>
                    <td style={cell}>{row.activated_at ? new Date(row.activated_at).toLocaleString() : "—"}</td>
                    <td style={cell}>{row.scan_count ?? 0}</td>
                    <td style={cell}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                    <td style={cell}>
                      {row.status === "active" || row.status === "unclaimed" ? (
                        <button
                          type="button"
                          style={btnSmall}
                          onClick={async () => {
                            if (!window.confirm(`Mark ${row.qr_code} as replaced and issue new inventory?`)) return;
                            try {
                              const data = await markQrInventoryReplaced(row.qr_code, { reason: "damaged" });
                              setBatchMsg(
                                `Replaced ${row.qr_code} → ${data?.replacement_inventory?.qr_code} (restaurant must activate new PIN)`
                              );
                              refresh();
                            } catch (e) {
                              setError(e?.message || "Replace failed");
                            }
                          }}
                        >
                          Replace
                        </button>
                      ) : null}
                      {row.status === "unclaimed" ? (
                        <button
                          type="button"
                          style={btnSmall}
                          onClick={async () => {
                            if (!window.confirm(`Mark ${row.qr_code} damaged?`)) return;
                            await markQrInventoryDamaged(row.qr_code);
                            refresh();
                          }}
                        >
                          Damaged
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CrmCard>
    </CrmLayout>
  );
}

const cell = { padding: "10px 6px", verticalAlign: "top" };
const inputStyle = { padding: "10px 12px", borderRadius: 10, border: "1px solid #d9e0ea", fontSize: 13 };
const btnPrimary = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#173f35",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
const btnSecondary = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #d9e0ea",
  background: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
const btnSmall = { ...btnSecondary, padding: "6px 8px", fontSize: 11 };
const linkStyle = { color: "#173f35", fontWeight: 700, fontSize: 12 };
