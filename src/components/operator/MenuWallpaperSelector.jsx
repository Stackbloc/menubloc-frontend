/**
 * Owner/operator Menu Wallpaper selector — independent pattern layer for Default menus.
 * Supports inherit / none / bank presets / randomize+keep (shared platform library).
 * Owners and operators can change auto-assigned chrome at any time.
 */
import { useEffect, useState } from "react";
import {
  MENU_WALLPAPER_NONE,
  MENU_WALLPAPER_PRESETS,
  buildMenuChromeRootStyle,
  getPresetWallpaper,
  getSuggestedWallpaperKeysForAppearance,
  sortWallpapersForAppearance,
} from "../../lib/menuWallpapers.js";
import { getMenuAppearanceTokens } from "../../lib/menuAppearances.js";

const CARD_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
  gap: 10,
  marginTop: 12,
};

function WallpaperThumb({ pageBackground, pattern, selected, label, sublabel, onSelect, testId }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={testId}
      style={{
        textAlign: "left",
        padding: 0,
        borderRadius: 10,
        border: selected ? "2px solid #166534" : "1px solid #e4e9f0",
        background: "#fff",
        cursor: "pointer",
        overflow: "hidden",
        fontFamily: "inherit",
        boxShadow: selected ? "0 0 0 1px #166534" : "none",
      }}
    >
      <div
        style={{
          height: 64,
          backgroundColor: pageBackground,
          backgroundImage: pattern && pattern !== "none" ? pattern : "none",
          backgroundRepeat: "repeat",
          borderBottom: "1px solid #e7e5e4",
        }}
      />
      <div style={{ padding: "8px 9px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", lineHeight: 1.25 }}>{label}</div>
        {sublabel ? (
          <div style={{ marginTop: 3, fontSize: 10, color: "#78716c", lineHeight: 1.3 }}>{sublabel}</div>
        ) : null}
      </div>
    </button>
  );
}

/**
 * @param {{
 *   menuWallpaperKey: string|null,
 *   appearanceKey: string,
 *   catalog?: Array<{key:string,name:string,svg_data_uri?:string,source?:string}>,
 *   defaultLayoutActive?: boolean,
 *   applyMode?: "draft"|"live",
 *   busy?: boolean,
 *   onChange: (key: string|null) => void,
 *   onRandomize?: () => Promise<object|null>,
 *   onKeep?: (candidate: object) => Promise<object|null>,
 * }} props
 */
