/**
 * Public Invite to Eat landing — shared outing / party roster.
 * View and RSVP without a Menuply account (display name only for guests).
 * No auto-friendship.
 */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate, useParams } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import ShareModal from "../components/share/ShareModal.jsx";
import MenuplyAccountInviteCard from "../components/consumer/MenuplyAccountInviteCard.jsx";
import {
  fetchPublicEatInvitation,
  respondToEatInvitation,
  createEatInvitationCounterProposal,
  resolveEatInvitationProposal,
} from "../lib/eatInvitationsApi.js";
import { getBrowseMenus } from "../lib/api.js";
import {
  getEatInviteGuestDisplayName,
  getOrCreateEatInviteGuestKey,
  getOrganizerGuestKeyForToken,
  setEatInviteGuestDisplayName,
} from "../lib/eatInviteGuestIdentity.js";
import {
  buildEatInviteShareText,
  formatInviteDateLabel,
  formatInviteTimeLabel,
} from "../lib/eatInviteShareCopy.js";
import { invitePathFromShareUrl } from "../lib/menuplyAccountInvite.js";
import { restaurantPath } from "../lib/canonicalUrlCore.js";
import { clusterPath } from "../lib/clusterUrl.js";
import {
  buildAddressLocalityLine,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsUrlForRestaurant,
} from "../lib/catalogMenuUtils.js";
import { normalizeDisplayAddress } from "../lib/displayAddress.js";
import { formatHoursRows } from "../components/restaurant/publicProfile/profilePrimitives.jsx";
import { formatFoodTruckHoursTodayHeading } from "../lib/formatOperatingHours.js";

function responseLabel(status) {
  const s = typeof status === "object" && status ? status.status : status;
  if (s === "accepted") return "Going";
  if (s === "maybe") return "Maybe";
  if (s === "declined") return "Can't Make It";
  return s || "";
}

function normalizeMyResponse(raw) {
  if (!raw) return null;
  if (typeof raw === "string") return { status: raw, proposed_date: null, proposed_time: null };
  return {
    status: raw.status || null,
    proposed_date: raw.proposed_date || null,
    proposed_time: raw.proposed_time || null,
  };
}

function proposedWhenLabel(person) {
  const date = formatInviteDateLabel(person?.proposed_date);
  const time = formatInviteTimeLabel(person?.proposed_time);
  if (date && time) return `${date} · ${time}`;
  if (date) return date;
  if (time) return time;
  return "";
}

function proposalTermsLabel(p) {
  if (!p) return "";
  const place = p.proposed_restaurant_name || p.restaurant_name || "";
  const when = proposedWhenLabel({
    proposed_date: p.proposed_date || p.scheduled_date,
    proposed_time: p.proposed_time || p.scheduled_time,
  });
  return [place, when].filter(Boolean).join(" — ");
}

