import MenuplyMediaPicker from "../social/MenuplyMediaPicker.jsx";

/**
 * @deprecated Prefer MenuplyMediaPicker directly. Native camera/library picker only.
 */
export default function ConsumerCameraPickButton({
  mode = "photo",
  facingMode = "environment",
  onFile,
  disabled = false,
  children,
  testId,
  ariaLabel,
  buttonStyle = {},
  showLibraryLink = true,
  libraryLinkStyle,
}) {
  void showLibraryLink;
  void libraryLinkStyle;
  void children;

  return (
    <MenuplyMediaPicker
      onFile={onFile}
      disabled={disabled}
      facingMode={facingMode}
      allowPhoto={mode !== "video"}
      allowVideo={mode === "video"}
      testId={testId || "consumer-camera-pick"}
      ariaLabel={ariaLabel || "Add photo or video"}
      showPreview={false}
      iconStyle={buttonStyle}
    />
  );
}
