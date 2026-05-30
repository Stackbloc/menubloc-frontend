import React, { useEffect, useState } from "react";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import QrStickerPanel from "../../components/qr/QrStickerPanel.jsx";
import {
  validateOwnerQrStickerActivation,
  activateOwnerQrSticker,
  deactivateOwnerQrSticker,
  downloadOwnerQrStickerUrl,
  generateOwnerQrStickerBatch,
  getOwnerQrStickers,
  getOwnerQrStickersForRestaurant,
  previewOwnerQrStickerUrl,
  replaceOwnerQrSticker,
} from "../../lib/ownerApi.js";

export default function OwnerQrStickers() {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("unclaimed");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [batchQty, setBatchQty] = useState("10");
  const [batchQrType, setBatchQrType] = useState("DOOR");
  const [batchMsg, setBatchMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getOwnerQrStickers({ q: filter, status: statusFilter || undefined })
      .then((data) => setAllRows(data?.qr_codes || []))
      .catch(() => setError("QR sticker data is temporarily unavailable."))
      .finally(() => setLoading(false));
  }, [filter, statusFilter]);

  const selectedId = selectedRestaurantId ? Number(selectedRestaurantId) : null;

  async function handleGenerateBatch() {
    setBatchMsg("");
    setError("");
    try {
      const data = await generateOwnerQrStickerBatch({
        qr_type: batchQrType,
        quantity: Number(batchQty) || 10,
      });
      setBatchMsg(`Created batch ${data?.batch?.print_batch_id} (${data?.batch?.quantity} stickers)`);
      const refreshed = await getOwnerQrStickers({ status: "unclaimed" });
      setAllRows(refreshed?.qr_codes || []);
      setStatusFilter("unclaimed");
    } catch (e) {
      setError(e?.message || "Batch generation failed");
    }
  }

  const detailPanel = selectedId ? (
    <QrStickerPanel
      title="Activate & manage stickers"
      restaurantId={selectedId}
      restaurantName={allRows.find((r) => r.restaurant_id === selectedId)?.restaurant_name}
      allowOperatorOverride
      canMutate
      loadQrCodes={() => getOwnerQrStickersForRestaurant(selectedId)}
      validateActivation={(body) => validateOwnerQrStickerActivation(selectedId, body)}
      activateSticker={(body) => activateOwnerQrSticker(selectedId, body)}
      previewUrl={(code) => previewOwnerQrStickerUrl(selectedId, code)}
      downloadUrl={(code) => downloadOwnerQrStickerUrl(selectedId, code)}
      deactivateQr={(code) => deactivateOwnerQrSticker(selectedId, code)}
      replaceQr={(code) => replaceOwnerQrSticker(selectedId, code)}
    />
  ) : null;

  return (
    <OwnerLayout
      title="QR Stickers"
      actions={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search QR ID"
            style={inputStyle}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
            <option value="">All statuses</option>
            <option value="unclaimed">Unclaimed inventory</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      }
    >
      {error ? <div style={errStyle}>{error}</div> : null}
      {batchMsg ? <div style={okStyle}>{batchMsg}</div> : null}

      <PageCard style={{ padding: 22, marginBottom: 18 }}>
        <SectionTitle
          title="Generate unclaimed inventory"
          subtitle="Stickers print without a restaurant link. Restaurants activate with QR ID + PIN after delivery."
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={batchQrType} onChange={(e) => setBatchQrType(e.target.value)} style={inputStyle}>
            <option value="DOOR">DOOR — storefront</option>
            <option value="FOOD_TRUCK">FOOD_TRUCK — vehicle</option>
          </select>
          <input
            type="number"
            min={1}
            max={500}
            value={batchQty}
            onChange={(e) => setBatchQty(e.target.value)}
            style={{ ...inputStyle, width: 100 }}
          />
          <button type="button" onClick={handleGenerateBatch} style={btnPrimary}>
            Generate batch
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#667085", marginTop: 12 }}>
          Batch API returns activation PINs in the response (print manifest only — not shown in public lists).
        </p>
      </PageCard>

      <PageCard style={{ padding: 22, marginBottom: 18 }}>
        <SectionTitle title="Inventory & active stickers" />
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : allRows.length === 0 ? (
          <EmptyState>No matching QR records.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ead9ce", textAlign: "left" }}>
                  {["QR ID", "Status", "Restaurant", "Batch", "Scans", ""].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", fontSize: 11, color: "#667085" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRows.map((row) => (
                  <tr key={row.id || row.qr_code} style={{ borderBottom: "1px solid #f2f4f8" }}>
                    <td style={{ padding: "10px" }}>
                      <code>{row.qr_code}</code>
                    </td>
                    <td style={{ padding: "10px" }}>{row.status}</td>
                    <td style={{ padding: "10px" }}>
                      {row.restaurant_name || (row.restaurant_id ? `#${row.restaurant_id}` : "—")}
                    </td>
                    <td style={{ padding: "10px" }}>{row.print_batch_id || "—"}</td>
                    <td style={{ padding: "10px" }}>{row.scan_count ?? 0}</td>
                    <td style={{ padding: "10px" }}>
                      {row.restaurant_id ? (
                        <button type="button" style={linkBtn} onClick={() => setSelectedRestaurantId(String(row.restaurant_id))}>
                          Manage
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      <PageCard style={{ padding: 22 }}>
        <SectionTitle title="Activate for restaurant" subtitle="Enter restaurant ID to activate a delivered sticker." />
        <input
          type="number"
          value={selectedRestaurantId}
          onChange={(e) => setSelectedRestaurantId(e.target.value)}
          placeholder="Restaurant ID"
          style={{ ...inputStyle, marginBottom: 16 }}
        />
        {detailPanel || <EmptyState>Enter a restaurant ID to activate or manage sticker QRs.</EmptyState>}
      </PageCard>
    </OwnerLayout>
  );
}

const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8" };
const btnPrimary = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#9f3a22",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
const linkBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #d7c5b8",
  background: "#fff",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};
const errStyle = { marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" };
const okStyle = { marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#ecfdf3", color: "#166534" };
