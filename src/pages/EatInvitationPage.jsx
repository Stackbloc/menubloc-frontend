/**
 * Public Invite to Eat landing — shared outing / party roster.
 * View and RSVP without a Menuply account (display name only for guests).
 * No auto-friendship.
 */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import ShareModal from "../components/share/ShareModal.jsx";
import {
  fetchPublicEatInvitation,
  respondToEatInvitation,
} from "../lib/eatInvitationsApi.js";
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
import { restaurantPath } from "../lib/canonicalUrlCore.js";
import { clusterPath } from "../lib/clusterUrl.js";
import {
  buildAddressLocalityLine,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsUrlForRestaurant,
} from "../lib/catalogMenuUtils.js";
import { formatHoursRows } from "../components/restaurant/publicProfile/profilePrimitives.jsx";

function responseLabel(status) {
  if (status === "accepted") return "Going";
  if (status === "maybe") return "Maybe";
  if (status === "declined") return "Can't Make It";
  return status || "";
}

function buildStreetAddress(invitation) {
  return [invitation?.restaurant_address_line1, invitation?.restaurant_address_line2]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
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
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 4,
            }}
          >
            {(section.people || []).map((person, idx) => (
              <li
                key={`${section.key}-${person.party_person_id || person.user_id || idx}`}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#44403c",
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "#fafaf9",
                  border: "1px solid #e7e5e4",
                }}
              >
                {person.display_name || "Someone"}
              </li>
            ))}
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
  const [guestName, setGuestName] = useState(() => getEatInviteGuestDisplayName());
  const [shareOpen, setShareOpen] = useState(false);

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
        setResponded(inv.my_response || null);
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
    return `${restaurantHref}/menu`;
  }, [restaurantHref]);

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
  const cityLine = useMemo(
    () =>
      buildAddressLocalityLine(
        invitation?.restaurant_city,
        invitation?.restaurant_state,
        invitation?.restaurant_postal_code
      ),
    [invitation]
  );
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
  const hoursRows = useMemo(
    () =>
      formatHoursRows(invitation?.operating_hours || [], {
        timezone: invitation?.restaurant_timezone || invitation?.timezone || null,
      }),
    [invitation]
  );

  const party = invitation?.party || emptyParty();
  const isPrivate = invitation?.invite_kind === "private";
  const isGroup = !isPrivate;
  const partyTotal =
    (party.counts?.going || 0) + (party.counts?.maybe || 0) + (party.counts?.cant || 0);
  const hasOtherParticipants = isGroup && partyTotal > 1;

  const organizerName = invitation?.organizer_display_name || "A Menuply diner";
  const placeName = invitation?.restaurant_name || "a restaurant";
  const dateLabel = formatInviteDateLabel(invitation?.scheduled_date);
  const timeLabel = formatInviteTimeLabel(invitation?.scheduled_time);
  const phone = String(invitation?.restaurant_phone || "").trim();
  const logoUrl = String(invitation?.restaurant_logo_url || "").trim();

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
        dateLabel: formatInviteDateLabel(invitation?.scheduled_date),
        timeLabel: formatInviteTimeLabel(invitation?.scheduled_time),
        url,
      }),
      url,
    };
  }, [invitation, token]);

  async function handleRespond(status) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const opts = {};
      if (!isAuthenticated) {
        const name = String(guestName || "").trim();
        if (!name) {
          throw new Error("Enter your name so the host knows who is coming");
        }
        opts.guestKey = getOrCreateEatInviteGuestKey();
        opts.displayName = name;
        setEatInviteGuestDisplayName(name);
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

            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 16, color: "#292524" }}>
              {dateLabel}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#44403c" }}>{timeLabel}</div>

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
                  </div>
                ) : null}
                {!isAuthenticated ? (
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
                    View Menu
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
                        Hours
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
