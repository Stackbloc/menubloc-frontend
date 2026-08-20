/**
 * Compact connection social proof for restaurant / menu-item pages.
 * Renders nothing when logged out, preference OFF, or no eligible signals.
 */

import React, { useEffect, useState } from "react";
import {
  fetchRestaurantConnectionSocialProof,
  fetchMenuItemConnectionSocialProof,
  resolveConsumerMediaUrl,
} from "../../lib/consumerApi.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function SignalLines({ counts, variant }) {
  const lines = [];
  if (counts.like > 0) {
    lines.push(
      variant === "menuItem"
        ? `❤️ ${counts.like} like${counts.like === 1 ? "s" : ""} this item`
        : `❤️ ${counts.like} like${counts.like === 1 ? "s" : ""} this restaurant`
    );
  }
  if (counts.eaten > 0) {
    lines.push(
      variant === "menuItem"
        ? `🍽️ ${counts.eaten} ${counts.eaten === 1 ? "has" : "have"} eaten this`
        : `🍽️ ${counts.eaten} ${counts.eaten === 1 ? "has" : "have"} eaten here`
    );
  }
  if (counts.plan > 0) {
    lines.push(`📅 ${counts.plan} ${counts.plan === 1 ? "plans" : "plan"} to eat here`);
  }
  if (variant === "menuItem" && counts.posted > 0) {
    lines.push(`📸 ${counts.posted} posted this item`);
  }
  return lines.map((line) => (
    <p key={line} style={styles.signalLine}>
      {line}
    </p>
  ));
}

/**
 * @param {{ restaurantId?: number|string|null, menuItemId?: number|string|null }} props
 */
export default function ConnectionSocialProof({ restaurantId = null, menuItemId = null }) {
  const { isAuthenticated } = useConsumer();
  const [proof, setProof] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) {
      setProof(null);
      return undefined;
    }
    if (!restaurantId && !menuItemId) {
      setProof(null);
      return undefined;
    }

    const load = menuItemId
      ? fetchMenuItemConnectionSocialProof(menuItemId)
      : fetchRestaurantConnectionSocialProof(restaurantId);

    load
      .then((data) => {
        if (cancelled) return;
        if (!data?.enabled || !data?.has_signals) {
          setProof(null);
          return;
        }
        setProof(data);
      })
      .catch(() => {
        if (!cancelled) setProof(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, restaurantId, menuItemId]);

  if (!proof?.has_signals) return null;

  const counts = proof.counts || {};
  const avatars = Array.isArray(proof.avatars) ? proof.avatars : [];
  const overflow = Number(proof.avatar_overflow) || 0;
  const variant = menuItemId ? "menuItem" : "restaurant";

  return (
    <section
      data-testid="connection-social-proof"
      data-variant={variant}
      aria-label="Your connections"
      style={styles.wrap}
    >
      <h3 style={styles.title}>Your connections</h3>
      <div style={styles.avatarRow} aria-hidden={avatars.length === 0}>
        {avatars.map((peer) => {
          const url = peer.avatar_url ? resolveConsumerMediaUrl(peer.avatar_url) : "";
          return (
            <div
              key={peer.user_id}
              title={peer.display_name || "Connection"}
              style={styles.avatar}
            >
              {url ? (
                <img src={url} alt="" style={styles.avatarImg} loading="lazy" />
              ) : (
                <span style={styles.avatarInitials}>{initials(peer.display_name)}</span>
              )}
            </div>
          );
        })}
        {overflow > 0 ? <span style={styles.overflow}>+{overflow}</span> : null}
      </div>
      <SignalLines counts={counts} variant={variant} />
    </section>
  );
}

const styles = {
  wrap: {
    margin: "16px 0",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--gb-color-border, rgba(0,0,0,0.08))",
    background: "var(--gb-color-surface-strong, #fff)",
  },
  title: {
    margin: "0 0 10px",
    fontSize: 15,
    fontWeight: 700,
    color: "var(--gb-color-ink, #111)",
  },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    minHeight: 32,
  },
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
  overflow: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--gb-color-muted, #666)",
    marginLeft: 4,
  },
  signalLine: {
    margin: "2px 0",
    fontSize: 13,
    color: "var(--gb-color-ink-soft, #333)",
  },
};
