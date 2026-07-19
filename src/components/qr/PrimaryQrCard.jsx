import { useRef, useState } from "react";
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

const BTN = {
  borderRadius: 7,
  padding: "7px 14px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

/**
 * PrimaryQrCard — shows the restaurant's primary digital QR code.
 * Props:
 *   qr            — { token, image_url, image_url_svg, destination_path,
 *                     destination_url, created_at, scan_tracking_available }
 *   restaurantId  — number
 *   restaurantName — optional display name for share/print
 */
export default function PrimaryQrCard({ qr, restaurantId: _restaurantId, restaurantName }) {
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const printRef = useRef(null);

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
  const shareTitle = restaurantName
    ? `${restaurantName} menu on Menuply`
    : "Menu on Menuply";

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

  async function handleShare() {
    if (!displayUrl) return;
    setShareMessage("");

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        const payload = {
          title: shareTitle,
          text: "Scan or open to view our menu on Menuply.",
          url: displayUrl,
        };

        if (imageUrl && navigator.canShare) {
          try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const file = new File([blob], "menuply-qr.png", { type: blob.type || "image/png" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ ...payload, files: [file] });
              return;
            }
          } catch {
            // Fall through to URL-only share
          }
        }

        await navigator.share(payload);
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      // Fall through to clipboard
    }

    await handleCopy();
    setShareMessage("Link copied — share it from anywhere.");
    setTimeout(() => setShareMessage(""), 2500);
  }

  function handlePrint() {
    if (!imageUrl && !displayUrl) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=560,height=720");
    if (!printWindow) {
      // Popup blocked — try printing PDF poster if available
      if (qr?.image_url_pdf) {
        const pdfUrl = qr.image_url_pdf.startsWith("http")
          ? qr.image_url_pdf
          : `${API}${qr.image_url_pdf}`;
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    const safeName = (restaurantName || "Your restaurant").replace(/</g, "&lt;");
    const safeUrl = (displayUrl || "").replace(/</g, "&lt;");
    const safeImg = (imageUrl || "").replace(/"/g, "&quot;");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeName} — Menu QR</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; margin: 40px; color: #0f1720; text-align: center; }
    h1 { font-size: 22px; margin: 0 0 8px; font-weight: 700; }
    p { font-size: 13px; color: #475467; margin: 0 0 24px; }
    img { width: 280px; height: 280px; display: block; margin: 0 auto 20px; }
    .url { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; word-break: break-all; color: #344054; }
    .hint { margin-top: 28px; font-size: 11px; color: #98a2b3; }
  </style>
</head>
<body>
  <h1>${safeName}</h1>
  <p>Scan to view our menu on Menuply</p>
  ${safeImg ? `<img src="${safeImg}" alt="Menu QR code" />` : ""}
  ${safeUrl ? `<div class="url">${safeUrl}</div>` : ""}
  <div class="hint">Powered by Menuply</div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 250);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
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

  function handleDownloadPdf() {
    if (!qr?.image_url_pdf) return;
    const pdfUrl = qr.image_url_pdf.startsWith("http")
      ? qr.image_url_pdf
      : `${API}${qr.image_url_pdf}`;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "menuply-qr-poster.pdf";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  return (
    <div
      ref={printRef}
      data-testid="primary-qr-card"
      style={{
        background: "#fff", border: "1px solid #e4e9f0",
        borderRadius: 12, padding: "20px", marginBottom: 20,
      }}
    >
      <div style={{
        fontSize: 11, fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "#8a9ab0", marginBottom: 14,
      }}>
        Your Menu QR Code
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{
          flexShrink: 0, width: 160, height: 160,
          border: "1px solid #e4e9f0", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#fafbfc", overflow: "hidden",
        }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Menu QR code"
              style={{ width: 148, height: 148, display: "block" }}
              loading="lazy"
            />
          ) : (
            <span style={{ fontSize: 11, color: "#aab4c0", textAlign: "center", padding: 8 }}>
              Loading QR…
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "#344054", lineHeight: 1.5 }}>
            Customers scan this code to view your menu instantly. Share the link or print a copy for your counter.
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

          <div style={{
            fontSize: 11, color: "#8a9ab0",
            background: "#f8fafc", border: "1px solid #e4e9f0",
            borderRadius: 6, padding: "6px 10px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span aria-hidden="true">📊</span>
            {scanTrackingAvailable
              ? "Scan tracking active"
              : "Scan tracking coming soon"}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <button
              type="button"
              onClick={handleShare}
              data-testid="primary-qr-share"
              style={{
                ...BTN,
                background: "#0f1720",
                color: "#fff",
                border: "none",
              }}
            >
              Share
            </button>

            <button
              type="button"
              onClick={handlePrint}
              data-testid="primary-qr-print"
              style={{
                ...BTN,
                background: "#1F4E3D",
                color: "#fff",
                border: "none",
              }}
            >
              Print
            </button>

            <button
              type="button"
              onClick={handleCopy}
              data-testid="primary-qr-copy"
              style={{
                ...BTN,
                background: copied ? "#f0faf6" : "#f8fafc",
                color: copied ? "#1F4E3D" : "#344054",
                border: "1px solid #e4e9f0",
              }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>

            {imageUrl && (
              <button
                type="button"
                onClick={handleDownloadPng}
                style={{
                  ...BTN,
                  background: "#f8fafc",
                  color: "#344054",
                  border: "1px solid #e4e9f0",
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
                  ...BTN,
                  background: "#f8fafc",
                  color: "#344054",
                  border: "1px solid #e4e9f0",
                }}
              >
                Download SVG
              </button>
            )}

            {qr?.image_url_pdf && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                style={{
                  ...BTN,
                  background: "#f8fafc",
                  color: "#344054",
                  border: "1px solid #e4e9f0",
                }}
              >
                Download PDF poster
              </button>
            )}
          </div>

          {shareMessage ? (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#1F4E3D" }}>{shareMessage}</p>
          ) : null}

          <div style={{
            borderTop: "1px solid #e4e9f0", paddingTop: 12,
          }}>
            <Link
              to="/operator/qr-kits/order"
              data-testid="primary-qr-marketplace-link"
              style={{
                fontSize: 13,
                fontWeight: 650,
                color: "#1F4E3D",
                textDecoration: "none",
              }}
            >
              Order stickers &amp; decals → Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
