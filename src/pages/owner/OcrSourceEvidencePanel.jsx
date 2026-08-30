import React, { useEffect, useRef, useState } from "react";
import { OWNER_API_BASE } from "../../lib/ownerApi.js";

export function buildOcrImageUrl(relativePath) {
  if (!relativePath) return null;
  if (/^https?:\/\//.test(relativePath)) return relativePath;
  return `${OWNER_API_BASE}${relativePath}`;
}

const MAGNIFIER_ZOOM = 2.75;
const MAGNIFIER_LENS_PX = 160;

/** Hover lens on source photos — on by default so the control is obvious. */
function OcrPhotoMagnifier({ src, alt }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const [enabled, setEnabled] = useState(true);
  const [lens, setLens] = useState(null);

  useEffect(() => {
    setLens(null);
  }, [src]);

  useEffect(() => {
    if (!enabled) setLens(null);
  }, [enabled]);

  function updateLens(clientX, clientY) {
    const img = imgRef.current;
    const wrap = wrapRef.current;
    if (!img || !wrap || !enabled) return;
    const imgRect = img.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const x = clientX - imgRect.left;
    const y = clientY - imgRect.top;
    if (x < 0 || y < 0 || x > imgRect.width || y > imgRect.height) {
      setLens(null);
      return;
    }
    const half = MAGNIFIER_LENS_PX / 2;
    // Position relative to the wrap (image may be letterboxed inside it)
    const offsetX = imgRect.left - wrapRect.left;
    const offsetY = imgRect.top - wrapRect.top;
    setLens({
      left: offsetX + x - half,
      top: offsetY + y - half,
      backgroundSize: `${imgRect.width * MAGNIFIER_ZOOM}px ${imgRect.height * MAGNIFIER_ZOOM}px`,
      backgroundPosition: `-${x * MAGNIFIER_ZOOM - half}px -${y * MAGNIFIER_ZOOM - half}px`,
    });
  }

  function handlePointerMove(e) {
    updateLens(e.clientX, e.clientY);
  }

  function handlePointerLeave() {
    setLens(null);
  }

  function handleImageError(e) {
    const parent = e.target.closest(".ocr-source-evidence__photo");
    if (!parent) return;
    parent.innerHTML =
      '<div class="ocr-source-evidence__image-missing">' +
      '<div style="font-weight:700;margin-bottom:6px">Photo unavailable</div>' +
      '<div style="font-size:12px">Source file is no longer on the server. OCR text below is still valid for review.</div>' +
      "</div>";
  }

  return (
    <div className="ocr-source-evidence__photo">
      <div className="ocr-source-evidence__photo-tools">
        <button
          type="button"
          className={`ocr-source-evidence__magnify-btn${enabled ? " ocr-source-evidence__magnify-btn--active" : ""}`}
          onClick={() => setEnabled((v) => !v)}
          aria-pressed={enabled}
          title={enabled ? "Turn off magnifier" : "Turn on magnifier — move pointer over the photo to zoom"}
        >
          🔍 {enabled ? "Magnifier on" : "Magnifier off"}
        </button>
        <span className="ocr-source-evidence__magnify-hint">
          {enabled ? `Move over the photo to zoom · ${MAGNIFIER_ZOOM}×` : "Turn on to inspect fine print"}
        </span>
      </div>
      <div
        ref={wrapRef}
        className={`ocr-source-evidence__image-wrap${enabled ? " ocr-source-evidence__image-wrap--magnify" : ""}`}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={(e) => {
          if (!enabled) return;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          updateLens(e.clientX, e.clientY);
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="ocr-source-evidence__image"
          draggable={false}
          onError={handleImageError}
        />
        {enabled && lens ? (
          <div
            className="ocr-source-evidence__lens"
            style={{
              width: MAGNIFIER_LENS_PX,
              height: MAGNIFIER_LENS_PX,
              left: lens.left,
              top: lens.top,
              backgroundImage: `url("${src}")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: lens.backgroundSize,
              backgroundPosition: lens.backgroundPosition,
            }}
            aria-hidden="true"
          />
        ) : null}
        {enabled && !lens ? (
          <div className="ocr-source-evidence__magnify-cue" aria-hidden="true">
            Move pointer to magnify
          </div>
        ) : null}
      </div>
    </div>
  );
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

  if (!pages.length) {
    return (
      <div className="ocr-source-evidence">
        <div className="ocr-source-evidence__header">
          <span className="ocr-source-evidence__title">{title}</span>
          {onClose ? (
            <button type="button" className="ocr-source-evidence__close" onClick={onClose} aria-label="Close source menu">
              Close ✕
            </button>
          ) : null}
        </div>
        <div className="ocr-source-evidence__empty">
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#101828" }}>No OCR source for this menu yet</p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#667085" }}>
            Upload a PDF or menu photos above, or use <strong>Update OCR</strong> on a prior capture.
            Source photos and OCR text will appear here beside Edit dishes — like Tom&apos;s Watch Bar.
          </p>
        </div>
      </div>
    );
  }

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
            <OcrPhotoMagnifier src={imageUrl} alt={`Page ${activePage.page_number}`} />
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
