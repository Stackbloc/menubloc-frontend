import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  deleteMenuItemPhoto,
  restoreMenuItemPhoto,
  uploadBrandHero,
  uploadMenuItemPhoto,
  removeBrandHero,
  updateBrandProfile,
} from "../../lib/operatorApi.js";

const MenuDesignPhotoEditContext = createContext(null);

export function MenuDesignPhotoEditProvider({ value, children }) {
  return (
    <MenuDesignPhotoEditContext.Provider value={value}>
      {children}
    </MenuDesignPhotoEditContext.Provider>
  );
}

export function useMenuDesignPhotoEdit() {
  return useContext(MenuDesignPhotoEditContext);
}

const UNDO_MS = 8000;
const FIT_STORAGE_PREFIX = "menuply:menuDesignPhotoFit:";
const HIDDEN_STOCK_PREFIX = "menuply:menuDesignHiddenStock:";

function readJsonMap(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeJsonMap(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value || {}));
  } catch {
    // ignore quota / private mode
  }
}

export function useMenuDesignPhotoEditController({
  enabled,
  restaurantId,
  menuStyle,
  onHeroUrlChange,
  onItemPhotoChange,
}) {
  const [toast, setToast] = useState(null);
  const [fits, setFits] = useState(() =>
    restaurantId ? readJsonMap(`${FIT_STORAGE_PREFIX}${restaurantId}`) : {}
  );
  const [hiddenStock, setHiddenStock] = useState(() =>
    restaurantId && menuStyle
      ? readJsonMap(`${HIDDEN_STOCK_PREFIX}${restaurantId}:${menuStyle}`)
      : {}
  );
  const undoTimerRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) return;
    setFits(readJsonMap(`${FIT_STORAGE_PREFIX}${restaurantId}`));
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId || !menuStyle) return;
    setHiddenStock(readJsonMap(`${HIDDEN_STOCK_PREFIX}${restaurantId}:${menuStyle}`));
  }, [restaurantId, menuStyle]);

  useEffect(() => () => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
  }, []);

  function persistFits(next) {
    setFits(next);
    if (restaurantId) writeJsonMap(`${FIT_STORAGE_PREFIX}${restaurantId}`, next);
  }

  function persistHiddenStock(next) {
    setHiddenStock(next);
    if (restaurantId && menuStyle) {
      writeJsonMap(`${HIDDEN_STOCK_PREFIX}${restaurantId}:${menuStyle}`, next);
    }
  }

  function showUndoToast(message, onUndo) {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setToast({ message, onUndo });
    undoTimerRef.current = window.setTimeout(() => {
      setToast(null);
      undoTimerRef.current = null;
    }, UNDO_MS);
  }

  async function replaceItemPhoto(item, file) {
    const publicId = Number(item?.public_menu_item_id || item?.id);
    if (!Number.isFinite(publicId) || publicId <= 0) {
      throw new Error("This item is missing a public photo target id.");
    }
    const result = await uploadMenuItemPhoto(publicId, file, { isPrimary: true });
    const url = result?.photo?.photo_url || null;
    const photoId = result?.photo?.id || null;
    if (onItemPhotoChange) {
      onItemPhotoChange({
        menuItemId: item?.menu_item_id ?? item?.id,
        publicMenuItemId: publicId,
        imageUrl: url,
        photoId,
      });
    }
    return { url, photoId };
  }

  async function deleteItemPhoto(item) {
    const photoId = Number(item?.photo_id);
    const slotKey = String(item?.menu_item_id ?? item?.id ?? "");
    const isStockOnly = !photoId && Boolean(item?.image_url || item?.photo_url);

    if (isStockOnly && slotKey) {
      const previousUrl = item.image_url || item.photo_url || null;
      persistHiddenStock({ ...hiddenStock, [slotKey]: true });
      if (onItemPhotoChange) {
        onItemPhotoChange({
          menuItemId: item?.menu_item_id ?? item?.id,
          imageUrl: null,
          photoId: null,
        });
      }
      showUndoToast("Photo removed · Undo", () => {
        const next = { ...hiddenStock };
        delete next[slotKey];
        persistHiddenStock(next);
        if (onItemPhotoChange && previousUrl) {
          onItemPhotoChange({
            menuItemId: item?.menu_item_id ?? item?.id,
            imageUrl: previousUrl,
            photoId: null,
          });
        }
      });
      return;
    }

    if (!Number.isFinite(photoId) || photoId <= 0) {
      throw new Error("No saved photo to delete.");
    }

    const previous = {
      photoId,
      imageUrl: item.image_url || item.photo_url || null,
      menuItemId: item?.menu_item_id ?? item?.id,
    };
    await deleteMenuItemPhoto(photoId);
    if (onItemPhotoChange) {
      onItemPhotoChange({
        menuItemId: previous.menuItemId,
        imageUrl: null,
        photoId: null,
      });
    }
    showUndoToast("Photo removed · Undo", async () => {
      await restoreMenuItemPhoto(previous.photoId);
      if (onItemPhotoChange) {
        onItemPhotoChange({
          menuItemId: previous.menuItemId,
          imageUrl: previous.imageUrl,
          photoId: previous.photoId,
        });
      }
    });
  }

  async function replaceHero(file) {
    if (!restaurantId) throw new Error("Restaurant required");
    const result = await uploadBrandHero(restaurantId, file);
    const url = result?.hero_image_url || null;
    if (onHeroUrlChange) onHeroUrlChange(url);
    return url;
  }

  async function deleteHero({ isStock = false, previousUrl = null } = {}) {
    if (!restaurantId) throw new Error("Restaurant required");
    if (isStock) {
      persistHiddenStock({ ...hiddenStock, hero: true });
      if (onHeroUrlChange) onHeroUrlChange(null);
      showUndoToast("Photo removed · Undo", () => {
        const next = { ...hiddenStock };
        delete next.hero;
        persistHiddenStock(next);
        if (onHeroUrlChange) onHeroUrlChange(previousUrl);
      });
      return;
    }
    await removeBrandHero(restaurantId);
    if (onHeroUrlChange) onHeroUrlChange(null);
    showUndoToast("Photo removed · Undo", async () => {
      if (previousUrl) {
        await updateBrandProfile(restaurantId, { hero_image_url: previousUrl });
        if (onHeroUrlChange) onHeroUrlChange(previousUrl);
      }
    });
  }

  function setSlotFit(slotKey, fit) {
    const next = { ...fits, [slotKey]: fit === "contain" ? "contain" : "cover" };
    persistFits(next);
  }

  function getSlotFit(slotKey) {
    return fits[slotKey] === "contain" ? "contain" : "cover";
  }

  function isStockHidden(slotKey) {
    return Boolean(hiddenStock[slotKey]);
  }

  function restoreStock(slotKey, previousUrl) {
    const next = { ...hiddenStock };
    delete next[slotKey];
    persistHiddenStock(next);
    if (slotKey === "hero" && onHeroUrlChange) onHeroUrlChange(previousUrl || null);
  }

  return {
    enabled: Boolean(enabled),
    toast,
    clearToast: () => setToast(null),
    replaceItemPhoto,
    deleteItemPhoto,
    replaceHero,
    deleteHero,
    setSlotFit,
    getSlotFit,
    isStockHidden,
    restoreStock,
  };
}

