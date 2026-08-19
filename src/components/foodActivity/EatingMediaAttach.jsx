/**
 * Photo or video attach for eating posts — profile compose row.
 */

import { useEffect, useState } from "react";
import ConsumerCameraPickButton from "../consumer/ConsumerCameraPickButton.jsx";
import { isVideoFile } from "../../lib/eatingMediaUtils.js";
import * as cs from "./foodActivityComposeStyles.js";

export default function EatingMediaAttach({
  disabled = false,
  file,
  onFileChange,
  previewUrl = "",
  previewKind = "",
  testId = "eating-media-attach",
}) {
  const [localPreview, setLocalPreview] = useState("");
  const isVideo = isVideoFile(file) || previewKind === "video";

  useEffect(() => {
    if (!file) {
      setLocalPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = localPreview || previewUrl || "";

  function clear() {
    onFileChange(null);
  }

  function pick(nextFile) {
    onFileChange(nextFile || null);
  }

  return (
    <div data-testid={testId} style={cs.actionRow}>
      {shown ? (
        <>
          {isVideo ? (
            <video
              src={shown}
              style={cs.mediaThumb}
              controls
              playsInline
              preload="metadata"
              data-testid="eating-media-preview"
            />
          ) : (
            <img src={shown} alt="" style={cs.mediaThumb} data-testid="eating-media-preview" />
          )}
          <ConsumerCameraPickButton
            mode="photo"
            facingMode="environment"
            onFile={pick}
            disabled={disabled}
            testId="eating-media-replace-photo"
            ariaLabel="Replace with photo"
            showLibraryLink
            libraryLinkStyle={cs.libraryLink}
            buttonStyle={cs.photoBtn}
          >
            Photo
          </ConsumerCameraPickButton>
          <ConsumerCameraPickButton
            mode="video"
            facingMode="environment"
            onFile={pick}
            disabled={disabled}
            testId="eating-media-replace-video"
            ariaLabel="Replace with video"
            showLibraryLink={false}
            buttonStyle={cs.photoBtn}
          >
            Video
          </ConsumerCameraPickButton>
          <button type="button" style={cs.textAction} disabled={disabled} onClick={clear}>
            Remove
          </button>
        </>
      ) : (
        <>
          <ConsumerCameraPickButton
            mode="photo"
            facingMode="environment"
            onFile={pick}
            disabled={disabled}
            testId="eating-media-add-photo"
            ariaLabel="Add photo"
            showLibraryLink
            libraryLinkStyle={cs.libraryLink}
            buttonStyle={cs.photoBtn}
          >
            Photo
          </ConsumerCameraPickButton>
          <ConsumerCameraPickButton
            mode="video"
            facingMode="environment"
            onFile={pick}
            disabled={disabled}
            testId="eating-media-add-video"
            ariaLabel="Add video"
            showLibraryLink={false}
            buttonStyle={cs.photoBtn}
          >
            Video
          </ConsumerCameraPickButton>
        </>
      )}
    </div>
  );
}
