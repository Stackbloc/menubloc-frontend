/**
 * Owner switch: show dish photos on the menu rows (website menu, Menu Browser, app).
 * One setting per restaurant — restaurant_display_settings.item_image_style
 * ("thumbnail" on / "none" off). Saved through api.getMenuPhotos / api.setMenuPhotos.
 */
import React, { useEffect, useState } from "react";

export default function MenuPhotosSwitch({ restaurantId, api, colors }) {
  const [show, setShow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setShow(null);
    setError("");
    api
      .getMenuPhotos(restaurantId)
      .then((data) => {
        if (!cancelled) setShow(data?.show_item_photos !== false);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the photo setting.");
      });
    return () => {
      cancelled = true;
    };
  }, [api, restaurantId]);

  async function toggle() {
    if (show === null || saving) return;
    const next = !show;
    setSaving(true);
    setError("");
    try {
      const data = await api.setMenuPhotos(restaurantId, { show_item_photos: next });
      setShow(data?.show_item_photos ?? next);
    } catch (err) {
      setError(err?.message || "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const on = show === true;
  return (
    <div
      data-testid="menu-photos-switch"
      style={{
        marginBottom: 12,
        border: `1px solid ${colors.line}`,
        borderRadius: 12,
        background: "#fff",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: colors.ink }}>
          Show dish photos on menu
        </span>
        <span style={{ display: "block", fontSize: 12, color: error ? "#b42318" : colors.muted, marginTop: 2 }}>
          {error || "A small photo beside each dish that has one. Dishes without a photo look the same."}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Show dish photos on menu"
        onClick={toggle}
        disabled={show === null || saving}
        style={{
          flexShrink: 0,
          width: 46,
          height: 26,
          borderRadius: 999,
          border: "none",
          padding: 3,
          cursor: show === null || saving ? "default" : "pointer",
          background: on ? colors.accent : "#d0d5dd",
          opacity: show === null || saving ? 0.6 : 1,
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            display: "block",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            transform: on ? "translateX(20px)" : "translateX(0)",
            transition: "transform 0.15s",
          }}
        />
      </button>
    </div>
  );
}
