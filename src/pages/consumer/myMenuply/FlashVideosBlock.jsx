/**
 * Flash Video — short personality clips on About Me (human element, not Feed).
 */

import { useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import * as s from "./myMenuplyStyles.js";

const MAX_FLASH = 3;

function FlashClip({ item, readOnly, busy, onRemove }) {
  const src = resolveConsumerMediaUrl(item?.media_url || "");
  const canDelete = !readOnly && typeof onRemove === "function";
  const { open, dismiss, bind } = useLongPressReveal(canDelete);

  if (!src) return null;

  return (
    <div style={flash.clip} data-testid="flash-video-item" {...bind}>
      <video src={src} style={flash.video} controls playsInline preload="metadata" />
      {open ? (
        <button
          type="button"
          style={s.mealHolderDelete}
          data-testid="flash-video-delete"
          aria-label="Delete Flash Video"
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (busy) return;
            dismiss();
            onRemove?.(item);
          }}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

/** Clips shown with occupation / hobbies (human element). */
export function FlashVideosDisplay({
  items = [],
  readOnly = false,
  busy = false,
  onRemove,
}) {
  const rows = Array.isArray(items) ? items.filter((i) => i?.media_url) : [];
  if (!rows.length) return null;

  return (
    <div style={flash.display} data-testid="flash-videos-display">
      <p style={flash.displayLabel}>Flash Video</p>
      <div style={flash.row}>
        {rows.map((item) => (
          <FlashClip
            key={item.id}
            item={item}
            readOnly={readOnly}
            busy={busy}
            onRemove={onRemove}
          />
        ))}
      </div>
      {!readOnly ? (
        <p style={flash.hintMuted}>Long-press a clip to delete.</p>
      ) : null}
    </div>
  );
}

/** Add control under hobbies in Personal details editor. */
export function FlashVideosEditorField({
  items = [],
  busy = false,
  error = "",
  onAddFile,
  onRemove,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const count = Array.isArray(items) ? items.length : 0;
  const atLimit = count >= MAX_FLASH;

  return (
    <div style={flash.editorField} data-testid="flash-video-editor">
      <span style={s.personalContextLabel}>Flash Video</span>
      <p style={flash.hint}>
        Optional short clip about you — thoughts, personality, anything human. Not a Feed post.
        Up to {MAX_FLASH}.
      </p>

      {count ? (
        <div style={{ ...flash.row, marginBottom: 8 }}>
          {items.map((item) => (
            <FlashClip
              key={item.id}
              item={item}
              readOnly={false}
              busy={busy}
              onRemove={onRemove}
            />
          ))}
        </div>
      ) : null}

      {error ? <p style={s.error}>{error}</p> : null}

      {!atLimit ? (
        pickerOpen ? (
          <MenuplyMediaPicker
            key="flash-video-picker"
            onFile={(file) => {
              setPickerOpen(false);
              onAddFile?.(file);
            }}
            disabled={busy}
            facingMode="user"
            source="camera"
            allowPhoto={false}
            allowVideo
            showPreview={false}
            openOnMount
            testId="flash-video-picker"
            ariaLabel="Record or upload Flash Video"
          />
        ) : (
          <button
            type="button"
            data-testid="flash-video-add"
            style={flash.addBtn}
            disabled={busy}
            onClick={() => setPickerOpen(true)}
          >
            Add Flash Video
          </button>
        )
      ) : (
        <p style={flash.hintMuted}>Flash Video limit reached ({MAX_FLASH}).</p>
      )}
    </div>
  );
}

const flash = {
  display: {
    marginTop: 8,
  },
  displayLabel: {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 700,
    color: "#475467",
    letterSpacing: "0.02em",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  clip: {
    position: "relative",
    width: 112,
    aspectRatio: "3 / 4",
    borderRadius: 10,
    overflow: "hidden",
    background: "#0f172a",
    flexShrink: 0,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  editorField: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: 4,
  },
  hint: {
    margin: "0 0 6px",
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.4,
  },
  hintMuted: {
    margin: "4px 0 0",
    fontSize: 11,
    color: "#94a3b8",
  },
  addBtn: {
    alignSelf: "flex-start",
    appearance: "none",
    border: "1.5px solid #d1d5db",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
