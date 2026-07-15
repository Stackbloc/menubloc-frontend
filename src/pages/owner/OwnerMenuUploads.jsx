import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS } from "./OwnerLayout.jsx";
import OwnerMenuCreateWorkspace from "./OwnerMenuCreateWorkspace.jsx";
import OwnerMenuUploadActivity from "./OwnerMenuUploadActivity.jsx";

function resolveMenuManagerTab(searchParams) {
  const explicit = String(searchParams.get("tab") || "").trim().toLowerCase();
  if (explicit === "workspace" || explicit === "activity") return explicit;
  if (searchParams.get("restaurant") || searchParams.get("create") === "1") {
    return "workspace";
  }
  if (
    searchParams.get("status") ||
    searchParams.get("today") === "1" ||
    searchParams.get("last7days") === "1"
  ) {
    return "activity";
  }
  return "activity";
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
 * Menu Manager shell: Upload Activity inbox + Create/Edit workspace.
 */
export default function OwnerMenuUploads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo(() => resolveMenuManagerTab(searchParams), [searchParams]);

  function setTab(nextTab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", nextTab);
      if (nextTab === "activity") {
        next.delete("restaurant");
        next.delete("create");
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
      title="Menu Manager"
      subtitle="OCR Uploads = camera/photo review queues. Edit Menus = restaurant profile + live menu items."
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <TabButton
          active={tab === "activity"}
          label="OCR Uploads"
          onClick={() => setTab("activity")}
        />
        <TabButton
          active={tab === "workspace"}
          label="Edit Menus"
          onClick={() => setTab("workspace")}
        />
      </div>

      {tab === "activity" ? (
        <OwnerMenuUploadActivity />
      ) : (
        <OwnerMenuCreateWorkspace embedded />
      )}
    </OwnerLayout>
  );
}
