/**
 * Diner avatar: photo when present, otherwise initials on the brand gradient.
 * Shared by Connection social proof and search social lines.
 */

import React from "react";
import { resolveConsumerMediaUrl } from "../../lib/consumerApi.js";

export function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export default function DinerAvatar({ avatarUrl, displayName, size = 32, title }) {
  const url = avatarUrl ? resolveConsumerMediaUrl(avatarUrl) : "";
  return (
    <div
      title={title === undefined ? displayName || "Connection" : title || undefined}
      style={{ ...styles.avatar, width: size, height: size }}
    >
      {url ? (
        <img src={url} alt="" style={styles.avatarImg} loading="lazy" />
      ) : (
        <span style={{ ...styles.avatarInitials, fontSize: Math.round(size * 0.34) }}>
          {initials(displayName)}
        </span>
      )}
    </div>
  );
}

const styles = {
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "2px solid #fff",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
  },
};
