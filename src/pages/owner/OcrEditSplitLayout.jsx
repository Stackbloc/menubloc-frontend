import React, { useEffect, useState } from "react";
import OcrSourceEvidencePanel from "./OcrSourceEvidencePanel.jsx";
import "./ocrEditSplitLayout.css";

/** Matches CSS: side-by-side only at 1480px+; drawer below (owner sidebar needs room). */
const DRAWER_MQ = "(max-width: 1479px)";

/**
 * Center editing surface + independently scrolling OCR source rail.
 * Below 1480px the rail is a fixed drawer so the page cannot overflow horizontally.
 */
export default function OcrEditSplitLayout({
  pages = [],
  children,
  railTitle = "Source menu",
  defaultOpen = true,
}) {
  const hasPages = Array.isArray(pages) && pages.length > 0;
  const [railOpen, setRailOpen] = useState(defaultOpen);
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
    if (!hasPages) return;
    // Drawer mode: start closed so the editor stays fully on-screen.
    // Wide desktop: open by default when pages exist.
    setRailOpen(!isDrawer && defaultOpen);
  }, [hasPages, isDrawer, defaultOpen]);

  if (!hasPages) {
    return <>{children}</>;
  }

  return (
    <div className={`ocr-edit-split${railOpen ? " ocr-edit-split--rail-open" : ""}`}>
      <div className="ocr-edit-split__toolbar">
        <button
          type="button"
          className={`ocr-edit-split__toggle${railOpen ? " ocr-edit-split__toggle--active" : ""}`}
          onClick={() => setRailOpen((v) => !v)}
          aria-pressed={railOpen}
          aria-label={railOpen ? "Hide source menu" : "Show source menu"}
        >
          {railOpen ? "Hide source menu" : "Source menu"}
        </button>
      </div>

      <div className="ocr-edit-split__body">
        <div className="ocr-edit-split__center">{children}</div>

        <aside
          className={`ocr-edit-split__rail${railOpen ? " ocr-edit-split__rail--open" : ""}`}
          aria-hidden={!railOpen}
        >
          {railOpen ? (
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