function ProposalHistory({ invitation }) {
  const opening = {
    id: "opening",
    status: "opening",
    proposer_display_name: invitation?.organizer_display_name || "Host",
    proposer_side: "organizer",
    proposed_restaurant_name: invitation?.restaurant_name,
    proposed_date: invitation?.scheduled_date,
    proposed_time: invitation?.scheduled_time,
  };
  const list = [opening, ...(invitation?.proposals || [])];
  if (list.length <= 1 && !(invitation?.proposals || []).length) return null;

  return (
    <div data-testid="invite-proposal-history" style={{ display: "grid", gap: 8, marginTop: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: "#1c1917" }}>Proposal history</div>
      <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13, color: "#44403c" }}>
        {list.map((p) => {
          const label =
            p.status === "opening"
              ? "Original invitation"
              : p.status === "pending"
                ? "Counter proposal (pending)"
                : `Counter · ${p.status}`;
          const terms = proposalTermsLabel(p);
          return (
            <li key={p.id} data-testid={`invite-proposal-row-${p.id}`}>
              <strong>{label}</strong>
              {p.proposer_display_name ? ` — ${p.proposer_display_name}` : ""}
              {terms ? <div style={{ color: "#78716c", fontWeight: 600 }}>{terms}</div> : null}
              {p.note ? <div style={{ color: "#57534e" }}>“{p.note}”</div> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function buildStreetAddress(invitation) {
  return normalizeDisplayAddress({
    address_line1: invitation?.restaurant_address_line1,
    address_line2: invitation?.restaurant_address_line2,
    city: invitation?.restaurant_city,
    state: invitation?.restaurant_state,
    postal_code: invitation?.restaurant_postal_code,
  }).streetAddr;
}

function emptyParty() {
  return {
    going: [],
    maybe: [],
    cant: [],
    counts: { going: 0, maybe: 0, cant: 0 },
  };
}

function PartyRoster({ party }) {
  const p = party || emptyParty();
  const sections = [
    { key: "going", title: "Going", people: p.going || [], count: p.counts?.going ?? 0 },
    { key: "maybe", title: "Maybe", people: p.maybe || [], count: p.counts?.maybe ?? 0 },
    { key: "cant", title: "Can't Make It", people: p.cant || [], count: p.counts?.cant ?? 0 },
  ].filter((section) => section.count > 0);

  if (sections.length === 0) return null;

  return (
    <div data-testid="invite-party-roster" style={{ display: "grid", gap: 14, marginTop: 18 }}>
      {sections.map((section) => (
        <div key={section.key} style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1c1917" }}>
            {section.title} ({section.count})
          </div>
          <ul
            style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, fontSize: 14, color: "#44403c" }}
          >
            {(section.people || []).map((person) => {
              const when = proposedWhenLabel(person);
              return (
                <li key={person.party_person_id || person.display_name}>
                  {person.display_name || "Someone"}
                  {when ? (
                    <span style={{ color: "#78716c", fontWeight: 600 }}> — {when}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function EatInvitationPage() {
  const { token } = useParams();
  const { isAuthenticated } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [responded, setResponded] = useState(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("19:00");
  const [guestName, setGuestName] = useState(() => getEatInviteGuestDisplayName());
  const [shareOpen, setShareOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterDate, setCounterDate] = useState("");
  const [counterTime, setCounterTime] = useState("19:00");
  const [counterNote, setCounterNote] = useState("");
  const [counterRestaurantId, setCounterRestaurantId] = useState(null);
  const [counterRestaurantName, setCounterRestaurantName] = useState("");
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantHits, setRestaurantHits] = useState([]);
  const [restaurantSearchBusy, setRestaurantSearchBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const guestKey = getOrganizerGuestKeyForToken(token);
    fetchPublicEatInvitation(token, { guestKey })
      .then((data) => {
        if (cancelled) return;
        const inv = data?.invitation || null;
        if (!inv) throw new Error(data?.error || "Invitation not found");
        setInvitation(inv);
        const mine = normalizeMyResponse(inv.my_response);
        setResponded(mine?.status || null);
        if (mine?.proposed_date) setProposedDate(mine.proposed_date);
        if (mine?.proposed_time) {
          const t = String(mine.proposed_time).slice(0, 5);
          setProposedTime(t || "19:00");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Invitation not found");
          setInvitation(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const restaurantHref = useMemo(() => {
    if (!invitation) return null;
    return (
      restaurantPath({
        slug: invitation.restaurant_slug,
        city: invitation.restaurant_city,
        state: invitation.restaurant_state,
      }) ||
      (invitation.restaurant_id
        ? `/restaurants/${encodeURIComponent(String(invitation.restaurant_id))}`
        : null)
    );
  }, [invitation]);

  const menuHref = useMemo(() => {
    if (!restaurantHref) return null;
    const attachedMenuId = invitation?.attached_menu_id;
    if (attachedMenuId) {
      return `${restaurantHref}/menu?menu=${encodeURIComponent(String(attachedMenuId))}`;
    }
    return `${restaurantHref}/menu`;
  }, [restaurantHref, invitation?.attached_menu_id]);

  const attachedMenuLabel = useMemo(() => {
    const name = String(invitation?.attached_menu_name || "").trim();
    if (name) return name;
    if (invitation?.attached_menu_type === "drinks") return "Drinks menu";
    if (invitation?.attached_menu_id) return "Attached menu";
    return "Menu";
  }, [invitation]);

  const dishHref = useMemo(() => {
    if (!invitation?.menu_item_id) return null;
    return `/menu-items/${encodeURIComponent(String(invitation.menu_item_id))}`;
  }, [invitation]);

  const clusterHref = useMemo(() => {
    if (!invitation?.cluster_slug) return null;
    if (String(invitation.cluster_slug).includes("holding")) return null;
    return clusterPath({
      state: invitation.cluster_state,
      city: invitation.cluster_city,
      slug: invitation.cluster_slug,
    });
  }, [invitation]);

  const streetAddr = useMemo(() => buildStreetAddress(invitation), [invitation]);
  const cityLine = useMemo(() => {
    const normalized = normalizeDisplayAddress({
      address_line1: invitation?.restaurant_address_line1,
      address_line2: invitation?.restaurant_address_line2,
      city: invitation?.restaurant_city,
      state: invitation?.restaurant_state,
      postal_code: invitation?.restaurant_postal_code,
    });
    return (
      normalized.cityLine ||
      buildAddressLocalityLine(
        invitation?.restaurant_city,
        invitation?.restaurant_state,
        invitation?.restaurant_postal_code
      )
    );
  }, [invitation]);
  const mapsDestination = useMemo(() => {
    return [streetAddr, cityLine].filter(Boolean).join(", ");
  }, [streetAddr, cityLine]);
  const directionsUrl = useMemo(() => {
    if (!invitation) return "";
    const byCoords = buildGoogleMapsUrlForRestaurant({
      lat: invitation.restaurant_lat,
      lng: invitation.restaurant_lng,
      addressLine1: invitation.restaurant_address_line1,
      addressLine2: invitation.restaurant_address_line2,
      city: invitation.restaurant_city,
      state: invitation.restaurant_state,
      zip: invitation.restaurant_postal_code,
    });
    if (byCoords) return byCoords;
    return mapsDestination ? buildGoogleMapsDirectionsUrl(mapsDestination) : "";
  }, [invitation, mapsDestination]);
  const hoursTimezone = invitation?.restaurant_timezone || invitation?.timezone || null;
  const hoursRows = useMemo(
    () =>
      formatHoursRows(invitation?.operating_hours || [], {
        timezone: hoursTimezone,
        includeTodayLine: false,
      }),
    [invitation, hoursTimezone]
  );
  const hoursHeading = `${formatFoodTruckHoursTodayHeading(hoursTimezone)}:`;

  const party = invitation?.party || emptyParty();
  const isPrivate = invitation?.invite_kind === "private";
  const isGroup = !isPrivate;
  const partyTotal =
    (party.counts?.going || 0) + (party.counts?.maybe || 0) + (party.counts?.cant || 0);
  const hasOtherParticipants = isGroup && partyTotal > 1;

  const organizerName = invitation?.organizer_display_name || "A Menuply diner";
  const terms = invitation?.current_terms || null;
  const placeName =
    terms?.restaurant_name || invitation?.restaurant_name || "a restaurant";
  const restaurantNegotiable = invitation?.restaurant_negotiable === true;
  const scheduleNegotiable =
    invitation?.schedule_negotiable === true ||
    invitation?.schedule_mode === "recipient_chooses";
  const negotiationOpen = restaurantNegotiable || scheduleNegotiable;
  const pendingProposal = invitation?.pending_proposal || null;
  const mySide = invitation?.is_organizer ? "organizer" : "invitee";
  const myTurnOnPending =
    Boolean(pendingProposal) && pendingProposal.proposer_side !== mySide;
  const canOpenCounter =
    negotiationOpen && !pendingProposal && !invitation?.is_organizer;
  const recipientChooses =
    invitation?.schedule_mode === "recipient_chooses" ||
    invitation?.recipient_chooses_schedule === true;
  const dateLabel = recipientChooses && !terms?.scheduled_date
    ? "You choose the date & time"
    : formatInviteDateLabel(terms?.scheduled_date || invitation?.scheduled_date);
  const timeLabel =
    recipientChooses && !terms?.scheduled_time
      ? ""
      : formatInviteTimeLabel(terms?.scheduled_time || invitation?.scheduled_time);
  const phone = String(invitation?.restaurant_phone || "").trim();
  const logoUrl = String(invitation?.restaurant_logo_url || "").trim();
  const namedInvitee = String(invitation?.invitee_display_name || "").trim();
  const skipGuestNameField =
    Boolean(isPrivate && namedInvitee && !invitation?.is_organizer && !isAuthenticated);

  const shareData = useMemo(() => {
    if (!invitation?.url && !token) return null;
    const url =
      invitation?.url ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/invite/${encodeURIComponent(String(token))}`
        : "");
    if (!url) return null;
    const place = invitation?.restaurant_name || "a restaurant";
    return {
      title: `Invite to Eat — ${place}`,
      text: buildEatInviteShareText({
        inviteKind: invitation?.invite_kind || "group",
        restaurantName: place,
        dateLabel: invitation?.schedule_mode === "recipient_chooses"
          ? ""
          : formatInviteDateLabel(invitation?.scheduled_date),
        timeLabel: invitation?.schedule_mode === "recipient_chooses"
          ? ""
          : formatInviteTimeLabel(invitation?.scheduled_time),
        scheduledTime:
          invitation?.schedule_mode === "recipient_chooses"
            ? null
            : invitation?.scheduled_time,
        message: invitation?.message || null,
        url,
      }),
      url,
    };
  }, [invitation, token]);

  async function guestOpts() {
    const opts = {};
    if (!isAuthenticated) {
      const fromOrganizer = isPrivate ? namedInvitee : "";
      const name = String(guestName || fromOrganizer || "").trim();
      if (!name) {
        throw new Error("Enter your name so the host knows who is coming");
      }
      opts.guestKey =
        getOrganizerGuestKeyForToken(token) || getOrCreateEatInviteGuestKey();
      opts.displayName = name;
      setEatInviteGuestDisplayName(name);
    }
    return opts;
  }

  async function handleRespond(status) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const opts = await guestOpts();
      if (
        recipientChooses &&
        (status === "accepted" || status === "maybe")
      ) {
        if (!proposedDate || !proposedTime) {
          throw new Error("Pick a date and time that works for you");
        }
        opts.proposedDate = proposedDate;
        opts.proposedTime = proposedTime;
      }
      const data = await respondToEatInvitation(token, status, opts);
      setResponded(data?.response?.status || status);
      const nextParty = data?.party || data?.invitation?.party;
      if (data?.invitation || nextParty) {
        setInvitation((prev) => ({
          ...prev,
          ...(data.invitation || {}),
          party: nextParty || data.invitation?.party || prev?.party,
        }));
      }
    } catch (err) {
      setError(err?.message || "Could not save your response");
    } finally {
      setBusy(false);
    }
  }

  async function searchCounterRestaurants(q) {
    const query = String(q || "").trim();
    setRestaurantQuery(query);
    if (query.length < 2) {
      setRestaurantHits([]);
      return;
    }
    setRestaurantSearchBusy(true);
    try {
      const data = await getBrowseMenus({
        q: query,
        city: invitation?.restaurant_city || undefined,
        state: invitation?.restaurant_state || undefined,
        limit: 24,
      });
      const menus = Array.isArray(data?.menus)
        ? data.menus
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : [];
      const byId = new Map();
      for (const row of menus) {
        const id = Number(row.restaurant_id || row.id);
        const name = row.restaurant_name || row.name || row.title;
        if (!id || !name || byId.has(id)) continue;
        byId.set(id, {
          id,
          name: String(name),
          city: row.city || row.restaurant_city || null,
          state: row.state || row.restaurant_state || null,
        });
      }
      setRestaurantHits([...byId.values()].slice(0, 8));
    } catch {
      setRestaurantHits([]);
    } finally {
      setRestaurantSearchBusy(false);
    }
  }

  function resetCounterForm() {
    setCounterDate(terms?.scheduled_date || invitation?.scheduled_date || "");
    setCounterTime(
      String(terms?.scheduled_time || invitation?.scheduled_time || "19:00").slice(0, 5) ||
        "19:00"
    );
    setCounterNote("");
    setCounterRestaurantId(null);
    setCounterRestaurantName("");
    setRestaurantQuery("");
    setRestaurantHits([]);
  }

  async function submitCounter({ asResolve = false } = {}) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const opts = await guestOpts();
      const payload = {
        ...opts,
        note: counterNote || undefined,
      };
      if (restaurantNegotiable && counterRestaurantId) {
        payload.restaurantId = counterRestaurantId;
      }
      if (scheduleNegotiable) {
        if (counterDate) payload.proposedDate = counterDate;
        if (counterTime) payload.proposedTime = counterTime;
      }
      if (
        !payload.restaurantId &&
        !payload.proposedDate &&
        !payload.proposedTime
      ) {
        throw new Error("Change restaurant, date, and/or time for a counter proposal");
      }

      let data;
      if (asResolve && pendingProposal?.id) {
        data = await resolveEatInvitationProposal(
          token,
          pendingProposal.id,
          "counter",
          payload
        );
      } else {
        data = await createEatInvitationCounterProposal(token, payload);
      }
      if (data?.invitation) {
        setInvitation((prev) => ({
          ...prev,
          ...data.invitation,
          party: data.invitation.party || prev?.party,
          is_organizer: prev?.is_organizer,
        }));
      }
      setCounterOpen(false);
      resetCounterForm();
    } catch (err) {
      setError(err?.message || "Could not submit counter proposal");
    } finally {
      setBusy(false);
    }
  }

  async function resolvePending(action) {
    if (busy || !pendingProposal?.id) return;
    if (action === "counter") {
      setCounterOpen(true);
      resetCounterForm();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const opts = await guestOpts();
      const data = await resolveEatInvitationProposal(
        token,
        pendingProposal.id,
        action,
        opts
      );
      if (data?.invitation) {
        setInvitation((prev) => ({
          ...prev,
          ...data.invitation,
          party: data.invitation.party || prev?.party,
          is_organizer: prev?.is_organizer,
        }));
      }
    } catch (err) {
      setError(err?.message || "Could not update the counter proposal");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && invitation?.invite_kind === "join_me") {
    return <Navigate to={`/join-me/${encodeURIComponent(String(token))}`} replace />;
  }

  if (shareOpen && shareData) {
    return createPortal(
      <ShareModal
        open
        onClose={() => setShareOpen(false)}
        modalTitle="Share invitation"
        shareData={shareData}
        analyticsContext={{
          pageType: "invite_to_eat",
          restaurantId: invitation?.restaurant_id,
          menuItemId: invitation?.menu_item_id,
          shareTarget: "eat_invitation",
        }}
      />,
      document.body
    );
  }

  return (
    <div
      data-testid="eat-invitation-page"
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        padding: "20px 14px 72px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: "20px 18px",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
          color: "#1c1917",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "#78716c" }}>
          INVITE TO EAT
        </div>

        {loading ? (
          <div style={{ marginTop: 16, fontSize: 14, color: "#78716c" }}>Loading invitation…</div>
        ) : null}

        {error && !invitation ? (
          <div role="alert" style={{ marginTop: 16, color: "#b91c1c", fontSize: 14 }}>
            {error}
          </div>
        ) : null}

        {invitation ? (
          <>
            <h1 style={{ margin: "10px 0 6px", fontSize: 26, lineHeight: 1.2, fontWeight: 800 }}>
              {invitation.is_organizer
                ? `Dinner at ${placeName}`
                : isPrivate
                  ? `${organizerName} invited you to eat`
                  : "You're Invited to Eat"}
            </h1>
            {!invitation.is_organizer ? (
              <div style={{ fontSize: 15, color: "#44403c", lineHeight: 1.45 }}>
                {isPrivate ? (
                  <>
                    at <strong>{placeName}</strong>
                  </>
                ) : hasOtherParticipants ? (
                  <>
                    Join <strong>{organizerName}</strong> and friends at{" "}
                    <strong>{placeName}</strong>
                  </>
                ) : (
                  <>
                    Organized by <strong>{organizerName}</strong>
                  </>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: "#57534e" }} data-testid="invite-organizer-status">
                {invitation.status_label || "Ready to Send"}
                {isPrivate
                  ? " — private invitation for one person."
                  : " — share one link for this outing."}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 12,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  data-testid="invite-restaurant-logo"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    objectFit: "cover",
                    border: "1px solid #e7e5e4",
                    flexShrink: 0,
                  }}
                />
              ) : null}
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{placeName}</div>
            </div>

            {String(invitation.restaurant_cuisine || "").trim() ? (
              <div
                data-testid="invite-restaurant-cuisine"
                style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: "#57534e" }}
              >
                {String(invitation.restaurant_cuisine).trim()}
              </div>
            ) : null}

            {String(invitation.restaurant_about_us || "").trim() ? (
              <p
                data-testid="invite-restaurant-about-us"
                style={{
                  margin: "12px 0 0",
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "#44403c",
                }}
              >
                {String(invitation.restaurant_about_us).trim()}
              </p>
            ) : null}

            {(streetAddr || cityLine) ? (
              <div data-testid="invite-restaurant-address" style={{ marginTop: 12 }}>
                {streetAddr ? (
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#292524" }}>{streetAddr}</div>
                ) : null}
                {cityLine ? (
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#44403c" }}>{cityLine}</div>
                ) : null}
                {directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="invite-open-in-maps"
                    style={{
                      display: "inline-flex",
                      marginTop: 10,
                      height: 40,
                      padding: "0 14px",
                      alignItems: "center",
                      borderRadius: 999,
                      border: "1px solid #d6d3d1",
                      background: "#fff",
                      color: "#166534",
                      fontWeight: 800,
                      fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    Open in Maps
                  </a>
                ) : null}
              </div>
            ) : null}

            <div
              style={{ fontSize: 17, fontWeight: 700, marginTop: 16, color: "#292524" }}
              data-testid="invite-schedule-summary"
            >
              {dateLabel}
            </div>
            {timeLabel ? (
              <div style={{ fontSize: 17, fontWeight: 700, color: "#44403c" }}>{timeLabel}</div>
            ) : null}
            {terms?.source === "accepted_proposal" ? (
              <div
                data-testid="invite-current-terms-badge"
                style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#166534" }}
              >
                Current terms from an accepted counter proposal (original invitation unchanged).
              </div>
            ) : null}

            <ProposalHistory invitation={invitation} />

            {pendingProposal ? (
              <div
                data-testid="invite-pending-proposal"
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #fde68a",
                  background: "#fffbeb",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14 }}>
                  Pending counter from {pendingProposal.proposer_display_name || "Someone"}
                </div>
                <div style={{ fontSize: 14, color: "#44403c" }}>
                  {proposalTermsLabel(pendingProposal) || "Updated terms proposed"}
                </div>
                {myTurnOnPending ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      type="button"
                      data-testid="invite-proposal-accept"
                      disabled={busy}
                      onClick={() => resolvePending("accept")}
                      style={btnPrimary}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      data-testid="invite-proposal-counter"
                      disabled={busy}
                      onClick={() => resolvePending("counter")}
                      style={btnSecondary}
                    >
                      Counter again
                    </button>
                    <button
                      type="button"
                      data-testid="invite-proposal-decline"
                      disabled={busy}
                      onClick={() => resolvePending("decline")}
                      style={btnSecondary}
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#78716c" }}>
                    Waiting for the other person to respond.
                  </div>
                )}
              </div>
            ) : null}

            {(canOpenCounter || (myTurnOnPending && counterOpen) || counterOpen) &&
            negotiationOpen ? (
              <div
                data-testid="invite-counter-section"
                style={{ marginTop: 16, display: "grid", gap: 10 }}
              >
                {!counterOpen && canOpenCounter ? (
                  <button
                    type="button"
                    data-testid="invite-open-counter"
                    onClick={() => {
                      resetCounterForm();
                      setCounterOpen(true);
                    }}
                    style={btnSecondary}
                  >
                    Propose a change
                  </button>
                ) : null}
                {counterOpen ? (
                  <div
                    data-testid="invite-counter-form"
                    style={{
                      display: "grid",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #d6d3d1",
                      background: "#fafaf9",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Counter proposal</div>
                    {restaurantNegotiable ? (
                      <div style={{ display: "grid", gap: 6 }}>
                        <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                          Suggest a restaurant
                          <input
                            type="search"
                            value={restaurantQuery}
                            onChange={(e) => searchCounterRestaurants(e.target.value)}
                            placeholder="Search Menuply restaurants"
                            data-testid="invite-counter-restaurant-search"
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              borderRadius: 10,
                              border: "1px solid #d6d3d1",
                              padding: "10px 12px",
                              fontSize: 14,
                            }}
                          />
                        </label>
                        {counterRestaurantName ? (
                          <div
                            data-testid="invite-counter-restaurant-selected"
                            style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}
                          >
                            Selected: {counterRestaurantName}
                          </div>
                        ) : null}
                        {restaurantSearchBusy ? (
                          <div style={{ fontSize: 12, color: "#78716c" }}>Searching…</div>
                        ) : null}
                        {restaurantHits.length > 0 ? (
                          <ul
                            data-testid="invite-counter-restaurant-hits"
                            style={{
                              margin: 0,
                              padding: 0,
                              listStyle: "none",
                              display: "grid",
                              gap: 4,
                            }}
                          >
                            {restaurantHits.map((hit) => (
                              <li key={hit.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCounterRestaurantId(hit.id);
                                    setCounterRestaurantName(
                                      [hit.name, hit.city, hit.state].filter(Boolean).join(" · ")
                                    );
                                    setRestaurantHits([]);
                                    setRestaurantQuery(hit.name);
                                  }}
                                  style={{
                                    width: "100%",
                                    textAlign: "left",
                                    border: "1px solid #e7e5e4",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    background: "#fff",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                  }}
                                >
                                  {hit.name}
                                  {hit.city ? (
                                    <span style={{ color: "#78716c", fontWeight: 500 }}>
                                      {" "}
                                      · {hit.city}
                                      {hit.state ? `, ${hit.state}` : ""}
                                    </span>
                                  ) : null}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : (
                      <div
                        data-testid="invite-restaurant-fixed"
                        style={{ fontSize: 12, color: "#78716c" }}
                      >
                        Restaurant is fixed for this invitation.
                      </div>
                    )}
                    {scheduleNegotiable ? (
                      <>
                        <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                          Date
                          <input
                            type="date"
                            value={counterDate}
                            onChange={(e) => setCounterDate(e.target.value)}
                            data-testid="invite-counter-date"
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              borderRadius: 10,
                              border: "1px solid #d6d3d1",
                              padding: "10px 12px",
                              fontSize: 14,
                            }}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                          Time
                          <input
                            type="time"
                            value={counterTime}
                            onChange={(e) => setCounterTime(e.target.value)}
                            data-testid="invite-counter-time"
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              borderRadius: 10,
                              border: "1px solid #d6d3d1",
                              padding: "10px 12px",
                              fontSize: 14,
                            }}
                          />
                        </label>
                      </>
                    ) : (
                      <div
                        data-testid="invite-schedule-fixed"
                        style={{ fontSize: 12, color: "#78716c" }}
                      >
                        Date &amp; time are fixed for this invitation.
                      </div>
                    )}
                    <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                      Note (optional)
                      <input
                        type="text"
                        maxLength={500}
                        value={counterNote}
                        onChange={(e) => setCounterNote(e.target.value)}
                        data-testid="invite-counter-note"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          borderRadius: 10,
                          border: "1px solid #d6d3d1",
                          padding: "10px 12px",
                          fontSize: 14,
                        }}
                      />
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <button
                        type="button"
                        data-testid="invite-counter-submit"
                        disabled={busy}
                        onClick={() =>
                          submitCounter({ asResolve: Boolean(pendingProposal && myTurnOnPending) })
                        }
                        style={btnPrimary}
                      >
                        Submit counter proposal
                      </button>
                      <button
                        type="button"
                        data-testid="invite-counter-cancel"
                        disabled={busy}
                        onClick={() => {
                          setCounterOpen(false);
                          resetCounterForm();
                        }}
                        style={btnSecondary}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {invitation.message ? (
              <blockquote
                style={{
                  margin: "16px 0 0",
                  padding: "12px 14px",
                  borderLeft: "3px solid #bbf7d0",
                  background: "#f0fdf4",
                  borderRadius: 8,
                  fontSize: 15,
                  lineHeight: 1.45,
                  color: "#292524",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{organizerName}:</div>
                “{invitation.message}”
              </blockquote>
            ) : null}

            {invitation.menu_item_name ? (
              <div style={{ marginTop: 16, fontSize: 14, color: "#44403c", lineHeight: 1.45 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>Recommended</div>
                <div style={{ fontSize: 16 }}>
                  {dishHref ? (
                    <Link to={dishHref} style={{ color: "#166534", fontWeight: 800 }}>
                      {invitation.menu_item_name}
                    </Link>
                  ) : (
                    <strong>{invitation.menu_item_name}</strong>
                  )}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#78716c" }}>
                  Informational only — no purchase required.
                </div>
              </div>
            ) : null}

            {clusterHref && invitation.cluster_name ? (
              <div style={{ marginTop: 12, fontSize: 13, color: "#57534e" }}>
                Near{" "}
                <Link to={clusterHref} style={{ color: "#166534", fontWeight: 700 }}>
                  {invitation.cluster_name}
                </Link>
              </div>
            ) : null}

            {isGroup ? <PartyRoster party={party} /> : null}

            {invitation.is_organizer ? (
              <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
                <div style={{ fontSize: 13, color: "#57534e", lineHeight: 1.45 }}>
                  {isPrivate
                    ? "Send this invitation to one person. Menuply records page opens and RSVPs — not whether Messages delivered the text."
                    : "Share this outing link with as many people as you like. Menuply records page opens and RSVPs — not whether Messages delivered the text."}
                </div>
                <button
                  type="button"
                  data-testid="invite-share-send"
                  onClick={() => setShareOpen(true)}
                  style={btnPrimary}
                >
                  Share Invitation
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                {responded ? (
                  <div
                    data-testid="invite-response-saved"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#ecfdf5",
                      color: "#166534",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Your response: {responseLabel(responded)}
                    {recipientChooses && proposedDate
                      ? ` · ${formatInviteDateLabel(proposedDate)}${
                          proposedTime ? ` · ${formatInviteTimeLabel(proposedTime)}` : ""
                        }`
                      : ""}
                  </div>
                ) : null}
                {!isAuthenticated && !responded ? (
                  <p
                    data-testid="invite-guest-no-account"
                    style={{ margin: 0, fontSize: 13, color: "#57534e", lineHeight: 1.45 }}
                  >
                    No Menuply account needed — enter your name and tap your response.
                  </p>
                ) : null}
                {!isAuthenticated && !skipGuestNameField ? (
                  <label
                    style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}
                    data-testid="invite-guest-name-field"
                  >
                    Your name
                    <input
                      type="text"
                      maxLength={80}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="So the host knows who is coming"
                      data-testid="invite-guest-name"
                      autoComplete="nickname"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        borderRadius: 10,
                        border: "1px solid #d6d3d1",
                        padding: "10px 12px",
                        fontSize: 14,
                      }}
                    />
                  </label>
                ) : null}
                {recipientChooses && !responded ? (
                  <div
                    data-testid="invite-propose-schedule"
                    style={{ display: "grid", gap: 10, marginBottom: 4 }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#44403c" }}>
                      Choose a date &amp; time that works for you
                    </div>
                    <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                      Date
                      <input
                        type="date"
                        required
                        value={proposedDate}
                        onChange={(e) => setProposedDate(e.target.value)}
                        data-testid="invite-proposed-date"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          borderRadius: 10,
                          border: "1px solid #d6d3d1",
                          padding: "10px 12px",
                          fontSize: 14,
                        }}
                      />
                    </label>
                    <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                      Time
                      <input
                        type="time"
                        required
                        value={proposedTime}
                        onChange={(e) => setProposedTime(e.target.value)}
                        data-testid="invite-proposed-time"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          borderRadius: 10,
                          border: "1px solid #d6d3d1",
                          padding: "10px 12px",
                          fontSize: 14,
                        }}
                      />
                    </label>
                  </div>
                ) : null}
                {!isAuthenticated && skipGuestNameField ? (
                  <div
                    data-testid="invite-named-invitee"
                    style={{ fontSize: 14, color: "#44403c", fontWeight: 600 }}
                  >
                    Responding as <strong>{namedInvitee}</strong>
                  </div>
                ) : null}
                {error ? (
                  <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                    {error}
                  </div>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    data-testid="invite-accept"
                    disabled={busy}
                    onClick={() => handleRespond("accepted")}
                    style={btnPrimary}
                  >
                    I&apos;m Going
                  </button>
                  <button
                    type="button"
                    data-testid="invite-maybe"
                    disabled={busy}
                    onClick={() => handleRespond("maybe")}
                    style={btnSecondary}
                  >
                    Maybe
                  </button>
                  <button
                    type="button"
                    data-testid="invite-decline"
                    disabled={busy}
                    onClick={() => handleRespond("declined")}
                    style={btnSecondary}
                  >
                    Can&apos;t Make It
                  </button>
                </div>
                {isGroup ? (
                  <button
                    type="button"
                    data-testid="invite-guest-share"
                    onClick={() => setShareOpen(true)}
                    style={{ ...btnSecondary, justifySelf: "start" }}
                  >
                    Share Invitation
                  </button>
                ) : null}
              </div>
            )}

            {!isAuthenticated && !invitation.is_organizer ? (
              <MenuplyAccountInviteCard
                nextPath={invitePathFromShareUrl(shareData?.url || `/invite/${token}`)}
                testId="invite-account-invite"
              />
            ) : null}

            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: "1px solid #e7e5e4",
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                {String(placeName).toUpperCase()} ON MENUPLY
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {menuHref ? (
                  <Link to={menuHref} style={linkBtn} data-testid="invite-view-menu">
                    {invitation?.attached_menu_id ? `View ${attachedMenuLabel}` : "View Menu"}
                  </Link>
                ) : null}
                {restaurantHref ? (
                  <Link to={restaurantHref} style={linkBtnSecondary}>
                    Restaurant profile
                  </Link>
                ) : null}
                {dishHref ? (
                  <Link to={dishHref} style={linkBtnSecondary}>
                    Recommended dish
                  </Link>
                ) : null}
              </div>

              {(phone || hoursRows.length > 0) ? (
                <div data-testid="invite-restaurant-info" style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#57534e" }}>
                    Restaurant information
                  </div>
                  {phone ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#78716c" }}>Phone</div>
                      <a
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        style={{ color: "#1c1917", fontWeight: 700, textDecoration: "none" }}
                      >
                        {phone}
                      </a>
                    </div>
                  ) : null}
                  {hoursRows.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#78716c", marginBottom: 4 }}>
                        {hoursHeading}
                      </div>
                      <div style={{ display: "grid", gap: 2 }}>
                        {hoursRows.map((row) => (
                          <div
                            key={row.day}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              fontSize: 13,
                              color: "#44403c",
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>{row.day}</span>
                            <span>{row.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const btnPrimary = {
  height: 42,
  padding: "0 16px",
  borderRadius: 999,
  border: "none",
  background: "#166534",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const btnSecondary = {
  height: 42,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid #d6d3d1",
  background: "#fff",
  color: "#1c1917",
  fontWeight: 700,
  cursor: "pointer",
};

const linkBtn = {
  ...btnPrimary,
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
};

const linkBtnSecondary = {
  ...btnSecondary,
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
};
