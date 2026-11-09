/**
 * Compact connection social proof for restaurant / menu-item pages.
 * Renders nothing when logged out, preference OFF, or no eligible signals.
 * Restaurant variant = profile "Your Connects" (2026-10-21): named lines (Wish List, Fav,
 * eaten, plans) + a few recent notes. Never on the public page — Connects-only API.
 * Restaurant rows (Andre 2026-11-09, app layout): each Connect links to their profile and has
 * Invite. Others on Menuply = Connects of Connects set to Anyone, linked to the profile preview.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const SIGNAL_LABELS = [["like", "Fav"], ["wish", "Wish List"], ["eaten", "Been here"], ["plan", "Planning to go"]];

function signalsLabel(signals) {
  const list = Array.isArray(signals) ? signals : [];
  return SIGNAL_LABELS.filter(([key]) => list.includes(key)).map(([, label]) => label).join(" · ");
}

function inviteHref(restaurantId, name) {
  const params = new URLSearchParams({ restaurant_id: String(restaurantId), invitee_name: name });
  return `/account/invite-to-eat?${params.toString()}`;
}

function PersonRow({ person, href, detail, restaurantId }) {
  return (
    <div data-testid={`social-proof-person-${person.user_id}`} style={styles.personRow}>
      <Link to={href} style={styles.person}>
        <DinerAvatar avatarUrl={person.avatar_url} displayName={person.display_name} />
        <span style={styles.personText}>
          <span style={styles.personName}>{person.display_name}</span>
          <span style={styles.personDetail}>{detail}</span>
        </span>
      </Link>
      {restaurantId ? (
        <Link to={inviteHref(restaurantId, person.display_name)} style={styles.invite}>
          Invite
        </Link>
      ) : null}
    </div>
  );
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
        const hasOthers = Array.isArray(data?.others) && data.others.length > 0;
        if (!data?.enabled || (!data?.has_signals && !hasOthers)) {
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

  if (!proof) return null;

  const counts = proof.counts || {};
  const avatars = Array.isArray(proof.avatars) ? proof.avatars : [];
  const overflow = Number(proof.avatar_overflow) || 0;
  const variant = menuItemId ? "menuItem" : "restaurant";
  const recent = Array.isArray(proof.recent) ? proof.recent : [];
  const others = variant === "restaurant" && Array.isArray(proof.others) ? proof.others : [];
  const othersOverflow = Number(proof.others_overflow) || 0;

  return (
    <>
      {proof.has_signals ? (
        <section
          data-testid="connection-social-proof"
          data-variant={variant}
          aria-label="Your Connects"
          style={styles.wrap}
        >
          <h3 style={styles.title}>Your Connects</h3>
          {variant === "restaurant" ? (
            <>
              {avatars.map((peer) => (
                <PersonRow
                  key={peer.user_id}
                  person={peer}
                  href={`/account/connections/${peer.user_id}`}
                  detail={signalsLabel(peer.signals)}
                  restaurantId={restaurantId}
                />
              ))}
              {overflow > 0 ? <p style={styles.more}>+{overflow} more</p> : null}
              <RecentConnectNotes recent={recent} />
            </>
          ) : (
            <>
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
              <SignalLines counts={counts} variant={variant} />
            </>
          )}
        </section>
      ) : null}
      {others.length ? (
        <section data-testid="social-proof-others" aria-label="Others on Menuply" style={styles.wrap}>
          <h3 style={styles.title}>Others on Menuply</h3>
          {others.map((person) => (
            <PersonRow
              key={person.user_id}
              person={person}
              href={`/diners/${person.user_id}`}
              detail="Connect of a Connect · Fav"
            />
          ))}
          {othersOverflow > 0 ? <p style={styles.more}>+{othersOverflow} more</p> : null}
        </section>
      ) : null}
    </>
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
  personRow: { display: "flex", alignItems: "center", gap: 10, padding: "4px 0" },
  person: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" },
  personText: { minWidth: 0, display: "grid" },
  personName: { fontSize: 14, fontWeight: 700, color: "var(--gb-color-ink, #111)" },
  personDetail: { fontSize: 12, color: "var(--gb-color-muted, #666)" },
  // Outlined pill, same as the Invite on a search card's Connect line.
  invite: {
    flexShrink: 0,
    borderRadius: 999,
    padding: "4px 10px",
    border: "1px solid var(--gb-color-accent)",
    color: "var(--gb-color-accent)",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    textDecoration: "none",
  },
  more: { margin: "4px 0 0", fontSize: 13, color: "var(--gb-color-muted, #666)" },
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
