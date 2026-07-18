import React, { useCallback, useEffect, useState } from "react";

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FullscreenButton({ targetRef }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setActive(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const node = targetRef?.current || document.documentElement;
      if (node.requestFullscreen) await node.requestFullscreen();
    } catch {
      /* browser may block fullscreen without gesture */
    }
  }, [targetRef]);

  return (
    <button
      type="button"
      className="mp-fullscreen-btn"
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
      aria-label={active ? "Exit full screen" : "Enter full screen"}
      title={active ? "Exit full screen" : "Full screen"}
    >
      {active ? <CollapseIcon /> : <ExpandIcon />}
    </button>
  );
}
