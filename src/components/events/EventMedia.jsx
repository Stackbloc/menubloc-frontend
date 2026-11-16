/**
 * An event's clip or photo (Andre 2026-11-16: diners record a 20-second clip on an event in the app).
 * The server keeps one: video_url wins over photo_url.
 */

export function EventMedia({ event, style = null }) {
  const video = event?.video_url || null;
  const photo = video ? null : event?.photo_url || null;
  if (video) {
    return (
      <video
        src={video}
        controls
        playsInline
        loop
        preload="metadata"
        aria-label="Event clip"
        data-testid="event-clip"
        style={{ ...styles.media, ...(style || {}) }}
      />
    );
  }
  if (photo) {
    return <img src={photo} alt="" data-testid="event-photo" style={{ ...styles.media, ...(style || {}) }} />;
  }
  return null;
}

/** Small square for event lists: the clip's first frame with a ▶, or the photo. */
export function EventThumb({ videoUrl, photoUrl }) {
  if (videoUrl) {
    return (
      <span style={styles.thumbWrap} data-testid="event-clip-thumb">
        <video src={`${videoUrl}#t=0.1`} muted playsInline preload="metadata" aria-hidden="true" style={styles.thumb} />
        <span style={styles.play} aria-hidden="true">▶</span>
      </span>
    );
  }
  if (photoUrl) {
    return (
      <span style={styles.thumbWrap}>
        <img src={photoUrl} alt="" style={styles.thumb} />
      </span>
    );
  }
  return null;
}

const styles = {
  media: {
    display: "block",
    width: "100%",
    maxHeight: 460,
    objectFit: "cover",
    borderRadius: 14,
    background: "#111827",
    margin: "12px 0",
  },
  thumbWrap: {
    position: "relative",
    flex: "0 0 auto",
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    background: "#111827",
  },
  thumb: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  play: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 16,
    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
  },
};
