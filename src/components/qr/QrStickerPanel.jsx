/**
 * Sticker QR — unclaimed inventory activated with QR ID + PIN (/r/DOOR-... or /r/FOOD_TRUCK-...).
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
  subtitle = "Activate your physical sticker when it arrives. Printed stickers ship unassigned until you enter the QR ID and PIN.",
  restaurantId,
  restaurantName,
  loadQrCodes,
  activateSticker,
  validateActivation,
  previewUrl,
  downloadUrl,
  downloadPngUrl,
  deactivateQr,
  replaceQr,
  canMutate = true,
  isFoodTruck = false,
  allowOperatorOverride = false,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewCode, setPreviewCode] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [qrId, setQrId] = useState("");
  const [activationPin, setActivationPin] = useState("");
  const [validating, setValidating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [routeValidation, setRouteValidation] = useState(null);

  const refresh = useCallback(async () => {
    if (!restaurantId || !loadQrCodes) return;
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

  const primaryQrType = isFoodTruck ? "FOOD_TRUCK" : "DOOR";
  const primaryQrExample = isFoodTruck ? "FOOD_TRUCK-7K42M9" : "DOOR-7K42M9";
  const hasActivePrimary = rows.some((r) => r.qr_type === primaryQrType && r.status === "active");
  const activePrimaryRow = rows.find((r) => r.qr_type === primaryQrType && r.status === "active");

  function activationBody() {
    const body = {
      qr_code: qrId.trim(),
      activation_pin: activationPin.trim(),
    };
    if (allowOperatorOverride) body.allow_operator_override = true;
    return body;
  }

  async function handleValidateRoute(e) {
    e?.preventDefault?.();
    setMessage("");
    setError("");
    setRouteValidation(null);
    if (!validateActivation) {
      setError("Route validation is not available");
      return;
    }
    if (!qrId.trim() || !activationPin.trim()) {
      setError("Enter QR ID and activation PIN first");
      return;
    }
    setValidating(true);
    try {
      const data = await validateActivation(activationBody());
      const validation = data?.validation || data;
      setRouteValidation(validation);
      if (validation?.ok) {
        setMessage(validation.message || "Route validation passed. You can activate now.");
      } else {
        setError(
          validation?.errors?.[0]?.message ||
            validation?.message ||
            "Route validation failed. Activation is blocked."
        );
      }
    } catch (err) {
      const payload = err?.payload;
      const validation = payload?.validation;
      if (validation) setRouteValidation(validation);
      setError(err?.message || payload?.error || "Route validation failed");
    } finally {
      setValidating(false);
    }
  }

  async function handleActivate(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!routeValidation?.ok) {
      setError("Test the scan route before activating. Activation is blocked until validation passes.");
      return;
    }
    setActivating(true);
    try {
      const data = await activateSticker(activationBody());
      setMessage(`Activated ${data?.sticker?.qr_code || qrId}`);
      setQrId("");
      setActivationPin("");
      setRouteValidation(null);
      await refresh();
    } catch (err) {
      const payload = err?.payload;
      setError(err?.message || payload?.error || "Activation failed");
      if (payload?.validation) setRouteValidation(payload.validation);
    } finally {
      setActivating(false);
    }
  }

  function resetValidationOnInput() {
    if (routeValidation) setRouteValidation(null);
  }

  async function copyUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Scan URL copied");
    } catch {
      setError("Could not copy URL");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        {restaurantName ? <div style={{ marginTop: 6, fontWeight: 700 }}>{restaurantName}</div> : null}
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

      {!hasActivePrimary ? (
        <PageCard style={{ marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Activate Sticker</h3>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#667085" }}>
            {isFoodTruck
              ? "Enter the QR ID and PIN on your vehicle sticker. After activation, scans open your Menuply profile with today’s confirmed location (not a fixed address page)."
              : "Enter the QR ID and activation PIN printed on your Menuply door sticker (e.g. DOOR-7K42M9 / PIN: 841226)."}
          </p>
          <form onSubmit={handleActivate} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            <label style={fieldStyle}>
              QR ID
              <input
                value={qrId}
                onChange={(e) => {
                  setQrId(e.target.value);
                  resetValidationOnInput();
                }}
                placeholder={primaryQrExample}
                style={inputStyle}
                required
              />
            </label>
            <label style={fieldStyle}>
              Activation PIN
              <input
                value={activationPin}
                onChange={(e) => {
                  setActivationPin(e.target.value);
                  resetValidationOnInput();
                }}
                placeholder="841226"
                style={inputStyle}
                inputMode="numeric"
                required
              />
            </label>
            {validateActivation ? (
              <button type="button" style={btn} onClick={handleValidateRoute} disabled={validating}>
                {validating ? "Testing route…" : "Test scan route"}
              </button>
            ) : null}
            <button
              type="submit"
              style={{
                ...btnPrimary,
                opacity: routeValidation?.ok ? 1 : 0.55,
                cursor: routeValidation?.ok ? "pointer" : "not-allowed",
              }}
              disabled={activating || !routeValidation?.ok}
            >
              {activating ? "Activating…" : "Activate Sticker"}
            </button>
          </form>
          {routeValidation ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                background: routeValidation.ok ? "#ecfdf3" : "#fff1ef",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {routeValidation.ok ? "Route validation passed" : "Route validation failed"}
              </div>
              <div>
                <span style={{ color: "#667085" }}>Scan URL: </span>
                <a href={routeValidation.test_scan_url} target="_blank" rel="noreferrer">
                  {routeValidation.test_scan_url}
                </a>
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={{ color: "#667085" }}>After activation: </span>
                <a href={routeValidation.test_destination_url} target="_blank" rel="noreferrer">
                  {routeValidation.test_destination_url}
                </a>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: 10, fontSize: 12, color: "#667085" }}>
              Step 1: Enter QR ID and PIN. Step 2: Test scan route. Step 3: Activate (only after route passes).
            </p>
          )}
        </PageCard>
      ) : activePrimaryRow ? (
        <PageCard style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#16794f", textTransform: "uppercase", marginBottom: 12 }}>
            QR Status: Active
          </div>
          <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>QR ID</div>
              <code>{activePrimaryRow.qr_code}</code>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>Public URL</div>
              <a href={activePrimaryRow.public_url} target="_blank" rel="noreferrer">
                {activePrimaryRow.public_url}
              </a>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" style={btn} onClick={() => copyUrl(activePrimaryRow.public_url)}>
              Copy URL
            </button>
            {downloadPngUrl ? (
              <button
                type="button"
                style={btn}
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = downloadPngUrl(activePrimaryRow.qr_code);
                  a.download = `${activePrimaryRow.qr_code}-qr.png`;
                  a.click();
                }}
              >
                Download QR PNG
              </button>
            ) : null}
            {downloadUrl ? (
              <button
                type="button"
                style={btn}
                onClick={async () => {
                  const res = await fetch(downloadUrl(activePrimaryRow.qr_code), { credentials: "include" });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${activePrimaryRow.qr_code}-sticker.svg`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Sticker Artwork
              </button>
            ) : null}
            {canMutate && replaceQr ? (
              <button
                type="button"
                style={btnDanger}
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Request replacement for ${activePrimaryRow.qr_code}? Your current sticker will stop working after replacement is processed. You will activate the new sticker with its PIN when it arrives.`
                    )
                  )
                    return;
                  const data = await replaceQr(activePrimaryRow.qr_code);
                  setMessage(
                    `Replacement requested. Activate new sticker when it arrives: ${data?.replacement_inventory?.qr_code || "see email"}`
                  );
                  refresh();
                }}
              >
                Request Replacement
              </button>
            ) : null}
          </div>
        </PageCard>
      ) : null}

      {hasActivePrimary ? (
        <details style={{ marginBottom: 16 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Activate another sticker</summary>
          <form onSubmit={handleActivate} style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <input value={qrId} onChange={(e) => setQrId(e.target.value)} placeholder="QR ID" style={inputStyle} />
            <input
              value={activationPin}
              onChange={(e) => setActivationPin(e.target.value)}
              placeholder="PIN"
              style={inputStyle}
            />
            <button type="submit" style={btnPrimary} disabled={activating}>
              Activate
            </button>
          </form>
        </details>
      ) : null}

      {loading ? (
        <p style={{ color: "#667085" }}>Loading active stickers…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#667085" }}>No active sticker QRs for this restaurant yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ead9ce" }}>
                {["Type", "QR ID", "Scan URL", "Destination", "Status", "Scans", "Last scan", "Activated", "Actions"].map(
                  (h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || row.qr_code} style={{ borderBottom: "1px solid #f2f4f8" }}>
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
                    <div style={{ fontSize: 11, color: "#98a2b3" }}>{row.resolved_destination_url || "—"}</div>
                  </td>
                  <td style={td}>{row.status}</td>
                  <td style={td}>{row.scan_count ?? 0}</td>
                  <td style={td}>{formatTs(row.last_scanned_at)}</td>
                  <td style={td}>{formatTs(row.activated_at)}</td>
                  <td style={td}>
                    <button type="button" style={btn} onClick={() => copyUrl(row.public_url)}>
                      Copy Scan URL
                    </button>
                    {row.status === "active" ? (
                      <>
                        <button type="button" style={btn} onClick={() => setPreviewCode(row.qr_code)}>
                          Preview
                        </button>
                        <button
                          type="button"
                          style={btn}
                          onClick={async () => {
                            const res = await fetch(downloadUrl(row.qr_code), { credentials: "include" });
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${row.qr_code}-sticker.svg`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Download
                        </button>
                      </>
                    ) : null}
                    {canMutate && row.status === "active" ? (
                      <>
                        <button
                          type="button"
                          style={btnDanger}
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
                          onClick={async () => {
                            if (!window.confirm(`Replace ${row.qr_code}? A new unclaimed sticker will be issued for printing.`))
                              return;
                            const data = await replaceQr(row.qr_code);
                            setMessage(
                              `Replaced. New inventory: ${data?.replacement_inventory?.qr_code || "see admin manifest"}`
                            );
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

      {previewCode ? (
        <div style={{ marginTop: 24, padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #ead9ce" }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Sticker preview — {previewCode}</div>
          {previewLoading ? (
            <p style={{ color: "#667085" }}>Loading preview…</p>
          ) : previewBlobUrl ? (
            <img src={previewBlobUrl} alt="" style={{ maxWidth: "100%", border: "1px solid #e4e9f0" }} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PageCard({ children, style }) {
  return (
    <div
      style={{
        background: "#fffdf8",
        border: "1px solid #ead9ce",
        borderRadius: 14,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const fieldStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontWeight: 700, color: "#667085" };
const inputStyle = {
  height: 34,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid #d7c5b8",
  minWidth: 160,
  fontSize: 14,
};
const th = { padding: "8px 10px", fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" };
const td = { padding: "12px 10px", verticalAlign: "top" };
