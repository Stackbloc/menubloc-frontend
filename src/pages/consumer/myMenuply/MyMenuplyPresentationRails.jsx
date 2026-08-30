/**
 * Exhibit-style presentation rails — stats, highlights, follows, connections.
 * Input-free; restaurant data fills sparse user diaries honestly.
 */

import { Link } from "react-router-dom";
import { MY_MENUPLY_PROFILE_PATH } from "../../../lib/myMenuplyRoutes.js";
import DinerStatsBar from "./DinerStatsBar.jsx";
import MyMenuplyHubFocus from "./MyMenuplyHubFocus.jsx";
import { WantToEatList } from "./myMenuplyBits.jsx";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import * as s from "./myMenuplyStyles.js";

function ConnectionAvatarStrip({ connections = [], viewerUserId = null }) {
  const rows = (connections || []).slice(0, 8);
  if (!rows.length) return null;

  return (
    <div style={railStyles.connectionsWrap} data-testid="connections-avatar-strip">
      <div style={railStyles.connectionsHead}>
        <span style={railStyles.connectionsTitle}>Connects</span>
      </div>
      <div style={railStyles.avatarRow}>
        {rows.map((c) => {
          const peerId = c.peer?.id;
          const name = c.peer?.display_name || "Friend";
          if (!peerId) return null;
          const isSelf = viewerUserId != null && Number(peerId) === Number(viewerUserId);
          const initial = String(name).trim().slice(0, 1).toUpperCase() || "?";
          return (
            <Link
              key={c.id || peerId}
              to={isSelf ? MY_MENUPLY_PROFILE_PATH : `/account/connections/${encodeURIComponent(String(peerId))}`}
              style={railStyles.avatarLink}
              title={name}
            >
              <span style={railStyles.avatarRing}>
                <span style={railStyles.avatarCircle}>{initial}</span>
              </span>
              <span style={railStyles.avatarName}>{name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function HighlightCard({ card, large = false, readOnly = false, onDelete, deleteBusy = false }) {
  const canDelete = !readOnly && card?.deleteKind && typeof onDelete === "function";
  const { open, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);

  // Stills only — diary videos are not recycled into Top Highlights.
  const body = (
    <>
      <div style={{ ...railStyles.highlightMedia, ...(large ? railStyles.highlightMediaLarge : null) }}>
        {card.image ? (
          <img src={card.image} alt="" style={railStyles.highlightImg} loading="lazy" />
        ) : (
          <div style={railStyles.highlightPlaceholder}>🍽</div>
        )}
        <span style={railStyles.highlightBadge}>{card.badge}</span>
      </div>
      <div style={railStyles.highlightCopy}>
        <div style={railStyles.highlightTitle}>{card.label}</div>
        {card.sublabel ? <div style={railStyles.highlightMeta}>{card.sublabel}</div> : null}
      </div>
    </>
  );

  const cardStyle = { ...railStyles.highlightCard, ...(large ? railStyles.highlightCardLarge : null) };
  let main;
  if (card.href) {
    main = (
      <Link
        to={card.href}
        style={cardStyle}
        data-testid="top-highlight-link"
        onClick={(e) => {
          if (consumeArmedClick() || open) {
            e.preventDefault();
            dismiss();
          }
        }}
      >
        {body}
      </Link>
    );
  } else {
    main = (
      <div style={cardStyle} data-testid="top-highlight-body">
        {body}
      </div>
    );
  }

  return (
    <div
      style={{ position: "relative", ...(large ? { height: "100%" } : null) }}
      data-testid="top-highlight-item"
      {...bind}
    >
      {main}
      {open ? (
        <button
          type="button"
          style={s.mealHolderDelete}
          data-testid="top-highlight-delete"
          aria-label={`Delete ${card.label}`}
          disabled={deleteBusy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (deleteBusy) return;
            dismiss();
            onDelete?.(card);
          }}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

function TopHighlightsGrid({ cards = [], readOnly = false, onDelete, deleteBusy = false }) {
  if (!cards.length) return null;
  const [hero, ...rest] = cards;
  return (
    <div style={s.presentationBlock} data-testid="top-highlights">
      <h3 style={s.displaySectionTitle}>Top highlights</h3>
      <div style={railStyles.highlightGrid}>
        <HighlightCard
          card={hero}
          large
          readOnly={readOnly}
          onDelete={onDelete}
          deleteBusy={deleteBusy}
        />
        <div style={railStyles.highlightStack}>
          {rest.map((card) => (
            <HighlightCard
              key={card.key}
              card={card}
              readOnly={readOnly}
              onDelete={onDelete}
              deleteBusy={deleteBusy}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FollowedRestaurantsRail({ restaurants = [] }) {
  if (!restaurants.length) return null;
  return (
    <div style={s.presentationBlock} data-testid="followed-restaurants-rail">
      <h3 style={s.displaySectionTitle}>Restaurants you follow</h3>
      <div style={railStyles.scrollRow}>
        {restaurants.map((row) => (
          <Link key={row.key} to={row.href || "#"} style={railStyles.visitCard}>
            {row.image ? (
              <img src={row.image} alt="" style={railStyles.visitImg} loading="lazy" />
            ) : (
              <div style={railStyles.visitPlaceholder}>🏪</div>
            )}
            <div style={railStyles.visitCopy}>
              <div style={railStyles.visitName}>{row.name}</div>
              {row.place ? <div style={railStyles.visitMeta}>{row.place}</div> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FoodStoryCta() {
  return (
    <div style={railStyles.ctaCard} data-testid="food-story-cta">
      <p style={railStyles.ctaScript}>Your food story</p>
      <p style={railStyles.ctaBody}>
        Use the ✕ button below to share What I&apos;m Eating, wants, plans, and more.
      </p>
    </div>
  );
}

export default function MyMenuplyPresentationRails({
  stats = [],
  hubFocus = "",
  onHubFocusChange,
  highlights = [],
  followedRestaurants = [],
  wantSuggestions = [],
  connections = [],
  followed = [],
  liked = [],
  eating = [],
  events = [],
  eventGroups = [],
  viewerUserId = null,
  showFoodStoryCta = false,
  onLogFood,
  readOnly = false,
  onHighlightDelete,
  highlightDeleteBusy = false,
}) {
  void onLogFood;
  return (
    <>
      <DinerStatsBar stats={stats} selectedId={hubFocus} onSelect={onHubFocusChange} />
      <MyMenuplyHubFocus
        focusId={hubFocus}
        connections={connections}
        followed={followed}
        liked={liked}
        eating={eating}
        events={events}
        eventGroups={eventGroups}
        viewerUserId={viewerUserId}
      />
      {hubFocus !== "connects" ? (
        <ConnectionAvatarStrip connections={connections} viewerUserId={viewerUserId} />
      ) : null}
      <TopHighlightsGrid
        cards={highlights}
        readOnly={readOnly}
        onDelete={readOnly ? undefined : onHighlightDelete}
        deleteBusy={highlightDeleteBusy}
      />
      {hubFocus !== "restaurants" ? (
        <FollowedRestaurantsRail restaurants={followedRestaurants} />
      ) : null}
      {showFoodStoryCta && !readOnly ? <FoodStoryCta /> : null}
      {wantSuggestions.length > 0 && hubFocus !== "dishes" ? (
        <div style={s.presentationBlock} data-testid="want-suggestions-rail">
          <h3 style={s.displaySectionTitle}>Dishes you saved</h3>
          <p style={{ ...s.muted, margin: "0 0 10px", fontSize: 13 }}>
            From menus you follow — add them to your want list anytime.
          </p>
          <WantToEatList items={wantSuggestions} readOnly layout="scroll" limit={8} />
        </div>
      ) : null}
    </>
  );
}

const railStyles = {
  connectionsWrap: {
    marginTop: 18,
    padding: "14px 14px 12px",
    borderRadius: 16,
    background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 72%)",
    border: "1px solid #bbf7d0",
    boxShadow: "0 4px 18px rgba(20, 83, 45, 0.08)",
  },
  connectionsHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  connectionsTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#14532d",
    letterSpacing: "-0.02em",
  },
  connectionsLink: {
    fontSize: 13,
    fontWeight: 700,
    color: "#15803d",
    textDecoration: "none",
  },
  avatarRow: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 4,
  },
  avatarLink: {
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    textDecoration: "none",
    color: "inherit",
    minWidth: 56,
  },
  avatarRing: {
    padding: 3,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #15803d)",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#fff",
    color: "#14532d",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 18,
  },
  avatarName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#334155",
    maxWidth: 64,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  highlightGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 10,
    alignItems: "stretch",
  },
  highlightStack: {
    display: "grid",
    gap: 10,
  },
  highlightCard: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #d1fae5",
    boxShadow: "0 8px 22px rgba(20, 83, 45, 0.1)",
  },
  highlightCardLarge: {
    minHeight: "100%",
  },
  highlightMedia: {
    position: "relative",
    height: 120,
    background: "#ecfdf5",
  },
  highlightMediaLarge: {
    height: 252,
  },
  highlightImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  highlightPlaceholder: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    fontSize: 36,
    background: "linear-gradient(180deg, #ecfdf5, #d1fae5)",
  },
  highlightBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(20, 83, 45, 0.88)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  highlightCopy: {
    padding: "10px 12px 12px",
  },
  highlightTitle: {
    fontWeight: 800,
    fontSize: 14,
    color: "#14532d",
    lineHeight: 1.25,
  },
  highlightMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  },
  scrollRow: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 4,
  },
  visitCard: {
    flex: "0 0 140px",
    width: 140,
    textDecoration: "none",
    color: "inherit",
    borderRadius: 14,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #d1fae5",
    boxShadow: "0 6px 18px rgba(20, 83, 45, 0.08)",
  },
  visitImg: {
    width: "100%",
    height: 100,
    objectFit: "cover",
    display: "block",
    background: "#ecfdf5",
  },
  visitPlaceholder: {
    height: 100,
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    background: "linear-gradient(180deg, #ecfdf5, #f0fdf4)",
  },
  visitCopy: {
    padding: "10px 10px 12px",
  },
  visitName: {
    fontWeight: 800,
    fontSize: 13,
    color: "#14532d",
    lineHeight: 1.25,
  },
  visitMeta: {
    marginTop: 4,
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
  },
  ctaCard: {
    marginTop: 24,
    padding: "18px 16px",
    borderRadius: 18,
    background: "linear-gradient(135deg, #14532d 0%, #166534 55%, #15803d 100%)",
    color: "#fff",
    boxShadow: "0 10px 28px rgba(20, 83, 45, 0.28)",
  },
  ctaScript: {
    margin: "0 0 6px",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 26,
    fontWeight: 700,
    fontStyle: "italic",
    lineHeight: 1.15,
  },
  ctaBody: {
    margin: "0 0 14px",
    fontSize: 14,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.9)",
  },
};
