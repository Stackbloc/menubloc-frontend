import { Link } from "react-router-dom";
import { WALL_THEMES, wallStyle, wallSurfaceStyle } from "../../lib/clusterWallStyles.js";
import { WallInscription } from "./WallBlockTile.jsx";
import "./clusterWall.css";

/**
 * A Cluster Wall post in a profile's Clips & Media grid (Andre 2026-11-05: "a user's wall post showed
 * on his profile page under Clips and Media"). Words on their surface, or the clip's thumbnail; a small
 * "USC Wall" tag; tap opens the post page (/wall/:id). Fills the grid cell it's put in.
 */
export default function WallProfileTile({ item, style }) {
  const block = item?.wall;
  if (!block?.path) return null;
  const s = wallStyle(block.style);
  const isClip = block.kind === "video";
  const inReview = block.is_mine && block.status && block.status !== "published";
  const tag = `${block.cluster_label || "Menuply"} Wall`;
  const label = isClip ? `${tag} clip${block.body ? `: ${block.body}` : ""}` : `${tag}: ${block.body}`;
  return (
    <Link
      to={block.path}
      aria-label={label}
      className="cw-profile-tile"
      data-testid={`profile-wall-${block.public_id}`}
      style={{ ...(isClip ? { background: "#111827" } : wallSurfaceStyle(s.theme)), ...style }}
    >
      {isClip ? (
        <>
          {block.poster_url ? <img src={block.poster_url} alt="" loading="lazy" /> : null}
          <span className="cw-profile-play" aria-hidden="true">
            ▶
          </span>
        </>
      ) : (
        <WallInscription block={{ ...block, size: "small" }} scale={1.6} style={{ inset: "22px 8px 10px" }} />
      )}
      <span className="cw-profile-tag" style={isClip ? undefined : { color: WALL_THEMES[s.theme].ink }}>
        {tag}
      </span>
      {inReview ? <span className="cw-profile-review">In review</span> : null}
    </Link>
  );
}
