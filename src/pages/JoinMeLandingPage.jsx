/**
 * Join Me landing — spontaneous "I'm here now".
 * Lightweight Join / Maybe / Can't. Not planned Invite to Eat.
 */
import { useEffect, useMemo, useState } from "react";
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
  setEatInviteGuestDisplayName,
} from "../lib/eatInviteGuestIdentity.js";
import { restaurantPath } from "../lib/canonicalUrlCore.js";
import {
  buildAddressLocalityLine,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsUrlForRestaurant,
} from "../lib/catalogMenuUtils.js";
import { normalizeDisplayAddress } from "../lib/displayAddress.js";
import { buildJoinMeShareData, formatJoinMeLocationLabel } from "../lib/joinMeShare.js";

const RESPONSES = [
  { status: "accepted", label: "Join" },
  { status: "maybe", label: "Maybe" },
  { status: "declined", label: "Can't" },
];

export default function JoinMeLandingPage() {
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
    const guestKey = getOrCreateEatInviteGuestKey();
    setLoading(true);
    fetchPublicEatInvitation(token, { guestKey })
      .then((data) => {
        if (cancelled) return;
        const inv = data?.invitation || null;
        if (!inv) throw new Error(data?.error || "Join Me not found");
        setInvitation(inv);
        const mine = inv.my_response;
        const status = typeof mine === "object" && mine ? mine.status : mine;
        setResponded(status || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Join Me not found");
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

  const place = formatJoinMeLocationLabel({
    restaurant_name: invitation?.restaurant_name,
    address_line1: invitation?.restaurant_address_line1,
    city: invitation?.restaurant_city,
    state: invitation?.restaurant_state,
    location_label: invitation?.location_label,
  });
  const organizer = invitation?.organizer_display_name || "A diner";
  const expired = invitation?.join_me_expired === true || invitation?.join_me_active === false;
  const isOrganizer = invitation?.is_organizer === true;

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
    const dest = [invitation.restaurant_address_line1, cityLine].filter(Boolean).join(", ");
    return dest ? buildGoogleMapsDirectionsUrl(dest) : "";
  }, [invitation, cityLine]);

  const shareData = useMemo(
    () =>
      buildJoinMeShareData({
        token,
        url: invitation?.url,
        organizerName: organizer,
        restaurantName: invitation?.restaurant_name,
        addressLine1: invitation?.restaurant_address_line1,
        city: invitation?.restaurant_city,
        state: invitation?.restaurant_state,
        locationLabel: place,
      }),
    [token, invitation, organizer, place]
  );

  const party = invitation?.party;
  const counts = party?.counts || {};

  async function handleRespond(status) {
    if (expired || isOrganizer || busy) return;
    if (!isAuthenticated && !String(guestName || "").trim()) {
      setError("Enter your name so they know who is coming.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!isAuthenticated) setEatInviteGuestDisplayName(guestName);
      const data = await respondToEatInvitation(token, status, {
        guestKey: getOrCreateEatInviteGuestKey(),
        displayName: isAuthenticated ? undefined : guestName,
      });
      const inv = data?.invitation || invitation;
      setInvitation(inv);
      setResponded(status);
    } catch (err) {
      setError(err?.message || "Unable to respond");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="join-me-landing" style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>Join Me</div>
        <h1 style={styles.title}>
          Join {organizer} at {place}
        </h1>
        <p style={styles.lead}>I&apos;m here now. Come join me.</p>

        {loading ? <p style={styles.muted}>Loading…</p> : null}
        {error ? (
          <p style={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {invitation ? (
          <>
            <div style={styles.placeBox}>
              {restaurantHref ? (
                <Link to={restaurantHref} style={styles.placeLink}>
                  {invitation.restaurant_name || place}
                </Link>
              ) : (
                <strong>{invitation.restaurant_name || place}</strong>
              )}
              {invitation.restaurant_address_line1 ? (
                <div style={styles.addr}>{invitation.restaurant_address_line1}</div>
              ) : null}
              {cityLine ? <div style={styles.addr}>{cityLine}</div> : null}
              {directionsUrl ? (
                <a href={directionsUrl} target="_blank" rel="noreferrer" style={styles.maps}>
                  Directions
                </a>
              ) : null}
            </div>

            {expired ? (
              <p style={styles.ended}>This Join Me has ended — they may no longer be there.</p>
            ) : isOrganizer ? (
              <div>
                <p style={styles.muted}>Share this so people can come join you now.</p>
                <button type="button" style={styles.primary} onClick={() => setShareOpen(true)}>
                  Share Join Me
                </button>
              </div>
            ) : (
              <div style={styles.respond}>
                {!isAuthenticated ? (
                  <label style={styles.label}>
                    Your name
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      maxLength={80}
                      style={styles.input}
                      placeholder="So they know who is coming"
                    />
                  </label>
                ) : null}
                <div style={styles.btnRow}>
                  {RESPONSES.map((opt) => (
                    <button
                      key={opt.status}
                      type="button"
                      data-testid={`join-me-respond-${opt.status}`}
                      disabled={busy}
                      onClick={() => handleRespond(opt.status)}
                      style={
                        responded === opt.status ? styles.btnActive : styles.btn
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {responded ? (
                  <p style={styles.notice}>
                    {responded === "accepted"
                      ? "You're joining them."
                      : responded === "maybe"
                        ? "You might make it."
                        : "You let them know you can't."}
                  </p>
                ) : null}
              </div>
            )}

            {counts.going || counts.maybe || counts.cant ? (
              <p style={styles.counts}>
                {Number(counts.going || 0)} joining · {Number(counts.maybe || 0)} maybe ·{" "}
                {Number(counts.cant || 0)} can&apos;t
              </p>
            ) : null}

            <p style={styles.disclaimer}>
              Spontaneous — not a planned Invite to Eat. This is not a reservation.
            </p>
          </>
        ) : null}
      </div>

      {shareData?.url ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          modalTitle="Share Join Me"
          shareData={shareData}
          analyticsContext={{ pageType: "join_me" }}
        />
      ) : null}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f4",
    padding: "20px 14px 72px",
    boxSizing: "border-box",
  },
  card: {
    maxWidth: 520,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    padding: "20px 18px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    color: "#1c1917",
    display: "grid",
    gap: 12,
  },
  kicker: { fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "#78716c" },
  title: { margin: 0, fontSize: 24, lineHeight: 1.2, letterSpacing: "-0.03em" },
  lead: { margin: 0, fontSize: 16, color: "#44403c" },
  muted: { margin: 0, fontSize: 14, color: "#78716c" },
  error: { margin: 0, color: "#b91c1c", fontSize: 14 },
  notice: { margin: 0, fontSize: 14, fontWeight: 700, color: "#14532d" },
  ended: { margin: 0, fontSize: 14, fontWeight: 700, color: "#9a3412" },
  placeBox: { display: "grid", gap: 4, padding: "10px 0" },
  placeLink: { color: "#166534", fontWeight: 800, textDecoration: "none", fontSize: 18 },
  addr: { fontSize: 14, color: "#57534e" },
  maps: { color: "#0f766e", fontWeight: 700, fontSize: 13, marginTop: 4 },
  respond: { display: "grid", gap: 10 },
  label: { display: "grid", gap: 6, fontSize: 13, fontWeight: 700, color: "#44403c" },
  input: {
    border: "1px solid #d6d3d1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 15,
  },
  btnRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  btn: {
    flex: 1,
    minWidth: 88,
    border: "1.5px solid #d6d3d1",
    background: "#fff",
    borderRadius: 12,
    padding: "12px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },
  btnActive: {
    flex: 1,
    minWidth: 88,
    border: "1.5px solid #15803d",
    background: "#dcfce7",
    borderRadius: 12,
    padding: "12px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },
  primary: {
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  counts: { margin: 0, fontSize: 13, color: "#57534e" },
  disclaimer: { margin: 0, fontSize: 12, color: "#a8a29e" },
};
