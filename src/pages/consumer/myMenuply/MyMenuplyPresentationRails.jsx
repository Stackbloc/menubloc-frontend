/**
 * Exhibit-style presentation rails — stats, My Highlights, follows.
 * My Highlights = diner-owned pinned photos + videos (Instagram-style grid preview).
 * Connects live in the stats chip → hub focus (no duplicate avatar strip).
 */

import { Link } from "react-router-dom";
import DinerStatsBar from "./DinerStatsBar.jsx";
import MyMenuplyHubFocus from "./MyMenuplyHubFocus.jsx";
import MyHighlightsGrid from "./MyHighlightsGrid.jsx";
import { WantToEatList } from "./myMenuplyBits.jsx";
import SectionHeader, { PROFILE_SECTION_HEADERS } from "./SectionHeader.jsx";
import * as s from "./myMenuplyStyles.js";

function FollowedRestaurantsRail({ restaurants = [] }) {
  const list = Array.isArray(restaurants) ? restaurants : [];
  return (
    <div style={s.presentationBlock} data-testid="followed-restaurants-rail">
      <SectionHeader
        {...PROFILE_SECTION_HEADERS.favs}
        count={list.length}
        testId="my-favs-section-header"
      />
      {list.length === 0 ? null : (
      <div style={railStyles.scrollRow}>
        {list.map((row) => (
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
      )}
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
  homeDishes = [],
  events = [],
  eventGroups = [],
  viewerUserId = null,
  showFoodStoryCta = false,
  onLogFood,
  readOnly = false,
  onHighlightDelete,
  highlightDeleteBusy = false,
  onHighlightAdd,
  onHighlightSave,
  highlightSaveBusy = false,
  pendingHighlightCount = 0,
  highlightsSeeAllHref,
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
        homeDishes={homeDishes}
        events={events}
        eventGroups={eventGroups}
        viewerUserId={viewerUserId}
      />
      <MyHighlightsGrid
        cards={highlights}
        readOnly={readOnly}
        onDelete={readOnly ? undefined : onHighlightDelete}
        deleteBusy={highlightDeleteBusy}
        onAdd={readOnly ? undefined : onHighlightAdd}
        onSave={readOnly ? undefined : onHighlightSave}
        saveBusy={highlightSaveBusy}
        pendingCount={pendingHighlightCount}
        preview
        seeAllHref={highlightsSeeAllHref}
      />
      {hubFocus !== "restaurants" ? (
        <FollowedRestaurantsRail restaurants={followedRestaurants} />
      ) : null}
      {showFoodStoryCta && !readOnly ? <FoodStoryCta /> : null}
      {wantSuggestions.length > 0 && hubFocus !== "dishes" && !readOnly ? (
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
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #d1fae5",
    boxShadow: "0 8px 22px rgba(20, 83, 45, 0.1)",
  },
  visitImg: {
    width: "100%",
    height: 100,
    objectFit: "cover",
    display: "block",
    background: "#ecfdf5",
  },
  visitPlaceholder: {
    width: "100%",
    height: 100,
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    background: "linear-gradient(180deg, #ecfdf5, #d1fae5)",
  },
  visitCopy: {
    padding: "8px 10px 10px",
  },
  visitName: {
    fontWeight: 800,
    fontSize: 13,
    color: "#14532d",
    lineHeight: 1.25,
  },
  visitMeta: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
  },
  ctaCard: {
    marginTop: 28,
    padding: "16px 18px",
    borderRadius: 16,
    background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)",
    border: "1px solid #d1fae5",
  },
  ctaScript: {
    margin: 0,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 18,
    fontWeight: 700,
    color: "#14532d",
  },
  ctaBody: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.4,
  },
};
