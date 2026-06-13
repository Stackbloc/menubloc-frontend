import { useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return null;
  }
}

/**
 * PrimaryQrCard — shows the restaurant's primary digital QR code.
 * Props:
 *   qr            — { token, image_url, image_url_svg, destination_path,
 *                     destination_url, created_at, scan_tracking_available }
 *   restaurantId  — number
 */
export default function PrimaryQrCard({ qr, restaurantId }) {
  const [copied, setCopied] = useState(false);

  if (!qr) return null;

  const imageUrl = qr?.image_url
    ? (qr.image_url.startsWith("http") ? qr.image_url : `${API}${qr.image_url}`)
    : null;

  const destinationUrl = qr?.destination_url || qr?.destination_path || null;
  const displayUrl = destinationUrl
    ? (destinationUrl.startsWith("http") ? destinationUrl : `https://menuply.com${destinationUrl}`)
    : null;

  const createdDate = formatDate(qr?.created_at);
  const scanTrackingAvailable = qr?.scan_tracking_available === true;

  async function handleCopy() {
    if (!displayUrl) return;
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silent
    }
  }

  function handleDownloadPng() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "menuply-qr.png";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  function handleDownloadSvg() {
    if (!qr?.image_url_svg) return;
    const svgUrl = qr.image_url_svg.startsWith("http")
      ? qr.image_url_svg
      : `${API}${qr.image_url_svg}`;
    const a = document.createElement("a");
    a.href = svgUrl;
    a.download = "menuply-qr.svg";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e4e9f0",
      borderRadius: 12, padding: "20px", marginBottom: 20,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "#8a9ab0", marginBottom: 14,
      }}>
        Your Menu QR Code
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* QR image */}
        <div style={{
          flexShrink: 0, width: 120, height: 120,
          border: "1px solid #e4e9f0", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#fafbfc", overflow: "hidden",
        }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Menu QR code"
              style={{ width: 112, height: 112, display: "block" }}
              loading="lazy"
            />
          ) : (
            <span style={{ fontSize: 11, color: "#aab4c0", textAlign: "center", padding: 8 }}>
              Loading QR…
            </span>
          )}
        </div>

        {/* Info + actions */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "#344054", lineHeight: 1.5 }}>
            Customers scan this code to view your menu instantly.
          </p>

          {displayUrl && (
            <div style={{
              fontSize: 11, color: "#667085", wordBreak: "break-all",
              background: "#f8fafc", border: "1px solid #e4e9f0",
              borderRadius: 6, padding: "6px 10px", marginBottom: 10,
            }}>
              {displayUrl}
            </div>
          )}

          {createdDate && (
            <p style={{ margin: "0 0 10px", fontSize: 11, color: "#8a9ab0" }}>
              Created {createdDate}
            </p>
          )}

          {/* Scan tracking status */}
          <div style={{
            fontSize: 11, color: "#8a9ab0",
            background: "#f8fafc", border: "1px solid #e4e9f0",
            borderRadius: 6, padding: "6px 10px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 13 }}>📊</span>
            {scanTrackingAvailable
              ? "Scan tracking active"
              : "Scan tracking coming soon"}
          </div>

          {/* Download / copy actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: copied ? "#f0faf6" : "#f8fafc",
                color: copied ? "#1F4E3D" : "#344054",
                border: "1px solid #e4e9f0",
                borderRadius: 7, padding: "7px 14px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>

            {imageUrl && (
              <button
                type="button"
                onClick={handleDownloadPng}
                style={{
                  background: "#0f1720", color: "#fff",
                  border: "none", borderRadius: 7,
                  padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Download PNG
              </button>
            )}

            {qr?.image_url_svg && (
              <button
                type="button"
                onClick={handleDownloadSvg}
                style={{
                  background: "#f8fafc", color: "#344054",
                  border: "1px solid #e4e9f0", borderRadius: 7,
                  padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Download SVG
              </button>
            )}
          </div>

          {/* Physical product CTAs */}
          <div style={{
            borderTop: "1px solid #e4e9f0", paddingTop: 12,
            display: "flex", gap: 8, flexWrap: "wrap",
          }}>
            <Link
              to="/operator/qr-kits/order"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#f8fafc", color: "#344054",
                border: "1px solid #e4e9f0", borderRadius: 7,
                padding: "7px 14px", fontSize: 12, fontWeight: 600,
                textDecoration: "none",
              }}
            >
              🏷️ Order replacement sticker
            </Link>
            <Link
              to="/operator/qr-kits/order"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#f8fafc", color: "#344054",
                border: "1px solid #e4e9f0", borderRadius: 7,
                padding: "7px 14px", fontSize: 12, fontWeight: 600,
                textDecoration: "none",
              }}
            >
              🪟 Order window decal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
