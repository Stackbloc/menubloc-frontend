/**
 * Sticker QR admin panel — /r/DOOR-... system only (not legacy /qr/:token).
 */

import React, { useCallback, useEffect, useState } from "react";

const btn = {
  height: 30,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #d7c5b8",
  background: "#fff",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  marginRight: 6,
  marginBottom: 6,
};
const btnPrimary = { ...btn, background: "#9f3a22", color: "#fff", border: "none" };
const btnDanger = { ...btn, color: "#b42318", borderColor: "#fecdca", background: "#fff5f5" };

function formatTs(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function QrStickerPanel({
  title = "QR Stickers",
  subtitle = "Physical stickers use stable Menuply URLs (/r/DOOR-...). Legacy /qr/:token codes are separate.",
  restaurantId,
  restaurantName,
  loadQrCodes,
  createDoorQr,
  previewUrl,
  downloadUrl,
  deactivateQr,
  replaceQr,
  canMutate = true,
  showRestaurantColumn = false,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewCode, setPreviewCode] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!restaurantId && !loadQrCodes) return;
    setLoading(true);
    setError("");
    try {
      const data = await loadQrCodes();
      setRows(data?.qr_codes || []);
    } catch (e) {
      setError(e?.message || "Failed to load QR stickers");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [loadQrCodes, restaurantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!previewCode) {
      setPreviewBlobUrl(null);
      return undefined;
    }
    let objectUrl = null;
    let cancelled = false;
    setPreviewLoading(true);
    fetch(previewUrl(previewCode), { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Preview failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load sticker preview");
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewCode, previewUrl]);

  async function handleCreateDoor() {
    setMessage("");
    setError("");
    try {
      const data = await createDoorQr();
      setMessage(
        data?.sticker?.created
          ? `Created door QR ${data.sticker.qr_code}`
          : `Door QR already active: ${data?.sticker?.qr_code || "—"}`
      );
      await refresh();
    } catch (e) {
      setError(e?.message || "Could not create door QR");
    }
  }

  async function copyUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Scan URL copied");
    } catch {
      setError("Could not copy URL");
    }
  }

  const hasActiveDoor = rows.some((r) => r.qr_type === "DOOR" && r.status === "active");

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        {restaurantName ? (
          <div style={{ marginTop: 6, fontWeight: 700 }}>{restaurantName}</div>
        ) : null}
        <p style={{ margin: "8px 0 0", color: "#667085", fontSize: 13, lineHeight: 1.5 }}>{subtitle}</p>
      </div>

      {error ? (
        <div style={{ padding: 12, borderRadius: 10, background: "#fff1ef", color: "#8b2e1a", marginBottom: 12 }}>
          {error}
        </div>
      ) : null}
      {message ? (
        <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf3", color: "#166534", marginBottom: 12 }}>
          {message}
        </div>
      ) : null}

      <div style={{ marginBottom: 16 }}>
        {!hasActiveDoor ? (
          <button type="button" style={btnPrimary} onClick={handleCreateDoor}>
            Create Door QR
          </button>
        ) : (
          <span style={{ fontSize: 13, color: "#667085" }}>Active door QR present</span>
        )}
      </div>

      {loading ? (
        <p style={{ color: "#667085" }}>Loading sticker QR records…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#667085" }}>No sticker QR codes yet. Create a Door QR to generate a printable /r/ URL.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ead9ce" }}>
                {showRestaurantColumn ? <th style={th}>Restaurant</th> : null}
                <th style={th}>Type</th>
                <th style={th}>QR ID</th>
                <th style={th}>Scan URL</th>
                <th style={th}>Destination</th>
                <th style={th}>Status</th>
                <th style={th}>Scans</th>
                <th style={th}>Last scan</th>
                <th style={th}>Printer order</th>
                <th style={th}>Tracking</th>
                <th style={th}>Created</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || row.qr_code} style={{ borderBottom: "1px solid #f2f4f8" }}>
                  {showRestaurantColumn ? (
                    <td style={td}>
                      {row.restaurant_name || "—"}
                      <div style={{ color: "#98a2b3", fontSize: 11 }}>#{row.restaurant_id}</div>
                    </td>
                  ) : null}
                  <td style={td}>{row.qr_type}</td>
                  <td style={td}>
                    <code>{row.qr_code}</code>
                  </td>
                  <td style={td}>
                    <a href={row.public_url} target="_blank" rel="noreferrer">
                      {row.public_url}
                    </a>
                  </td>
                  <td style={td}>
                    <div>{row.destination_path || "—"}</div>
                    <div style={{ fontSize: 11, color: "#98a2b3" }}>{row.resolved_destination_url}</div>
                  </td>
                  <td style={td}>{row.status}</td>
                  <td style={td}>{row.scan_count ?? 0}</td>
                  <td style={td}>{formatTs(row.last_scanned_at)}</td>
                  <td style={td}>{row.printer_order_id || "—"}</td>
                  <td style={td}>{row.tracking_number || "—"}</td>
                  <td style={td}>{formatTs(row.created_at)}</td>
                  <td style={td}>
                    <button type="button" style={btn} onClick={() => copyUrl(row.public_url)}>
                      Copy Scan URL
                    </button>
                    <button
                      type="button"
                      style={btn}
                      onClick={() => setPreviewCode(previewCode === row.qr_code ? null : row.qr_code)}
                    >
                      Preview Sticker
                    </button>
                    <button
                      type="button"
                      style={btn}
                      onClick={async () => {
                        try {
                          const res = await fetch(downloadUrl(row.qr_code), { credentials: "include" });
                          if (!res.ok) throw new Error("Download failed");
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${row.qr_code}-sticker.svg`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {
                          setError("Could not download sticker asset");
                        }
                      }}
                    >
                      Download Sticker Asset
                    </button>
                    {canMutate ? (
                      <>
                        <button
                          type="button"
                          style={btnDanger}
                          disabled={row.status !== "active"}
                          onClick={async () => {
                            if (!window.confirm(`Deactivate ${row.qr_code}?`)) return;
                            await deactivateQr(row.qr_code);
                            setMessage(`Deactivated ${row.qr_code}`);
                            refresh();
                          }}
                        >
                          Deactivate
                        </button>
                        <button
                          type="button"
                          style={btn}
                          disabled={row.status !== "active"}
                          onClick={async () => {
                            if (!window.confirm(`Replace ${row.qr_code}? Old sticker scans will show replaced.`)) return;
                            const data = await replaceQr(row.qr_code);
                            setMessage(`Replaced with ${data?.sticker?.qr_code || "new code"}`);
                            refresh();
                          }}
                        >
                          Replace
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewCode && restaurantId ? (
        <div style={{ marginTop: 24, padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #ead9ce" }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Sticker preview — {previewCode}</div>
          {previewLoading ? (
            <p style={{ color: "#667085" }}>Loading preview…</p>
          ) : previewBlobUrl ? (
            <img
              src={previewBlobUrl}
              alt={`Sticker preview ${previewCode}`}
              style={{ maxWidth: "100%", height: "auto", border: "1px solid #e4e9f0" }}
            />
          ) : (
            <p style={{ color: "#667085" }}>Preview unavailable.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

const th = { padding: "8px 10px", fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" };
const td = { padding: "12px 10px", verticalAlign: "top" };
