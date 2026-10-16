/**
 * Crawlable link from a Feed reel to its dedicated watch page (/videos/:kind/:id).
 * /feed is a multi-video surface, so Google needs this link to find the watch page,
 * which server-renders the live VideoObject (title, thumbnail, etc. as currently saved).
 * Visually hidden: Feed layout is unchanged; screen readers and keyboard users still get it.
 */
import { Link } from "react-router-dom";
import { videoWatchPath } from "../../../lib/seo/jsonLdBuilders.js";

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function FeedVideoWatchLink({ kind, id, label }) {
  const path = videoWatchPath(kind, id);
  if (!path) return null;
  const text = String(label || "").trim();
  return (
    <Link to={path} style={visuallyHidden} data-testid="feed-video-watch-link">
      {text ? `Watch video: ${text}` : "Watch this video"}
    </Link>
  );
}