export default function MenuWallpaperSelector({
  menuWallpaperKey,
  appearanceKey = "modern_minimal",
  catalog = null,
  defaultLayoutActive = true,
  applyMode = "draft",
  busy = false,
  onChange,
  onRandomize,
  onKeep,
}) {
  const tokens = getMenuAppearanceTokens(appearanceKey);
  const rawBank = Array.isArray(catalog) && catalog.length ? catalog : MENU_WALLPAPER_PRESETS;
  const bank = sortWallpapersForAppearance(rawBank, appearanceKey);
  const suggestedKeys = new Set(getSuggestedWallpaperKeysForAppearance(appearanceKey, bank));
  const inherit = menuWallpaperKey == null || menuWallpaperKey === "";
  const isNone = menuWallpaperKey === MENU_WALLPAPER_NONE;

  const [candidate, setCandidate] = useState(null);
  const [localBusy, setLocalBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setCandidate(null);
    setStatus("");
  }, [menuWallpaperKey]);

  const activeBusy = busy || localBusy;
  const applyCopy =
    applyMode === "live"
      ? "Selecting a wallpaper applies it to the public Default menu immediately. Hard-refresh the public menu to see it. You can change the auto-assigned design anytime."
      : "Subtle tiled wallpaper for Default menus. New restaurants get a random appearance + wallpaper; change them anytime. Preview uses your current selection (Save Design still required to publish).";

  const previewRoot = buildMenuChromeRootStyle(
    appearanceKey,
    inherit ? null : menuWallpaperKey,
    isNone
      ? null
      : bank.find((e) => e.key === menuWallpaperKey) || getPresetWallpaper(menuWallpaperKey)
  );

  async function handleRandomize() {
    if (!onRandomize || activeBusy) return;
    setLocalBusy(true);
    setStatus("");
    try {
      const next = await onRandomize();
      if (next) {
        setCandidate(next);
        setStatus(`Preview: ${next.name}`);
      }
    } catch (err) {
      setStatus(err?.message || "Could not randomize wallpaper.");
    } finally {
      setLocalBusy(false);
    }
  }

  async function handleKeep() {
    if (!onKeep || !candidate || activeBusy) return;
    setLocalBusy(true);
    setStatus("");
    try {
      const saved = await onKeep(candidate);
      if (saved?.key) {
        onChange(saved.key);
        setCandidate(null);
        setStatus(`Saved “${saved.name}” to the platform bank.`);
      }
    } catch (err) {
      setStatus(err?.message || "Could not save wallpaper.");
    } finally {
      setLocalBusy(false);
    }
  }

  return (
    <div data-testid="menu-wallpaper-selector">
      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#57534e", lineHeight: 1.45 }}>{applyCopy}</p>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280", lineHeight: 1.45 }}>
        Applies only when Default layout is active. Pattern opacity stays subtle for readability.
      </p>
      {!defaultLayoutActive ? (
        <div
          data-testid="menu-wallpaper-default-only-notice"
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            fontSize: 12,
            color: "#9a3412",
            lineHeight: 1.45,
          }}
        >
          A custom Menu Lab layout is selected. Menu Wallpaper will show on the public menu when you
          switch back to Default.
        </div>
      ) : null}

      <div
        data-testid="menu-wallpaper-live-preview"
        style={{
          ...previewRoot,
          borderRadius: 12,
          border: `1px solid ${tokens.border}`,
          padding: 14,
          marginBottom: 12,
          minHeight: 88,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: tokens.onPage }}>
          Wallpaper preview · {tokens.name}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: tokens.onPage, opacity: 0.85 }}>
          {inherit
            ? "Inheriting appearance pattern"
            : isNone
              ? "No wallpaper (solid background)"
              : bank.find((e) => e.key === menuWallpaperKey)?.name || menuWallpaperKey}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          data-testid="menu-wallpaper-inherit"
          disabled={activeBusy}
          onClick={() => onChange(null)}
          aria-pressed={inherit}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: inherit ? "2px solid #166534" : "1px solid #e4e9f0",
            background: inherit ? "#f0fdf4" : "#fff",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Inherit appearance
        </button>
        <button
          type="button"
          data-testid="menu-wallpaper-none"
          disabled={activeBusy}
          onClick={() => onChange(MENU_WALLPAPER_NONE)}
          aria-pressed={isNone}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: isNone ? "2px solid #166534" : "1px solid #e4e9f0",
            background: isNone ? "#f0fdf4" : "#fff",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          None (solid)
        </button>
        {onRandomize ? (
          <button
            type="button"
            data-testid="menu-wallpaper-randomize"
            disabled={activeBusy}
            onClick={handleRandomize}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e4e9f0",
              background: "#fff",
              fontWeight: 700,
              fontSize: 12,
              cursor: activeBusy ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Randomize
          </button>
        ) : null}
        {candidate && onKeep ? (
          <button
            type="button"
            data-testid="menu-wallpaper-keep"
            disabled={activeBusy}
            onClick={handleKeep}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #166534",
              background: "#166534",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              cursor: activeBusy ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Keep “{candidate.name}”
          </button>
        ) : null}
      </div>

      {candidate ? (
        <div
          data-testid="menu-wallpaper-candidate-preview"
          style={{
            marginBottom: 12,
            borderRadius: 10,
            border: "1px dashed #a8a29e",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 56,
              backgroundColor: tokens.pageBackground,
              backgroundImage: candidate.svg_data_uri,
              backgroundRepeat: "repeat",
            }}
          />
          <div style={{ padding: "8px 10px", fontSize: 12, color: "#57534e" }}>
            Candidate (not saved until Keep): <strong>{candidate.name}</strong>
          </div>
        </div>
      ) : null}

      {status ? (
        <div style={{ marginBottom: 10, fontSize: 12, color: "#57534e" }}>{status}</div>
      ) : null}

      <div style={CARD_GRID}>
        {bank.map((entry) => (
          <WallpaperThumb
            key={entry.key}
            pageBackground={tokens.pageBackground}
            pattern={entry.svg_data_uri}
            selected={!inherit && !isNone && menuWallpaperKey === entry.key}
            label={entry.name}
            sublabel={
              suggestedKeys.has(entry.key)
                ? "Suggested for this restaurant"
                : entry.source && entry.source !== "preset"
                  ? entry.source
                  : null
            }
            testId={`menu-wallpaper-card-${entry.key}`}
            onSelect={() => onChange(entry.key)}
          />
        ))}
      </div>
    </div>
  );
}
