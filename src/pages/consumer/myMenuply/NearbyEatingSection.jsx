/**
 * Who's Eating — continuous-line scan rows (max 8 + Show more).
 * [avatar] ScreenName, Sex, Age is eating [meal] at [restaurant|@home], [food]
 * Catch Me Connect notices: "[Name] is in [city] today|this week|this month. Invite …?" + Hide
 * Happy Hour (subject): Edit "You are going to Happy Hour…"; Profile "Name is going…"
 * Liberal market discovery (no favorite-food filter); excludes viewer.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchWantDiscovery,
  listSeeWhosEating,
  resolveConsumerMediaUrl,
} from "../../../lib/consumerApi.js";
import {
  hideCatchMeNotice,
  isCatchMeNoticeHidden,
} from "../../../lib/catchMeNoticeDismiss.js";
import {
  formatWhosEatingDiscoveryLine,
  formatWhosEatingScanIdentity,
  resolveDinerAffiliation,
  resolveWhosEatingFoodLabel,
} from "../../../lib/dinerDiscoverySummary.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import {
  dinerPeerProfilePath,
  liveFeedCreatorProfilePath,
} from "../../../lib/liveFeedCategory.js";
import DinerActivityScanRow from "./DinerActivityScanRow.jsx";
import { SectionHead } from "./myMenuplyBits.jsx";
import SectionEmptyState from "./SectionEmptyState.jsx";
import * as s from "./myMenuplyStyles.js";

const INITIAL_VISIBLE = 8;
const FETCH_LIMIT = 24;

function feedFoodLabel(item) {
  return (
    item?.item_name ||
    item?.menu_item_name ||
    item?.food_name ||
    item?.caption ||
    item?.title ||
    null
  );
}

function feedPersonLabel(item) {
  return (
    item?.diner?.display_name ||
    item?.display_name ||
    item?.creator?.display_name ||
    item?.poster_name ||
    ""
  );
}

function registeredDinerId(row) {
  const id =
    row?.consumer_user_id ??
    row?.diner?.id ??
    row?.diner?.consumer_user_id ??
    row?.creator?.id ??
    row?.creator_user_id ??
    row?.user_id;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pushCatchMeRow(out, seen, row, viewerUserId) {
  if (String(row?.kind || "") !== "catch_me") return false;
  const dinerId = registeredDinerId(row);
  if (!dinerId || seen.has(dinerId) || out.length >= FETCH_LIMIT) return true;
  const viewerN = Number(viewerUserId);
  if (Number.isFinite(viewerN) && viewerN > 0 && dinerId === viewerN) return true;

  const catchMeId = Number(row.id);
  const endDate = row.catch_me_end_date || null;
  if (isCatchMeNoticeHidden(catchMeId, endDate)) return true;

  const href =
    dinerPeerProfilePath(dinerId) ||
    liveFeedCreatorProfilePath(row) ||
    null;
  const displayName =
    row.display_name || feedPersonLabel(row) || row.name || "";
  const message = String(row.message || "").trim();
  if (!message || !href) return true;

  seen.add(dinerId);
  out.push({
    key: `catch-me-${catchMeId || dinerId}`,
    kind: "catch_me",
    catchMeId: Number.isFinite(catchMeId) && catchMeId > 0 ? catchMeId : dinerId,
    catchMeEndDate: endDate,
    dinerId,
    href,
    displayName,
    avatarUrl: row.avatar_url || null,
    message,
    inviteHref: row.invite_href || null,
    inviteCtaLabel: row.invite_cta_label || "Invite them out?",
  });
  return true;
}

function pushRow(out, seen, row, viewerUserId) {
  if (pushCatchMeRow(out, seen, row, viewerUserId)) return;

  const dinerId = registeredDinerId(row);
  if (!dinerId || seen.has(dinerId) || out.length >= FETCH_LIMIT) return;
  const viewerN = Number(viewerUserId);
  if (Number.isFinite(viewerN) && viewerN > 0 && dinerId === viewerN) return;

  const href =
    dinerPeerProfilePath(dinerId) ||
    liveFeedCreatorProfilePath(row) ||
    null;
  const displayName =
    row.display_name || feedPersonLabel(row) || row.name || "";
  const restaurantName =
    row.restaurant_name ||
    row.diner?.restaurant_name ||
    row.referenced_restaurant?.restaurant_name ||
    row.referenced_restaurant?.name ||
    null;
  const foodName = resolveWhosEatingFoodLabel({
    item_name: row.item_name || row.menu_item_name || null,
    menu_item_name: row.menu_item_name || null,
    food_name: row.food_name || row.food || feedFoodLabel(row),
    restaurant_name: restaurantName,
  });
  const ageYears = row.age_years ?? row.diner?.age_years ?? null;
  const dinerSex = row.diner_sex || row.diner?.diner_sex || null;
  const dinerSexShort = row.diner_sex_short || row.diner?.diner_sex_short || null;
  const schoolAffiliation =
    resolveDinerAffiliation(row) || resolveDinerAffiliation(row.diner || {});
  const occupation =
    String(
      row.diner_occupation ||
        row.occupation ||
        row.diner?.diner_occupation ||
        row.diner?.occupation ||
        ""
    ).trim() || null;
  const identitySource = {
    display_name: displayName,
    age_years: ageYears,
    diner_sex: dinerSex,
    diner_sex_short: dinerSexShort,
    school_affiliation: schoolAffiliation,
    diner_occupation: occupation,
  };
  if (!formatWhosEatingScanIdentity(identitySource) || !href) return;

  const homemade =
    row.homemade === true ||
    row.cooking === true ||
    row.diner?.homemade === true;
  const videoUrl = row.video_url || row.diner?.video_url || null;
  seen.add(dinerId);
  out.push({
    key: `who-${dinerId}`,
    dinerId,
    href,
    displayName,
    avatarUrl: row.avatar_url || row.diner?.avatar_url || null,
    ageYears,
    dinerSex,
    dinerSexShort,
    affiliation: schoolAffiliation,
    occupation,
    kind: row.kind || row.signal_kind || "ate",
    foodName,
    restaurantName,
    restaurantId:
      row.restaurant_id ||
      row.referenced_restaurant?.id ||
      row.diner?.restaurant_id ||
      null,
    restaurantSlug:
      row.restaurant_slug ||
      row.referenced_restaurant?.slug ||
      null,
    restaurantCity: row.restaurant_city || row.city || null,
    restaurantState: row.restaurant_state || row.state || null,
    restaurantLogoUrl:
      row.restaurant_logo_url ||
      row.referenced_restaurant?.logo_url ||
      null,
    restaurantBillboardUrl:
      row.restaurant_billboard_image_url ||
      row.referenced_restaurant?.billboard_image_url ||
      null,
    menuItemId: row.menu_item_id || null,
    mealPeriod: row.meal_period || null,
    foodInterestKey: row.food_interest_key || null,
    homemade,
    icon: row.icon || iconForFoodText(foodName),
    videoUrl: videoUrl ? String(videoUrl).trim() : null,
    discoveryLine: formatWhosEatingDiscoveryLine({
      display_name: displayName,
      diner_sex: dinerSex,
      diner_sex_short: dinerSexShort,
      age_years: ageYears,
      school_affiliation: schoolAffiliation,
      diner_occupation: occupation,
      item_name: row.item_name || row.menu_item_name || null,
      food_name: row.food_name || null,
      restaurant_name: restaurantName,
      meal_period: row.meal_period || null,
      homemade,
    }),
  });
}

function buildWhosEatingLines({ feedItems, connectLines, viewerUserId }) {
  const out = [];
  const seen = new Set();

  for (const row of connectLines || []) {
    pushRow(out, seen, row, viewerUserId);
  }
  for (const item of feedItems || []) {
    pushRow(out, seen, item, viewerUserId);
  }
  return out;
}

function CatchMeNoticeRow({ row, onHide }) {
  const avatarSrc = resolveConsumerMediaUrl(row.avatarUrl) || null;
  const inviteHref = row.inviteHref || null;
  const cta = String(row.inviteCtaLabel || "Invite them out?").trim();
  let presence = String(row.message || "").trim();
  if (cta && presence.endsWith(cta)) {
    presence = presence.slice(0, -cta.length).trim();
  }

  return (
    <div style={styles.catchMeRow} data-testid="whos-eating-catch-me-row">
      {avatarSrc ? (
        <img src={avatarSrc} alt="" style={styles.catchMeAvatar} />
      ) : (
        <span style={styles.catchMeAvatarFallback} aria-hidden>
          {(row.displayName || "?").trim().charAt(0).toUpperCase() || "?"}
        </span>
      )}
      <p style={styles.catchMeText}>
        {row.href ? (
          <Link to={row.href} style={styles.catchMeNameLink}>
            {presence || row.message}
          </Link>
        ) : (
          <span>{presence || row.message}</span>
        )}{" "}
        {inviteHref ? (
          <Link
            to={inviteHref}
            style={styles.catchMeInvite}
            data-testid="whos-eating-catch-me-invite"
          >
            {cta}
          </Link>
        ) : null}
      </p>
      <button
        type="button"
        style={styles.catchMeHide}
        data-testid="whos-eating-catch-me-hide"
        onClick={() => onHide?.(row)}
      >
        Hide
      </button>
    </div>
  );
}

export default function NearbyEatingSection({
  locationCity = null,
  locationState = null,
  viewerUserId = null,
  hidden = false,
  /** Own Edit View: load nearby diners. Connect/peer: Happy Hour only. */
  showNearbyDiscovery = true,
  /** Profile subject's Happy Hour diary rows for the selected day. */
  subjectHappyHourEntries = [],
  subjectDisplayName = "",
  /** Edit View → "You are going…"; Profile → "Name is going…". */
  subjectSecondPerson = false,
  subjectAvatarUrl = null,
  onHappyHourDelete = null,
  onHappyHourEdit = null,
  happyHourDeleteBusy = false,
}) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const happyHourRows = useMemo(() => {
    const out = [];
    for (const entry of subjectHappyHourEntries || []) {
      if (!entry) continue;
      const id = entry.entry_id ?? entry.id;
      out.push({
        key: `hh-${id ?? out.length}`,
        entry,
        displayName: subjectSecondPerson
          ? "You"
          : String(subjectDisplayName || "").trim() || "Diner",
        foodName: entry.food_name || null,
        restaurantName: entry.restaurant_name || null,
        restaurantId: entry.restaurant_id || null,
        restaurantSlug: entry.restaurant_slug || null,
        restaurantCity: entry.restaurant_city || null,
        restaurantState: entry.restaurant_state || null,
        restaurantLogoUrl: entry.restaurant_logo_url || null,
        restaurantBillboardUrl: entry.restaurant_billboard_image_url || null,
        videoUrl: entry.video_url || null,
      });
    }
    return out;
  }, [subjectHappyHourEntries, subjectDisplayName, subjectSecondPerson]);

  useEffect(() => {
    if (hidden || !showNearbyDiscovery) {
      setLines([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setExpanded(false);

    Promise.all([
      listSeeWhosEating({
        city: locationCity || undefined,
        state: locationState || undefined,
        limit: FETCH_LIMIT,
        kind: "ate",
      }).catch((err) => ({ __error: err })),
      fetchWantDiscovery({ limit: FETCH_LIMIT }).catch(() => null),
    ]).then(([feed, discovery]) => {
      if (cancelled) return;
      let feedItems = [];
      if (feed?.__error) {
        setError(feed.__error.message || "Unable to load who's eating");
      } else {
        feedItems = Array.isArray(feed?.items) ? feed.items : [];
      }
      const connects = Array.isArray(discovery?.connects_related)
        ? discovery.connects_related
        : [];
      const nearby = Array.isArray(discovery?.nearby) ? discovery.nearby : [];
      const connectLines = [...connects, ...nearby].filter(Boolean);
      setLines(
        buildWhosEatingLines({ feedItems, connectLines, viewerUserId })
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [hidden, showNearbyDiscovery, locationCity, locationState, viewerUserId]);

  function onHideCatchMe(row) {
    hideCatchMeNotice(row.catchMeId, row.catchMeEndDate);
    setLines((prev) => prev.filter((line) => line.key !== row.key));
  }

  const visibleLines = useMemo(() => {
    if (expanded) return lines;
    return lines.slice(0, INITIAL_VISIBLE);
  }, [expanded, lines]);

  const hasMore = lines.length > INITIAL_VISIBLE;
  const hasHappyHour = happyHourRows.length > 0;

  if (hidden) return null;
  if (!hasHappyHour && !showNearbyDiscovery) return null;

  return (
    <section style={s.section} data-testid="see-others-nearby-eating">
      <div style={s.presentationBlock}>
        <SectionHead
          kicker="Nearby"
          title="Who's Eating"
          subtitle={
            showNearbyDiscovery
              ? "See what nearby diners are eating — open profile to connect; planned activities stay private"
              : "Happy Hour and activity signals"
          }
        />

        {hasHappyHour ? (
          <ul
            style={styles.list}
            data-testid="whos-eating-happy-hour"
          >
            {happyHourRows.map((row) => (
              <li
                key={row.key}
                style={styles.row}
                data-testid="whos-eating-happy-hour-row"
              >
                <DinerActivityScanRow
                  displayName={row.displayName}
                  avatarUrl={subjectAvatarUrl}
                  kind="ate"
                  foodName={row.foodName}
                  restaurantName={row.restaurantName}
                  restaurantId={row.restaurantId}
                  restaurantSlug={row.restaurantSlug}
                  restaurantCity={row.restaurantCity}
                  restaurantState={row.restaurantState}
                  restaurantLogoUrl={row.restaurantLogoUrl}
                  restaurantBillboardUrl={row.restaurantBillboardUrl}
                  videoUrl={row.videoUrl}
                  nameInProse
                  secondPerson={subjectSecondPerson}
                  placeAsText
                  showThumb={false}
                  showIdentity={false}
                  onDelete={
                    typeof onHappyHourDelete === "function"
                      ? () => onHappyHourDelete(row.entry)
                      : null
                  }
                  onEdit={
                    typeof onHappyHourEdit === "function"
                      ? () => onHappyHourEdit(row.entry)
                      : null
                  }
                  deleteBusy={happyHourDeleteBusy}
                  deleteLabel="Delete Happy Hour"
                  editLabel="Edit"
                />
              </li>
            ))}
          </ul>
        ) : null}

        {error && showNearbyDiscovery ? <p style={s.error}>{error}</p> : null}

        {showNearbyDiscovery && loading ? (
          <p style={{ ...s.muted, fontSize: 13 }} data-testid="nearby-eating-loading">
            Loading who&apos;s eating…
          </p>
        ) : null}

        {showNearbyDiscovery && !loading && lines.length > 0 ? (
          <>
            <ul style={styles.list} data-testid="whos-eating-links">
              {visibleLines.map((row) => (
                <li key={row.key} style={styles.row} data-testid="whos-eating-row">
                  {row.kind === "catch_me" ? (
                    <CatchMeNoticeRow row={row} onHide={onHideCatchMe} />
                  ) : (
                    <DinerActivityScanRow
                      displayName={row.displayName}
                      avatarUrl={row.avatarUrl}
                      ageYears={row.ageYears}
                      affiliation={row.affiliation}
                      occupation={row.occupation}
                      includeSex
                      dinerSex={row.dinerSex}
                      dinerSexShort={row.dinerSexShort}
                      kind={row.kind}
                      foodName={row.foodName}
                      restaurantName={row.restaurantName}
                      restaurantId={row.restaurantId}
                      restaurantSlug={row.restaurantSlug}
                      restaurantCity={row.restaurantCity}
                      restaurantState={row.restaurantState}
                      restaurantLogoUrl={row.restaurantLogoUrl}
                      restaurantBillboardUrl={row.restaurantBillboardUrl}
                      menuItemId={row.menuItemId}
                      mealPeriod={row.mealPeriod}
                      icon={row.icon}
                      videoUrl={row.videoUrl}
                      profileHref={row.href}
                      homemade={row.homemade}
                      nameInProse
                      placeAsText
                      showThumb={false}
                    />
                  )}
                </li>
              ))}
            </ul>
            {hasMore && !expanded ? (
              <button
                type="button"
                style={styles.showMore}
                data-testid="whos-eating-show-more"
                onClick={() => setExpanded(true)}
              >
                Show more ({lines.length - INITIAL_VISIBLE} more)
              </button>
            ) : null}
            {hasMore && expanded ? (
              <button
                type="button"
                style={styles.showMore}
                data-testid="whos-eating-show-less"
                onClick={() => setExpanded(false)}
              >
                Show less
              </button>
            ) : null}
          </>
        ) : null}

        {showNearbyDiscovery && !loading && lines.length === 0 && !hasHappyHour ? (
          <SectionEmptyState testId="nearby-eating-empty">
            No registered diners nearby yet. When someone posts what they&apos;re eating, you&apos;ll
            see a short summary here — tap ▶ when a video is attached, or open their profile.
          </SectionEmptyState>
        ) : null}
      </div>
    </section>
  );
}

const styles = {
  list: {
    listStyle: "none",
    margin: "10px 0 0",
    padding: 0,
    display: "grid",
    gap: 0,
  },
  row: {
    fontSize: 15,
    lineHeight: 1.4,
    color: "#0f172a",
  },
  catchMeRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #e2e8f0",
  },
  catchMeAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    background: "#e2e8f0",
  },
  catchMeAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dcfce7",
    color: "#166534",
    fontSize: 14,
    fontWeight: 700,
  },
  catchMeText: {
    margin: 0,
    flex: 1,
    fontSize: 14,
    lineHeight: 1.4,
    color: "#0f172a",
  },
  catchMeNameLink: {
    color: "inherit",
    textDecoration: "none",
  },
  catchMeInvite: {
    color: "#166534",
    fontWeight: 700,
    textDecoration: "none",
  },
  catchMeHide: {
    appearance: "none",
    flexShrink: 0,
    margin: 0,
    padding: "2px 0 0",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  showMore: {
    appearance: "none",
    marginTop: 10,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#166534",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
};