export function DesignEditUndoToast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(var(--bottom-nav-h, 70px) + 18px)",
        transform: "translateX(-50%)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 12,
        background: "#111827",
        color: "#fff",
        boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <span>Photo removed</span>
      <button
        type="button"
        onClick={() => {
          Promise.resolve(toast.onUndo?.()).finally(() => onClose?.());
        }}
        style={{
          border: "none",
          background: "transparent",
          color: "#86efac",
          fontWeight: 850,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        Undo
      </button>
    </div>
  );
}

export function MenuDesignPhotoSlot({
  enabled,
  slotKey,
  kind = "item",
  imageUrl,
  isStock = false,
  objectFit = "cover",
  onReplaceFile,
  onDelete,
  onFitChange,
  onRestoreStock,
  children,
  style,
}) {
  const inputRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!enabled) {
    return children || null;
  }

  const showEmptyActions = !imageUrl;

  return (
    <div
      style={{ position: "relative", ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-menu-photo-slot={slotKey}
      data-menu-photo-kind={kind}
    >
      {children}
      {(hovered || showEmptyActions) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "rgba(15,23,42,0.48)",
            padding: 10,
            zIndex: 4,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                inputRef.current?.click();
              }}
              style={chromeButtonStyle}
            >
              {busy ? "…" : "Replace"}
            </button>
            {imageUrl ? (
              <button
                type="button"
                disabled={busy}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setBusy(true);
                  setError("");
                  try {
                    await onDelete?.({ isStock });
                  } catch (err) {
                    setError(err.message || "Delete failed");
                  } finally {
                    setBusy(false);
                  }
                }}
                style={chromeButtonStyle}
              >
                Delete
              </button>
            ) : null}
            {!imageUrl && isStock ? (
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRestoreStock?.();
                }}
                style={chromeButtonStyle}
              >
                Restore stock
              </button>
            ) : null}
          </div>
          {imageUrl ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFitChange?.("cover");
                }}
                style={{
                  ...chromeButtonStyle,
                  opacity: objectFit === "cover" ? 1 : 0.72,
                  background: objectFit === "cover" ? "#fff" : "rgba(255,255,255,0.86)",
                }}
              >
                Fill
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFitChange?.("contain");
                }}
                style={{
                  ...chromeButtonStyle,
                  opacity: objectFit === "contain" ? 1 : 0.72,
                  background: objectFit === "contain" ? "#fff" : "rgba(255,255,255,0.86)",
                }}
              >
                Fit
              </button>
            </div>
          ) : null}
          {error ? (
            <div style={{ color: "#fecaca", fontSize: 11, fontWeight: 700 }}>{error}</div>
          ) : null}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            await onReplaceFile?.(file);
          } catch (err) {
            setError(err.message || "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

export function MenuDesignHeroSlot({ heroImageUrl, isStock = false, style, imgStyle, children }) {
  const designEdit = useMenuDesignPhotoEdit();
  const enabled = Boolean(designEdit?.enabled);
  const stockHidden = enabled && designEdit.isStockHidden?.("hero");
  const visibleUrl = stockHidden ? "" : heroImageUrl;
  const objectFit = enabled ? designEdit.getSlotFit?.("hero") || "cover" : "cover";

  if (!enabled) {
    if (!heroImageUrl) return children || null;
    return children || (
      <div style={style}>
        <img src={heroImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...imgStyle }} />
      </div>
    );
  }

  return (
    <MenuDesignPhotoSlot
      enabled
      slotKey="hero"
      kind="hero"
      imageUrl={visibleUrl || ""}
      isStock={isStock || Boolean(stockHidden)}
      objectFit={objectFit}
      onReplaceFile={(file) => designEdit.replaceHero(file)}
      onDelete={() =>
        designEdit.deleteHero({
          isStock,
          previousUrl: heroImageUrl,
        })
      }
      onFitChange={(fit) => designEdit.setSlotFit("hero", fit)}
      onRestoreStock={() => designEdit.restoreStock("hero", heroImageUrl)}
      style={style}
    >
      {visibleUrl ? (
        <img
          src={visibleUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit, display: "block", ...imgStyle }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", minHeight: 120, background: "rgba(148,163,184,0.2)" }} />
      )}
    </MenuDesignPhotoSlot>
  );
}

const chromeButtonStyle = {
  border: "none",
  borderRadius: 999,
  padding: "7px 12px",
  background: "rgba(255,255,255,0.94)",
  color: "#111827",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
};

export default MenuDesignPhotoSlot;
