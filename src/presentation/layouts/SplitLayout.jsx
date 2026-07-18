import React from "react";
import { PRESENTATION_THEME } from "../theme.js";
import SlideMedia from "../components/SlideMedia.jsx";

/** Text + full-height media split. */
export default function SplitLayout({
  headline,
  subcopy,
  media,
  mediaSrc,
  mediaAlt = "",
  mediaPlaceholder,
  mediaOn = "right",
  background = PRESENTATION_THEME.white,
  ink = PRESENTATION_THEME.ink,
  style,
}) {
  const dark = background === PRESENTATION_THEME.black;
  const textBlock = (
    <div
      style={{
        flex: "1 1 46%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "clamp(28px, 6vw, 72px)",
        boxSizing: "border-box",
        color: ink,
      }}
    >
      {headline ? (
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4.6vw, 56px)",
            lineHeight: 1.08,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          {headline}
        </h1>
      ) : null}
      {subcopy ? (
        <p
          style={{
            margin: "18px 0 0",
            fontSize: "clamp(15px, 1.8vw, 20px)",
            lineHeight: 1.45,
            color: dark ? PRESENTATION_THEME.inkOnDarkMuted : PRESENTATION_THEME.inkMuted,
            fontWeight: 600,
            maxWidth: 520,
          }}
        >
          {subcopy}
        </p>
      ) : null}
    </div>
  );

  const mediaBlock = (
    <div
      style={{
        flex: "1 1 54%",
        minWidth: 0,
        minHeight: 220,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {media || (
        <SlideMedia
          src={mediaSrc}
          alt={mediaAlt}
          placeholderLabel={mediaPlaceholder}
          style={{ position: "absolute", inset: 0 }}
        />
      )}
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        display: "flex",
        flexDirection: mediaOn === "left" ? "row-reverse" : "row",
        boxSizing: "border-box",
        ...style,
      }}
      className="mp-split-layout"
    >
      {textBlock}
      {mediaBlock}
      <style>{`
        @media (max-width: 820px) {
          .mp-split-layout {
            flex-direction: column !important;
          }
          .mp-split-layout > div:last-child {
            flex: 1 1 42% !important;
          }
        }
      `}</style>
    </div>
  );
}
