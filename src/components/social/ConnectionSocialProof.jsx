/**
 * Compact connection social proof for restaurant / menu-item pages.
 * Renders nothing when logged out, preference OFF, or no eligible signals.
 * Restaurant variant = profile "Your Connects" (2026-10-21): named lines (Wish List, Fav,
 * eaten, plans) + a few recent notes. Never on the public page — Connects-only API.
 */

import React, { useEffect, useState } from "react";
import {
  fetchRestaurantConnectionSocialProof,
  fetchMenuItemConnectionSocialProof,
} from "../../lib/consumerApi.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import DinerAvatar from "./DinerAvatar.jsx";

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

/** "Maya" · "Maya and Jordan" · "Maya and 2 other Connects" (total = real count from API). */
function whoLabel(names, total) {
  const shown = names.slice(0, 2);
  if (!shown.length) return `${total} ${total === 1 ? "Connect" : "Connects"}`;
  if (total <= shown.length) return shown.join(" and ");
  const others = total - 1;
  return `${shown[0]} and ${others} other ${others === 1 ? "Connect" : "Connects"}`;
}

function RestaurantConnectLines({ counts, avatars }) {
  const namesFor = (signal) =>
    avatars.filter((a) => Array.isArray(a.signals) && a.signals.includes(signal)).map((a) => a.display_name);
  const line = (signal, icon, one, many) => {
    const total = Number(counts[signal]) || 0;
    if (total <= 0) return null;
    const who = whoLabel(namesFor(signal), total);
    return { key: signal, text: `${icon} ${who} ${total === 1 ? one : many}` };
  };
  const lines = [
    line("wish", "🔖", "has this on their Wish List", "have this on their Wish List"),
    line("like", "❤️", "has this as a Fav", "have this as a Fav"),
    line("eaten", "🍽️", "has eaten here", "have eaten here"),
    line("plan", "📅", "plans to eat here", "plan to eat here"),
  ].filter(Boolean);
  return lines.map((l) => (
    <p key={l.key} data-testid={`your-connects-${l.key}`} style={styles.signalLine}>
      {l.text}
    </p>
  ));
}

function RecentConnectNotes({ recent }) {
  if (!recent.length) return null;
  return (
    <ul data-testid="your-connects-recent" style={styles.recentList}>
      {recent.map((entry, i) => (
        <li key={`${entry.user_id}-${i}`} style={styles.recentRow}>
          <span style={styles.recentName}>{entry.display_name}</span>
          {entry.food_name ? <span>{` had ${entry.food_name}`}</span> : null}
          {entry.comment ? <span style={styles.recentNote}>{` “${entry.comment}”`}</span> : null}
        </li>
      ))}
    </ul>
  );
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
      aria-label="Your Connects"
      style={styles.wrap}
    >
      <h3 style={styles.title}>Your Connects</h3>
      <div style={styles.avatarRow} aria-hidden={avatars.length === 0}>
        {avatars.map((peer) => (
          <DinerAvatar
            key={peer.user_id}
            avatarUrl={peer.avatar_url}
            displayName={peer.display_name}
          />
        ))}
        {overflow > 0 ? <span style={styles.overflow}>+{overflow}</span> : null}
      </div>
      {variant === "restaurant" ? (
        <>
          <RestaurantConnectLines counts={counts} avatars={avatars} />
          <RecentConnectNotes recent={Array.isArray(proof.recent) ? proof.recent : []} />
        </>
      ) : (
        <SignalLines counts={counts} variant={variant} />
      )}
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
  recentList: {
    listStyle: "none",
    margin: "10px 0 0",
    padding: "10px 0 0",
    borderTop: "1px solid var(--gb-color-border, rgba(0,0,0,0.08))",
    display: "grid",
    gap: 6,
  },
  recentRow: {
    fontSize: 13,
    lineHeight: 1.45,
    color: "var(--gb-color-ink-soft, #333)",
  },
  recentName: {
    fontWeight: 700,
    color: "var(--gb-color-ink, #111)",
  },
  recentNote: {
    fontStyle: "italic",
  },
};
