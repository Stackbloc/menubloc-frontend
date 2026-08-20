/**
 * Photo or video attach — camera icon, native picker, preview.
 */

import MenuplyMediaPicker from "../social/MenuplyMediaPicker.jsx";
import * as cs from "./foodActivityComposeStyles.js";

export default function EatingMediaAttach({
  disabled = false,
  file,
  onFileChange,
  previewUrl = "",
  previewKind = "",
  testId = "eating-media-attach",
  facingMode = "environment",
}) {
  function pick(nextFile) {
    onFileChange(nextFile || null);
  }

  const hasExisting = Boolean(previewUrl) && !file;

  return (
    <div data-testid={testId} style={cs.actionRow}>
      <MenuplyMediaPicker
        file={file}
        onFile={pick}
        onClear={() => pick(null)}
        disabled={disabled}
        facingMode={facingMode}
        allowPhoto
        allowVideo
        testId={testId}
        ariaLabel="Add photo or video"
        showPreview={Boolean(file)}
      />
      {hasExisting ? (
        <span style={cs.libraryLink} data-testid="eating-media-existing">
          Media attached
        </span>
      ) : null}
    </div>
  );
}
