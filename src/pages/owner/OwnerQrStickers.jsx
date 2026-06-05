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
  searchOwnerRestaurantsForQr,
} from "../../lib/ownerApi.js";

export default function OwnerQrStickers() {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("unclaimed");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [selectedQrCode, setSelectedQrCode] = useState("");
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantResults, setRestaurantResults] = useState([]);
  const [restaurantSearching, setRestaurantSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
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

  useEffect(() => {
    if (restaurantQuery.length < 2) {
      setRestaurantResults([]);
      return;
    }
    setRestaurantSearching(true);
    const timer = setTimeout(() => {
      searchOwnerRestaurantsForQr(restaurantQuery)
        .then((data) => setRestaurantResults(data?.restaurants || []))
        .catch(() => setRestaurantResults([]))
        .finally(() => setRestaurantSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [restaurantQuery]);

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
      restaurantName={selectedRestaurant?.restaurant_name || allRows.find((r) => r.restaurant_id === selectedId)?.restaurant_name}
      allowOperatorOverride
      canMutate
      initialQrCode={selectedQrCode}
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
                      ) : (
                        <button
                          type="button"
                          style={selectedQrCode === row.qr_code ? { ...linkBtn, background: "#fff8f5", borderColor: "#9f3a22", color: "#9f3a22" } : linkBtn}
                          onClick={() => {
                            setSelectedQrCode(row.qr_code);
                            document.getElementById("activate-section")?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          {selectedQrCode === row.qr_code ? "Selected ✓" : "Select"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      <PageCard id="activate-section" style={{ padding: 22 }}>
        <SectionTitle title="Activate for restaurant" subtitle="Select a QR code above, then search for the restaurant to link it to." />

        {selectedQrCode ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#fff8f5", border: "1px solid #e8cfc5" }}>
            <span style={{ fontSize: 12, color: "#667085", fontWeight: 700 }}>QR selected:</span>
            <code style={{ fontWeight: 700 }}>{selectedQrCode}</code>
            <button type="button" style={{ ...linkBtn, marginLeft: "auto" }} onClick={() => setSelectedQrCode("")}>Clear</button>
          </div>
        ) : (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#f9f5f2", color: "#667085", fontSize: 13 }}>
            No QR code selected — click <strong>Select</strong> on an unclaimed row in the inventory table above.
          </div>
        )}

        {selectedRestaurant ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#fff8f5", border: "1px solid #e8cfc5" }}>
            <span style={{ fontSize: 12, color: "#667085", fontWeight: 700 }}>Restaurant:</span>
            <span style={{ fontWeight: 700 }}>{selectedRestaurant.restaurant_name}</span>
            <span style={{ color: "#667085", fontSize: 12 }}>{selectedRestaurant.city}, {selectedRestaurant.state} · ID {selectedRestaurant.id}</span>
            <button type="button" style={{ ...linkBtn, marginLeft: "auto" }} onClick={() => { setSelectedRestaurant(null); setSelectedRestaurantId(""); setRestaurantQuery(""); }}>Change</button>
          </div>
        ) : (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", display: "block", marginBottom: 4 }}>Search restaurant by name</label>
            <input
              value={restaurantQuery}
              onChange={(e) => setRestaurantQuery(e.target.value)}
              placeholder="e.g. Waffle House, Chipotle…"
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
              autoComplete="off"
            />
            {restaurantSearching && (
              <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>Searching…</div>
            )}
            {restaurantResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "#fff", border: "1px solid #d7c5b8", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", marginTop: 2, maxHeight: 260, overflowY: "auto" }}>
                {restaurantResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid #f2f4f8", cursor: "pointer", fontSize: 13 }}
                    onClick={() => {
                      setSelectedRestaurant(r);
                      setSelectedRestaurantId(String(r.id));
                      setRestaurantQuery("");
                      setRestaurantResults([]);
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{r.restaurant_name}</span>
                    <span style={{ color: "#667085", fontSize: 11, marginLeft: 8 }}>{r.city}, {r.state} · ID {r.id}</span>
                  </button>
                ))}
              </div>
            )}
            {restaurantQuery.length >= 2 && !restaurantSearching && restaurantResults.length === 0 && (
              <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>No restaurants found for "{restaurantQuery}"</div>
            )}
          </div>
        )}

        {detailPanel || (
          <EmptyState>
            {!selectedRestaurantId ? "Search for a restaurant above to activate or manage sticker QRs." : "Loading…"}
          </EmptyState>
        )}
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
