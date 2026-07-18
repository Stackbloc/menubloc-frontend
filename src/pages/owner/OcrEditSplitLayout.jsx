import React, { useEffect, useState } from "react";
import OcrSourceEvidencePanel from "./OcrSourceEvidencePanel.jsx";
import "./ocrEditSplitLayout.css";

const NARROW_MQ = "(max-width: 1100px)";

/**
 * Center editing surface + independently scrolling OCR source rail.
 * Below 1100px the rail collapses behind a "Source menu" toggle / drawer.
 */
export default function OcrEditSplitLayout({
  pages = [],
  children,
  railTitle = "Source menu",
  defaultOpen = true,
}) {
  const hasPages = Array.isArray(pages) && pages.length > 0;
  const [railOpen, setRailOpen] = useState(defaultOpen);
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(NARROW_MQ).matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia(NARROW_MQ);
    const onChange = () => setIsNarrow(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!hasPages) return;
    // On narrow screens start closed so editing stays primary; desktop stays open.
    setRailOpen(!isNarrow && defaultOpen);
  }, [hasPages, isNarrow, defaultOpen]);

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
              onClose={isNarrow ? () => setRailOpen(false) : null}
            />
          ) : null}
        </aside>
      </div>

      {railOpen && isNarrow ? (
        <div
          className="ocr-edit-split__backdrop"
          onClick={() => setRailOpen(false)}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
