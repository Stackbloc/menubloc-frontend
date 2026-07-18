import React, { useEffect, useState } from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { OWNER_API_BASE } from "../../lib/ownerApi.js";

export function buildOcrImageUrl(relativePath) {
  if (!relativePath) return null;
  if (/^https?:\/\//.test(relativePath)) return relativePath;
  return `${OWNER_API_BASE}${relativePath}`;
}

function OcrQualityBadge({ score, flags }) {
  if (score == null) return null;
  const pct = (score * 100).toFixed(0);
  const hasFlags = Array.isArray(flags) && flags.length > 0;
  const color = hasFlags ? "#92400e" : score >= 0.7 ? "#15803d" : score >= 0.4 ? "#92400e" : "#991b1b";
  const bg = hasFlags ? "#fffbeb" : score >= 0.7 ? "#f0fdf4" : score >= 0.4 ? "#fffbeb" : "#fef2f2";
  return (
    <span
      title={hasFlags ? `Flags: ${flags.join(", ")}` : undefined}
      style={{ display: "inline-block", fontSize: 10, padding: "2px 6px", borderRadius: 5, fontWeight: 700, background: bg, color }}
    >
      {hasFlags ? "⚠ " : ""}
      {pct}% OCR
    </span>
  );
}

function ExtractionQualityBadge({ itemCount, parseFailed, accepted, readable }) {
  if (parseFailed) {
    return (
      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 5, fontWeight: 700, background: "#fef2f2", color: "#991b1b" }}>
        Parse failed
      </span>
    );
  }
  if (accepted === false && readable === false) {
    return (
      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 5, fontWeight: 700, background: "#fef2f2", color: "#991b1b" }}>
        Unreadable
      </span>
    );
  }
  if (itemCount > 0) {
    return (
      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 5, fontWeight: 700, background: "#f0fdf4", color: "#15803d" }}>
        {itemCount} item{itemCount !== 1 ? "s" : ""}
      </span>
    );
  }
  if (accepted === false) {
    return (
      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 5, fontWeight: 700, background: "#fffbeb", color: "#92400e" }}>
        No items extracted
      </span>
    );
  }
  return null;
}

/**
 * Independently scrolling OCR source evidence: page thumbnails, image, OCR text (stacked).
 */
export default function OcrSourceEvidencePanel({
  pages = [],
  title = "Source menu",
  onClose = null,
}) {
  const [activePageNumber, setActivePageNumber] = useState(null);

  useEffect(() => {
    if (!pages.length) {
      setActivePageNumber(null);
      return;
    }
    setActivePageNumber((prev) => {
      if (prev != null && pages.some((p) => p.page_number === prev)) return prev;
      return pages[0].page_number;
    });
  }, [pages]);

  if (!pages.length) return null;

  const activePage = pages.find((p) => p.page_number === activePageNumber) || pages[0];
  const imageUrl = activePage?.image_url ? buildOcrImageUrl(activePage.image_url) : null;

  return (
    <div className="ocr-source-evidence">
      <div className="ocr-source-evidence__header">
        <span className="ocr-source-evidence__title">
          {title} ({pages.length} page{pages.length !== 1 ? "s" : ""})
        </span>
        {onClose ? (
          <button type="button" className="ocr-source-evidence__close" onClick={onClose} aria-label="Close source menu">
            Close ✕
          </button>
        ) : null}
      </div>

      <div className="ocr-source-evidence__thumbs">
        {pages.map((p) => {
          const selected = activePage?.page_number === p.page_number;
          const thumbUrl = p.image_url ? buildOcrImageUrl(p.image_url) : null;
          return (
            <button
              key={p.page_number}
              type="button"
              className={`ocr-source-evidence__thumb${selected ? " ocr-source-evidence__thumb--active" : ""}`}
              onClick={() => setActivePageNumber(p.page_number)}
              title={`Page ${p.page_number}${p.item_count ? ` · ${p.item_count} items` : ""}`}
            >
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={`Page ${p.page_number}`}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <span className="ocr-source-evidence__thumb-fallback">P{p.page_number}</span>
              )}
              <span className="ocr-source-evidence__thumb-label">{p.page_number}</span>
            </button>
          );
        })}
      </div>

      {activePage ? (
        <div className="ocr-source-evidence__body">
          <div className="ocr-source-evidence__meta">
            <span className="ocr-source-evidence__page-label">Page {activePage.page_number}</span>
            <OcrQualityBadge score={activePage.ocr_quality_score} flags={activePage.ocr_quality_flags} />
            <ExtractionQualityBadge
              itemCount={activePage.item_count}
              parseFailed={activePage.extraction_parse_failure}
              accepted={activePage.extraction_accepted}
              readable={activePage.extraction_readable}
            />
            {imageUrl ? (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="ocr-source-evidence__fullsize"
              >
                Full size ↗
              </a>
            ) : null}
          </div>

          {imageUrl ? (
            <div className="ocr-source-evidence__image-wrap">
              <img
                src={imageUrl}
                alt={`Page ${activePage.page_number}`}
                className="ocr-source-evidence__image"
                onError={(e) => {
                  e.target.parentNode.innerHTML =
                    '<div class="ocr-source-evidence__image-missing">' +
                    "<div style=\"font-weight:700;margin-bottom:6px\">Photo unavailable</div>" +
                    "<div style=\"font-size:12px\">Source file is no longer on the server. OCR text below is still valid for review.</div>" +
                    "</div>";
                }}
              />
            </div>
          ) : (
            <div className="ocr-source-evidence__image-missing">No photo for this page</div>
          )}

          <div className="ocr-source-evidence__ocr-label">OCR Text (supporting evidence)</div>
          <pre className="ocr-source-evidence__ocr-text">
            {activePage.ocr_text || "No OCR text available for this page."}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
