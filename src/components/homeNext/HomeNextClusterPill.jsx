import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CLUSTER_PILL_LABEL,
  clusterNavDescriptor,
  clusterNavHref,
} from "../../lib/clusterNavigation.js";

const FADE_IN_KEYFRAMES = "@keyframes homeNextClusterPillIn{from{opacity:0}to{opacity:1}}";

/**
 * "Explore clusters" pill beside the location pill. Renders nothing when the
 * active location has no clusters. Selecting a cluster opens its existing
 * Cluster page without carrying over the search text.
 */
export default function HomeNextClusterPill({ clusters = [], collapseSignal = 0 }) {
  const location = useLocation();
  const menuId = useId();
  // Open state is keyed to the reset signal + cluster set, so a home reset or a
  // city switch closes the menu without an effect.
  const resetKey = `${collapseSignal}|${clusters.map((cluster) => cluster.slug).join(",")}`;
  const [openKey, setOpenKey] = useState(null);
  const open = openKey === resetKey;
  const setOpen = (next) => {
    const value = typeof next === "function" ? next(open) : next;
    setOpenKey(value ? resetKey : null);
  };
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);

  const exitTo = `${location.pathname}${location.search}`;
  const hasClusters = clusters.length > 0;

  useEffect(() => {
    if (!open) return undefined;
    itemRefs.current[0]?.focus();
    function handlePointer(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpenKey(null);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
    };
  }, [open]);

  if (!hasClusters) return null;

  function closeAndFocusButton() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleButtonKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleMenuKeyDown(event) {
    const items = itemRefs.current.filter(Boolean);
    const index = items.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusButton();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        // Explicit layer: the fade-in briefly makes this a stacking context, which
        // would otherwise let the search bar (later in the DOM) paint over the menu.
        zIndex: 1,
        flexShrink: 0,
        margin: "-4px 0 -4px 20px",
        animation: "homeNextClusterPillIn 180ms ease-out",
      }}
    >
      <style>{FADE_IN_KEYFRAMES}</style>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          minHeight: 34,
          padding: "4px 12px",
          borderRadius: 999,
          border: "1px solid rgba(34,197,94,0.25)",
          background: open ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.06)",
          color: "#15803d",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>{CLUSTER_PILL_LABEL}</span>
        <span aria-hidden="true" style={{ opacity: 0.65, fontSize: 11 }}>▾</span>
      </button>

      {open && (
        <ul
          id={menuId}
          role="menu"
          aria-label={CLUSTER_PILL_LABEL}
          onKeyDown={handleMenuKeyDown}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 30,
            width: "max-content",
            minWidth: 200,
            maxWidth: "min(280px, calc(100vw - 32px))",
            margin: 0,
            padding: 6,
            listStyle: "none",
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #E5E7EB",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {clusters.map((cluster, index) => {
            const href = clusterNavHref(cluster, exitTo);
            if (!href) return null;
            const descriptor = clusterNavDescriptor(cluster);
            return (
              <li key={cluster.slug} role="none">
                <Link
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  role="menuitem"
                  to={href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "8px 10px",
                    borderRadius: 10,
                    color: "#111827",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>{cluster.name}</span>
                  {descriptor ? (
                    <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "#6B7280" }}>
                      {descriptor}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
