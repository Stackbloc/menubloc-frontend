import React, { useEffect, useState } from "react";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import QrStickerPanel from "../../components/qr/QrStickerPanel.jsx";
import {
  createOwnerDoorQrSticker,
  deactivateOwnerQrSticker,
  downloadOwnerQrStickerUrl,
  getOwnerQrStickers,
  getOwnerQrStickersForRestaurant,
  previewOwnerQrStickerUrl,
  replaceOwnerQrSticker,
} from "../../lib/ownerApi.js";

const API = (import.meta.env.VITE_API_BASE_URL || "https://menubloc-backend-production.up.railway.app").replace(
  /\/$/,
  ""
);

export default function OwnerQrStickers() {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getOwnerQrStickers({ q: filter })
      .then((data) => setAllRows(data?.qr_codes || []))
      .catch(() => setError("QR sticker data is temporarily unavailable."))
      .finally(() => setLoading(false));
  }, [filter]);

  const selectedId = selectedRestaurantId ? Number(selectedRestaurantId) : null;

  const detailPanel = selectedId ? (
    <QrStickerPanel
      title="Restaurant QR Stickers"
      restaurantId={selectedId}
      restaurantName={allRows.find((r) => r.restaurant_id === selectedId)?.restaurant_name}
      showRestaurantColumn={false}
      canMutate
      loadQrCodes={() => getOwnerQrStickersForRestaurant(selectedId)}
      createDoorQr={() => createOwnerDoorQrSticker(selectedId)}
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
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search QR ID or restaurant"
          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", minWidth: 220 }}
        />
      }
    >
      {error ? <div style={errStyle}>{error}</div> : null}

      <PageCard style={{ padding: 22, marginBottom: 18 }}>
        <SectionTitle
          title="Sticker QR registry"
          subtitle="Stable /r/DOOR-... codes for printed stickers. Legacy menu_qr_codes (/qr/:token) are not listed here."
        />
        {loading ? (
          <EmptyState>Loading QR stickers…</EmptyState>
        ) : allRows.length === 0 ? (
          <EmptyState>No sticker QR records yet. They are created on restaurant signup or via backfill.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ead9ce", textAlign: "left" }}>
                  {["Restaurant", "QR ID", "Type", "Status", "Scans", "Last scan", ""].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", fontSize: 11, color: "#667085" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRows.map((row) => (
                  <tr key={`${row.restaurant_id}-${row.qr_code}`} style={{ borderBottom: "1px solid #f2f4f8" }}>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 700 }}>{row.restaurant_name}</div>
                      <div style={{ fontSize: 11, color: "#98a2b3" }}>#{row.restaurant_id}</div>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <code>{row.qr_code}</code>
                    </td>
                    <td style={{ padding: "10px" }}>{row.qr_type}</td>
                    <td style={{ padding: "10px" }}>{row.status}</td>
                    <td style={{ padding: "10px" }}>{row.scan_count ?? 0}</td>
                    <td style={{ padding: "10px" }}>{row.last_scanned_at ? new Date(row.last_scanned_at).toLocaleString() : "—"}</td>
                    <td style={{ padding: "10px" }}>
                      <button
                        type="button"
                        style={linkBtn}
                        onClick={() => setSelectedRestaurantId(String(row.restaurant_id))}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      <PageCard style={{ padding: 22 }}>
        <SectionTitle title="Manage restaurant" subtitle="Select a restaurant to preview artwork and create door QRs." />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            type="number"
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            placeholder="Restaurant ID"
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", width: 160 }}
          />
        </div>
        {detailPanel || <EmptyState>Enter a restaurant ID and manage its sticker QR codes.</EmptyState>}
      </PageCard>

      <p style={{ fontSize: 12, color: "#667085", marginTop: 8 }}>
        API base: {API}/api/owner/qr-stickers — onboarding also returns <code>sticker_qr</code> from POST /owner/profile.
      </p>
    </OwnerLayout>
  );
}

const errStyle = { marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" };
const linkBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #d7c5b8",
  background: "#fff",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};
