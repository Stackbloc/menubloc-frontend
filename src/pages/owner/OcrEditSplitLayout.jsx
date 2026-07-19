import React, { useEffect, useState } from "react";
import OcrSourceEvidencePanel from "./OcrSourceEvidencePanel.jsx";
import LiveMenuReferencePanel, { normalizeLiveMenuItems } from "./LiveMenuReferencePanel.jsx";
import "./ocrEditSplitLayout.css";

/** Matches CSS: side-by-side only at 1480px+; drawer below (owner sidebar needs room). */
const DRAWER_MQ = "(max-width: 1479px)";

/**
 * Center editing surface + independently scrolling companion rail.
 * Mode 1: OCR source photos + text. Mode 2: plain live menu (no nutrition).
 * Below 1480px the rail is a fixed drawer so the page cannot overflow horizontally.
 */
export default function OcrEditSplitLayout({
  pages = [],
  liveItems = null,
  liveMenuHref = null,
  children,
  railTitle = "Source menu",
  defaultOpen = true,
  defaultRailMode = "ocr",
}) {
  const hasPages = Array.isArray(pages) && pages.length > 0;
  const normalizedLive = normalizeLiveMenuItems(liveItems);
  const hasLive = normalizedLive.length > 0;
  const hasRail = hasPages || hasLive;

  const initialMode =
    defaultRailMode === "live" && hasLive
      ? "live"
      : hasPages
        ? "ocr"
        : hasLive
          ? "live"
          : "ocr";

  const [railOpen, setRailOpen] = useState(defaultOpen);
  const [railMode, setRailMode] = useState(initialMode);
  const [isDrawer, setIsDrawer] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DRAWER_MQ).matches : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia(DRAWER_MQ);
    const onChange = () => setIsDrawer(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!hasRail) return;
    setRailOpen(defaultOpen);
  }, [hasRail, defaultOpen]);

  useEffect(() => {
    if (defaultRailMode === "live" && hasLive) {
      setRailMode("live");
    } else if (hasPages) {
      setRailMode("ocr");
    } else if (hasLive) {
      setRailMode("live");
    }
  }, [defaultRailMode, hasLive, hasPages]);

  if (!hasRail) {
    return <>{children}</>;
  }

  const showingLive = railMode === "live" && hasLive;
  const showingOcr = !showingLive && hasPages;
  const canToggleModes = hasPages && hasLive;

  const hideLabel = showingLive ? "Hide live menu" : "Hide source menu";
  const showLabel = showingLive
    ? "Live menu"
    : canToggleModes
      ? "Source menu · OCR"
      : "Source menu · magnifier";

  return (
    <div className={`ocr-edit-split${railOpen ? " ocr-edit-split--rail-open" : ""}`}>
      <div className="ocr-edit-split__toolbar">
        {canToggleModes && railOpen ? (
          <div className="ocr-edit-split__mode-toggle" role="group" aria-label="Reference panel mode">
            <button
              type="button"
              className={`ocr-edit-split__mode-btn${railMode === "ocr" ? " ocr-edit-split__mode-btn--active" : ""}`}
              onClick={() => setRailMode("ocr")}
              aria-pressed={railMode === "ocr"}
            >
              Source menu · OCR
            </button>
            <button
              type="button"
              className={`ocr-edit-split__mode-btn${railMode === "live" ? " ocr-edit-split__mode-btn--active" : ""}`}
              onClick={() => setRailMode("live")}
              aria-pressed={railMode === "live"}
            >
              Live menu
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className={`ocr-edit-split__toggle${railOpen ? " ocr-edit-split__toggle--active" : ""}`}
          onClick={() => setRailOpen((v) => !v)}
          aria-pressed={railOpen}
          aria-label={railOpen ? hideLabel : showLabel}
        >
          {railOpen ? hideLabel : showLabel}
        </button>
      </div>

      <div className="ocr-edit-split__body">
        <div className="ocr-edit-split__center">{children}</div>

        <aside
          className={`ocr-edit-split__rail${railOpen ? " ocr-edit-split__rail--open" : ""}`}
          aria-hidden={!railOpen}
        >
          {railOpen && showingLive ? (
            <LiveMenuReferencePanel
              items={normalizedLive}
              liveMenuHref={liveMenuHref}
              onClose={isDrawer ? () => setRailOpen(false) : null}
            />
          ) : null}
          {railOpen && showingOcr ? (
            <OcrSourceEvidencePanel
              pages={pages}
              title={railTitle}
              onClose={isDrawer ? () => setRailOpen(false) : null}
            />
          ) : null}
        </aside>
      </div>

      {railOpen && isDrawer ? (
        <div
          className="ocr-edit-split__backdrop"
          onClick={() => setRailOpen(false)}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
