import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS } from "./OwnerLayout.jsx";
import OwnerMenuCreateWorkspace from "./OwnerMenuCreateWorkspace.jsx";
import OwnerMenuUploadActivity from "./OwnerMenuUploadActivity.jsx";

function resolveMenuManagerTab(searchParams) {
  const explicit = String(searchParams.get("tab") || "").trim().toLowerCase();
  if (explicit === "workspace" || explicit === "activity") return explicit;
  // Review inbox when filtering upload status / date windows.
  if (
    searchParams.get("status") ||
    searchParams.get("today") === "1" ||
    searchParams.get("last7days") === "1"
  ) {
    return "activity";
  }
  // Default: find restaurant → upload PDF/photos → edit dishes.
  return "workspace";
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
        background: active ? OWNER_COLORS.accentSoft : "#fff",
        color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
        fontWeight: active ? 700 : 600,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

/**
 * Restaurant Manager (2026-10-20, Andre: "Search, Add Restaurant, Profile Manager, and Menu
 * Manager should be a cohesive workflow. Every restaurant addition starts with search.").
 * One page: search → pick a restaurant (Details · Public profile · Menus) or, when search
 * finds nothing, Add Restaurant. Needs review is the held-OCR inbox. No separate left-nav
 * Add Restaurant / Profile Manager / Menu Manager entries any more.
 */
export default function OwnerMenuUploads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo(() => resolveMenuManagerTab(searchParams), [searchParams]);
  const workspaceKey = searchParams.get("fresh") || searchParams.get("create") || "workspace";

  function setTab(nextTab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", nextTab);
      if (nextTab === "activity") {
        next.delete("restaurant");
        next.delete("section");
        next.delete("create");
        next.delete("fresh");
        next.delete("name");
        next.delete("city");
        next.delete("state");
        if (!next.get("status")) next.set("status", "needs_review");
      } else {
        next.delete("status");
        next.delete("today");
        next.delete("last7days");
      }
      return next;
    });
  }

  return (
    <OwnerLayout
      title="Restaurant Manager"
      subtitle="Search first. Found → Details, Public profile, Menus. Not found → Add Restaurant. Upload a PDF or photos under Menus."
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        <TabButton
          active={tab === "workspace"}
          label="Restaurants"
          onClick={() => setTab("workspace")}
        />
        <TabButton
          active={tab === "activity"}
          label="Needs review"
          onClick={() => setTab("activity")}
        />
      </div>

      {tab === "activity" ? (
        <OwnerMenuUploadActivity />
      ) : (
        <OwnerMenuCreateWorkspace key={workspaceKey} embedded />
      )}
    </OwnerLayout>
  );
}
